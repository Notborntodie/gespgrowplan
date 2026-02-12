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

async function deleteWrongSamples() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 查找题目122的所有测试用例
    const [samples] = await connection.execute(
      'SELECT id, input, output FROM oj_samples WHERE problem_id = 122 ORDER BY id'
    );
    
    console.log(`找到 ${samples.length} 个测试用例\n`);
    
    // 保留第一个测试用例（原始样例），删除其他T=1的错误测试用例
    const wrongSamples = samples.filter((sample, index) => {
      if (index === 0) return false; // 保留第一个
      // 检查是否是T=1的错误测试用例（输入格式为 "1\n数字"）
      const inputLines = sample.input.split('\n');
      return inputLines.length === 2 && inputLines[0] === '1';
    });
    
    console.log(`需要删除 ${wrongSamples.length} 个错误测试用例\n`);
    
    if (wrongSamples.length > 0) {
      await connection.beginTransaction();
      
      for (const sample of wrongSamples) {
        console.log(`删除测试用例 ID ${sample.id}: ${sample.input.substring(0, 20)}...`);
        await connection.execute('DELETE FROM oj_samples WHERE id = ?', [sample.id]);
      }
      
      await connection.commit();
      console.log(`\n✓ 成功删除 ${wrongSamples.length} 个错误测试用例`);
    } else {
      console.log('没有需要删除的测试用例');
    }
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('删除失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行删除
deleteWrongSamples()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

