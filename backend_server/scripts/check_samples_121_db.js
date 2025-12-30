require('dotenv').config();
const mysql = require('mysql2/promise');

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

async function checkSamples121() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 查询题目121的所有测试样例
    const [samples] = await connection.execute(
      `SELECT id, problem_id, input, output, is_hidden, is_displayed, sort_order 
       FROM oj_samples 
       WHERE problem_id = 121 
       ORDER BY sort_order`
    );
    
    console.log(`题目121共有 ${samples.length} 个测试样例\n`);
    console.log('=========================================');
    
    for (const sample of samples) {
      console.log(`sort_order: ${sample.sort_order}`);
      console.log(`  ID: ${sample.id}`);
      console.log(`  is_displayed: ${sample.is_displayed}, is_hidden: ${sample.is_hidden}`);
      console.log(`  输入: ${sample.input.substring(0, 40)}...`);
      console.log(`  输出: ${sample.output}`);
      console.log('');
    }
    
    // 统计
    const displayed = samples.filter(s => s.is_displayed).length;
    const hidden = samples.filter(s => s.is_hidden).length;
    const notDisplayedNotHidden = samples.filter(s => !s.is_displayed && !s.is_hidden).length;
    
    console.log('=========================================');
    console.log('统计信息：');
    console.log(`  展示样例: ${displayed} 个`);
    console.log(`  不展示但不隐藏: ${notDisplayedNotHidden} 个`);
    console.log(`  隐藏样例: ${hidden} 个`);
    console.log('=========================================\n');
    
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
checkSamples121()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

