#!/bin/bash
# ============================================
# 远程数据库同步脚本
# ============================================
# 功能：从远程数据库同步数据到本地数据库
# 使用方法：./sync_remote_database.sh
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}远程数据库同步脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# 配置信息（请修改为实际值）
# ============================================
REMOTE_HOST="106.14.143.27"      # 旧服务器IP（必填）
REMOTE_PORT="3306"               # 数据库端口（默认3306）
REMOTE_USER="gesp_user"          # 远程数据库用户名（必填）
REMOTE_PASSWORD="Gesp@2025!"     # 远程数据库密码（留空会提示输入）
REMOTE_DB="gesp_practice_system" # 数据库名称（默认gesp_practice_system）

LOCAL_DB="gesp_practice_system"  # 本地数据库名称
LOCAL_USER="root"                # 本地MySQL用户（默认root）
LOCAL_PASSWORD=""                # 本地MySQL密码（留空会提示输入）

# ============================================
# 显示配置信息
# ============================================
echo -e "${BLUE}配置信息：${NC}"
echo "  远程服务器: ${REMOTE_HOST}:${REMOTE_PORT}"
echo "  远程数据库: ${REMOTE_DB}"
echo "  远程用户: ${REMOTE_USER}"
echo "  本地数据库: ${LOCAL_DB}"
echo "  本地用户: ${LOCAL_USER}"
echo ""

# ============================================
# 检查必需参数
# ============================================
if [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_USER" ]; then
    echo -e "${RED}错误: 请先配置 REMOTE_HOST 和 REMOTE_USER${NC}"
    echo "编辑脚本文件，修改配置信息部分"
    exit 1
fi

# ============================================
# 获取密码（如果未配置）
# ============================================
if [ -z "$REMOTE_PASSWORD" ]; then
    echo -e "${YELLOW}请输入远程数据库密码:${NC}"
    read -s REMOTE_PASSWORD
    echo ""
fi

if [ -z "$LOCAL_PASSWORD" ]; then
    echo -e "${YELLOW}请输入本地MySQL密码（如果为空直接回车）:${NC}"
    read -s LOCAL_PASSWORD
    echo ""
fi

# ============================================
# 构建 MySQL 命令
# ============================================
if [ -z "$LOCAL_PASSWORD" ]; then
    LOCAL_MYSQL_CMD="mysql -u ${LOCAL_USER} -p"
    LOCAL_MYSQLDUMP_CMD="mysqldump -u ${LOCAL_USER} -p"
else
    LOCAL_MYSQL_CMD="mysql -u ${LOCAL_USER} -p${LOCAL_PASSWORD}"
    LOCAL_MYSQLDUMP_CMD="mysqldump -u ${LOCAL_USER} -p${LOCAL_PASSWORD}"
fi

REMOTE_MYSQL_CMD="mysql -h ${REMOTE_HOST} -P ${REMOTE_PORT} -u ${REMOTE_USER} -p${REMOTE_PASSWORD}"
REMOTE_MYSQLDUMP_CMD="mysqldump -h ${REMOTE_HOST} -P ${REMOTE_PORT} -u ${REMOTE_USER} -p${REMOTE_PASSWORD}"

# ============================================
# 测试远程连接
# ============================================
echo -e "${YELLOW}正在测试远程数据库连接...${NC}"
if eval "${REMOTE_MYSQL_CMD} -e 'SELECT 1;' ${REMOTE_DB} > /dev/null 2>&1"; then
    echo -e "${GREEN}✓ 远程数据库连接成功${NC}"
else
    echo -e "${RED}✗ 远程数据库连接失败${NC}"
    echo "请检查："
    echo "  1. 网络连接是否正常"
    echo "  2. IP地址和端口是否正确"
    echo "  3. 用户名和密码是否正确"
    echo "  4. 防火墙是否开放端口"
    exit 1
fi

# ============================================
# 检查本地数据库
# ============================================
echo -e "${YELLOW}正在检查本地数据库...${NC}"
DB_EXISTS=$(eval "${LOCAL_MYSQL_CMD} -e \"SHOW DATABASES LIKE '${LOCAL_DB}';\" 2>/dev/null" | grep -c "${LOCAL_DB}" || echo "0")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}本地数据库不存在，正在创建...${NC}"
    eval "${LOCAL_MYSQL_CMD} -e \"CREATE DATABASE ${LOCAL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\" 2>/dev/null"
    echo -e "${GREEN}✓ 本地数据库已创建${NC}"
else
    echo -e "${YELLOW}警告: 本地数据库 ${LOCAL_DB} 已存在${NC}"
    read -p "是否删除并重新创建? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "正在删除现有数据库..."
        eval "${LOCAL_MYSQL_CMD} -e \"DROP DATABASE IF EXISTS ${LOCAL_DB};\" 2>/dev/null"
        echo "正在创建新数据库..."
        eval "${LOCAL_MYSQL_CMD} -e \"CREATE DATABASE ${LOCAL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\" 2>/dev/null"
        echo -e "${GREEN}✓ 本地数据库已重新创建${NC}"
    else
        echo "操作已取消"
        exit 0
    fi
fi

# ============================================
# 同步数据
# ============================================
echo ""
echo -e "${YELLOW}正在同步数据（这可能需要几分钟，请耐心等待）...${NC}"
echo ""

# 使用 mysqldump 导出并导入
if eval "${REMOTE_MYSQLDUMP_CMD} --single-transaction --routines --triggers ${REMOTE_DB} 2>/dev/null" | eval "${LOCAL_MYSQL_CMD} ${LOCAL_DB} 2>/dev/null"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}数据同步成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # 验证数据
    echo -e "${YELLOW}正在验证数据...${NC}"
    TABLE_COUNT=$(eval "${LOCAL_MYSQL_CMD} -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${LOCAL_DB}';\" 2>/dev/null" | tail -n 1)
    echo -e "${GREEN}✓ 已同步 ${TABLE_COUNT} 个表${NC}"
    
    echo ""
    echo -e "${BLUE}下一步操作：${NC}"
    echo "  1. 创建本地数据库用户（如果还没有）："
    echo "     mysql -u root -p"
    echo "     CREATE USER 'gesp_user'@'localhost' IDENTIFIED BY 'your_password';"
    echo "     GRANT ALL PRIVILEGES ON ${LOCAL_DB}.* TO 'gesp_user'@'localhost';"
    echo "     FLUSH PRIVILEGES;"
    echo ""
    echo "  2. 配置后端 .env 文件（连接本地数据库）："
    echo "     DB_HOST=localhost"
    echo "     DB_USER=gesp_user"
    echo "     DB_PASSWORD=your_password"
    echo ""
    echo "  3. 启动后端服务并验证"
    echo ""
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}数据同步失败！${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "可能的原因："
    echo "  1. 网络连接中断"
    echo "  2. 数据库权限不足"
    echo "  3. 磁盘空间不足"
    echo "  4. 数据库损坏"
    echo ""
    echo "请检查错误信息并重试"
    exit 1
fi

