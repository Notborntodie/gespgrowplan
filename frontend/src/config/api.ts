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

// 开发环境下获取当前访问的 host（外网访问时用服务器 host，本地访问用 localhost）
const getDevApiHost = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname
  }
  return 'localhost'
}

// 从环境变量获取API基础URL
const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 开发环境：使用当前页面的 host，便于外网访问时请求发往同一台服务器
  if (import.meta.env.DEV) {
    const host = getDevApiHost()
    return `http://${host}:3000/api`
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
// 如果BASE_URL是相对路径（以/开头），则API_SERVER_BASE也是相对路径（空字符串表示当前域名）
// 如果BASE_URL是完整URL，则提取协议和域名部分
export const API_SERVER_BASE = (() => {
  const baseUrl = BASE_URL
  // 如果是相对路径（以/开头）
  if (baseUrl.startsWith('/')) {
    return '' // 空字符串表示当前域名，用于相对路径
  }
  // 如果是完整URL，提取协议和域名部分
  return baseUrl.replace('/api', '')
})()

// 导出AI服务的基础URL（如果有单独的AI服务）
const getAiApiBaseUrl = (): string => {
  if (import.meta.env.VITE_AI_API_BASE_URL) {
    return import.meta.env.VITE_AI_API_BASE_URL
  }
  
  // 开发环境：使用当前页面的 host，便于外网访问
  if (import.meta.env.DEV) {
    const host = getDevApiHost()
    return `http://${host}:8000/api`
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
      
      // 验证每个配置项（url 可为空字符串，表示与当前页面同源，避免 HTTPS 下 Mixed Content）
      const validConfigs = configs.filter(config => {
        if (config.url === undefined || config.url === null || typeof config.url !== 'string') {
          if (import.meta.env.DEV) console.warn('无效的判题机配置（缺少 url）:', config)
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
      if (import.meta.env.DEV) {
        console.error('解析 VITE_OJ_API_CONFIGS 失败:', error)
        console.warn('使用默认判题机配置')
      }
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

/**
 * 将图片 URL 规范化为同源路径，避免 HTTPS 下的 Mixed Content
 * 例如：http://example.com:3000/uploads/xxx.png → /uploads/xxx.png（同源加载）
 */
export function normalizeImageUrl(url: string | undefined): string {
  if (!url || !url.trim()) return ''
  let u = url.trim()
  // 将 http(s)://host:port 替换为 API_SERVER_BASE（同源时为 ''，得到 /uploads/xxx）
  u = u.replace(/^https?:\/\/[^/]+/, API_SERVER_BASE)
  return u
}

