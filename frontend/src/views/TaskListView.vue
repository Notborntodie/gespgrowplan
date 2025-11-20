<template>
  <div class="exam-layout">
    <!-- 置顶：计划信息 + 返回计划 -->
    <div class="plan-header-fixed">
      <div class="plan-header-inner">
        <div class="plan-header-actions">
          <button class="back-btn" @click="backToPlans">← 返回计划</button>
        </div>
        <h2 class="plan-header-title" v-if="selectedPlan">{{ selectedPlan.name }}</h2>
      </div>
      <div class="plan-header-underline"></div>
    </div>

    <div class="exam-content exam-content-flex-row">
      <div class="sidebar-placeholder-left"></div>
      <div class="question-main">
        <div class="question-card">
          <div class="question-card-header">
            <div class="header-left-section"></div>
            <div class="header-center-section"></div>
            <div class="header-right-section"></div>
          </div>

          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">
              <div v-if="error" class="content-section error-state">
                <div class="section-content">
                  <div class="error-icon">⚠️</div>
                  <h3>连接错误</h3>
                  <p>{{ error }}</p>
                </div>
              </div>

              <div v-else-if="loading" class="content-section loading-state">
                <div class="section-content">
                  <div class="loading-icon">⏳</div>
                  <h3>加载中...</h3>
                  <p>正在获取任务数据</p>
                </div>
              </div>

              <div v-else class="tasks-list-view">
                <!-- 计划完成提示 -->
                <div v-if="isPlanCompleted()" class="content-section completion-banner">
                  <div class="section-content">
                    <div class="completion-message">
                      <span class="completion-icon">🎉</span>
                      <h3>恭喜🎉，计划已经完成！</h3>
                      <p v-if="planProgress?.completed_at" class="completion-time">
                        完成时间: {{ formatDateTime(planProgress.completed_at) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 计划进度信息 -->
                <div v-if="planProgress" class="content-section plan-progress-card">
                  <div class="section-header">
                    <h4 class="section-title">📊 计划完成进度</h4>
                  </div>
                  <div class="section-content">
                    <div class="progress-stats">
                      <div class="progress-stat-item">
                        <div class="progress-header">
                          <span class="progress-label">任务完成</span>
                          <span class="progress-text">
                            {{ planProgress.completed_tasks ?? 0 }}/{{ planProgress.total_tasks ?? 0 }}
                          </span>
                        </div>
                        <div class="progress-bar-container">
                          <div 
                            class="progress-bar-fill" 
                            :style="{ width: getPlanProgressPercent() + '%' }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="tasks-grid">
                    <div
                      v-for="(task, index) in selectedPlan?.tasks || []"
                      :key="task.id"
                      class="task-card"
                      :class="{ completed: task.is_completed, active: isTaskActive(task) }"
                      @click="enterTask(task)"
                    >
                      <!-- task-card 头部：状态与序号 -->
                      <div class="task-card-header">
                        <span class="task-status-badge" :class="getTaskStatusClass(task)">
                          {{ getTaskStatusText(task) }}
                        </span>
                        <span class="task-level-badge">{{ index + 1 }}</span>
                      </div>
                      <!-- 内容body -->
                      <div class="task-card-body">
                        <h3 class="task-title">{{ task.name }}</h3>
                        <p class="task-desc">{{ task.description }}</p>
                        <div class="task-time">
                          <i class="fas fa-clock"></i>
                          {{ formatDateTime(task.start_time) }} - {{ formatDateTime(task.end_time) }}
                        </div>
                        <div class="task-meta">
                          <span class="exercise-stat"><i class="fas fa-file-alt"></i> 客观题: {{ task.exam_count || 0 }}套</span>
                          <span class="exercise-stat"><i class="fas fa-code"></i> OJ题: {{ task.oj_count || 0 }}道</span>
                        </div>
                      </div>
                      <!-- 底部操作区 -->
                      <div class="task-card-footer">
                        <button class="enter-task-btn" @click.stop="enterTask(task)" :disabled="!isTaskActive(task)">
                          <span>👀</span> 查看详情 <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="content-section plan-info-card" v-if="selectedPlan">
                  <div class="section-content">
                    <div class="plan-info-header">
                      <h2>{{ selectedPlan.name }}</h2>
                      <div class="plan-level-badge-large">GESP {{ selectedPlan.level }}级</div>
                    </div>
                    <p class="plan-info-desc">{{ selectedPlan.description }}</p>
                    <div class="plan-info-stats">
                      <div class="info-stat">
                        <span class="stat-value">{{ planProgress?.completed_tasks ?? selectedPlan.completed_tasks ?? 0 }}</span>
                        <span class="stat-label">已完成</span>
                      </div>
                      <div class="info-stat">
                        <span class="stat-value">{{ planProgress?.total_tasks ?? selectedPlan.total_tasks ?? 0 }}</span>
                        <span class="stat-label">总任务</span>
                      </div>
                      <div class="info-stat">
                        <span class="stat-value">{{ planProgress?.progress_rate ?? selectedPlan.progress ?? 0 }}%</span>
                        <span class="stat-label">完成率</span>
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

    <!-- 烟花效果 -->
    <div v-if="showFireworks" class="fireworks-container">
      <div class="firework" v-for="n in 20" :key="n" :style="getFireworkStyle(n)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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
  // 3秒后自动关闭烟花效果
  setTimeout(() => {
    showFireworks.value = false
  }, 3000)
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
  padding: 0 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0;
}

/* 置顶计划头部 */
.plan-header-fixed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 24px;
  border-bottom: 2px solid #e2e8f0;
  position: fixed;
  top: 48px; /* NavBar 高度 */
  left: 0;
  right: 0;
  z-index: 999;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  width: 100%;
  gap: 2px;
  box-sizing: border-box;
}

.plan-header-inner {
  width: 100%;
  max-width: 1600px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  gap: 16px;
  min-height: 54px; /* 足够容纳按钮和较大标题 */
}

.plan-header-title {
  position: absolute;
  left: 0; right: 0;
  margin: 0 auto;
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
  max-width: 65%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.plan-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: static;
  margin-right: 12px;
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

.sidebar-placeholder-left, .sidebar-placeholder-right { width: 50px; flex-shrink: 0; }
.question-main { flex: 1; max-width: 1600px; min-width: 0; }
.question-card { 
  background: #f8fafc; 
  border: 1.5px solid #e2e8f0; 
  border-radius: 18px; 
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1); 
  transition: all 0.3s ease; 
  padding: 0; 
  overflow: hidden; 
  width: 100%; 
  height: calc(100vh - 84px); 
  display: flex; 
  flex-direction: column; 
  margin: 64px auto 0 auto; 
  box-sizing: border-box; 
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
.question-content-unified { flex: 1; display: flex; flex-direction: row; overflow: hidden; background: #f8fafc; }
.question-left-panel { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
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
.error-icon { font-size: 5rem; margin-bottom: 20px; }
.error-state h3 { color: #dc2626; font-size: 1.5rem; margin: 0 0 10px 0; }
.error-state p { color: #991b1b; font-size: 1.1rem; margin-bottom: 20px; }
.retry-btn { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
.retry-btn:hover { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
.loading-state { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; }
.loading-icon { font-size: 5rem; margin-bottom: 20px; animation: spin 2s linear infinite; }
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
.plan-info-card { margin-bottom: 24px; }
.plan-info-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.plan-info-header h2 { color: #1e293b; font-size: 1.8rem; margin: 0; font-weight: 700; }
.plan-level-badge-large { background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); color: white; padding: 10px 20px; border-radius: 16px; font-size: 1rem; font-weight: 700; }
.plan-info-desc { color: #64748b; font-size: 1rem; margin: 0 0 20px 0; line-height: 1.6; }
.plan-info-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
.info-stat { text-align: center; padding: 16px; background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%); border-radius: 12px; border: 1px solid #bae6fd; }
.stat-value { display: block; font-size: 2rem; font-weight: 800; color: #1e90ff; margin-bottom: 4px; }
.stat-label { color: #64748b; font-size: 0.9rem; font-weight: 500; }

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
  font-size: 4rem;
  display: block;
  margin-bottom: 12px;
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

/* 卡片栅格布局 */
.tasks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 32px; }
/* 计划卡同风格的任务卡片样式 */
.task-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 3px solid #e0f2fe;
  border-radius: 24px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 24px rgba(30, 144, 255, 0.12);
  overflow: hidden;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}
.task-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(30, 144, 255, 0.25);
  border-color: #1e90ff;
}
.task-card.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}
.task-card.active {
  border-color: #38bdf8;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.task-card-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 20px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-status-badge {
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
}
.status-completed {
  background: #d1fae5;
  color: #059669;
}
.status-active {
  background: #d1fae5;
  color: #059669;
}
.status-upcoming {
  background: #fef3c7;
  color: #d97706;
}
.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}
.task-level-badge {
  background: #1e90ff;
  color: white;
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
}
.task-card-body {
  padding: 28px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-title {
  color: #1e293b;
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  font-weight: 700;
}
.task-desc {
  color: #64748b;
  font-size: 1.05rem;
  margin: 0 0 16px 0;
  line-height: 1.6;
}
.task-time {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 10px;
}
.task-meta {
  display: flex;
  gap: 16px;
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 8px;
}
.exercise-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.task-card-footer {
  padding: 20px 28px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.enter-task-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}
.enter-task-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.enter-task-btn:hover:not([disabled]) {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.35);
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
  .tasks-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .exam-content-flex-row { 
    flex-direction: column; 
    gap: 16px; 
    padding: 0 16px; 
  }
  .sidebar-placeholder-left, .sidebar-placeholder-right { display: none; }
  .question-main { max-width: 100%; }
  .question-card { 
    height: auto; 
    min-height: calc(100vh - 20px); 
  }
  .question-left-panel { padding: 16px; gap: 16px; }
  .task-item { 
    flex-direction: column; 
    gap: 16px; 
  }
  .task-number { 
    width: 36px; 
    height: 36px; 
    font-size: 1rem; 
  }
  .task-exercises-stats { 
    flex-direction: column; 
    gap: 8px; 
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
  animation: firework-explode 2s ease-out forwards;
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

