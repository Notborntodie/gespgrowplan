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

async function updateExplanations() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '..', 'oj_samples.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const samples = JSON.parse(jsonData);
    
    await connection.beginTransaction();
    
    for (const sample of samples) {
      const { problem_id, input, output, explanation } = sample;
      
      console.log(`正在更新测试样例 (problem_id: ${problem_id})`);
      console.log(`  输入: ${input.substring(0, 50)}...`);
      
      // 根据 problem_id, input, output 匹配并更新
      await connection.execute(
        `UPDATE oj_samples 
         SET explanation = ?
         WHERE problem_id = ? AND input = ? AND output = ?`,
        [explanation, problem_id, input, output]
      );
      
      console.log(`  ✓ 更新成功\n`);
    }
    
    await connection.commit();
    console.log('所有测试样例的 explanation 更新完成！');
    
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
updateExplanations()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

