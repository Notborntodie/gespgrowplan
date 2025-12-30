require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库连接配置（优先使用环境变量，否则使用本地数据库默认值）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || 'Gesp@2025!',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4',
  connectTimeout: 60000
};

async function importOJSamples() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '..', 'oj_samples.json');
    console.log(`正在读取文件: ${jsonPath}`);
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const samples = JSON.parse(jsonData);
    console.log(`✓ 成功读取 ${samples.length} 个测试样例\n`);
    
    console.log('=========================================');
    console.log('开始导入 OJ 测试样例');
    console.log('=========================================\n');
    
    await connection.beginTransaction();
    
    const insertedIds = [];
    
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const {
        problem_id,
        input,
        output,
        explanation,
        is_hidden = false,
        is_displayed = true,
        sort_order = 0
      } = sample;
      
      console.log(`[${i + 1}/${samples.length}] 正在导入测试样例 (problem_id: ${problem_id})`);
      
      // 验证题目是否存在
      const [problemCheck] = await connection.execute(
        'SELECT id, title FROM oj_problems WHERE id = ?',
        [problem_id]
      );
      
      if (problemCheck.length === 0) {
        throw new Error(`题目 ID ${problem_id} 不存在，请先导入题目`);
      }
      
      console.log(`  题目: ${problemCheck[0].title}`);
      
      // 插入测试样例
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
    console.log('导入完成！');
    console.log('=========================================');
    console.log(`成功导入 ${insertedIds.length} 个测试样例`);
    console.log(`测试样例ID列表: ${insertedIds.join(', ')}\n`);
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('导入失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行导入
importOJSamples()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

