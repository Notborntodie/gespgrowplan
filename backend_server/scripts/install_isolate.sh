#!/bin/bash
# 安装 isolate 沙箱
# 用于轻量级、高性能的代码执行隔离

set -e

echo "=== 开始安装 isolate 沙箱 ==="

# 1. 安装依赖
echo "安装编译依赖..."
yum install -y gcc make libcap-devel

# 2. 下载 isolate 源码
echo "下载 isolate..."
cd /tmp
if [ -d "isolate" ]; then
    rm -rf isolate
fi

git clone https://github.com/ioi/isolate.git
cd isolate

# 3. 编译安装
echo "编译 isolate..."
make isolate

echo "安装 isolate..."
sudo make install

# 4. 配置权限
echo "配置 isolate 权限..."
sudo chmod 4755 /usr/local/bin/isolate

# 5. 初始化沙箱
echo "初始化沙箱..."
sudo isolate --init
sudo isolate --cleanup

# 6. 验证安装
echo "验证安装..."
isolate --version

# 7. 创建配置文件
cat > /etc/isolate.conf << 'EOF'
# isolate 配置文件
# 最大沙箱数量
box_count=10

# 沙箱根目录
box_root=/var/local/lib/isolate
EOF

echo "✓ isolate 安装完成！"
echo ""
echo "使用方法："
echo "  isolate --init           # 初始化沙箱"
echo "  isolate --run -- ./prog  # 运行程序"
echo "  isolate --cleanup        # 清理沙箱"

