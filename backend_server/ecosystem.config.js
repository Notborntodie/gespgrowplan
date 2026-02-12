module.exports = {
  apps: [{
    name: 'gesp-api',
    script: './server.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '127.0.0.1',
      AL_SERVER_URL: 'http://127.0.0.1:8000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '127.0.0.1',
      AL_SERVER_URL: 'http://127.0.0.1:8000',
      ANIMATIONS_UPLOAD_DIR: '/var/www/gesp-uploads/html'
    },
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 集群配置
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 健康检查
    health_check_grace_period: 3000,
    
    // 环境变量
    env_file: '.env',
    
    // 重启策略
    min_uptime: '10s',
    max_restarts: 10,
    
    // 监控配置
    pmx: true,
    
    // 错误处理
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // 性能监控
    node_args: '--max-old-space-size=1024'
  }]
};

