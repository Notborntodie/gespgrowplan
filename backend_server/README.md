# 后端

Node.js + Express 的 GESP 练习系统 API 服务。

## 环境

- Node.js >= 18
- MySQL >= 8.0
- Redis >= 5.0
- isolate（判题沙箱）

## 开发

```bash
cp .env.example .env
# 编辑 .env 配置 DB_*、REDIS_*
npm install
npm run dev
```

默认 `http://localhost:3000`。

## 配置

环境变量见 `.env.example`，主要项：

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`
- `ALLOWED_ORIGINS`（CORS，逗号分隔）
- `BASE_URL`（生产环境建议配置）

## 生产部署

```bash
npm run pm2:start
# 或
pm2 start ecosystem.config.js --env production
```

## 相关文档

- [database/数据库.md](database/数据库.md) — 数据库设计
- [routes/README.md](routes/README.md) — API 路由说明
