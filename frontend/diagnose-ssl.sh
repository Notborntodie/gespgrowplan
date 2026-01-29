#!/bin/bash

# SSL/TLS 连接问题诊断脚本
# 用于排查 HTTPS 连接 "Connection reset by peer" 错误

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 加载配置文件
if [ -f ".deploy-config" ]; then
    log_info "加载部署配置文件..."
    source .deploy-config
fi

# 服务器配置
SERVER_IP="${DEPLOY_SERVER_IP:-106.14.143.27}"
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
DOMAIN_NAME="${DOMAIN_NAME:-zhengyanchen.cn}"
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/letsencrypt/live/zhengyanchen.cn/fullchain.pem}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/letsencrypt/live/zhengyanchen.cn/privkey.pem}"

echo ""
echo "=========================================="
echo "  SSL/TLS 连接问题诊断工具"
echo "=========================================="
echo ""
echo "服务器: ${SERVER_USER}@${SERVER_IP}"
echo "域名: ${DOMAIN_NAME}"
echo ""

# 步骤 1: 检查服务器连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 1: 检查服务器 SSH 连接..."
if ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" > /dev/null 2>&1; then
    log_success "服务器 SSH 连接正常"
else
    log_error "无法连接到服务器，请检查网络和 SSH 配置"
    exit 1
fi
echo ""

# 步骤 2: 检查 Nginx 服务状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 2: 检查 Nginx 服务状态..."
nginx_status=$(ssh ${SERVER_USER}@${SERVER_IP} "systemctl is-active nginx" 2>/dev/null || echo "unknown")
if [ "$nginx_status" = "active" ]; then
    log_success "Nginx 服务正在运行"
    # 显示详细状态
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl status nginx --no-pager -l" | head -10
else
    log_error "Nginx 服务未运行 (状态: $nginx_status)"
    log_info "尝试启动 Nginx..."
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl start nginx" 2>&1 || true
    sleep 2
    nginx_status=$(ssh ${SERVER_USER}@${SERVER_IP} "systemctl is-active nginx" 2>/dev/null || echo "unknown")
    if [ "$nginx_status" = "active" ]; then
        log_success "Nginx 已启动"
    else
        log_error "无法启动 Nginx，请检查配置"
    fi
fi
echo ""

# 步骤 3: 检查 Nginx 配置语法
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 3: 检查 Nginx 配置语法..."
nginx_test=$(ssh ${SERVER_USER}@${SERVER_IP} "nginx -t" 2>&1)
if echo "$nginx_test" | grep -q "syntax is ok" && echo "$nginx_test" | grep -q "test is successful"; then
    log_success "Nginx 配置语法正确"
else
    log_error "Nginx 配置有错误："
    echo "$nginx_test"
fi
echo ""

# 步骤 4: 检查 443 端口监听
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 4: 检查 443 端口监听状态..."
port_443=$(ssh ${SERVER_USER}@${SERVER_IP} "netstat -tlnp 2>/dev/null | grep ':443 ' || ss -tlnp 2>/dev/null | grep ':443 '" || echo "")
if [ -n "$port_443" ]; then
    log_success "443 端口正在监听"
    echo "$port_443"
else
    log_error "443 端口未监听"
    log_warning "Nginx 可能未正确配置 HTTPS"
fi
echo ""

# 步骤 5: 检查 80 端口监听
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 5: 检查 80 端口监听状态..."
port_80=$(ssh ${SERVER_USER}@${SERVER_IP} "netstat -tlnp 2>/dev/null | grep ':80 ' || ss -tlnp 2>/dev/null | grep ':80 '" || echo "")
if [ -n "$port_80" ]; then
    log_success "80 端口正在监听"
    echo "$port_80"
else
    log_warning "80 端口未监听"
fi
echo ""

# 步骤 6: 检查 SSL 证书文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 6: 检查 SSL 证书文件..."

# 检查证书文件
cert_exists=$(ssh ${SERVER_USER}@${SERVER_IP} "test -f ${SSL_CERT_PATH} && echo 'yes' || echo 'no'")
if [ "$cert_exists" = "yes" ]; then
    log_success "SSL 证书文件存在: ${SSL_CERT_PATH}"
    # 检查证书信息
    cert_info=$(ssh ${SERVER_USER}@${SERVER_IP} "openssl x509 -in ${SSL_CERT_PATH} -noout -subject -dates 2>/dev/null" || echo "")
    if [ -n "$cert_info" ]; then
        echo "证书信息:"
        echo "$cert_info" | sed 's/^/  /'
    fi
else
    log_error "SSL 证书文件不存在: ${SSL_CERT_PATH}"
fi

# 检查密钥文件
key_exists=$(ssh ${SERVER_USER}@${SERVER_IP} "test -f ${SSL_KEY_PATH} && echo 'yes' || echo 'no'")
if [ "$key_exists" = "yes" ]; then
    log_success "SSL 密钥文件存在: ${SSL_KEY_PATH}"
else
    log_error "SSL 密钥文件不存在: ${SSL_KEY_PATH}"
fi
echo ""

# 步骤 7: 检查证书文件权限
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 7: 检查证书文件权限..."
if [ "$cert_exists" = "yes" ] && [ "$key_exists" = "yes" ]; then
    cert_perms=$(ssh ${SERVER_USER}@${SERVER_IP} "ls -la ${SSL_CERT_PATH} | awk '{print \$1, \$3, \$4}'")
    key_perms=$(ssh ${SERVER_USER}@${SERVER_IP} "ls -la ${SSL_KEY_PATH} | awk '{print \$1, \$3, \$4}'")
    
    echo "证书权限: $cert_perms"
    echo "密钥权限: $key_perms"
    
    # 检查 Nginx 用户
    nginx_user=$(ssh ${SERVER_USER}@${SERVER_IP} "ps aux | grep 'nginx: worker' | head -1 | awk '{print \$1}'" || echo "www-data")
    if [ -z "$nginx_user" ] || [ "$nginx_user" = "root" ]; then
        nginx_user=$(ssh ${SERVER_USER}@${SERVER_IP} "id -u www-data >/dev/null 2>&1 && echo 'www-data' || echo 'nginx'")
    fi
    
    log_info "Nginx 运行用户: $nginx_user"
    
    # 检查证书目录权限
    cert_dir=$(dirname ${SSL_CERT_PATH})
    dir_perms=$(ssh ${SERVER_USER}@${SERVER_IP} "ls -ld ${cert_dir} | awk '{print \$1, \$3, \$4}'")
    echo "证书目录权限: $dir_perms"
else
    log_warning "跳过权限检查（证书文件不存在）"
fi
echo ""

# 步骤 8: 检查 Nginx 错误日志
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 8: 检查 Nginx 错误日志（最近 20 行）..."
error_log=$(ssh ${SERVER_USER}@${SERVER_IP} "tail -20 /var/log/nginx/error.log 2>/dev/null" || echo "")
if [ -n "$error_log" ]; then
    if echo "$error_log" | grep -qi "error\|fail\|warn"; then
        log_warning "发现错误或警告："
        echo "$error_log" | grep -i "error\|fail\|warn" | tail -10 | sed 's/^/  /'
    else
        log_success "错误日志中未发现明显问题"
    fi
else
    log_warning "无法读取错误日志或日志为空"
fi
echo ""

# 步骤 9: 检查防火墙规则
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 9: 检查防火墙规则..."

# 检查 iptables
iptables_check=$(ssh ${SERVER_USER}@${SERVER_IP} "iptables -L -n 2>/dev/null | grep -E '443|80' || echo '未找到相关规则'" || echo "")
if [ -n "$iptables_check" ] && [ "$iptables_check" != "未找到相关规则" ]; then
    log_info "iptables 规则："
    echo "$iptables_check" | sed 's/^/  /'
else
    log_info "iptables: 未找到明确的 443/80 端口规则"
fi

# 检查 firewalld
firewalld_check=$(ssh ${SERVER_USER}@${SERVER_IP} "firewall-cmd --list-all 2>/dev/null | grep -E '443|80|https|http' || echo ''" || echo "")
if [ -n "$firewalld_check" ]; then
    log_info "firewalld 规则："
    echo "$firewalld_check" | sed 's/^/  /'
fi

# 检查 ufw
ufw_check=$(ssh ${SERVER_USER}@${SERVER_IP} "ufw status 2>/dev/null | grep -E '443|80' || echo ''" || echo "")
if [ -n "$ufw_check" ]; then
    log_info "ufw 规则："
    echo "$ufw_check" | sed 's/^/  /'
fi
echo ""

# 步骤 10: 测试本地连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 10: 在服务器上测试本地 HTTPS 连接..."
local_test=$(ssh ${SERVER_USER}@${SERVER_IP} "curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 5 https://localhost/ 2>&1" || echo "failed")
if [ "$local_test" = "200" ] || [ "$local_test" = "301" ] || [ "$local_test" = "302" ]; then
    log_success "服务器本地 HTTPS 连接正常 (HTTP状态码: $local_test)"
else
    log_error "服务器本地 HTTPS 连接失败"
    log_info "尝试使用 127.0.0.1 测试..."
    local_test2=$(ssh ${SERVER_USER}@${SERVER_IP} "curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 5 https://127.0.0.1/ 2>&1" || echo "failed")
    if [ "$local_test2" = "200" ] || [ "$local_test2" = "301" ] || [ "$local_test2" = "302" ]; then
        log_success "使用 127.0.0.1 连接正常 (HTTP状态码: $local_test2)"
    else
        log_error "本地连接测试失败，可能是 Nginx 配置问题"
    fi
fi
echo ""

# 步骤 11: 测试外部连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 11: 测试外部 HTTPS 连接..."
external_test=$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "https://${DOMAIN_NAME}/" 2>&1 || echo "failed")
if [ "$external_test" = "200" ] || [ "$external_test" = "301" ] || [ "$external_test" = "302" ]; then
    log_success "外部 HTTPS 连接正常 (HTTP状态码: $external_test)"
else
    log_error "外部 HTTPS 连接失败"
    log_info "详细错误信息："
    curl -v -k --connect-timeout 10 "https://${DOMAIN_NAME}/" 2>&1 | tail -15 | sed 's/^/  /'
fi
echo ""

# 步骤 12: 使用 openssl 测试 SSL 握手
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "步骤 12: 使用 openssl 测试 SSL 握手..."
ssl_test=$(echo | openssl s_client -connect ${DOMAIN_NAME}:443 -servername ${DOMAIN_NAME} 2>&1 | grep -E "Verify return code|subject=|issuer=" || echo "")
if [ -n "$ssl_test" ]; then
    log_info "SSL 握手信息："
    echo "$ssl_test" | sed 's/^/  /'
    
    # 检查证书验证
    if echo "$ssl_test" | grep -q "Verify return code: 0"; then
        log_success "SSL 证书验证通过"
    else
        verify_code=$(echo "$ssl_test" | grep "Verify return code" | awk -F: '{print $2}' | xargs)
        log_warning "SSL 证书验证返回码: $verify_code"
    fi
else
    log_error "无法完成 SSL 握手"
fi
echo ""

# 总结
echo "=========================================="
echo "  诊断总结"
echo "=========================================="
echo ""

# 汇总问题
issues=0

if [ "$nginx_status" != "active" ]; then
    log_error "问题 1: Nginx 服务未运行"
    issues=$((issues + 1))
fi

if [ -z "$port_443" ]; then
    log_error "问题 2: 443 端口未监听"
    issues=$((issues + 1))
fi

if [ "$cert_exists" != "yes" ] || [ "$key_exists" != "yes" ]; then
    log_error "问题 3: SSL 证书或密钥文件缺失"
    issues=$((issues + 1))
fi

if [ "$external_test" != "200" ] && [ "$external_test" != "301" ] && [ "$external_test" != "302" ]; then
    log_error "问题 4: 外部 HTTPS 连接失败"
    issues=$((issues + 1))
fi

if [ $issues -eq 0 ]; then
    log_success "所有检查通过！如果仍有问题，可能是云服务器安全组配置问题。"
else
    log_warning "发现 $issues 个问题，请根据上述诊断结果进行修复。"
fi

echo ""
echo "=========================================="
echo "  建议的修复步骤"
echo "=========================================="
echo ""

if [ "$nginx_status" != "active" ]; then
    echo "1. 启动 Nginx:"
    echo "   ssh ${SERVER_USER}@${SERVER_IP} 'systemctl start nginx'"
    echo ""
fi

if [ "$cert_exists" != "yes" ] || [ "$key_exists" != "yes" ]; then
    echo "2. 安装或更新 SSL 证书（使用 Let's Encrypt）:"
    echo "   ssh ${SERVER_USER}@${SERVER_IP} 'certbot certonly --nginx -d ${DOMAIN_NAME}'"
    echo ""
fi

if [ -z "$port_443" ]; then
    echo "3. 检查 Nginx 配置文件，确保启用了 HTTPS:"
    echo "   ssh ${SERVER_USER}@${SERVER_IP} 'cat /etc/nginx/conf.d/gesp-frontend.conf | grep -A 5 \"listen 443\"'"
    echo ""
fi

echo "4. 如果使用云服务器，请检查安全组规则，确保开放 443 端口"
echo ""
echo "5. 重新加载 Nginx 配置:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'nginx -t && systemctl reload nginx'"
echo ""


