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

                <!-- 时间轴任务列表 -->
                <div class="timeline-wrapper">
                  <!-- 连续的时间轴线 -->
                  <div class="timeline-axis">
                    <div class="timeline-axis-line"></div>
                  </div>
                  
                  <!-- 任务列表 -->
                  <div class="timeline-items">
                    <div
                      v-for="(task, index) in selectedPlan?.tasks || []"
                      :key="task.id"
                      class="timeline-item"
                    >
                      <!-- 时间轴节点 -->
                      <div class="timeline-node-wrapper">
                        <div class="timeline-node" :class="getTimelineNodeClass(task)">
                          <div class="timeline-node-inner"></div>
                          <div class="timeline-node-glow"></div>
                        </div>
                        <div class="timeline-node-label">
                          <span class="node-number">{{ index + 1 }}</span>
                        </div>
                      </div>
                      
                      <!-- 任务卡片 -->
                      <div class="timeline-card-wrapper">
                        <div
                          class="content-section task-card-compact"
                      :class="{ completed: task.is_completed, active: isTaskActive(task), locked: !isTaskActive(task) }"
                      @click="isTaskActive(task) && enterTask(task)"
                    >
                          <div class="section-content-compact">
                            <!-- 任务头部 -->
                            <div class="task-header-compact">
                              <div class="task-title-row">
                                <span class="task-type-badge" :class="task.is_exam_mode ? 'type-exam' : 'type-normal'">
                                  {{ task.is_exam_mode ? '真题试炼' : '专项突破' }}
                                </span>
                                <h3 class="task-title-compact">{{ task.name }}</h3>
                                <span class="task-status-badge-compact" :class="getTaskStatusClass(task)">
                          {{ getTaskStatusText(task) }}
                        </span>
                      </div>
                        </div>
                            
                            <!-- 任务描述 -->
                            <p class="task-desc-compact">{{ task.description }}</p>
                            
                            <!-- 任务元信息 -->
                            <div class="task-meta-compact">
                              <div class="task-time-compact">
                                <Icon name="calendar" :size="14" />
                                <span>{{ formatDate(task.start_time) }} - {{ formatDate(task.end_time) }}</span>
                        </div>
                              <div class="task-stats-compact">
                                <span class="task-stat-item">
                                  <Icon name="file-text" :size="14" />
                                  <span>{{ task.exam_count || 0 }}套</span>
                                </span>
                                <span class="task-stat-item">
                                  <Icon name="code" :size="14" />
                                  <span>{{ task.oj_count || 0 }}道</span>
                                </span>
                  </div>
                </div>

                            <!-- 操作按钮 -->
                            <div class="task-action-compact">
                              <button class="enter-task-btn-compact" @click.stop="enterTask(task)" :disabled="!isTaskActive(task)">
                                <Icon name="arrow-right" :size="14" />
                              </button>
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
        </div>
      </div>
      <div class="sidebar-placeholder-right"></div>
    </div>

    <!-- 底部固定：计划信息 + 计划完成进度 -->
    <div class="plan-header-fixed" v-if="selectedPlan">
      <div class="plan-header-inner">
        <div class="plan-header-actions">
          <button class="back-btn" @click="backToPlans">
            <Icon name="arrow-left" :size="16" /> 返回
          </button>
        </div>
        <!-- 计划基本信息 -->
        <div class="plan-header-info">
          <div class="plan-header-title-section">
            <h2 class="plan-header-title">{{ selectedPlan.name }}</h2>
            <div class="plan-level-badge-header">GESP {{ selectedPlan.level }}级</div>
        </div>
          <p class="plan-header-desc" v-if="selectedPlan.description">{{ selectedPlan.description }}</p>
          <div class="plan-header-stats">
            <div class="info-stat-header">
              <span class="stat-value-header">{{ planProgress?.completed_tasks ?? selectedPlan.completed_tasks ?? 0 }}</span>
              <span class="stat-label-header">已完成</span>
            </div>
            <div class="info-stat-header">
              <span class="stat-value-header">{{ planProgress?.total_tasks ?? selectedPlan.total_tasks ?? 0 }}</span>
              <span class="stat-label-header">总任务</span>
            </div>
            <div class="info-stat-header">
              <span class="stat-value-header">{{ planProgress?.progress_rate ?? selectedPlan.progress ?? 0 }}%</span>
              <span class="stat-label-header">完成率</span>
            </div>
          </div>
        </div>
      </div>
      <!-- 计划完成进度 -->
      <div v-if="planProgress" class="plan-progress-in-header">
        <div class="progress-header-row">
          <span class="progress-label">任务完成</span>
          <span class="progress-text">
            {{ planProgress.completed_tasks ?? 0 }}/{{ planProgress.total_tasks ?? 0 }}
          </span>
        </div>
        <div class="progress-bar-container-header">
          <div 
            class="progress-bar-fill-header" 
            :style="{ width: getPlanProgressPercent() + '%' }"
          ></div>
        </div>
      </div>
      <div class="plan-header-underline"></div>
    </div>

    <!-- 烟花效果 -->
    <div v-if="showFireworks" class="fireworks-container">
      <div class="firework" v-for="n in 20" :key="n" :style="getFireworkStyle(n)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  if (now > end) return '已过期'
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
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
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
  padding: 0 20px 100px 20px; /* 底部 padding 为底部 header 留出空间 */
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0;
}

/* 底部固定计划头部 */
.plan-header-fixed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px 24px;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  position: fixed;
  bottom: 0; /* 固定在底部 */
  left: 0;
  right: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  width: 100%;
  gap: 4px;
  box-sizing: border-box;
  max-height: 40vh;
  overflow-y: auto;
}

.plan-header-inner {
  width: 100%;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 4px;
  padding: 4px 24px;
  min-height: auto;
}

.plan-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
}

/* 计划信息区域 - 一行显示 */
.plan-header-info {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
  position: relative;
  padding: 0 100px;
  box-sizing: border-box;
}

.plan-header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  min-width: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.plan-header-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #1e293b;
  padding: 2px 10px;
  border-radius: 10px;
  border: 1.5px solid rgba(30, 144, 255, 0.3);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.8);
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 300px;
  z-index: 2;
}

.plan-level-badge-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
  flex-shrink: 0;
}

.plan-header-desc {
  color: #1e293b;
  font-size: 0.8rem;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 300px;
  font-weight: 500;
  margin-right: auto;
}

.plan-header-stats {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.info-stat-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  backdrop-filter: blur(10px);
  min-width: 65px;
  box-shadow: 0 2px 6px rgba(30, 144, 255, 0.1);
}

.stat-value-header {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e90ff;
  line-height: 1;
}

.stat-label-header {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 计划完成进度在 header 中的样式 */
.plan-progress-in-header {
  width: 100%;
  max-width: 1600px;
  padding: 4px 24px;
  margin-top: 3px;
}

.progress-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.progress-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

.progress-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e90ff;
}

.progress-bar-container-header {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill-header {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff 0%, #38bdf8 100%);
  border-radius: 10px;
  transition: width 0.5s ease-in-out;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.4);
}

.plan-header-title {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #0ea5e9 0%, #1e90ff 40%, #60a5fa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 24px rgba(30, 144, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.6);
  max-width: 80%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  z-index: 2;
}


.plan-header-underline {
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #1e90ff 40%, #38bdf8 60%, transparent 100%);
  margin-top: 4px;
  border-radius: 2px;
  opacity: 0.6;
  width: 100%;
  max-width: 1600px;
}

.sidebar-placeholder-left { 
  width: 50px; 
  flex-shrink: 0; 
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20px;
  position: sticky;
  top: 20px;
  height: fit-content;
  z-index: 10;
}
.sidebar-placeholder-right { width: 50px; flex-shrink: 0; }

/* 左侧返回按钮样式 */
.back-nav-arrow {
  background: rgba(30, 144, 255, 0.1);
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
  flex-shrink: 0;
  z-index: 10;
  position: relative;
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
.question-left-panel { flex: 1; overflow: visible; padding: 24px; display: flex; flex-direction: column; gap: 24px; background: transparent; /* 透明背景，融入页面背景 */ }
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

/* 时间轴包装器 */
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
  .question-left-panel { padding: 16px; gap: 16px; }
  
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
  
  /* Header响应式 */
  .plan-header-fixed {
    padding: 10px 12px;
    max-height: 50vh;
  }
  
  .plan-header-inner {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .plan-header-info {
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 80px;
  }
  
  .plan-header-title-section {
    position: static;
    transform: none;
    order: 1;
    width: 100%;
    justify-content: center;
  }
  
  .plan-header-title {
    font-size: 1rem;
    max-width: 200px;
    padding: 3px 8px;
  }
  
  .plan-level-badge-header {
    font-size: 0.75rem;
    padding: 3px 8px;
  }
  
  .plan-header-desc {
    font-size: 0.75rem;
    max-width: 100%;
    order: 3;
    width: 100%;
    white-space: normal;
    -webkit-line-clamp: 1;
    margin-right: 0;
  }
  
  .plan-header-stats {
    gap: 8px;
    order: 2;
    margin-left: auto;
    margin-right: auto;
  }
  
  .info-stat-header {
    padding: 4px 8px;
    min-width: 60px;
  }
  
  .stat-value-header {
    font-size: 1rem;
  }
  
  .stat-label-header {
    font-size: 0.7rem;
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

