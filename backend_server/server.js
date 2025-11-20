// 加载环境变量（必须在其他模块之前加载）
require('dotenv').config();

const app = require('./app');
const { logger } = require('./config/logger');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  logger.info(`服务器启动成功`, {
    port: port,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 设置超时配置，防止socket hang up
server.timeout = 30000; // 30秒超时
server.keepAliveTimeout = 65000; // 65秒keep-alive超时
server.headersTimeout = 66000; // 66秒headers超时

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在优雅关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在优雅关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason: reason, promise: promise });
  process.exit(1);
});

module.exports = server;

