#!/bin/bash

# =============================================
# GESP 练习系统数据库部署脚本
# 适用于云服务器部署
# =============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查MySQL是否安装
check_mysql() {
    log_info "检查MySQL安装状态..."
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL未安装，请先安装MySQL"
        exit 1
    fi
    log_success "MySQL已安装"
}

# 检查MySQL服务状态
check_mysql_service() {
    log_info "检查MySQL服务状态..."
    if ! systemctl is-active --quiet mysql; then
        log_warning "MySQL服务未运行，尝试启动..."
        sudo systemctl start mysql
        if ! systemctl is-active --quiet mysql; then
            log_error "无法启动MySQL服务"
            exit 1
        fi
    fi
    log_success "MySQL服务运行正常"
}

# 创建数据库用户
create_database_user() {
    log_info "创建数据库用户..."
    
    # 读取用户输入
    read -p "请输入数据库用户名 (默认: gesp_user): " DB_USER
    DB_USER=${DB_USER:-gesp_user}
    
    read -s -p "请输入数据库密码: " DB_PASSWORD
    echo
    read -s -p "请确认数据库密码: " DB_PASSWORD_CONFIRM
    echo
    
    if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
        log_error "密码不匹配"
        exit 1
    fi
    
    # 创建用户和数据库
    mysql -u root -e "
    CREATE DATABASE IF NOT EXISTS gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON gesp_practice_system.* TO '$DB_USER'@'localhost';
    GRANT ALL PRIVILEGES ON gesp_practice_system.* TO '$DB_USER'@'%';
    FLUSH PRIVILEGES;
    "
    
    log_success "数据库用户创建成功"
    
    # 保存配置到文件
    cat > database_config.env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gesp_practice_system
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF
    
    log_success "数据库配置已保存到 database_config.env"
}

# 导入数据库
import_database() {
    log_info "导入数据库结构和数据..."
    
    if [ ! -f "gesp_practice_system_complete.sql" ]; then
        log_error "数据库备份文件不存在: gesp_practice_system_complete.sql"
        exit 1
    fi
    
    # 读取配置
    if [ -f "database_config.env" ]; then
        source database_config.env
    else
        log_error "数据库配置文件不存在，请先运行用户创建步骤"
        exit 1
    fi
    
    mysql -u root gesp_practice_system < gesp_practice_system_complete.sql
    
    log_success "数据库导入完成"
}

# 验证数据库
verify_database() {
    log_info "验证数据库..."
    
    if [ -f "database_config.env" ]; then
        source database_config.env
    else
        log_error "数据库配置文件不存在"
        exit 1
    fi
    
    # 检查表数量
    TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE gesp_practice_system; SHOW TABLES;" | wc -l)
    TABLE_COUNT=$((TABLE_COUNT - 1))  # 减去标题行
    
    log_info "数据库表数量: $TABLE_COUNT"
    
    # 检查数据量
    QUESTION_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE gesp_practice_system; SELECT COUNT(*) FROM questions;" | tail -n 1)
    USER_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE gesp_practice_system; SELECT COUNT(*) FROM users;" | tail -n 1)
    EXAM_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE gesp_practice_system; SELECT COUNT(*) FROM exams;" | tail -n 1)
    
    log_info "题目数量: $QUESTION_COUNT"
    log_info "用户数量: $USER_COUNT"
    log_info "考试数量: $EXAM_COUNT"
    
    log_success "数据库验证完成"
}

# 创建配置文件
create_config_files() {
    log_info "创建应用配置文件..."
    
    if [ -f "database_config.env" ]; then
        source database_config.env
    else
        log_error "数据库配置文件不存在"
        exit 1
    fi
    
    # 创建Node.js配置文件
    cat > backend_config.js << EOF
// GESP练习系统后端配置文件
module.exports = {
    database: {
        host: process.env.DB_HOST || '$DB_HOST',
        port: process.env.DB_PORT || $DB_PORT,
        database: process.env.DB_NAME || '$DB_NAME',
        user: process.env.DB_USER || '$DB_USER',
        password: process.env.DB_PASSWORD || '$DB_PASSWORD',
        charset: 'utf8mb4',
        timezone: '+08:00'
    },
    server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    },
    upload: {
        path: './uploads',
        maxSize: 10 * 1024 * 1024  // 10MB
    }
};
EOF
    
    # 创建环境变量文件
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
}

# 创建部署说明
create_deployment_guide() {
    log_info "创建部署说明文档..."
    
    cat > DEPLOYMENT_GUIDE.md << 'EOF'
# GESP练习系统数据库部署指南

## 概述
本指南介绍如何在云服务器上部署GESP练习系统的数据库。

## 系统要求
- Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- MySQL 5.7+ / MariaDB 10.2+
- 至少 1GB 内存
- 至少 10GB 磁盘空间

## 快速部署

### 1. 安装MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 2. 运行部署脚本
```bash
chmod +x deploy_database.sh
./deploy_database.sh
```

### 3. 验证部署
```bash
mysql -u gesp_user -p gesp_practice_system -e "SELECT COUNT(*) FROM questions;"
```

## 手动部署步骤

### 1. 创建数据库和用户
```sql
CREATE DATABASE gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gesp_user'@'localhost' IDENTIFIED BY 'your_password';
CREATE USER 'gesp_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gesp_practice_system.* TO 'gesp_user'@'localhost';
GRANT ALL PRIVILEGES ON gesp_practice_system.* TO 'gesp_user'@'%';
FLUSH PRIVILEGES;
```

### 2. 导入数据
```bash
mysql -u root gesp_practice_system < gesp_practice_system_complete.sql
```

### 3. 验证数据
```sql
USE gesp_practice_system;
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM exams;
```

## 配置文件说明

### database_config.env
数据库连接配置，包含：
- DB_HOST: 数据库主机
- DB_PORT: 数据库端口
- DB_NAME: 数据库名称
- DB_USER: 数据库用户名
- DB_PASSWORD: 数据库密码

### backend_config.js
Node.js后端配置文件，包含数据库连接和应用配置。

### .env
环境变量文件，用于生产环境配置。

## 安全建议

1. **修改默认密码**: 部署后立即修改数据库密码
2. **限制访问**: 只允许必要的IP访问数据库
3. **定期备份**: 设置自动备份策略
4. **监控日志**: 监控数据库访问日志

## 备份和恢复

### 备份数据库
```bash
mysqldump -u gesp_user -p gesp_practice_system > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库
```bash
mysql -u gesp_user -p gesp_practice_system < backup_file.sql
```

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 检查MySQL服务状态
   - 检查防火墙设置
   - 检查用户权限

2. **字符集问题**
   - 确保使用utf8mb4字符集
   - 检查数据库和表的字符集设置

3. **权限问题**
   - 检查用户权限
   - 确保用户有足够的权限

### 日志查看
```bash
# MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# MySQL慢查询日志
sudo tail -f /var/log/mysql/slow.log
```

## 联系支持
如有问题，请联系技术支持团队。
EOF
    
    log_success "部署说明文档创建完成"
}

# 主函数
main() {
    echo "============================================="
    echo "    GESP练习系统数据库部署脚本"
    echo "============================================="
    echo
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --user-only    仅创建用户"
        echo "  --import-only  仅导入数据"
        echo "  --verify-only  仅验证数据库"
        exit 0
    fi
    
    case "$1" in
        "--user-only")
            check_mysql
            check_mysql_service
            create_database_user
            ;;
        "--import-only")
            import_database
            ;;
        "--verify-only")
            verify_database
            ;;
        "")
            check_mysql
            check_mysql_service
            create_database_user
            import_database
            verify_database
            create_config_files
            create_deployment_guide
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
    
    echo
    log_success "部署完成！"
    echo
    echo "下一步操作："
    echo "1. 查看 DEPLOYMENT_GUIDE.md 了解详细说明"
    echo "2. 配置应用使用 database_config.env 中的连接信息"
    echo "3. 启动后端服务"
    echo
}

# 运行主函数
main "$@"
