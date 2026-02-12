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

async function checkUpdatedProblems() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 查询刚更新的两道题目
    const [rows] = await connection.execute(
      'SELECT id, title, description, input_format, output_format, data_range FROM oj_problems WHERE id IN (121, 122) ORDER BY id'
    );
    
    for (const problem of rows) {
      console.log('=========================================');
      console.log(`题目 ID: ${problem.id}`);
      console.log(`标题: ${problem.title}\n`);
      
      console.log('-----------------------------------------');
      console.log('题目描述 (description):');
      console.log('-----------------------------------------');
      console.log(problem.description);
      console.log('\n');
      
      console.log('-----------------------------------------');
      console.log('输入格式 (input_format):');
      console.log('-----------------------------------------');
      console.log(problem.input_format || '(空)');
      console.log('\n');
      
      console.log('-----------------------------------------');
      console.log('输出格式 (output_format):');
      console.log('-----------------------------------------');
      console.log(problem.output_format || '(空)');
      console.log('\n');
      
      console.log('-----------------------------------------');
      console.log('数据范围 (data_range):');
      console.log('-----------------------------------------');
      console.log(problem.data_range || '(空)');
      console.log('\n');
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
checkUpdatedProblems()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

