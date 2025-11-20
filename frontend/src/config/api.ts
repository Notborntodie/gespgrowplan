/**
 * API配置
 * 统一管理后端API的基础URL
 * 
 * 使用方式：
 * 1. 开发环境：在项目根目录创建 .env 文件，设置 VITE_API_BASE_URL=http://localhost:3000/api
 * 2. 生产环境：在构建时通过环境变量设置，或在部署脚本中配置
 * 3. 开发环境默认值：如果未设置环境变量，开发环境使用 localhost
 * 4. 生产环境：必须通过环境变量设置，否则会抛出错误
 */

// 从环境变量获取API基础URL
const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 开发环境默认值
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api'
  }
  
  // 生产环境必须通过环境变量设置
  throw new Error(
    'VITE_API_BASE_URL 环境变量未设置。生产环境必须通过环境变量配置 API 地址。\n' +
    '请在构建时设置环境变量，或使用部署脚本配置。'
  )
}

// 导出API基础URL
export const BASE_URL = getApiBaseUrl()

// 导出不带/api后缀的基础URL（用于图片等静态资源）
export const API_SERVER_BASE = BASE_URL.replace('/api', '')

// 导出AI服务的基础URL（如果有单独的AI服务）
const getAiApiBaseUrl = (): string => {
  if (import.meta.env.VITE_AI_API_BASE_URL) {
    return import.meta.env.VITE_AI_API_BASE_URL
  }
  
  // 开发环境默认值
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api'
  }
  
  // 生产环境必须通过环境变量设置
  throw new Error(
    'VITE_AI_API_BASE_URL 环境变量未设置。生产环境必须通过环境变量配置 AI API 地址。\n' +
    '请在构建时设置环境变量，或使用部署脚本配置。'
  )
}

export const AI_API_BASE_URL = getAiApiBaseUrl()

console.log('=== API配置已加载 ===')
console.log('环境变量 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '(未设置，使用默认值)')
console.log('环境变量 VITE_AI_API_BASE_URL:', import.meta.env.VITE_AI_API_BASE_URL || '(未设置，使用默认值)')
console.log('实际使用的 BASE_URL:', BASE_URL)
console.log('实际使用的 API_SERVER_BASE:', API_SERVER_BASE)
console.log('实际使用的 AI_API_BASE_URL:', AI_API_BASE_URL)
console.log('运行模式:', import.meta.env.MODE)
console.log('是否为开发环境:', import.meta.env.DEV)
console.log('========================')

