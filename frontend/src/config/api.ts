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

import axios from 'axios'

// 配置 axios 全局默认值（解决低版本浏览器连接超时问题）
// 注意：浏览器不允许设置 Connection 头，这是浏览器的安全限制
// Cache-Control 头需要后端 CORS 配置允许，为避免 CORS 错误，不在这里设置
axios.defaults.timeout = 30000 // 30秒超时

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

// 判题机 API 配置类型
export interface OJApiConfig {
  url: string
  name: string
  priority: number // 优先级，数字越小优先级越高
  enabled: boolean
}

// 从环境变量获取判题机 API 配置列表
const getOJApiConfigs = (): OJApiConfig[] => {
  const envConfig = import.meta.env.VITE_OJ_API_CONFIGS
  
  if (envConfig) {
    try {
      // 解析 JSON 字符串
      const configs = JSON.parse(envConfig) as OJApiConfig[]
      
      // 验证配置格式
      if (!Array.isArray(configs)) {
        throw new Error('VITE_OJ_API_CONFIGS 必须是数组格式')
      }
      
      // 验证每个配置项
      const validConfigs = configs.filter(config => {
        if (!config.url || typeof config.url !== 'string') {
          console.warn('无效的判题机配置（缺少 url）:', config)
          return false
        }
        return true
      })
      
      // 为缺少字段的配置添加默认值
      return validConfigs.map((config, index) => ({
        url: config.url,
        name: config.name || `判题机 ${index + 1}`,
        priority: config.priority ?? index + 1,
        enabled: config.enabled !== undefined ? config.enabled : true,
      }))
    } catch (error) {
      console.error('解析 VITE_OJ_API_CONFIGS 失败:', error)
      console.warn('使用默认判题机配置')
    }
  }
  
  // 开发环境默认值：如果没有配置，使用主 API 服务器作为判题机
  if (import.meta.env.DEV) {
    return [
      {
        url: API_SERVER_BASE,
        name: '本地判题机',
        priority: 1,
        enabled: true,
      },
    ]
  }
  
  // 生产环境：如果没有配置，使用主 API 服务器作为判题机
  return [
    {
      url: API_SERVER_BASE,
      name: '默认判题机',
      priority: 1,
      enabled: true,
    },
  ]
}

export const OJ_API_CONFIGS = getOJApiConfigs()

console.log('=== API配置已加载 ===')
console.log('环境变量 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '(未设置，使用默认值)')
console.log('环境变量 VITE_AI_API_BASE_URL:', import.meta.env.VITE_AI_API_BASE_URL || '(未设置，使用默认值)')
console.log('环境变量 VITE_OJ_API_CONFIGS:', import.meta.env.VITE_OJ_API_CONFIGS || '(未设置，使用默认值)')
console.log('实际使用的 BASE_URL:', BASE_URL)
console.log('实际使用的 API_SERVER_BASE:', API_SERVER_BASE)
console.log('实际使用的 AI_API_BASE_URL:', AI_API_BASE_URL)
console.log('判题机配置数量:', OJ_API_CONFIGS.length)
OJ_API_CONFIGS.forEach((config, index) => {
  console.log(`  判题机 ${index + 1}: ${config.name} (${config.url}) - 优先级: ${config.priority}, 启用: ${config.enabled}`)
})
console.log('运行模式:', import.meta.env.MODE)
console.log('是否为开发环境:', import.meta.env.DEV)
console.log('========================')

