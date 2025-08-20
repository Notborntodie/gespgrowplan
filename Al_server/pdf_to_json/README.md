# PDF内容提取器

这是一个简单的PDF文本内容提取工具，使用FastAPI构建Web应用，可以上传PDF文件并提取其中的所有文本内容。

## 功能特点

- 🚀 **简单易用**: 只需上传PDF文件即可提取文本内容
- 📄 **完整提取**: 提取PDF中的所有文本内容，包括多页文档
- 🌐 **Web界面**: 提供友好的Web界面进行文件上传
- 📋 **一键复制**: 提取的内容可以一键复制到剪贴板
- 🔄 **实时处理**: 支持实时文件上传和处理

## 技术栈

- **后端**: FastAPI + Python
- **PDF处理**: PyPDF2
- **前端**: HTML + CSS + jQuery
- **服务器**: Uvicorn

## 安装和运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 访问应用

打开浏览器访问: `http://localhost:8000`

## 使用方法

1. **上传PDF文件**: 点击"选择PDF文件"按钮，选择要处理的PDF文件
2. **等待处理**: 系统会自动提取PDF中的文本内容
3. **查看结果**: 提取的文本内容会显示在结果区域
4. **复制内容**: 点击"复制内容"按钮可以将提取的文本复制到剪贴板

## API接口

### 文件上传接口

- **URL**: `POST /upload`
- **功能**: 上传PDF文件并提取文本内容
- **返回**: JSON格式的提取结果

```json
{
    "filename": "example.pdf",
    "content": "提取的文本内容...",
    "status": "success"
}
```

### API接口

- **URL**: `POST /api/extract`
- **功能**: 纯API接口，不包含Web界面
- **返回**: 与上传接口相同的JSON格式

## 项目结构

```
pdf_to_json/
├── main.py                    # 主应用程序
├── requirements.txt           # Python依赖包
├── README.md                 # 项目说明
├── .gitignore               # Git忽略文件
└── templates/
    └── upload.html           # 前端上传页面
```

## 注意事项

- 支持大多数标准PDF文件格式
- 提取效果取决于PDF文件的文本编码和格式
- 对于扫描版PDF或图片版PDF，可能无法提取文本内容
- 建议PDF文件大小不超过50MB以确保良好的处理性能

## 开发说明

这个项目是原PDF数据提取器的简化版本，专注于文本内容提取功能。如果您需要更复杂的PDF处理功能（如表格提取、结构化数据提取等），可以考虑集成其他PDF处理库或大模型服务。
