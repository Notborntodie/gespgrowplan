#!/bin/bash

# =============================================
# GESP练习系统快速部署脚本
# 适用于云服务器一键部署
# =============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 默认配置
DB_NAME="gesp_practice_system"
DB_USER="gesp_user"
DB_PASSWORD="Gesp@2025!"
DB_HOST="localhost"
DB_PORT="3306"

echo "============================================="
echo "    GESP练习系统快速部署脚本"
echo "============================================="
echo

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    log_warning "检测到root用户，建议使用普通用户运行"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查MySQL是否安装
log_info "检查MySQL安装状态..."
if ! command -v mysql &> /dev/null; then
    log_error "MySQL未安装，正在安装MySQL..."
    
    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install -y mysql-server
        sudo systemctl start mysql
        sudo systemctl enable mysql
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y mysql-server
        sudo systemctl start mysqld
        sudo systemctl enable mysqld
    else
        log_error "不支持的操作系统，请手动安装MySQL"
        exit 1
    fi
fi

# 检查MySQL服务状态
log_info "检查MySQL服务状态..."
if ! sudo systemctl is-active --quiet mysql && ! sudo systemctl is-active --quiet mysqld; then
    log_warning "MySQL服务未运行，尝试启动..."
    if sudo systemctl start mysql 2>/dev/null || sudo systemctl start mysqld 2>/dev/null; then
        log_success "MySQL服务启动成功"
    else
        log_error "无法启动MySQL服务"
        exit 1
    fi
fi

# 创建数据库和用户
log_info "创建数据库和用户..."
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
" 2>/dev/null || {
    log_warning "使用sudo权限创建数据库..."
    sudo mysql -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
"
}

log_success "数据库和用户创建成功"

# 导入数据库结构
log_info "导入数据库结构和数据..."
if [ -f "init_database.sql" ]; then
    mysql -u root "$DB_NAME" < init_database.sql 2>/dev/null || {
        log_warning "使用sudo权限导入数据..."
        sudo mysql "$DB_NAME" < init_database.sql
    }
    log_success "数据库结构导入成功"
elif [ -f "gesp_practice_system_complete.sql" ]; then
    mysql -u root "$DB_NAME" < gesp_practice_system_complete.sql 2>/dev/null || {
        log_warning "使用sudo权限导入数据..."
        sudo mysql "$DB_NAME" < gesp_practice_system_complete.sql
    }
    log_success "数据库数据导入成功"
else
    log_error "未找到数据库脚本文件"
    exit 1
fi

# 验证数据库
log_info "验证数据库..."
TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)
TABLE_COUNT=$((TABLE_COUNT - 1))

if [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "数据库验证成功，共 $TABLE_COUNT 个表"
else
    log_error "数据库验证失败"
    exit 1
fi

# 创建配置文件
log_info "创建配置文件..."
cat > database_config.env << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

cat > .env << EOF
# GESP练习系统环境变量
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# 其他配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
EOF

log_success "配置文件创建完成"

# 创建部署完成报告
log_info "生成部署报告..."
cat > DEPLOYMENT_REPORT.md << EOF
# GESP练习系统部署报告

## 部署时间
$(date)

## 数据库信息
- 数据库名: $DB_NAME
- 用户名: $DB_USER
- 主机: $DB_HOST
- 端口: $DB_PORT
- 表数量: $TABLE_COUNT

## 配置文件
- database_config.env: 数据库连接配置
- .env: 环境变量配置

## 连接测试
\`\`\`bash
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM questions;"
\`\`\`

## 安全建议
1. 修改默认密码
2. 限制数据库访问IP
3. 定期备份数据
4. 监控数据库日志

## 下一步
1. 配置后端应用
2. 启动服务
3. 测试功能
EOF

log_success "部署报告生成完成"

# 测试连接
log_info "测试数据库连接..."
if mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT COUNT(*) FROM questions;" 2>/dev/null; then
    log_success "数据库连接测试成功"
else
    log_warning "数据库连接测试失败，请检查配置"
fi

echo
log_success "部署完成！"
echo
echo "============================================="
echo "部署信息："
echo "数据库名: $DB_NAME"
echo "用户名: $DB_USER"
echo "密码: $DB_PASSWORD"
echo "配置文件: database_config.env, .env"
echo "部署报告: DEPLOYMENT_REPORT.md"
echo "============================================="
echo
echo "下一步操作："
echo "1. 查看 DEPLOYMENT_REPORT.md 了解部署详情"
echo "2. 配置后端应用使用 database_config.env 中的连接信息"
echo "3. 启动后端服务"
echo "4. 测试系统功能"
echo
echo "安全提醒："
echo "- 请立即修改数据库密码"
echo "- 配置防火墙规则"
echo "- 设置定期备份"
echo
