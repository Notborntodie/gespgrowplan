#!/bin/bash

# 为IP地址生成自签名SSL证书的脚本
# 注意：自签名证书会导致浏览器显示安全警告，需要手动接受

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 加载配置文件（如果存在）
if [ -f ".deploy-config" ]; then
    source .deploy-config
fi

SERVER_IP="${DEPLOY_SERVER_IP:-106.14.143.27}"
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
CERT_DIR="/etc/ssl/gesp-self-signed"
CERT_FILE="${CERT_DIR}/server.crt"
KEY_FILE="${CERT_DIR}/server.key"

log_info "开始为IP地址 ${SERVER_IP} 生成自签名SSL证书..."
log_warning "自签名证书会导致浏览器显示安全警告，这是正常现象"

# 检查是否已存在证书
if ssh ${SERVER_USER}@${SERVER_IP} "test -f ${CERT_FILE}" 2>/dev/null; then
    log_warning "证书文件已存在: ${CERT_FILE}"
    read -p "是否要重新生成？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "跳过证书生成"
        exit 0
    fi
fi

log_info "在服务器上创建证书目录..."
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${CERT_DIR}"

log_info "生成自签名证书（有效期1年）..."

# 生成自签名证书的命令
# 使用IP地址作为Common Name，并添加Subject Alternative Name (SAN)
ssh ${SERVER_USER}@${SERVER_IP} "
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ${KEY_FILE} \
        -out ${CERT_FILE} \
        -subj \"/C=CN/ST=State/L=City/O=GESP/OU=IT/CN=${SERVER_IP}\" \
        -addext \"subjectAltName=IP:${SERVER_IP}\" \
        -addext \"keyUsage=digitalSignature,keyEncipherment\" \
        -addext \"extendedKeyUsage=serverAuth\"
    
    # 设置证书文件权限
    chmod 644 ${CERT_FILE}
    chmod 600 ${KEY_FILE}
    chown root:root ${CERT_FILE} ${KEY_FILE}
"

if ssh ${SERVER_USER}@${SERVER_IP} "test -f ${CERT_FILE}" 2>/dev/null; then
    log_success "自签名证书生成成功！"
    echo ""
    echo "证书信息："
    echo "  - 证书文件: ${CERT_FILE}"
    echo "  - 密钥文件: ${KEY_FILE}"
    echo "  - 有效期: 1年"
    echo ""
    log_warning "重要提示："
    echo "  1. 这是自签名证书，浏览器会显示安全警告"
    echo "  2. 访问 https://${SERVER_IP} 时，需要点击 '高级' -> '继续访问'（或类似选项）"
    echo "  3. 如需正式证书，请使用域名并申请 Let's Encrypt 证书"
    echo ""
    log_info "下一步："
    echo "  1. 编辑 .deploy-config 文件，添加以下配置："
    echo "     SSL_CERT_PATH=${CERT_FILE}"
    echo "     SSL_KEY_PATH=${KEY_FILE}"
    echo "  2. 重新运行部署脚本: ./deploy-frontend.sh --build"
else
    log_error "证书生成失败"
    exit 1
fi


