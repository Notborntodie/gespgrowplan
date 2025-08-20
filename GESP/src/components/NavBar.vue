<template>
  <div class="nav-bar">
    <div class="nav-content">
      <div class="nav-left">
        <button v-if="isLoggedIn" @click="toggleAdminView" class="nav-btn login-btn">
          {{ isAdminView ? '管理后台' : '返回主页' }}
        </button>
      </div>
      <div class="nav-center">
        <img src="/helloworld.png" alt="Logo" class="nav-logo" />
        <span style="margin-left: 8px;"></span>
        <h1 class="nav-title">C++信奥练习系统</h1>
      </div>
      <div class="nav-right">
        <button v-if="isLoggedIn" @click="logout" class="nav-btn login-btn">
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isLoggedIn = ref(false)

const isDark = ref(false)
const isAdminView = ref(false)

const checkTheme = () => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 检查登录状态
const checkLoginStatus = () => {
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true'
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 退出登录
const logout = () => {
  localStorage.removeItem('isLoggedIn')
  isLoggedIn.value = false
  router.push('/login')
}

// 检查当前是否在管理页面
const checkAdminView = () => {
  isAdminView.value = route.path === '/select'
}

// 切换管理页面和主页
const toggleAdminView = () => {
  if (isAdminView.value) {
    // 当前在select页面，点击后跳转到admin页面
    router.push('/admin')
  } else {
    // 当前在其他页面，点击后跳转到select页面
    router.push('/select')
  }
}

// 监听登录状态变化
const handleStorageChange = () => {
  checkLoginStatus()
}

onMounted(() => {
  checkLoginStatus()
  checkAdminView()
  window.addEventListener('storage', handleStorageChange)
  // 读取本地主题
  const theme = localStorage.getItem('theme')
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme)
    isDark.value = theme === 'dark'
  } else {
    // 跟随系统
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }
})

// 监听路由变化
router.afterEach(() => {
  checkAdminView()
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* 使用和主页面一致的渐变背景 */
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  border-bottom: 2px solid #e2e8f0;
  z-index: 1000;
  padding: 0;
  height: 60px;
  box-sizing: border-box;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
}

.nav-content {
  /* 移除 max-width 限制，让内容占满整个宽度 */
  width: 100%;
  margin: 0;
  /* 减少左右 padding，让按钮更靠近边缘 */
  padding: 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.nav-left {
  display: flex;
  align-items: center;
  /* 确保没有额外的 margin */
  margin: 0;
}

.nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--space-2);
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #1e293b !important; /* 深色字体 */
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: 'Arial Black', 'Helvetica Bold', sans-serif;
  position: relative;
  background: none !important; /* 移除渐变文字，直接用深色 */
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
}

.nav-title::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--primary-color), 
    transparent);
  border-radius: 1px;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
}

.nav-right {
  display: flex;
  align-items: center;
  /* 确保没有额外的 margin */
  margin: 0;
}

.nav-btn, .login-btn {
  background: linear-gradient(135deg, #1e90ff, #0066cc);
  color: #fff !important;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
  /* 移除按钮的 margin */
  margin: 0;
  transition: background 250ms ease, box-shadow 250ms ease, color 250ms;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.nav-btn:disabled, .login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.nav-btn::before, .login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 350ms ease;
}

.nav-btn:hover::before, .login-btn:hover::before {
  left: 100%;
}

.nav-btn:hover, .login-btn:hover {
  box-shadow: 0 8px 12px -2px rgb(0 0 0 / 0.15);
  transform: translateY(-2px);
}

.logout-btn {
  background: #ef4444 !important;
  color: #fff !important;
}

.logout-btn:hover {
  background: #dc2626 !important;
  box-shadow: 0 8px 12px -2px rgb(0 0 0 / 0.15);
  transform: translateY(-2px);
}

.nav-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
  border-radius: var(--radius-sm);
  transition: transform var(--transition-normal);
}

.nav-logo:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .nav-title {
    font-size: 1.25rem;
    letter-spacing: 1.5px;
  }
  .nav-content {
    padding: 0 var(--space-4);
  }
  
  .nav-btn {
    padding: var(--space-2) var(--space-3);
    font-size: 0.85rem;
  }
  .nav-logo {
    height: 25px;
  }
}

@media (max-width: 480px) {
  .nav-bar {
    height: 50px;
    padding: var(--space-2) 0;
  }
  
  .nav-content {
    padding: 0 var(--space-3);
  }
  
  .nav-btn {
    padding: var(--space-1) var(--space-2);
    font-size: 0.8rem;
  }
  .nav-logo {
    height: 20px;
  }
  .nav-title {
    font-size: 1rem;
    letter-spacing: 1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

*:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>

