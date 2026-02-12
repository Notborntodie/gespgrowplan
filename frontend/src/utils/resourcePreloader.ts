/**
 * 资源预加载工具
 * 在应用启动后预加载关键资源，加速后续页面访问
 * 
 * 注意：路由组件已经在 router/index.ts 中直接导入，
 * 会在初始加载时被打包，无需额外预加载
 */

// 预加载静态资源
const preloadStaticResources = () => {
  try {
    const staticResources = [
      '/logo.png',
      '/pp.png',
      // 注意：fontawesome.css 已从预加载列表中移除，因为实际使用的是 CDN 版本
      // 如果 CDN 加载失败，本地版本会作为后备（但不会预加载）
      '/webfonts/fa-solid-900.woff2',
      '/webfonts/fa-regular-400.woff2',
      '/webfonts/fa-brands-400.woff2',
    ]

    staticResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = resource
      link.as = resource.endsWith('.woff2') ? 'font' : resource.endsWith('.png') ? 'image' : 'style'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

  } catch {
    // 静默忽略预加载失败
  }
}

// DNS 预解析和预连接 API 端点
const preconnectAPIEndpoints = () => {
  try {
    // 从环境变量获取 API 地址
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    const aiApiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL

    const endpoints = new Set<string>()

    // 开发环境未设置时，使用当前页面的 host（外网访问时预连接同一服务器）
    const devHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'

    // 从环境变量提取域名（主 API）
    if (apiBaseUrl) {
      try {
        const url = new URL(apiBaseUrl)
        endpoints.add(url.origin)
      } catch {
        // 忽略无效 URL（相对路径如 /api 无法 new URL，属正常）
      }
    } else if (import.meta.env.DEV) {
      try {
        endpoints.add(`http://${devHost}:3000`)
      } catch {
        // 忽略错误
      }
    }

    // 从环境变量提取域名（AI API）
    if (aiApiBaseUrl) {
      try {
        const url = new URL(aiApiBaseUrl)
        endpoints.add(url.origin)
      } catch {
        // 忽略无效 URL（相对路径如 /ai-api 无法 new URL，属正常）
      }
    } else if (import.meta.env.DEV) {
      try {
        endpoints.add(`http://${devHost}:8000`)
      } catch {
        // 忽略错误
      }
    }

    // 创建 DNS prefetch 和 preconnect 链接
    endpoints.forEach(origin => {
      // DNS prefetch（更快，但只解析 DNS）
      const dnsLink = document.createElement('link')
      dnsLink.rel = 'dns-prefetch'
      dnsLink.href = origin
      document.head.appendChild(dnsLink)

      // Preconnect（建立连接，包括 DNS、TCP、TLS，更快但消耗更多资源）
      const preconnectLink = document.createElement('link')
      preconnectLink.rel = 'preconnect'
      preconnectLink.href = origin
      preconnectLink.crossOrigin = 'anonymous'
      document.head.appendChild(preconnectLink)
    })

  } catch {
    // 静默忽略预连接失败
  }
}

// 预加载关键 API 数据（可选，根据实际需求调整）
const preloadAPIData = async () => {
  try {
    // 这里可以预加载一些关键数据，比如用户信息、配置等
    // 注意：不要预加载大量数据，只加载关键的小数据
    const { BASE_URL } = await import('../config/api')
    
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const token = localStorage.getItem('token')
    
    if (isLoggedIn && token) {
      // 预加载常用的 API 端点（使用 prefetch，浏览器会在空闲时加载）
      const commonEndpoints = [
        `${BASE_URL}/users/me`, // 用户信息
        `${BASE_URL}/questions`, // 题目列表（可能被缓存）
        `${BASE_URL}/knowledge-points`, // 知识点列表（可能被缓存）
      ]

      commonEndpoints.forEach(endpoint => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = endpoint
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })

    }
  } catch {
    // 静默忽略预加载失败
  }
}

/**
 * 启动资源预加载
 * 在应用启动后调用，使用空闲时间预加载资源
 */
export const startResourcePreload = () => {
  // 立即执行：DNS 预解析和静态资源预加载（轻量级操作）
  preconnectAPIEndpoints()
  preloadStaticResources()

  // 延迟执行：API 数据预加载（使用空闲时间）
  const preloadWhenIdle = () => {
    if ('requestIdleCallback' in window) {
      // 使用 requestIdleCallback（现代浏览器）
      requestIdleCallback(
        async () => {
          await preloadAPIData()
        },
        { timeout: 2000 } // 2秒后强制执行
      )
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(async () => {
        await preloadAPIData()
      }, 1000)
    }
  }

  // 等待页面加载完成后再开始预加载
  if (document.readyState === 'complete') {
    preloadWhenIdle()
  } else {
    window.addEventListener('load', preloadWhenIdle)
  }
}

