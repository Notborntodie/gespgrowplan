require('dotenv').config();
const mysql = require('mysql2/promise');

// 数据库连接配置（优先使用环境变量，否则使用本地数据库默认值）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4',
  connectTimeout: 60000
};

async function updateTitles() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 更新题目ID 121 和 122 的标题
    const problems = [
      { id: 121, title: '小杨的爱心快递' },
      { id: 122, title: '手机电量显示' }
    ];
    
    await connection.beginTransaction();
    
    for (const problem of problems) {
      const newTitle = `[GESP202512 一级] ${problem.title}`;
      
      await connection.execute(
        'UPDATE oj_problems SET title = ? WHERE id = ?',
        [newTitle, problem.id]
      );
      
      console.log(`✓ 已更新题目 ID ${problem.id}: ${newTitle}`);
    }
    
    await connection.commit();
    console.log('\n所有标题更新完成！');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('更新失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行更新
updateTitles()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

