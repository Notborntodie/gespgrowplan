# PDF题目提取器

这是一个智能的PDF题目提取工具，使用大模型API将PDF中的题目转换为标准JSON格式。支持智能分割、并行处理和校准重试功能。

## 功能特点

- 🚀 **智能提取**: 使用大模型API智能识别和提取PDF中的题目
- 📄 **标准格式**: 将题目转换为标准JSON格式，包含题目文本、选项、答案等
- 🔄 **智能分割**: 自动将长文本分割为适合处理的片段
- ⚡ **并行处理**: 支持多线程并行处理，提高处理效率
- 🎯 **校准重试**: 当提取的题目数量不足时自动重试，确保提取质量
- 🌐 **Web界面**: 提供友好的Web界面进行文件上传和处理
- 📊 **实时进度**: 显示处理进度和状态信息

## 技术栈

- **后端**: FastAPI + Python
- **PDF处理**: pdfplumber
- **大模型API**: 阿里云DashScope (Qwen-Plus)
- **前端**: HTML + CSS + jQuery
- **服务器**: Uvicorn
- **并发处理**: ThreadPoolExecutor

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件并配置：

```bash
cp env.example .env
nano .env  # 或使用其他编辑器
```

在 `.env` 文件中设置：

```env
# 必需配置
DASHSCOPE_API_KEY=sk-你的实际API密钥
LLM_MODEL=qwen-plus-latest
```

**模型可选值：**
- `qwen-plus-latest` - 最新版（推荐）
- `qwen-turbo` - 快速版
- `qwen-max` - 最强版
- `qwen-plus` - 标准版

### 3. 启动服务

```bash
./start.sh
```

### 4. 访问应用

打开浏览器访问: `http://localhost:8000`

### 5. 停止服务

```bash
./stop.sh
```

### 6. 查看日志

```bash
tail -f server.log
```

## 使用方法

1. **上传PDF文件**: 点击"选择PDF文件"按钮，选择要处理的PDF文件
2. **设置参数**: 可选择设置预期题目数量和并行处理线程数
3. **等待处理**: 系统会自动分割文本并并行处理
4. **查看结果**: 提取的题目会以JSON格式显示在结果区域
5. **下载结果**: 可以下载JSON文件保存提取结果

## API接口

- **POST /upload**: 上传PDF文件并提取题目
- **POST /api/extract**: API接口，上传PDF并提取题目
- **POST /api/extract-raw**: 仅提取PDF原始文本
- **POST /api/stream-extract**: 流式处理PDF，实时返回题目
- **POST /api/generate-explanation**: 为单个题目生成详细解析
- **POST /api/generate-batch-explanations**: 批量生成题目解析
- **GET /progress/{progress_id}**: 查询处理进度

详细API文档请访问: `http://localhost:8000/docs`

## 注意事项

- 支持大多数标准PDF文件格式
- 提取效果取决于PDF文件的文本编码和格式
- 对于扫描版PDF或图片版PDF，可能无法提取文本内容
- 建议PDF文件大小不超过50MB以确保良好的处理性能
- 需要配置有效的DashScope API密钥
