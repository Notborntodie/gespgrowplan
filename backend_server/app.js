const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入优化模块
const { pool } = require('./config/database');
const { cacheMiddleware, cacheUtils } = require('./config/cache');
const { rateLimiters } = require('./middleware/rateLimit');
const { logger, performanceMonitor, errorLogger } = require('./config/logger');
const securityMiddleware = require('./middleware/security');

const app = express();
const port = process.env.PORT || 3000;

// 基础中间件
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 安全中间件
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.compression);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.bodyLimit);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.userAgentCheck);
app.use(securityMiddleware.originValidation);

// 性能监控中间件
app.use(performanceMonitor);

// 限流中间件（全局）
app.use(rateLimiters.api);

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件!'));
    }
  }
});

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('健康检查失败', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 注册接口（带限流）
app.post('/api/register', rateLimiters.register, async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    
    // 检查用户名是否已存在
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 创建新用户
    await connection.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );
    
    connection.release();
    res.json({ message: '注册成功' });
  } catch (error) {
    logger.error('注册错误', { error: error.message, username });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录接口（带限流）
app.post('/api/login', rateLimiters.auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    
    // 查找用户
    const [users] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    res.json({ message: '登录成功', token: 'fake-jwt-token', user: users[0] });
  } catch (error) {
    logger.error('登录错误', { error: error.message, username });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取考试信息（带缓存）
app.get('/api/exam/:examId', cacheMiddleware(600, 'exam'), async (req, res) => {
  try {
    const { examId } = req.params;
    const connection = await pool.getConnection();
    
    // 获取考试基本信息
    const [examRows] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    const exam = examRows[0];
    
    // 获取题目和选项
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
          created_at: row.created_at,
          options: [],
          images: []
        });
        questions.push(questionMap.get(row.id));
      }
      
      if (row.option_label) {
        questionMap.get(row.id).options.push({
          option_label: row.option_label,
          option_value: row.option_value,
          option_text: row.option_text
        });
      }
    });
    
    // 获取所有题目的图片
    for (let question of questions) {
      const [imageRows] = await connection.execute(
        'SELECT * FROM question_images WHERE question_id = ? ORDER BY display_order',
        [question.id]
      );
      question.images = imageRows;
    }
    
    connection.release();
    
    res.json({
      exam: exam,
      questions: questions
    });
  } catch (error) {
    logger.error('获取考试信息错误', { error: error.message, examId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取全部题目接口（带缓存）
app.get('/api/questions', cacheMiddleware(300, 'questions'), async (req, res) => {
  try {
    const sql = 'SELECT * FROM questions ORDER BY id';
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    logger.error('获取题目列表错误', { error: err.message });
    res.status(500).json({ error: '数据库查询失败' });
  }
});

// 获取知识点列表（带缓存）
app.get('/api/knowledge-points', cacheMiddleware(600, 'knowledge'), async (req, res) => {
  try {
    const { category, level } = req.query;
    const connection = await pool.getConnection();
    
    let sql = 'SELECT * FROM knowledge_points WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    
    sql += ' ORDER BY category, name';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    logger.error('获取知识点列表错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加知识点
app.post('/api/knowledge-points', async (req, res) => {
  try {
    const { name, description, category, level } = req.body;
    const connection = await pool.getConnection();
    
    // 检查知识点是否已存在
    const [existing] = await connection.execute(
      'SELECT id FROM knowledge_points WHERE name = ? AND level = ?',
      [name, level]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ message: '该知识点已存在' });
    }
    
    // 添加知识点
    const [result] = await connection.execute(
      'INSERT INTO knowledge_points (name, description, category, level) VALUES (?, ?, ?, ?)',
      [name, description, category, level]
    );
    
    connection.release();
    
    // 清除相关缓存
    await cacheUtils.delPattern('cache:knowledge:*');
    
    res.json({ 
      message: '知识点添加成功', 
      id: result.insertId 
    });
  } catch (error) {
    logger.error('添加知识点错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上传题目图片（带限流）
app.post('/api/upload-image', rateLimiters.upload, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片文件' });
    }
    
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.json({ 
      message: '图片上传成功',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    logger.error('图片上传错误', { error: error.message });
    res.status(500).json({ error: '图片上传失败' });
  }
});

// 上传题目（带限流）
app.post('/api/upload-question', rateLimiters.questionUpload, async (req, res) => {
  try {
    const {
      exam_id = 1,
      question_text,
      question_type = 'text',
      question_code = null,
      correct_answer,
      explanation = '',
      level = 1,
      difficulty = 'medium',
      image_url = null,
      knowledge_point_ids = [],
      options = []
    } = req.body;

    if (!question_text || !correct_answer) {
      return res.status(400).json({ 
        error: '缺少必需参数', 
        required: ['question_text', 'correct_answer'],
        received: { question_text, correct_answer }
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取题目编号
      const [questionNumberResult] = await connection.execute(
        'SELECT MAX(question_number) as max_number FROM exam_questions WHERE exam_id = ?',
        [exam_id]
      );
      const questionNumber = (questionNumberResult[0].max_number || 0) + 1;
      
      // 插入题目
      const [questionResult] = await connection.execute(
        `INSERT INTO questions (question_text, question_type, 
         question_code, correct_answer, explanation, level, difficulty, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [question_text, question_type || 'text', question_code || null, correct_answer, 
         explanation || '', level || 1, difficulty || 'medium', image_url || null]
      );
      
      const questionId = questionResult.insertId;
      
      // 插入考试-题目关联
      await connection.execute(
        'INSERT INTO exam_questions (exam_id, question_id, question_number) VALUES (?, ?, ?)',
        [exam_id, questionId, questionNumber]
      );
      
      // 插入选项
      if (options && options.length > 0) {
        for (const option of options) {
          if (option.label && option.value && option.text) {
            await connection.execute(
              'INSERT INTO options (question_id, option_label, option_value, option_text) VALUES (?, ?, ?, ?)',
              [questionId, option.label, option.value, option.text]
            );
          }
        }
      }
      
      // 关联知识点
      if (knowledge_point_ids && knowledge_point_ids.length > 0) {
        for (const knowledgePointId of knowledge_point_ids) {
          if (knowledgePointId) {
            await connection.execute(
              'INSERT INTO question_knowledge_points (question_id, knowledge_point_id) VALUES (?, ?)',
              [questionId, knowledgePointId]
            );
          }
        }
      }
      
      // 记录上传历史
      await connection.execute(
        'INSERT INTO question_uploads (user_id, question_id, upload_type, upload_status) VALUES (?, ?, ?, ?)',
        [1, questionId, 'manual', 'approved']
      );
      
      await connection.commit();
      
      // 清除相关缓存
      await cacheUtils.delPattern('cache:questions:*');
      await cacheUtils.delPattern('cache:exam:*');
      
      res.json({ 
        message: '题目上传成功',
        questionId: questionId,
        questionNumber: questionNumber,
        examId: exam_id
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    logger.error('上传题目错误', { error: error.message });
    res.status(500).json({ 
      error: '题目上传失败',
      details: error.message 
    });
  }
});

// 批量上传题目（带限流）
app.post('/api/upload-questions-batch', rateLimiters.batchUpload, async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        error: '缺少题目数据或格式错误',
        required: 'questions array with at least one question'
      });
    }
    
    const connection = await pool.getConnection();
    const results = [];
    
    try {
      await connection.beginTransaction();
      
      let defaultExamId = 1;
      try {
        const [examResult] = await connection.execute('SELECT id FROM exams LIMIT 1');
        if (examResult.length > 0) {
          defaultExamId = examResult[0].id;
        } else {
          const [newExamResult] = await connection.execute(
            'INSERT INTO exams (name, level, description, total_questions) VALUES (?, ?, ?, ?)',
            ['默认考试', 1, '系统默认考试', 0]
          );
          defaultExamId = newExamResult.insertId;
        }
      } catch (error) {
        console.warn('获取默认考试ID失败，使用ID=1:', error.message);
      }
      
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i];
        const {
          question_text,
          question_type = 'text',
          question_code = null,
          correct_answer,
          explanation = '',
          level = 1,
          difficulty = 'medium',
          image_url = null,
          knowledge_point_ids = [],
          options = []
        } = questionData;
        
        if (!question_text || !correct_answer) {
          throw new Error(`第${i + 1}题缺少必需参数: question_text=${question_text}, correct_answer=${correct_answer}`);
        }
        
        const [questionResult] = await connection.execute(
          `INSERT INTO questions (question_text, question_type, question_code, 
           correct_answer, explanation, level, difficulty, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [question_text, question_type, question_code, correct_answer, 
           explanation, level, difficulty, image_url]
        );
        const questionId = questionResult.insertId;
        
        if (options && options.length > 0) {
          for (const option of options) {
            if (option.label && option.value && option.text) {
              await connection.execute(
                'INSERT INTO options (question_id, option_label, option_value, option_text) VALUES (?, ?, ?, ?)',
                [questionId, option.label, option.value, option.text]
              );
            }
          }
        }
        
        if (knowledge_point_ids && knowledge_point_ids.length > 0) {
          for (const knowledgePointId of knowledge_point_ids) {
            if (knowledgePointId) {
              const [knowledgePointExists] = await connection.execute(
                'SELECT id FROM knowledge_points WHERE id = ?',
                [knowledgePointId]
              );
              
              if (knowledgePointExists.length > 0) {
                await connection.execute(
                  'INSERT INTO question_knowledge_points (question_id, knowledge_point_id) VALUES (?, ?)',
                  [questionId, knowledgePointId]
                );
              } else {
                console.warn(`知识点ID ${knowledgePointId} 不存在，跳过关联`);
              }
            }
          }
        }
        
        results.push({
          questionId: questionId,
          status: 'success',
          index: i + 1
        });
      }
      
      await connection.commit();
      
      // 清除相关缓存
      await cacheUtils.delPattern('cache:questions:*');
      
      res.json({ 
        message: `批量上传成功，共上传 ${results.length} 道题目`,
        results: results
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    logger.error('批量上传题目错误', { error: error.message });
    res.status(500).json({ 
      error: '批量上传失败',
      details: error.message 
    });
  }
});

// 获取考试列表（带缓存）
app.get('/api/exams', cacheMiddleware(300, 'exams'), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [examRows] = await connection.execute(`
      SELECT e.*, COUNT(eq.question_id) as question_count
      FROM exams e
      LEFT JOIN exam_questions eq ON e.id = eq.exam_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    
    connection.release();
    res.json(examRows);
  } catch (error) {
    logger.error('获取考试列表错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 错误处理中间件
app.use(errorLogger);

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('未处理的错误', { error: err.message, stack: err.stack });
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;

