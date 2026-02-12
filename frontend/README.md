# 前端

[gespgrowplan](https://github.com/Notborntodie/gespgrowplan) 项目的前端模块，Vue 3 + TypeScript + Vite 构建。

## 开发

```bash
npm install
npm run dev
```

默认 `http://localhost:5173`。开发环境会自动使用当前 host 请求后端（如 `http://<host>:3000/api`），便于外网访问调试。

## 构建

```bash
npm run build
```

产物在 `dist/`。

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API | 开发时 `http://<host>:3000/api` |
| `VITE_AI_API_BASE_URL` | AI 服务 API | 开发时 `http://<host>:8000/api` |

生产环境需在构建时注入，或通过部署脚本配置。

## 部署

1. 复制配置：`cp .deploy-config.example .deploy-config`
2. 修改 `.deploy-config` 中的 `DEPLOY_SERVER_IP`、`API_BASE_URL`、`AI_API_BASE_URL`
3. 执行：`./deploy-frontend.sh --build`

脚本会构建、上传并配置 Nginx。详见根目录 [README.md](../README.md)。

## 项目

- 仓库：https://github.com/Notborntodie/gespgrowplan
