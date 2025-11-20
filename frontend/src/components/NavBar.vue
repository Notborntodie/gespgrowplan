<template>
  <div class="nav-bar">
    <div class="nav-content">
      <!-- 左侧：标题 -->
      <div class="nav-left">
        <div class="nav-logo">
          <img src="/logo.png" alt="信奥成长计划" class="logo-image" />
          <span class="logo-text">信奥成长计划</span>
        </div>
      </div>
      
      <!-- 中间：横向菜单或考试标题 -->
      <div class="nav-center">
        <!-- 考试页面或OJ页面显示标题 -->
        <div v-if="isExamPage || isOJPage" class="exam-title-center">
          <div class="exam-title-container">
            <h2 class="exam-title-text">{{ examTitle }}</h2>
          </div>
        </div>
        <!-- 普通页面显示横向菜单 -->
        <nav v-else class="main-nav">
          <button 
            v-for="item in visibleMenuItems" 
            :key="item.key"
            @click="handleMainMenuClick(item)"
            :class="['nav-menu-item', { active: activeMainMenu === item.key }]"
          >
            {{ item.label }}
            <span v-if="(item as any).comingSoon" class="coming-soon-icon">🚀</span>
          </button>
        </nav>
      </div>
      
      <!-- 右侧：级别选择器和用户下拉菜单或退出按钮 -->
      <div class="nav-right">
        <!-- 级别选择器（显示在用户菜单左侧） -->
        <div v-if="!isOJPage && !isExamPage && isLoggedIn" class="level-selector-container">
          <span class="level-hint-text">设置等级：</span>
          <div class="level-selector-wrapper">
            <div class="level-selector-dropdown">
              <button @click="toggleLevelDropdown" class="level-selector-btn">
                <span class="level-icon"></span>
                <span class="level-text">GESP {{ userGespLevel }}级</span>
                <span class="level-arrow" :class="{ 'open': isLevelDropdownOpen }">▼</span>
              </button>
              <div v-if="isLevelDropdownOpen" class="level-dropdown-menu">
                <div 
                  v-for="level in gespLevels" 
                  :key="level"
                  class="level-dropdown-item"
                  :class="{ 'active': userGespLevel === level }"
                  @click="selectGespLevel(level)"
                >
                  <span class="level-item-number">{{ level }}</span>
                  <span class="level-item-label">级</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- OJ页面显示退出按钮 -->
        <div v-if="isOJPage" class="oj-exit-btn">
          <button @click="exitOJ" class="exit-oj-btn" type="button">
            退出
          </button>
        </div>
        <!-- 普通页面显示用户下拉菜单 -->
        <div v-else-if="!isExamPage">
          <div v-if="isLoggedIn" class="user-dropdown">
            <button @click="toggleDropdown" class="user-btn">
              <div class="user-avatar">
                {{ userInfo?.real_name ? userInfo.real_name.charAt(0) : (userInfo?.username ? userInfo.username.charAt(0) : '我') }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ userInfo?.real_name || userInfo?.username || '我的' }}</span>
              </div>
              <span class="dropdown-arrow" :class="{ 'open': isDropdownOpen }">▼</span>
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <button @click="goToProfile" class="dropdown-item">
                <span class="item-icon">👤</span>
                个人中心
              </button>
              <button v-if="isAdmin" @click="goToAdmin" class="dropdown-item">
                <span class="item-icon">⚙️</span>
                管理后台
              </button>
              <button v-if="isTeacher" @click="goToTeacher" class="dropdown-item">
                <span class="item-icon">👨‍🏫</span>
                教师管理
              </button>
              <div class="dropdown-divider"></div>
              <button @click="logout" class="dropdown-item logout-item">
                <span class="item-icon">🚪</span>
                退出登录
              </button>
            </div>
          </div>
          <!-- 未登录状态的占位元素 -->
          <div v-else class="nav-placeholder">
            <div class="placeholder-content">
              <span class="placeholder-text">请先登录</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 等级切换提示弹窗 -->
    <transition name="toast-fade">
      <div v-if="showLevelToast" class="level-toast">
        <div class="toast-content">
          <span class="toast-icon">✓</span>
          <span class="toast-text">已切换到GESP {{ userGespLevel }}级</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)
const isDropdownOpen = ref(false)
const activeMainMenu = ref('gesp')

const isDark = ref(false)
const isAdminView = ref(false)
const examTitle = ref('')
const isExamPage = ref(false)
const isOJPage = ref(false)
let examCheckInterval: ReturnType<typeof setInterval> | null = null

// 级别选择器相关
const isLevelDropdownOpen = ref(false)
const gespLevels = [1, 2, 3, 4, 5, 6, 7, 8]
const userGespLevel = ref<number>(1)
const showLevelToast = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// 主菜单项
const mainMenuItems = [
  { key: 'home', label: '主页', route: '/', disabled: false },
  { key: 'plan', label: '学习计划', route: '/plan', disabled: false },
  { key: 'gesp', label: 'GESP 客观题', route: '/select' },
  { key: 'smartoj', label: 'GESP 编程题', route: '/smartoj', disabled: false },
  { key: 'teacher', label: '教师管理', route: '/teacher', disabled: false }
]

// 过滤后的菜单项（根据用户权限）
const visibleMenuItems = computed(() => {
  return mainMenuItems.filter(item => {
    // 教师管理菜单项只有教师才能看到
    if (item.key === 'teacher') {
      return isTeacher.value
    }
    return true
  })
})

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
  if (isLoggedIn.value) {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      userInfo.value = JSON.parse(userInfoStr)
    }
    // 读取用户设置的GESP级别
    loadUserGespLevel()
  } else {
    userInfo.value = null
    userGespLevel.value = 1
  }
}

// 加载用户GESP级别
const loadUserGespLevel = () => {
  const savedLevel = localStorage.getItem('userGespLevel')
  if (savedLevel) {
    const level = parseInt(savedLevel, 10)
    if (level >= 1 && level <= 8) {
      userGespLevel.value = level
    } else {
      userGespLevel.value = 1
      localStorage.setItem('userGespLevel', '1')
    }
  } else {
    // 如果没有保存的级别，默认使用1级
    userGespLevel.value = 1
    localStorage.setItem('userGespLevel', '1')
  }
}

// 监听级别变化事件（从其他组件触发）
const handleGespLevelChanged = (event: CustomEvent) => {
  const newLevel = event.detail.level
  if (newLevel >= 1 && newLevel <= 8) {
    userGespLevel.value = newLevel
  }
}

// 切换级别下拉菜单
const toggleLevelDropdown = () => {
  isLevelDropdownOpen.value = !isLevelDropdownOpen.value
  // 如果打开级别下拉菜单，关闭用户下拉菜单
  if (isLevelDropdownOpen.value) {
    isDropdownOpen.value = false
  }
}

// 选择GESP级别
const selectGespLevel = (level: number) => {
  userGespLevel.value = level
  localStorage.setItem('userGespLevel', level.toString())
  // 标记NavBar级别已锁定
  localStorage.setItem('navBarLevelLocked', 'true')
  isLevelDropdownOpen.value = false
  // 触发自定义事件，通知其他组件级别已更改
  window.dispatchEvent(new CustomEvent('gespLevelChanged', { detail: { level } }))
  
  // 显示提示弹窗
  showLevelToast.value = true
  // 清除之前的定时器
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  // 2秒后淡出
  toastTimer = setTimeout(() => {
    showLevelToast.value = false
    toastTimer = null
  }, 2000)
}

// 检查是否为考试页面或OJ页面
const checkExamPage = () => {
  const currentPath = route.path
  isExamPage.value = currentPath.includes('/exam/')
  // 检测OJ做题页：路径以/smartoj/开头且不是/smartoj本身（题目列表页）
  isOJPage.value = currentPath.startsWith('/smartoj/') && currentPath !== '/smartoj'
  
  console.log('NavBar检测路径:', currentPath, '| isExamPage:', isExamPage.value, '| isOJPage:', isOJPage.value)
  console.log('路径检查详情:', {
    currentPath,
    startsWithSmartoj: currentPath.startsWith('/smartoj/'),
    notEqualSmartoj: currentPath !== '/smartoj',
    isOJPageResult: isOJPage.value
  })
  
  if (isExamPage.value) {
    // 初始设置为空，等待考试信息加载
    examTitle.value = ''
    
    // 启动定时器检查考试信息更新
    if (examCheckInterval) {
      clearInterval(examCheckInterval as any)
    }
    examCheckInterval = setInterval(() => {
      const examInfoStr = localStorage.getItem('currentExamInfo')
      if (examInfoStr) {
        try {
          const examInfo = JSON.parse(examInfoStr)
          if (examInfo.name && examTitle.value !== examInfo.name) {
            examTitle.value = examInfo.name
            console.log('更新考试标题:', examInfo.name)
            // 找到考试信息后清除定时器
            if (examCheckInterval) {
              clearInterval(examCheckInterval as any)
              examCheckInterval = null
            }
          }
        } catch (error) {
          console.error('定时检查考试信息失败:', error)
        }
      }
    }, 100) // 更频繁地检查，每100ms检查一次
  } else if (isOJPage.value) {
    // OJ页面显示题目标题，从localStorage获取
    const problemTitle = localStorage.getItem('currentOJProblemTitle')
    examTitle.value = problemTitle || 'OJ 练习模式'
    // 清除定时器
    if (examCheckInterval) {
      clearInterval(examCheckInterval as any)
      examCheckInterval = null
    }
  } else {
    examTitle.value = ''
    // 清除定时器
    if (examCheckInterval) {
      clearInterval(examCheckInterval as any)
      examCheckInterval = null
    }
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 退出OJ页面
const exitOJ = () => {
  console.log('退出OJ按钮被点击')
  // 获取当前路由参数和查询参数
  const currentPath = route.path
  const problemId = route.params.problemId
  const urlParams = new URLSearchParams(window.location.search)
  const from = urlParams.get('from')
  const planId = urlParams.get('planId')
  const taskId = urlParams.get('taskId')
  
  console.log('当前路径:', currentPath, '问题ID:', problemId)
  console.log('来源信息:', { from, planId, taskId })
  
  if (from === 'taskview' && planId && taskId) {
    router.push(`/plan/${planId}/tasks/${taskId}`);
  } else if (from) {
    router.push('/plan');
  } else {
    router.push(`/smartoj`);
  }
}

// 退出登录
const logout = () => {
  closeDropdown()
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('userInfo')
  isLoggedIn.value = false
  userInfo.value = null
  router.push('/login')
}

// 检查当前是否在管理页面并设置活动菜单
const checkAdminView = () => {
  isAdminView.value = route.path === '/select'
  
  // 根据当前路由设置活动菜单
  if (route.path === '/') {
    activeMainMenu.value = 'home'
  } else if (route.path === '/plan') {
    activeMainMenu.value = 'plan'
  } else if (route.path === '/select' || route.path.startsWith('/level-exams/')) {
    activeMainMenu.value = 'gesp'
  } else if (route.path === '/teacher' || route.path.startsWith('/teacher/')) {
    activeMainMenu.value = 'teacher'
  } else if (route.path === '/smartoj' || route.path.startsWith('/smartoj/')) {
    activeMainMenu.value = 'smartoj'
  }
}

// 检查用户是否为管理员
const isAdmin = computed(() => {
  if (!userInfo.value) return false
  return userInfo.value.role_names?.includes('admin') || 
         userInfo.value.roles?.some((role: any) => role.name === 'admin')
})

// 检查用户是否为教师
const isTeacher = computed(() => {
  if (!userInfo.value) return false
  return userInfo.value.role_names?.includes('teacher') || 
         userInfo.value.roles?.some((role: any) => role.name === 'teacher')
})

// 检查用户是否为学生
const isStudent = computed(() => {
  if (!userInfo.value) return false
  return userInfo.value.role_names?.includes('student') || 
         userInfo.value.roles?.some((role: any) => role.name === 'student')
})

// 切换下拉菜单
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 关闭下拉菜单
const closeDropdown = () => {
  isDropdownOpen.value = false
}

// 跳转到个人中心
const goToProfile = () => {
  closeDropdown()
  router.push('/profile')
}

// 跳转到管理后台
const goToAdmin = () => {
  closeDropdown()
  router.push('/admin')
}

// 跳转到教师管理
const goToTeacher = () => {
  closeDropdown()
  router.push('/teacher')
}

// 处理主菜单点击
const handleMainMenuClick = (item: any) => {
  if (item.disabled) {
    if (item.comingSoon) {
      alert(`${item.label} 功能即将推出，敬请期待！`)
    } else {
      alert(`${item.label} 功能正在开发中，敬请期待！`)
    }
    return
  }
  
  activeMainMenu.value = item.key
  router.push(item.route)
}


// 监听登录状态变化
const handleStorageChange = () => {
  checkLoginStatus()
  checkExamPage()
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-dropdown')) {
    closeDropdown()
  }
  if (!target.closest('.level-selector-container')) {
    isLevelDropdownOpen.value = false
  }
}

onMounted(() => {
  checkLoginStatus()
  checkAdminView()
  checkExamPage()
  window.addEventListener('storage', handleStorageChange)
  document.addEventListener('click', handleClickOutside)
  // 监听级别变化事件
  window.addEventListener('gespLevelChanged', handleGespLevelChanged as EventListener)
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
  console.log('NavBar: 组件已挂载，退出按钮应该可用');
})

// 监听路由变化
router.afterEach(() => {
  checkAdminView()
  checkExamPage()
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('gespLevelChanged', handleGespLevelChanged as EventListener)
  if (examCheckInterval) {
    clearInterval(examCheckInterval as any)
    examCheckInterval = null
  }
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
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
  height: 48px;
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
  gap: 12px;
  margin: 0;
  flex-shrink: 0;
}

.nav-logo {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  height: 100%;
}

.logo-image {
  height: 40px;
  width: auto;
  transition: all 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.logo-text {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  letter-spacing: 1px;
  margin-bottom: 0px;
  padding-bottom: 2px;
}


.nav-center {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  margin: 0 20px;
}

/* 考试页面时，nav-center占满整个宽度并居中 */
.nav-center:has(.exam-title-center) {
  justify-content: center;
  margin: 0;
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
}

/* 考试标题样式 */
.exam-title-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
}

.exam-title-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px 20px;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.exam-title-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.exam-title-container:hover::before {
  left: 100%;
}

.exam-title-container:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.15);
  transform: translateY(-1px);
}

.exam-title-text {
  margin: 0;
  color: #2c5282;
  font-weight: 600;
  font-size: 1.05rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  position: relative;
  z-index: 1;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-menu-item {
  background: transparent;
  border: none;
  color: #374151;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-menu-item:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #1e90ff;
}

.nav-menu-item.active {
  background: rgba(30, 144, 255, 0.15);
  color: #1e90ff;
  font-weight: 600;
}

.nav-menu-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #1e90ff;
  border-radius: 1px;
}

.nav-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-menu-item:disabled:hover {
  background: transparent;
  color: #374151;
}

.coming-soon-icon {
  font-size: 0.8rem;
  margin-left: 4px;
  opacity: 0.7;
}


.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  flex-shrink: 0;
}

/* 级别选择器容器样式 */
.level-selector-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-hint-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
}

/* 级别选择器样式 */
.level-selector-wrapper {
  position: relative;
  display: inline-block;
}

.level-selector-dropdown {
  position: relative;
}

.level-selector-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 14px;
  margin: 0;
  transition: all 250ms ease;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.level-selector-btn:hover {
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
  transform: translateY(-1px);
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
}

.level-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.level-text {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.level-arrow {
  font-size: 0.7rem;
  transition: transform 250ms ease;
  margin-left: 4px;
  flex-shrink: 0;
}

.level-arrow.open {
  transform: rotate(180deg);
}

.level-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  min-width: 100px;
  z-index: 1001;
  overflow: hidden;
  margin-top: 8px;
  animation: dropdownFadeIn 200ms ease-out;
  max-height: 300px;
  overflow-y: auto;
}

.level-dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 1rem;
  color: #374151;
  transition: background-color 150ms ease;
}

.level-dropdown-item:hover {
  background-color: #f3f4f6;
}

.level-dropdown-item.active {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.level-item-number {
  font-weight: 700;
  font-size: 1.1rem;
}

.level-item-label {
  font-weight: 600;
  font-size: 0.9rem;
}

/* 用户下拉菜单样式 */
.user-dropdown {
  position: relative;
  display: inline-block;
}

.user-btn {
  background: linear-gradient(135deg, #87ceeb, #b0e0e6);
  color: #2c5282 !important;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  margin: 0;
  transition: all 250ms ease;
  box-shadow: none;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 140px;
}

.user-btn:hover {
  box-shadow: none;
  transform: translateY(-2px);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(44, 82, 130, 0.15);
  color: #2c5282;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}


.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 250ms ease;
  margin-left: 4px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
  margin-top: 8px;
  animation: dropdownFadeIn 200ms ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  color: #374151;
  transition: background-color 150ms ease;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-item.logout-item {
  color: #dc2626;
}

/* OJ退出按钮样式 */
.oj-exit-btn {
  display: flex;
  align-items: center;
}

.exit-oj-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1000;
  pointer-events: auto;
}

.exit-oj-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.dropdown-item.logout-item:hover {
  background-color: #fef2f2;
}

.item-icon {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
}

/* 未登录状态占位元素样式 */
.nav-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  height: 44px;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(135, 206, 235, 0.1);
  border: 2px dashed rgba(30, 144, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.placeholder-text {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  font-style: italic;
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


@media (max-width: 768px) {
  .logo-image {
    height: 35px;
  }
  
  .logo-text {
    font-size: 1rem;
  }
  .nav-content {
    padding: 0 var(--space-4);
  }
  
  .nav-center {
    margin: 0 10px;
  }
  
  .main-nav {
    gap: 4px;
  }
  
  .nav-menu-item {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .level-hint-text {
    font-size: 0.7rem;
  }

  .level-selector-container {
    gap: 6px;
  }

  .level-selector-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    min-width: 100px;
    gap: 6px;
  }

  .level-text {
    font-size: 0.85rem;
  }

  .level-icon {
    font-size: 0.9rem;
  }

  .level-dropdown-menu {
    min-width: 90px;
  }

  .level-dropdown-item {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .user-btn {
    padding: 10px 16px;
    font-size: 1rem;
    min-width: 140px;
    gap: 10px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .user-name {
    font-size: 13px;
  }

  .nav-placeholder {
    min-width: 140px;
    height: 40px;
  }

  .placeholder-content {
    padding: 10px 16px;
  }

  .placeholder-text {
    font-size: 0.8rem;
  }
  
  .dropdown-menu {
    min-width: 160px;
  }
  
  .nav-btn {
    padding: var(--space-2) var(--space-3);
    font-size: 0.85rem;
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
  
  .nav-left {
    gap: 8px;
  }
  
  .logo-image {
    height: 30px;
  }
  
  .logo-text {
    font-size: 0.9rem;
  }
  
  .nav-center {
    margin: 0 5px;
  }
  
  .main-nav {
    gap: 2px;
  }
  
  .nav-menu-item {
    padding: 4px 8px;
    font-size: 0.8rem;
  }

  .nav-right {
    gap: 8px;
  }

  .level-hint-text {
    font-size: 0.65rem;
  }

  .level-selector-container {
    gap: 4px;
  }

  .level-selector-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    min-width: 90px;
    gap: 4px;
  }

  .level-text {
    font-size: 0.8rem;
  }

  .level-icon {
    font-size: 0.85rem;
  }

  .level-arrow {
    font-size: 0.65rem;
  }

  .level-dropdown-menu {
    min-width: 80px;
    margin-top: 6px;
  }

  .level-dropdown-item {
    padding: 8px 10px;
    font-size: 0.85rem;
    gap: 3px;
  }

  .level-item-number {
    font-size: 1rem;
  }

  .level-item-label {
    font-size: 0.8rem;
  }
  
  .user-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
    min-width: 120px;
    gap: 8px;
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .user-name {
    font-size: 12px;
  }

  .nav-placeholder {
    min-width: 120px;
    height: 36px;
  }

  .placeholder-content {
    padding: 8px 12px;
  }

  .placeholder-text {
    font-size: 0.75rem;
  }
  
  .dropdown-menu {
    min-width: 140px;
  }
  
  .nav-btn {
    padding: var(--space-1) var(--space-2);
    font-size: 0.8rem;
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

/* 等级切换提示弹窗样式 */
.level-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.toast-content {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-text {
  color: #ffffff;
  font-weight: 600;
}

/* 弹窗淡入淡出动画 */
.toast-fade-enter-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-fade-enter-to {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-fade-leave-active {
  transition: opacity 0.3s ease-in, transform 0.3s ease-in;
}

.toast-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 768px) {
  .level-toast {
    top: 70px;
  }
  
  .toast-content {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .toast-icon {
    width: 20px;
    height: 20px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .level-toast {
    top: 60px;
  }
  
  .toast-content {
    padding: 8px 16px;
    font-size: 0.85rem;
    gap: 8px;
  }
  
  .toast-icon {
    width: 18px;
    height: 18px;
    font-size: 0.9rem;
  }
}
</style>

