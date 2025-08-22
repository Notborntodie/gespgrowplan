#!/bin/bash

# GESP后端部署脚本
echo "🚀 开始部署GESP后端服务..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node -v)
echo "当前Node.js版本: $node_version"

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 检查Redis是否运行
echo "🔍 检查Redis服务..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis服务未运行，请先启动Redis"
    echo "   启动命令: redis-server"
    exit 1
fi
echo "✅ Redis服务正常"

# 检查数据库连接
echo "🔍 检查数据库连接..."
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '106.14.143.27',
  user: 'gesp_user',
  password: 'Gesp@2025!',
  database: 'gesp_practice_system'
});

pool.getConnection()
  .then(conn => {
    console.log('✅ 数据库连接成功');
    conn.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查数据库配置"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads

# 设置环境变量
export NODE_ENV=production

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop gesp-api 2>/dev/null || true
pm2 delete gesp-api 2>/dev/null || true

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
pm2 status

# 健康检查
echo "🏥 执行健康检查..."
for i in {1..5}; do
    response=$(curl -s http://localhost:3000/health || echo "failed")
    if [[ $response == *"healthy"* ]]; then
        echo "✅ 服务健康检查通过"
        break
    else
        echo "⏳ 等待服务启动... ($i/5)"
        sleep 2
    fi
done

if [[ $response != *"healthy"* ]]; then
    echo "❌ 服务健康检查失败"
    pm2 logs gesp-api --lines 20
    exit 1
fi

# 保存PM2配置
echo "💾 保存PM2配置..."
pm2 save

# 设置开机自启
echo "🔧 设置开机自启..."
pm2 startup

echo "🎉 部署完成！"
echo "📊 查看服务状态: pm2 status"
echo "📋 查看日志: pm2 logs gesp-api"
echo "🖥️  监控面板: pm2 monit"
echo "🌐 服务地址: http://localhost:3000"
echo "🏥 健康检查: http://localhost:3000/health"

