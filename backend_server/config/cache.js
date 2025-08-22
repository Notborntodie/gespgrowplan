const Redis = require('ioredis');

// Redis配置
const redisConfig = {
  host: '127.0.0.1',
  port: 6379,
  password: null, // 如果有密码，请设置
  db: 0,
  // 连接配置
  lazyConnect: true,
  enableReadyCheck: false,
  // 重试配置
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  // 高可用配置
  enableOfflineQueue: true, // 启用离线队列，允许在连接断开时缓存命令
  // 超时配置
  connectTimeout: 10000,
  commandTimeout: 5000
};

// 创建Redis客户端
const redis = new Redis(redisConfig);

// Redis事件监听
redis.on('connect', () => {
  console.log('Redis连接已建立');
});

redis.on('ready', () => {
  console.log('Redis客户端已准备就绪');
});

redis.on('error', (error) => {
  console.error('Redis连接错误:', error);
});

redis.on('close', () => {
  console.log('Redis连接已关闭');
});

redis.on('reconnecting', () => {
  console.log('Redis正在重连...');
});

// 缓存中间件
const cacheMiddleware = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    // 跳过非GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${keyPrefix}:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`缓存命中: ${key}`);
        return res.json(JSON.parse(cached));
      }
      
      // 重写res.json方法以缓存响应
      const originalJson = res.json;
      res.json = function(body) {
        // 缓存响应数据
        redis.setex(key, duration, JSON.stringify(body))
          .catch(err => console.error('缓存写入失败:', err));
        
        // 调用原始的json方法
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('缓存中间件错误:', error);
      next(); // 缓存出错时继续处理请求
    }
  };
};

// 缓存工具函数
const cacheUtils = {
  // 设置缓存
  async set(key, value, duration = 300) {
    try {
      await redis.setex(key, duration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  },
  
  // 获取缓存
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  },
  
  // 删除缓存
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  },
  
  // 批量删除缓存
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('批量删除缓存失败:', error);
      return 0;
    }
  },
  
  // 检查缓存是否存在
  async exists(key) {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error('检查缓存存在失败:', error);
      return false;
    }
  },
  
  // 设置缓存过期时间
  async expire(key, duration) {
    try {
      return await redis.expire(key, duration);
    } catch (error) {
      console.error('设置缓存过期时间失败:', error);
      return false;
    }
  }
};

// 健康检查
const healthCheck = async () => {
  try {
    await redis.ping();
    console.log('Redis健康检查通过');
    return true;
  } catch (error) {
    console.error('Redis健康检查失败:', error);
    return false;
  }
};

// 定期健康检查（每3分钟）
setInterval(healthCheck, 3 * 60 * 1000);

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭Redis连接...');
  await redis.quit();
});

module.exports = {
  redis,
  cacheMiddleware,
  cacheUtils,
  healthCheck
};

