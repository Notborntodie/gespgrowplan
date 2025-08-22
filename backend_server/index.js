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
  host: '106.14.143.27',
  user: 'gesp_user',
  password: 'Gesp@2025!',
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

// 4. 上传题目（修改版 - 不需要exam_id）
app.post('/api/upload-question', async (req, res) => {
  try {
    const {
      exam_id = 1, // 默认使用考试ID为1
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

    // 验证必需参数（去掉exam_id）
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
      
      // 获取题目编号 - 从exam_questions表获取
      const [questionNumberResult] = await connection.execute(
        'SELECT MAX(question_number) as max_number FROM exam_questions WHERE exam_id = ?',
        [exam_id]
      );
      const questionNumber = (questionNumberResult[0].max_number || 0) + 1;
      
      // 确保所有参数都有值，避免undefined
      const safeParams = [
        exam_id,
        questionNumber,
        question_text,
        question_type || 'text',
        question_code || null,
        correct_answer,
        explanation || '',
        level || 1,
        difficulty || 'medium',
        image_url || null
      ];
      
      // 插入题目 - 不包含exam_id和question_number
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
    console.error('上传题目错误:', error);
    res.status(500).json({ 
      error: '题目上传失败',
      details: error.message 
    });
  }
});

// 5. 批量上传题目
app.post('/api/upload-questions-batch', async (req, res) => {
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
      
          // 获取第一个可用的考试ID，如果没有则创建默认考试
    let defaultExamId = 1;
    try {
      const [examResult] = await connection.execute('SELECT id FROM exams LIMIT 1');
      if (examResult.length > 0) {
        defaultExamId = examResult[0].id;
      } else {
        // 如果没有考试，创建一个默认考试
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
        
        // 验证必需参数
        if (!question_text || !correct_answer) {
          throw new Error(`第${i + 1}题缺少必需参数: question_text=${question_text}, correct_answer=${correct_answer}`);
        }
        
        // 批量上传不需要关联考试，直接插入题目即可
        // 不需要获取题目编号，因为不关联到考试
        
        // 插入题目 - 使用正确的数据库结构
        const [questionResult] = await connection.execute(
          `INSERT INTO questions (question_text, question_type, question_code, 
           correct_answer, explanation, level, difficulty, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [question_text, question_type, question_code, correct_answer, 
           explanation, level, difficulty, image_url]
        );
        const questionId = questionResult.insertId;
        
        // 批量上传不关联考试，跳过exam_questions表的插入
        
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
    console.error('批量上传题目错误:', error);
    res.status(500).json({ 
      error: '批量上传失败',
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
        questionId
      ];
      
      // 更新题目基本信息
      await connection.execute(
        `UPDATE questions SET question_text = ?, question_type = ?, question_code = ?, correct_answer = ?, 
         explanation = ?, level = ?, difficulty = ?, image_url = ? WHERE id = ?`,
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
    const connection = await pool.getConnection();
    
    // 获取考试基本信息
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

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});