<template>
    <div class="exam-layout">
      <!-- 置顶：任务信息 + 返回任务 -->
      <div class="plan-header-fixed">
        <div class="plan-header-inner">
          <div class="plan-header-actions">
            <button class="back-btn" @click="backToTasks">← 返回任务</button>
          </div>
          <h2 class="plan-header-title" v-if="selectedTask">{{ selectedTask.name }}</h2>
        </div>
        <div class="plan-header-underline"></div>
      </div>

      <div class="exam-content exam-content-flex-row">
        <div class="sidebar-placeholder-left"></div>
        <div class="question-main">
          <div class="question-card">
            <div class="question-card-header">
              <div class="header-left-section"></div>
              <div class="header-center-section">
              </div>
              <div class="header-right-section">
                <span class="level-badge" v-if="selectedLevel">GESP {{ selectedLevel }}级</span>
              </div>
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
                  <p>正在获取任务详情</p>
                    </div>
                    </div>
                    
              <template v-else>
                <!-- 任务完成提示 -->
                <div v-if="taskProgress?.task_progress?.is_completed" class="content-section completion-banner">
                  <div class="section-content">
                    <div class="completion-message">
                      <span class="completion-icon">🎉</span>
                      <h3>恭喜🎉，任务已经完成！</h3>
                      <p v-if="taskProgress.task_progress.completed_at" class="completion-time">
                        完成时间: {{ formatDateTime(taskProgress.task_progress.completed_at) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 任务进度信息 -->
                <div v-if="taskProgress" class="content-section task-progress-card">
                  <div class="section-header">
                    <h4 class="section-title">📊 任务完成进度</h4>
                  </div>
                  <div class="section-content">
                    <div class="progress-stats">
                      <div class="progress-stat-item">
                        <div class="progress-header">
                          <span class="progress-label">客观题</span>
                          <span class="progress-text">
                            {{ taskProgress.exam_progress?.completed ?? 0 }}/{{ taskProgress.exam_progress?.total ?? 0 }}
                          </span>
                        </div>
                        <div class="progress-bar-container">
                          <div 
                            class="progress-bar-fill" 
                            :style="{ width: getExamProgressPercent() + '%' }"
                          ></div>
                        </div>
                      </div>
                      <div class="progress-stat-item">
                        <div class="progress-header">
                          <span class="progress-label">OJ题</span>
                          <span class="progress-text">
                            {{ taskProgress.oj_progress?.completed ?? 0 }}/{{ taskProgress.oj_progress?.total ?? 0 }}
                          </span>
                        </div>
                        <div class="progress-bar-container">
                          <div 
                            class="progress-bar-fill" 
                            :style="{ width: getOJProgressPercent() + '%' }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 任务信息卡片 -->
                <div class="content-section task-info-card" v-if="selectedTask">
                  <div class="section-content">
                    <h2>{{ selectedTask.name }}</h2>
                    <p class="task-info-desc">{{ selectedTask.description }}</p>
                    
                    
                    
                    <!-- 复习内容展示 -->
                    <div v-if="selectedTask.review_content" class="review-section">
                      <div class="review-label">
                        <i class="fas fa-book"></i> 复习内容
                      </div>
                      <div class="review-content-box">{{ selectedTask.review_content }}</div>
                      <a v-if="selectedTask.review_video_url" :href="selectedTask.review_video_url" target="_blank" class="video-link-large">
                        <span>▶️</span> 观看复习视频
                      </a>
                    </div>
                  </div>
                </div>
  
                <div v-if="selectedTask?.exams?.length > 0" class="content-section">
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
                          <div class="exercise-status" :class="getExerciseStatusClass(exam)">
                            {{ getExerciseStatusText(exam) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                <div v-if="selectedTask?.oj_problems?.length > 0" class="content-section">
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
  
                <div class="content-section">
                  <div class="section-header">
                    <h4 class="section-title">🎥 学习总结（费恩曼学习法）</h4>
                  </div>
                  <div class="section-content">
                    <p class="feynman-intro">使用费恩曼学习法录制你的任务总结，巩固理解、发现盲点、提升表达能力。</p>
                    <button class="enter-plan-btn" @click="goFeynmanSummary">进入学习总结页面 <i class="fas fa-arrow-right"></i></button>
                  </div>
                </div>
              </template>
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
const selectedPlanId = ref<number | null>(null)
  const selectedTask = ref<any>(null)
  const taskProgress = ref<any>(null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showFireworks = ref(false)
  const userInfo = ref<any>(null)
  
  const fetchTaskExercises = async (taskId: number) => {
    if (!userInfo.value?.id) return null
    try {
      const response = await fetch(`${BASE_URL}/learning-tasks/${taskId}/exercises?user_id=${userInfo.value.id}`)
    if (!response.ok) throw new Error(`获取任务练习失败: ${response.status}`)
      const result = await response.json()
    if (result.success) return result.data
        throw new Error(result.message || '获取任务练习失败')
    } catch (err) {
      console.error('获取任务练习失败:', err)
      error.value = err instanceof Error ? err.message : '获取任务练习失败'
      return null
    }
  }

  const fetchTaskProgress = async (taskId: number) => {
    if (!userInfo.value?.id) {
      console.warn('用户信息不存在，无法获取任务进度')
      return null
    }
    try {
      const response = await fetch(`${BASE_URL}/learning-tasks/${taskId}/progress?user_id=${userInfo.value.id}`)
      if (!response.ok) {
        throw new Error(`获取任务进度失败: ${response.status}`)
      }
      const result = await response.json()
      if (result.success && result.data) {
        console.log('任务进度数据:', result.data)
        return result.data
      }
      throw new Error(result.message || '获取任务进度失败')
    } catch (err) {
      console.error('获取任务进度失败:', err)
      error.value = err instanceof Error ? err.message : '获取任务进度失败'
      return null
    }
  }
  
  const getExamProgressPercent = () => {
    if (!taskProgress.value?.exam_progress) return 0
    const total = taskProgress.value.exam_progress.total ?? 0
    const completed = taskProgress.value.exam_progress.completed ?? 0
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  const getOJProgressPercent = () => {
    if (!taskProgress.value?.oj_progress) return 0
    const total = taskProgress.value.oj_progress.total ?? 0
    const completed = taskProgress.value.oj_progress.completed ?? 0
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  const getExerciseStatusClass = (exercise: any) => {
    return exercise.is_completed === true || exercise.is_completed === 1 || exercise.is_completed === '1' ? 'status-completed' : 'status-pending'
  }
  const getExerciseStatusText = (exercise: any) => {
    return exercise.is_completed === true || exercise.is_completed === 1 || exercise.is_completed === '1' ? '已完成' : '未完成'
  }
  const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
    return map[difficulty] || difficulty
  }
  
  const startExam = (exam: any) => {
  router.push(`/exam/${exam.id}?from=taskview&planId=${selectedPlanId.value ?? ''}&taskId=${selectedTask.value?.id ?? ''}`)
  }
  const startOJ = (problem: any) => {
  router.push(`/smartoj/${problem.id}?from=taskview&planId=${selectedPlanId.value ?? ''}&taskId=${selectedTask.value?.id ?? ''}`)
}

const goFeynmanSummary = () => {
  const url = `/feynman-summary?planId=${selectedPlanId.value ?? ''}&taskId=${selectedTask.value?.id ?? ''}&level=${selectedLevel.value ?? ''}`
  router.push(url)
}

const backToTasks = () => {
  router.push(`/plan/${selectedPlanId.value}/tasks`)
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
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
  if (!userInfoStr) { error.value = '请先登录'; return }
      userInfo.value = JSON.parse(userInfoStr)
      
      const isConnected = await testAPIConnection()
  if (!isConnected) { error.value = '无法连接到服务器，请检查网络连接或联系管理员'; return }

  const planId = Number(route.params.planId)
  const taskId = Number(route.params.taskId)
  if (!planId || !taskId) { error.value = '缺少计划或任务ID'; return }
  selectedPlanId.value = planId

  loading.value = true
  const [taskData, progressData] = await Promise.all([
    fetchTaskExercises(taskId),
    fetchTaskProgress(taskId)
  ])
  loading.value = false
  if (taskData) {
    console.log('接口返回复习内容 review_content:', taskData.task?.review_content)
    console.log('接口返回复习视频 review_video_url:', taskData.task?.review_video_url)
    
    // 去重函数：基于 id 去重，保留第一个出现的
    const deduplicateById = (items: any[]) => {
      if (!items || items.length === 0) return []
      const seen = new Map()
      return items.filter((item: any) => {
        if (!item || !item.id) return false
        if (seen.has(item.id)) return false
        seen.set(item.id, true)
        return true
      })
    }
    
    // 对 exams 和 oj_problems 进行去重
    const uniqueExams = deduplicateById(taskData.exams || [])
    const uniqueOJProblems = deduplicateById(taskData.oj_problems || [])
    
    selectedTask.value = {
      ...(taskData.task || {}),
      review_content: taskData.task?.review_content ?? '',
      review_video_url: taskData.task?.review_video_url ?? '',
      exams: uniqueExams,
      oj_problems: uniqueOJProblems
    }
    console.log('TaskView 合并后的selectedTask:', selectedTask.value)
    console.log('TaskView review_content:', selectedTask.value.review_content)
    console.log('TaskView review_video_url:', selectedTask.value.review_video_url)
    selectedLevel.value = taskData.task?.level ?? null
    
    // 更新任务进度信息
    if (progressData) {
      taskProgress.value = progressData
      console.log('任务进度信息已更新:', taskProgress.value)
      
      // 更新客观题完成状态和进度信息
      if (selectedTask.value.exams && progressData.exam_progress?.exams) {
        selectedTask.value.exams = selectedTask.value.exams.map((exam: any) => {
          const progressExam = progressData.exam_progress.exams.find((e: any) => e.id === exam.id)
          if (progressExam) {
            return {
              ...exam,
              is_completed: progressExam.is_completed === '1' || progressExam.is_completed === 1 || progressExam.is_completed === true,
              best_score: progressExam.best_score,
              attempt_count: progressExam.attempt_count
            }
          }
          return exam
        })
      }
      
      // 更新OJ题完成状态和进度信息
      if (selectedTask.value.oj_problems && progressData.oj_progress?.problems) {
        selectedTask.value.oj_problems = selectedTask.value.oj_problems.map((problem: any) => {
          const progressProblem = progressData.oj_progress.problems.find((p: any) => p.id === problem.id)
          if (progressProblem) {
            return {
              ...problem,
              is_completed: progressProblem.is_completed === '1' || progressProblem.is_completed === 1 || progressProblem.is_completed === true,
              best_verdict: progressProblem.best_verdict,
              attempt_count: progressProblem.attempt_count
            }
          }
          return problem
        })
      }
      
      // 如果任务完成，触发烟花特效
      if (taskProgress.value?.task_progress?.is_completed) {
        triggerFireworks()
      }
    } else {
      console.warn('未获取到任务进度数据')
    }
    }
  })

// 监听任务完成状态，当从未完成变为完成时触发烟花
watch(() => taskProgress.value?.task_progress?.is_completed, (newVal, oldVal) => {
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
  justify-content: flex-start;
  position: relative;
  gap: 16px;
  min-height: 54px;
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
/* LevelExamsView风格统一返回按钮样式 */
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
.task-info-card { margin-bottom: 24px; }
.task-info-card h2 { color: #1e293b; font-size: 1.6rem; margin: 0 0 12px 0; font-weight: 700; }
.task-info-desc { color: #64748b; font-size: 1rem; margin: 0 0 20px 0; line-height: 1.6; }
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
  white-space: pre-wrap;
  word-wrap: break-word;
}
.video-link-large { 
  display: inline-flex; 
  align-items: center; 
  gap: 8px; 
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); 
  color: white; 
  padding: 12px 24px; 
  border-radius: 12px; 
  text-decoration: none; 
  font-weight: 600; 
  transition: all 0.3s ease; 
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}
.video-link-large:hover { 
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%); 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4); 
}
.exercises-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.exercise-card { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; }
.exercise-card:hover { border-color: #1e90ff; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(30, 144, 255, 0.2); }
.exercise-icon { font-size: 2.5rem; margin-bottom: 12px; }
.exercise-card h4 { color: #1e293b; font-size: 1.1rem; margin: 0 0 8px 0; font-weight: 700; }
.exercise-desc { color: #64748b; font-size: 0.9rem; margin: 0 0 12px 0; line-height: 1.5; }
.exercise-info { display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.85rem; color: #64748b; }
.difficulty-badge { padding: 4px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; }
.difficulty-easy { background: #d1fae5; color: #059669; }
.difficulty-medium { background: #fed7aa; color: #d97706; }
.difficulty-hard { background: #fecaca; color: #dc2626; }
.exercise-status { position: absolute; top: 16px; right: 16px; padding: 4px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
.status-pending { background: #fee2e2; color: #dc2626; }
.status-completed { background: #d1fae5; color: #059669; }
.enter-plan-btn { 
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); 
  color: #fff; 
  border: none; 
  padding: 12px 20px; 
  border-radius: 12px; 
  font-weight: 700; 
  cursor: pointer; 
  transition: all 0.3s ease; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.enter-plan-btn:hover {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.35);
}
.feynman-intro { color: #475569; font-size: 0.95rem; line-height: 1.7; margin-bottom: 16px; }

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

/* 任务进度卡片 */
.task-progress-card {
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
  .exercises-grid { 
    grid-template-columns: 1fr; 
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
  
  