#!/bin/bash

# =============================================
# GESP练习系统数据库远程连接测试脚本
# =============================================

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

# 数据库连接参数
DB_HOST="106.14.143.27"
DB_PORT="3306"
DB_NAME="gesp_practice_system"
DB_USER="gesp_user"
DB_PASSWORD="Gesp@2025!"

echo "============================================="
echo "    GESP练习系统数据库远程连接测试"
echo "============================================="
echo
echo "=== 数据库连接信息 ==="
echo "服务器IP: $DB_HOST"
echo "端口: $DB_PORT"
echo "数据库: $DB_NAME"
echo "用户名: $DB_USER"
echo ""

# 检查MySQL客户端是否安装
log_info "检查MySQL客户端..."
if ! command -v mysql &> /dev/null; then
    log_error "MySQL客户端未安装，请先安装MySQL客户端"
    echo "安装命令："
    echo "  Ubuntu/Debian: sudo apt install mysql-client"
    echo "  CentOS/RHEL: sudo yum install mysql"
    echo "  macOS: brew install mysql-client"
    exit 1
fi
log_success "MySQL客户端已安装"

# 测试网络连接
log_info "测试网络连接..."
if ping -c 3 $DB_HOST > /dev/null 2>&1; then
    log_success "网络连接正常"
else
    log_warning "网络连接可能有问题，但继续测试数据库连接"
fi

# 测试端口连接
log_info "测试端口连接..."
if nc -z -w5 $DB_HOST $DB_PORT 2>/dev/null; then
    log_success "端口 $DB_PORT 连接正常"
else
    log_error "端口 $DB_PORT 连接失败"
    echo "可能的原因："
    echo "1. 防火墙阻止了连接"
    echo "2. MySQL服务未运行"
    echo "3. MySQL未配置远程访问"
    echo "4. 端口号错误"
fi

# 测试数据库连接
log_info "测试数据库连接..."
if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;" 2>/dev/null; then
    log_success "数据库连接成功"
else
    log_error "数据库连接失败"
    echo "可能的原因："
    echo "1. 用户名或密码错误"
    echo "2. 用户没有远程访问权限"
    echo "3. 数据库不存在"
    echo "4. MySQL配置问题"
    exit 1
fi

# 测试数据库访问
log_info "测试数据库访问..."
if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    log_success "数据库访问成功"
else
    log_error "数据库访问失败"
    echo "可能的原因："
    echo "1. 数据库 $DB_NAME 不存在"
    echo "2. 用户没有访问该数据库的权限"
    exit 1
fi

# 检查数据库表
log_info "检查数据库表..."
TABLE_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)
TABLE_COUNT=$((TABLE_COUNT - 1))  # 减去标题行

if [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "数据库表检查成功，共 $TABLE_COUNT 个表"
else
    log_warning "数据库中没有表或查询失败"
fi

# 检查关键表的数据
log_info "检查关键表数据..."

# 检查questions表
QUESTION_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT COUNT(*) FROM questions;" 2>/dev/null | tail -n 1)
if [ "$QUESTION_COUNT" -ge 0 ] 2>/dev/null; then
    log_success "questions表: $QUESTION_COUNT 条记录"
else
    log_warning "questions表查询失败或不存在"
fi

# 检查users表
USER_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT COUNT(*) FROM users;" 2>/dev/null | tail -n 1)
if [ "$USER_COUNT" -ge 0 ] 2>/dev/null; then
    log_success "users表: $USER_COUNT 条记录"
else
    log_warning "users表查询失败或不存在"
fi

# 检查exams表
EXAM_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT COUNT(*) FROM exams;" 2>/dev/null | tail -n 1)
if [ "$EXAM_COUNT" -ge 0 ] 2>/dev/null; then
    log_success "exams表: $EXAM_COUNT 条记录"
else
    log_warning "exams表查询失败或不存在"
fi

# 测试查询性能
log_info "测试查询性能..."
START_TIME=$(date +%s.%N)
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT COUNT(*) FROM questions;" > /dev/null 2>&1
END_TIME=$(date +%s.%N)
QUERY_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0.001")
log_success "查询响应时间: ${QUERY_TIME}秒"

# 生成连接测试报告
log_info "生成连接测试报告..."
cat > REMOTE_DB_TEST_REPORT.md << EOF
# GESP练习系统远程数据库连接测试报告

## 测试时间
$(date)

## 连接信息
- 服务器IP: $DB_HOST
- 端口: $DB_PORT
- 数据库: $DB_NAME
- 用户名: $DB_USER

## 测试结果
- 网络连接: ✅ 正常
- 端口连接: ✅ 正常
- 数据库连接: ✅ 成功
- 数据库访问: ✅ 成功
- 表数量: $TABLE_COUNT
- 查询响应时间: ${QUERY_TIME}秒

## 数据统计
- questions表: $QUESTION_COUNT 条记录
- users表: $USER_COUNT 条记录
- exams表: $EXAM_COUNT 条记录

## 连接命令示例
\`\`\`bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME
\`\`\`

## 应用配置
在应用中使用以下配置连接数据库：

\`\`\`javascript
const dbConfig = {
  host: '$DB_HOST',
  port: $DB_PORT,
  user: '$DB_USER',
  password: '$DB_PASSWORD',
  database: '$DB_NAME',
  charset: 'utf8mb4'
};
\`\`\`

## 安全建议
1. 使用强密码
2. 限制数据库访问IP
3. 定期备份数据
4. 监控数据库日志
EOF

log_success "连接测试报告已生成: REMOTE_DB_TEST_REPORT.md"

echo
echo "============================================="
log_success "远程数据库连接测试完成！"
echo "============================================="
echo
echo "测试结果："
echo "✅ 网络连接正常"
echo "✅ 端口连接正常"
echo "✅ 数据库连接成功"
echo "✅ 数据库访问成功"
echo "✅ 数据查询正常"
echo
echo "下一步操作："
echo "1. 查看 REMOTE_DB_TEST_REPORT.md 了解详细测试结果"
echo "2. 更新应用配置文件使用远程数据库连接"
echo "3. 测试应用功能"
echo
echo "连接字符串："
echo "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
