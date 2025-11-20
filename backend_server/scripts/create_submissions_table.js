const { pool } = require('../config/database');

async function createSubmissionsTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('开始创建 oj_submissions 表...');
    
    // 创建提交记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS oj_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        problem_id INT NOT NULL,
        code TEXT NOT NULL,
        language VARCHAR(20) NOT NULL DEFAULT 'cpp',
        status ENUM('queued', 'judging', 'completed', 'error') NOT NULL DEFAULT 'queued',
        verdict VARCHAR(50) DEFAULT NULL COMMENT 'Accepted, Wrong Answer, Time Limit Exceeded, etc.',
        total_tests INT DEFAULT 0,
        passed_tests INT DEFAULT 0,
        results JSON DEFAULT NULL COMMENT '每个测试点的详细结果',
        error_message TEXT DEFAULT NULL,
        submit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        judge_start_time DATETIME DEFAULT NULL,
        judge_end_time DATETIME DEFAULT NULL,
        judge_duration INT DEFAULT NULL COMMENT '判题耗时（毫秒）',
        user_id INT DEFAULT NULL COMMENT '用户ID（预留）',
        ip_address VARCHAR(50) DEFAULT NULL,
        INDEX idx_problem_id (problem_id),
        INDEX idx_status (status),
        INDEX idx_submit_time (submit_time),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (problem_id) REFERENCES oj_problems(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OJ提交记录表'
    `);
    
    console.log('✓ oj_submissions 表创建成功');
    
    // 检查表结构
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'oj_submissions'"
    );
    
    if (tables.length > 0) {
      const [columns] = await connection.query(
        "DESCRIBE oj_submissions"
      );
      console.log('\n表结构：');
      console.table(columns);
    }
    
    console.log('\n✅ 提交记录表创建完成！');
    
  } catch (error) {
    console.error('❌ 创建表失败：', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行
createSubmissionsTable().catch(console.error);

