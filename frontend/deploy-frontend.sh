#!/bin/bash

# 信奥成长计划前端部署脚本
# 支持通过环境变量或配置文件自定义服务器和API地址

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数（需要先定义）
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 加载配置文件（如果存在）
if [ -f ".deploy-config" ]; then
    log_info "加载部署配置文件..."
    source .deploy-config
fi

# 服务器配置（可通过环境变量或配置文件覆盖）
SERVER_IP="${DEPLOY_SERVER_IP:-106.14.143.27}"
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/gesp-frontend}"
NGINX_CONFIG_PATH="${NGINX_CONFIG_PATH:-/etc/nginx/conf.d/gesp-frontend.conf}"

# API配置（用于构建时设置环境变量）
API_BASE_URL="${API_BASE_URL:-http://106.14.143.27:3000/api}"
AI_API_BASE_URL="${AI_API_BASE_URL:-http://106.14.143.27:8000/api}"

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 构建前端（带环境变量）
build_frontend() {
    log_info "开始构建前端应用..."
    log_info "API地址: ${API_BASE_URL}"
    log_info "AI API地址: ${AI_API_BASE_URL}"
    
    # 设置环境变量并构建
    export VITE_API_BASE_URL="${API_BASE_URL}"
    export VITE_AI_API_BASE_URL="${AI_API_BASE_URL}"
    
    npm run build
    
    log_success "前端构建完成"
}

# 检查构建文件是否存在
check_build_files() {
    log_info "检查构建文件..."
    
    if [ ! -d "dist" ]; then
        log_warning "dist目录不存在，将自动构建..."
        build_frontend
        return
    fi
    
    if [ ! -f "dist/index.html" ]; then
        log_warning "dist/index.html不存在，将重新构建..."
        build_frontend
        return
    fi
    
    log_success "构建文件检查通过"
}

# 创建部署目录
create_deploy_directory() {
    log_info "在服务器上创建部署目录..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"
    
    log_success "部署目录创建完成"
}

# 上传文件到服务器
upload_files() {
    log_info "上传文件到服务器..."
    
    # 先清空服务器上的目录
    ssh ${SERVER_USER}@${SERVER_IP} "rm -rf ${DEPLOY_PATH}/*"
    
    # 使用scp上传文件
    scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/
    
    log_success "文件上传完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 创建Nginx配置文件
    cat > /tmp/gesp-frontend.conf << EOF
server {
    listen 80;
    server_name ${SERVER_IP};
    root ${DEPLOY_PATH};
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 处理Vue Router的history模式
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # 上传配置文件到服务器
    scp /tmp/gesp-frontend.conf ${SERVER_USER}@${SERVER_IP}:${NGINX_CONFIG_PATH}
    
    # 测试配置并重载Nginx
    ssh ${SERVER_USER}@${SERVER_IP} "
        nginx -t && systemctl reload nginx
    "
    
    # 清理临时文件
    rm /tmp/gesp-frontend.conf
    
    log_success "Nginx配置完成"
}

# 设置文件权限
set_permissions() {
    log_info "设置文件权限..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "
        chown -R www-data:www-data ${DEPLOY_PATH}
        chmod -R 755 ${DEPLOY_PATH}
    "
    
    log_success "文件权限设置完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    sleep 5
    
    if curl -f http://${SERVER_IP}/ > /dev/null 2>&1; then
        log_success "健康检查通过！"
        log_success "前端应用已成功部署到: http://${SERVER_IP}"
    else
        log_warning "健康检查失败，请检查服务器状态"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "部署信息："
    echo "  - 服务器地址: ${SERVER_IP}"
    echo "  - 部署路径: ${DEPLOY_PATH}"
    echo "  - 访问地址: http://${SERVER_IP}"
    echo "  - Nginx配置: ${NGINX_CONFIG_PATH}"
    echo ""
    echo "管理命令："
    echo "  - 查看Nginx状态: ssh ${SERVER_USER}@${SERVER_IP} 'systemctl status nginx'"
    echo "  - 查看Nginx日志: ssh ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/error.log'"
    echo "  - 重新加载Nginx: ssh ${SERVER_USER}@${SERVER_IP} 'systemctl reload nginx'"
    echo ""
}

# 显示配置信息
show_config() {
    log_info "当前部署配置："
    echo "  - 服务器IP: ${SERVER_IP}"
    echo "  - 服务器用户: ${SERVER_USER}"
    echo "  - 部署路径: ${DEPLOY_PATH}"
    echo "  - API地址: ${API_BASE_URL}"
    echo "  - AI API地址: ${AI_API_BASE_URL}"
    echo ""
    log_info "提示: 可以通过以下方式自定义配置："
    echo "  1. 创建 .deploy-config 文件并设置变量"
    echo "  2. 使用环境变量: DEPLOY_SERVER_IP, API_BASE_URL 等"
    echo "  3. 在命令行中设置: DEPLOY_SERVER_IP=xxx ./deploy-frontend.sh"
    echo ""
}

# 主函数
main() {
    log_info "开始部署GESP前端到 ${SERVER_IP}"
    
    show_config
    
    # 如果指定了 --build 参数或 dist 目录不存在，则先构建
    if [ "$1" == "--build" ] || [ ! -d "dist" ]; then
        build_frontend
    else
        check_build_files
    fi
    
    create_deploy_directory
    upload_files
    configure_nginx
    set_permissions
    health_check
    show_deployment_info
}

# 执行主函数
main "$@"
