<template>
  <div class="login-layout">
    <!-- 左侧图结构 -->
    <div class="graph-container left-graph">

      <svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid meet">
        <!-- 修改后的连接线 - 精确连接节点中心，不规律分布且无交叉 -->
        <line x1="70" y1="240" x2="30" y2="180" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="70" y1="240" x2="130" y2="150" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="70" y1="240" x2="50" y2="280" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="30" y1="180" x2="10" y2="130" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="30" y1="180" x2="70" y2="110" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="130" y1="150" x2="110" y2="100" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="130" y1="150" x2="150" y2="110" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
        <line x1="50" y1="280" x2="20" y2="320" stroke="#4fc3f7" stroke-width="1.5" opacity="0.3" />
       
        
        <!-- 修改后的节点 - 不规律分布，颜色更深，靠近底部，稍微上移，向左上方移动 -->
        <circle cx="70" cy="240" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 0 ? 1.0 : 0.3" :r="leftGraph.currentNode === 0 ? 8 : 6" />
        <circle cx="30" cy="180" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 1 ? 1.0 : 0.3" :r="leftGraph.currentNode === 1 ? 8 : 6" />
        <circle cx="130" cy="150" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 2 ? 1.0 : 0.3" :r="leftGraph.currentNode === 2 ? 8 : 6" />
        <circle cx="50" cy="280" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 3 ? 1.0 : 0.3" :r="leftGraph.currentNode === 3 ? 8 : 6" />
        <circle cx="10" cy="130" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 4 ? 1.0 : 0.3" :r="leftGraph.currentNode === 4 ? 8 : 6" />
        <circle cx="70" cy="110" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 5 ? 1.0 : 0.3" :r="leftGraph.currentNode === 5 ? 8 : 6" />
        <circle cx="110" cy="100" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 6 ? 1.0 : 0.3" :r="leftGraph.currentNode === 6 ? 8 : 6" />
        <circle cx="150" cy="110" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 7 ? 1.0 : 0.3" :r="leftGraph.currentNode === 7 ? 8 : 6" />
        <circle cx="20" cy="320" r="6" fill="#4fc3f7" stroke="#fff" stroke-width="1" :opacity="leftGraph.currentNode === 8 ? 1.0 : 0.3" :r="leftGraph.currentNode === 8 ? 8 : 6" />
      </svg>
    </div>

    <!-- 右侧图结构 - 完全不同的构造 -->
    <div class="graph-container right-graph">
      <svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid meet">
        <!-- 修改为左侧图躺下的效果，精确连接节点中心，颜色与左侧一致 -->
        <line x1="180" y1="190" x2="120" y2="150" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="180" y1="190" x2="90" y2="250" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="180" y1="190" x2="220" y2="170" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="120" y1="150" x2="70" y2="130" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="120" y1="150" x2="50" y2="190" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="90" y1="250" x2="40" y2="230" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="90" y1="250" x2="50" y2="270" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="220" y1="170" x2="260" y2="140" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        <line x1="220" y1="170" x2="240" y2="220" stroke="#81d4fa" stroke-width="1.5" opacity="0.25" />
        
        <!-- 节点 - 左侧图躺下的布局，向下移动，颜色与左侧一致，靠近底部 -->
        <circle cx="180" cy="190" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 0 ? 1.0 : 0.3" :r="rightGraph.currentNode === 0 ? 8 : 6" />
        <circle cx="120" cy="150" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 1 ? 1.0 : 0.3" :r="rightGraph.currentNode === 1 ? 8 : 6" />
        <circle cx="90" cy="250" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 2 ? 1.0 : 0.3" :r="rightGraph.currentNode === 2 ? 8 : 6" />
        <circle cx="220" cy="170" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 3 ? 1.0 : 0.3" :r="rightGraph.currentNode === 3 ? 8 : 6" />
        <circle cx="70" cy="130" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 4 ? 1.0 : 0.3" :r="rightGraph.currentNode === 4 ? 8 : 6" />
        <circle cx="50" cy="190" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 5 ? 1.0 : 0.3" :r="rightGraph.currentNode === 5 ? 8 : 6" />
        <circle cx="40" cy="230" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 6 ? 1.0 : 0.3" :r="rightGraph.currentNode === 6 ? 8 : 6" />
        <circle cx="50" cy="270" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 7 ? 1.0 : 0.3" :r="rightGraph.currentNode === 7 ? 8 : 6" />
        <circle cx="260" cy="140" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 8 ? 1.0 : 0.3" :r="rightGraph.currentNode === 8 ? 8 : 6" />
        <circle cx="240" cy="220" r="6" fill="#81d4fa" stroke="#fff" stroke-width="1" :opacity="rightGraph.currentNode === 9 ? 1.0 : 0.3" :r="rightGraph.currentNode === 9 ? 8 : 6" />
      </svg>
    </div>

    <!-- 原有内容 -->
    <div class="login-header">
    </div>
    <div class="login-content">
      <div class="login-card">
        <div class="login-card-header">
          <div class="login-title">
            <h2>用户登录</h2>
          </div>
        </div>
        <div class="login-details">
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input
                id="username"
                v-model="username"
                placeholder="请输入用户名"
                required
                autocomplete="username"
              />
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="请输入密码"
                required
                autocomplete="current-password"
              />
            </div>
            <button class="login-btn" type="submit" :disabled="loading">
              <span v-if="loading">登录中...</span>
              <span v-else>登录</span>
            </button>
            <div v-if="error" class="error-msg">
              {{ error }}
            </div>
          </form>
          <div class="login-footer">
            <router-link to="/register">
              没有账号？去注册
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

// 左侧图结构
const leftGraph = ref({
  visited: new Set(),
  currentNode: null
})

// 右侧图结构
const rightGraph = ref({
  visited: new Set(),
  currentNode: null
})

let leftTimer = null
let rightTimer = null

// 获取左侧图节点坐标的辅助函数
function getNodeX(nodeId) {
  const positions = [100, 60, 140, 80, 40, 80, 120, 160, 60]
  return positions[nodeId] || 100
}

function getNodeY(nodeId) {
  const positions = [150, 100, 100, 200, 60, 60, 60, 60, 240]
  return positions[nodeId] || 80
}

// 获取右侧图节点坐标的辅助函数
function getRightNodeX(nodeId) {
  const positions = [100, 70, 130, 50, 150, 40, 160, 30, 170]
  return positions[nodeId] || 100
}

function getRightNodeY(nodeId) {
  const positions = [120, 80, 80, 160, 160, 40, 40, 200, 200]
  return positions[nodeId] || 80
}

// 左侧图DFS遍历顺序 - 9个节点的路径
const leftTraversal = [0, 1, 4, 5, 2, 6, 7, 3, 8]

// 右侧图DFS遍历顺序 - 10个节点的路径
const rightTraversal = [0, 1, 2, 5, 6, 3, 4, 7, 8, 9]

// 开始左侧图的DFS动画
function startLeftDFSAnimation() {
  console.log('左侧图DFS遍历顺序:', leftTraversal)
  let currentIndex = 0
  
  leftGraph.value.visited.clear()
  leftGraph.value.currentNode = null
  
  leftTimer = setInterval(() => {
    if (currentIndex < leftTraversal.length) {
      const nodeId = leftTraversal[currentIndex]
      leftGraph.value.visited.add(nodeId)
      leftGraph.value.currentNode = nodeId
      console.log('左侧图访问节点:', nodeId)
      currentIndex++
    } else {
      // 遍历完成，重置
      setTimeout(() => {
        leftGraph.value.visited.clear()
        leftGraph.value.currentNode = null
      }, 2000)
      setTimeout(() => {
        currentIndex = 0
      }, 4000)
    }
  }, 800)
}

// 开始右侧图的DFS动画
function startRightDFSAnimation() {
  console.log('右侧图DFS遍历顺序:', rightTraversal)
  let currentIndex = 0
  
  rightGraph.value.visited.clear()
  rightGraph.value.currentNode = null
  
  rightTimer = setInterval(() => {
    if (currentIndex < rightTraversal.length) {
      const nodeId = rightTraversal[currentIndex]
      rightGraph.value.visited.add(nodeId)
      rightGraph.value.currentNode = nodeId
      console.log('右侧图访问节点:', nodeId)
      currentIndex++
    } else {
      // 遍历完成，重置
      setTimeout(() => {
        rightGraph.value.visited.clear()
        rightGraph.value.currentNode = null
      }, 2000)
      setTimeout(() => {
        currentIndex = 0
      }, 4000)
    }
  }, 1000)
}

onMounted(() => {
  console.log('组件挂载，开始初始化图结构')
  startLeftDFSAnimation()
  startRightDFSAnimation()
})

onBeforeUnmount(() => {
  if (leftTimer) clearInterval(leftTimer)
  if (rightTimer) clearInterval(rightTimer)
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('isLoggedIn', 'true')
      window.dispatchEvent(new Event('storage'))
      router.push('/select')
    } else {
      error.value = data.message || '登录失败'
    }
  } catch (e) {
    error.value = '无法连接服务器'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-layout {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-light, #87ceeb) 0%, var(--bg-secondary, #f8fafc) 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 图结构容器样式 */
.graph-container {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.7;
}

.left-graph {
  left: 0;
}

.right-graph {
  right: 0;
}

.left-graph {
  left: 0;
}

.right-graph {
  right: 0;
}

/* 其余原有样式保持不变 */
.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 40px 3vw 20px 3vw;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}

.login-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 32px 3vw 0 3vw;
  box-sizing: border-box;
  flex: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  padding: 40px;
  width: 400px;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1e90ff, #87ceeb, #1e90ff);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.login-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 144, 255, 0.1);
  border-bottom: 1px solid #d1d5db;
}

.login-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-title h2 {
  font-size: 1.5rem;
  font-weight: 900;
  color: #1e293b !important;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  /* 使用和 NavBar 一致的高级字体组合 */
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', sans-serif;
  position: relative;
  /* 移除透明效果，使用实心颜色 */
  background: none !important;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
  /* 添加文字阴影增强立体感 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  /* 确保文字居中 */
  text-align: center;
  width: 100%;
  display: block;
  /* 使用深色实心字体 */
  color: #1e293b !important;
  font-weight: 900;
}

.login-title h2::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    #1e90ff, 
    transparent);
  border-radius: 1px;
  box-shadow: 0 1px 4px rgba(30, 144, 255, 0.3);
}

/* 确保容器也居中 */
.login-title {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
}

.title-badge {
  background: var(--primary-color, #1e90ff);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.system-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.login-details {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f9fafb;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  position: relative;
  margin-bottom: 24px;
}

label {
  display: block;
  font-weight: 500;
  color: var(--primary-dark, #0066cc);
  font-size: 1rem;
  margin-bottom: 8px;
  /* 移除绝对定位，让标签正常显示在输入框上方 */
}

input {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.1);
  transform: translateY(-2px);
}

/* 移除之前的绝对定位样式 */
input:focus + label,
input:not(:placeholder-shown) + label {
  /* 移除这些样式，避免重叠 */
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e90ff, #0066cc);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover::before {
  left: 100%;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 144, 255, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.error-msg {
  color: var(--error-color, #ef4444);
  background: #fff3f3;
  border: 1px solid var(--error-color, #ef4444);
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 12px;
  font-size: 0.98rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-footer {
  margin-top: 20px;
  width: 100%;
  text-align: center;
}

.login-footer a {
  color: var(--primary-color, #1e90ff);
  text-decoration: none;
  font-weight: 500;
  transition: color 250ms ease;
}

.login-footer a:hover {
  color: var(--secondary-color, #f59e0b);
}
</style>