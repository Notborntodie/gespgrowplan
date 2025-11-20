# API统一配置迁移指南

## 已完成的工作

✅ 已创建统一的API配置文件 `src/config/api.ts`
✅ 已更新所有 stores 文件使用统一 BASE_URL
✅ 已更新部署脚本支持环境变量配置
✅ 已创建配置示例文件

## 需要手动更新的文件

由于文件较多，以下文件仍包含硬编码的API地址，需要手动替换：

### 方式1: 使用查找替换（推荐）

在IDE中使用全局查找替换功能：

**查找：** `http://106.14.143.27:3000/api`
**替换为：** `${BASE_URL}`

**查找：** `http://106.14.143.27:3000`
**替换为：** `${API_SERVER_BASE}` (用于图片等静态资源)

**注意：** 替换前需要确保文件已导入：
```typescript
import { BASE_URL, API_SERVER_BASE } from '@/config/api'
```

### 方式2: 逐个文件更新

需要更新的文件列表：

#### Views
- `src/views/GESPEaxmView.vue` - 需要导入 BASE_URL 和 API_SERVER_BASE
- `src/views/TeacherView.vue` - 需要导入 BASE_URL
- `src/views/TeacherOJSubmissionsView.vue` - 需要导入 BASE_URL
- `src/views/StudentSubmissionsView.vue` - 需要导入 BASE_URL
- `src/views/OJSubmissionsView.vue` - 需要导入 BASE_URL
- `src/views/ExamSubmissionsView.vue` - 需要导入 BASE_URL
- `src/views/LevelExamsView.vue` - 需要导入 BASE_URL
- `src/views/ProfileView.vue` - 需要导入 BASE_URL
- `src/views/SmartOJLevelView.vue` - 需要导入 BASE_URL

#### Components
- `src/components/teacher/OJSubmissionsSection.vue` - 需要导入 BASE_URL
- `src/components/teacher/ObjectiveSubmissionsSection.vue` - 需要导入 BASE_URL
- `src/components/admin/ExamManagement.vue` - 需要导入 BASE_URL
- `src/components/admin/KnowledgePointManagement.vue` - 需要导入 BASE_URL
- `src/components/admin/QuestionList.vue` - 需要导入 BASE_URL
- `src/components/admin/OJManagement.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/BatchEditDialog.vue` - 需要导入 BASE_URL 和 API_SERVER_BASE
- `src/components/admin/Dialog/AIUploadDialog.vue` - 需要导入 BASE_URL, API_SERVER_BASE 和 AI_API_BASE_URL
- `src/components/admin/Dialog/EditOJDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/SingleOJUploadDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/QuestionEditDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/EditKnowledgePointDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/CreateKnowledgePointDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/KnowledgePointDialog.vue` - 需要导入 BASE_URL
- `src/components/admin/Dialog/CreateExamDialog.vue` - 需要导入 BASE_URL

## 替换示例

### 示例1: 替换 API 调用

**替换前：**
```typescript
const response = await axios.get('http://106.14.143.27:3000/api/users')
```

**替换后：**
```typescript
import { BASE_URL } from '@/config/api'
const response = await axios.get(`${BASE_URL}/users`)
```

### 示例2: 替换图片URL

**替换前：**
```typescript
const imageUrl = `http://106.14.143.27:3000${relativePath}`
```

**替换后：**
```typescript
import { API_SERVER_BASE } from '@/config/api'
const imageUrl = `${API_SERVER_BASE}${relativePath}`
```

### 示例3: 替换字符串替换逻辑

**替换前：**
```typescript
imageUrl = imageUrl.replace(/http:\/\/localhost:3000/g, 'http://106.14.143.27:3000')
```

**替换后：**
```typescript
import { API_SERVER_BASE } from '@/config/api'
imageUrl = imageUrl.replace(/http:\/\/localhost:3000/g, API_SERVER_BASE)
```

## 验证

更新完成后，运行以下命令验证：

```bash
# 检查是否还有硬编码的URL
grep -r "http://106.14.143.27:3000" src/

# 构建项目验证
npm run build
```

## 注意事项

1. 确保所有文件都正确导入了 `BASE_URL` 或 `API_SERVER_BASE`
2. 对于 Options API 的 Vue 组件（如 GESPEaxmView.vue），需要在 `data()` 中定义或直接使用导入的常量
3. 对于 Composition API 的组件，可以直接在 `<script setup>` 中导入使用
4. 替换时注意保留字符串模板语法 `${BASE_URL}` 而不是直接拼接

