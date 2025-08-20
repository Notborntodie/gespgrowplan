const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

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

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // 替换为你的MySQL密码
  database: 'gesp_practice_system',
  charset: 'utf8mb4'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 注册接口
app.post('/api/register', async (req, res) => {
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
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录接口
app.post('/api/login', async (req, res) => {
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
    
    // 简单返回一个 token（实际项目请用 JWT 等）
    res.json({ message: '登录成功', token: 'fake-jwt-token', user: users[0] });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 1. 获取考试信息（兼容旧API，使用新的数据库结构）
app.get('/api/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const connection = await pool.getConnection();
    
    // 获取考试基本信息
    const [examRows] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examRows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }
    
    const exam = examRows[0];
    
    // 获取题目和选项（使用新的exam_questions关联表）
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
          images: [] // 添加图片数组
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
    
    // 获取所有题目的图片（从question_images表）
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
    console.error('获取考试信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});





// 获取全部题目接口（更新为新的数据库结构）
app.get('/api/questions', async (req, res) => {
  try {
    const sql = 'SELECT * FROM questions ORDER BY id';
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: '数据库查询失败' });
  }
});





// =============================================
// 题目上传相关API
// =============================================

// 1. 获取知识点列表
app.get('/api/knowledge-points', async (req, res) => {
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
    console.error('获取知识点列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2. 添加知识点
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
    res.json({ 
      message: '知识点添加成功', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('添加知识点错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 3. 上传题目图片
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
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
    console.error('图片上传错误:', error);
    res.status(500).json({ error: '图片上传失败' });
  }
});

// 4. 创建题目
app.post('/api/questions', async (req, res) => {
  try {
    const {
      question_text,
      question_type = 'text',
      question_code = null,
      correct_answer,
      explanation = '',
      level = 1,
      difficulty = 'medium',
      image_url = null,
      question_date = null,
      knowledge_point_ids = [],
      options = []
    } = req.body;

    // 验证必需参数
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
      
      // 插入题目
      const [questionResult] = await connection.execute(
        `INSERT INTO questions (question_text, question_type, question_code, correct_answer, 
         explanation, level, difficulty, image_url, question_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [question_text, question_type, question_code, correct_answer, explanation, 
         level, difficulty, image_url, question_date]
      );
      
      const questionId = questionResult.insertId;
      
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
      
      res.json({ 
        message: '题目创建成功',
        questionId: questionId
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('创建题目错误:', error);
    res.status(500).json({ 
      error: '题目创建失败',
      details: error.message 
    });
  }
});

// 5. 批量创建题目
app.post('/api/questions/batch', async (req, res) => {
  try {
    const { questions } = req.body;
    
    // 验证请求体
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
          question_date = null,
          knowledge_point_ids = [],
          options = []
        } = questionData;
        
        // 验证必需参数
        if (!question_text) {
          throw new Error(`第${i + 1}题缺少必需参数: question_text`);
        }

        // 使用默认值或原始值
        const finalCorrectAnswer = correct_answer || 'A';
        
        // 插入题目
        const [questionResult] = await connection.execute(
          `INSERT INTO questions (question_text, question_type, question_code, 
           correct_answer, explanation, level, difficulty, image_url, question_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [question_text, question_type, question_code, finalCorrectAnswer, 
           explanation, level, difficulty, image_url, question_date]
        );
        
        const questionId = questionResult.insertId;
        
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
              // 检查知识点是否存在
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
      
      res.json({ 
        message: `批量创建成功，共创建 ${results.length} 道题目`,
        results: results
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('批量创建题目错误:', error);
    res.status(500).json({ 
      error: '批量创建失败',
      details: error.message 
    });
  }
});

// 6. 获取题目详情（包含知识点）
app.get('/api/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const connection = await pool.getConnection();
    
    // 获取题目基本信息
    const [questionRows] = await connection.execute(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );
    
    if (questionRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '题目不存在' });
    }
    
    const question = questionRows[0];
    
    // 获取选项
    const [optionRows] = await connection.execute(
      'SELECT * FROM options WHERE question_id = ? ORDER BY option_label',
      [questionId]
    );
    
    // 获取关联的知识点
    const [knowledgeRows] = await connection.execute(`
      SELECT kp.* FROM knowledge_points kp
      JOIN question_knowledge_points qkp ON kp.id = qkp.knowledge_point_id
      WHERE qkp.question_id = ?
    `, [questionId]);
    
    // 获取图片
    const [imageRows] = await connection.execute(
      'SELECT * FROM question_images WHERE question_id = ? ORDER BY display_order',
      [questionId]
    );
    
    connection.release();
    
    res.json({
      ...question,
      options: optionRows,
      knowledge_points: knowledgeRows,
      images: imageRows
    });
    
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 7. 更新题目
app.put('/api/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      question_text,
      question_type,
      question_code,
      correct_answer,
      explanation,
      level,
      difficulty,
      image_url,
      question_date,
      knowledge_point_ids = [],
      options = []
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 确保所有参数都有有效值，避免undefined
      const safeParams = [
        question_text || '',
        question_type || 'text',
        question_code || null,
        correct_answer || '',
        explanation || '',
        level || 1,
        difficulty || 'medium',
        image_url || null,
        question_date || null,
        questionId
      ];
      
      // 更新题目基本信息
      await connection.execute(
        `UPDATE questions SET question_text = ?, question_type = ?, question_code = ?, correct_answer = ?, 
         explanation = ?, level = ?, difficulty = ?, image_url = ?, question_date = ? WHERE id = ?`,
        safeParams
      );
      
      // 删除旧的选项
      await connection.execute('DELETE FROM options WHERE question_id = ?', [questionId]);
      
      // 插入新的选项
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
      
      // 删除旧的知识点关联
      await connection.execute('DELETE FROM question_knowledge_points WHERE question_id = ?', [questionId]);
      
      // 插入新的知识点关联
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
      
      await connection.commit();
      
      res.json({ message: '题目更新成功' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('更新题目错误:', error);
    res.status(500).json({ error: '题目更新失败' });
  }
});

// 8. 删除题目
app.delete('/api/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM questions WHERE id = ?', [questionId]);
    connection.release();
    
    res.json({ message: '题目删除成功' });
  } catch (error) {
    console.error('删除题目错误:', error);
    res.status(500).json({ error: '题目删除失败' });
  }
});

// 9. 获取题目上传历史
app.get('/api/question-uploads', async (req, res) => {
  try {
    const { status, user_id } = req.query;
    const connection = await pool.getConnection();
    
    let sql = `
      SELECT qu.*, q.question_text, q.question_code, u.username 
      FROM question_uploads qu
      JOIN questions q ON qu.question_id = q.id
      JOIN users u ON qu.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND qu.upload_status = ?';
      params.push(status);
    }
    
    if (user_id) {
      sql += ' AND qu.user_id = ?';
      params.push(user_id);
    }
    
    sql += ' ORDER BY qu.created_at DESC';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    console.error('获取上传历史错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 10. 审核题目上传
app.put('/api/question-uploads/:uploadId/review', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { status, review_notes } = req.body;
    
    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE question_uploads SET upload_status = ?, review_notes = ? WHERE id = ?',
      [status, review_notes, uploadId]
    );
    
    connection.release();
    
    res.json({ message: '审核完成' });
  } catch (error) {
    console.error('审核题目错误:', error);
    res.status(500).json({ error: '审核失败' });
  }
});



// =============================================
// 考试管理相关API
// =============================================

// 1. 获取所有考试列表
app.get('/api/exams', async (req, res) => {
  try {
    const { level } = req.query;
    const connection = await pool.getConnection();
    
    let query = `
      SELECT e.*, COUNT(eq.question_id) as total_questions
      FROM exams e
      LEFT JOIN exam_questions eq ON e.id = eq.exam_id
    `;
    
    let params = [];
    
    // 如果指定了等级，添加过滤条件
    if (level) {
      query += ` WHERE e.level = ?`;
      params.push(level);
    }
    
    query += ` GROUP BY e.id ORDER BY e.created_at DESC`;
    
    // 获取考试基本信息
    const [examRows] = await connection.execute(query, params);
    
    // 为每个考试获取题目详情
    const examsWithDetails = await Promise.all(
      examRows.map(async (exam) => {
        const [questionRows] = await connection.execute(`
          SELECT q.*, eq.question_number
          FROM questions q
          JOIN exam_questions eq ON q.id = eq.question_id
          WHERE eq.exam_id = ?
          ORDER BY eq.question_number
        `, [exam.id]);
        
        return {
          ...exam,
          questions: questionRows
        };
      })
    );
    
    connection.release();
    res.json(examsWithDetails);
  } catch (error) {
    console.error('获取考试列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2. 获取单个考试详情（包含题目信息）
app.get('/api/exams/:examId', async (req, res) => {
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
    
    // 获取考试包含的题目和选项
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
    console.error('获取考试详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 3. 创建新考试
app.post('/api/exams', async (req, res) => {
  try {
    const {
      name,
      level,
      description = '',
      question_ids = [] // 题目ID数组，包含题目在考试中的编号信息
    } = req.body;
    
    // 验证必需参数
    if (!name || !level) {
      return res.status(400).json({ 
        error: '缺少必需参数', 
        required: ['name', 'level'],
        received: { name, level }
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 创建考试
      const [examResult] = await connection.execute(
        'INSERT INTO exams (name, level, description, total_questions) VALUES (?, ?, ?, ?)',
        [name, level, description, question_ids.length]
      );
      
      const examId = examResult.insertId;
      
      // 关联题目到考试
      if (question_ids && question_ids.length > 0) {
        for (let i = 0; i < question_ids.length; i++) {
          const questionData = question_ids[i];
          const questionId = typeof questionData === 'object' ? questionData.id : questionData;
          const questionNumber = typeof questionData === 'object' ? questionData.question_number : (i + 1);
          
          // 验证题目是否存在
          const [questionExists] = await connection.execute(
            'SELECT id FROM questions WHERE id = ?',
            [questionId]
          );
          
          if (questionExists.length === 0) {
            throw new Error(`题目ID ${questionId} 不存在`);
          }
          
          // 检查题目是否已经在此考试中
          const [existingQuestion] = await connection.execute(
            'SELECT id FROM exam_questions WHERE exam_id = ? AND question_id = ?',
            [examId, questionId]
          );
          
          if (existingQuestion.length > 0) {
            throw new Error(`题目ID ${questionId} 已经在此考试中`);
          }
          
          // 检查题号是否重复
          const [existingNumber] = await connection.execute(
            'SELECT id FROM exam_questions WHERE exam_id = ? AND question_number = ?',
            [examId, questionNumber]
          );
          
          if (existingNumber.length > 0) {
            throw new Error(`题号 ${questionNumber} 在此考试中已存在`);
          }
          
          // 插入考试-题目关联
          await connection.execute(
            'INSERT INTO exam_questions (exam_id, question_id, question_number) VALUES (?, ?, ?)',
            [examId, questionId, questionNumber]
          );
        }
      }
      
      await connection.commit();
      
      res.json({ 
        message: '考试创建成功',
        examId: examId,
        questionCount: question_ids.length
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('创建考试错误:', error);
    res.status(500).json({ 
      error: '考试创建失败',
      details: error.message 
    });
  }
});

// 4. 更新考试信息
app.put('/api/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const {
      name,
      level,
      description,
      question_ids = [] // 题目ID数组，包含题目在考试中的编号信息
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查考试是否存在
      const [examExists] = await connection.execute(
        'SELECT id FROM exams WHERE id = ?',
        [examId]
      );
      
      if (examExists.length === 0) {
        throw new Error('考试不存在');
      }
      
      // 更新考试基本信息
      if (name || level || description !== undefined) {
        const updateFields = [];
        const updateValues = [];
        
        if (name) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (level) {
          updateFields.push('level = ?');
          updateValues.push(level);
        }
        if (description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(description);
        }
        
        updateValues.push(examId);
        
        await connection.execute(
          `UPDATE exams SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
      
      // 更新题目关联
      if (Array.isArray(question_ids)) {
        // 删除现有的题目关联
        await connection.execute('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);
        
        // 添加新的题目关联
        if (question_ids.length > 0) {
          for (let i = 0; i < question_ids.length; i++) {
            const questionData = question_ids[i];
            const questionId = typeof questionData === 'object' ? questionData.id : questionData;
            const questionNumber = typeof questionData === 'object' ? questionData.question_number : (i + 1);
            
            // 验证题目是否存在
            const [questionExists] = await connection.execute(
              'SELECT id FROM questions WHERE id = ?',
              [questionId]
            );
            
            if (questionExists.length === 0) {
              throw new Error(`题目ID ${questionId} 不存在`);
            }
            
            // 检查题号是否重复
            const [existingNumber] = await connection.execute(
              'SELECT id FROM exam_questions WHERE exam_id = ? AND question_number = ?',
              [examId, questionNumber]
            );
            
            if (existingNumber.length > 0) {
              throw new Error(`题号 ${questionNumber} 在此考试中已存在`);
            }
            
            // 插入考试-题目关联
            await connection.execute(
              'INSERT INTO exam_questions (exam_id, question_id, question_number) VALUES (?, ?, ?)',
              [examId, questionId, questionNumber]
            );
          }
        }
        
        // 更新考试的总题目数
        await connection.execute(
          'UPDATE exams SET total_questions = ? WHERE id = ?',
          [question_ids.length, examId]
        );
      }
      
      await connection.commit();
      
      res.json({ message: '考试更新成功' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('更新考试错误:', error);
    res.status(500).json({ 
      error: '考试更新失败',
      details: error.message 
    });
  }
});

// 5. 删除考试
app.delete('/api/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查考试是否存在
      const [examExists] = await connection.execute(
        'SELECT id FROM exams WHERE id = ?',
        [examId]
      );
      
      if (examExists.length === 0) {
        throw new Error('考试不存在');
      }
      
      // 删除考试（会自动删除相关的exam_questions记录，因为设置了CASCADE）
      await connection.execute('DELETE FROM exams WHERE id = ?', [examId]);
      
      await connection.commit();
      
      res.json({ message: '考试删除成功' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('删除考试错误:', error);
    res.status(500).json({ 
      error: '考试删除失败',
      details: error.message 
    });
  }
});

// 6. 获取可用题目列表（用于选择题目添加到考试）
app.get('/api/available-questions', async (req, res) => {
  try {
    const { level, difficulty, category, exam_id } = req.query;
    const connection = await pool.getConnection();
    
    let sql = `
      SELECT q.*, 
             GROUP_CONCAT(DISTINCT kp.name ORDER BY kp.name SEPARATOR ', ') as knowledge_points
      FROM questions q
      LEFT JOIN question_knowledge_points qkp ON q.id = qkp.question_id
      LEFT JOIN knowledge_points kp ON qkp.knowledge_point_id = kp.id
      WHERE 1=1
    `;
    const params = [];
    
    if (level) {
      sql += ' AND q.level = ?';
      params.push(level);
    }
    
    if (difficulty) {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    
    if (category) {
      sql += ' AND kp.category = ?';
      params.push(category);
    }
    
    // 如果指定了exam_id，排除已经在此考试中的题目
    if (exam_id) {
      sql += ' AND q.id NOT IN (SELECT question_id FROM exam_questions WHERE exam_id = ?)';
      params.push(exam_id);
    }
    
    sql += ' GROUP BY q.id ORDER BY q.created_at DESC';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    console.error('获取可用题目错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// =============================================
// 提交相关API
// =============================================

// 1. 提交考试答案
app.post('/api/submit-exam', async (req, res) => {
  try {
    const { user_id, exam_id, answers } = req.body;
    const connection = await pool.getConnection();
    
    // 验证必需参数
    if (!user_id || !exam_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        error: '缺少必需参数',
        required: 'user_id, exam_id, answers array'
      });
    }
    
    // 获取考试信息
    const [examRows] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [exam_id]
    );
    
    if (examRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    // 获取用户信息
    const [userRows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 获取考试题目
    const [questionRows] = await connection.execute(`
      SELECT q.*, eq.question_number
      FROM questions q
      JOIN exam_questions eq ON q.id = eq.question_id
      WHERE eq.exam_id = ?
      ORDER BY eq.question_number
    `, [exam_id]);
    
    if (questionRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试中没有题目' });
    }
    
    // 计算尝试次数
    const [attemptRows] = await connection.execute(
      'SELECT MAX(attempt_number) as max_attempt FROM submissions WHERE user_id = ? AND exam_id = ?',
      [user_id, exam_id]
    );
    
    const attemptNumber = (attemptRows[0].max_attempt || 0) + 1;
    
    // 开始事务
    await connection.beginTransaction();
    
    try {
      // 创建提交记录
      const [submissionResult] = await connection.execute(
        'INSERT INTO submissions (user_id, exam_id, attempt_number, score) VALUES (?, ?, ?, 0)',
        [user_id, exam_id, attemptNumber]
      );
      
      const submissionId = submissionResult.insertId;
      let correctCount = 0;
      const submissionAnswers = [];
      
      // 处理每道题的答案
      for (const answer of answers) {
        const { question_id, user_answer } = answer;
        
        // 验证题目是否在此考试中
        const questionInExam = questionRows.find(q => q.id === question_id);
        if (!questionInExam) {
          throw new Error(`题目ID ${question_id} 不在此考试中`);
        }
        
        // 检查答案是否正确
        const isCorrect = user_answer === questionInExam.correct_answer;
        if (isCorrect) {
          correctCount++;
        }
        
        // 记录答题详情
        await connection.execute(
          'INSERT INTO submission_answers (submission_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
          [submissionId, question_id, user_answer, isCorrect ? 1 : 0]
        );
        
        submissionAnswers.push({
          question_id,
          user_answer,
          is_correct: isCorrect,
          correct_answer: questionInExam.correct_answer,
          question_text: questionInExam.question_text
        });
      }
      
      // 计算得分
      const score = Math.round((correctCount / questionRows.length) * 100);
      
      // 更新提交记录的得分
      await connection.execute(
        'UPDATE submissions SET score = ? WHERE id = ?',
        [score, submissionId]
      );
      
      await connection.commit();
      
      res.json({
        message: '考试提交成功',
        submission_id: submissionId,
        score: score,
        total_questions: questionRows.length,
        correct_count: correctCount,
        attempt_number: attemptNumber,
        answers: submissionAnswers
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('提交考试错误:', error);
    res.status(500).json({ error: '提交考试失败', details: error.message });
  }
});

// 2. 获取用户的提交记录
app.get('/api/submissions', async (req, res) => {
  try {
    const { user_id, exam_id } = req.query;
    const connection = await pool.getConnection();
    
    let sql = `
      SELECT s.*, e.name as exam_name, e.level as exam_level
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    if (user_id) {
      sql += ' AND s.user_id = ?';
      params.push(user_id);
    }
    
    if (exam_id) {
      sql += ' AND s.exam_id = ?';
      params.push(exam_id);
    }
    
    sql += ' ORDER BY s.submit_time DESC';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    console.error('获取提交记录错误:', error);
    res.status(500).json({ error: '获取提交记录失败' });
  }
});

// 3. 获取单次提交的详细答案
app.get('/api/submissions/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const connection = await pool.getConnection();
    
    // 获取提交基本信息
    const [submissionRows] = await connection.execute(`
      SELECT s.*, e.name as exam_name, e.level as exam_level, u.username
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [submissionId]);
    
    if (submissionRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: '提交记录不存在' });
    }
    
    const submission = submissionRows[0];
    
    // 获取详细答题信息
    const [answerRows] = await connection.execute(`
      SELECT sa.*, q.question_text, q.question_type, q.question_code, 
             q.correct_answer, q.explanation, q.level, q.difficulty,
             eq.question_number
      FROM submission_answers sa
      JOIN questions q ON sa.question_id = q.id
      JOIN exam_questions eq ON q.id = eq.question_id AND eq.exam_id = ?
      WHERE sa.submission_id = ?
      ORDER BY eq.question_number
    `, [submission.exam_id, submissionId]);
    
    // 获取选项信息
    const questionIds = answerRows.map(row => row.question_id);
    let options = [];
    if (questionIds.length > 0) {
      const [optionRows] = await connection.execute(`
        SELECT o.* FROM options o 
        WHERE o.question_id IN (${questionIds.map(() => '?').join(',')})
        ORDER BY o.question_id, o.option_label
      `, questionIds);
      options = optionRows;
    }
    
    // 整理答案数据
    const answers = answerRows.map(answer => {
      const questionOptions = options.filter(opt => opt.question_id === answer.question_id);
      return {
        ...answer,
        options: questionOptions
      };
    });
    
    connection.release();
    
    res.json({
      submission: submission,
      answers: answers
    });
    
  } catch (error) {
    console.error('获取提交详情错误:', error);
    res.status(500).json({ error: '获取提交详情失败' });
  }
});

// 4. 获取用户的所有错题
app.get('/api/wrong-questions', async (req, res) => {
  try {
    const { user_id, level, difficulty, limit = 50 } = req.query;
    const connection = await pool.getConnection();
    
    // 如果没有user_id，返回空数组
    if (!user_id) {
      connection.release();
      return res.json([]);
    }
    
    let sql = `
      SELECT DISTINCT q.*, sa.user_answer, sa.is_correct, sa.created_at as answered_at,
             e.name as exam_name, e.level as exam_level
      FROM questions q
      JOIN submission_answers sa ON q.id = sa.question_id
      JOIN submissions s ON sa.submission_id = s.id
      JOIN exams e ON s.exam_id = e.id
      WHERE sa.is_correct = 0 AND s.user_id = ?
    `;
    const params = [user_id];
    
    if (level) {
      sql += ' AND q.level = ?';
      params.push(level);
    }
    
    if (difficulty) {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    
    sql += ' ORDER BY sa.created_at DESC';
    
    // 使用字符串拼接而不是参数绑定的方式处理LIMIT
    const limitNum = parseInt(limit) || 50;
    sql += ` LIMIT ${limitNum}`;
    
    const [results] = await connection.execute(sql, params);
    
    // 为每道题获取选项
    const questionIds = results.map(row => row.id);
    let options = [];
    if (questionIds.length > 0) {
      const [optionRows] = await connection.execute(`
        SELECT o.* FROM options o 
        WHERE o.question_id IN (${questionIds.map(() => '?').join(',')})
        ORDER BY o.question_id, o.option_label
      `, questionIds);
      options = optionRows;
    }
    
    // 整理数据
    const wrongQuestions = results.map(question => {
      const questionOptions = options.filter(opt => opt.question_id === question.id);
      return {
        ...question,
        options: questionOptions
      };
    });
    
    connection.release();
    
    res.json(wrongQuestions);
    
  } catch (error) {
    console.error('获取错题错误:', error);
    res.status(500).json({ error: '获取错题失败' });
  }
});

// 5. 获取用户的答题统计
app.get('/api/user-stats', async (req, res) => {
  try {
    const { user_id } = req.query;
    const connection = await pool.getConnection();
    
    if (!user_id) {
      return res.status(400).json({ error: '缺少user_id参数' });
    }
    
    // 获取基本统计
    const [statsRows] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT s.exam_id) as total_exams,
        AVG(s.score) as average_score,
        MAX(s.score) as best_score,
        MIN(s.score) as worst_score
      FROM submissions s
      WHERE s.user_id = ?
    `, [user_id]);
    
    // 获取答题详情统计
    const [answerStatsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_answers,
        SUM(sa.is_correct) as correct_answers,
        COUNT(*) - SUM(sa.is_correct) as wrong_answers,
        ROUND(SUM(sa.is_correct) * 100.0 / COUNT(*), 2) as correct_rate
      FROM submission_answers sa
      JOIN submissions s ON sa.submission_id = s.id
      WHERE s.user_id = ?
    `, [user_id]);
    
    // 获取按等级统计
    const [levelStatsRows] = await connection.execute(`
      SELECT 
        q.level,
        COUNT(*) as question_count,
        SUM(sa.is_correct) as correct_count,
        ROUND(SUM(sa.is_correct) * 100.0 / COUNT(*), 2) as correct_rate
      FROM submission_answers sa
      JOIN submissions s ON sa.submission_id = s.id
      JOIN questions q ON sa.question_id = q.id
      WHERE s.user_id = ?
      GROUP BY q.level
      ORDER BY q.level
    `, [user_id]);
    
    connection.release();
    
    res.json({
      basic_stats: statsRows[0],
      answer_stats: answerStatsRows[0],
      level_stats: levelStatsRows
    });
    
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
});

// 6. 获取考试排行榜
app.get('/api/exam-leaderboard', async (req, res) => {
  try {
    const { exam_id, limit = 20 } = req.query;
    const connection = await pool.getConnection();
    
    if (!exam_id) {
      return res.status(400).json({ error: '缺少exam_id参数' });
    }
    
    const limitNum = parseInt(limit) || 20;
    const [results] = await connection.execute(`
      SELECT 
        s.score,
        s.submit_time,
        s.attempt_number,
        u.username,
        e.name as exam_name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN exams e ON s.exam_id = e.id
      WHERE s.exam_id = ?
      ORDER BY s.score DESC, s.submit_time ASC
      LIMIT ${limitNum}
    `, [exam_id]);
    
    connection.release();
    
    res.json(results);
    
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`GESP练习系统服务器运行在 http://localhost:${port}`);
});