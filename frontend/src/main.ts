import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入 API 配置以确保在应用启动时加载
import { BASE_URL, API_SERVER_BASE, AI_API_BASE_URL } from './config/api'

import App from './App.vue'
import router from './router'
import GlobalScaler from './plugins/globalScaler'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
