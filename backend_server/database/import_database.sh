#!/bin/bash

# GESP练习系统数据库导入脚本
# 使用方法: ./import_database.sh [选项]
#
# 选项:
#   -h, --host HOST         数据库主机地址 (默认: localhost)
#   -P, --port PORT         数据库端口 (默认: 3306)
#   -u, --user USER         数据库用户名 (默认: root)
#   -p, --password PASS     数据库密码
#   -d, --database DB       数据库名称 (默认: gesp_practice_system)
#   -f, --file FILE         SQL文件路径 (默认: gesp_practice_system_dump_20251120_163206.sql)
#   --create-db             如果数据库不存在则创建
#   --drop-db               导入前删除现有数据库（危险！）
#   --help                  显示帮助信息

set -e

# 默认配置
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="gesp_practice_system"
SQL_FILE="gesp_practice_system_dump_20251120_163206.sql"
CREATE_DB=false
DROP_DB=false

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    cat << EOF
GESP练习系统数据库导入脚本

使用方法:
    ./import_database.sh [选项]

选项:
    -h, --host HOST         数据库主机地址 (默认: localhost)
    -P, --port PORT         数据库端口 (默认: 3306)
    -u, --user USER         数据库用户名 (默认: root)
    -p, --password PASS     数据库密码
    -d, --database DB       数据库名称 (默认: gesp_practice_system)
    -f, --file FILE         SQL文件路径 (默认: gesp_practice_system_dump_20251120_163206.sql)
    --create-db             如果数据库不存在则创建
    --drop-db               导入前删除现有数据库（危险！）
    --help                  显示帮助信息

示例:
    # 基本导入（使用默认配置）
    ./import_database.sh -p 'your_password'

    # 指定所有参数
    ./import_database.sh -h 192.168.1.100 -P 3306 -u gesp_user -p 'Gesp@2025!' -d gesp_practice_system

    # 创建数据库并导入
    ./import_database.sh -p 'your_password' --create-db

    # 删除现有数据库并重新导入（危险操作）
    ./import_database.sh -p 'your_password' --drop-db

EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -f|--file)
            SQL_FILE="$2"
            shift 2
            ;;
        --create-db)
            CREATE_DB=true
            shift
            ;;
        --drop-db)
            DROP_DB=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 检查 SQL 文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}错误: SQL 文件不存在: $SQL_FILE${NC}"
    exit 1
fi

# 检查 mysql 命令是否可用
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}错误: 未找到 mysql 命令，请先安装 MySQL 客户端${NC}"
    exit 1
fi

# 构建 MySQL 连接参数
MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
if [ -n "$DB_PASSWORD" ]; then
    MYSQL_CMD="$MYSQL_CMD -p'$DB_PASSWORD'"
else
    MYSQL_CMD="$MYSQL_CMD -p"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}GESP练习系统数据库导入工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "配置信息:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"
echo "  SQL文件: $SQL_FILE"
echo ""

# 检查数据库是否存在
DB_EXISTS=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER ${DB_PASSWORD:+-p'$DB_PASSWORD'} -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || echo "0")

if [ "$DB_EXISTS" -eq 1 ]; then
    if [ "$DROP_DB" = true ]; then
        echo -e "${YELLOW}警告: 将删除现有数据库 $DB_NAME${NC}"
        read -p "确认删除? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "操作已取消"
            exit 0
        fi
        echo "正在删除数据库..."
        eval "$MYSQL_CMD -e 'DROP DATABASE IF EXISTS \`$DB_NAME\`;'"
        echo -e "${GREEN}数据库已删除${NC}"
        CREATE_DB=true
    else
        echo -e "${YELLOW}警告: 数据库 $DB_NAME 已存在${NC}"
        read -p "是否继续导入? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "操作已取消"
            exit 0
        fi
    fi
else
    if [ "$CREATE_DB" = false ]; then
        echo -e "${YELLOW}数据库 $DB_NAME 不存在${NC}"
        read -p "是否创建数据库? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            CREATE_DB=true
        else
            echo "操作已取消"
            exit 0
        fi
    fi
fi

# 创建数据库
if [ "$CREATE_DB" = true ] || [ "$DB_EXISTS" -eq 0 ]; then
    echo "正在创建数据库..."
    eval "$MYSQL_CMD -e 'CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
    echo -e "${GREEN}数据库已创建${NC}"
fi

# 导入 SQL 文件
echo ""
echo "正在导入数据库..."
echo "这可能需要几分钟时间，请耐心等待..."

if [ -n "$DB_PASSWORD" ]; then
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p'$DB_PASSWORD' $DB_NAME < "$SQL_FILE" 2>&1 | grep -v "Using a password" || true
else
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < "$SQL_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}数据库导入成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "数据库信息:"
    echo "  数据库名: $DB_NAME"
    echo "  主机: $DB_HOST:$DB_PORT"
    echo ""
    echo "下一步:"
    echo "  1. 检查数据库连接配置"
    echo "  2. 查看数据库文档: 数据库.md"
    echo "  3. 启动应用程序"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}数据库导入失败！${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi

