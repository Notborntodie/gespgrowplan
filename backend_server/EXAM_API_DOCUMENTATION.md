# GESP练习系统 - 考试管理API文档

## 基础信息
- 服务器地址: `http://localhost:3000`
- 基础路径: `/api`
- 数据格式: `application/json`

## 1. 考试管理API

### 1.1 获取所有考试列表
```http
GET /api/exams
```

**响应示例:**
```json
[
  {
    "id": 1,
    "name": "GESP五级链表专题",
    "level": 5,
    "description": "掌握链表相关知识",
    "total_questions": 11,
    "question_count": 11,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 1.2 获取单个考试详情
```http
GET /api/exams/:examId
```

**路径参数:**
- `examId`: 考试ID

**响应示例:**
```json
{
  "exam": {
    "id": 1,
    "name": "GESP五级链表专题",
    "level": 5,
    "description": "掌握链表相关知识",
    "total_questions": 11,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "questions": [
    {
      "id": 1,
      "question_number": 1,
      "question_text": "链表的存储空间物理上可以连续，也可以不连续。",
      "question_type": "text",
      "question_code": null,
      "correct_answer": "A",
      "explanation": "对。链表的节点在内存中可以连续，也可以不连续。",
      "level": 5,
      "difficulty": "medium",
      "image_url": null,
      "options": [
        {
          "option_label": "A",
          "option_value": "A",
          "option_text": "对"
        },
        {
          "option_label": "B",
          "option_value": "B",
          "option_text": "错"
        }
      ],
      "images": []
    }
  ]
}
```

### 1.3 创建新考试
```http
POST /api/exams
```

**请求体:**
```json
{
  "name": "GESP四级数组专题",
  "level": 4,
  "description": "掌握数组相关知识",
  "question_ids": [
    {
      "id": 1,
      "question_number": 1
    },
    {
      "id": 2,
      "question_number": 2
    },
    3,  // 也可以直接传题目ID，题号会自动递增
    4
  ]
}
```

**响应示例:**
```json
{
  "message": "考试创建成功",
  "examId": 2,
  "questionCount": 4
}
```

### 1.4 更新考试信息
```http
PUT /api/exams/:examId
```

**路径参数:**
- `examId`: 考试ID

**请求体:**
```json
{
  "name": "GESP四级数组专题（更新版）",
  "level": 4,
  "description": "掌握数组相关知识，包含更多练习",
  "question_ids": [
    {
      "id": 1,
      "question_number": 1
    },
    {
      "id": 5,
      "question_number": 2
    },
    {
      "id": 6,
      "question_number": 3
    }
  ]
}
```

**响应示例:**
```json
{
  "message": "考试更新成功"
}
```

### 1.5 删除考试
```http
DELETE /api/exams/:examId
```

**路径参数:**
- `examId`: 考试ID

**响应示例:**
```json
{
  "message": "考试删除成功"
}
```

### 1.6 获取可用题目列表
```http
GET /api/available-questions
```

**查询参数:**
- `level` (可选): 题目等级
- `difficulty` (可选): 题目难度 (easy, medium, hard)
- `category` (可选): 知识点分类
- `exam_id` (可选): 考试ID，如果提供则排除已在此考试中的题目

**响应示例:**
```json
[
  {
    "id": 1,
    "question_text": "链表的存储空间物理上可以连续，也可以不连续。",
    "question_type": "text",
    "question_code": null,
    "correct_answer": "A",
    "explanation": "对。链表的节点在内存中可以连续，也可以不连续。",
    "level": 5,
    "difficulty": "medium",
    "image_url": null,
    "knowledge_points": "链表基础, 数据结构"
  }
]
```

## 2. 数据库结构说明

### 2.1 新的多对多关系
经过重构后，题目和考试现在是多对多关系：

- **题目表 (questions)**: 不再包含 `exam_id` 字段
- **考试-题目关联表 (exam_questions)**: 存储考试和题目的关联关系
  - `exam_id`: 考试ID
  - `question_id`: 题目ID
  - `question_number`: 题目在考试中的编号

### 2.2 优势
1. **题目复用**: 一个题目可以在多个考试中使用
2. **灵活组合**: 可以自由组合题目创建不同的考试
3. **数据一致性**: 题目内容修改后，所有使用该题目的考试都会更新
4. **统计方便**: 可以统计题目的使用频率和效果

## 3. 使用示例

### 3.1 创建包含现有题目的考试
```javascript
// 1. 先获取可用题目
const availableQuestions = await fetch('/api/available-questions?level=5&difficulty=medium');

// 2. 选择题目创建考试
const newExam = {
  name: "GESP五级综合练习",
  level: 5,
  description: "包含链表、数组等综合练习",
  question_ids: [
    { id: 1, question_number: 1 },
    { id: 2, question_number: 2 },
    { id: 5, question_number: 3 }
  ]
};

const response = await fetch('/api/exams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newExam)
});
```

### 3.2 更新考试题目
```javascript
// 为现有考试添加新题目
const examUpdate = {
  question_ids: [
    { id: 1, question_number: 1 },
    { id: 2, question_number: 2 },
    { id: 5, question_number: 3 },
    { id: 8, question_number: 4 }  // 新增题目
  ]
};

const response = await fetch('/api/exams/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(examUpdate)
});
```

## 4. 错误处理

所有API都包含详细的错误信息：

```json
{
  "error": "考试创建失败",
  "details": "题目ID 999 不存在"
}
```

常见错误：
- `考试不存在`: 指定的考试ID不存在
- `题目ID X 不存在`: 指定的题目ID不存在
- `题目ID X 已经在此考试中`: 题目重复添加
- `题号 X 在此考试中已存在`: 题号重复
- `缺少必需参数`: 缺少name或level参数 