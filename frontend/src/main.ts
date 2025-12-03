import './assets/main.css'

// 导入 KaTeX CSS（从本地 npm 包加载，不依赖 CDN）
import 'katex/dist/katex.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入 API 配置以确保在应用启动时加载
import { BASE_URL, API_SERVER_BASE, AI_API_BASE_URL } from './config/api'

import App from './App.vue'
import router from './router'
import GlobalScaler from './plugins/globalScaler'

// 导入资源预加载工具
import { startResourcePreload } from './utils/resourcePreloader'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

// 启动资源预加载（在应用挂载后执行）
startResourcePreload()
