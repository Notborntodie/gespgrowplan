# 路由模块说明

本项目已按功能将原来的 `app.js` 文件拆分为多个模块化的路由文件，提高了代码的可维护性和可读性。

## 文件结构

```
routes/
├── index.js          # 路由入口文件，统一管理所有路由
├── auth.js           # 认证相关API（注册、登录）
├── users.js          # 用户管理相关API
├── teachers.js       # 教师管理学生相关API
├── questions.js      # 题目管理相关API
├── knowledge.js      # 知识点和角色管理相关API
├── exams.js          # 考试管理相关API
├── submissions.js    # 提交相关API
├── oj.js             # OJ在线判题相关API
├── learningPlans.js  # 学习计划相关API
└── README.md         # 本说明文件
```

## 各模块功能说明

### 1. auth.js - 认证模块
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录

### 2. users.js - 用户管理模块
- `GET /api/users` - 获取用户列表
- `GET /api/users/:userId` - 获取用户详情
- `PUT /api/users/:userId/roles` - 更新用户角色
- `PUT /api/users/:userId` - 更新用户信息
- `DELETE /api/users/:userId` - 删除用户
- `PUT /api/users/:userId/password` - 修改用户密码
- `PUT /api/users/:userId/reset-password` - 管理员重置用户密码

### 3. teachers.js - 教师管理模块
- `POST /api/teacher/:teacherId/students` - 教师绑定学生
- `GET /api/teacher/:teacherId/students` - 获取教师的学生列表
- `DELETE /api/teacher/:teacherId/students/:studentId` - 教师解绑学生
- `GET /api/teacher/:teacherId/students/:studentId/submissions` - 获取学生答题情况
- `GET /api/teacher/:teacherId/students/:studentId/wrong-questions` - 获取学生错题情况
- `GET /api/teacher/:teacherId/students/:studentId/stats` - 获取学生学习统计
- `GET /api/teacher/:teacherId/students/:studentId/exams/:examId/detail` - 获取学生考试详情
- `GET /api/teacher/:teacherId/exams/:examId/students` - 获取教师学生考试提交情况
- `GET /api/teacher/:teacherId/students/:studentId/exams/:examId/history` - 获取学生考试历史
- `GET /api/teacher/:teacherId/students/:studentId/exams/:examId/wrong-questions` - 获取学生错题详情

### 4. questions.js - 题目管理模块
- `GET /api/questions` - 获取题目列表
- `GET /api/questions/:questionId` - 获取题目详情
- `POST /api/upload-image` - 上传题目图片
- `POST /api/upload-question` - 上传单个题目
- `POST /api/upload-questions-batch` - 批量上传题目
- `PUT /api/questions/:questionId` - 更新题目
- `DELETE /api/questions/:questionId` - 删除题目
- `GET /api/question-uploads` - 获取题目上传历史
- `PUT /api/question-uploads/:uploadId/review` - 审核题目上传

### 5. knowledge.js - 知识点和角色管理模块
- `GET /api/knowledge-points` - 获取知识点列表
- `POST /api/knowledge-points` - 添加知识点
- `GET /api/roles` - 获取角色列表

### 6. exams.js - 考试管理模块
- `GET /api/exam/:examId` - 获取考试信息（带缓存）
- `GET /api/exams` - 获取考试列表
- `GET /api/exams/:examId` - 获取单个考试详情
- `POST /api/exams` - 创建新考试
- `PUT /api/exams/:examId` - 更新考试信息
- `DELETE /api/exams/:examId` - 删除考试
- `GET /api/available-questions` - 获取可用题目列表

### 7. submissions.js - 提交管理模块
- `POST /api/submit-exam` - 提交考试答案
- `GET /api/submissions` - 获取用户的提交记录
- `GET /api/submissions/:submissionId` - 获取单次提交的详细答案
- `GET /api/wrong-questions` - 获取用户的所有错题
- `GET /api/user-stats` - 获取用户的答题统计
- `GET /api/exam-leaderboard` - 获取考试排行榜

## 主应用文件 (app.js)

重构后的 `app.js` 文件现在只包含：
- 基础中间件配置
- 安全中间件配置
- 性能监控中间件
- 静态文件服务
- 健康检查接口
- 路由注册
- 错误处理中间件

## 优势

1. **模块化**：每个功能模块独立，便于维护和测试
2. **可读性**：代码结构清晰，易于理解
3. **可扩展性**：新增功能时只需添加新的路由文件
4. **团队协作**：不同开发者可以并行开发不同的模块
5. **代码复用**：公共功能可以提取到独立的工具模块

## 使用说明

所有路由都通过 `routes/index.js` 统一管理，主应用文件只需要引入并注册路由即可。新增API时，请按照功能分类添加到对应的路由文件中。
