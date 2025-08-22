# GESP练习系统云服务器部署指南

## 📁 需要上传的文件

### 核心文件
- `init_database.sql` - 数据库初始化脚本（包含完整结构和示例数据）
- `quick_deploy.sh` - 快速部署脚本（一键部署）
- `deploy_database.sh` - 完整部署脚本（交互式部署）
- `gesp_practice_system_complete.sql` - 完整数据库备份（可选）

### 配置文件
- `README_DEPLOYMENT.md` - 本部署指南

## 🚀 上传和部署步骤

### 1. 上传文件到服务器

#### 使用SCP命令上传
```bash
# 上传单个文件
scp init_database.sql username@server_ip:/path/to/destination/

# 上传多个文件
scp init_database.sql quick_deploy.sh deploy_database.sh username@server_ip:/path/to/destination/

# 上传整个目录（如果文件在同一目录）
scp -r ./deployment_files/ username@server_ip:/path/to/destination/
```

#### 使用SFTP上传
```bash
# 连接到服务器
sftp username@server_ip

# 上传文件
put init_database.sql
put quick_deploy.sh
put deploy_database.sh
put gesp_practice_system_complete.sql

# 退出
exit
```

#### 使用rsync同步（推荐）
```bash
# 同步文件到服务器
rsync -avz --progress ./deployment_files/ username@server_ip:/path/to/destination/
```

### 2. 在服务器上部署

#### 方法一：快速部署（推荐）
```bash
# 连接到服务器
ssh username@server_ip

# 进入文件目录
cd /path/to/destination/

# 给脚本执行权限
chmod +x quick_deploy.sh

# 运行快速部署脚本
./quick_deploy.sh
```

#### 方法二：交互式部署
```bash
# 连接到服务器
ssh username@server_ip

# 进入文件目录
cd /path/to/destination/

# 给脚本执行权限
chmod +x deploy_database.sh

# 运行交互式部署脚本
./deploy_database.sh
```

#### 方法三：手动部署
```bash
# 连接到服务器
ssh username@server_ip

# 进入文件目录
cd /path/to/destination/

# 手动执行SQL脚本
mysql -u root < init_database.sql

# 或者使用完整备份
mysql -u root < gesp_practice_system_complete.sql
```

## 🔧 服务器环境要求

### 系统要求
- Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- MySQL 5.7+ / MariaDB 10.2+
- 至少 1GB 内存
- 至少 10GB 磁盘空间

### 网络要求
- 开放端口：3306 (MySQL), 3000 (应用)
- 防火墙配置
- SSH访问权限

## 📋 部署检查清单

### 上传前检查
- [ ] 所有文件已准备就绪
- [ ] 服务器IP地址正确
- [ ] 服务器用户名和密码正确
- [ ] 服务器有足够磁盘空间

### 部署后检查
- [ ] 数据库创建成功
- [ ] 表结构正确
- [ ] 示例数据导入成功
- [ ] 数据库连接测试通过
- [ ] 配置文件生成正确

## 🔒 安全配置

### 数据库安全
```bash
# 修改默认密码
mysql -u root -e "ALTER USER 'gesp_user'@'localhost' IDENTIFIED BY 'new_strong_password';"

# 限制访问IP
mysql -u root -e "REVOKE ALL PRIVILEGES ON gesp_practice_system.* FROM 'gesp_user'@'%';"
mysql -u root -e "GRANT ALL PRIVILEGES ON gesp_practice_system.* TO 'gesp_user'@'your_app_server_ip';"
```

### 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 3306
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 📊 验证部署

### 数据库验证
```bash
# 连接数据库
mysql -u gesp_user -p gesp_practice_system

# 检查表数量
SHOW TABLES;

# 检查数据量
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM exams;

# 检查视图
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

### 应用连接测试
```bash
# 测试数据库连接
mysql -u gesp_user -p gesp_practice_system -e "SELECT 1;"
```

## 🆘 故障排除

### 常见问题

1. **连接被拒绝**
   ```bash
   # 检查MySQL服务状态
   sudo systemctl status mysql
   
   # 检查端口是否开放
   sudo netstat -tlnp | grep 3306
   ```

2. **权限不足**
   ```bash
   # 检查用户权限
   mysql -u root -e "SHOW GRANTS FOR 'gesp_user'@'localhost';"
   ```

3. **字符集问题**
   ```bash
   # 检查数据库字符集
   mysql -u root -e "SHOW VARIABLES LIKE 'character_set%';"
   ```

### 日志查看
```bash
# MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# 系统日志
sudo journalctl -u mysql -f
```

## 📞 技术支持

如果遇到问题，请提供以下信息：
- 服务器操作系统版本
- MySQL版本
- 错误日志
- 部署步骤截图

---

**注意：** 部署完成后请立即修改默认密码并配置安全策略！
