require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || 'Gesp@2025!',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4',
  connectTimeout: 60000
};

async function updateDescriptions() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '..', 'oj_problems.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const problems = JSON.parse(jsonData);
    
    await connection.beginTransaction();
    
    for (const problem of problems) {
      const { title, description, input_format, output_format, data_range } = problem;
      
      console.log(`正在更新题目: ${title}`);
      
      await connection.execute(
        `UPDATE oj_problems 
         SET description = ?, input_format = ?, output_format = ?, data_range = ?
         WHERE title = ?`,
        [description, input_format || null, output_format || null, data_range || null, title]
      );
      
      console.log(`  ✓ 更新成功\n`);
    }
    
    await connection.commit();
    console.log('所有题目描述更新完成！');
    
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
updateDescriptions()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

