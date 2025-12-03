const Queue = require('bull');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { logger } = require('../config/logger');
const { pool } = require('../config/database');
const { cacheUtils } = require('../config/cache');
// const { containerPool } = require('./containerPool');  // Docker方案
const { judgeCode } = require('./isolateJudge');  // isolate 轻量级方案

const execFileAsync = promisify(execFile);

// 确保环境变量已加载
if (!process.env.DOTENV_LOADED) {
  try {
    require('dotenv').config();
    process.env.DOTENV_LOADED = 'true';
  } catch (e) {
    // dotenv可能已经加载过了，忽略错误
  }
}

// 创建判题队列（从环境变量读取Redis配置）
const judgeQueue = new Queue('oj-judge-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '' ? process.env.REDIS_PASSWORD.trim() : undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000
  },
  defaultJobOptions: {
    attempts: 2,           // 失败后重试2次
    backoff: {
      type: 'exponential',
      delay: 2000          // 指数退避，初始延迟2秒
    },
    removeOnComplete: 100, // 保留最近100个完成的任务
    removeOnFail: 200      // 保留最近200个失败的任务
  }
});

// 队列事件监听
judgeQueue.on('error', (error) => {
  logger.error('判题队列错误', { error: error.message });
});

judgeQueue.on('waiting', (jobId) => {
  logger.debug('任务等待中', { jobId });
});

judgeQueue.on('active', (job) => {
  logger.info('开始处理判题任务', { jobId: job.id, submissionId: job.data.submissionId });
});

judgeQueue.on('completed', (job, result) => {
  logger.info('判题任务完成', { 
    jobId: job.id, 
    submissionId: job.data.submissionId,
    verdict: result.verdict,
    duration: result.duration
  });
});

judgeQueue.on('failed', (job, error) => {
  logger.error('判题任务失败', { 
    jobId: job.id, 
    submissionId: job.data.submissionId,
    error: error.message 
  });
});

// =====================================================
// 以下是旧的 Docker 方案代码（已弃用，保留供参考）
// 新方案使用 isolate 轻量级沙箱，速度更快
// =====================================================

/**
 * 处理判题任务（使用 isolate 轻量级沙箱）
 * 优化：减少数据库操作，提升并发性能
 */
judgeQueue.process(3, async (job) => {  // 降低并发数到3，避免编译竞争
  const { submissionId, problemId, code, language } = job.data;
  const startTime = Date.now();
  
  try {
    // 【优化1】移除 'judging' 状态更新，直接从 'queued' 跳到 'completed'
    // 减少一次数据库 UPDATE 操作
    
    // 获取题目信息和测试样例（使用缓存）
    const problem = await cacheUtils.oj.getProblem(problemId, pool);
    if (!problem) {
      throw new Error('题目不存在');
    }
    
    const samples = await cacheUtils.oj.getSamples(problemId, pool);
    if (samples.length === 0) {
      throw new Error('该题目没有测试样例');
    }
    
    logger.info('开始判题（使用 isolate）', {
      submissionId,
      problemId,
      title: problem.title,
      totalSamples: samples.length,
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit
    });
    
    // 使用 isolate 判题（一次性完成编译和运行所有测试）
    const judgeResult = await judgeCode(code, samples, {
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit
    });
    
    const { results, verdict, totalTests, passedTests: passedCount } = judgeResult;
    const duration = Date.now() - startTime;
    
    logger.info('判题完成（isolate）', {
      submissionId,
      verdict,
      passedCount,
      totalTests,
      duration: `${duration}ms`
    });
    
    // 【优化2】保存判题结果 - 只更新一次数据库
    await pool.query(
      `UPDATE oj_submissions 
       SET status = 'completed',
           verdict = ?,
           total_tests = ?,
           passed_tests = ?,
           results = ?,
           judge_start_time = NOW(),
           judge_end_time = NOW(),
           judge_duration = ?
       WHERE id = ?`,
      [verdict, totalTests, passedCount, JSON.stringify(results), duration, submissionId]
    );
    
    // 【优化3】异步更新题目统计信息（不阻塞返回）
    // 使用 setImmediate 让这个操作在事件循环的下一轮执行
    const accepted = verdict === 'Accepted' ? 1 : 0;
    setImmediate(() => {
      pool.query(
        `UPDATE oj_problems 
         SET total_submissions = total_submissions + 1,
             accepted_submissions = accepted_submissions + ?
         WHERE id = ?`,
        [accepted, problemId]
      ).catch(err => {
        logger.error('更新题目统计失败', { problemId, error: err.message });
      });
    });
    
    return {
      submissionId,
      verdict,
      totalTests,
      passedTests: passedCount,
      results,
      duration
    };
    
  } catch (error) {
    // 判题失败
    const errorMessage = error.message || '判题失败';
    
    await pool.query(
      `UPDATE oj_submissions 
       SET status = 'error',
           error_message = ?,
           judge_start_time = NOW(),
           judge_end_time = NOW(),
           judge_duration = ?
       WHERE id = ?`,
      [errorMessage, Date.now() - startTime, submissionId]
    );
    
    logger.error('判题失败', {
      submissionId,
      error: errorMessage
    });
    
    throw error;
  }
});

/**
 * 添加判题任务到队列
 */
async function addJudgeTask(submissionData) {
  const job = await judgeQueue.add(submissionData, {
    priority: 10,  // 优先级（数字越小优先级越高）
    timeout: 60000 // 单个任务超时时间60秒
  });
  
  logger.info('判题任务已添加到队列', {
    jobId: job.id,
    submissionId: submissionData.submissionId
  });
  
  return job;
}

/**
 * 获取队列状态
 */
async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    judgeQueue.getWaitingCount(),
    judgeQueue.getActiveCount(),
    judgeQueue.getCompletedCount(),
    judgeQueue.getFailedCount()
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active
  };
}

module.exports = {
  judgeQueue,
  addJudgeTask,
  getQueueStatus
};

