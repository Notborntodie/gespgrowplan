const mysql = require('mysql2/promise');

// 数据库连接池配置
const dbConfig = {
  host: '106.14.143.27',
  user: 'gesp_user',
  password: 'Gesp@2025!',
  database: 'gesp_practice_system',
  charset: 'utf8mb4',
  // 连接池优化配置
  connectionLimit: 20,           // 连接池大小
  acquireTimeout: 60000,         // 获取连接超时时间
  timeout: 60000,               // 查询超时时间
  reconnect: true,              // 自动重连
  queueLimit: 0,                // 队列限制（0表示无限制）
  enableKeepAlive: true,        // 启用连接保活
  keepAliveInitialDelay: 0,     // 保活初始延迟
  // 高并发优化
  multipleStatements: false,    // 禁用多语句查询（安全考虑）
  dateStrings: true,            // 日期作为字符串返回
  supportBigNumbers: true,      // 支持大数字
  bigNumberStrings: true,       // 大数字作为字符串
  // 连接池监控
  acquireTimeout: 60000,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  maxIdle: 60000,               // 最大空闲时间
  idleTimeout: 60000,           // 空闲超时
  // 错误处理
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 连接池事件监听
pool.on('connection', (connection) => {
  console.log('新的数据库连接已创建');
  
  // 设置连接级别的配置
  connection.query('SET SESSION sql_mode = "NO_AUTO_VALUE_ON_ZERO"');
  connection.query('SET SESSION time_zone = "+08:00"');
});

pool.on('acquire', (connection) => {
  console.log('连接 %d 已从连接池获取', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('连接 %d 已释放回连接池', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('等待可用的连接...');
});

// 健康检查函数
const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('数据库连接池健康检查通过');
    return true;
  } catch (error) {
    console.error('数据库连接池健康检查失败:', error);
    return false;
  }
};

// 定期健康检查（每5分钟）
setInterval(healthCheck, 5 * 60 * 1000);

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭数据库连接池...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  healthCheck
};

