# 信奥成长计划

信奥成长计划 - 专业的GESP编程能力等级认证训练系统

## 🎯 平台特色

信奥成长计划是一个专为信息学奥林匹克竞赛设计的综合性练习平台，支持：

- **GESP** - 青少年信息学能力等级认证
- **SmartOJ** - 智能在线判题系统

## 🚀 核心功能

- 📚 **多层级练习** - 从基础到高级的渐进式学习
- 🎯 **智能判题** - 实时编译运行和结果反馈
- 👥 **用户管理** - 学生、教师、管理员多角色支持
- 📊 **数据分析** - 学习进度和成绩统计

---

## 📋 系统要求

### 必需软件

- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **npm**: >= 9.0.0 (或使用 yarn/pnpm)
- **Git**: 最新版本

### 可选软件

- **Docker**: 用于容器化部署
- **Nginx**: 用于生产环境部署

### 验证安装

```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v

# 检查 Git 版本
git --version
```

---

## 🚀 快速开始

### 1. 克隆项目并安装依赖

```bash
git clone <repository-url>
cd frontend
npm install
```

### 2. 配置环境变量（开发环境）

创建 `.env` 文件：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:3000/api

# AI服务API基础URL（可选）
VITE_AI_API_BASE_URL=http://localhost:8000/api

# 开发环境模式
VITE_MODE=development
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可看到应用。

### 开发环境功能

- ✅ 热模块替换 (HMR)
- ✅ 源代码映射
- ✅ Vue DevTools 支持
- ✅ TypeScript 类型检查

---


## 📦 构建生产版本

### 标准构建

```bash
npm run build
```

构建产物将在 `dist/` 目录。

### 构建并类型检查

```bash
npm run build-with-check
```

### 预览生产构建

```bash
npm run preview
```

预览服务器将在 `http://localhost:4173` 启动。

---

## 🚀 部署到生产环境

### 快速开始

现在部署时，**只需要修改一个配置文件**即可！

### 部署步骤

#### 1. 创建部署配置文件

复制配置示例文件：

```bash
cp .deploy-config.example .deploy-config
```

#### 2. 修改配置文件

编辑 `.deploy-config` 文件，修改以下内容：

```bash
# 服务器配置
DEPLOY_SERVER_IP=你的服务器IP地址          # 修改这里
DEPLOY_SERVER_USER=root                    # 通常是 root，根据实际情况修改
DEPLOY_PATH=/var/www/gesp-frontend         # 部署路径，根据实际情况修改
NGINX_CONFIG_PATH=/etc/nginx/conf.d/gesp-frontend.conf  # Nginx配置路径

# API配置（最重要！）
API_BASE_URL=http://你的后端服务器IP:3000/api      # 修改这里
AI_API_BASE_URL=http://你的AI服务器IP:8000/api      # 如果有AI服务，修改这里
```

#### 3. 运行部署脚本

```bash
./deploy-frontend.sh --build
```

脚本会自动：

- 使用配置文件中的 API 地址构建前端
- 上传文件到服务器
- 配置 Nginx
- 设置文件权限
- 执行健康检查

### 配置说明

#### 必须修改的配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `DEPLOY_SERVER_IP` | 前端部署的服务器IP | `192.168.1.100` |
| `API_BASE_URL` | 后端API服务地址 | `http://192.168.1.100:3000/api` |

#### 可选修改的配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `DEPLOY_SERVER_USER` | SSH登录用户 | `root` |
| `DEPLOY_PATH` | 部署路径 | `/var/www/gesp-frontend` |
| `AI_API_BASE_URL` | AI服务地址（如果有） | `http://106.14.143.27:8000/api` |

### 部署到新服务器示例

#### 示例1: 部署到新服务器

假设：

- 前端服务器：`192.168.1.100`
- 后端API服务器：`192.168.1.101:3000`
- AI服务服务器：`192.168.1.102:8000`

**`.deploy-config` 文件内容：**

```bash
# 服务器配置
DEPLOY_SERVER_IP=192.168.1.100
DEPLOY_SERVER_USER=root
DEPLOY_PATH=/var/www/gesp-frontend
NGINX_CONFIG_PATH=/etc/nginx/conf.d/gesp-frontend.conf

# API配置
API_BASE_URL=http://192.168.1.101:3000/api
AI_API_BASE_URL=http://192.168.1.102:8000/api
```

然后运行：

```bash
./deploy-frontend.sh --build
```

#### 示例2: 使用环境变量（不创建配置文件）

如果不想创建配置文件，可以直接使用环境变量：

```bash
export DEPLOY_SERVER_IP=192.168.1.100
export API_BASE_URL=http://192.168.1.101:3000/api
export AI_API_BASE_URL=http://192.168.1.102:8000/api

./deploy-frontend.sh --build
```

#### 示例3: 后端和前端在同一服务器

如果后端和前端在同一服务器：

```bash
# 服务器配置
DEPLOY_SERVER_IP=192.168.1.100
DEPLOY_SERVER_USER=root

# API配置（使用同一服务器）
API_BASE_URL=http://192.168.1.100:3000/api
AI_API_BASE_URL=http://192.168.1.100:8000/api
```

### 验证部署

部署完成后，脚本会显示：

```text
[SUCCESS] 部署完成！

部署信息：
  - 服务器地址: 192.168.1.100
  - 部署路径: /var/www/gesp-frontend
  - 访问地址: http://192.168.1.100
  - Nginx配置: /etc/nginx/conf.d/gesp-frontend.conf
```

访问 `http://你的服务器IP` 即可查看前端应用。

### 部署总结

**部署时只需要：**

1. ✅ 创建 `.deploy-config` 文件
2. ✅ 修改 `DEPLOY_SERVER_IP` 和 `API_BASE_URL`
3. ✅ 运行 `./deploy-frontend.sh --build`

就这么简单！所有代码中的 API 地址都会自动使用配置文件中的值。

---

## ⚙️ API 配置说明

本项目已统一使用 `BASE_URL` 配置来管理后端API地址，方便在不同环境（开发、测试、生产）之间切换。

### 配置文件

所有API配置统一在 `src/config/api.ts` 中管理。

### 环境变量配置

#### 开发环境

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:3000/api

# AI服务API基础URL（可选）
VITE_AI_API_BASE_URL=http://localhost:8000/api
```

#### 生产环境

##### 方式1: 使用部署脚本（推荐）

创建 `.deploy-config` 文件（参考 `.deploy-config.example`）：

```bash
# 服务器配置
DEPLOY_SERVER_IP=your-server-ip
DEPLOY_SERVER_USER=root
DEPLOY_PATH=/var/www/gesp-frontend

# API配置
API_BASE_URL=http://your-api-server:3000/api
AI_API_BASE_URL=http://your-ai-server:8000/api
```

然后运行部署脚本：

```bash
./deploy-frontend.sh --build
```

##### 方式2: 使用环境变量

在构建时设置环境变量：

```bash
VITE_API_BASE_URL=http://your-api-server:3000/api npm run build
```

##### 方式3: 直接修改默认值

如果不想使用环境变量，可以直接修改 `src/config/api.ts` 中的默认值。

### 使用方式

在代码中导入并使用：

```typescript
import { BASE_URL, API_SERVER_BASE, AI_API_BASE_URL } from '@/config/api'

// 使用 BASE_URL 进行API调用
const response = await axios.get(`${BASE_URL}/users`)

// 使用 API_SERVER_BASE 处理图片等静态资源
const imageUrl = `${API_SERVER_BASE}/uploads/image.jpg`

// 使用 AI_API_BASE_URL 调用AI服务
const aiResponse = await fetch(`${AI_API_BASE_URL}/generate-explanation`)
```

### 迁移到新服务器

1. 复制 `.deploy-config.example` 为 `.deploy-config`
2. 修改 `.deploy-config` 中的服务器和API地址
3. 运行 `./deploy-frontend.sh --build` 进行部署

或者：

1. 设置环境变量：

   ```bash
   export DEPLOY_SERVER_IP=your-new-server-ip
   export API_BASE_URL=http://your-new-api-server:3000/api
   ```

2. 运行部署脚本：

   ```bash
   ./deploy-frontend.sh --build
   ```

### 注意事项

- 所有硬编码的API地址已替换为统一的配置
- 开发环境默认使用 `http://localhost:3000/api`
- 生产环境默认使用 `http://106.14.143.27:3000/api`（可通过环境变量覆盖）
- 环境变量必须以 `VITE_` 开头才能在Vite构建时被注入

---

## 🔧 环境变量配置

### 环境变量说明

| 变量名 | 说明 | 开发环境默认值 | 生产环境 |
|--------|------|---------------|----------|
| `VITE_API_BASE_URL` | 后端API基础URL | `http://localhost:3000/api` | 通过部署配置设置 |
| `VITE_AI_API_BASE_URL` | AI服务API基础URL | `http://localhost:8000/api` | 通过部署配置设置 |
| `VITE_MODE` | 运行模式 | `development` | `production` |

### 环境变量优先级

1. 命令行环境变量（最高优先级）
2. `.env.production` / `.env.development` / `.env.local`
3. `.env`
4. `src/config/api.ts` 中的默认值（最低优先级）

### 环境变量文件

项目支持以下环境变量文件：

- `.env` - 所有环境的默认值
- `.env.local` - 本地覆盖（通常添加到 .gitignore）
- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.test` - 测试环境

**注意**: `.env.local` 文件不应提交到版本控制系统。

---



## 📂 目录结构

```text
GESP/
├── src/                 # 源代码
│   ├── components/      # Vue 组件
│   ├── views/          # 页面视图
│   ├── stores/         # 状态管理
│   ├── config/         # 配置文件（API配置）
│   └── ...
├── e2e/                # E2E 测试
├── dist/               # 构建输出（生产）
├── .env                # 环境变量（开发）
├── .deploy-config      # 部署配置（生产）
└── package.json        # 项目配置
```

---
