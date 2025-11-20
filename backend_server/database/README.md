# GESP练习系统数据库

这个文件夹包含了完整的数据库备份和文档，可以用于在新服务器上快速部署数据库。

## 文件说明

- **数据库.md** - 完整的数据库 ER 图设计和表结构文档
- **gesp_practice_system_dump_20251120_163206.sql** - 数据库完整导出文件（包含结构和数据）
- **import_database.sh** - 数据库导入脚本

## 快速开始

### 方法一：使用导入脚本（推荐）

1. 给脚本添加执行权限：
```bash
chmod +x import_database.sh
```

2. 运行导入脚本：
```bash
# 基本用法（会提示输入密码）
./import_database.sh -p 'your_password'

# 指定所有参数
./import_database.sh -h 192.168.1.100 -P 3306 -u gesp_user -p 'Gesp@2025!' -d gesp_practice_system

# 如果数据库不存在，自动创建
./import_database.sh -p 'your_password' --create-db

# 查看帮助
./import_database.sh --help
```

### 方法二：手动导入

1. 创建数据库：
```bash
mysql -h <主机> -u <用户名> -p -e "CREATE DATABASE gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. 导入数据：
```bash
mysql -h <主机> -u <用户名> -p gesp_practice_system < gesp_practice_system_dump_20251120_163206.sql
```

## 数据库信息

- **数据库名**: gesp_practice_system
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

## 导入脚本选项

```
-h, --host HOST         数据库主机地址 (默认: localhost)
-P, --port PORT         数据库端口 (默认: 3306)
-u, --user USER         数据库用户名 (默认: root)
-p, --password PASS     数据库密码
-d, --database DB       数据库名称 (默认: gesp_practice_system)
-f, --file FILE         SQL文件路径
--create-db             如果数据库不存在则创建
--drop-db               导入前删除现有数据库（危险！）
--help                  显示帮助信息
```

## 注意事项

1. **备份现有数据**: 如果目标服务器上已有同名数据库，导入前请先备份
2. **权限要求**: 确保数据库用户有创建数据库和导入数据的权限
3. **字符集**: 数据库使用 utf8mb4 字符集，确保 MySQL 版本支持
4. **磁盘空间**: 确保有足够的磁盘空间（建议至少 100MB 可用空间）
5. **导入时间**: 根据数据量大小，导入可能需要几分钟时间

## 验证导入

导入完成后，可以执行以下命令验证：

```bash
mysql -h <主机> -u <用户名> -p gesp_practice_system -e "SHOW TABLES;"
```

## 数据库结构

详细的数据库结构说明请查看 **数据库.md** 文件。

## 支持

如有问题，请查看项目文档或联系开发团队。

