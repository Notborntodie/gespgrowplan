const Redis = require('ioredis');

// Redis配置（从环境变量读取，如果没有则使用默认值）
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || null, // 如果有密码，请设置
  db: parseInt(process.env.REDIS_DB) || 0,
  // 连接配置
  lazyConnect: true,
  enableReadyCheck: false,
  // 重试配置
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
  retryDelayOnClusterDown: 300,
  // 高可用配置
  enableOfflineQueue: true, // 启用离线队列，允许在连接断开时缓存命令
  // 超时配置
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000
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
        console.log(`已删除 ${keys.length} 个缓存键: ${pattern}`);
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
  },

  // 知识点专用缓存管理
  knowledge: {
    // 清除所有知识点相关缓存
    async clearAll() {
      const patterns = [
        'cache:knowledge:*',
        'cache:knowledge-points:*',
        'cache:knowledge-categories:*',
        'cache:knowledge-levels:*'
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`知识点缓存清理完成，共删除 ${totalDeleted} 个缓存键`);
      return totalDeleted;
    },

    // 清除特定分类的缓存
    async clearByCategory(category) {
      const patterns = [
        `cache:knowledge:*category=${category}*`,
        `cache:knowledge-points:*category=${category}*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      return totalDeleted;
    },

    // 清除特定级别的缓存
    async clearByLevel(level) {
      const patterns = [
        `cache:knowledge:*level=${level}*`,
        `cache:knowledge-points:*level=${level}*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      return totalDeleted;
    },

    // 预加载知识点缓存
    async preload(pool) {
      try {
        const connection = await pool.getConnection();
        
        // 预加载所有知识点
        const [allKnowledge] = await connection.execute('SELECT * FROM knowledge_points ORDER BY category, level, name');
        await cacheUtils.set('cache:knowledge:all', allKnowledge, 600);
        
        // 按分类预加载
        const categories = [...new Set(allKnowledge.map(k => k.category))];
        for (const category of categories) {
          const categoryKnowledge = allKnowledge.filter(k => k.category === category);
          await cacheUtils.set(`cache:knowledge:category=${category}`, categoryKnowledge, 600);
        }
        
        // 按级别预加载
        const levels = [...new Set(allKnowledge.map(k => k.level))];
        for (const level of levels) {
          const levelKnowledge = allKnowledge.filter(k => k.level === level);
          await cacheUtils.set(`cache:knowledge:level=${level}`, levelKnowledge, 600);
        }
        
        connection.release();
        console.log('知识点缓存预加载完成');
        return true;
      } catch (error) {
        console.error('知识点缓存预加载失败:', error);
        return false;
      }
    }
  },

  // OJ 专用缓存管理
  oj: {
    // 获取题目信息（带缓存）
    async getProblem(problemId, pool) {
      const cacheKey = `cache:oj:problem:${problemId}`;
      
      // 尝试从缓存获取
      let problem = await cacheUtils.get(cacheKey);
      if (problem) {
        console.log(`题目缓存命中: ${problemId}`);
        return problem;
      }
      
      // 从数据库查询
      try {
        const [problems] = await pool.query('SELECT * FROM oj_problems WHERE id = ?', [problemId]);
        if (problems.length > 0) {
          problem = problems[0];
          // 缓存30分钟
          await cacheUtils.set(cacheKey, problem, 1800);
          console.log(`题目已缓存: ${problemId}`);
          return problem;
        }
        return null;
      } catch (error) {
        console.error('查询题目失败:', error);
        return null;
      }
    },

    // 获取测试样例（带缓存）
    async getSamples(problemId, pool) {
      const cacheKey = `cache:oj:samples:${problemId}`;
      
      // 尝试从缓存获取
      let samples = await cacheUtils.get(cacheKey);
      if (samples) {
        console.log(`样例缓存命中: ${problemId}, 样例数: ${samples.length}`);
        return samples;
      }
      
      // 从数据库查询
      try {
        const [samples] = await pool.query(
          'SELECT id, input, output, is_hidden FROM oj_samples WHERE problem_id = ? ORDER BY sort_order',
          [problemId]
        );
        
        // 缓存30分钟
        await cacheUtils.set(cacheKey, samples, 1800);
        console.log(`样例已缓存: ${problemId}, 样例数: ${samples.length}`);
        return samples;
      } catch (error) {
        console.error('查询样例失败:', error);
        return [];
      }
    },

    // 清除特定题目的所有缓存
    async clearProblem(problemId) {
      const patterns = [
        `cache:oj:problem:${problemId}`,
        `cache:oj:samples:${problemId}`,
        `cache:/api/oj/problems/${problemId}*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`题目 ${problemId} 缓存已清除，共 ${totalDeleted} 个键`);
      return totalDeleted;
    },

    // 清除题目列表缓存
    async clearProblemList() {
      const patterns = [
        'cache:/api/oj/problems?*',
        'cache:oj:problems:*'
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`题目列表缓存已清除，共 ${totalDeleted} 个键`);
      return totalDeleted;
    },

    // 清除所有OJ相关缓存
    async clearAll() {
      const patterns = [
        'cache:oj:*',
        'cache:/api/oj/*'
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`OJ缓存清理完成，共删除 ${totalDeleted} 个缓存键`);
      return totalDeleted;
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

