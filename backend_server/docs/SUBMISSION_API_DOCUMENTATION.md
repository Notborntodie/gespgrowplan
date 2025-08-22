# GESP练习系统 - 提交功能API文档

## 概述

本文档描述了GESP练习系统的提交功能相关API，包括考试提交、答题记录查询、错题统计等功能。

## 基础信息
- 服务器地址: `http://localhost:3000`
- 基础路径: `/api`
- 数据格式: `application/json`

## 1. 考试提交API

### 1.1 提交考试答案
```http
POST /api/submit-exam
```

**请求体:**
```json
{
  "user_id": 1,
  "exam_id": 7,
  "answers": [
    {
      "question_id": 320,
      "user_answer": "A"
    },
    {
      "question_id": 321,
      "user_answer": "B"
    },
    {
      "question_id": 322,
      "user_answer": "C"
    }
  ]
}
```

**响应示例:**
```json
{
  "message": "考试提交成功",
  "submission_id": 1,
  "score": 85,
  "total_questions": 25,
  "correct_count": 21,
  "attempt_number": 1,
  "answers": [
    {
      "question_id": 320,
      "user_answer": "A",
      "is_correct": true,
      "correct_answer": "A",
      "question_text": "题目内容..."
    },
    {
      "question_id": 321,
      "user_answer": "B",
      "is_correct": false,
      "correct_answer": "C",
      "question_text": "题目内容..."
    }
  ]
}
```

**功能说明:**
- 自动计算尝试次数（同一用户同一考试的提交次数）
- 自动计算得分（正确题目数 / 总题目数 * 100）
- 验证题目是否在指定考试中
- 记录每道题的答题详情

## 2. 提交记录查询API

### 2.1 获取用户的提交记录
```http
GET /api/submissions?user_id=1&exam_id=7
```

**查询参数:**
- `user_id` (可选): 用户ID
- `exam_id` (可选): 考试ID

**响应示例:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "exam_id": 7,
    "attempt_number": 1,
    "score": 85,
    "submit_time": "2025-01-16T10:30:00.000Z",
    "exam_name": "GESP 1级 6月真题",
    "exam_level": 1
  },
  {
    "id": 2,
    "user_id": 1,
    "exam_id": 7,
    "attempt_number": 2,
    "score": 92,
    "submit_time": "2025-01-16T11:15:00.000Z",
    "exam_name": "GESP 1级 6月真题",
    "exam_level": 1
  }
]
```

### 2.2 获取单次提交的详细答案
```http
GET /api/submissions/1
```

**响应示例:**
```json
{
  "submission": {
    "id": 1,
    "user_id": 1,
    "exam_id": 7,
    "attempt_number": 1,
    "score": 85,
    "submit_time": "2025-01-16T10:30:00.000Z",
    "exam_name": "GESP 1级 6月真题",
    "exam_level": 1,
    "username": "czy"
  },
  "answers": [
    {
      "id": 1,
      "submission_id": 1,
      "question_id": 320,
      "user_answer": "A",
      "is_correct": 1,
      "created_at": "2025-01-16T10:30:00.000Z",
      "question_text": "题目内容...",
      "question_type": "text",
      "question_code": null,
      "correct_answer": "A",
      "explanation": "解释内容...",
      "level": 1,
      "difficulty": "easy",
      "question_number": 1,
      "options": [
        {
          "id": 1,
          "question_id": 320,
          "option_label": "A",
          "option_value": "A",
          "option_text": "选项A"
        },
        {
          "id": 2,
          "question_id": 320,
          "option_label": "B",
          "option_value": "B",
          "option_text": "选项B"
        }
      ]
    }
  ]
}
```

## 3. 错题查询API

### 3.1 获取用户的所有错题
```http
GET /api/wrong-questions?user_id=1&level=1&difficulty=easy&limit=20
```

**查询参数:**
- `user_id` (必需): 用户ID
- `level` (可选): 题目等级
- `difficulty` (可选): 题目难度 (easy, medium, hard)
- `limit` (可选): 返回数量限制，默认50

**响应示例:**
```json
[
  {
    "id": 321,
    "question_text": "题目内容...",
    "question_type": "text",
    "question_code": null,
    "correct_answer": "C",
    "explanation": "解释内容...",
    "level": 1,
    "difficulty": "easy",
    "image_url": null,
    "user_answer": "B",
    "is_correct": 0,
    "answered_at": "2025-01-16T10:30:00.000Z",
    "exam_name": "GESP 1级 6月真题",
    "exam_level": 1,
    "options": [
      {
        "id": 1,
        "question_id": 321,
        "option_label": "A",
        "option_value": "A",
        "option_text": "选项A"
      },
      {
        "id": 2,
        "question_id": 321,
        "option_label": "B",
        "option_value": "B",
        "option_text": "选项B"
      }
    ]
  }
]
```

## 4. 用户统计API

### 4.1 获取用户的答题统计
```http
GET /api/user-stats?user_id=1
```

**响应示例:**
```json
{
  "basic_stats": {
    "total_submissions": 5,
    "total_exams": 3,
    "average_score": 78.4,
    "best_score": 92,
    "worst_score": 65
  },
  "answer_stats": {
    "total_answers": 125,
    "correct_answers": 98,
    "wrong_answers": 27,
    "correct_rate": 78.4
  },
  "level_stats": [
    {
      "level": 1,
      "question_count": 75,
      "correct_count": 60,
      "correct_rate": 80.0
    },
    {
      "level": 5,
      "question_count": 50,
      "correct_count": 38,
      "correct_rate": 76.0
    }
  ]
}
```

## 5. 排行榜API

### 5.1 获取考试排行榜
```http
GET /api/exam-leaderboard?exam_id=7&limit=10
```

**查询参数:**
- `exam_id` (必需): 考试ID
- `limit` (可选): 返回数量限制，默认20

**响应示例:**
```json
[
  {
    "score": 100,
    "submit_time": "2025-01-16T09:00:00.000Z",
    "attempt_number": 1,
    "username": "student1",
    "exam_name": "GESP 1级 6月真题"
  },
  {
    "score": 96,
    "submit_time": "2025-01-16T09:15:00.000Z",
    "attempt_number": 1,
    "username": "student2",
    "exam_name": "GESP 1级 6月真题"
  }
]
```

## 6. 数据库视图

系统提供了以下统计视图，可以直接查询：

### 6.1 用户错题视图
```sql
SELECT * FROM user_wrong_questions WHERE user_id = 1;
```

### 6.2 用户答题统计视图
```sql
SELECT * FROM user_answer_stats WHERE user_id = 1;
```

### 6.3 题目难度统计视图
```sql
SELECT * FROM question_difficulty_stats WHERE level = 1;
```

### 6.4 考试统计视图
```sql
SELECT * FROM exam_stats WHERE exam_id = 7;
```

### 6.5 知识点错题统计视图
```sql
SELECT * FROM knowledge_point_wrong_stats WHERE level = 1;
```

## 7. 使用示例

### 7.1 前端提交考试
```javascript
// 提交考试答案
const submitExam = async (examId, answers) => {
  const response = await fetch('/api/submit-exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUser.id,
      exam_id: examId,
      answers: answers
    })
  });
  
  const result = await response.json();
  console.log('提交结果:', result);
  return result;
};

// 获取错题
const getWrongQuestions = async (userId) => {
  const response = await fetch(`/api/wrong-questions?user_id=${userId}`);
  const wrongQuestions = await response.json();
  return wrongQuestions;
};

// 获取用户统计
const getUserStats = async (userId) => {
  const response = await fetch(`/api/user-stats?user_id=${userId}`);
  const stats = await response.json();
  return stats;
};
```

### 7.2 查看提交历史
```javascript
// 获取用户的提交记录
const getSubmissions = async (userId) => {
  const response = await fetch(`/api/submissions?user_id=${userId}`);
  const submissions = await response.json();
  return submissions;
};

// 获取单次提交详情
const getSubmissionDetail = async (submissionId) => {
  const response = await fetch(`/api/submissions/${submissionId}`);
  const detail = await response.json();
  return detail;
};
```

## 8. 错误处理

所有API都包含详细的错误信息：

```json
{
  "error": "提交考试失败",
  "details": "题目ID 999 不在此考试中"
}
```

常见错误：
- `考试不存在`: 指定的考试ID不存在
- `用户不存在`: 指定的用户ID不存在
- `考试中没有题目`: 指定考试没有关联题目
- `题目ID X 不在此考试中`: 提交的题目不在指定考试中
- `缺少必需参数`: 缺少user_id或exam_id参数

## 9. 功能特点

### 9.1 自动评分
- 系统自动计算得分
- 支持多次尝试，记录尝试次数
- 提供详细的答题反馈

### 9.2 错题管理
- 自动识别和记录错题
- 支持按等级、难度筛选错题
- 提供错题统计和分析

### 9.3 数据统计
- 用户答题统计
- 考试排行榜
- 知识点掌握情况分析

### 9.4 数据完整性
- 使用事务确保数据一致性
- 外键约束保证数据完整性
- 详细的错误处理和验证

---

*文档更新时间: 2025-01-16*
*API版本: v1.0*
