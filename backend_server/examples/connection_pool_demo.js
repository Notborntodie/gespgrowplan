const mysql = require('mysql2/promise');

// 演示：传统方式 vs 连接池方式

// 1. 传统方式（每次创建新连接）
async function traditionalWay() {
  console.log('🚀 开始传统方式测试...');
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(async () => {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'test'
      });
      
      await connection.execute('SELECT 1 as test');
      await connection.end();
    });
  }
  
  await Promise.all(promises.map(p => p()));
  const endTime = Date.now();
  console.log(`⏱️ 传统方式耗时: ${endTime - startTime}ms`);
}

// 2. 连接池方式
async function connectionPoolWay() {
  console.log('🚀 开始连接池方式测试...');
  
  // 创建连接池
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 5,  // 限制5个连接用于演示
    acquireTimeout: 10000,
    timeout: 10000
  });
  
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(async () => {
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1 as test');
      connection.release();
    });
  }
  
  await Promise.all(promises.map(p => p()));
  const endTime = Date.now();
  console.log(`⏱️ 连接池方式耗时: ${endTime - startTime}ms`);
  
  await pool.end();
}

// 3. 连接池事件监听演示
async function connectionPoolEvents() {
  console.log('📊 连接池事件监听演示...');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 3
  });
  
  // 监听连接池事件
  pool.on('connection', (connection) => {
    console.log('🆕 新连接已创建');
  });
  
  pool.on('acquire', (connection) => {
    console.log('📥 连接已获取');
  });
  
  pool.on('release', (connection) => {
    console.log('📤 连接已释放');
  });
  
  pool.on('enqueue', () => {
    console.log('⏳ 等待可用连接...');
  });
  
  // 模拟并发请求
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(async () => {
      const connection = await pool.getConnection();
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟查询时间
      connection.release();
    });
  }
  
  await Promise.all(promises.map(p => p()));
  await pool.end();
}

// 4. 连接泄漏演示
async function connectionLeakDemo() {
  console.log('⚠️ 连接泄漏演示...');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 2
  });
  
  // 模拟连接泄漏
  console.log('❌ 模拟连接泄漏...');
  await pool.getConnection(); // 获取连接但不释放
  await pool.getConnection(); // 获取第二个连接但不释放
  
  try {
    console.log('🔄 尝试获取第三个连接...');
    await pool.getConnection(); // 这会超时，因为连接池已满
  } catch (error) {
    console.log('❌ 连接泄漏导致超时:', error.message);
  }
  
  await pool.end();
}

// 5. 正确的连接使用方式
async function correctConnectionUsage() {
  console.log('✅ 正确的连接使用方式演示...');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 2
  });
  
  // 正确的使用方式：使用try-finally确保释放
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(async () => {
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.execute('SELECT 1 as test');
        console.log(`✅ 查询 ${i + 1} 完成`);
      } catch (error) {
        console.error(`❌ 查询 ${i + 1} 失败:`, error.message);
      } finally {
        if (connection) {
          connection.release();
          console.log(`🔄 连接 ${i + 1} 已释放`);
        }
      }
    });
  }
  
  await Promise.all(promises.map(p => p()));
  await pool.end();
}

// 6. 健康检查演示
async function healthCheckDemo() {
  console.log('🏥 健康检查演示...');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 2
  });
  
  const healthCheck = async () => {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ 健康检查通过');
      return true;
    } catch (error) {
      console.error('❌ 健康检查失败:', error.message);
      return false;
    }
  };
  
  // 执行健康检查
  await healthCheck();
  
  // 模拟定期健康检查
  const interval = setInterval(async () => {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      console.log('⚠️ 连接池不健康，考虑重启...');
      clearInterval(interval);
    }
  }, 5000);
  
  // 5秒后停止演示
  setTimeout(() => {
    clearInterval(interval);
    pool.end();
  }, 10000);
}

// 主函数
async function main() {
  console.log('🎯 数据库连接池优化演示\n');
  
  try {
    // 注意：这些演示需要本地MySQL服务器
    // 如果没有本地MySQL，可以注释掉相关演示
    
    // await traditionalWay();
    // await connectionPoolWay();
    // await connectionPoolEvents();
    // await connectionLeakDemo();
    // await correctConnectionUsage();
    // await healthCheckDemo();
    
    console.log('📚 演示完成！请查看上面的文档了解详细原理。');
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    console.log('💡 请确保本地MySQL服务器正在运行，或者修改连接配置。');
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  main();
}

module.exports = {
  traditionalWay,
  connectionPoolWay,
  connectionPoolEvents,
  connectionLeakDemo,
  correctConnectionUsage,
  healthCheckDemo
};
