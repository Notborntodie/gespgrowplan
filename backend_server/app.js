const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// 导入优化模块
const { pool } = require('./config/database');
const { cacheMiddleware, cacheUtils } = require('./config/cache');
// const { rateLimiters } = require('./middleware/rateLimit'); // 临时注释掉限流中间件
const { logger, performanceMonitor, errorLogger } = require('./config/logger');
const securityMiddleware = require('./middleware/security');

// 导入路由
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// 基础中间件
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 安全中间件
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.compression);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.bodyLimit);
/*app.use(securityMiddleware.sqlInjectionProtection);*/
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.userAgentCheck);
app.use(securityMiddleware.originValidation);

// 性能监控中间件
app.use(performanceMonitor);

// 限流中间件（全局）- 临时注释掉
// app.use(rateLimiters.api);

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('健康检查失败', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 注册所有路由
app.use('/', routes);

// 错误处理中间件
app.use(errorLogger);

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('未处理的错误', { error: err.message, stack: err.stack });
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
