// 修复版本的题目上传API
app.post('/api/upload-question-fixed', async (req, res) => {
  try {
    const {
      exam_id,
      question_text,
      question_type = 'text',
      correct_answer,
      explanation = '',
      level = 1,
      difficulty = 'medium',
      image_url = null,
      knowledge_point_ids = [],
      options = []
    } = req.body;
    
    // 验证必需参数
    if (!exam_id || !question_text || !correct_answer) {
      return res.status(400).json({ 
        error: '缺少必需参数', 
        required: ['exam_id', 'question_text', 'correct_answer'],
        received: { exam_id, question_text, correct_answer }
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取题目编号
      const [questionNumberResult] = await connection.execute(
        'SELECT MAX(question_number) as max_number FROM questions WHERE exam_id = ?',
        [exam_id]
      );
      const questionNumber = (questionNumberResult[0].max_number || 0) + 1;
      
      // 确保所有参数都有值，避免undefined
      const safeParams = [
        exam_id,
        questionNumber,
        question_text,
        question_type || 'text',
        correct_answer,
        explanation || '',
        level || 1,
        difficulty || 'medium',
        image_url || null
      ];
      
      // 插入题目
      const [questionResult] = await connection.execute(
        `INSERT INTO questions (exam_id, question_number, question_text, question_type, 
         correct_answer, explanation, level, difficulty, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        safeParams
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
        message: '题目上传成功',
        questionId: questionId,
        questionNumber: questionNumber,
        params: safeParams // 返回使用的参数用于调试
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