<template>
  <div class="smartoj-container">
    <!-- 头部 -->
    <div class="smartoj-header">
      <div class="header-content-wrapper">
        <!-- 左侧占位（保持等级选择器居中） -->
        <div class="header-left-spacer"></div>
        
        <!-- 等级选择器（居中） -->
        <div class="level-selector">
          <div class="selector-tabs">
            <div 
              v-for="level in levels" 
              :key="level"
              class="level-tab"
              :class="{ 
                'active': selectedLevel === level.toString(),
                'disabled': isLevelDisabled(level)
              }"
              @click="!isLevelDisabled(level) && selectLevel(level)"
            >
              <span class="level-number">{{ level }}</span>
              <span class="level-label">级</span>
            </div>
          </div>
        </div>
        
        <!-- 右侧：时间过滤器 -->
        <div class="header-right-section">
          <!-- 时间过滤器 -->
          <div class="date-filter" v-if="availableDates.length > 0">
            <div class="date-filter-wrapper">
              <div class="date-filter-label">
                <span class="date-icon">📅</span>
                <span class="date-label-text">时间筛选</span>
              </div>
              <div class="date-filter-selector">
                <select 
                  v-model="selectedDate" 
                  class="date-select"
                  @change="handleDateChange"
                >
                  <option value="">全部时间</option>
                  <option 
                    v-for="date in availableDates" 
                    :key="date" 
                    :value="date"
                  >
                    {{ formatDateOption(date) }}
                  </option>
                </select>
                <span class="date-select-arrow">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="selector-underline"></div>
    </div>

    <!-- 题目列表 -->
    <div class="problems-content">
      <div class="problems-table-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <!-- 题目表格 -->
        <table v-else-if="filteredProblems.length > 0" class="problems-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>级别</th>
              <th>发布日期</th>
              <th>提交数</th>
              <th>通过数</th>
              <th>通过率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="problem in filteredProblems" :key="problem.id">
              <td>{{ problem.id }}</td>
              <td class="title-cell">{{ problem.title }}</td>
              <td>
                <span class="level-badge">GESP {{ problem.level }}级</span>
              </td>
              <td>{{ formatDate(problem.date) }}</td>
              <td>{{ problem.totalSubmissions }}</td>
              <td>{{ problem.acceptedSubmissions }}</td>
              <td>
                <span class="pass-rate">{{ problem.passRate }}%</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="goToProblem(problem.id)" class="btn-action btn-view" title="开始练习">
                    <span>▶️</span>
                    <span>开始练习</span>
                  </button>
                  <button @click.stop="viewSubmissions(problem.id)" class="btn-action btn-submissions" title="查看提交">
                    <span>📋</span>
                    <span>查看提交</span>
                  </button>
                  <button 
                    v-if="isTeacher" 
                    @click.stop="viewStudentSubmissions(problem.id)" 
                    class="btn-action btn-student-submissions" 
                    title="查看学生提交"
                  >
                    <span>👨‍🎓</span>
                    <span>查看学生提交</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无符合条件的题目</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 筛选条件
const selectedLevel = ref('')
const selectedDate = ref('')

// 等级数据
const levels = ref([1, 2, 3, 4, 5, 6, 7, 8])

// NavBar级别锁定状态
const navBarLevelLocked = ref(false)
const navBarSelectedLevel = ref<number | null>(null)

// 检查NavBar级别锁定状态
function checkNavBarLevelLock() {
  const isLocked = localStorage.getItem('navBarLevelLocked') === 'true'
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  if (isLocked && isLoggedIn) {
    const savedLevel = localStorage.getItem('userGespLevel')
    if (savedLevel) {
      const level = parseInt(savedLevel, 10)
      if (level >= 1 && level <= 8) {
        navBarLevelLocked.value = true
        navBarSelectedLevel.value = level
        return
      }
    }
  }
  
  navBarLevelLocked.value = false
  navBarSelectedLevel.value = null
}

// 检查级别是否被禁用
function isLevelDisabled(level: number): boolean {
  if (!navBarLevelLocked.value || navBarSelectedLevel.value === null) {
    return false
  }
  return level !== navBarSelectedLevel.value
}

// 题目数据
const problems = ref<any[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  pageSize: 100, // 获取所有题目
  total: 0
})

// 从API获取题目列表
async function fetchProblems() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    
    // 如果选择了级别，添加到查询参数
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    
    const response = await axios.get(`${BASE_URL}/oj/problems`, { params })
    
    if (response.data.success) {
      problems.value = response.data.data.map((problem: any) => ({
        id: problem.id,
        title: problem.title,
        level: problem.level,
        date: problem.publish_date,
        shortDescription: truncateDescription(problem.description),
        totalSubmissions: problem.total_submissions || 0,
        acceptedSubmissions: problem.accepted_submissions || 0,
        passRate: problem.total_submissions > 0 
          ? ((problem.accepted_submissions / problem.total_submissions) * 100).toFixed(1)
          : 0
      }))
      
      if (response.data.pagination) {
        pagination.value.total = response.data.pagination.total
      }
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 截取描述文本
function truncateDescription(desc: string, maxLength: number = 80): string {
  if (!desc) return ''
  if (desc.length <= maxLength) return desc
  return desc.substring(0, maxLength) + '...'
}

// 从题目中提取所有可用的年月（格式：YYYY-MM）
const availableDates = computed(() => {
  const dates = new Set<string>()
  problems.value.forEach((problem) => {
    if (problem.date) {
      try {
        const date = new Date(problem.date)
        if (!isNaN(date.getTime())) {
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          dates.add(yearMonth)
        }
      } catch (error) {
        console.warn('日期解析失败:', problem.date, error)
      }
    }
  })
  return Array.from(dates).sort().reverse() // 按时间倒序排列
})

// 筛选后的题目列表
const filteredProblems = computed(() => {
  return problems.value.filter((problem) => {
    const matchLevel = !selectedLevel.value || problem.level.toString() === selectedLevel.value
    
    let matchDate = true
    if (selectedDate.value && problem.date) {
      const problemDate = new Date(problem.date)
      const problemYearMonth = `${problemDate.getFullYear()}-${String(problemDate.getMonth() + 1).padStart(2, '0')}`
      matchDate = problemYearMonth === selectedDate.value
    }
    
    return matchLevel && matchDate
  })
})

// 跳转到题目详情页
const goToProblem = (problemId: number) => {
  router.push(`/smartoj/${problemId}`)
}

// 查看提交记录
const viewSubmissions = (problemId: number) => {
  router.push(`/oj-submissions/${problemId}`)
}

// 检查用户是否为教师
const isTeacher = computed(() => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      return false
    }
    
    const userInfo = JSON.parse(userInfoStr)
    return userInfo.role_names?.includes('teacher') || 
           userInfo.roles?.some((role: any) => role.name === 'teacher')
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
})

// 查看学生提交记录
const viewStudentSubmissions = (problemId: number) => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      alert('请先登录')
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo.id) {
      alert('无法获取用户ID')
      return
    }
    
    router.push(`/teacher/${userInfo.id}/oj-submissions/${problemId}`)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    alert('获取用户信息失败')
  }
}

// 返回上一页
const goBack = () => {
  router.push('/select')
}

// 格式化日期（只显示年月）
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateString
  }
}

// 格式化日期选项（显示为"YYYY年MM月"）
const formatDateOption = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  } catch (error) {
    console.error('日期选项格式化错误:', error)
    return dateStr
  }
}

// 处理日期变化
const handleDateChange = () => {
  // 日期变化时，筛选会在 computed 属性 filteredProblems 中自动处理
  // 这里可以添加额外的逻辑，比如滚动到顶部
}

// 选择等级
function selectLevel(level: number) {
  // 如果NavBar级别已锁定，且选择的级别不是NavBar选中的级别，则不允许选择
  if (navBarLevelLocked.value && navBarSelectedLevel.value !== null && level !== navBarSelectedLevel.value) {
    return
  }
  
  selectedLevel.value = level.toString()
  // 保存级别到localStorage
  localStorage.setItem('userGespLevel', level.toString())
  // 注意：不清除NavBar级别锁定，保持锁定状态
  // 触发自定义事件，通知NavBar级别已更改
  window.dispatchEvent(new CustomEvent('gespLevelChanged', { detail: { level } }))
  pagination.value.page = 1
  fetchProblems()
}

// 级别变化时重新获取数据
const handleLevelChange = () => {
  pagination.value.page = 1
  fetchProblems()
}

// 监听级别变化事件（从NavBar触发）
function handleGespLevelChanged(event: CustomEvent) {
  const newLevel = event.detail.level
  if (newLevel >= 1 && newLevel <= 8) {
    // 更新NavBar级别锁定状态
    checkNavBarLevelLock()
    selectLevel(newLevel)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  // 检查NavBar级别锁定状态
  checkNavBarLevelLock()
  // 从localStorage读取用户设置的级别
  const savedLevel = localStorage.getItem('userGespLevel')
  if (savedLevel) {
    const level = parseInt(savedLevel, 10)
    if (level >= 1 && level <= 8) {
      selectedLevel.value = level.toString()
    }
  }
  fetchProblems()
  // 监听级别变化事件
  window.addEventListener('gespLevelChanged', handleGespLevelChanged as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('gespLevelChanged', handleGespLevelChanged as EventListener)
})
</script>

<style scoped>
/* 基础布局 */
.smartoj-container {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

/* 头部 */
.smartoj-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 30px 8px 30px;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  border-bottom: 2px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  position: fixed;
  top: 48px; /* NavBar 的高度 */
  left: 0;
  right: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  width: 100%;
  gap: 8px;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 头部内容包装器 */
.header-content-wrapper {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  gap: 20px;
  position: relative;
}

/* 左侧占位 */
.header-left-spacer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 等级选择器样式 */
.level-selector {
  margin-top: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: 2;
}

.selector-tabs {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}

/* 右侧区域 */
.header-right-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  grid-column: 3;
}

.level-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
}

.level-tab:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: #1e90ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
}

.level-tab.active {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-color: #1e90ff;
  color: white;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
}

.level-tab.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  background: rgba(200, 200, 200, 0.5);
}

.level-tab.disabled:hover {
  background: rgba(200, 200, 200, 0.5);
  border-color: transparent;
  transform: none;
  box-shadow: none;
}

.level-number {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.level-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.selector-underline {
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #1e90ff 50%, transparent 100%);
  margin-top: 8px;
  width: 100%;
  max-width: 1200px;
  border-radius: 2px;
  opacity: 0.6;
}

/* 时间过滤器样式 */
.date-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  flex-shrink: 0;
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.date-filter:hover {
  opacity: 1;
}

.date-filter-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
  padding: 8px 16px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.date-filter-wrapper:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(30, 144, 255, 0.3);
  box-shadow: 0 1px 4px rgba(30, 144, 255, 0.08);
}

.date-filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.date-icon {
  font-size: 15px;
  opacity: 0.7;
}

.date-label-text {
  color: #64748b;
  font-weight: 500;
}

.date-filter-selector {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 150px;
}

.date-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(30, 144, 255, 0.25);
  border-radius: 8px;
  padding: 7px 32px 7px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  width: 100%;
  min-width: 150px;
}

.date-select:hover {
  border-color: rgba(30, 144, 255, 0.4);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 4px rgba(30, 144, 255, 0.12);
}

.date-select:focus {
  border-color: #1e90ff;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.1);
}

.date-select option {
  background: white;
  color: #1e293b;
  padding: 8px;
  font-size: 13px;
}

.date-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #94a3b8;
  font-size: 11px;
  transition: color 0.2s ease;
  user-select: none;
}

.date-filter-selector:hover .date-select-arrow,
.date-select:focus ~ .date-select-arrow {
  color: #1e90ff;
}

/* 题目列表内容区域 */
.problems-content {
  flex: 1;
  padding: 24px 32px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-top: 80px; /* 为固定的header留出空间：48px(NavBar) + 32px(header) */
}

/* 表格容器 */
.problems-table-container {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
}

.problems-table {
  width: 100%;
  border-collapse: collapse;
}

.problems-table thead {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
}

.problems-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: white;
  white-space: nowrap;
}

.problems-table th:last-child,
.problems-table td:last-child {
  min-width: 200px;
}

.problems-table td {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1e293b;
}

.problems-table tbody tr:hover {
  background: #f8fafc;
}

.title-cell {
  font-weight: 500;
  color: #1e90ff;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.pass-rate {
  font-weight: 600;
  color: #10b981;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn-action i {
  font-size: 14px;
}

.btn-view {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.btn-view:hover {
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.btn-submissions {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.btn-submissions:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-student-submissions {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.btn-student-submissions:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #1e90ff;
}

.loading-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-state p {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .problems-table {
    font-size: 13px;
  }
  
  .problems-table th,
  .problems-table td {
    padding: 12px 8px;
  }
  
  .btn-action {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .smartoj-header {
    padding: 3px 20px 6px 20px;
  }

  .header-content-wrapper {
    grid-template-columns: 1fr;
    gap: 12px;
    justify-items: center;
  }

  .header-left-spacer {
    display: none;
  }

  .level-selector {
    margin-top: 2px;
    grid-column: 1;
    width: 100%;
  }

  .header-right-section {
    grid-column: 1;
    width: 100%;
    justify-content: center;
  }

  .problems-content {
    margin-top: 85px;
    padding: 20px 16px;
  }

  .problems-table-container {
    overflow-x: auto;
  }

  .problems-table {
    min-width: 800px;
  }

  .selector-tabs {
    gap: 12px;
  }

  .level-tab {
    padding: 10px 16px;
  }

  .level-number {
    font-size: 16px;
  }

  .level-label {
    font-size: 12px;
  }

  .date-filter {
    margin-top: 2px;
    width: 100%;
    justify-content: center;
  }

  .date-filter-wrapper {
    padding: 7px 14px;
    gap: 9px;
  }

  .date-filter-label {
    font-size: 12px;
  }

  .date-icon {
    font-size: 13px;
  }

  .date-select {
    font-size: 12px;
    padding: 6px 28px 6px 10px;
    min-width: 130px;
  }

  .date-select-arrow {
    font-size: 10px;
    right: 8px;
  }
}

@media (max-width: 480px) {
  .smartoj-header {
    padding: 2px 16px 5px 16px;
  }

  .header-content-wrapper {
    gap: 8px;
    padding: 0 10px;
  }

  .problems-content {
    margin-top: 80px;
    padding: 16px;
  }

  .level-selector {
    margin-top: 1px;
  }

  .selector-tabs {
    gap: 8px;
  }

  .level-tab {
    padding: 8px 12px;
  }

  .level-number {
    font-size: 14px;
  }

  .level-label {
    font-size: 11px;
  }

  .date-filter {
    margin-top: 0px;
  }

  .date-filter-wrapper {
    padding: 6px 12px;
    gap: 7px;
    max-width: 300px;
  }

  .date-filter-label {
    font-size: 11px;
  }

  .date-icon {
    font-size: 12px;
  }

  .date-select {
    font-size: 11px;
    padding: 5px 26px 5px 8px;
    min-width: 120px;
  }

  .date-select-arrow {
    font-size: 9px;
    right: 6px;
  }
}

@media (max-width: 360px) {
  .header-content-wrapper {
    gap: 6px;
    padding: 0 8px;
  }

  .level-selector {
    margin-top: 0px;
  }

  .selector-tabs {
    gap: 6px;
  }

  .level-tab {
    padding: 6px 10px;
  }

  .level-number {
    font-size: 13px;
  }

  .level-label {
    font-size: 10px;
  }

  .date-filter-wrapper {
    max-width: 240px;
    padding: 5px 10px;
    gap: 6px;
  }

  .date-filter-label {
    font-size: 10px;
  }

  .date-icon {
    font-size: 11px;
  }

  .date-select {
    font-size: 10px;
    padding: 4px 24px 4px 6px;
    min-width: 100px;
  }

  .date-select-arrow {
    font-size: 8px;
    right: 5px;
  }
}
</style>
