const { pool } = require('./config/database');

async function debugWrongQuestions() {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== 调试错题接口 ===');
    
    const user_id = 1;
    const limit = 3;
    
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
    
    sql += ' ORDER BY sa.created_at DESC LIMIT ?';
    params.push(Number(limit) || 50);
    
    console.log('SQL:', sql);
    console.log('参数:', params);
    console.log('参数类型:', params.map(p => typeof p));
    
    const [results] = await connection.execute(sql, params);
    console.log('查询结果数量:', results.length);
    
    if (results.length > 0) {
      console.log('第一题ID:', results[0].id);
      
      // 为每道题获取选项
      const questionIds = results.map(row => row.id);
      console.log('题目ID列表:', questionIds);
      
      if (questionIds.length > 0) {
        const optionSql = `
          SELECT o.* FROM options o 
          WHERE o.question_id IN (${questionIds.join(',')})
          ORDER BY o.question_id, o.option_label
        `;
        console.log('选项SQL:', optionSql);
        
        const [optionRows] = await connection.execute(optionSql);
        console.log('选项结果数量:', optionRows.length);
      }
    }
    
  } catch (error) {
    console.error('错题接口错误:', error);
  } finally {
    connection.release();
  }
}

async function debugLeaderboard() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n=== 调试排行榜接口 ===');
    
    const exam_id = 25;
    const limit = 5;
    
    const sql = `
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
      LIMIT ?
    `;
    const params = [exam_id, Number(limit) || 20];
    
    console.log('SQL:', sql);
    console.log('参数:', params);
    console.log('参数类型:', params.map(p => typeof p));
    
    const [results] = await connection.execute(sql, params);
    console.log('查询结果数量:', results.length);
    
  } catch (error) {
    console.error('排行榜接口错误:', error);
  } finally {
    connection.release();
  }
}

async function main() {
  await debugWrongQuestions();
  await debugLeaderboard();
  process.exit(0);
}

main();
