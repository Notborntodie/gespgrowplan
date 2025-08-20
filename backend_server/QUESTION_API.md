# 题目管理 API 文档

## 概述

题目管理API提供完整的CRUD操作，支持题目的创建、查询、更新和删除功能。题目独立于考试管理，支持知识点关联和选项管理。

## API 接口

### 1. 获取题目列表

**接口**: `GET /api/questions`

**功能**: 获取所有题目列表

**响应示例**:

```json
[
  {
    "id": 32,
    "question_text": "求解下图中A点到D点最短路径...",
    "question_type": "text",
    "question_code": null,
    "correct_answer": "对",
    "explanation": "这是一个关于Dijkstra算法的题目",
    "level": 5,
    "difficulty": "medium",
    "image_url": null,
    "question_date": "2025-08",
    "created_at": "2025-08-07T01:22:48.000Z",
    "updated_at": "2025-08-16T07:31:45.000Z"
  }
]
```

### 2. 获取题目详情

**接口**: `GET /api/questions/:questionId`

**功能**: 获取单个题目的详细信息，包括选项、知识点和图片

**路径参数**:

- `questionId`: 题目ID

**响应示例**:

```json
{
  "id": 32,
  "question_text": "求解下图中A点到D点最短路径...",
  "question_type": "text",
  "question_code": null,
  "correct_answer": "对",
  "explanation": "这是一个关于Dijkstra算法的题目",
  "level": 5,
  "difficulty": "medium",
  "image_url": null,
  "question_date": "2025-08",
  "created_at": "2025-08-07T01:22:48.000Z",
  "updated_at": "2025-08-16T07:31:45.000Z",
  "options": [
    {
      "id": 1,
      "question_id": 32,
      "option_label": "A",
      "option_value": "A",
      "option_text": "对",
      "created_at": "2025-08-07T01:22:48.000Z"
    }
  ],
  "knowledge_points": [
    {
      "id": 1,
      "name": "Dijkstra算法",
      "description": "最短路径算法",
      "category": "algorithm",
      "level": 5
    }
  ],
  "images": []
}
```

### 3. 创建题目

**接口**: `POST /api/questions`

**功能**: 创建新题目

**请求体**:

```json
{
  "question_text": "题目内容",
  "question_type": "text",
  "question_code": null,
  "correct_answer": "A",
  "explanation": "题目解释",
  "level": 3,
  "difficulty": "medium",
  "image_url": null,
  "question_date": "2025-07",
  "knowledge_point_ids": [1, 2],
  "options": [
    {
      "label": "A",
      "value": "A",
      "text": "选项A"
    },
    {
      "label": "B",
      "value": "B",
      "text": "选项B"
    }
  ]
}
```

**字段说明**:

- `question_text` (必需): 题目文本内容
- `question_type`: 题目类型，'text' 或 'code'，默认 'text'
- `question_code`: 题目代码内容（代码题使用）
- `correct_answer` (必需): 正确答案
- `explanation`: 题目解释
- `level`: 题目等级，1-5，默认 1
- `difficulty`: 题目难度，'easy'/'medium'/'hard'，默认 'medium'
- `image_url`: 题目图片URL
- `question_date`: 题目时间，格式 'YYYY-MM'
- `knowledge_point_ids`: 关联的知识点ID数组
- `options`: 选项数组

**响应示例**:

```json
{
  "message": "题目创建成功",
  "questionId": 33
}
```

### 4. 批量创建题目

**接口**: `POST /api/questions/batch`

**功能**: 批量创建多个题目

**请求体**:

```json
{
  "questions": [
    {
      "question_text": "题目1",
      "correct_answer": "A",
      "level": 2,
      "question_date": "2025-09"
    },
    {
      "question_text": "题目2",
      "correct_answer": "B",
      "level": 3,
      "question_date": "2025-09"
    }
  ]
}
```

**响应示例**:

```json
{
  "message": "批量创建成功，共创建 2 道题目",
  "results": [
    {
      "questionId": 33,
      "status": "success",
      "index": 1
    },
    {
      "questionId": 34,
      "status": "success",
      "index": 2
    }
  ]
}
```

### 5. 更新题目

**接口**: `PUT /api/questions/:questionId`

**功能**: 更新题目信息

**路径参数**:

- `questionId`: 题目ID

**请求体**: 与创建题目相同，所有字段都是可选的

**响应示例**:

```json
{
  "message": "题目更新成功"
}
```

### 6. 删除题目

**接口**: `DELETE /api/questions/:questionId`

**功能**: 删除题目

**路径参数**:

- `questionId`: 题目ID

**响应示例**:

```json
{
  "message": "题目删除成功"
}
```

## 错误处理

所有接口在发生错误时都会返回相应的HTTP状态码和错误信息：

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

常见错误状态码：

- `400`: 请求参数错误
- `404`: 题目不存在
- `500`: 服务器内部错误

## 数据验证

### 必需字段

- `question_text`: 不能为空
- `correct_answer`: 不能为空

### 字段格式

- `question_date`: 格式为 'YYYY-MM'，如 '2025-07'
- `level`: 整数，范围 1-5
- `difficulty`: 枚举值 'easy'/'medium'/'hard'
- `question_type`: 枚举值 'text'/'code'

## 关联数据

### 选项管理

- 更新题目时会删除所有旧选项，重新插入新选项
- 选项格式：`{label, value, text}`

### 知识点关联

- 更新题目时会删除所有旧的知识点关联，重新建立新的关联
- 知识点ID必须在 `knowledge_points` 表中存在

### 图片管理

- 支持题目主图片（`image_url`）
- 支持多张图片（通过 `question_images` 表）

## 使用示例

### 创建简单题目

```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "1+1等于多少？",
    "correct_answer": "A",
    "level": 1,
    "difficulty": "easy",
    "options": [
      {"label": "A", "value": "A", "text": "2"},
      {"label": "B", "value": "B", "text": "3"}
    ]
  }'
```

### 更新题目时间


---

*文档更新时间: 2025-08-16*
