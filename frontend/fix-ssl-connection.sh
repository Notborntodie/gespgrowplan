#!/bin/bash

# SSL 连接问题快速修复脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 加载配置
if [ -f ".deploy-config" ]; then
    source .deploy-config
fi

SERVER_IP="${DEPLOY_SERVER_IP:-106.14.143.27}"
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
NGINX_CONFIG_PATH="${NGINX_CONFIG_PATH:-/etc/nginx/conf.d/gesp-frontend.conf}"

echo ""
echo "=========================================="
echo "  SSL 连接问题修复脚本"
echo "=========================================="
echo ""

# 步骤 1: 备份当前配置
log_info "步骤 1: 备份当前 Nginx 配置..."
ssh ${SERVER_USER}@${SERVER_IP} "
    cp ${NGINX_CONFIG_PATH} ${NGINX_CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)
"
log_success "配置已备份"
echo ""

# 步骤 2: 检查并优化 SSL 配置
log_info "步骤 2: 优化 SSL 配置..."

# 在服务器上直接修改配置
result=$(ssh ${SERVER_USER}@${SERVER_IP} "
    # 检查是否已有 ssl_buffer_size 配置
    if ! grep -q 'ssl_buffer_size' ${NGINX_CONFIG_PATH}; then
        # 在 ssl_session_tickets 后添加优化配置
        sed -i '/ssl_session_tickets on;/a\    \n    # 提高兼容性的额外 SSL 配置\n    ssl_buffer_size 8k;\n    ssl_early_data off;' ${NGINX_CONFIG_PATH}
        echo 'added_ssl_config'
    else
        echo 'ssl_config_exists'
    fi
    
    # 确保 listen 443 ssl http2 支持 HTTP/2
    if grep -q 'listen 443 ssl;' ${NGINX_CONFIG_PATH} && ! grep -q 'listen 443 ssl http2;' ${NGINX_CONFIG_PATH}; then
        sed -i 's/listen 443 ssl;/listen 443 ssl http2;/' ${NGINX_CONFIG_PATH}
        echo 'enabled_http2'
    fi
" 2>&1)

if echo "$result" | grep -q "added_ssl_config"; then
    log_success "已添加 SSL 优化配置"
elif echo "$result" | grep -q "ssl_config_exists"; then
    log_info "SSL 优化配置已存在"
fi

if echo "$result" | grep -q "enabled_http2"; then
    log_success "已启用 HTTP/2 支持"
fi

echo ""

# 步骤 3: 测试配置
log_info "步骤 3: 测试 Nginx 配置..."
nginx_test=$(ssh ${SERVER_USER}@${SERVER_IP} "nginx -t" 2>&1)
if echo "$nginx_test" | grep -q "syntax is ok" && echo "$nginx_test" | grep -q "test is successful"; then
    log_success "Nginx 配置语法正确"
    echo "$nginx_test" | grep -E "syntax|test"
else
    log_error "Nginx 配置有错误："
    echo "$nginx_test"
    log_warning "正在恢复备份..."
    ssh ${SERVER_USER}@${SERVER_IP} "cp ${NGINX_CONFIG_PATH}.backup.* ${NGINX_CONFIG_PATH}" 2>/dev/null || true
    exit 1
fi
echo ""

# 步骤 4: 重载 Nginx
log_info "步骤 4: 重载 Nginx 配置..."
if ssh ${SERVER_USER}@${SERVER_IP} "systemctl reload nginx"; then
    log_success "Nginx 已重载"
else
    log_error "Nginx 重载失败"
    exit 1
fi
echo ""

# 步骤 5: 等待服务就绪
log_info "步骤 5: 等待服务就绪..."
sleep 3

# 步骤 6: 测试连接
log_info "步骤 6: 测试 HTTPS 连接..."
DOMAIN_NAME="${DOMAIN_NAME:-zhengyanchen.cn}"

# 测试服务器本地连接
local_test=$(ssh ${SERVER_USER}@${SERVER_IP} "curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 5 https://localhost/ 2>&1" || echo "failed")
if [ "$local_test" = "200" ] || [ "$local_test" = "301" ] || [ "$local_test" = "302" ]; then
    log_success "服务器本地连接正常 (HTTP状态码: $local_test)"
else
    log_warning "服务器本地连接测试失败"
fi

# 测试外部连接
external_test=$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "https://${DOMAIN_NAME}/" 2>&1 || echo "failed")
if [ "$external_test" = "200" ] || [ "$external_test" = "301" ] || [ "$external_test" = "302" ]; then
    log_success "外部 HTTPS 连接正常 (HTTP状态码: $external_test)"
    echo ""
    log_success "问题已解决！"
else
    log_error "外部 HTTPS 连接仍然失败"
    echo ""
    log_warning "可能的原因："
    echo "  1. 云服务器安全组未开放 443 端口（最可能）"
    echo "  2. 网络中间设备（WAF、负载均衡器）拦截"
    echo "  3. DNS 解析问题"
    echo ""
    log_info "请检查："
    echo "  1. 云服务器控制台 → 安全组 → 确保开放 443 端口"
    echo "  2. 执行: nc -zv ${DOMAIN_NAME} 443"
    echo "  3. 执行: curl -v https://${DOMAIN_NAME}/"
fi

echo ""
echo "=========================================="
echo "  修复完成"
echo "=========================================="
echo ""

