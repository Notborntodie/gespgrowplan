#!/bin/bash

# Safari SSL连接测试脚本
# 用于诊断Safari浏览器无法访问HTTPS网站的问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="zhengyanchen.cn"
SAFARI_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"

echo -e "${BLUE}=== Safari SSL连接测试 ===${NC}\n"

# 测试1: 基本HTTPS连接测试
echo -e "${YELLOW}[测试1] 基本HTTPS连接测试${NC}"
if curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n连接时间: %{time_connect}s\n总时间: %{time_total}s\n" \
    --max-time 10 \
    "https://${DOMAIN}/" 2>&1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ HTTPS连接成功${NC}\n"
else
    echo -e "${RED}✗ HTTPS连接失败${NC}\n"
fi

# 测试2: 模拟Safari User-Agent的HTTPS连接
echo -e "${YELLOW}[测试2] 模拟Safari User-Agent的HTTPS连接${NC}"
curl -v -A "${SAFARI_UA}" \
    --max-time 10 \
    "https://${DOMAIN}/" 2>&1 | head -50
echo -e "\n"

# 测试3: SSL证书验证测试
echo -e "${YELLOW}[测试3] SSL证书验证测试${NC}"
openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} -showcerts < /dev/null 2>&1 | \
    grep -E "Verify return code|Certificate chain|Server certificate|Protocol|Cipher" | head -10
echo -e "\n"

# 测试4: TLS版本测试
echo -e "${YELLOW}[测试4] TLS版本测试${NC}"
for tls_version in tls1_2 tls1_3; do
    echo -n "测试 ${tls_version}: "
    if curl -s -o /dev/null -w "%{http_code}" \
        --${tls_version} \
        --max-time 5 \
        "https://${DOMAIN}/" > /dev/null 2>&1; then
        echo -e "${GREEN}支持${NC}"
    else
        echo -e "${RED}不支持或失败${NC}"
    fi
done
echo -e "\n"

# 测试5: SSL握手详细测试
echo -e "${YELLOW}[测试5] SSL握手详细测试${NC}"
openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} -state -debug < /dev/null 2>&1 | \
    grep -E "CONNECTED|SSL handshake|Protocol|Cipher|Verify return code|OCSP" | head -15
echo -e "\n"

# 测试6: 检查证书链完整性
echo -e "${YELLOW}[测试6] 证书链完整性检查${NC}"
echo "证书链信息:"
openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} < /dev/null 2>&1 | \
    grep -A 5 "Certificate chain"
echo -e "\n"

# 测试7: HTTP/2支持测试
echo -e "${YELLOW}[测试7] HTTP/2支持测试${NC}"
if curl -s -o /dev/null -w "HTTP版本: %{http_version}\n" \
    --http2 \
    --max-time 5 \
    "https://${DOMAIN}/" 2>&1 | grep -q "2"; then
    echo -e "${GREEN}✓ 支持HTTP/2${NC}"
else
    echo -e "${YELLOW}⚠ 不支持HTTP/2或使用HTTP/1.1${NC}"
fi
echo -e "\n"

# 测试8: 连接超时测试
echo -e "${YELLOW}[测试8] 连接超时测试${NC}"
timeout 10 curl -v -A "${SAFARI_UA}" \
    --max-time 10 \
    --connect-timeout 5 \
    "https://${DOMAIN}/" 2>&1 | \
    grep -E "Connected|SSL|HTTP|timeout|error" | head -20
echo -e "\n"

# 测试9: 检查服务器响应头
echo -e "${YELLOW}[测试9] 服务器响应头检查${NC}"
curl -I -A "${SAFARI_UA}" \
    --max-time 10 \
    "https://${DOMAIN}/" 2>&1 | head -20
echo -e "\n"

# 测试10: 完整的SSL信息摘要
echo -e "${YELLOW}[测试10] SSL配置摘要${NC}"
echo "域名: ${DOMAIN}"
echo "支持的TLS版本:"
openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} < /dev/null 2>&1 | \
    grep -E "Protocol|Cipher" | head -2
echo -e "\n"

echo -e "${BLUE}=== 测试完成 ===${NC}"
echo -e "\n${YELLOW}提示:${NC}"
echo "如果测试中发现问题，请检查："
echo "1. SSL证书是否有效"
echo "2. TLS版本是否兼容"
echo "3. 加密套件是否支持"
echo "4. 是否有连接超时问题"


