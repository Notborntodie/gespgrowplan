const rateLimit = require('express-rate-limit');
const { redis } = require('../config/cache');

// 创建Redis存储的限流器
const createRedisRateLimiter = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: { 
      error: message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // 使用Redis存储
    store: {
      incr: async (key) => {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, Math.floor(windowMs / 1000));
        }
        return {
          totalHits: current,
          resetTime: new Date(Date.now() + windowMs)
        };
      },
      decrement: async (key) => {
        return await redis.decr(key);
      },
      resetKey: async (key) => {
        return await redis.del(key);
      }
    },
    // 自定义键生成器
    keyGenerator: keyGenerator || ((req) => {
      // 基于IP地址和用户ID生成键
      const userId = req.user ? req.user.id : 'anonymous';
      return `${req.ip}:${userId}:${req.originalUrl}`;
    }),
    // 跳过某些请求
    skip: (req) => {
      // 跳过健康检查请求
      return req.path === '/health' || req.path === '/api/health';
    },
    // 自定义处理器
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// 不同接口的限流策略
const rateLimiters = {
  // 认证接口限流（15分钟内最多5次）
  auth: createRedisRateLimiter(
    15 * 60 * 1000, // 15分钟
    5,              // 最多5次
    '登录尝试过于频繁，请15分钟后再试'
  ),
  
  // 注册接口限流（1小时内最多3次）
  register: createRedisRateLimiter(
    60 * 60 * 1000, // 1小时
    3,              // 最多3次
    '注册请求过于频繁，请1小时后再试'
  ),
  
  // 文件上传限流（1分钟内最多10次）
  upload: createRedisRateLimiter(
    60 * 1000,      // 1分钟
    10,             // 最多10次
    '上传请求过于频繁，请稍后再试'
  ),
  
  // 题目上传限流（1分钟内最多10次）
  questionUpload: createRedisRateLimiter(
    60 * 1000,      // 1分钟
    10,              // 最多10次
    '题目上传过于频繁，请稍后再试'
  ),
  
  // 批量上传限流（1分钟内最多3次）
  batchUpload: createRedisRateLimiter(
    1 * 60 * 1000,  // 1分钟
    3,              // 最多3次
    '批量上传过于频繁，请1分钟后再试'
  ),
  
  // 一般API限流（1分钟内最多100次）
  api: createRedisRateLimiter(
    60 * 1000,      // 1分钟
    100,            // 最多100次
    '请求过于频繁，请稍后再试'
  ),
  
  // 考试相关接口限流（1分钟内最多30次）
  exam: createRedisRateLimiter(
    60 * 1000,      // 1分钟
    30,             // 最多30次
    '考试相关请求过于频繁，请稍后再试'
  ),
  
  // 查询接口限流（1分钟内最多200次）
  query: createRedisRateLimiter(
    60 * 1000,      // 1分钟
    200,            // 最多200次
    '查询请求过于频繁，请稍后再试'
  )
};

// 动态限流中间件（根据用户角色调整限制）
const dynamicRateLimit = (defaultLimiter, roleLimits = {}) => {
  return (req, res, next) => {
    const userRole = req.user ? req.user.role : 'anonymous';
    const roleLimit = roleLimits[userRole];
    
    if (roleLimit) {
      // 使用角色特定的限流器
      const roleLimiter = createRedisRateLimiter(
        roleLimit.windowMs,
        roleLimit.max,
        roleLimit.message
      );
      return roleLimiter(req, res, next);
    }
    
    // 使用默认限流器
    return defaultLimiter(req, res, next);
  };
};

// 白名单中间件
const whitelistMiddleware = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.includes(req.ip)) {
      return next();
    }
    // 继续执行限流检查
    next();
  };
};

// 限流统计中间件
const rateLimitStats = async (req, res, next) => {
  const key = `rate_limit_stats:${req.ip}`;
  
  try {
    const stats = await redis.get(key);
    if (stats) {
      const parsedStats = JSON.parse(stats);
      console.log(`IP ${req.ip} 的限流统计:`, parsedStats);
    }
  } catch (error) {
    console.error('获取限流统计失败:', error);
  }
  
  next();
};

module.exports = {
  rateLimiters,
  createRedisRateLimiter,
  dynamicRateLimit,
  whitelistMiddleware,
  rateLimitStats
};

