#!/bin/bash

# 检查项目中是否还有硬编码的 API 地址

echo "🔍 检查硬编码的 API 地址..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查主 API 地址 (3000端口)
echo -e "${BLUE}检查 http://106.14.143.27:3000 ...${NC}"
# 排除配置文件中的默认值（这些是正常的）
count_3000=$(grep -r "http://106.14.143.27:3000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts" | wc -l | tr -d ' ')

if [ "$count_3000" -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现硬编码的 API 地址 (3000端口)${NC}"
else
    echo -e "${RED}✗ 发现 $count_3000 处硬编码的 API 地址 (3000端口)${NC}"
    echo ""
    echo -e "${YELLOW}详细信息:${NC}"
    grep -rn "http://106.14.143.27:3000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts" | head -20
    if [ "$count_3000" -gt 20 ]; then
        echo -e "${YELLOW}... 还有 $((count_3000 - 20)) 处未显示${NC}"
    fi
fi

echo ""

# 检查 AI API 地址 (8000端口)
echo -e "${BLUE}检查 http://106.14.143.27:8000 ...${NC}"
# 排除配置文件中的默认值（这些是正常的）
count_8000=$(grep -r "http://106.14.143.27:8000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts" | wc -l | tr -d ' ')

if [ "$count_8000" -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现硬编码的 AI API 地址 (8000端口)${NC}"
else
    echo -e "${RED}✗ 发现 $count_8000 处硬编码的 AI API 地址 (8000端口)${NC}"
    echo ""
    echo -e "${YELLOW}详细信息:${NC}"
    grep -rn "http://106.14.143.27:8000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts"
fi

echo ""

# 检查 localhost 硬编码
echo -e "${BLUE}检查 localhost 硬编码...${NC}"
count_localhost=$(grep -r "http://localhost:3000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts" | wc -l | tr -d ' ')

if [ "$count_localhost" -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现硬编码的 localhost 地址${NC}"
else
    echo -e "${YELLOW}⚠ 发现 $count_localhost 处 localhost 地址 (可能是开发环境配置)${NC}"
    echo ""
    echo -e "${YELLOW}详细信息:${NC}"
    grep -rn "http://localhost:3000" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "config/api.ts" | head -10
fi

echo ""

# 检查是否使用了统一的 BASE_URL
echo -e "${BLUE}检查是否使用了统一的 BASE_URL 配置...${NC}"
files_with_base_url=$(grep -r "from '@/config/api'" src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✓ 有 $files_with_base_url 个文件使用了统一的 API 配置${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
total_hardcoded=$((count_3000 + count_8000))

if [ "$total_hardcoded" -eq 0 ]; then
    echo -e "${GREEN}✓ 检查完成！未发现硬编码的 API 地址${NC}"
    exit 0
else
    echo -e "${RED}✗ 检查完成！发现 $total_hardcoded 处硬编码的 API 地址${NC}"
    echo ""
    echo -e "${YELLOW}建议:${NC}"
    echo "  1. 运行替换脚本: node replace-hardcoded-api.js"
    echo "  2. 或手动替换为使用 BASE_URL 配置"
    exit 1
fi

