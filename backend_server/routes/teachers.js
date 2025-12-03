const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { cacheUtils } = require('../config/cache');
const { logger } = require('../config/logger');

// 教师绑定学生
router.post('/teacher/:teacherId/students', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { student_ids } = req.body;
    
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'student_ids 必须是包含学生ID的数组' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 验证教师是否存在
      const [teacherExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [teacherId]
      );
      
      if (teacherExists.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: '教师不存在' });
      }
      
      // 验证所有学生是否存在
      const placeholders = student_ids.map(() => '?').join(',');
      const [studentsExist] = await connection.execute(
        `SELECT id FROM users WHERE id IN (${placeholders})`,
        student_ids
      );
      
      if (studentsExist.length !== student_ids.length) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: '部分学生不存在' });
      }
      
      const results = [];
      
      // 绑定学生到教师
      for (const studentId of student_ids) {
        try {
          await connection.execute(
            'INSERT INTO teacher_students (teacher_id, student_id) VALUES (?, ?)',
            [teacherId, studentId]
          );
          results.push({ student_id: studentId, status: 'success' });
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            results.push({ student_id: studentId, status: 'already_bound' });
          } else {
            throw error;
          }
        }
      }
      
      await connection.commit();
      connection.release();
      
      // 清除相关缓存
      await cacheUtils.delPattern('users:*');
      
      res.json({ 
        message: '学生绑定完成',
        results: results
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    logger.error('绑定学生错误', { error: error.message, teacherId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取教师的学生列表
router.get('/teacher/:teacherId/students', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status } = req.query; // 可选：按状态过滤
    
    const connection = await pool.getConnection();
    
    let sql = `
      SELECT u.id, u.username, u.email, u.real_name, u.created_at,
             ts.created_at as bound_at,
             COUNT(DISTINCT s.id) as submission_count,
             COUNT(DISTINCT sa.id) as total_answers,
             SUM(sa.is_correct) as correct_answers,
             ROUND(SUM(sa.is_correct) * 100.0 / COUNT(sa.id), 2) as correct_rate
      FROM users u
      JOIN teacher_students ts ON u.id = ts.student_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN submission_answers sa ON s.id = sa.submission_id
      WHERE ts.teacher_id = ?
    `;
    
    const params = [teacherId];
    
    sql += ' GROUP BY u.id, u.username, u.email, u.real_name, u.created_at, ts.created_at';
    sql += ' ORDER BY ts.created_at DESC';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    logger.error('获取教师学生列表错误', { error: error.message, teacherId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 教师解绑学生
router.delete('/teacher/:teacherId/students/:studentId', async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查绑定关系是否存在
      const [bindingExists] = await connection.execute(
        'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
        [teacherId, studentId]
      );
      
      if (bindingExists.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: '绑定关系不存在' });
      }
      
      // 删除绑定关系
      await connection.execute(
        'DELETE FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
        [teacherId, studentId]
      );
      
      await connection.commit();
      connection.release();
      
      // 清除相关缓存
      await cacheUtils.delPattern('users:*');
      
      res.json({ message: '学生解绑成功' });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    logger.error('解绑学生错误', { error: error.message, teacherId, studentId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生的详细答题情况（教师视角）
router.get('/teacher/:teacherId/students/:studentId/submissions', async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    const { exam_id, limit = 20 } = req.query;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的答题情况' });
    }
    
    let sql = `
      SELECT s.*, e.name as exam_name, e.level as exam_level,
             ROUND((s.score / e.total_questions) * 100, 2) as percentage,
             s.task_id,
             lt.name as task_name,
             lp.name as plan_name
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      LEFT JOIN learning_tasks lt ON s.task_id = lt.id
      LEFT JOIN learning_plans lp ON lt.plan_id = lp.id
      WHERE s.user_id = ?
    `;
    
    const params = [studentId];
    
    if (exam_id) {
      sql += ' AND s.exam_id = ?';
      params.push(exam_id);
    }
    
    sql += ' ORDER BY s.submit_time DESC LIMIT ?';
    params.push(Number(limit) || 20);
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    logger.error('获取学生答题情况错误', { error: error.message, teacherId, studentId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生的错题情况（教师视角）
router.get('/teacher/:teacherId/students/:studentId/wrong-questions', async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    const { level, difficulty, limit = 50 } = req.query;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的错题情况' });
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
    
    const params = [studentId];
    
    if (level) {
      sql += ' AND q.level = ?';
      params.push(level);
    }
    
    if (difficulty) {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    
    sql += ` ORDER BY sa.created_at DESC LIMIT ${Number(limit) || 50}`;
    
    const [results] = await connection.execute(sql, params);
    
    // 为每道题获取选项
    const questionIds = results.map(row => row.id);
    let options = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const [optionRows] = await connection.execute(`
        SELECT o.* FROM options o 
        WHERE o.question_id IN (${placeholders})
        ORDER BY o.question_id, o.option_label
      `, questionIds);
      options = optionRows;
    }
    
    // 整理数据
    const wrongQuestions = results.map(question => {
      const questionOptions = options.filter(opt => opt.question_id === question.id);
      // 将选项字段转换为前端期望的格式
      const formattedOptions = questionOptions.map(option => ({
        id: option.id,
        question_id: option.question_id,
        label: option.option_label,
        value: option.option_value,
        text: option.option_text
      }));
      return {
        ...question,
        options: formattedOptions
      };
    });
    
    connection.release();
    
    res.json(wrongQuestions);
  } catch (error) {
    logger.error('获取学生错题错误', { error: error.message, teacherId, studentId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生的学习统计（教师视角）
router.get('/teacher/:teacherId/students/:studentId/stats', async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的学习统计' });
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
    `, [studentId]);
    
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
    `, [studentId]);
    
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
    `, [studentId]);
    
    connection.release();
    
    res.json({
      basic_stats: statsRows[0],
      answer_stats: answerStatsRows[0],
      level_stats: levelStatsRows
    });
  } catch (error) {
    logger.error('获取学生学习统计错误', { error: error.message, teacherId, studentId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生在某个考试的具体答题详细情况（教师视角）
router.get('/teacher/:teacherId/students/:studentId/exams/:examId/detail', async (req, res) => {
  try {
    const { teacherId, studentId, examId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的考试详情' });
    }
    
    // 获取考试基本信息
    const [examInfo] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examInfo.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    // 获取学生在该考试的所有提交记录
    const [submissions] = await connection.execute(
      'SELECT * FROM submissions WHERE user_id = ? AND exam_id = ? ORDER BY submit_time DESC',
      [studentId, examId]
    );
    
    // 获取最新提交的详细答题情况
    let detailedAnswers = [];
    if (submissions.length > 0) {
      const latestSubmission = submissions[0];
      
      // 获取该次提交的所有答题详情
      const [answers] = await connection.execute(`
        SELECT 
          sa.*,
          q.question_text,
          q.question_type,
          q.difficulty,
          q.level,
          q.knowledge_point,
          q.explanation
        FROM submission_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.submission_id = ?
        ORDER BY q.question_order
      `, [latestSubmission.id]);
      
      detailedAnswers = answers;
    }
    
    // 获取学生在该考试的历史提交统计
    const [historyStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_attempts,
        MAX(score) as best_score,
        MIN(score) as worst_score,
        AVG(score) as average_score,
        MAX(submit_time) as last_attempt_time,
        MIN(submit_time) as first_attempt_time
      FROM submissions
      WHERE user_id = ? AND exam_id = ?
    `, [studentId, examId]);
    
    connection.release();
    
    res.json({
      exam_info: examInfo[0],
      submissions: submissions,
      latest_submission_detail: detailedAnswers,
      history_stats: historyStats[0]
    });
    
  } catch (error) {
    logger.error('获取学生考试详情错误', { error: error.message, teacherId, studentId, examId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取教师绑定的学生在某个考试的提交情况（教师视角）
router.get('/teacher/:teacherId/exams/:examId/students', async (req, res) => {
  try {
    const { teacherId, examId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 获取考试基本信息
    const [examInfo] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examInfo.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    // 获取教师绑定的所有学生在该考试的提交情况
    const [students] = await connection.execute(`
      SELECT 
        u.id as student_id,
        u.username,
        u.real_name,
        u.email,
        ts.created_at as bound_at,
        s.id as submission_id,
        s.score,
        s.submit_time,
        s.attempt_number,
        CASE 
          WHEN s.id IS NOT NULL THEN 'submitted'
          ELSE 'not_submitted'
        END as submission_status
      FROM teacher_students ts
      JOIN users u ON ts.student_id = u.id
      LEFT JOIN submissions s ON u.id = s.user_id AND s.exam_id = ?
      WHERE ts.teacher_id = ?
      ORDER BY u.username
    `, [examId, teacherId]);
    
    connection.release();
    
    res.json({
      exam_info: examInfo[0],
      students: students,
      summary: {
        total_students: students.length,
        submitted_count: students.filter(s => s.submission_status === 'submitted').length,
        not_submitted_count: students.filter(s => s.submission_status === 'not_submitted').length
      }
    });
    
  } catch (error) {
    logger.error('获取教师学生考试提交情况错误', { error: error.message, teacherId, examId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取教师绑定的某个学生在某个考试的历史分数和错题详情
router.get('/teacher/:teacherId/students/:studentId/exams/:examId/history', async (req, res) => {
  try {
    const { teacherId, studentId, examId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的考试历史' });
    }
    
    // 获取考试基本信息
    const [examInfo] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examInfo.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    // 获取学生信息
    const [studentInfo] = await connection.execute(
      'SELECT id, username, real_name, email FROM users WHERE id = ?',
      [studentId]
    );
    
    // 获取学生在该考试的所有提交历史
    const [submissions] = await connection.execute(
      'SELECT * FROM submissions WHERE user_id = ? AND exam_id = ? ORDER BY submit_time DESC',
      [studentId, examId]
    );
    
    connection.release();
    
    res.json({
      exam_info: examInfo[0],
      student_info: studentInfo[0],
      submissions: submissions,
      statistics: {
        total_attempts: submissions.length,
        best_score: submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : 0,
        worst_score: submissions.length > 0 ? Math.min(...submissions.map(s => s.score)) : 0,
        average_score: submissions.length > 0 ? 
          Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length) : 0
      }
    });
    
  } catch (error) {
    logger.error('获取学生考试历史错误', { error: error.message, teacherId, studentId, examId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取教师绑定的某个学生在某个考试的错题详情
router.get('/teacher/:teacherId/students/:studentId/exams/:examId/wrong-questions', async (req, res) => {
  try {
    const { teacherId, studentId, examId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的错题情况' });
    }
    
    // 获取考试基本信息
    const [examInfo] = await connection.execute(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );
    
    if (examInfo.length === 0) {
      connection.release();
      return res.status(404).json({ error: '考试不存在' });
    }
    
    // 获取学生信息
    const [studentInfo] = await connection.execute(
      'SELECT id, username, real_name, email FROM users WHERE id = ?',
      [studentId]
    );
    
    // 获取学生在该考试的所有提交记录
    const [submissions] = await connection.execute(
      'SELECT id, attempt_number, submit_time FROM submissions WHERE user_id = ? AND exam_id = ? ORDER BY submit_time DESC',
      [studentId, examId]
    );
    
    if (submissions.length === 0) {
      connection.release();
      return res.json({
        exam_info: examInfo[0],
        student_info: studentInfo[0],
        wrong_questions: [],
        statistics: {
          total_attempts: 0,
          total_wrong_questions: 0
        }
      });
    }
    
    // 获取所有提交的错题详情
    const submissionIds = submissions.map(s => s.id);
    const placeholders = submissionIds.map(() => '?').join(',');
    
    const [wrongQuestions] = await connection.execute(`
      SELECT 
        sa.submission_id,
        sa.question_id,
        sa.user_answer,
        sa.is_correct,
        q.question_text,
        q.question_type,
        q.difficulty,
        q.level,
        q.explanation
      FROM submission_answers sa
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.submission_id IN (${placeholders}) AND sa.is_correct = 0
      ORDER BY sa.question_id
    `, submissionIds);
    
    connection.release();
    
    res.json({
      exam_info: examInfo[0],
      student_info: studentInfo[0],
      wrong_questions: wrongQuestions,
      statistics: {
        total_attempts: submissions.length,
        total_wrong_questions: wrongQuestions.length
      }
    });
    
  } catch (error) {
    logger.error('获取学生错题详情错误', { error: error.message, teacherId, studentId, examId });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取老师绑定学生的全部提交记录
router.get('/teacher/:teacherId/submissions-list', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { exam_id, student_id } = req.query;
    const connection = await pool.getConnection();
    
    // 获取该老师绑定的所有学生ID
    const [boundStudents] = await connection.execute(
      'SELECT student_id FROM teacher_students WHERE teacher_id = ?',
      [teacherId]
    );
    
    if (boundStudents.length === 0) {
      connection.release();
      return res.json([]);
    }
    
    const studentIds = boundStudents.map(row => row.student_id);
    
    let sql = `
      SELECT s.*, e.name as exam_name, e.level as exam_level, u.username, u.real_name,
             s.task_id,
             lt.name as task_name,
             lp.name as plan_name
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN learning_tasks lt ON s.task_id = lt.id
      LEFT JOIN learning_plans lp ON lt.plan_id = lp.id
      WHERE s.user_id IN (${studentIds.map(() => '?').join(',')})
    `;
    const params = [...studentIds];
    
    if (exam_id) {
      sql += ' AND s.exam_id = ?';
      params.push(exam_id);
    }
    
    if (student_id) {
      sql += ' AND s.user_id = ?';
      params.push(student_id);
    }
    
    sql += ' ORDER BY s.submit_time DESC';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    logger.error('获取学生提交记录错误', { error: error.message, teacherId });
    res.status(500).json({ error: '获取提交记录失败' });
  }
});

// 查看学生的某次记录的详细提交记录
router.get('/teacher/:teacherId/students/:studentId/submissions/:submissionId', async (req, res) => {
  try {
    const { teacherId, studentId, submissionId } = req.params;
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({ error: '没有权限查看该学生的提交详情' });
    }
    
    // 获取提交基本信息
    const [submissionRows] = await connection.execute(`
      SELECT s.*, e.name as exam_name, e.level as exam_level, u.username,
             s.task_id,
             lt.name as task_name,
             lp.name as plan_name
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN learning_tasks lt ON s.task_id = lt.id
      LEFT JOIN learning_plans lp ON lt.plan_id = lp.id
      WHERE s.id = ? AND s.user_id = ?
    `, [submissionId, studentId]);
    
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
      // 将选项字段转换为前端期望的格式
      const formattedOptions = questionOptions.map(option => ({
        id: option.id,
        question_id: option.question_id,
        label: option.option_label,
        value: option.option_value,
        text: option.option_text
      }));
      return {
        ...answer,
        options: formattedOptions
      };
    });
    
    connection.release();
    
    res.json({
      submission: submission,
      answers: answers
    });
    
  } catch (error) {
    logger.error('获取学生提交详情错误', { error: error.message, teacherId, studentId, submissionId });
    res.status(500).json({ error: '获取提交详情失败' });
  }
});

/**
 * 获取老师绑定学生的全部OJ提交记录
 * GET /teacher/:teacherId/oj-submissions
 * 
 * 查询参数:
 * - studentId: 学生ID（可选，过滤特定学生）
 * - problemId: 题目ID（可选，过滤特定题目）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * - status: 过滤状态（可选：completed, error）
 * - verdict: 过滤结果（可选：Accepted, Wrong Answer等）
 */
router.get('/teacher/:teacherId/oj-submissions', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const {
      studentId,
      problemId,
      page = 1,
      pageSize = 20,
      status,
      verdict
    } = req.query;
    
    const connection = await pool.getConnection();
    
    // 获取该老师绑定的所有学生ID
    const [boundStudents] = await connection.execute(
      'SELECT student_id FROM teacher_students WHERE teacher_id = ?',
      [teacherId]
    );
    
    if (boundStudents.length === 0) {
      connection.release();
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page, 10) || 1,
          pageSize: parseInt(pageSize, 10) || 20,
          total: 0
        }
      });
    }
    
    const studentIds = boundStudents.map(row => parseInt(row.student_id, 10));
    
    // 如果指定了studentId，验证该学生是否被绑定
    if (studentId) {
      const studentIdNum = parseInt(studentId, 10);
      if (!studentIds.includes(studentIdNum)) {
        connection.release();
        return res.status(403).json({
          success: false,
          error: '没有权限查看该学生的OJ提交记录'
        });
      }
    }
    
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 20;
    const offset = (pageNumber - 1) * size;
    
    let query = `
      SELECT 
        s.id,
        s.problem_id,
        p.title AS problem_title,
        s.language,
        s.status,
        s.verdict,
        s.total_tests,
        s.passed_tests,
        s.submit_time,
        s.judge_duration,
        s.user_id,
        u.username,
        u.real_name,
        s.task_id,
        lt.name as task_name,
        lp.name as plan_name
      FROM oj_submissions s
      LEFT JOIN oj_problems p ON s.problem_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN learning_tasks lt ON s.task_id = lt.id
      LEFT JOIN learning_plans lp ON lt.plan_id = lp.id
      WHERE s.user_id IN (${studentIds.map(() => '?').join(',')})
    `;
    
    const params = [...studentIds];
    
    if (studentId) {
      query += ' AND s.user_id = ?';
      params.push(parseInt(studentId, 10));
    }
    
    if (problemId) {
      query += ' AND s.problem_id = ?';
      params.push(parseInt(problemId, 10));
    }
    
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    
    if (verdict) {
      query += ' AND s.verdict = ?';
      params.push(verdict);
    }
    
    query += ' ORDER BY s.submit_time DESC LIMIT ? OFFSET ?';
    params.push(size, offset);
    
    const [submissions] = await connection.query(query, params);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) AS total 
      FROM oj_submissions 
      WHERE user_id IN (${studentIds.map(() => '?').join(',')})
    `;
    const countParams = [...studentIds];
    
    if (studentId) {
      countQuery += ' AND user_id = ?';
      countParams.push(parseInt(studentId, 10));
    }
    
    if (problemId) {
      countQuery += ' AND problem_id = ?';
      countParams.push(parseInt(problemId, 10));
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (verdict) {
      countQuery += ' AND verdict = ?';
      countParams.push(verdict);
    }
    
    const [countResult] = await connection.query(countQuery, countParams);
    connection.release();
    
    res.json({
      success: true,
      data: submissions,
      pagination: {
        page: pageNumber,
        pageSize: size,
        total: countResult[0]?.total || 0
      }
    });
    
  } catch (error) {
    logger.error('获取老师绑定学生的OJ提交记录失败', { error: error.message, teacherId });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 查看学生的某次OJ的详细提交记录
 * GET /teacher/:teacherId/students/:studentId/oj-submissions/:submissionId
 * 
 * 查询参数:
 * - submissionId: 提交记录ID（路径参数）
 */
router.get('/teacher/:teacherId/students/:studentId/oj-submissions/:submissionId', async (req, res) => {
  try {
    const { teacherId, studentId, submissionId } = req.params;
    
    const connection = await pool.getConnection();
    
    // 验证教师-学生绑定关系
    const [bindingExists] = await connection.execute(
      'SELECT id FROM teacher_students WHERE teacher_id = ? AND student_id = ?',
      [teacherId, studentId]
    );
    
    if (bindingExists.length === 0) {
      connection.release();
      return res.status(403).json({
        success: false,
        error: '没有权限查看该学生的OJ提交详情'
      });
    }
    
    const whereClause = 's.id = ? AND s.user_id = ?';
    const params = [submissionId, studentId];
    
    const [rows] = await connection.query(
      `SELECT 
        s.id,
        s.problem_id,
        p.title AS problem_title,
        s.language,
        s.status,
        s.verdict,
        s.total_tests,
        s.passed_tests,
        s.results,
        s.error_message,
        s.code,
        s.submit_time,
        s.judge_start_time,
        s.judge_end_time,
        s.judge_duration,
        s.user_id,
        s.ip_address,
        u.username,
        u.real_name,
        s.task_id,
        lt.name as task_name,
        lp.name as plan_name
       FROM oj_submissions s
       LEFT JOIN oj_problems p ON s.problem_id = p.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN learning_tasks lt ON s.task_id = lt.id
       LEFT JOIN learning_plans lp ON lt.plan_id = lp.id
       WHERE ${whereClause}`,
      params
    );
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: '提交记录不存在'
      });
    }
    
    const submission = rows[0];
    
    // 解析 JSON 结果
    if (submission.results) {
      try {
        submission.results = JSON.parse(submission.results);
      } catch (e) {
        logger.warn('OJ提交详情结果JSON解析失败', { submissionId, error: e.message });
      }
    }
    
    connection.release();
    
    res.json({
      success: true,
      data: submission
    });
    
  } catch (error) {
    logger.error('获取学生OJ提交详情失败', { error: error.message, teacherId, studentId, submissionId });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 教师批量拉学生加入学习计划
 * POST /teacher/:teacherId/learning-plans/:planId/add-students
 * 
 * 请求体:
 * - student_ids: 学生ID数组
 */
router.post('/teacher/:teacherId/learning-plans/:planId/add-students', async (req, res) => {
  try {
    const { teacherId, planId } = req.params;
    const { student_ids } = req.body;
    
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'student_ids 必须是包含学生ID的数组' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 验证教师是否存在
      const [teacherExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [teacherId]
      );
      
      if (teacherExists.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, error: '教师不存在' });
      }
      
      // 验证学习计划是否存在且有效
      const [planRows] = await connection.execute(
        'SELECT * FROM learning_plans WHERE id = ? AND is_active = 1',
        [planId]
      );
      
      if (planRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false,
          error: '学习计划不存在或已停用' 
        });
      }
      
      // 验证所有学生是否绑定到该教师
      const placeholders = student_ids.map(() => '?').join(',');
      const [boundStudents] = await connection.execute(
        `SELECT student_id FROM teacher_students WHERE teacher_id = ? AND student_id IN (${placeholders})`,
        [teacherId, ...student_ids]
      );
      
      const boundStudentIds = boundStudents.map(row => row.student_id);
      const unboundStudents = student_ids.filter(id => !boundStudentIds.includes(id));
      
      if (unboundStudents.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false,
          error: '部分学生未绑定到该教师',
          unbound_students: unboundStudents
        });
      }
      
      const results = [];
      
      // 为每个学生加入学习计划
      for (const studentId of student_ids) {
        // 检查学生是否已加入该计划
        const [existingRows] = await connection.execute(
          'SELECT * FROM user_learning_plans WHERE user_id = ? AND plan_id = ?',
          [studentId, planId]
        );
        
        if (existingRows.length > 0) {
          results.push({ student_id: studentId, status: 'already_joined' });
          continue;
        }
        
        // 加入学习计划
        await connection.execute(
          'INSERT INTO user_learning_plans (user_id, plan_id, status) VALUES (?, ?, ?)',
          [studentId, planId, 'active']
        );
        
        // 为该计划的所有任务创建进度记录
        await connection.execute(`
          INSERT INTO user_task_progress (user_id, task_id, is_completed)
          SELECT ?, id, FALSE
          FROM learning_tasks
          WHERE plan_id = ?
        `, [studentId, planId]);
        
        // 为该计划的所有客观题创建进度记录
        await connection.execute(`
          INSERT INTO user_exam_progress (user_id, exam_id, is_completed, best_score, attempt_count)
          SELECT ?, te.exam_id, FALSE, 0, 0
          FROM task_exams te
          JOIN learning_tasks lt ON te.task_id = lt.id
          WHERE lt.plan_id = ?
          ON DUPLICATE KEY UPDATE
            is_completed = FALSE,
            best_score = 0,
            attempt_count = 0,
            completed_at = NULL
        `, [studentId, planId]);
        
        // 为该计划的所有OJ题目创建进度记录
        await connection.execute(`
          INSERT INTO user_oj_progress (user_id, problem_id, is_completed, best_verdict, attempt_count)
          SELECT ?, top.problem_id, FALSE, NULL, 0
          FROM task_oj_problems top
          JOIN learning_tasks lt ON top.task_id = lt.id
          WHERE lt.plan_id = ?
          ON DUPLICATE KEY UPDATE
            is_completed = FALSE,
            best_verdict = NULL,
            attempt_count = 0,
            completed_at = NULL
        `, [studentId, planId]);
        
        results.push({ student_id: studentId, status: 'success' });
      }
      
      await connection.commit();
      connection.release();
      
      // 清除相关缓存
      await cacheUtils.delPattern('learning-plans:*');
      
      res.json({
        success: true,
        message: '学生加入学习计划完成',
        results: results
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    logger.error('教师拉学生加入学习计划失败', { error: error.message, teacherId, planId });
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

module.exports = router;
