# GESP 练习系统 API 修改记录

## 添加 question_code 字段支持

### 修改概述
为所有与题目相关的API接口添加了 `question_code` 字段支持，用于存储代码类题目的代码内容。

### 修改的API接口

#### 1. 获取考试信息 `/api/exam/:examId`
- **修改位置**: `backend_server/index.js` 第147行
- **修改内容**: 在题目数据整理时添加 `question_code` 字段
- **影响**: 返回的题目数据现在包含 `question_code` 字段

#### 2. 上传题目 `/api/upload-question`
- **修改位置**: `backend_server/index.js` 第304行和第340行
- **修改内容**: 
  - 添加 `question_code` 参数接收
  - 修改INSERT语句包含 `question_code` 字段
- **影响**: 现在可以上传包含代码的题目

#### 3. 批量上传题目 `/api/upload-questions-batch`
- **修改位置**: `backend_server/index.js` 第430行和第450行
- **修改内容**:
  - 添加 `question_code` 参数接收
  - 修改INSERT语句包含 `question_code` 字段
- **影响**: 批量上传时支持代码字段

#### 4. 更新题目 `/api/questions/:questionId`
- **修改位置**: `backend_server/index.js` 第570行和第580行
- **修改内容**:
  - 添加 `question_code` 参数接收
  - 修改UPDATE语句包含 `question_code` 字段
- **影响**: 更新题目时可以修改代码内容

#### 5. 获取题目上传历史 `/api/question-uploads`
- **修改位置**: `backend_server/index.js` 第650行
- **修改内容**: 在查询中添加 `q.question_code` 字段
- **影响**: 上传历史记录现在包含代码内容

### 自动包含的接口
以下接口使用 `SELECT * FROM questions`，自动包含 `question_code` 字段：
- 获取全部题目 `/api/questions`
- 获取题目详情 `/api/questions/:questionId`

### 字段特性
- **类型**: `TEXT` - 支持长代码内容
- **允许空值**: `NULL` - 向后兼容现有题目
- **用途**: 存储代码类题目的代码内容
- **配合**: 与 `question_type = 'code'` 配合使用

### 使用示例

#### 上传代码题目
```javascript
const questionData = {
  question_text: "请分析以下代码的输出结果",
  question_type: "code",
  question_code: `#include <iostream>
using namespace std;

int main() {
    int a = 5, b = 3;
    cout << a + b << endl;
    return 0;
}`,
  correct_answer: "A",
  explanation: "代码输出8",
  level: 3,
  difficulty: "medium",
  options: [
    { label: "A", value: "A", text: "8" },
    { label: "B", value: "B", text: "5" },
    { label: "C", value: "C", text: "3" },
    { label: "D", value: "D", text: "15" }
  ]
};
```

#### 更新题目代码
```javascript
const updateData = {
  question_text: "修改后的题目描述",
  question_type: "code",
  question_code: "新的代码内容",
  correct_answer: "B",
  explanation: "新的解释",
  level: 4,
  difficulty: "hard"
};
```

### 数据库更新
- 已更新 `init.sql` 文件，包含 `question_code` 字段
- 创建了 `update.sql` 文件，用于在现有数据库上添加字段
- 更新了相关视图定义

### 注意事项
1. 所有修改都向后兼容，不会影响现有的纯文本题目
2. `question_code` 字段为可选，默认为 `null`
3. 建议在 `question_type = 'code'` 时填写 `question_code` 内容
4. 前端需要相应更新以支持显示和编辑代码内容 