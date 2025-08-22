const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '106.14.143.27',
  port: 3306,
  user: 'gesp_user',
  password: 'Gesp@2025!',
  database: 'gesp_practice_system',
  charset: 'utf8mb4',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

async function testDatabaseConnection() {
  console.log('=== 数据库远程连接测试 ===');
  console.log('服务器IP: 106.14.143.27');
  console.log('端口: 3306');
  console.log('数据库: gesp_practice_system');
  console.log('用户名: gesp_user');
  console.log('');

  let connection;
  
  try {
    // 测试数据库连接
    console.log('正在测试数据库连接...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 测试简单查询
    console.log('正在测试简单查询...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 简单查询成功:', rows[0]);

    // 检查数据库表
    console.log('正在检查数据库表...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ 数据库表数量: ${tables.length}`);

    // 检查关键表数据
    console.log('正在检查关键表数据...');
    
    try {
      const [questionCount] = await connection.execute('SELECT COUNT(*) as count FROM questions');
      console.log(`✅ questions表: ${questionCount[0].count} 条记录`);
    } catch (error) {
      console.log('⚠️ questions表查询失败:', error.message);
    }

    try {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ users表: ${userCount[0].count} 条记录`);
    } catch (error) {
      console.log('⚠️ users表查询失败:', error.message);
    }

    try {
      const [examCount] = await connection.execute('SELECT COUNT(*) as count FROM exams');
      console.log(`✅ exams表: ${examCount[0].count} 条记录`);
    } catch (error) {
      console.log('⚠️ exams表查询失败:', error.message);
    }

    // 测试查询性能
    console.log('正在测试查询性能...');
    const startTime = Date.now();
    await connection.execute('SELECT COUNT(*) FROM questions');
    const endTime = Date.now();
    const queryTime = (endTime - startTime) / 1000;
    console.log(`✅ 查询响应时间: ${queryTime}秒`);

    console.log('');
    console.log('=== 测试完成 ===');
    console.log('✅ 远程数据库连接测试成功！');
    console.log('');
    console.log('连接配置:');
    console.log(JSON.stringify(dbConfig, null, 2));

  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    console.log('');
    console.log('可能的原因：');
    console.log('1. 网络连接问题');
    console.log('2. 用户名或密码错误');
    console.log('3. 数据库不存在');
    console.log('4. 用户没有远程访问权限');
    console.log('5. 防火墙阻止连接');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行测试
testDatabaseConnection().catch(console.error);
