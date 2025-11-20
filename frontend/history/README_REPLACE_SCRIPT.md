# 批量替换硬编码 API 地址脚本使用说明

## 脚本功能

`replace-hardcoded-api.js` 脚本可以自动批量替换项目中所有 Vue 文件里的硬编码 API 地址，根据 `MIGRATION_GUIDE.md` 的规则进行替换。

## 使用方法

### 1. 运行脚本

```bash
node replace-hardcoded-api.js
```

或者（如果已添加执行权限）：

```bash
./replace-hardcoded-api.js
```

### 2. 脚本会执行以下操作

1. **扫描所有 Vue 文件** - 自动查找 `src/` 目录下所有 `.vue` 文件
2. **替换硬编码 URL** - 根据规则替换以下模式：
   - `http://106.14.143.27:3000/api/...` → `${BASE_URL}/...`
   - `http://106.14.143.27:3000/...` → `${API_SERVER_BASE}/...`
   - `http://106.14.143.27:8000/api/...` → `${AI_API_BASE_URL}/...`
   - `.replace(..., 'http://106.14.143.27:3000')` → `.replace(..., API_SERVER_BASE)`
   - `BASE_URL: "http://106.14.143.27:3000/api"` → `BASE_URL: BASE_URL` (在 data() 中)
3. **自动添加导入** - 自动在文件顶部添加必要的 import 语句
4. **显示处理结果** - 显示每个文件的处理状态和统计信息

### 3. 替换规则

#### API 调用替换
```typescript
// 替换前
const response = await axios.get('http://106.14.143.27:3000/api/users')

// 替换后
import { BASE_URL } from '@/config/api'
const response = await axios.get(`${BASE_URL}/users`)
```

#### 图片 URL 替换
```typescript
// 替换前
const imageUrl = `http://106.14.143.27:3000${relativePath}`

// 替换后
import { API_SERVER_BASE } from '@/config/api'
const imageUrl = `${API_SERVER_BASE}${relativePath}`
```

#### Options API 中的 BASE_URL
```typescript
// 替换前
data() {
  return {
    BASE_URL: "http://106.14.143.27:3000/api",
    // ...
  }
}

// 替换后
import { BASE_URL } from '@/config/api'
// ...
data() {
  return {
    BASE_URL: BASE_URL,
    // ...
  }
}
```

#### replace 方法中的 URL
```typescript
// 替换前
imageUrl = imageUrl.replace(/http:\/\/localhost:3000/g, 'http://106.14.143.27:3000')

// 替换后
import { API_SERVER_BASE } from '@/config/api'
imageUrl = imageUrl.replace(/http:\/\/localhost:3000/g, API_SERVER_BASE)
```

## 注意事项

1. **备份代码** - 运行脚本前建议先提交代码或创建备份
2. **检查结果** - 脚本运行后，请检查修改的文件，确保替换正确
3. **验证替换** - 运行以下命令验证是否还有遗漏：
   ```bash
   grep -r "http://106.14.143.27:3000" src/
   ```
4. **构建测试** - 替换完成后运行 `npm run build` 验证项目能否正常构建

## 脚本输出示例

```
开始替换硬编码的 API 地址...

找到 45 个 Vue 文件

处理: src/views/GESPEaxmView.vue
  API URL with /api: 15 处
  Server base URL: 8 处
  添加导入: BASE_URL, API_SERVER_BASE
  ✓ 已修改

处理: src/views/TeacherView.vue
  API URL with /api: 10 处
  添加导入: BASE_URL
  ✓ 已修改

...

==================================================
处理完成！
  总文件数: 45
  修改文件数: 32
  未修改文件数: 13

提示: 请检查修改后的文件，确保替换正确。
运行 "grep -r \"http://106.14.143.27:3000\" src/" 验证是否还有遗漏。
```

## 故障排除

### 如果脚本报错

1. 确保 Node.js 版本 >= 14（支持 ES modules）
2. 检查文件权限：`chmod +x replace-hardcoded-api.js`
3. 确保在项目根目录运行脚本

### 如果替换不正确

1. 使用 Git 撤销更改：`git checkout -- src/`
2. 手动检查并修复问题文件
3. 可以分批次处理，先处理部分文件验证效果

## 后续步骤

1. 运行脚本替换所有硬编码 URL
2. 检查替换结果
3. 运行 `npm run build` 验证构建
4. 测试应用功能是否正常
5. 提交代码更改

