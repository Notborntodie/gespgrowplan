# SmartOJ 功能实现说明

## 功能概述

本次更新实现了 SmartOJ（在线编程题库）的题目管理和展示功能，包括：
1. OJ 题目上传功能
2. OJ 题目列表展示
3. 管理后台 OJ 题目管理

## 修改的文件

### 1. `/src/components/admin/Dialog/SingleOJUploadDialog.vue` ✅
**功能：** OJ 题目上传对话框

**主要字段：**
- 题目标题（必填）
- GESP 等级（必填）
- 题目描述（必填）
- 输入格式（必填）
- 输出格式（必填）
- 数据范围
- 时间限制（默认 1000ms）
- 内存限制（默认 256MB）
- 发布日期
- 测试样例（至少一个）
  - 输入
  - 输出
  - 说明（可选）
  - 是否隐藏
  - 排序

**API 接口：** `POST http://106.14.143.27:3000/oj/upload`

### 2. `/src/views/SmartOJLevelView.vue` ✅
**功能：** OJ 题目列表页面

**主要功能：**
- 从 API 获取题目列表
- 支持按 GESP 级别筛选
- 支持按日期筛选
- 显示题目卡片（标题、级别、日期、通过率、描述）
- 点击题目跳转到详情页

**API 接口：** `GET http://106.14.143.27:3000/oj/problems`

### 3. `/src/views/AdminView.vue` ✅
**功能：** 管理后台主页面

**修改内容：**
- 在侧边栏菜单中添加了 "OJ 题目管理" 选项
- 导入并集成 OJManagement 组件

### 4. `/src/components/admin/OJManagement.vue` ✅ (新建)
**功能：** 管理后台 OJ 题目管理页面

**主要功能：**
- 题目列表表格展示
  - ID、标题、级别、发布日期
  - 提交数、通过数、通过率
  - 时间限制、内存限制
- 支持按级别筛选
- 操作按钮：
  - 查看详情（跳转到题目页面）
  - 编辑（待开发）
  - 删除（待开发）
- 上传新题目按钮（打开 SingleOJUploadDialog）

### 5. `/src/views/SmartOJView.vue` ✅
**功能：** OJ 题目详情/做题页面

**修改内容：**
- 添加了 `useRoute` 和 `axios` 导入
- 从路由参数获取题目ID
- 实现 `fetchProblemDetail` 函数从 API 获取题目详情
- 在 `onMounted` 中调用 `fetchProblemDetail`
- 将硬编码的题目数据改为从 API 动态加载

**API 接口：** `GET http://106.14.143.27:3000/oj/problems/:id`

## 使用的 API 接口

### 1. 上传题目接口
```
POST /oj/upload
```

**请求体示例：**
```json
{
  "title": "两数之和",
  "description": "给定一个整数数组...",
  "input_format": "**第一行**：两个整数 n 和 target...",
  "output_format": "**一行**：两个整数...",
  "data_range": "2 ≤ n ≤ 1000",
  "time_limit": 1000,
  "memory_limit": 256,
  "level": 3,
  "publish_date": "2025-10-15",
  "samples": [
    {
      "input": "4 9\n2 7 11 15",
      "output": "0 1",
      "explanation": "nums[0] + nums[1] = 2 + 7 = 9",
      "is_hidden": false,
      "sort_order": 1
    }
  ]
}
```

### 2. 获取题目列表接口
```
GET /oj/problems?level={level}&page={page}&pageSize={pageSize}
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "数组清零",
      "description": "...",
      "input_format": "...",
      "output_format": "...",
      "data_range": "...",
      "time_limit": 1000,
      "memory_limit": 256,
      "level": 4,
      "publish_date": "2024-10-15",
      "total_submissions": 10,
      "accepted_submissions": 5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 2
  }
}
```

### 3. 获取题目详情接口
```
GET /oj/problems/:id
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "数组清零",
    "description": "...",
    "input_format": "...",
    "output_format": "...",
    "data_range": "...",
    "time_limit": 1000,
    "memory_limit": 256,
    "level": 4,
    "publish_date": "2024-10-15",
    "total_submissions": 10,
    "accepted_submissions": 5,
    "samples": [
      {
        "input": "3\n2 3 4",
        "output": "7",
        "explanation": "..."
      }
    ]
  }
}
```

## 使用流程

### 管理员上传题目：
1. 登录系统并进入管理后台 (`/admin`)
2. 点击左侧菜单的 "OJ 题目管理"
3. 点击右上角 "上传新题目" 按钮
4. 填写题目信息：
   - 基本信息（标题、级别、描述等）
   - 输入输出格式
   - 数据范围
   - 时间和内存限制
   - 至少一个测试样例
5. 点击 "上传题目" 按钮
6. 上传成功后会显示成功提示，并刷新题目列表

### 学生查看题目：
1. 登录系统
2. 在选择页面点击 "SmartOJ 编程题库"，或直接访问 `/smartoj`
3. 使用筛选器按级别或日期筛选题目
4. 点击题目卡片进入详情页面 (`/smartoj/:problemId`)

## 页面路由

- `/admin` - 管理后台（包含 OJ 题目管理）
- `/smartoj` - OJ 题目列表页
- `/smartoj/:problemId` - OJ 题目详情/做题页

## 待开发功能

1. **题目编辑功能**
   - 需要实现编辑对话框
   - 调用编辑接口（需要后端提供）

2. **题目删除功能**
   - 需要后端提供删除接口
   - 当前已有前端逻辑框架

3. **题目批量操作**
   - 批量导入
   - 批量删除

4. **样例管理优化**
   - 样例的单独管理
   - 隐藏样例的特殊标识

## 技术栈

- **前端框架：** Vue 3 + TypeScript
- **UI 样式：** 天蓝色主题（与项目整体风格一致）
- **HTTP 客户端：** Axios
- **路由：** Vue Router

## 样式特点

- 使用天蓝色渐变背景 `linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%)`
- 卡片式设计，圆角边框
- 悬停动画效果
- 响应式布局
- 统一的按钮和表单样式

## 注意事项

1. 所有 API 请求都指向 `http://106.14.143.27:3000`
2. 上传题目时至少需要一个测试样例
3. 题目列表默认获取前 100 条记录
4. 级别筛选会重新请求 API
5. 日期筛选在前端进行（基于已加载的数据）

## 测试建议

1. 测试上传各种类型的题目
2. 测试筛选功能是否正常
3. 测试题目列表展示
4. 测试跳转到题目详情页
5. 验证通过率计算是否正确
6. 测试响应式布局在不同设备上的表现

