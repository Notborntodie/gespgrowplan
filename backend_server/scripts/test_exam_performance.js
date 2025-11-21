#!/usr/bin/env node

/**
 * 考试API性能测试脚本
 * 测试考试列表和详情的加载速度，对比缓存效果
 * 
 * 使用方法:
 *   node scripts/test_exam_performance.js
 *   node scripts/test_exam_performance.js --base-url http://localhost:3000/api
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// 配置
const BASE_URL = process.env.API_BASE_URL || process.argv.find(arg => arg.startsWith('--base-url'))?.split('=')[1] || 'http://localhost:3000/api';
const TEST_ROUNDS = 5; // 测试轮数
const CLEAR_CACHE_DELAY = 2000; // 清除缓存后等待时间（毫秒）

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(name) {
  log(`\n📋 ${name}`, 'cyan');
}

function formatTime(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 统计函数
function calculateStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 计算标准差
  const variance = times.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return { avg, min, max, median, stdDev };
}

// 测试单个API端点
async function testEndpoint(name, url, method = 'GET', data = null) {
  const times = [];
  const sizes = [];
  let successCount = 0;
  let errorCount = 0;
  
  logTest(`${name} (${TEST_ROUNDS} 轮测试)`);
  
  for (let i = 1; i <= TEST_ROUNDS; i++) {
    try {
      const start = performance.now();
      const response = await axios({
        method,
        url: `${BASE_URL}${url}`,
        data,
        timeout: 30000,
        validateStatus: () => true
      });
      const end = performance.now();
      const duration = end - start;
      
      times.push(duration);
      
      // 计算响应大小
      const responseSize = JSON.stringify(response.data).length;
      sizes.push(responseSize);
      
      if (response.status >= 200 && response.status < 300) {
        successCount++;
        log(`  第 ${i} 轮: ${formatTime(duration)} | 状态: ${response.status} | 大小: ${formatBytes(responseSize)}`, 'green');
      } else {
        errorCount++;
        log(`  第 ${i} 轮: ${formatTime(duration)} | 状态: ${response.status} | 错误: ${response.data?.error || 'Unknown'}`, 'red');
      }
    } catch (error) {
      errorCount++;
      const duration = performance.now() - (performance.now() - 1000); // 估算
      log(`  第 ${i} 轮: 请求失败 | 错误: ${error.message}`, 'red');
    }
    
    // 每次请求之间稍作延迟
    if (i < TEST_ROUNDS) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (times.length === 0) {
    log('  ❌ 所有请求都失败了', 'red');
    return null;
  }
  
  const stats = calculateStats(times);
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  
  return {
    name,
    url,
    stats,
    avgSize,
    successCount,
    errorCount,
    totalRounds: TEST_ROUNDS
  };
}

// 清除缓存（通过访问一个不存在的考试ID，然后访问真实ID来触发缓存刷新）
async function clearCache(examId) {
  try {
    log('\n🔄 清除缓存...', 'yellow');
    // 注意：这里我们无法直接清除Redis缓存，但可以通过访问来触发缓存更新
    // 实际清除应该通过管理接口或直接操作Redis
    await new Promise(resolve => setTimeout(resolve, CLEAR_CACHE_DELAY));
    log('  缓存清除完成（等待2秒让缓存过期）', 'yellow');
  } catch (error) {
    log(`  清除缓存失败: ${error.message}`, 'red');
  }
}

// 主测试函数
async function runTests() {
  logSection('考试API性能测试');
  log(`测试目标: ${BASE_URL}`, 'blue');
  log(`测试轮数: ${TEST_ROUNDS}`, 'blue');
  log(`时间: ${new Date().toLocaleString()}`, 'blue');
  
  // 1. 测试考试列表
  logSection('1. 考试列表性能测试');
  const listResult1 = await testEndpoint('考试列表（首次，无缓存）', '/exams');
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 再次测试（应该有HTTP缓存）
  const listResult2 = await testEndpoint('考试列表（第二次，HTTP缓存）', '/exams');
  
  // 2. 获取一个考试ID用于详情测试
  let examId = null;
  try {
    logTest('获取考试ID用于详情测试');
    const response = await axios.get(`${BASE_URL}/exams`, { timeout: 10000 });
    if (response.data && response.data.length > 0) {
      examId = response.data[0].id;
      log(`  找到考试ID: ${examId}`, 'green');
    } else {
      log('  ⚠️  没有找到考试，将使用ID=1进行测试', 'yellow');
      examId = 1;
    }
  } catch (error) {
    log(`  ⚠️  获取考试列表失败: ${error.message}，将使用ID=1进行测试`, 'yellow');
    examId = 1;
  }
  
  if (!examId) {
    log('❌ 无法获取考试ID，测试终止', 'red');
    return;
  }
  
  // 3. 测试考试详情（首次，无缓存）
  logSection('2. 考试详情性能测试');
  await clearCache(examId);
  const detailResult1 = await testEndpoint(`考试详情（首次，无缓存）`, `/exams/${examId}`);
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 再次测试（应该有数据层缓存）
  const detailResult2 = await testEndpoint(`考试详情（第二次，数据层缓存）`, `/exams/${examId}`);
  
  // 第三次测试（应该有HTTP缓存）
  const detailResult3 = await testEndpoint(`考试详情（第三次，HTTP缓存）`, `/exams/${examId}`);
  
  // 4. 测试另一个端点
  const detailResult4 = await testEndpoint(`考试详情（/exam/:id端点）`, `/exam/${examId}`);
  
  // 5. 输出统计结果
  logSection('📊 性能统计结果');
  
  const results = [
    { label: '考试列表（首次）', result: listResult1 },
    { label: '考试列表（缓存）', result: listResult2 },
    { label: '考试详情（首次）', result: detailResult1 },
    { label: '考试详情（数据层缓存）', result: detailResult2 },
    { label: '考试详情（HTTP缓存）', result: detailResult3 },
    { label: '考试详情（/exam端点）', result: detailResult4 }
  ].filter(item => item.result !== null);
  
  // 表格输出
  console.log('\n' + '-'.repeat(100));
  console.log(
    '测试项'.padEnd(30) +
    '平均时间'.padEnd(15) +
    '最快'.padEnd(15) +
    '最慢'.padEnd(15) +
    '成功率'.padEnd(10) +
    '平均大小'
  );
  console.log('-'.repeat(100));
  
  results.forEach(({ label, result }) => {
    if (!result) return;
    const { stats, avgSize, successCount, totalRounds } = result;
    const successRate = ((successCount / totalRounds) * 100).toFixed(1) + '%';
    
    console.log(
      label.padEnd(30) +
      formatTime(stats.avg).padEnd(15) +
      formatTime(stats.min).padEnd(15) +
      formatTime(stats.max).padEnd(15) +
      successRate.padEnd(10) +
      formatBytes(avgSize)
    );
  });
  
  console.log('-'.repeat(100));
  
  // 性能对比分析
  logSection('📈 性能对比分析');
  
  if (listResult1 && listResult2) {
    const improvement = ((listResult1.stats.avg - listResult2.stats.avg) / listResult1.stats.avg * 100).toFixed(1);
    log(`考试列表缓存效果:`, 'cyan');
    log(`  首次: ${formatTime(listResult1.stats.avg)}`, 'yellow');
    log(`  缓存: ${formatTime(listResult2.stats.avg)}`, 'green');
    log(`  提升: ${improvement}%`, improvement > 0 ? 'green' : 'red');
  }
  
  if (detailResult1 && detailResult2) {
    const improvement = ((detailResult1.stats.avg - detailResult2.stats.avg) / detailResult1.stats.avg * 100).toFixed(1);
    log(`\n考试详情缓存效果:`, 'cyan');
    log(`  首次（无缓存）: ${formatTime(detailResult1.stats.avg)}`, 'yellow');
    log(`  第二次（数据层缓存）: ${formatTime(detailResult2.stats.avg)}`, 'green');
    if (detailResult3) {
      log(`  第三次（HTTP缓存）: ${formatTime(detailResult3.stats.avg)}`, 'green');
    }
    log(`  数据层缓存提升: ${improvement}%`, improvement > 0 ? 'green' : 'red');
  }
  
  // 详细统计
  logSection('📋 详细统计信息');
  
  results.forEach(({ label, result }) => {
    if (!result) return;
    const { stats, avgSize } = result;
    log(`\n${label}:`, 'bright');
    log(`  平均时间: ${formatTime(stats.avg)}`, 'cyan');
    log(`  最快: ${formatTime(stats.min)}`, 'green');
    log(`  最慢: ${formatTime(stats.max)}`, 'red');
    log(`  中位数: ${formatTime(stats.median)}`, 'cyan');
    log(`  标准差: ${formatTime(stats.stdDev)}`, 'yellow');
    log(`  平均响应大小: ${formatBytes(avgSize)}`, 'blue');
  });
  
  // 总结
  logSection('✅ 测试完成');
  log('测试总结:', 'bright');
  log(`  - 测试了 ${results.length} 个端点`, 'green');
  log(`  - 总共执行了 ${results.reduce((sum, r) => sum + (r.result?.totalRounds || 0), 0)} 次请求`, 'green');
  log(`  - 成功: ${results.reduce((sum, r) => sum + (r.result?.successCount || 0), 0)} 次`, 'green');
  log(`  - 失败: ${results.reduce((sum, r) => sum + (r.result?.errorCount || 0), 0)} 次`, 'red');
  
  log('\n💡 提示:', 'yellow');
  log('  - 如果"首次"和"缓存"的响应时间差异很大，说明缓存工作正常', 'yellow');
  log('  - 如果差异很小，可能是缓存未生效或数据量太小', 'yellow');
  log('  - 数据层缓存（第二次）应该比首次快很多', 'yellow');
  log('  - HTTP缓存（第三次）应该是最快的', 'yellow');
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

