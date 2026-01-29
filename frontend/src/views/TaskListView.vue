<template>
  <div class="exam-layout">
    <div class="exam-content exam-content-flex-row">
      <!-- 左侧返回按钮 -->
      <div class="sidebar-placeholder-left">
        <button 
          class="back-nav-arrow" 
          @click="backToPlans" 
          title="返回计划列表"
        >
          <Icon name="arrow-left" :size="32" />
        </button>
      </div>
      <div class="question-main">
        <div class="question-card task-view-transparent">
          <div class="question-card-header">
            <div class="header-left-section"></div>
            <div class="header-center-section"></div>
            <div class="header-right-section"></div>
          </div>

          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">
              <div v-if="error" class="content-section error-state">
                <div class="section-content">
                  <div class="error-icon"><Icon name="alert-triangle" :size="64" /></div>
                  <h3>连接错误</h3>
                  <p>{{ error }}</p>
                </div>
              </div>

              <div v-else-if="loading" class="content-section loading-state">
                <div class="section-content">
                  <div class="loading-icon"><Icon name="loader-2" :size="64" spin /></div>
                  <h3>加载中...</h3>
                  <p>正在获取任务数据</p>
                </div>
              </div>

              <div v-else class="tasks-list-view">
                <!-- 计划完成提示 -->
                <div v-if="isPlanCompleted()" class="content-section completion-banner">
                  <div class="section-content">
                    <div class="completion-message">
                      <span class="completion-icon"><Icon name="sparkles" :size="64" /></span>
                      <h3>恭喜，计划已经完成！</h3>
                      <p v-if="planProgress?.completed_at" class="completion-time">
                        完成时间: {{ formatDateTime(planProgress.completed_at) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 任务列表 - 使用侧边栏风格 -->
                <div class="task-list-main">
                  <!-- 任务列表 -->
                  <div class="task-list-container">
                    <div
                      v-for="(task, index) in selectedPlan?.tasks || []"
                      :key="task.id"
                      :ref="(el) => setTaskRef(el, task.id)"
                      class="task-progress-item-main"
                      :class="{ 
                        'completed': task.is_completed, 
                        'active': isTaskActive(task),
                        'locked': !isTaskActive(task),
                        'type-exam-card': task.is_exam_mode,
                        'type-normal-card': !task.is_exam_mode
                      }"
                      @click="isTaskActive(task) && enterTask(task)"
                      :title="task.name"
                    >
                      <div class="task-progress-node-main" :class="getTimelineNodeClass(task)">
                        <div class="task-progress-node-inner-main"></div>
                      </div>
                      <div class="task-progress-info-main">
                        <div class="task-progress-number-main">{{ index + 1 }}</div>
                        <div class="task-progress-name-main">{{ task.name }}</div>
                        <div class="task-progress-meta-main">
                          <span class="task-type-badge-main" :class="task.is_exam_mode ? 'type-exam' : 'type-normal'">
                                  {{ task.is_exam_mode ? '真题试炼' : '专项突破' }}
                                </span>
                          <span class="task-progress-status-main" :class="getTaskStatusClass(task)">
                          {{ getTaskStatusText(task) }}
                        </span>
                      </div>
                        <div class="task-progress-desc-main" v-if="task.description">{{ task.description }}</div>
                        <div class="task-progress-time-main">
                          <Icon name="calendar" :size="16" />
                                <span>{{ formatDate(task.start_time) }} - {{ formatDate(task.end_time) }}</span>
                        </div>
                  </div>
                </div>
                    </div>
                      </div>

                      </div>
                      </div>
                    </div>
                  </div>
      </div>
      <div class="sidebar-placeholder-right"></div>
                </div>

    <!-- 右侧固定边栏：任务进度 + 计划信息 -->
    <div v-if="selectedPlan" class="plan-sidebar-right-fixed">
      <!-- 任务进度（顶部） -->
      <div v-if="selectedPlan.tasks && selectedPlan.tasks.length > 0" class="task-progress-sidebar">
        <div class="progress-title-sidebar">
          <Icon name="list-checks" :size="28" />
          <span>任务进度</span>
              </div>
        <div class="progress-bar-container-sidebar">
          <div 
            class="progress-bar-fill-sidebar" 
            :style="{ width: getPlanProgressPercent() + '%' }"
          ></div>
            </div>
        <div class="progress-text-sidebar">
          {{ planProgress?.completed_tasks ?? 0 }}/{{ planProgress?.total_tasks ?? 0 }}
          </div>
        
        <!-- 任务统计信息 -->
        <div class="task-stats-sidebar">
          <div class="task-stat-item-sidebar completed-stat">
            <div class="task-stat-icon">
              <Icon name="check-circle" :size="24" />
        </div>
            <div class="task-stat-content">
              <div class="task-stat-value">{{ getCompletedTasksCount() }}</div>
              <div class="task-stat-label">已完成</div>
      </div>
    </div>
          <div class="task-stat-item-sidebar overdue-stat">
            <div class="task-stat-icon">
              <Icon name="alert-circle" :size="24" />
        </div>
            <div class="task-stat-content">
              <div class="task-stat-value">{{ getOverdueTasksCount() }}</div>
              <div class="task-stat-label">已过期</div>
        </div>
            </div>
          <div class="task-stat-item-sidebar upcoming-stat">
            <div class="task-stat-icon">
              <Icon name="clock" :size="24" />
            </div>
            <div class="task-stat-content">
              <div class="task-stat-value">{{ getUpcomingTasksCount() }}</div>
              <div class="task-stat-label">未开始</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 计划信息（底部） -->
      <div class="plan-info-bottom">
        <!-- 计划标题和描述 -->
        <div class="plan-header-right">
          <h2 class="plan-title-right">{{ selectedPlan.name }}</h2>
          <div class="plan-level-badge-right">GESP {{ selectedPlan.level }}级</div>
          <p v-if="selectedPlan.description" class="plan-desc-right">{{ selectedPlan.description }}</p>
        </div>
        </div>
    </div>

    <!-- 烟花效果 -->
    <div v-if="showFireworks" class="fireworks-container">
      <div class="firework" v-for="n in 20" :key="n" :style="getFireworkStyle(n)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const route = useRoute()

import { BASE_URL } from '@/config/api'

const selectedLevel = ref<number | null>(null)
const selectedPlan = ref<any>(null)
const planProgress = ref<any>(null)

const loading = ref(false)
const error = ref<string | null>(null)
const showFireworks = ref(false)

const userInfo = ref<any>(null)

// 任务元素引用 Map
const taskRefs = ref<Map<number, HTMLElement>>(new Map())

// 设置任务引用
const setTaskRef = (el: any, taskId: number) => {
  if (el) {
    taskRefs.value.set(taskId, el)
  }
}

// 滚动到进行中的任务
const scrollToActiveTask = async () => {
  // 等待 DOM 更新
  await nextTick()
  
  if (!selectedPlan.value?.tasks || selectedPlan.value.tasks.length === 0) return
  
  // 查找进行中的任务
  const activeTask = selectedPlan.value.tasks.find((task: any) => isTaskInProgress(task))
  
  if (activeTask) {
    // 等待一下，确保 ref 已经设置
    await nextTick()
    
    const taskElement = taskRefs.value.get(activeTask.id)
    if (taskElement) {
      // 延迟一点时间，确保页面已经完全渲染完成
      setTimeout(() => {
        taskElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }, 500)
    } else {
      // 如果第一次没找到，再等一会儿重试
      setTimeout(() => {
        const retryElement = taskRefs.value.get(activeTask.id)
        if (retryElement) {
          retryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
        }
      }, 1000)
    }
  }
}

const fetchPlanTasks = async (planId: number) => {
  if (!userInfo.value?.id) return null
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/${planId}/tasks?user_id=${userInfo.value.id}`)
    if (!response.ok) throw new Error(`获取计划任务失败: ${response.status}`)
    const result = await response.json()
    if (result.success) return result.data
    throw new Error(result.message || '获取计划任务失败')
  } catch (err) {
    console.error('获取计划任务失败:', err)
    error.value = err instanceof Error ? err.message : '获取计划任务失败'
    return null
  }
}

const fetchPlanProgress = async (planId: number) => {
  if (!userInfo.value?.id) return null
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/${planId}/progress?user_id=${userInfo.value.id}`)
    if (!response.ok) throw new Error(`获取计划进度失败: ${response.status}`)
    const result = await response.json()
    if (result.success) return result.data
    throw new Error(result.message || '获取计划进度失败')
  } catch (err) {
    console.error('获取计划进度失败:', err)
    return null
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit'
  })
}

const getTaskStatusClass = (task: any) => {
  if (task.is_completed) return 'status-completed'
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  if (now < start) return 'status-upcoming'
  if (now > end) return 'status-overdue'
  return 'status-active'
}

const getTaskStatusText = (task: any) => {
  if (task.is_completed) return '已完成'
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  if (now < start) return '未开始'
  if (now > end) return '已过期，开始补做'
  return '进行中'
}

const getTimelineNodeClass = (task: any) => {
  if (task.is_completed) return 'node-completed'
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  if (now < start) return 'node-upcoming'
  if (now > end) return 'node-overdue'
  return 'node-active'
}

const getPlanProgressPercent = () => {
  if (!planProgress.value) return 0
  const total = planProgress.value.total_tasks ?? 0
  const completed = planProgress.value.completed_tasks ?? 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// 计算已完成任务数量
const getCompletedTasksCount = () => {
  if (!selectedPlan.value?.tasks) return 0
  return selectedPlan.value.tasks.filter((task: any) => task.is_completed).length
}

// 计算已过期任务数量
const getOverdueTasksCount = () => {
  if (!selectedPlan.value?.tasks) return 0
  const now = new Date()
  return selectedPlan.value.tasks.filter((task: any) => {
    if (task.is_completed) return false
    const end = new Date(task.end_time)
    return now > end
  }).length
}

// 计算未开始任务数量
const getUpcomingTasksCount = () => {
  if (!selectedPlan.value?.tasks) return 0
  const now = new Date()
  return selectedPlan.value.tasks.filter((task: any) => {
    if (task.is_completed) return false
    const start = new Date(task.start_time)
    return now < start
  }).length
}

// 检查计划是否完成（通过is_completed标志或完成率100%）
const isPlanCompleted = () => {
  if (!planProgress.value) return false
  // 如果明确标记为已完成
  if (planProgress.value.is_completed) return true
  // 如果完成率为100%
  const progressRate = planProgress.value.progress_rate ?? getPlanProgressPercent()
  if (progressRate >= 100) return true
  // 如果已完成任务数等于总任务数且总任务数大于0
  const total = planProgress.value.total_tasks ?? 0
  const completed = planProgress.value.completed_tasks ?? 0
  if (total > 0 && completed >= total) return true
  return false
}

// 触发烟花效果
const triggerFireworks = () => {
  showFireworks.value = true
  // 15秒后自动关闭烟花效果
  setTimeout(() => {
    showFireworks.value = false
  }, 15000)
}

// 生成烟花样式
const getFireworkStyle = (index: number) => {
  const angle = (360 / 20) * index
  const distance = 200 + Math.random() * 100
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const delay = Math.random() * 0.5
  const duration = 1 + Math.random() * 0.5
  
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

const isTaskActive = (task: any) => {
  if (task.is_completed) return true
  const now = new Date()
  const start = new Date(task.start_time)
  // 未开始的任务不可进入，已过期的可以进入
  if (now < start) return false
  return true
}

// 判断任务是否进行中
const isTaskInProgress = (task: any) => {
  if (task.is_completed) return false
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  return now >= start && now <= end
}

const backToPlans = () => {
  router.push('/plan')
}

const enterTask = (task: any) => {
  router.push(`/plan/${selectedPlan.value?.id}/tasks/${task.id}`)
}

const testAPIConnection = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`${BASE_URL}/health`, { method: 'GET', signal: controller.signal })
    clearTimeout(timeoutId)
    return response.ok
  } catch (err) {
    console.error('API连接测试失败:', err)
    return false
  }
}

onMounted(async () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    error.value = '请先登录'
    return
  }
  userInfo.value = JSON.parse(userInfoStr)
  const isConnected = await testAPIConnection()
  if (!isConnected) {
    error.value = '无法连接到服务器，请检查网络连接或联系管理员'
    return
  }
  const planId = Number(route.params.planId)
  if (!planId) {
    error.value = '缺少计划ID'
    return
  }
  loading.value = true
  const [planData, progressData] = await Promise.all([
    fetchPlanTasks(planId),
    fetchPlanProgress(planId)
  ])
  loading.value = false
  if (planData) {
    selectedPlan.value = { ...(planData.plan || {}), tasks: planData.tasks || [] }
    selectedLevel.value = planData.plan?.level ?? null
  }
  if (progressData) {
    planProgress.value = progressData.plan_progress
    // 更新计划信息中的进度数据
    if (selectedPlan.value && planProgress.value) {
      selectedPlan.value.completed_tasks = planProgress.value.completed_tasks || 0
      selectedPlan.value.total_tasks = planProgress.value.total_tasks || 0
      selectedPlan.value.progress = planProgress.value.progress_rate || 0
    }
    // 更新任务完成状态
    if (selectedPlan.value && progressData.tasks) {
      selectedPlan.value.tasks = selectedPlan.value.tasks.map((task: any) => {
        const progressTask = progressData.tasks.find((t: any) => t.id === task.id)
        if (progressTask) {
          return {
            ...task,
            is_completed: progressTask.task_progress?.is_completed || false
          }
        }
        return task
      })
    }
    // 如果计划完成，触发烟花特效
    if (isPlanCompleted()) {
      triggerFireworks()
    }
  }
  
  // 数据加载完成后，滚动到进行中的任务
  await nextTick()
  scrollToActiveTask()
})

// 监听计划完成状态，当从未完成变为完成时触发烟花
watch(() => {
  if (!planProgress.value) return false
  return isPlanCompleted()
}, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    triggerFireworks()
  }
})
</script>

<style scoped>
/* 基础布局 */
.exam-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px 20px 20px; /* 移除底部 padding，因为不再有底部固定栏 */
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0;
}

/* 右侧固定边栏 - 低幼化风格，更宽更大 */
.plan-sidebar-right-fixed {
  position: fixed;
  top: 48px; /* 从导航栏下方开始 */
  right: 0;
  bottom: 0;
  width: 420px; /* 从280px增加到420px，更宽 */
  z-index: 999;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-left: 8px solid #0c7cd5; /* 更粗的边框 */
  box-shadow: -12px 0 40px rgba(30, 144, 255, 0.4);
  padding: 28px 20px; /* 更大的内边距 */
  backdrop-filter: blur(10px);
  animation: slideRight 0.4s ease-out;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 允许滚动 */
}

@keyframes slideRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 计划标题和描述 - 低幼化，更大更可爱 */
.plan-header-right {
  text-align: center;
  margin-bottom: 0; /* 底部不需要间距 */
  padding-bottom: 0; /* 底部不需要内边距 */
}

.plan-title-right {
  margin: 0 0 12px 0; /* 更大的间距 */
  font-size: 2.2rem; /* 从1.6rem增加到2.2rem */
  font-weight: 900;
  color: white;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.3); /* 更强的阴影效果 */
  letter-spacing: 2px; /* 更大的字间距 */
  line-height: 1.3;
  word-break: break-word;
}

.plan-level-badge-right {
  display: inline-block;
  background: rgba(255, 255, 255, 0.25); /* 更亮的背景 */
  color: white;
  padding: 10px 18px; /* 更大的内边距 */
  border-radius: 20px; /* 更大的圆角 */
  font-size: 1.1rem; /* 从0.85rem增加到1.1rem */
  font-weight: 800; /* 更粗的字体 */
  margin-bottom: 12px; /* 更大的间距 */
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.4); /* 更粗的边框 */
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); /* 添加阴影 */
}

.plan-desc-right {
  margin: 12px 0 0 0; /* 更大的间距 */
  font-size: 1.2rem; /* 从0.95rem增加到1.2rem */
  font-weight: 600; /* 更粗的字体 */
  color: rgba(255, 255, 255, 0.95); /* 更亮的颜色 */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.6; /* 更大的行高 */
  word-break: break-word;
}

/* 计划统计信息 - 低幼化，更大更可爱 */
.plan-stats-right {
  display: flex;
  gap: 16px; /* 更大的间距 */
  margin-bottom: 0;
}

.plan-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px; /* 更大的间距 */
  padding: 18px 12px; /* 更大的内边距 */
  background: rgba(255, 255, 255, 0.2); /* 更亮的背景 */
  border-radius: 20px; /* 更大的圆角 */
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3); /* 更粗的边框 */
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15); /* 添加阴影 */
  transition: all 0.3s ease;
}

.plan-stat-item:hover {
  transform: scale(1.05); /* 悬停放大效果 */
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.25);
}

.stat-value-right {
  font-size: 2rem; /* 从1.4rem增加到2rem */
  font-weight: 900; /* 更粗的字体 */
  color: white;
  line-height: 1;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 255, 255, 0.2); /* 更强的阴影 */
}

.stat-label-right {
  font-size: 0.95rem; /* 从0.75rem增加到0.95rem */
  font-weight: 700; /* 更粗的字体 */
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 任务进度区域（顶部，占据主要空间） */
.plan-progress-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0; /* 允许 flex 子元素缩小 */
  overflow: hidden; /* 防止溢出 */
}

.progress-title-right {
  display: flex;
  align-items: center;
  gap: 12px; /* 更大的间距 */
  color: white;
  font-size: 1.4rem; /* 从1rem增加到1.4rem */
  font-weight: 800; /* 更粗的字体 */
  margin-bottom: 12px; /* 更大的间距 */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-title-right :deep(.lucide-icon) {
  color: white;
  flex-shrink: 0;
  width: 28px; /* 更大的图标 */
  height: 28px;
}

.progress-bar-container-right {
  width: 100%;
  height: 16px; /* 从10px增加到16px，更粗的进度条 */
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px; /* 更大的圆角 */
  overflow: hidden;
  position: relative;
  margin-bottom: 12px; /* 更大的间距 */
  border: 2px solid rgba(255, 255, 255, 0.2); /* 添加边框 */
}

.progress-bar-fill-right {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, #e0f2fe 100%);
  border-radius: 20px;
  transition: width 0.5s ease-in-out;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.5); /* 更强的阴影 */
}

.progress-text-right {
  text-align: center;
  color: white;
  font-size: 1.1rem; /* 从0.85rem增加到1.1rem */
  font-weight: 700; /* 更粗的字体 */
  margin-bottom: 16px; /* 更大的间距 */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 可点击的任务进度列表 - 低幼化 */
.task-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 从8px增加到12px，更大的间距 */
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 允许 flex 子元素缩小 */
  padding-right: 4px; /* 为滚动条留出空间 */
}

/* 右侧边栏任务进度区域 */
.task-progress-sidebar {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 4px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.progress-title-sidebar {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 1.6rem; /* 更大的字体 */
  font-weight: 800;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-title-sidebar :deep(.lucide-icon) {
  color: white;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.progress-bar-container-sidebar {
  width: 100%;
  height: 20px; /* 更粗的进度条 */
  background: rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  margin-bottom: 12px;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.progress-bar-fill-sidebar {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, #e0f2fe 100%);
  border-radius: 24px;
  transition: width 0.5s ease-in-out;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.5);
}

.progress-text-sidebar {
  text-align: center;
  color: white;
  font-size: 1.2rem; /* 更大的字体 */
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 任务统计信息 */
.task-stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-stat-item-sidebar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border: 3px solid transparent;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.task-stat-item-sidebar:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
}

.task-stat-item-sidebar.completed-stat {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.15);
}

.task-stat-item-sidebar.overdue-stat {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.15);
}

.task-stat-item-sidebar.upcoming-stat {
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.15);
}

.task-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.task-stat-item-sidebar.completed-stat .task-stat-icon {
  background: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.task-stat-item-sidebar.overdue-stat .task-stat-icon {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.task-stat-item-sidebar.upcoming-stat .task-stat-icon {
  background: rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.task-stat-item-sidebar :deep(.lucide-icon) {
  color: white;
  flex-shrink: 0;
}

.task-stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-stat-value {
  font-size: 2rem; /* 更大的字体 */
  font-weight: 900;
  color: white;
  line-height: 1;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.task-stat-label {
  font-size: 1rem; /* 更大的字体 */
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 计划信息底部区域 - 低幼化 */
.plan-info-bottom {
  margin-top: auto; /* 推到底部 */
  padding-top: 20px; /* 顶部内边距 */
  flex-shrink: 0; /* 防止被压缩 */
}

.task-progress-item {
  display: flex;
  align-items: center;
  gap: 14px; /* 从10px增加到14px */
  padding: 16px 18px; /* 从10px 12px增加到16px 18px，更大的内边距 */
  background: rgba(255, 255, 255, 0.2); /* 更亮的背景 */
  border-radius: 20px; /* 从12px增加到20px，更大的圆角 */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 更流畅的动画 */
  border: 3px solid transparent; /* 从2px增加到3px */
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.task-progress-item:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.3); /* 更亮的悬停背景 */
  border-color: rgba(255, 255, 255, 0.5); /* 更明显的边框 */
  transform: translateX(-6px) scale(1.02); /* 更大的移动和缩放效果 */
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3); /* 更强的阴影 */
}

.task-progress-item.completed {
  background: rgba(34, 197, 94, 0.25); /* 更亮的背景 */
  border-color: rgba(34, 197, 94, 0.5); /* 更明显的边框 */
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2); /* 添加阴影 */
}

.task-progress-item.active {
  background: rgba(255, 255, 255, 0.3); /* 更亮的背景 */
  border-color: rgba(255, 255, 255, 0.6); /* 更明显的边框 */
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3); /* 更强的阴影 */
  animation: activePulse 2s ease-in-out infinite; /* 添加脉冲动画 */
}

@keyframes activePulse {
  0%, 100% {
    box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.5);
  }
}

.task-progress-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-progress-item.locked:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.2);
  border-color: transparent;
}

.task-progress-node {
  width: 32px; /* 从24px增加到32px */
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.5); /* 从2px增加到3px */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2); /* 添加阴影 */
}

.task-progress-node-inner {
  width: 16px; /* 从12px增加到16px */
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7); /* 更亮的内部 */
  transition: all 0.3s ease;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4); /* 添加发光效果 */
}

.task-progress-item.completed .task-progress-node {
  background: rgba(34, 197, 94, 0.4); /* 更亮的背景 */
  border-color: rgba(34, 197, 94, 0.9); /* 更明显的边框 */
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4); /* 更强的阴影 */
}

.task-progress-item.completed .task-progress-node-inner {
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.8); /* 更强的发光效果 */
  width: 18px; /* 稍微大一点 */
  height: 18px;
}

.task-progress-item.active .task-progress-node {
  background: rgba(255, 255, 255, 0.5); /* 更亮的背景 */
  border-color: rgba(255, 255, 255, 0.9); /* 更明显的边框 */
  animation: nodePulse 2s ease-in-out infinite;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.4); /* 更强的阴影 */
}

.task-progress-item.active .task-progress-node-inner {
  background: white;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.9); /* 更强的发光效果 */
  width: 18px; /* 稍微大一点 */
  height: 18px;
}

.task-progress-item.locked .task-progress-node {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.task-progress-item.locked .task-progress-node-inner {
  background: rgba(255, 255, 255, 0.3);
}

@keyframes nodePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.task-progress-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px; /* 从4px增加到6px */
}

.task-progress-number {
  font-size: 0.9rem; /* 从0.7rem增加到0.9rem */
  font-weight: 800; /* 从700增加到800 */
  color: rgba(255, 255, 255, 0.9); /* 更亮的颜色 */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* 更强的阴影 */
}

.task-progress-name {
  font-size: 1.05rem; /* 从0.85rem增加到1.05rem */
  font-weight: 700; /* 从600增加到700 */
  color: white;
  line-height: 1.4; /* 从1.3增加到1.4 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* 更强的阴影 */
}

.task-progress-status {
  font-size: 0.85rem; /* 从0.7rem增加到0.85rem */
  font-weight: 700; /* 从600增加到700 */
  padding: 4px 10px; /* 从2px 6px增加到4px 10px */
  border-radius: 12px; /* 从6px增加到12px，更大的圆角 */
  display: inline-block;
  width: fit-content;
  border: 2px solid transparent; /* 添加边框 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.task-progress-status.status-completed {
  background: rgba(34, 197, 94, 0.4); /* 更亮的背景 */
  color: #ffffff; /* 更亮的文字 */
  border-color: rgba(34, 197, 94, 0.6); /* 添加边框 */
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3); /* 更强的阴影 */
}

.task-progress-status.status-active {
  background: rgba(30, 144, 255, 0.4); /* 更亮的背景 */
  color: #ffffff; /* 更亮的文字 */
  border-color: rgba(30, 144, 255, 0.6); /* 添加边框 */
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3); /* 更强的阴影 */
  animation: statusPulse 2s ease-in-out infinite; /* 添加脉冲动画 */
}

@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.5);
  }
}

.task-progress-status.status-upcoming {
  background: rgba(251, 191, 36, 0.4); /* 更亮的背景 */
  color: #ffffff; /* 更亮的文字 */
  border-color: rgba(251, 191, 36, 0.6); /* 添加边框 */
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3); /* 更强的阴影 */
}

.task-progress-status.status-overdue {
  background: rgba(239, 68, 68, 0.4); /* 更亮的背景 */
  color: #ffffff; /* 更亮的文字 */
  border-color: rgba(239, 68, 68, 0.6); /* 添加边框 */
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); /* 更强的阴影 */
}

.sidebar-placeholder-left { 
  width: 50px; 
  flex-shrink: 0; 
}
.sidebar-placeholder-right { width: 50px; flex-shrink: 0; }

/* 左侧返回按钮样式 - 固定定位 */
.back-nav-arrow {
  position: fixed;
  left: 20px;
  top: 80px;
  background: rgba(30, 144, 255, 0.15);
  backdrop-filter: blur(10px);
  color: #1e90ff;
  border: 2px solid rgba(30, 144, 255, 0.3);
  border-radius: 12px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  z-index: 100;
}

.back-nav-arrow:hover {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.5);
  color: #0c7cd5;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
}

.back-nav-arrow:active {
  transform: scale(0.95);
}

.back-nav-arrow :deep(.lucide-icon) {
  flex-shrink: 0;
}
.question-main { flex: 1; max-width: 1600px; min-width: 0; }
.question-card { 
  background: #f8fafc; 
  border: 1.5px solid #e2e8f0; 
  border-radius: 18px; 
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1); 
  transition: all 0.3s ease; 
  padding: 0; 
  overflow: visible; 
  width: 100%; 
  min-height: calc(100vh - 84px - 80px); /* 最小高度，减去顶部空间和底部 header 高度 */
  display: flex; 
  flex-direction: column; 
  margin: 20px auto 0 auto; /* 减少上边距，让卡片上移 */
  box-sizing: border-box; 
}

/* 任务列表视图时，卡片背景透明融入页面背景 */
.question-card.task-view-transparent {
  background: transparent;
  border: none;
  box-shadow: none;
}

.question-card.task-view-transparent .question-card-header {
  display: none; /* 任务列表视图时隐藏 header */
}
.question-card-header { 
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); 
  padding: 12px 28px; 
  border-bottom: 3px solid #e0f2fe; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  position: relative; 
  overflow: hidden; 
}
.header-left-section { display: flex; align-items: center; gap: 12px; min-width: 150px; }
.header-center-section { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: center; }
.header-right-section { display: flex; align-items: center; gap: 12px; min-width: 150px; justify-content: flex-end; }
.number-badge { background: rgba(255, 255, 255, 0.2); color: white; padding: 10px 20px; border-radius: 24px; font-weight: 700; font-size: 1.1rem; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); }
.level-badge { background: rgba(255, 255, 255, 0.15); color: white; padding: 8px 14px; border-radius: 18px; font-weight: 600; font-size: 0.95rem; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
.question-content-unified { flex: 1; display: flex; flex-direction: row; overflow: visible; background: transparent; /* 透明背景，融入页面背景 */ }
.question-left-panel { 
  flex: 1; 
  overflow: visible; 
  padding: 24px; 
  padding-right: 440px; /* 为右侧边栏预留空间，从300px增加到440px */
  display: flex; 
  flex-direction: column; 
  gap: 24px; 
  background: transparent; /* 透明背景，融入页面背景 */ 
}
.question-left-panel-centered { max-width: 1600px; margin: 0 auto; width: 100%; }
.content-section { 
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
  border-radius: 20px; 
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.12); 
  overflow: visible; 
  border: 2px solid #e0f2fe; 
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
  position: relative; 
  display: flex; 
  flex-direction: column; 
  min-height: fit-content; 
}
.section-header { background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); padding: 18px 24px; border-bottom: 2px solid #e0f2fe; border-radius: 18px 18px 0 0; position: relative; }
.section-title { margin: 0; color: white; font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.section-content { padding: 24px; background: transparent; }
.back-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30,144,255,0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.back-btn:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30,144,255,0.3);
}
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 5rem; margin-bottom: 20px; }
.empty-state h3 { color: #1e293b; font-size: 1.5rem; margin: 0 0 10px 0; }
.empty-state p { color: #64748b; font-size: 1.1rem; }
.error-state { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; }
.error-icon { 
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  color: #dc2626;
}
.error-state h3 { color: #dc2626; font-size: 1.5rem; margin: 0 0 10px 0; }
.error-state p { color: #991b1b; font-size: 1.1rem; margin-bottom: 20px; }
.retry-btn { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
.retry-btn:hover { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
.loading-state { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; }
.loading-icon { 
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  color: #1e90ff;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.tasks-list { display: flex; flex-direction: column; gap: 20px; }
.task-item { display: flex; gap: 16px; padding: 24px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid #e2e8f0; border-radius: 16px; transition: all 0.3s ease; }
.task-item:hover { border-color: #1e90ff; box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15); }
.task-item.completed { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #86efac; }
.task-item.active { border-color: #38bdf8; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
.task-number { width: 40px; height: 40px; background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
.task-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-desc { color: #64748b; font-size: 0.95rem; margin: 0 0 16px 0; line-height: 1.5; }
.task-time { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.9rem; margin-bottom: 12px; }
.task-exercises-stats { display: flex; gap: 16px; margin-bottom: 16px; }
.exercise-stat { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.9rem; font-weight: 500; }
.task-actions { display: flex; gap: 12px; }
.task-action-btn { padding: 10px 20px; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; }
.start-btn { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); }
.start-btn:hover:not(:disabled) { background: linear-gradient(135deg, #059669 0%, #10b981 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 完成提示横幅 */
.completion-banner {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 3px solid #86efac;
  animation: completionPulse 2s ease-in-out infinite;
}

@keyframes completionPulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2);
  }
  50% {
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
  }
}

.completion-message {
  text-align: center;
  padding: 20px;
}

.completion-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
  color: #22c55e;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.completion-message h3 {
  color: #059669;
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.completion-time {
  color: #047857;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

/* 左侧任务列表 - 低幼化风格 */
.task-list-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 24px 0;
}

/* 任务列表容器 */
.task-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 更大的间距 */
}

/* 任务项 - 低幼化风格 */
.task-progress-item-main {
  display: flex;
  align-items: flex-start;
  gap: 18px; /* 更大的间距 */
  padding: 20px 24px; /* 更大的内边距 */
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24px; /* 更大的圆角 */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 4px solid #e0f2fe; /* 更粗的边框 */
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.1);
}

.task-progress-item-main:hover:not(.locked) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #1e90ff;
  transform: translateX(8px) scale(1.02); /* 更大的移动和缩放效果 */
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.2);
}

/* 通用的完成状态已被类型特定的样式覆盖，保留节点和状态的完成样式 */

.task-progress-item-main.active {
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.25);
  animation: activePulseMain 2s ease-in-out infinite;
}

@keyframes activePulseMain {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(30, 144, 255, 0.25);
  }
  50% {
    box-shadow: 0 8px 24px rgba(30, 144, 255, 0.35);
  }
}

.task-progress-item-main.locked {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(20%);
}

.task-progress-item-main.locked:hover {
  transform: none;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-color: #e0f2fe;
}

/* 专项突破卡片 - 蓝色主题 */
.task-progress-item-main.type-normal-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #1e90ff;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15);
}

.task-progress-item-main.type-normal-card:hover:not(.locked) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #0c7cd5;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.3);
}

.task-progress-item-main.type-normal-card.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #1e90ff;
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.3);
}

/* 专项突破完成状态 - 保持蓝色主题，只是边框稍微深一点表示完成 */
.task-progress-item-main.type-normal-card.completed {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #0c7cd5;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.2);
}

.task-progress-item-main.type-normal-card.locked {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #94a3b8;
}

.task-progress-item-main.type-normal-card.locked:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #94a3b8;
}

/* 真题试炼卡片 - 金色主题 */
.task-progress-item-main.type-exam-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.task-progress-item-main.type-exam-card:hover:not(.locked) {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #d97706;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.task-progress-item-main.type-exam-card.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
  animation: activePulseExam 2s ease-in-out infinite;
}

@keyframes activePulseExam {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  }
}

/* 真题试炼完成状态 - 保持金色主题，只是边框稍微深一点表示完成 */
.task-progress-item-main.type-exam-card.completed {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #d97706;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
}

.task-progress-item-main.type-exam-card.locked {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-color: #d1d5db;
}

.task-progress-item-main.type-exam-card.locked:hover {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-color: #d1d5db;
}

/* 任务节点 */
.task-progress-node-main {
  width: 40px; /* 更大的节点 */
  height: 40px;
  border-radius: 50%;
  background: rgba(30, 144, 255, 0.1);
  border: 4px solid rgba(30, 144, 255, 0.3); /* 更粗的边框 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
}

/* 专项突破节点 - 蓝色 */
.type-normal-card .task-progress-node-main {
  background: rgba(30, 144, 255, 0.15);
  border-color: rgba(30, 144, 255, 0.4);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.25);
}

.type-normal-card .task-progress-node-inner-main {
  background: rgba(30, 144, 255, 0.6);
  box-shadow: 0 0 10px rgba(30, 144, 255, 0.5);
}

/* 真题试炼节点 - 金色 */
.type-exam-card .task-progress-node-main {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.type-exam-card .task-progress-node-inner-main {
  background: rgba(245, 158, 11, 0.6);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.task-progress-node-inner-main {
  width: 20px; /* 更大的内部节点 */
  height: 20px;
  border-radius: 50%;
  background: rgba(30, 144, 255, 0.5);
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(30, 144, 255, 0.4);
}

.task-progress-item-main.completed .task-progress-node-main {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.6);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.task-progress-item-main.completed .task-progress-node-inner-main {
  background: #22c55e;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.7);
  width: 22px;
  height: 22px;
}

.task-progress-item-main.active .task-progress-node-main {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.6);
  animation: nodePulseMain 2s ease-in-out infinite;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.4);
}

/* 专项突破进行中节点 - 蓝色 */
.type-normal-card.active .task-progress-node-main {
  background: rgba(30, 144, 255, 0.25);
  border-color: rgba(30, 144, 255, 0.7);
  animation: nodePulseBlue 2s ease-in-out infinite;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.5);
}

.type-normal-card.active .task-progress-node-inner-main {
  background: #1e90ff;
  box-shadow: 0 0 18px rgba(30, 144, 255, 0.9);
  width: 22px;
  height: 22px;
}

/* 真题试炼进行中节点 - 金色 */
.type-exam-card.active .task-progress-node-main {
  background: rgba(245, 158, 11, 0.25);
  border-color: rgba(245, 158, 11, 0.7);
  animation: nodePulseGold 2s ease-in-out infinite;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
}

.type-exam-card.active .task-progress-node-inner-main {
  background: #f59e0b;
  box-shadow: 0 0 18px rgba(245, 158, 11, 0.9);
  width: 22px;
  height: 22px;
}

.task-progress-item-main.active .task-progress-node-inner-main {
  background: #1e90ff;
  box-shadow: 0 0 18px rgba(30, 144, 255, 0.8);
  width: 22px;
  height: 22px;
}

@keyframes nodePulseMain {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes nodePulseBlue {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(30, 144, 255, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(30, 144, 255, 0.7);
  }
}

@keyframes nodePulseGold {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.7);
  }
}

.task-progress-item-main.locked .task-progress-node-main {
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.3);
}

.task-progress-item-main.locked .task-progress-node-inner-main {
  background: rgba(148, 163, 184, 0.4);
}

/* 任务信息 */
.task-progress-info-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px; /* 更大的间距 */
}

.task-progress-number-main {
  font-size: 1.1rem; /* 更大的字体 */
  font-weight: 800;
  color: #1e90ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 专项突破编号 - 蓝色 */
.type-normal-card .task-progress-number-main {
  color: #1e90ff;
  text-shadow: 0 2px 4px rgba(30, 144, 255, 0.3);
}

/* 真题试炼编号 - 金色 */
.type-exam-card .task-progress-number-main {
  color: #d97706;
  text-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.task-progress-name-main {
  font-size: 1.3rem; /* 更大的字体 */
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

/* 专项突破名称颜色保持深色 */
.type-normal-card .task-progress-name-main {
  color: #1e293b;
}

/* 真题试炼名称颜色稍微深一点以适应金色背景 */
.type-exam-card .task-progress-name-main {
  color: #78350f;
}

.task-progress-meta-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-type-badge-main {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.task-type-badge-main.type-exam {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-color: #d97706;
}

.task-type-badge-main.type-normal {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border-color: #1e90ff;
}

.task-progress-status-main {
  font-size: 0.95rem; /* 更大的字体 */
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 16px;
  display: inline-block;
  width: fit-content;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.task-progress-status-main.status-completed {
  background: rgba(34, 197, 94, 0.2);
  color: #059669;
  border-color: rgba(34, 197, 94, 0.4);
}

.task-progress-status-main.status-active {
  background: rgba(30, 144, 255, 0.2);
  color: #1e40af;
  border-color: rgba(30, 144, 255, 0.4);
  animation: statusPulseMain 2s ease-in-out infinite;
}

@keyframes statusPulseMain {
  0%, 100% {
    box-shadow: 0 2px 6px rgba(30, 144, 255, 0.2);
  }
  50% {
    box-shadow: 0 4px 10px rgba(30, 144, 255, 0.4);
  }
}

.task-progress-status-main.status-upcoming {
  background: rgba(251, 191, 36, 0.2);
  color: #d97706;
  border-color: rgba(251, 191, 36, 0.4);
}

.task-progress-status-main.status-overdue {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.4);
}

.task-progress-desc-main {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin-top: 4px;
}

.task-progress-time-main {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.task-progress-time-main :deep(.lucide-icon) {
  color: #1e90ff;
  flex-shrink: 0;
}

/* 专项突破时间图标 - 蓝色 */
.type-normal-card .task-progress-time-main :deep(.lucide-icon) {
  color: #1e90ff;
}

/* 真题试炼时间图标 - 金色 */
.type-exam-card .task-progress-time-main :deep(.lucide-icon) {
  color: #d97706;
}

/* 时间轴包装器（保留原有样式，但可能不再使用） */
.timeline-wrapper {
  position: relative;
  padding: 20px 0 20px 60px;
  margin: 24px 0;
}

/* 连续的时间轴线 */
.timeline-axis {
  position: absolute;
  left: 30px;
  top: 0;
  bottom: 0;
  width: 2px;
  z-index: 1;
}

.timeline-axis-line {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, 
    rgba(30, 144, 255, 0.3) 0%,
    rgba(30, 144, 255, 0.6) 20%,
    rgba(56, 189, 248, 0.8) 50%,
    rgba(30, 144, 255, 0.6) 80%,
    rgba(30, 144, 255, 0.3) 100%
  );
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(30, 144, 255, 0.3);
}

/* 时间轴项容器 */
.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 2;
}

/* 时间轴项 */
.timeline-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  position: relative;
}

/* 时间轴节点包装器 */
.timeline-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  left: -46px;
  top: 0;
  width: 40px;
  flex-shrink: 0;
}

/* 时间轴节点 */
.timeline-node {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-node-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1e90ff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.timeline-node-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.timeline-node.node-completed {
  border-color: #22c55e;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.3);
}

.timeline-node.node-completed .timeline-node-inner {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.timeline-node.node-completed .timeline-node-glow {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%);
  opacity: 1;
}

.timeline-node.node-active {
  border-color: #1e90ff;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(30, 144, 255, 0.4);
  animation: nodePulse 2s ease-in-out infinite;
}

.timeline-node.node-active .timeline-node-inner {
  background: #1e90ff;
  box-shadow: 0 0 10px rgba(30, 144, 255, 0.7);
}

.timeline-node.node-active .timeline-node-glow {
  background: radial-gradient(circle, rgba(30, 144, 255, 0.4) 0%, transparent 70%);
  opacity: 1;
  animation: glowPulse 2s ease-in-out infinite;
}

.timeline-node.node-upcoming {
  border-color: #fbbf24;
  background: #ffffff;
}

.timeline-node.node-upcoming .timeline-node-inner {
  background: #fbbf24;
}

.timeline-node.node-overdue {
  border-color: #ef4444;
  background: #ffffff;
}

.timeline-node.node-overdue .timeline-node-inner {
  background: #ef4444;
}

@keyframes nodePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.3);
  }
}

/* 节点标签 */
.timeline-node-label {
  margin-top: 8px;
}

.node-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(30, 144, 255, 0.3);
}

/* 卡片包装器 */
.timeline-card-wrapper {
  flex: 1;
  min-width: 0;
}

/* 紧凑的任务卡片 */
.task-card-compact {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
  border: 1.5px solid #e0f2fe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.08);
  overflow: hidden;
}

.task-card-compact:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.15);
  border-color: #1e90ff;
}

.task-card-compact.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%) !important;
  border-color: #86efac;
}

.task-card-compact.active {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
  border-color: #38bdf8;
  box-shadow: 0 4px 20px rgba(30, 144, 255, 0.12);
}

.task-card-compact.locked {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(30%);
}

.task-card-compact.locked:hover {
  transform: none;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.08);
  border-color: #e0f2fe;
}

/* 紧凑的内容区域 */
.section-content-compact {
  padding: 16px 18px;
  background: transparent;
}

/* 任务头部紧凑版 */
.task-header-compact {
  margin-bottom: 10px;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-title-compact {
  color: #1e293b;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 700;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.task-type-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.task-type-badge.type-exam {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.task-type-badge.type-normal {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(30, 144, 255, 0.3);
}

.task-status-badge-compact {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.task-status-badge-compact.status-completed {
  background: #d1fae5;
  color: #059669;
}

.task-status-badge-compact.status-active {
  background: #dbeafe;
  color: #1e40af;
}

.task-status-badge-compact.status-upcoming {
  background: #fef3c7;
  color: #d97706;
}

.task-status-badge-compact.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}

/* 任务描述紧凑版 */
.task-desc-compact {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 任务元信息紧凑版 */
.task-meta-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(30, 144, 255, 0.15);
}

.task-time-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.task-time-compact :deep(.lucide-icon) {
  flex-shrink: 0;
  color: #1e90ff;
}

.task-stats-compact {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.task-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(30, 144, 255, 0.08);
  border-radius: 6px;
  font-size: 0.75rem;
  color: #1e40af;
  font-weight: 600;
}

.task-stat-item :deep(.lucide-icon) {
  flex-shrink: 0;
  color: #1e90ff;
}

/* 操作按钮紧凑版 */
.task-action-compact {
  display: flex;
  justify-content: flex-end;
}

.enter-task-btn-compact {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.25);
}

.enter-task-btn-compact :deep(.lucide-icon) {
  flex-shrink: 0;
}

.enter-task-btn-compact[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}

.enter-task-btn-compact:hover:not([disabled]) {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateX(2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
}

/* —— 增加卡片内部结构和布局样式优化 —— */
.task-card-header-revised {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 0 6px 0;
  position: relative;
}
.task-card-header-revised .task-card-number {
  margin: 0;
}
.task-card-header-revised .task-card-title {
  margin: 0;
  flex: 1;
  font-size: 1.15rem;
  font-weight: 800;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.task-card-header-revised .task-card-status {
  position: absolute;
  top: 0;
  right: 0;
  transform: none;
  margin: 0;
  border-radius: 10px;
}
.task-card-meta-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin: 2px 0 10px 0;
  flex-wrap: wrap;
}
.task-card-actions-align {
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .exam-content-flex-row { 
    flex-direction: column; 
    gap: 16px; 
    padding: 0 16px; 
  }
  .sidebar-placeholder-right { display: none; }
  .sidebar-placeholder-left {
    width: auto;
    padding-top: 10px;
    position: static;
  }
  .back-nav-arrow {
    width: 48px;
    height: 48px;
  }
  .back-nav-arrow :deep(.lucide-icon) {
    width: 24px;
    height: 24px;
  }
  .question-main { max-width: 100%; }
  .question-card { 
    height: auto; 
    min-height: calc(100vh - 20px); 
  }
  .question-left-panel { 
    padding: 16px; 
    padding-right: 16px; /* 移动端移除右侧 padding */
    gap: 16px; 
  }
  
  /* 隐藏右侧边栏 */
  .plan-sidebar-right-fixed {
    display: none;
  }
  
  /* 时间轴响应式 */
  .timeline-wrapper {
    padding-left: 60px;
  }
  
  .timeline-axis {
    left: 30px;
  }
  
  .timeline-node-wrapper {
    left: -60px;
    width: 50px;
  }
  
  .timeline-node {
    width: 28px;
    height: 28px;
  }
  
  .timeline-node-inner {
    width: 12px;
    height: 12px;
  }
  
  .node-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
  
  .task-title-compact {
    font-size: 1rem; 
  }
  
  .task-meta-compact {
    flex-direction: column; 
    align-items: flex-start;
    gap: 8px; 
  }
  
  .task-stats-compact {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .question-card-header {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .back-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
  .number-badge {
    font-size: 0.95rem;
    padding: 8px 16px;
  }
  .task-item { padding: 16px; }
  .task-main-content h4 { font-size: 1.1rem; }
  
  /* 隐藏右侧边栏 */
  .plan-sidebar-right-fixed {
    display: none;
  }
  
  .question-left-panel {
    padding-right: 16px;
  }
}

/* 计划进度卡片 */
.plan-progress-card {
  margin-bottom: 24px;
}

.progress-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-stat-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
}

.progress-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e90ff;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff 0%, #38bdf8 100%);
  border-radius: 10px;
  transition: width 0.5s ease-in-out;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}

/* 烟花效果样式 */
.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 10002;
  overflow: hidden;
}

.firework {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 30px currentColor,
    -30px -30px 0 currentColor,
    30px 30px 0 currentColor,
    -30px 30px 0 currentColor,
    30px -30px 0 currentColor,
    -60px 0 0 currentColor,
    60px 0 0 currentColor,
    0 -60px 0 currentColor,
    0 60px 0 currentColor;
  animation: firework-explode 3s ease-out infinite;
  transform: translate(-50%, -50%);
}

.firework:nth-child(1) { color: #1e90ff; }
.firework:nth-child(2) { color: #38bdf8; }
.firework:nth-child(3) { color: #06b6d4; }
.firework:nth-child(4) { color: #22c55e; }
.firework:nth-child(5) { color: #f59e0b; }
.firework:nth-child(6) { color: #ef4444; }
.firework:nth-child(7) { color: #8b5cf6; }
.firework:nth-child(8) { color: #ec4899; }
.firework:nth-child(9) { color: #1e90ff; }
.firework:nth-child(10) { color: #38bdf8; }
.firework:nth-child(11) { color: #06b6d4; }
.firework:nth-child(12) { color: #22c55e; }
.firework:nth-child(13) { color: #f59e0b; }
.firework:nth-child(14) { color: #ef4444; }
.firework:nth-child(15) { color: #8b5cf6; }
.firework:nth-child(16) { color: #ec4899; }
.firework:nth-child(17) { color: #1e90ff; }
.firework:nth-child(18) { color: #38bdf8; }
.firework:nth-child(19) { color: #06b6d4; }
.firework:nth-child(20) { color: #22c55e; }

@keyframes firework-explode {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 1;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1) rotate(360deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0) rotate(540deg);
    opacity: 0;
  }
}
</style>

