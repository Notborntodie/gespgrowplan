const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'gesp-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // 访问日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 性能监控中间件
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  const startHr = process.hrtime();
  
  // 记录请求开始
  logger.info('请求开始', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // 重写res.json方法以记录响应时间
  const originalJson = res.json;
  res.json = function(body) {
    const end = Date.now();
    const endHr = process.hrtime(startHr);
    const duration = end - start;
    const durationHr = (endHr[0] * 1000 + endHr[1] / 1000000).toFixed(2);
    
    // 记录请求完成
    logger.info('请求完成', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationHr: `${durationHr}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // 记录慢请求
    if (duration > 1000) {
      logger.warn('慢请求警告', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
    
    return originalJson.call(this, body);
  };
  
  // 重写res.send方法
  const originalSend = res.send;
  res.send = function(body) {
    const end = Date.now();
    const endHr = process.hrtime(startHr);
    const duration = end - start;
    const durationHr = (endHr[0] * 1000 + endHr[1] / 1000000).toFixed(2);
    
    logger.info('请求完成', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationHr: `${durationHr}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  logger.error('请求错误', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// 数据库查询日志
const dbLogger = {
  query: (sql, params, duration) => {
    logger.debug('数据库查询', {
      sql,
      params,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // 记录慢查询
    if (duration > 100) {
      logger.warn('慢查询警告', {
        sql,
        params,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  error: (error, sql, params) => {
    logger.error('数据库错误', {
      error: error.message,
      sql,
      params,
      timestamp: new Date().toISOString()
    });
  }
};

// 缓存日志
const cacheLogger = {
  hit: (key) => {
    logger.debug('缓存命中', { key });
  },
  
  miss: (key) => {
    logger.debug('缓存未命中', { key });
  },
  
  set: (key, duration) => {
    logger.debug('缓存设置', { key, duration });
  },
  
  error: (error, operation) => {
    logger.error('缓存错误', { error: error.message, operation });
  }
};

// 限流日志
const rateLimitLogger = {
  exceeded: (ip, url, limit) => {
    logger.warn('限流触发', { ip, url, limit });
  },
  
  reset: (ip, url) => {
    logger.info('限流重置', { ip, url });
  }
};

module.exports = {
  logger,
  performanceMonitor,
  errorLogger,
  dbLogger,
  cacheLogger,
  rateLimitLogger
};

