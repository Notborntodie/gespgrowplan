# GESP练习系统后端服务器

## 项目概述

GESP练习系统的后端服务器，基于Node.js + Express + MySQL构建，提供RESTful API接口。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL 8.0
- **ORM**: mysql2
- **文件上传**: multer
- **跨域处理**: cors

## 项目结构

```
backend_server/
├── index.js              # 主服务器文件
├── package.json          # 项目依赖配置
├── package-lock.json     # 依赖锁定文件
├── env.example           # 环境变量配置示例
├── init.sql              # 数据库初始化脚本
├── uploads/              # 文件上传目录
├── node_modules/         # 依赖包目录
└── docs/                 # 文档目录
    ├── DATABASE_STRUCTURE.md
    ├── QUESTION_API.md
    ├── SUBMISSION_API_DOCUMENTATION.md
    ├── API_CHANGES.md
    ├── create_wrong_questions_view.sql
    ├── update.sql
    └── update_database.sql
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：
```env
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=106.14.143.27
DB_PORT=3306
DB_NAME=gesp_practice_system
DB_USER=gesp_user
DB_PASSWORD=Gesp@2025!

# 其他配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 3. 初始化数据库

```bash
mysql -h 106.14.143.27 -P 3306 -u gesp_user -p'Gesp@2025!' gesp_practice_system < init.sql
```

### 4. 启动服务器

```bash
npm start
```

或者开发模式：
```bash
npm run dev
```

## 数据库配置

### 连接信息
- **主机**: 106.14.143.27
- **端口**: 3306
- **数据库**: gesp_practice_system
- **用户名**: gesp_user
- **字符集**: utf8mb4

### 连接配置
```javascript
const dbConfig = {
  host: '106.14.143.27',
  user: 'gesp_user',
  password: 'Gesp@2025!',
  database: 'gesp_practice_system',
  charset: 'utf8mb4'
};
```

## API接口

### 用户管理
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录

### 考试管理
- `GET /api/exam/:examId` - 获取考试信息
- `POST /api/exam/:examId/submit` - 提交考试答案
- `GET /api/exams` - 获取考试列表

### 题目管理
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目

### 文件上传
- `POST /api/upload` - 上传文件
- `GET /uploads/:filename` - 访问上传的文件

### 成绩管理
- `GET /api/submissions` - 获取提交记录
- `GET /api/submissions/:id` - 获取提交详情

## 开发指南

### 添加新的API接口

1. 在 `index.js` 中添加新的路由
2. 实现相应的处理函数
3. 更新文档

### 数据库操作

使用mysql2的promise接口：
```javascript
const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
```

### 错误处理

使用try-catch包装异步操作：
```javascript
try {
  const result = await someAsyncOperation();
  res.json(result);
} catch (error) {
  console.error('操作失败:', error);
  res.status(500).json({ error: '服务器错误' });
}
```

## 部署

### 生产环境部署

1. 设置环境变量
2. 安装PM2: `npm install -g pm2`
3. 启动服务: `pm2 start index.js --name gesp-backend`
4. 设置开机自启: `pm2 startup && pm2 save`

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## 监控和日志

### 日志配置
- 错误日志: 控制台输出
- 访问日志: 可配置为文件输出

### 性能监控
- 数据库连接池监控
- API响应时间监控
- 内存使用监控

## 安全配置

### 数据库安全
- 使用专用数据库用户
- 限制数据库访问IP
- 定期更换密码

### API安全
- 输入验证和过滤
- SQL注入防护
- 文件上传安全检查

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查网络连接
   - 验证数据库配置
   - 确认用户权限

2. **文件上传失败**
   - 检查uploads目录权限
   - 验证文件大小限制
   - 确认文件类型

3. **API响应慢**
   - 检查数据库查询性能
   - 优化连接池配置
   - 监控服务器资源

## 联系支持

如有问题，请联系开发团队或查看文档目录中的详细文档。

