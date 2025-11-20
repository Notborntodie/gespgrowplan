# GESP练习系统后端服务

## 项目简介

GESP练习系统后端服务是一个基于 Node.js 和 Express 的在线判题系统后端，提供用户认证、题目管理、在线判题、学习计划等功能。

## 项目结构

```
backend_server/
├── app.js                 # Express应用主文件
├── server.js              # 服务器启动入口
├── package.json           # 项目依赖配置
├── ecosystem.config.js    # PM2配置文件
├── env.example            # 环境变量示例文件
├── config/                # 配置文件目录
│   ├── database.js        # 数据库连接配置
│   ├── cache.js           # Redis缓存配置
│   └── logger.js          # 日志配置
├── middleware/            # 中间件目录
│   ├── rateLimit.js       # 限流中间件
│   └── security.js        # 安全中间件
├── routes/                # 路由目录
│   ├── index.js           # 路由入口
│   ├── auth.js            # 认证路由
│   ├── users.js           # 用户路由
│   ├── oj.js              # 在线判题路由
│   ├── exams.js           # 考试路由
│   ├── questions.js       # 题目路由
│   ├── submissions.js     # 提交记录路由
│   ├── knowledge.js       # 知识点路由
│   ├── learningPlans.js   # 学习计划路由
│   └── teachers.js        # 教师路由
├── services/              # 服务层目录
│   ├── containerPool.js   # 容器池管理
│   ├── isolateJudge.js    # 隔离判题服务
│   └── judgeQueue.js      # 判题队列服务
├── database/              # 数据库相关
│   ├── *.sql              # 数据库备份文件
│   └── import_database.sh # 数据库导入脚本
├── scripts/               # 脚本目录
│   └── *.js               # 各种工具脚本
├── logs/                  # 日志目录
├── uploads/               # 上传文件目录
├── oj_data/               # OJ题目数据目录
└── isolate-master/        # isolate隔离执行环境
```

## 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7 或 MySQL >= 8.0
- Redis >= 5.0
- PM2 (用于生产环境部署)
- isolate (用于代码隔离执行)

## 安装步骤

### 1. 克隆项目并安装依赖

```bash
cd backend_server
npm install
```

### 2. 配置环境变量

复制 `env.example` 文件为 `.env` 并修改相应配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置数据库、Redis等信息。**注意：项目已配置为自动从 `.env` 文件读取环境变量，无需手动修改配置文件。**

**重要提示：**
- 项目使用 `dotenv` 包自动加载 `.env` 文件
- 所有配置项都有默认值，如果 `.env` 文件中没有设置，将使用默认值
- 生产环境建议使用 `.env` 文件配置，不要将敏感信息硬编码在代码中

### 3. 安装 isolate

直接下载 isolate-master 仓库并安装：

```bash
# 1. 安装编译依赖
yum install -y gcc make libcap-devel

# 2. 下载 isolate-master 仓库（如果尚未下载）
# 将 isolate-master 仓库下载到项目根目录

# 3. 编译安装
cd isolate-master
make isolate
sudo make install

# 4. 配置权限
sudo chmod 4755 /usr/local/bin/isolate

# 5. 初始化沙箱
sudo isolate --init
sudo isolate --cleanup

# 6. 验证安装
isolate --version
```

## 数据库配置

### 配置文件位置

数据库配置位于 `config/database.js` 文件中。

### 配置说明

数据库使用 MySQL 连接池管理连接，主要配置项如下：

```javascript
const dbConfig = {
  host: '数据库主机地址',
  user: '数据库用户名',
  password: '数据库密码',
  database: '数据库名称',
  charset: 'utf8mb4',
  connectionLimit: 20,           // 连接池大小
  acquireTimeout: 60000,         // 获取连接超时时间（毫秒）
  timeout: 60000,               // 查询超时时间（毫秒）
  reconnect: true,              // 自动重连
  enableKeepAlive: true,        // 启用连接保活
  // ... 其他配置
};
```

### 配置方式

**项目已支持从环境变量读取配置（推荐方式）**

在 `.env` 文件中配置数据库信息，系统会自动读取：

```env
# 数据库配置
DB_HOST=106.14.143.27
DB_PORT=3306
DB_NAME=gesp_practice_system
DB_USER=gesp_user
DB_PASSWORD=Gesp@2025!
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
DB_MAX_IDLE=60000
DB_IDLE_TIMEOUT=60000
```

**说明：**
- `config/database.js` 已配置为优先从环境变量读取，如果环境变量不存在则使用默认值
- 所有配置项都可以通过环境变量设置
- 无需修改代码文件，只需配置 `.env` 文件即可

### 数据库初始化

1. 创建数据库：
```sql
CREATE DATABASE gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
cd database
bash import_database.sh
```

或者手动导入SQL文件：
```bash
mysql -u gesp_user -p gesp_practice_system < gesp_practice_system_dump_20251120_163206.sql
```

### 连接池优化建议

- **connectionLimit**: 根据服务器性能和并发需求调整，建议值：10-50
- **acquireTimeout**: 获取连接的超时时间，建议值：30000-60000ms
- **timeout**: 查询超时时间，建议值：30000-60000ms
- **enableKeepAlive**: 生产环境建议启用，保持连接活跃

### 健康检查

系统会自动进行数据库连接健康检查（每5分钟一次），确保连接池正常工作。

## Cache配置

### 配置文件位置

Redis缓存配置位于 `config/cache.js` 文件中。

### 配置说明

Redis使用 ioredis 客户端，主要配置项如下：

```javascript
const redisConfig = {
  host: '127.0.0.1',        // Redis主机地址
  port: 6379,               // Redis端口
  password: null,           // Redis密码（如果有）
  db: 0,                    // 数据库编号
  lazyConnect: true,        // 延迟连接
  maxRetriesPerRequest: 3,  // 最大重试次数
  connectTimeout: 10000,    // 连接超时时间（毫秒）
  commandTimeout: 5000      // 命令超时时间（毫秒）
};
```

### 配置方式

**项目已支持从环境变量读取配置（推荐方式）**

在 `.env` 文件中配置Redis信息，系统会自动读取：

```env
# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
```

**说明：**
- `config/cache.js` 已配置为优先从环境变量读取，如果环境变量不存在则使用默认值
- 所有配置项都可以通过环境变量设置
- 无需修改代码文件，只需配置 `.env` 文件即可

### Redis安装与启动

#### Ubuntu/Debian系统

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### CentOS/RHEL系统

```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### 验证Redis运行状态

```bash
redis-cli ping
# 应该返回: PONG
```

### 缓存功能说明

系统提供了以下缓存功能：

1. **通用缓存中间件** (`cacheMiddleware`): 自动缓存GET请求的响应
2. **缓存工具函数** (`cacheUtils`): 提供set、get、del等缓存操作
3. **知识点缓存管理** (`cacheUtils.knowledge`): 专门管理知识点相关缓存
4. **OJ缓存管理** (`cacheUtils.oj`): 专门管理在线判题相关缓存

### 缓存键命名规范

- 通用缓存: `cache:{路由路径}`
- 知识点缓存: `cache:knowledge:*`
- OJ题目缓存: `cache:oj:problem:{题目ID}`
- OJ样例缓存: `cache:oj:samples:{题目ID}`

### 健康检查

系统会自动进行Redis连接健康检查（每3分钟一次），确保缓存服务正常工作。

## PM2部署

### PM2简介

PM2是一个Node.js进程管理器，可以保持应用持续运行，并提供负载均衡、自动重启、日志管理等功能。

### 安装PM2

```bash
npm install -g pm2
```

### 配置文件说明

PM2配置文件为 `ecosystem.config.js`，主要配置项：

```javascript
{
  name: 'gesp-api',              // 应用名称
  script: './server.js',          // 启动脚本
  instances: 'max',              // 实例数量（max表示使用所有CPU核心）
  exec_mode: 'cluster',          // 执行模式（cluster集群模式）
  env: {
    NODE_ENV: 'development',     // 开发环境
    PORT: 3000
  },
  env_production: {
    NODE_ENV: 'production',      // 生产环境
    PORT: 3000
  },
  autorestart: true,             // 自动重启
  max_memory_restart: '1G',      // 内存超过1G时重启
  log_file: './logs/combined.log',  // 日志文件路径
  // ... 其他配置
}
```

### 部署步骤

#### 1. 启动应用

```bash
# 使用PM2启动（开发环境）
npm run pm2:start

# 或者直接使用PM2命令
pm2 start ecosystem.config.js

# 启动生产环境
pm2 start ecosystem.config.js --env production
```

#### 2. 查看应用状态

```bash
# 查看所有应用状态
pm2 list

# 查看详细信息
pm2 show gesp-api

# 查看实时监控
npm run pm2:monit
# 或
pm2 monit
```

#### 3. 查看日志

```bash
# 查看所有日志
npm run pm2:logs

# 或使用PM2命令
pm2 logs gesp-api

# 查看最近100行日志
pm2 logs gesp-api --lines 100

# 清空日志
pm2 flush
```

#### 4. 重启应用

```bash
# 重启应用
npm run pm2:restart

# 或
pm2 restart gesp-api

# 优雅重启（零停机）
pm2 reload gesp-api
```

#### 5. 停止应用

```bash
# 停止应用
pm2 stop gesp-api

# 停止所有应用
pm2 stop all

# 删除应用
pm2 delete gesp-api
```

### PM2常用命令

```bash
# 保存当前进程列表（开机自启）
pm2 save

# 生成开机自启脚本
pm2 startup

# 查看应用资源使用情况
pm2 status

# 查看应用详细信息
pm2 describe gesp-api

# 重启所有应用
pm2 restart all

# 停止所有应用
pm2 stop all

# 删除所有应用
pm2 delete all

# 查看应用CPU和内存使用
pm2 monit
```

### 集群模式说明

配置文件中的 `instances: 'max'` 表示使用所有CPU核心运行应用实例，实现负载均衡。

- **优点**: 充分利用多核CPU，提高并发处理能力
- **注意**: 确保数据库连接池大小足够支持多个实例

### 日志管理

PM2会自动将日志输出到 `logs/` 目录：

- `logs/combined.log`: 所有日志
- `logs/out.log`: 标准输出日志
- `logs/error.log`: 错误日志

日志文件会自动轮转，单个文件最大5MB，保留5个文件。

### 开机自启配置

```bash
# 1. 保存当前PM2进程列表
pm2 save

# 2. 生成开机自启脚本
pm2 startup

# 3. 执行生成的命令（会显示类似下面的命令）
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user
```

### 性能监控

PM2提供了内置的性能监控功能：

```bash
# 实时监控
pm2 monit

# 查看详细指标
pm2 describe gesp-api
```

### 环境变量配置

可以在 `ecosystem.config.js` 中配置环境变量，也可以使用 `.env` 文件：

```javascript
env_file: '.env'  // 指定环境变量文件
```

## 环境变量配置

### 必需的环境变量

在 `.env` 文件中配置以下变量（参考 `env.example` 文件）：

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=106.14.143.27
DB_PORT=3306
DB_NAME=gesp_practice_system
DB_USER=gesp_user
DB_PASSWORD=Gesp@2025!
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
DB_MAX_IDLE=60000
DB_IDLE_TIMEOUT=60000

# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 环境变量加载说明

- 项目使用 `dotenv` 包自动加载 `.env` 文件
- `server.js` 在启动时会自动加载 `.env` 文件中的环境变量
- 所有配置项都有默认值，如果 `.env` 文件中没有设置，将使用代码中的默认值
- 环境变量的优先级高于代码中的默认值

### 安全建议

1. **不要将 `.env` 文件提交到版本控制系统**
2. **生产环境使用强密码**
3. **定期更换数据库和Redis密码**
4. **使用环境变量而非硬编码配置**

## 启动方式

### 开发环境

```bash
# 使用nodemon（自动重启）
npm run dev

# 或直接使用node
npm start
```

### 生产环境

```bash
# 使用PM2（推荐）
npm run pm2:start

# 或
pm2 start ecosystem.config.js --env production
```

## 健康检查

应用提供了健康检查接口：

```bash
curl http://localhost:3000/health
```

返回示例：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "uptime": 3600,
  "memory": {...},
  "database": "connected"
}
```

## 常见问题

### 1. 数据库连接失败

- 检查数据库服务是否运行
- 检查数据库配置是否正确
- 检查防火墙是否开放数据库端口
- 检查数据库用户权限

### 2. Redis连接失败

- 检查Redis服务是否运行：`redis-cli ping`
- 检查Redis配置是否正确
- 检查防火墙是否开放Redis端口

### 3. PM2启动失败

- 检查Node.js版本是否符合要求
- 检查端口是否被占用
- 查看PM2日志：`pm2 logs gesp-api`

### 4. 内存占用过高

- 调整 `max_memory_restart` 配置
- 检查是否有内存泄漏
- 减少PM2实例数量

## 项目迁移指南

### 迁移到新服务器步骤

1. **备份数据**
   ```bash
   # 备份数据库
   mysqldump -u gesp_user -p gesp_practice_system > backup.sql
   
   # 备份上传文件
   tar -czf uploads_backup.tar.gz uploads/
   ```

2. **在新服务器上安装依赖**
   ```bash
   # 安装Node.js、MySQL、Redis
   # 克隆项目代码
   npm install
   ```

3. **配置环境**
   ```bash
   # 复制并配置.env文件
   cp env.example .env
   # 编辑.env文件，修改数据库和Redis配置
   ```

4. **导入数据**
   ```bash
   # 创建数据库
   mysql -u root -p
   CREATE DATABASE gesp_practice_system;
   
   # 导入数据
   mysql -u gesp_user -p gesp_practice_system < backup.sql
   ```

5. **启动服务**
   ```bash
   # 使用PM2启动
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

## 技术支持

如有问题，请查看：
- 日志文件：`logs/` 目录
- PM2日志：`pm2 logs gesp-api`
- 数据库日志：MySQL错误日志
- Redis日志：Redis日志文件

## 许可证

[根据项目实际情况填写]

