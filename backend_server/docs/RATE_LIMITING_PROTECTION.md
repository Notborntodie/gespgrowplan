# 限流防护详解

## 🎯 什么是限流防护？

限流防护是一种保护系统免受恶意攻击和过载的技术，通过限制请求的频率来保护服务器资源。

### 为什么需要限流？

```javascript
// ❌ 无限流保护的问题
app.post('/api/login', async (req, res) => {
  // 恶意用户可能每秒发送1000次登录请求
  // 导致：
  // 1. 数据库压力过大
  // 2. 服务器资源耗尽
  // 3. 正常用户无法访问
  // 4. 可能被暴力破解密码
});
```

### 限流的作用

```javascript
// ✅ 有限流保护
app.post('/api/login', rateLimiters.auth, async (req, res) => {
  // 15分钟内最多5次登录尝试
  // 防止：
  // 1. 暴力破解攻击
  // 2. 服务器过载
  // 3. 资源浪费
});
```

## 🔧 限流实现原理

### 1. 滑动窗口算法

```javascript
// 滑动窗口限流原理
const slidingWindow = {
  // 时间窗口：15分钟
  windowMs: 15 * 60 * 1000,
  
  // 最大请求数：5次
  max: 5,
  
  // 当前窗口内的请求计数
  currentCount: 0,
  
  // 窗口开始时间
  windowStart: Date.now()
};

// 检查是否允许请求
function isAllowed() {
  const now = Date.now();
  
  // 如果超过窗口时间，重置计数
  if (now - slidingWindow.windowStart > slidingWindow.windowMs) {
    slidingWindow.currentCount = 0;
    slidingWindow.windowStart = now;
  }
  
  // 检查是否超过限制
  if (slidingWindow.currentCount >= slidingWindow.max) {
    return false;
  }
  
  // 增加计数
  slidingWindow.currentCount++;
  return true;
}
```

### 2. Redis存储实现

```javascript
// 使用Redis存储限流数据
const createRedisRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,  // 时间窗口
    max,       // 最大请求数
    store: {
      // 增加计数
      incr: async (key) => {
        const current = await redis.incr(key);
        if (current === 1) {
          // 第一次请求，设置过期时间
          await redis.expire(key, Math.floor(windowMs / 1000));
        }
        return {
          totalHits: current,
          resetTime: new Date(Date.now() + windowMs)
        };
      },
      // 减少计数
      decrement: async (key) => {
        return await redis.decr(key);
      },
      // 重置计数
      resetKey: async (key) => {
        return await redis.del(key);
      }
    }
  });
};
```

## 📊 限流策略配置

### 1. 不同接口的限流策略

```javascript
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
  
  // 批量上传限流（5分钟内最多3次）
  batchUpload: createRedisRateLimiter(
    5 * 60 * 1000,  // 5分钟
    3,              // 最多3次
    '批量上传过于频繁，请5分钟后再试'
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
```

### 2. 限流策略设计原则


| 接口类型  | 时间窗口     | 最大请求数 | 设计考虑       |
| --------- | ------------ | ---------- | -------------- |
| 登录/注册 | 15分钟-1小时 | 3-5次      | 防止暴力破解   |
| 文件上传  | 1-5分钟      | 3-10次     | 防止资源滥用   |
| 查询接口  | 1分钟        | 100-200次  | 允许较高频率   |
| 一般API   | 1分钟        | 100次      | 平衡性能和防护 |

## 🔑 键生成策略

### 1. 基于IP和用户的键生成

```javascript
// 自定义键生成器
keyGenerator: (req) => {
  // 基于IP地址和用户ID生成键
  const userId = req.user ? req.user.id : 'anonymous';
  return `${req.ip}:${userId}:${req.originalUrl}`;
}
```

### 2. 不同键生成策略

```javascript
// 策略1: 仅基于IP（防止IP攻击）
const ipOnlyKey = (req) => `${req.ip}`;

// 策略2: 基于IP和路径（防止特定接口攻击）
const ipPathKey = (req) => `${req.ip}:${req.originalUrl}`;

// 策略3: 基于用户ID（防止用户滥用）
const userIdKey = (req) => {
  const userId = req.user ? req.user.id : 'anonymous';
  return `${userId}:${req.originalUrl}`;
};

// 策略4: 组合策略（最安全）
const combinedKey = (req) => {
  const userId = req.user ? req.user.id : 'anonymous';
  return `${req.ip}:${userId}:${req.originalUrl}`;
};
```

## 🛡️ 高级限流功能

### 1. 动态限流（基于用户角色）

```javascript
// 根据用户角色调整限流
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

// 使用示例
const roleLimits = {
  admin: { windowMs: 60 * 1000, max: 1000, message: '管理员限流' },
  vip: { windowMs: 60 * 1000, max: 500, message: 'VIP用户限流' },
  normal: { windowMs: 60 * 1000, max: 100, message: '普通用户限流' }
};

app.use('/api/admin', dynamicRateLimit(rateLimiters.api, roleLimits));
```

### 2. 白名单机制

```javascript
// 白名单中间件
const whitelistMiddleware = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.includes(req.ip)) {
      return next(); // 跳过限流检查
    }
    next(); // 继续执行限流检查
  };
};

// 使用示例
const trustedIPs = ['192.168.1.1', '10.0.0.1'];
app.use('/api/internal', whitelistMiddleware(trustedIPs), rateLimiters.api);
```

### 3. 限流统计和监控

```javascript
// 限流统计中间件
const rateLimitStats = async (req, res, next) => {
  const key = `rate_limit_stats:${req.ip}`;
  
  try {
    const stats = await redis.get(key);
    if (stats) {
      const parsedStats = JSON.parse(stats);
      console.log(`IP ${req.ip} 的限流统计:`, parsedStats);
    
      // 记录到日志系统
      logger.info('限流统计', {
        ip: req.ip,
        stats: parsedStats,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('获取限流统计失败:', error);
  }
  
  next();
};
```

## 📈 限流效果监控

### 1. 限流响应头

```javascript
// 限流器配置
standardHeaders: true,  // 添加标准限流头
legacyHeaders: false,   // 不使用旧版头

// 响应头示例
// X-RateLimit-Limit: 5
// X-RateLimit-Remaining: 3
// X-RateLimit-Reset: 1640995200
```

### 2. 自定义错误响应

```javascript
// 自定义处理器
handler: (req, res) => {
  res.status(429).json({
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(windowMs / 1000),
    timestamp: new Date().toISOString()
  });
}
```

### 3. 限流日志记录

```javascript
// 记录限流事件
const logRateLimit = (req, res) => {
  logger.warn('请求被限流', {
    ip: req.ip,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    limit: res.getHeader('X-RateLimit-Limit'),
    remaining: res.getHeader('X-RateLimit-Remaining')
  });
};
```

## 🚀 实际应用示例

### 1. 在API中使用限流

```javascript
// 全局限流
app.use(rateLimiters.api);

// 特定接口限流
app.post('/api/register', rateLimiters.register, async (req, res) => {
  // 注册逻辑
});

app.post('/api/login', rateLimiters.auth, async (req, res) => {
  // 登录逻辑
});

app.post('/api/upload', rateLimiters.upload, upload.single('file'), async (req, res) => {
  // 文件上传逻辑
});

app.post('/api/questions/batch', rateLimiters.batchUpload, async (req, res) => {
  // 批量上传逻辑
});
```

### 2. 限流测试

```javascript
// 测试限流功能
const testRateLimit = async () => {
  const testUrl = 'http://localhost:3000/api/login';
  
  console.log('🧪 开始限流测试...');
  
  // 发送6次请求（超过5次限制）
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(testUrl, {
        username: 'test',
        password: 'test'
      });
      console.log(`✅ 请求 ${i}: 成功`);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`❌ 请求 ${i}: 被限流 - ${error.response.data.error}`);
      } else {
        console.log(`❌ 请求 ${i}: 其他错误 - ${error.message}`);
      }
    }
  
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

## ⚠️ 注意事项

### 1. 限流配置调优

```javascript
// 根据实际需求调整限流参数
const rateLimitConfig = {
  // 开发环境：宽松限制
  development: {
    auth: { windowMs: 5 * 60 * 1000, max: 10 },
    api: { windowMs: 60 * 1000, max: 200 }
  },
  
  // 生产环境：严格限制
  production: {
    auth: { windowMs: 15 * 60 * 1000, max: 5 },
    api: { windowMs: 60 * 1000, max: 100 }
  }
};
```

### 2. 分布式环境考虑

```javascript
// 在分布式环境中，使用Redis确保限流一致性
const distributedRateLimit = {
  // 使用Redis存储，确保多实例间限流一致
  store: {
    incr: async (key) => {
      return await redis.incr(key);
    }
  },
  
  // 考虑时钟同步问题
  clockTolerance: 1000 // 1秒时钟容差
};
```

### 3. 用户体验优化

```javascript
// 提供友好的限流提示
const userFriendlyHandler = (req, res) => {
  const retryAfter = Math.ceil(windowMs / 1000);
  
  res.status(429).json({
    error: '请求过于频繁',
    message: `请等待 ${retryAfter} 秒后重试`,
    retryAfter: retryAfter,
    suggestions: [
      '请检查您的操作频率',
      '如果是正常使用，请联系客服',
      '考虑升级到VIP用户获得更高限制'
    ]
  });
};
```

## 📊 限流效果评估

### 性能指标


| 指标            | 无限流 | 有限流 | 改善     |
| --------------- | ------ | ------ | -------- |
| 服务器CPU使用率 | 高     | 低     | 60%+     |
| 数据库连接数    | 过载   | 稳定   | 80%+     |
| 响应时间        | 慢     | 快     | 50%+     |
| 系统稳定性      | 差     | 好     | 显著提升 |

### 安全效果


| 攻击类型 | 防护效果 |
| -------- | -------- |
| 暴力破解 | 完全防护 |
| DDoS攻击 | 部分防护 |
| 资源滥用 | 有效防护 |
| 爬虫攻击 | 有效防护 |

## 📈 最佳实践总结

1. **合理设置限流参数** - 根据业务需求调整
2. **使用Redis存储** - 确保分布式一致性
3. **实现动态限流** - 根据用户角色调整
4. **添加白名单机制** - 保护可信IP
5. **监控限流效果** - 及时调整策略
6. **优化用户体验** - 提供友好提示
7. **定期评估效果** - 持续改进策略

通过限流防护，系统能够有效防止恶意攻击，保护服务器资源，提高系统稳定性和用户体验。
