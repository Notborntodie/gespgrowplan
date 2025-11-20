const { execFile } = require('child_process');
const { promisify } = require('util');
const { logger } = require('../config/logger');

const execFileAsync = promisify(execFile);

/**
 * Docker 容器池管理
 * 目标：复用容器，减少启动开销
 */
class ContainerPool {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 5;        // 最大容器数
    this.minSize = options.minSize || 2;        // 最小容器数
    this.idleTimeout = options.idleTimeout || 300000; // 5分钟空闲超时
    
    this.idleContainers = [];     // 空闲容器队列
    this.busyContainers = new Map(); // 使用中的容器 Map
    this.containerInfo = new Map();  // 容器信息（创建时间、使用次数等）
    
    this.isInitialized = false;
    this.initPromise = null;
    
    logger.info('容器池初始化', { maxSize: this.maxSize, minSize: this.minSize });
  }
  
  /**
   * 初始化容器池
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      try {
        logger.info('开始预热容器池...');
        
        // 预先创建最小数量的容器
        const createPromises = [];
        for (let i = 0; i < this.minSize; i++) {
          createPromises.push(this.createContainer());
        }
        
        await Promise.all(createPromises);
        
        this.isInitialized = true;
        logger.info(`容器池预热完成，当前空闲容器数：${this.idleContainers.length}`);
        
        // 启动定期清理任务
        this.startCleanupTask();
        
      } catch (error) {
        logger.error('容器池初始化失败', { error: error.message });
        throw error;
      }
    })();
    
    return this.initPromise;
  }
  
  /**
   * 创建新容器
   */
  async createContainer() {
    try {
      const containerName = `cpp-judge-pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建容器但不启动（使用 create 而不是 run）
      const createArgs = [
        'create',
        '--name', containerName,
        '--network', 'none',
        '--memory', '256m',
        '--cpus', '1',
        '--pids-limit', '20',
        'cpp-judge:lightweight',
        'sleep', '3600'  // 容器保持运行1小时
      ];
      
      await execFileAsync('docker', createArgs, { timeout: 5000 });
      
      // 启动容器
      await execFileAsync('docker', ['start', containerName], { timeout: 5000 });
      
      // 记录容器信息
      this.containerInfo.set(containerName, {
        createdAt: Date.now(),
        usageCount: 0,
        lastUsedAt: Date.now()
      });
      
      this.idleContainers.push(containerName);
      
      logger.info('容器创建成功', { containerName, idleCount: this.idleContainers.length });
      
      return containerName;
      
    } catch (error) {
      logger.error('创建容器失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取一个容器（从池中取出）
   */
  async acquire() {
    // 确保池已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    let containerName;
    
    // 如果有空闲容器，直接使用
    if (this.idleContainers.length > 0) {
      containerName = this.idleContainers.shift();
      logger.debug('从池中获取容器', { containerName, remainingIdle: this.idleContainers.length });
    } 
    // 如果没有空闲容器但未达到最大数量，创建新容器
    else if (this.getTotalSize() < this.maxSize) {
      logger.info('池中无空闲容器，创建新容器');
      containerName = await this.createContainer();
      this.idleContainers.shift(); // 从空闲队列移除（因为要使用）
    }
    // 达到最大数量，等待其他容器释放
    else {
      logger.warn('容器池已满，等待容器释放...');
      // 简单策略：等待100ms后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.acquire();
    }
    
    // 标记为使用中
    this.busyContainers.set(containerName, Date.now());
    
    // 更新使用信息
    const info = this.containerInfo.get(containerName);
    if (info) {
      info.usageCount++;
      info.lastUsedAt = Date.now();
    }
    
    return containerName;
  }
  
  /**
   * 释放容器（归还到池中）
   */
  async release(containerName) {
    if (!containerName) return;
    
    try {
      // 从忙碌列表移除
      this.busyContainers.delete(containerName);
      
      // 检查容器是否还在运行
      const isRunning = await this.isContainerRunning(containerName);
      
      if (isRunning) {
        // 清理容器内的文件（可选）
        // await this.cleanupContainer(containerName);
        
        // 归还到空闲队列
        this.idleContainers.push(containerName);
        logger.debug('容器已释放', { containerName, idleCount: this.idleContainers.length });
      } else {
        // 容器已停止，从池中移除
        logger.warn('容器已停止，从池中移除', { containerName });
        this.containerInfo.delete(containerName);
      }
      
    } catch (error) {
      logger.error('释放容器失败', { containerName, error: error.message });
    }
  }
  
  /**
   * 检查容器是否在运行
   */
  async isContainerRunning(containerName) {
    try {
      const { stdout } = await execFileAsync('docker', [
        'inspect',
        '-f', '{{.State.Running}}',
        containerName
      ], { timeout: 3000 });
      
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取池的总大小
   */
  getTotalSize() {
    return this.idleContainers.length + this.busyContainers.size;
  }
  
  /**
   * 获取池的状态
   */
  getStatus() {
    return {
      total: this.getTotalSize(),
      idle: this.idleContainers.length,
      busy: this.busyContainers.size,
      maxSize: this.maxSize,
      containers: Array.from(this.containerInfo.entries()).map(([name, info]) => ({
        name,
        ...info,
        status: this.busyContainers.has(name) ? 'busy' : 'idle'
      }))
    };
  }
  
  /**
   * 定期清理任务
   */
  startCleanupTask() {
    setInterval(async () => {
      try {
        const now = Date.now();
        
        // 清理长时间未使用的空闲容器
        const containersToRemove = [];
        
        for (const containerName of this.idleContainers) {
          const info = this.containerInfo.get(containerName);
          if (info && (now - info.lastUsedAt) > this.idleTimeout) {
            containersToRemove.push(containerName);
          }
        }
        
        // 移除超时的容器，但保持最小数量
        const targetRemoveCount = Math.max(
          0,
          containersToRemove.length - (this.idleContainers.length - this.minSize)
        );
        
        for (let i = 0; i < targetRemoveCount && containersToRemove.length > 0; i++) {
          const containerName = containersToRemove.pop();
          await this.removeContainer(containerName);
        }
        
        // 日志
        if (targetRemoveCount > 0) {
          logger.info('清理空闲容器', { 
            removed: targetRemoveCount, 
            currentIdle: this.idleContainers.length 
          });
        }
        
      } catch (error) {
        logger.error('清理任务失败', { error: error.message });
      }
    }, 60000); // 每分钟执行一次
  }
  
  /**
   * 移除容器
   */
  async removeContainer(containerName) {
    try {
      // 从空闲队列移除
      const index = this.idleContainers.indexOf(containerName);
      if (index > -1) {
        this.idleContainers.splice(index, 1);
      }
      
      // 停止并删除容器
      await execFileAsync('docker', ['stop', containerName], { timeout: 5000 }).catch(() => {});
      await execFileAsync('docker', ['rm', containerName], { timeout: 5000 }).catch(() => {});
      
      // 移除信息
      this.containerInfo.delete(containerName);
      
      logger.info('容器已移除', { containerName });
      
    } catch (error) {
      logger.error('移除容器失败', { containerName, error: error.message });
    }
  }
  
  /**
   * 销毁整个容器池
   */
  async destroy() {
    try {
      logger.info('开始销毁容器池...');
      
      // 获取所有容器
      const allContainers = [
        ...this.idleContainers,
        ...Array.from(this.busyContainers.keys())
      ];
      
      // 批量移除
      const removePromises = allContainers.map(name => this.removeContainer(name));
      await Promise.all(removePromises);
      
      // 清空所有数据
      this.idleContainers = [];
      this.busyContainers.clear();
      this.containerInfo.clear();
      this.isInitialized = false;
      
      logger.info('容器池已销毁');
      
    } catch (error) {
      logger.error('销毁容器池失败', { error: error.message });
    }
  }
}

// 创建全局容器池实例
const containerPool = new ContainerPool({
  maxSize: 5,    // 最多5个容器
  minSize: 2,    // 最少保持2个
  idleTimeout: 300000  // 5分钟未使用则清理
});

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在销毁容器池...');
  await containerPool.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在销毁容器池...');
  await containerPool.destroy();
  process.exit(0);
});

module.exports = { containerPool, ContainerPool };

