#!/bin/bash

# 简单的数据库远程连接测试
echo "=== 数据库远程连接测试 ==="
echo "服务器IP: 106.14.143.27"
echo "端口: 3306"
echo "数据库: gesp_practice_system"
echo "用户名: gesp_user"
echo ""

# 测试数据库连接
echo "正在测试数据库连接..."
if mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "SELECT 1;" 2>/dev/null; then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 测试数据库访问
echo "正在测试数据库访问..."
if mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "USE gesp_practice_system; SELECT 1;" 2>/dev/null; then
    echo "✅ 数据库访问成功"
else
    echo "❌ 数据库访问失败"
    exit 1
fi

# 检查表数量
echo "正在检查数据库表..."
TABLE_COUNT=$(mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "USE gesp_practice_system; SHOW TABLES;" 2>/dev/null | wc -l)
TABLE_COUNT=$((TABLE_COUNT - 1))
echo "✅ 数据库表数量: $TABLE_COUNT"

# 检查关键表数据
echo "正在检查关键表数据..."
QUESTION_COUNT=$(mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "USE gesp_practice_system; SELECT COUNT(*) FROM questions;" 2>/dev/null | tail -n 1)
echo "✅ questions表: $QUESTION_COUNT 条记录"

USER_COUNT=$(mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "USE gesp_practice_system; SELECT COUNT(*) FROM users;" 2>/dev/null | tail -n 1)
echo "✅ users表: $USER_COUNT 条记录"

EXAM_COUNT=$(mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' -e "USE gesp_practice_system; SELECT COUNT(*) FROM exams;" 2>/dev/null | tail -n 1)
echo "✅ exams表: $EXAM_COUNT 条记录"

echo ""
echo "=== 测试完成 ==="
echo "✅ 远程数据库连接测试成功！"
echo ""
echo "连接命令："
echo "mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' gesp_practice_system"
