<template>
  <div class="exam-layout">
    <!-- 置顶：我的学习计划 + 加入计划（仅在计划列表视图展示） -->
    <div v-if="currentView === 'plans'" class="plan-header-fixed">
      <div class="plan-header-inner">
        <h2 class="plan-header-title">我的学习计划</h2>
        <div class="plan-header-actions">
          <button class="join-plan-btn-premium" @click="showJoinDialog = true">
            <i class="fas fa-plus"></i> 加入计划
          </button>
        </div>
      </div>
      <div class="plan-header-underline"></div>
    </div>
    <div class="exam-content exam-content-flex-row">
      <!-- 左侧占位区域 -->
      <div class="sidebar-placeholder-left"></div>

      <!-- 主体：计划内容 -->
      <div class="question-main">
        <div class="question-card">
          <div class="question-card-header">
            <div class="header-left-section">
              <button v-if="currentView === 'tasks'" class="back-btn-header" @click="backToPlans">
                &lt;- 返回计划
              </button>
              <button v-if="currentView === 'exercises'" class="back-btn-header" @click="backToTasks">
                &lt;- 返回任务
              </button>
            </div>
            <div class="header-center-section">
              <span v-if="currentView !== 'plans'" class="number-badge">
                {{ currentView === 'tasks' ? '学习任务' : '练习详情' }}
              </span>
            </div>
            <div class="header-right-section">
              <span class="level-badge" v-if="selectedLevel">GESP {{ selectedLevel }}级</span>
            </div>
          </div>

          <!-- 统一的内容滚动区域 -->
          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">
              
              <!-- 视图1: 我的学习计划列表 -->
              <div v-if="currentView === 'plans'" class="plans-list-view">
                <!-- 错误状态 -->
                <div v-if="error" class="content-section error-state">
                  <div class="section-content">
                    <div class="error-icon">⚠️</div>
                    <h3>连接错误</h3>
                    <p>{{ error }}</p>
                    <button @click="fetchMyPlans" class="retry-btn">
                      <i class="fas fa-refresh"></i> 重试
                    </button>
                </div>
                </div>
                
                <!-- 加载状态 -->
                <div v-else-if="loading" class="content-section loading-state">
                <div class="section-content">
                    <div class="loading-icon">⏳</div>
                    <h3>加载中...</h3>
                    <p>正在获取学习计划数据</p>
                  </div>
                  </div>
                  
                <!-- 如果没有加入任何计划 -->
                <div v-else-if="myPlans.length === 0" class="content-section empty-state">
                <div class="section-content">
                    <div class="empty-icon">📚</div>
                    <h3>暂无学习计划</h3>
                    <p>点击右上角"加入计划"按钮开始你的学习之旅</p>
                  </div>
                  </div>
                  
                <!-- 我的计划列表 -->
                <div v-else class="my-plans-grid">
                    <div 
                    v-for="plan in myPlans" 
                      :key="plan.id"
                    class="plan-card"
                    @click="enterPlan(plan)"
                  >
                    <div class="plan-card-header">
                      <div class="plan-level-badge">GESP {{ plan.level }}级</div>
                      <div class="plan-testing-badge">处于测试中</div>
                      <div class="plan-status-badge" :class="getPlanStatusClass(plan)">
                        {{ getPlanStatusText(plan) }}
                      </div>
                    </div>
                    <div class="plan-card-body">
                      <h3>{{ plan.name }}</h3>
                      <p class="plan-desc">{{ plan.description }}</p>
                      <div class="plan-time">
                        <i class="fas fa-calendar-alt"></i>
                        {{ formatDate(plan.start_time) }} - {{ formatDate(plan.end_time) }}
                      </div>
                      <div class="plan-progress">
                        <div class="progress-bar-container">
                          <div class="progress-bar-fill" :style="{ width: plan.progress + '%' }"></div>
                    </div>
                        <div class="progress-text">
                          完成进度: {{ plan.completed_tasks }}/{{ plan.total_tasks }} ({{ plan.progress }}%)
                  </div>
                      </div>
                    </div>
                    <div class="plan-card-footer">
                      <button class="enter-plan-btn">
                        <span>👀</span> 查看任务 <span>→</span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              <!-- 视图2: 计划的任务列表 -->
              <div v-else-if="currentView === 'tasks'" class="tasks-list-view">
                <!-- 任务列表 -->
                <div class="content-section tasks-section">
                  <div class="section-header">
                    <h4 class="section-title">📋 学习任务列表</h4>
                  </div>
                  <div class="section-content">
                    <div class="tasks-list">
                      <div 
                        v-for="(task, index) in selectedPlan.tasks" 
                        :key="task.id"
                        class="task-item"
                        :class="{ completed: task.is_completed, active: isTaskActive(task) }"
                      >
                        <div class="task-number">{{ index + 1 }}</div>
                        <div class="task-main-content">
                          <div class="task-header-row">
                            <h4>{{ task.name }}</h4>
                            <div class="task-status-badge" :class="getTaskStatusClass(task)">
                              {{ getTaskStatusText(task) }}
                        </div>
                        </div>
                          <p class="task-desc">{{ task.description }}</p>
                          
                          <!-- 复习内容 -->
                          <div v-if="task.review_content" class="task-review">
                            <div class="review-label">
                              <i class="fas fa-book"></i> 复习内容
                        </div>
                            <div class="review-content">{{ task.review_content }}</div>
                            <div v-if="task.review_video_url" class="review-video">
                              <a :href="task.review_video_url" target="_blank" class="video-link">
                                <span>▶️</span> 观看复习视频
                              </a>
                      </div>
                    </div>

                          <div class="task-time">
                            <i class="fas fa-clock"></i>
                            {{ formatDateTime(task.start_time) }} - {{ formatDateTime(task.end_time) }}
                </div>

                          <!-- 练习统计 -->
                          <div class="task-exercises-stats">
                            <div class="exercise-stat">
                              <i class="fas fa-file-alt"></i>
                              客观题: {{ task.exam_count || 0 }}套
                  </div>
                            <div class="exercise-stat">
                              <i class="fas fa-code"></i>
                              OJ题: {{ task.oj_count || 0 }}道
                        </div>
                        </div>

                        <div class="task-actions">
                          <button 
                              class="task-action-btn start-btn" 
                              @click.stop="enterTask(task)"
                              :disabled="!isTaskActive(task)"
                            >
                              <span>▶️</span> 开始任务
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 计划信息卡片 -->
                <div class="content-section plan-info-card">
                  <div class="section-content">
                    <div class="plan-info-header">
                      <h2>{{ selectedPlan.name }}</h2>
                      <div class="plan-level-badge-large">GESP {{ selectedPlan.level }}级</div>
                  </div>
                    <p class="plan-info-desc">{{ selectedPlan.description }}</p>
                    <div class="plan-info-stats">
                      <div class="info-stat">
                        <span class="stat-value">{{ selectedPlan.completed_tasks }}</span>
                        <span class="stat-label">已完成</span>
                        </div>
                      <div class="info-stat">
                        <span class="stat-value">{{ selectedPlan.total_tasks }}</span>
                        <span class="stat-label">总任务</span>
                        </div>
                      <div class="info-stat">
                        <span class="stat-value">{{ selectedPlan.progress }}%</span>
                        <span class="stat-label">完成率</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

              <!-- 视图3: 任务的练习列表 -->
              <div v-else-if="currentView === 'exercises'" class="exercises-list-view">
                <!-- 任务信息卡片 -->
                <div class="content-section task-info-card">
                  <div class="section-content">
                    <h2>{{ selectedTask.name }}</h2>
                    <p class="task-info-desc">{{ selectedTask.description }}</p>
                    
                    <!-- 复习内容展示 -->
                    <div v-if="selectedTask.review_content" class="review-section">
                      <h4><i class="fas fa-book"></i> 复习内容</h4>
                      <div class="review-content-box">{{ selectedTask.review_content }}</div>
                      <a v-if="selectedTask.review_video_url" :href="selectedTask.review_video_url" target="_blank" class="video-link-large">
                        <span>▶️</span> 观看复习视频
                      </a>
                      </div>
                          </div>
                </div>

                <!-- 客观题练习列表 -->
                <div v-if="selectedTask.exams && selectedTask.exams.length > 0" class="content-section">
                  <div class="section-header">
                    <h4 class="section-title">📝 客观题练习</h4>
                  </div>
                  <div class="section-content">
                    <div class="exercises-grid">
                      <div 
                        v-for="exam in selectedTask.exams" 
                        :key="exam.id"
                        class="exercise-card"
                        @click="startExam(exam)"
                      >
                        <div class="exercise-icon">📝</div>
                        <h4>{{ exam.name }}</h4>
                        <p class="exercise-desc">{{ exam.description }}</p>
                        <div class="exercise-info">
                            </div>
                        <div class="exercise-status" :class="getExerciseStatusClass(exam)">
                          {{ getExerciseStatusText(exam) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- OJ题目列表 -->
                <div v-if="selectedTask.oj_problems && selectedTask.oj_problems.length > 0" class="content-section">
                  <div class="section-header">
                    <h4 class="section-title">💻 OJ编程题</h4>
                  </div>
                  <div class="section-content">
                    <div class="exercises-grid">
                      <div 
                        v-for="problem in selectedTask.oj_problems" 
                        :key="problem.id"
                        class="exercise-card"
                        @click="startOJ(problem)"
                      >
                        <div class="exercise-icon">💻</div>
                        <h4>{{ problem.title }}</h4>
                        <div class="exercise-info">
                          <span class="difficulty-badge" :class="'difficulty-' + problem.difficulty">
                            {{ getDifficultyText(problem.difficulty) }}
                          </span>
                    </div>
                        <div class="exercise-status" :class="getExerciseStatusClass(problem)">
                          {{ getExerciseStatusText(problem) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

              <!-- 学习总结（费恩曼学习法）入口 -->
              <div class="content-section" v-if="currentView === 'exercises'">
                <div class="section-header">
                  <h4 class="section-title">🎥 学习总结（费恩曼学习法）</h4>
                </div>
                <div class="section-content">
                  <p class="feynman-intro">使用费恩曼学习法录制你的任务总结，巩固理解、发现盲点、提升表达能力。</p>
                  <button class="enter-plan-btn" @click="goFeynmanSummary">
                    进入学习总结页面 <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
        </div>

            </div>
          </div>
        </div>
      </div>

      <!-- 右侧占位区域 -->
      <div class="sidebar-placeholder-right"></div>
            </div>

    <!-- 加入计划弹窗 -->
    <div v-if="showJoinDialog" class="modal-overlay" @click="showJoinDialog = false">
      <div class="modal-content join-plan-modal" @click.stop>
        <div class="modal-header">
          <h3>加入学习计划</h3>
          <button class="modal-close-btn" @click="showJoinDialog = false">
            <i class="fas fa-times"></i>
          </button>
          </div>
        <div class="modal-body">
          <!-- 级别选择 -->
          <div class="level-selector">
            <div class="level-label">选择GESP级别:</div>
            <div class="level-buttons">
              <button 
                v-for="level in [1, 2, 3, 4]" 
                :key="level"
                class="level-btn"
                :class="{ active: joinDialogLevel === level }"
                @click="joinDialogLevel = level"
              >
                {{ level }}级
              </button>
        </div>
      </div>

          <!-- 可用计划列表 -->
          <div class="available-plans">
            <div 
              v-for="plan in allAvailablePlans" 
              :key="plan.id"
              class="plan-option"
              :class="{ selected: selectedJoinPlan?.id === plan.id }"
              @click="selectedJoinPlan = plan"
            >
              <div class="plan-option-header">
                <h4>{{ plan.name }}</h4>
                <div class="plan-level-tag">{{ plan.level }}级</div>
              </div>
              <p>{{ plan.description }}</p>
              <div class="plan-meta">
                <span><i class="fas fa-calendar-alt"></i> {{ formatDate(plan.start_time) }} - {{ formatDate(plan.end_time) }}</span>
                <span><i class="fas fa-tasks"></i> {{ plan.total_tasks }}个任务</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showJoinDialog = false">取消</button>
          <button 
            class="btn-confirm" 
            :disabled="!selectedJoinPlan"
            @click="confirmJoinPlan"
          >
            加入计划
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

import { BASE_URL } from '@/config/api'

// 当前视图: 'plans' | 'tasks' | 'exercises'
const currentView = ref('plans')
const selectedLevel = ref<number | null>(null)
const selectedPlan = ref<any>(null)
const selectedTask = ref<any>(null)

// 加入计划弹窗
const showJoinDialog = ref(false)
const joinDialogLevel = ref(1)
const selectedJoinPlan = ref<any>(null)

// 加载状态
const loading = ref(false)
const error = ref<string | null>(null)

// 用户信息
const userInfo = ref<any>(null)

// 我的学习计划列表
const myPlans = ref<any[]>([])

// 所有可用计划（用于加入计划弹窗）
const allAvailablePlans = ref<any[]>([])

// API调用方法
const fetchMyPlans = async () => {
  if (!userInfo.value?.id) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/my-plans?user_id=${userInfo.value.id}`)
    if (!response.ok) {
      throw new Error(`获取我的计划失败: ${response.status}`)
    }
    const result = await response.json()
    if (result.success) {
      myPlans.value = result.data || []
    } else {
      throw new Error(result.message || '获取我的计划失败')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取我的计划失败'
    console.error('获取我的计划失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchAvailablePlans = async (level: number) => {
  if (!userInfo.value?.id) return []
  
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/available?user_id=${userInfo.value.id}&level=${level}`)
    if (!response.ok) {
      throw new Error(`获取可用计划失败: ${response.status}`)
    }
    const result = await response.json()
    if (result.success) {
      return result.data || []
    } else {
      throw new Error(result.message || '获取可用计划失败')
    }
  } catch (err) {
    console.error('获取可用计划失败:', err)
    return []
  }
}

const joinPlan = async (planId: number) => {
  if (!userInfo.value?.id) return false
  
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userInfo.value.id,
        plan_id: planId
      })
    })
    
    if (!response.ok) {
      throw new Error(`加入计划失败: ${response.status}`)
    }
    
    const result = await response.json()
    if (result.success) {
      return true
    } else {
      throw new Error(result.message || '加入计划失败')
    }
  } catch (err) {
    console.error('加入计划失败:', err)
    error.value = err instanceof Error ? err.message : '加入计划失败'
    return false
  }
}

const fetchPlanTasks = async (planId: number) => {
  if (!userInfo.value?.id) return null
  
  try {
    const response = await fetch(`${BASE_URL}/learning-plans/${planId}/tasks?user_id=${userInfo.value.id}`)
    if (!response.ok) {
      throw new Error(`获取计划任务失败: ${response.status}`)
    }
    const result = await response.json()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || '获取计划任务失败')
    }
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
    if (!response.ok) {
      throw new Error(`获取计划进度失败: ${response.status}`)
    }
    const result = await response.json()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || '获取计划进度失败')
    }
  } catch (err) {
    console.error('获取计划进度失败:', err)
    return null
  }
}

const fetchTaskExercises = async (taskId: number) => {
  if (!userInfo.value?.id) return null
  
  try {
    const response = await fetch(`${BASE_URL}/learning-tasks/${taskId}/exercises?user_id=${userInfo.value.id}`)
    if (!response.ok) {
      throw new Error(`获取任务练习失败: ${response.status}`)
    }
    const result = await response.json()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || '获取任务练习失败')
    }
  } catch (err) {
    console.error('获取任务练习失败:', err)
    error.value = err instanceof Error ? err.message : '获取任务练习失败'
    return null
  }
}

const completeTask = async (taskId: number) => {
  if (!userInfo.value?.id) return false
  
  try {
    const response = await fetch(`${BASE_URL}/learning-tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userInfo.value.id
      })
    })
    
    if (!response.ok) {
      throw new Error(`标记任务完成失败: ${response.status}`)
    }
    
    const result = await response.json()
    if (result.success) {
      return true
    } else {
      throw new Error(result.message || '标记任务完成失败')
    }
  } catch (err) {
    console.error('标记任务完成失败:', err)
    error.value = err instanceof Error ? err.message : '标记任务完成失败'
    return false
  }
}

// 工具方法
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPlanStatusClass = (plan: any) => {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return 'status-upcoming'
  if (now > end) return 'status-ended'
  return 'status-active'
}

const getPlanStatusText = (plan: any) => {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return '未开始'
  if (now > end) return '已结束'
  return '进行中'
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

const isTaskActive = (task: any) => {
  if (task.is_completed) return true
  
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  
  return now >= start && now <= end
}

const getExerciseStatusClass = (exercise: any) => {
  return exercise.is_completed === true || exercise.is_completed === 1 || exercise.is_completed === '1' ? 'status-completed' : 'status-pending'
}

const getExerciseStatusText = (exercise: any) => {
  return exercise.is_completed === true || exercise.is_completed === 1 || exercise.is_completed === '1' ? '已完成' : '未完成'
}

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || difficulty
}

// 跳转到学习总结页面
const goFeynmanSummary = () => {
  const plan = selectedPlan.value?.id
  const task = selectedTask.value?.id
  const level = selectedPlan.value?.level
  const url = `/feynman-summary?planId=${plan ?? ''}&taskId=${task ?? ''}&level=${level ?? ''}`
  router.push(url)
}

// 进入计划查看任务
const enterPlan = async (plan: any) => {
  // 跳转到任务列表页面
  router.push(`/plan/${plan.id}/tasks`)
}

// 返回计划列表
const backToPlans = () => {
  currentView.value = 'plans'
  selectedPlan.value = null
  selectedLevel.value = null
}

// 进入任务查看练习
const enterTask = async (task: any) => {
  selectedTask.value = task
  currentView.value = 'exercises'
  
  // 获取任务的练习列表
  const taskData = await fetchTaskExercises(task.id)
  if (taskData) {
    selectedTask.value = {
      ...task,
      ...taskData.task,
      exams: taskData.exams || [],
      oj_problems: taskData.oj_problems || []
    }
  }
}

// 返回任务列表
const backToTasks = () => {
  currentView.value = 'tasks'
  selectedTask.value = null
}

// 开始客观题练习
const startExam = (exam: any) => {
  console.log('开始客观题练习:', exam)
  // 跳转到GESPEaxmView，传递exam_id参数和来源信息
  router.push(`/exam/${exam.id}?from=plan&planId=${selectedPlan.value?.id}&taskId=${selectedTask.value?.id}`)
}

// 开始OJ题
const startOJ = (problem: any) => {
  console.log('开始OJ题:', problem)
  // 跳转到SmartOJView，传递problem_id参数和来源信息
  router.push(`/smartoj/${problem.id}?from=plan&planId=${selectedPlan.value?.id}&taskId=${selectedTask.value?.id}`)
}

// 获取指定级别的可用计划
const getAvailablePlans = async (level: number) => {
  const plans = await fetchAvailablePlans(level)
  return plans
}

// 确认加入计划
const confirmJoinPlan = async () => {
  if (selectedJoinPlan.value) {
    const success = await joinPlan(selectedJoinPlan.value.id)
    if (success) {
      // 重新获取我的计划列表
      await fetchMyPlans()
      showJoinDialog.value = false
      selectedJoinPlan.value = null
    }
  }
}

// 监听级别变化，获取可用计划
watch(joinDialogLevel, async (newLevel) => {
  if (showJoinDialog.value) {
    allAvailablePlans.value = await getAvailablePlans(newLevel)
  }
})

// 监听弹窗显示，获取可用计划
watch(showJoinDialog, async (show) => {
  if (show) {
    allAvailablePlans.value = await getAvailablePlans(joinDialogLevel.value)
  }
})

// 测试API连接
const testAPIConnection = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${BASE_URL}/health`, { 
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (err) {
    console.error('API连接测试失败:', err)
    return false
  }
}

// 组件挂载
onMounted(async () => {
  // 获取用户信息
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
    
    // 测试API连接
    const isConnected = await testAPIConnection()
    if (!isConnected) {
      error.value = '无法连接到服务器，请检查网络连接或联系管理员'
      return
    }
    
    // 加载我的学习计划
    await fetchMyPlans()
  } else {
    error.value = '请先登录'
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
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  width: 100%;
  gap: 2px;
  box-sizing: border-box;
}

.plan-header-inner {
  width: 100%;
  max-width: 1600px;
  display: flex;
  align-items: center;
  justify-content: center; /* 标题居中 */
  position: relative; /* 让右侧动作绝对定位 */
}

.plan-header-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #0ea5e9 0%, #1e90ff 40%, #60a5fa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent; /* 渐变文字 */
  padding: 4px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 24px rgba(30, 144, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.6);
}

.plan-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  right: 0;
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

/* 高质感加入计划按钮 */
.join-plan-btn-premium {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 50%, #60a5fa 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.45);
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 0.98rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 22px rgba(30, 144, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.65);
}

.join-plan-btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(30, 144, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.8);
}

.join-plan-btn-premium:active {
  transform: translateY(0);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.28), inset 0 0 0 rgba(255,255,255,0.8);
}

.sidebar-placeholder-left {
  width: 50px;
  flex-shrink: 0;
}

.sidebar-placeholder-right {
  width: 50px;
  flex-shrink: 0;
}

.question-main {
  flex: 1;
  max-width: 1600px;
  min-width: 0;
}

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

.header-left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.header-center-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.header-right-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
  justify-content: flex-end;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 1.1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.level-badge {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 8px 14px;
  border-radius: 18px;
  font-weight: 600;
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.join-plan-btn-header,
.back-btn-header {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
}

.join-plan-btn-header:hover,
.back-btn-header:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.question-content-unified {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background: #f8fafc;
}

.question-left-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-left-panel-centered {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

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

.section-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 18px 24px;
  border-bottom: 2px solid #e0f2fe;
  border-radius: 18px 18px 0 0;
  position: relative;
}

.section-title {
  margin: 0;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-content {
  padding: 24px;
  background: transparent;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #1e293b;
  font-size: 1.5rem;
  margin: 0 0 10px 0;
}

.empty-state p {
  color: #64748b;
  font-size: 1.1rem;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fecaca;
}

.error-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.error-state h3 {
  color: #dc2626;
  font-size: 1.5rem;
  margin: 0 0 10px 0;
}

.error-state p {
  color: #991b1b;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.retry-btn {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.retry-btn:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
}

.loading-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state h3 {
  color: #1e90ff;
  font-size: 1.5rem;
  margin: 0 0 10px 0;
}

.loading-state p {
  color: #0369a1;
  font-size: 1.1rem;
}

/* 我的计划列表 */
.my-plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 32px;
}

.plan-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 3px solid #e0f2fe;
  border-radius: 24px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 24px rgba(30, 144, 255, 0.12);
  overflow: hidden;
  min-height: 320px;
}

.plan-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(30, 144, 255, 0.25);
  border-color: #1e90ff;
}

.plan-card-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 20px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-level-badge {
  background: #1e90ff;
  color: white;
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
}

.plan-testing-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.plan-status-badge {
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
}

.status-active {
  background: #d1fae5;
  color: #059669;
}

.status-upcoming {
  background: #fef3c7;
  color: #d97706;
}

.status-ended {
  background: #fee2e2;
  color: #dc2626;
}

.plan-card-body {
  padding: 28px;
}

.plan-card-body h3 {
  color: #1e293b;
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.plan-desc {
  color: #64748b;
  font-size: 1.05rem;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.plan-time {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 20px;
}

.plan-progress {
  margin-top: 20px;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff 0%, #38bdf8 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
}

.plan-card-footer {
  padding: 20px 28px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.enter-plan-btn {
  width: 100%;
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
  justify-content: center;
  gap: 10px;
}

.enter-plan-btn:hover {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.35);
}

/* 计划信息卡片 */
.plan-info-card {
  margin-bottom: 24px;
}

.plan-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.plan-info-header h2 {
  color: #1e293b;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
}

.plan-level-badge-large {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
}

.plan-info-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.plan-info-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.info-stat {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: #1e90ff;
  margin-bottom: 4px;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-item {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #1e90ff;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15);
}

.task-item.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.task-item.active {
  border-color: #38bdf8;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.task-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.task-main-content {
  flex: 1;
}

.task-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-main-content h4 {
  color: #1e293b;
  font-size: 1.2rem;
  margin: 0;
  font-weight: 700;
}

.task-status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}

.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}

.task-desc {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.task-review {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #fcd34d;
  margin-bottom: 16px;
}

.review-label {
  color: #92400e;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-content {
  color: #78350f;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 8px;
}

.video-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1e90ff;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.video-link:hover {
  color: #0c7cd5;
  transform: translateX(4px);
}

.task-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.task-exercises-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.exercise-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 12px;
}

.task-action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.start-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 任务信息卡片 */
.task-info-card {
  margin-bottom: 24px;
}

.task-info-card h2 {
  color: #1e293b;
  font-size: 1.6rem;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.task-info-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.review-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #fbbf24;
  margin-top: 20px;
}

.review-section h4 {
  color: #78350f;
  font-size: 1.1rem;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-content-box {
  background: rgba(255, 255, 255, 0.5);
  padding: 16px;
  border-radius: 8px;
  color: #78350f;
  line-height: 1.6;
  margin-bottom: 12px;
}

.video-link-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1e90ff;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.video-link-large:hover {
  background: #0c7cd5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

/* 练习网格 */
.exercises-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.exercise-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.exercise-card:hover {
  border-color: #1e90ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.2);
}

.exercise-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.exercise-card h4 {
  color: #1e293b;
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.exercise-desc {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.exercise-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: #64748b;
}

.difficulty-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.difficulty-easy {
  background: #d1fae5;
  color: #059669;
}

.difficulty-medium {
  background: #fed7aa;
  color: #d97706;
}

.difficulty-hard {
  background: #fecaca;
  color: #dc2626;
}

.exercise-status {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pending {
  background: #fee2e2;
  color: #dc2626;
}

/* 加入计划弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e0f2fe;
}

.modal-header h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 18px;
  backdrop-filter: blur(10px);
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.level-selector {
  margin-bottom: 24px;
}

.level-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.level-buttons {
  display: flex;
  gap: 12px;
}

.level-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-btn:hover {
  border-color: #1e90ff;
  color: #1e90ff;
}

.level-btn.active {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-color: #1e90ff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.available-plans {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.plan-option {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.plan-option:hover {
  border-color: #1e90ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 144, 255, 0.15);
}

.plan-option.selected {
  border-color: #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  box-shadow: 0 8px 20px rgba(30, 144, 255, 0.2);
}

.plan-option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plan-option h4 {
  color: #1e293b;
  font-size: 1.2rem;
  margin: 0;
  font-weight: 700;
}

.plan-level-tag {
  background: #1e90ff;
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.plan-option p {
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.5;
  font-size: 0.9rem;
}

.plan-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #64748b;
}

.plan-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 学习总结（费恩曼学习法）样式 */
.feynman-recorder .feynman-intro {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 16px;
}

.recorder-panel {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.recorder-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 2px solid #bae6fd;
  background: white;
  color: #1e90ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.rec-btn.start { border-color: #86efac; color: #16a34a; }
.rec-btn.stop { border-color: #fecaca; color: #dc2626; }
.rec-btn.download { border-color: #bae6fd; color: #1e90ff; }
.rec-btn.danger { border-color: #fecaca; color: #dc2626; }

.rec-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(30,144,255,0.15); }
.rec-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.record-timer {
  margin-left: auto;
  font-weight: 700;
  color: #64748b;
}
.record-timer.active { color: #dc2626; }

.recorder-preview { margin-top: 8px; }
.preview-video { width: 100%; max-height: 360px; border-radius: 10px; border: 2px solid #e2e8f0; background: #000; }
.preview-actions { margin-top: 10px; display: flex; gap: 10px; }

.recorder-permission-tip { color: #dc2626; font-weight: 600; margin-top: 10px; }

/* 响应式设计 */
@media (max-width: 768px) {
  .exam-content-flex-row {
    flex-direction: column;
    gap: 16px;
    padding: 0 16px;
  }
  
  .sidebar-placeholder-left,
  .sidebar-placeholder-right {
    display: none;
  }
  
  .question-main {
    max-width: 100%;
  }
  
  .question-card {
    height: auto;
    min-height: calc(100vh - 20px);
  }
  
  .question-left-panel {
    padding: 16px;
    gap: 16px;
  }
  
  .my-plans-grid {
    grid-template-columns: 1fr;
  }
  
  .exercises-grid {
    grid-template-columns: 1fr;
  }
  
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
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 20px 24px;
  }
  
  .modal-header h3 {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 20px 24px;
  }
  
  .level-buttons {
    flex-wrap: wrap;
  }
  
  .level-btn {
    flex: 1 1 calc(50% - 6px);
  }
}

@media (max-width: 480px) {
  .question-card-header {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .join-plan-btn-header,
  .back-btn-header {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
  
  .number-badge {
    font-size: 0.95rem;
    padding: 8px 16px;
  }
  
  .plan-card-body h3 {
    font-size: 1.1rem;
  }
  
  .task-item {
    padding: 16px;
  }
  
  .task-main-content h4 {
    font-size: 1.1rem;
  }
  
  .modal-footer {
    padding: 16px 20px;
  }
}
</style>
