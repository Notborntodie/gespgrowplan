// 确保环境变量已加载（如果还没有加载的话）
if (!process.env.DOTENV_LOADED) {
  try {
    require('dotenv').config();
    process.env.DOTENV_LOADED = 'true';
  } catch (e) {
    // dotenv可能已经加载过了，忽略错误
  }
}

const Redis = require('ioredis');

// Redis配置（从环境变量读取，如果没有则使用默认值）
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || null, // 如果有密码，请设置
  db: parseInt(process.env.REDIS_DB) || 0,
  // 连接配置
  lazyConnect: false, // 改为false，立即建立连接
  enableReadyCheck: true,
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
  console.error('Redis连接错误:', error.message);
});

redis.on('close', () => {
  console.log('Redis连接已关闭');
});

redis.on('reconnecting', () => {
  console.log('Redis正在重连...');
});

// 由于lazyConnect设为false，连接会自动建立
// 添加连接状态检查
redis.on('ready', () => {
  console.log('✅ Redis已准备就绪，可以开始使用缓存');
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
      // 确保Redis连接已建立
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        try {
          await redis.connect();
        } catch (connectErr) {
          // 连接失败时继续处理请求，但不使用缓存
          console.warn(`Redis连接失败，跳过缓存: ${connectErr.message}`);
          return next();
        }
      }
      
      const cached = await redis.get(key);
      if (cached) {
        console.log(`缓存命中: ${key}`);
        return res.json(JSON.parse(cached));
      }
      
      // 重写res.json方法以缓存响应
      const originalJson = res.json;
      res.json = function(body) {
        // 缓存响应数据（异步，不阻塞响应）
        redis.setex(key, duration, JSON.stringify(body))
          .then(() => {
            console.log(`缓存已写入: ${key} (${duration}秒)`);
          })
          .catch(err => {
            console.error(`缓存写入失败: ${key}`, err.message);
          });
        
        // 调用原始的json方法
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('缓存中间件错误:', error.message);
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
  },

  // Exam 专用缓存管理
  exam: {
    // 获取考试详情（带缓存，包含题目、选项和图片）
    async getExamDetail(examId, pool) {
      const cacheKey = `cache:exam:detail:${examId}`;
      
      // 尝试从缓存获取
      let examDetail = await cacheUtils.get(cacheKey);
      if (examDetail) {
        console.log(`考试详情缓存命中: ${examId}`);
        return examDetail;
      }
      
      // 从数据库查询
      try {
        const connection = await pool.getConnection();
        
        // 获取考试基本信息
        const [examRows] = await connection.execute(
          'SELECT * FROM exams WHERE id = ?',
          [examId]
        );
        
        if (examRows.length === 0) {
          connection.release();
          return null;
        }
        
        const exam = examRows[0];
        
        // 获取考试包含的题目和选项（优化：一次性JOIN查询）
        const [questionRows] = await connection.execute(`
          SELECT q.*, eq.question_number, o.option_label, o.option_value, o.option_text
          FROM questions q
          JOIN exam_questions eq ON q.id = eq.question_id
          LEFT JOIN options o ON q.id = o.question_id
          WHERE eq.exam_id = ?
          ORDER BY eq.question_number, o.option_label
        `, [examId]);
        
        // 整理题目数据
        const questions = [];
        const questionMap = new Map();
        const questionIds = [];
        
        questionRows.forEach(row => {
          if (!questionMap.has(row.id)) {
            questionMap.set(row.id, {
              id: row.id,
              question_number: row.question_number,
              question_text: row.question_text,
              question_type: row.question_type,
              question_code: row.question_code,
              correct_answer: row.correct_answer,
              explanation: row.explanation,
              level: row.level,
              difficulty: row.difficulty,
              image_url: row.image_url,
              question_date: row.question_date,
              created_at: row.created_at,
              options: [],
              images: []
            });
            questions.push(questionMap.get(row.id));
            questionIds.push(row.id);
          }
          
          if (row.option_label) {
            questionMap.get(row.id).options.push({
              label: row.option_label,
              value: row.option_value,
              text: row.option_text
            });
          }
        });
        
        // 优化：一次性获取所有题目的图片，而不是循环查询（解决N+1问题）
        if (questionIds.length > 0) {
          const placeholders = questionIds.map(() => '?').join(',');
          const [imageRows] = await connection.execute(
            `SELECT * FROM question_images WHERE question_id IN (${placeholders}) ORDER BY question_id, display_order`,
            questionIds
          );
          
          // 将图片按题目ID分组
          const imageMap = new Map();
          imageRows.forEach(image => {
            if (!imageMap.has(image.question_id)) {
              imageMap.set(image.question_id, []);
            }
            imageMap.get(image.question_id).push(image);
          });
          
          // 将图片分配到对应的题目
          questions.forEach(question => {
            question.images = imageMap.get(question.id) || [];
          });
        }
        
        connection.release();
        
        examDetail = {
          exam: exam,
          questions: questions
        };
        
        // 缓存30分钟
        await cacheUtils.set(cacheKey, examDetail, 1800);
        console.log(`考试详情已缓存: ${examId}, 题目数: ${questions.length}`);
        return examDetail;
      } catch (error) {
        console.error('查询考试详情失败:', error);
        return null;
      }
    },

    // 清除特定考试的缓存
    async clearExam(examId) {
      const patterns = [
        `cache:exam:detail:${examId}`,
        `cache:exam:${examId}*`,
        `cache:/api/exams/${examId}*`,
        `cache:/api/exam/${examId}*`
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`考试 ${examId} 缓存已清除，共 ${totalDeleted} 个键`);
      return totalDeleted;
    },

    // 清除考试列表缓存
    async clearExamList() {
      const patterns = [
        'cache:/api/exams*',
        'cache:exams:*'
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`考试列表缓存已清除，共 ${totalDeleted} 个键`);
      return totalDeleted;
    },

    // 清除所有考试相关缓存
    async clearAll() {
      const patterns = [
        'cache:exam:*',
        'cache:exams:*',
        'cache:/api/exams*',
        'cache:/api/exam*'
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cacheUtils.delPattern(pattern);
        totalDeleted += deleted;
      }
      
      console.log(`考试缓存清理完成，共删除 ${totalDeleted} 个缓存键`);
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

