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

async function syncSamples121() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '..', 'oj_samples.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const samples = JSON.parse(jsonData);
    
    // 筛选出题目121的测试样例
    const samples121 = samples.filter(s => s.problem_id === 121);
    
    console.log(`从 JSON 文件读取到题目121的 ${samples121.length} 个测试样例\n`);
    
    await connection.beginTransaction();
    
    // 步骤1: 删除题目121的所有旧测试样例
    console.log('步骤1: 删除题目121的所有旧测试样例...');
    const [deleteResult] = await connection.execute(
      'DELETE FROM oj_samples WHERE problem_id = 121'
    );
    console.log(`✓ 删除了 ${deleteResult.affectedRows} 个旧测试样例\n`);
    
    // 步骤2: 重新插入所有测试样例
    console.log('步骤2: 重新插入所有测试样例...\n');
    const insertedIds = [];
    
    for (let i = 0; i < samples121.length; i++) {
      const sample = samples121[i];
      const {
        problem_id,
        input,
        output,
        explanation,
        is_hidden = false,
        is_displayed = true,
        sort_order = 0
      } = sample;
      
      console.log(`[${i + 1}/${samples121.length}] 插入测试样例 (sort_order: ${sort_order})`);
      
      const [result] = await connection.execute(
        `INSERT INTO oj_samples (
          problem_id, input, output, explanation, 
          is_hidden, is_displayed, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          problem_id,
          input,
          output,
          explanation || null,
          is_hidden,
          is_displayed,
          sort_order
        ]
      );
      
      const sampleId = result.insertId;
      insertedIds.push(sampleId);
      console.log(`  ✓ 测试样例创建成功，ID: ${sampleId}\n`);
    }
    
    await connection.commit();
    
    console.log('=========================================');
    console.log('同步完成！');
    console.log('=========================================');
    console.log(`成功插入 ${insertedIds.length} 个测试样例`);
    console.log(`测试样例ID列表: ${insertedIds.join(', ')}\n`);
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('同步失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行同步
syncSamples121()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

