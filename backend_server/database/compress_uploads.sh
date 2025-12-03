#!/bin/bash
# uploads 目录压缩脚本
# 使用方法：./compress_uploads.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
UPLOADS_DIR="$BACKEND_DIR/uploads"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}压缩 uploads 目录${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 uploads 目录是否存在
if [ ! -d "$UPLOADS_DIR" ]; then
    echo -e "${YELLOW}警告: uploads 目录不存在: $UPLOADS_DIR${NC}"
    exit 1
fi

# 检查目录是否为空
if [ -z "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
    echo -e "${YELLOW}警告: uploads 目录为空${NC}"
    exit 1
fi

# 显示目录大小
echo "检查 uploads 目录大小..."
UPLOADS_SIZE=$(du -sh "$UPLOADS_DIR" | cut -f1)
echo "目录大小: $UPLOADS_SIZE"
echo ""

# 生成压缩文件名（带时间戳）
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKEND_DIR/uploads_backup_${TIMESTAMP}.tar.gz"

echo "开始压缩..."
echo "目标文件: $BACKUP_FILE"
echo ""

# 压缩 uploads 目录（排除 .git 相关文件）
cd "$BACKEND_DIR"
tar --exclude='uploads/.git*' -czf "$BACKUP_FILE" uploads/

# 检查压缩是否成功
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}压缩成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "压缩文件: $BACKUP_FILE"
    echo "压缩文件大小: $BACKUP_SIZE"
    echo "原始目录大小: $UPLOADS_SIZE"
    echo ""
    echo "下一步："
    echo "  1. 将压缩文件传输到新服务器"
    echo "  2. 在新服务器上解压: tar -xzf uploads_backup_*.tar.gz"
    echo "  3. 设置权限: chmod -R 755 uploads/"
else
    echo ""
    echo -e "${RED}压缩失败！${NC}"
    exit 1
fi

