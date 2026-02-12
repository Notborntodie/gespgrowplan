require('dotenv').config();
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4',
  connectTimeout: 60000
};

async function checkSamples() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 查询题目122的所有测试样例
    const [samples] = await connection.execute(
      `SELECT id, problem_id, input, output, explanation, is_hidden, is_displayed, sort_order 
       FROM oj_samples 
       WHERE problem_id = 122 
       ORDER BY sort_order, id`
    );
    
    console.log(`题目122共有 ${samples.length} 个测试样例\n`);
    console.log('=========================================');
    
    for (const sample of samples) {
      console.log(`ID: ${sample.id}, sort_order: ${sample.sort_order}`);
      console.log(`  is_displayed: ${sample.is_displayed}, is_hidden: ${sample.is_hidden}`);
      console.log(`  输入: ${sample.input.substring(0, 50)}...`);
      console.log(`  输出: ${sample.output.substring(0, 30)}...`);
      console.log('');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行查询
checkSamples()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

