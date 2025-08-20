# GESP 练习系统

GESP（图形化编程等级考试）练习系统，提供在线练习、考试管理和成绩分析功能。

## 项目结构

```
GESP/
├── GESP/                 # 前端Vue.js应用
│   ├── src/
│   │   ├── components/   # Vue组件
│   │   ├── views/        # 页面视图
│   │   ├── router/       # 路由配置
│   │   └── stores/       # 状态管理
│   └── package.json
├── backend_server/       # 后端Node.js服务器
│   ├── index.js         # 主服务器文件
│   ├── init.sql         # 数据库初始化脚本
│   └── package.json
├── Al_server/           # AI处理服务
│   └── pdf_to_json/     # PDF转JSON处理
└── README.md
```

## 功能特性

- 🎯 **多级考试系统**: 支持不同等级的GESP考试
- 📝 **题目管理**: 支持文本题和代码题
- 👥 **用户管理**: 用户注册、登录和权限管理
- 📊 **成绩分析**: 错题统计和成绩分析
- 🖼️ **图片上传**: 支持题目图片上传
- 📱 **响应式设计**: 适配不同设备屏幕

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vue Router
- Pinia (状态管理)
- Vite (构建工具)

### 后端
- Node.js + Express
- MySQL 8.0
- Multer (文件上传)
- CORS (跨域处理)

### 数据库
- MySQL 8.0
- 字符集: utf8mb4
- 排序规则: utf8mb4_unicode_ci

## 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd GESP
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend_server
npm install

# 安装前端依赖
cd ../GESP
npm install
```

3. **配置数据库**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据库结构
cd backend_server
mysql -u root -p gesp_practice_system < init.sql
```

4. **配置环境变量**
```bash
# 在backend_server目录创建.env文件
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=gesp_practice_system
```

5. **启动服务**
```bash
# 启动后端服务
cd backend_server
npm start

# 启动前端服务
cd ../GESP
npm run dev
```

## 部署指南

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## API文档

- [用户API](./backend_server/API_CHANGES.md)
- [考试API](./backend_server/EXAM_API_DOCUMENTATION.md)
- [题目API](./backend_server/QUESTION_API.md)
- [提交API](./backend_server/SUBMISSION_API_DOCUMENTATION.md)

## 数据库结构

详细的数据库结构请参考 [DATABASE_STRUCTURE.md](./backend_server/DATABASE_STRUCTURE.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。
