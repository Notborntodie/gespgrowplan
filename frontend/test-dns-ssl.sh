#!/bin/bash

# DNS 和 SSL 连接对比测试脚本

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

DOMAIN="zhengyanchen.cn"
IP="106.14.143.27"

echo ""
echo "=========================================="
echo "  DNS 和 SSL 连接对比测试"
echo "=========================================="
echo ""

# 测试 1: DNS 解析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 1: DNS 解析测试"
dns_result=$(dig +short ${DOMAIN} A | head -1)
if [ "$dns_result" = "$IP" ]; then
    log_success "DNS 解析正确: ${DOMAIN} → ${IP}"
else
    log_error "DNS 解析错误: 期望 ${IP}, 得到 ${dns_result}"
fi

# 测试多个 DNS 服务器
log_info "测试多个 DNS 服务器解析..."
for dns in "8.8.8.8" "114.114.114.114" "223.5.5.5"; do
    result=$(dig @${dns} +short ${DOMAIN} A 2>/dev/null | head -1 || echo "failed")
    if [ "$result" = "$IP" ]; then
        log_success "DNS ${dns}: ${DOMAIN} → ${IP}"
    else
        log_warning "DNS ${dns}: 解析结果 ${result}"
    fi
done
echo ""

# 测试 2: TCP 连接（域名）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 2: TCP 连接测试（使用域名）"
if nc -zv -w 5 ${DOMAIN} 443 2>&1 | grep -q "succeeded"; then
    log_success "TCP 连接成功（域名）"
else
    log_error "TCP 连接失败（域名）"
fi
echo ""

# 测试 3: TCP 连接（IP）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 3: TCP 连接测试（使用 IP）"
if nc -zv -w 5 ${IP} 443 2>&1 | grep -q "succeeded"; then
    log_success "TCP 连接成功（IP）"
else
    log_error "TCP 连接失败（IP）"
fi
echo ""

# 测试 4: HTTPS 连接（域名）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 4: HTTPS 连接测试（使用域名）"
https_domain_result=$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "https://${DOMAIN}/" 2>&1 || echo "failed")
if [ "$https_domain_result" = "200" ] || [ "$https_domain_result" = "301" ] || [ "$https_domain_result" = "302" ]; then
    log_success "HTTPS 连接成功（域名）: HTTP ${https_domain_result}"
else
    log_error "HTTPS 连接失败（域名）: $https_domain_result"
    log_info "详细错误："
    curl -v -k --connect-timeout 10 "https://${DOMAIN}/" 2>&1 | grep -E "(Connected|TLS|handshake|reset|error)" | head -5 | sed 's/^/  /'
fi
echo ""

# 测试 5: HTTPS 连接（IP + Host 头）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 5: HTTPS 连接测试（使用 IP + Host 头）"
https_ip_result=$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 10 -H "Host: ${DOMAIN}" "https://${IP}/" 2>&1 || echo "failed")
if [ "$https_ip_result" = "200" ] || [ "$https_ip_result" = "301" ] || [ "$https_ip_result" = "302" ]; then
    log_success "HTTPS 连接成功（IP + Host）: HTTP ${https_ip_result}"
else
    log_warning "HTTPS 连接结果（IP + Host）: $https_ip_result"
fi
echo ""

# 测试 6: OpenSSL SSL 握手（域名）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 6: OpenSSL SSL 握手测试（使用域名）"
ssl_domain_test=$(echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>&1 | grep -E "(Verify return code|CONNECTED|handshake)" | head -3)
if echo "$ssl_domain_test" | grep -q "Verify return code: 0"; then
    log_success "SSL 握手成功（域名）"
    echo "$ssl_domain_test" | sed 's/^/  /'
else
    log_error "SSL 握手失败（域名）"
    echo "$ssl_domain_test" | sed 's/^/  /'
fi
echo ""

# 测试 7: OpenSSL SSL 握手（IP + SNI）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "测试 7: OpenSSL SSL 握手测试（使用 IP + SNI）"
ssl_ip_test=$(echo | openssl s_client -connect ${IP}:443 -servername ${DOMAIN} 2>&1 | grep -E "(Verify return code|CONNECTED|handshake)" | head -3)
if echo "$ssl_ip_test" | grep -q "Verify return code: 0"; then
    log_success "SSL 握手成功（IP + SNI）"
    echo "$ssl_ip_test" | sed 's/^/  /'
else
    log_warning "SSL 握手结果（IP + SNI）"
    echo "$ssl_ip_test" | sed 's/^/  /'
fi
echo ""

# 总结
echo "=========================================="
echo "  测试总结"
echo "=========================================="
echo ""

if [ "$https_domain_result" != "200" ] && [ "$https_domain_result" != "301" ] && [ "$https_domain_result" != "302" ] && [ "$https_ip_result" = "200" ] || [ "$https_ip_result" = "301" ] || [ "$https_ip_result" = "302" ]; then
    log_warning "发现问题：使用域名访问失败，但使用 IP + Host 头访问成功"
    echo ""
    log_info "可能的原因："
    echo "  1. 云服务商的安全策略检查 SNI（Server Name Indication）"
    echo "  2. 云服务商的 WAF 或 DDoS 防护在域名层面拦截"
    echo "  3. 云服务商的负载均衡器或代理服务器配置问题"
    echo "  4. DNS 解析在某个中间环节有问题"
    echo ""
    log_info "建议的解决方案："
    echo "  1. 检查云服务器控制台的 WAF/DDoS 防护设置"
    echo "  2. 检查是否有负载均衡器配置"
    echo "  3. 检查云服务商的安全策略或域名白名单"
    echo "  4. 联系云服务商技术支持，说明域名访问被拦截的情况"
fi

echo ""


