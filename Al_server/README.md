# AI 服务

[gespgrowplan](https://github.com/Notborntodie/gespgrowplan) 项目的 AI 模块，基于 FastAPI 的 PDF 题目提取与解析生成，使用 DashScope（Qwen）API。

## 安装

```bash
pip install -r requirements.txt
```

## 配置

```bash
cp .env.example .env
```

在 `.env` 中设置：

- `DASHSCOPE_API_KEY` — 阿里云 DashScope API 密钥
- `LLM_MODEL` — 模型，如 `qwen-plus-latest`

## 启动

```bash
./start.sh
```

默认 `http://localhost:8000`，API 文档 `/docs`。

## API

- `POST /api/extract` — PDF 题目提取
- `POST /api/stream-extract` — 流式提取
- `POST /api/generate-explanation` — 单题解析生成
- `POST /api/generate-batch-explanations` — 批量解析生成
