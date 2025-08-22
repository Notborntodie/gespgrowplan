# Redis缓存层详解

## 🚀 什么是Redis缓存层？

Redis缓存层是一种高性能的内存数据存储系统，用于存储频繁访问的数据，减少数据库查询，提高系统响应速度。

### 为什么需要缓存？

```javascript
// ❌ 无缓存的问题
app.get('/api/questions', async (req, res) => {
  // 每次请求都要查询数据库
  const connection = await pool.getConnection();
  const [questions] = await connection.execute('SELECT * FROM questions');
  connection.release();
  
  res.json(questions); // 响应时间：100-200ms
});

// ✅ 有缓存的优势
app.get('/api/questions', cacheMiddleware(300, 'questions'), async (req, res) => {
  // 第一次请求：查询数据库并缓存
  // 后续请求：直接从缓存返回
  const connection = await pool.getConnection();
  const [questions] = await connection.execute('SELECT * FROM questions');
  connection.release();
  
  res.json(questions); // 响应时间：5-10ms（缓存命中）
});
```

## 🔧 Redis配置详解

### 1. 基础连接配置

```javascript
const redisConfig = {
  host: '127.0.0.1',        // Redis服务器地址
  port: 6379,               // Redis端口
  password: null,           // Redis密码（如果有）
  db: 0,                   // 数据库编号
  lazyConnect: true,       // 延迟连接
};
```

### 2. 高可用配置

```javascript
// 重连和容错配置
const redisConfig = {
  // 重试配置
  maxRetriesPerRequest: 3,           // 每个请求最大重试次数
  retryDelayOnFailover: 100,         // 故障转移重试延迟
  retryDelayOnClusterDown: 300,      // 集群宕机重试延迟
  
  // 高可用配置
  enableOfflineQueue: false,         // 禁用离线队列
  enableReadyCheck: false,           // 禁用就绪检查
  
  // 超时配置
  connectTimeout: 10000,             // 连接超时（10秒）
  commandTimeout: 5000,              // 命令超时（5秒）
};
```

### 3. 事件监听

```javascript
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
```

## 📦 缓存中间件实现

### 1. 缓存中间件原理

```javascript
const cacheMiddleware = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    // 跳过非GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${keyPrefix}:${req.originalUrl}`;
    
    try {
      // 1. 尝试从缓存获取数据
      const cached = await redis.get(key);
      if (cached) {
        console.log(`缓存命中: ${key}`);
        return res.json(JSON.parse(cached));
      }
      
      // 2. 缓存未命中，重写res.json方法
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
```

### 2. 缓存工作流程

```
请求流程：
1. 客户端发送GET请求
2. 检查缓存是否存在
   ├─ 缓存命中 → 直接返回缓存数据
   └─ 缓存未命中 → 执行数据库查询
3. 数据库查询完成
4. 将结果写入缓存
5. 返回响应给客户端
```

### 3. 缓存键生成策略

```javascript
// 缓存键格式
const key = `${keyPrefix}:${req.originalUrl}`;

// 实际例子
"questions:/api/questions"                    // 题目列表
"exam:/api/exam/123"                         // 考试详情
"knowledge:/api/knowledge-points"            // 知识点列表
"exams:/api/exams"                           // 考试列表
```

## 🛠️ 缓存工具函数

### 1. 基础缓存操作

```javascript
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
  }
};
```

### 2. 高级缓存操作

```javascript
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
```

## 📊 缓存策略配置

### 1. 不同接口的缓存策略

```javascript
// 在API中使用缓存中间件
app.get('/api/exam/:examId', cacheMiddleware(600, 'exam'), async (req, res) => {
  // 考试详情缓存10分钟
});

app.get('/api/questions', cacheMiddleware(300, 'questions'), async (req, res) => {
  // 题目列表缓存5分钟
});

app.get('/api/knowledge-points', cacheMiddleware(600, 'knowledge'), async (req, res) => {
  // 知识点列表缓存10分钟
});

app.get('/api/exams', cacheMiddleware(300, 'exams'), async (req, res) => {
  // 考试列表缓存5分钟
});
```

### 2. 缓存策略设计原则

| 数据类型 | 缓存时间 | 设计考虑 |
|----------|----------|----------|
| 静态数据 | 1-24小时 | 很少变化，可以长期缓存 |
| 配置数据 | 10-30分钟 | 偶尔变化，中等缓存时间 |
| 业务数据 | 1-10分钟 | 经常变化，短期缓存 |
| 实时数据 | 不缓存 | 需要实时性，不缓存 |

## 🔄 缓存更新策略

### 1. 缓存失效策略

```javascript
// 1. 时间过期策略（TTL）
redis.setex(key, 300, JSON.stringify(data)); // 5分钟后自动过期

// 2. 主动删除策略
app.post('/api/questions', async (req, res) => {
  // 创建新题目后，删除相关缓存
  await cacheUtils.delPattern('questions:*');
  await cacheUtils.delPattern('exam:*');
});

// 3. 更新策略
app.put('/api/questions/:id', async (req, res) => {
  // 更新题目后，更新缓存
  const updatedQuestion = await updateQuestion(req.params.id, req.body);
  await cacheUtils.set(`question:${req.params.id}`, updatedQuestion, 300);
});
```

### 2. 缓存预热

```javascript
// 系统启动时预热缓存
const warmupCache = async () => {
  console.log('开始缓存预热...');
  
  try {
    // 预热题目列表
    const connection = await pool.getConnection();
    const [questions] = await connection.execute('SELECT * FROM questions');
    await cacheUtils.set('questions:all', questions, 300);
    
    // 预热考试列表
    const [exams] = await connection.execute('SELECT * FROM exams');
    await cacheUtils.set('exams:all', exams, 300);
    
    connection.release();
    console.log('缓存预热完成');
  } catch (error) {
    console.error('缓存预热失败:', error);
  }
};

// 系统启动时调用
warmupCache();
```

## 📈 缓存性能优化

### 1. 缓存命中率优化

```javascript
// 缓存命中率监控
const cacheHitRate = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++;
  },
  
  recordMiss() {
    this.misses++;
  },
  
  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
  }
};

// 在缓存中间件中记录
if (cached) {
  cacheHitRate.recordHit();
  return res.json(JSON.parse(cached));
} else {
  cacheHitRate.recordMiss();
}
```

### 2. 缓存大小优化

```javascript
// Redis内存使用监控
const monitorRedisMemory = async () => {
  try {
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1];
    const maxMemory = info.match(/maxmemory_human:(\S+)/)?.[1];
    
    console.log(`Redis内存使用: ${usedMemory} / ${maxMemory}`);
    
    // 如果内存使用超过80%，清理过期缓存
    if (usedMemory && maxMemory) {
      const usedMB = parseInt(usedMemory);
      const maxMB = parseInt(maxMemory);
      if (usedMB / maxMB > 0.8) {
        await redis.eval('return redis.call("MEMORY", "PURGE")', 0);
        console.log('已清理过期缓存');
      }
    }
  } catch (error) {
    console.error('监控Redis内存失败:', error);
  }
};

// 定期监控
setInterval(monitorRedisMemory, 5 * 60 * 1000); // 每5分钟
```

## 🔍 缓存健康检查

### 1. 健康检查函数

```javascript
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
```

### 2. 缓存状态监控

```javascript
// 缓存状态监控
const cacheStatus = async () => {
  try {
    const info = await redis.info();
    const keyspace = await redis.dbsize();
    const memory = await redis.memory('usage', 'total');
    
    console.log('缓存状态:', {
      keyspace: keyspace,
      memory: memory,
      uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1],
      connected_clients: info.match(/connected_clients:(\d+)/)?.[1]
    });
  } catch (error) {
    console.error('获取缓存状态失败:', error);
  }
};
```

## 🚀 实际应用示例

### 1. 在API中使用缓存

```javascript
// 考试详情接口（带缓存）
app.get('/api/exam/:examId', cacheMiddleware(600, 'exam'), async (req, res) => {
  try {
    const { examId } = req.params;
    const connection = await pool.getConnection();
    
    // 获取考试信息
    const [exams] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (exams.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    const exam = exams[0];
    
    // 获取考试题目
    const [questions] = await connection.execute(
      'SELECT q.* FROM questions q JOIN exam_questions eq ON q.id = eq.question_id WHERE eq.exam_id = ?',
      [examId]
    );
    
    connection.release();
    
    const result = {
      ...exam,
      questions: questions
    };
    
    res.json(result); // 自动缓存结果
  } catch (error) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

### 2. 缓存更新示例

```javascript
// 更新题目后清除相关缓存
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    // 更新题目
    await connection.execute(
      'UPDATE questions SET title = ?, content = ? WHERE id = ?',
      [req.body.title, req.body.content, id]
    );
    
    connection.release();
    
    // 清除相关缓存
    await cacheUtils.delPattern('questions:*');
    await cacheUtils.delPattern('exam:*');
    
    res.json({ message: '题目更新成功' });
  } catch (error) {
    console.error('更新题目失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

## 📊 缓存效果评估

### 性能提升对比

| 指标 | 无缓存 | 有缓存 | 提升 |
|------|--------|--------|------|
| 响应时间 | 100-200ms | 5-10ms | **90%+** |
| 数据库负载 | 高 | 低 | **80%+** |
| 并发处理能力 | 低 | 高 | **200%+** |
| 用户体验 | 慢 | 快 | **显著提升** |

### 缓存命中率目标

| 接口类型 | 目标命中率 | 缓存时间 |
|----------|------------|----------|
| 静态数据 | >95% | 1-24小时 |
| 配置数据 | >80% | 10-30分钟 |
| 业务数据 | >70% | 1-10分钟 |
| 实时数据 | 0% | 不缓存 |

## ⚠️ 注意事项

### 1. 缓存一致性

```javascript
// 确保缓存与数据库一致性
const updateWithCache = async (id, data) => {
  // 1. 更新数据库
  await updateDatabase(id, data);
  
  // 2. 更新缓存
  await cacheUtils.set(`item:${id}`, data, 300);
  
  // 3. 清除相关缓存
  await cacheUtils.delPattern('list:*');
};
```

### 2. 缓存穿透防护

```javascript
// 防止缓存穿透
const getWithCache = async (key, fetchData) => {
  let data = await cacheUtils.get(key);
  
  if (data === null) {
    // 缓存未命中，查询数据库
    data = await fetchData();
    
    if (data) {
      // 缓存有效数据
      await cacheUtils.set(key, data, 300);
    } else {
      // 缓存空结果，防止穿透
      await cacheUtils.set(key, null, 60);
    }
  }
  
  return data;
};
```

### 3. 缓存雪崩防护

```javascript
// 防止缓存雪崩（随机过期时间）
const setWithRandomExpire = async (key, value, baseDuration = 300) => {
  const randomOffset = Math.floor(Math.random() * 60); // 0-60秒随机偏移
  const duration = baseDuration + randomOffset;
  
  await cacheUtils.set(key, value, duration);
};
```

## 📈 最佳实践总结

1. **合理设置缓存时间** - 根据数据变化频率调整
2. **实现缓存更新策略** - 数据更新时及时清除缓存
3. **监控缓存命中率** - 持续优化缓存策略
4. **防止缓存穿透** - 缓存空结果
5. **防止缓存雪崩** - 使用随机过期时间
6. **实现缓存预热** - 系统启动时预加载数据
7. **监控缓存性能** - 定期检查缓存状态
8. **优雅降级** - 缓存失败时不影响主流程

通过Redis缓存层，GESP系统能够显著提升响应速度，减少数据库负载，提高系统整体性能！
