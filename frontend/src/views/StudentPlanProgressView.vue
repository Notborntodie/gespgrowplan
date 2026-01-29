<template>
  <div class="student-plan-progress-view">
    <!-- 学生信息头部 -->
    <div class="student-header">
      <button @click="goBack" class="btn-back">
        <Icon name="arrow-left" :size="18" />
        返回学生管理
      </button>
      <div class="student-info">
        <div class="student-avatar-large">
          {{ studentInfo?.real_name ? studentInfo.real_name.charAt(0) : studentInfo?.username?.charAt(0) }}
        </div>
        <div class="student-details">
          <h1 class="student-name">{{ studentInfo?.real_name || studentInfo?.username || '未知学生' }}</h1>
          <p class="student-username">@{{ studentInfo?.username }}</p>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载计划完成情况...</p>
    </div>

    <!-- 计划列表 -->
    <div v-else-if="plans.length > 0" class="plans-container">
      <div v-for="plan in plans" :key="plan.id" class="plan-card">
        <!-- 计划头部信息 -->
        <div class="plan-header">
          <div class="plan-title-section">
            <h2 class="plan-name">{{ plan.name }}</h2>
            <span class="plan-level-badge">GESP {{ plan.level }}级</span>
          </div>
          <div class="plan-progress-section">
            <div class="progress-info">
              <span class="progress-label">总体进度</span>
              <span class="progress-value">{{ plan.completed_tasks || 0 }}/{{ plan.total_tasks || 0 }}</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${plan.progress || 0}%` }"
                  :class="getProgressClass(plan.progress || 0)"
                ></div>
              </div>
              <span class="progress-percentage">{{ plan.progress || 0 }}%</span>
            </div>
          </div>
        </div>

        <!-- 计划时间信息 -->
        <div class="plan-meta">
          <span class="meta-item">
            <Icon name="calendar" :size="14" />
            开始时间: {{ formatDate(plan.start_time) }}
          </span>
          <span class="meta-item">
            <Icon name="calendar" :size="14" />
            结束时间: {{ formatDate(plan.end_time) }}
          </span>
        </div>

        <!-- 任务列表 -->
        <div v-if="planTasksLoading[plan.id]" class="tasks-loading">
          <div class="loading-spinner-small"></div>
          <span>加载任务中...</span>
        </div>

        <div v-else-if="planTasks[plan.id] && planTasks[plan.id].length > 0" class="tasks-container">
          <div 
            v-for="task in planTasks[plan.id]" 
            :key="task.id" 
            class="task-card"
            :class="{ 'task-completed': task.is_completed }"
          >
            <div class="task-header">
              <div class="task-title-section">
                <h3 class="task-name">{{ task.name }}</h3>
                <span 
                  v-if="task.is_exam_mode" 
                  class="exam-mode-tag"
                >
                  <Icon name="clipboard-check" :size="14" />
                  考试模式
                </span>
                <span 
                  class="task-status-badge" 
                  :class="task.is_completed ? 'completed' : 'in-progress'"
                >
                  {{ task.is_completed ? '已完成' : '进行中' }}
                </span>
              </div>
              <div class="task-time">
                <span>{{ formatDate(task.start_time) }} - {{ formatDate(task.end_time) }}</span>
              </div>
            </div>

            <!-- 任务描述 -->
            <div v-if="task.description" class="task-description">
              {{ task.description }}
            </div>

            <!-- 任务进度详情 -->
            <div class="task-progress-details">
              <!-- 客观题进度 -->
              <div class="progress-item">
                <div class="progress-item-header">
                  <Icon name="file-text" :size="16" />
                  <span class="progress-item-label">客观题</span>
                </div>
                <div class="progress-item-content">
                  <span class="progress-count">
                    {{ task.exam_progress?.completed || 0 }}/{{ task.exam_progress?.total || 0 }}
                  </span>
                  <div class="progress-bar-small">
                    <div 
                      class="progress-fill-small" 
                      :style="{ width: `${getProgressPercentage(task.exam_progress)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 客观题最高分 -->
              <div v-if="task.exam_progress?.exams && task.exam_progress.exams.length > 0" class="score-section">
                <div class="score-item">
                  <span class="score-label">客观题最高分:</span>
                  <span class="score-value">
                    {{ getMaxExamScore(task.exam_progress.exams) }}分
                  </span>
                </div>
              </div>

              <!-- OJ题进度 -->
              <div class="progress-item">
                <div class="progress-item-header">
                  <Icon name="code" :size="16" />
                  <span class="progress-item-label">编程题</span>
                </div>
                <div class="progress-item-content">
                  <span class="progress-count">
                    {{ task.oj_progress?.completed || 0 }}/{{ task.oj_progress?.total || 0 }}
                  </span>
                  <div class="progress-bar-small">
                    <div 
                      class="progress-fill-small" 
                      :style="{ width: `${getProgressPercentage(task.oj_progress)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 编程题最高分 -->
              <div v-if="task.oj_progress?.problems && task.oj_progress.problems.length > 0" class="score-section">
                <div class="score-item">
                  <span class="score-label">编程题最高分:</span>
                  <span class="score-value">
                    {{ getMaxOJScore(task.oj_progress.problems) }}分
                  </span>
                </div>
              </div>

              <!-- 考试模式总分 -->
              <div v-if="task.is_exam_mode && getExamModeTotalScore(task)" class="exam-total-score">
                <div class="total-score-display">
                  <Icon name="trophy" :size="20" />
                  <span class="total-score-label">考试总分:</span>
                  <span class="total-score-value">{{ getExamModeTotalScore(task) }}分</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-tasks">
          <p>该计划暂无任务</p>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <Icon name="book-open" :size="64" class="empty-icon" />
      <h3>暂无学习计划</h3>
      <p>该学生尚未加入任何学习计划</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import Icon from '@/components/Icon.vue'
import { BASE_URL } from '@/config/api'

const router = useRouter()
const route = useRoute()

// 学生信息
const studentInfo = ref<any>(null)
const studentId = ref<number | null>(null)

// 计划列表
const plans = ref<any[]>([])
const loading = ref(false)

// 每个计划的任务列表
const planTasks = ref<Record<number, any[]>>({})
const planTasksLoading = ref<Record<number, boolean>>({})

// 获取用户信息
const getUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    return JSON.parse(userInfoStr)
  }
  return null
}

// 返回上一页
const goBack = () => {
  router.push({
    path: '/teacher',
    query: {
      fromSection: 'student-management'
    }
  })
}

// 获取学生加入的所有计划
const fetchStudentPlans = async () => {
  if (!studentId.value) return

  loading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/learning-plans/my-plans`, {
      params: {
        user_id: studentId.value
      }
    })

    if (response.data.success) {
      plans.value = response.data.data || []
      
      // 为每个计划加载任务详情
      for (const plan of plans.value) {
        await fetchPlanTasks(plan.id)
      }
    } else {
      console.error('获取计划列表失败:', response.data.message)
      plans.value = []
    }
  } catch (error: any) {
    console.error('获取计划列表失败:', error)
    alert('获取计划列表失败: ' + (error.response?.data?.message || error.message))
    plans.value = []
  } finally {
    loading.value = false
  }
}

// 获取计划的任务详情
const fetchPlanTasks = async (planId: number) => {
  if (!studentId.value) return

  planTasksLoading.value[planId] = true
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${planId}/students/${studentId.value}/progress`,
      {
        params: {
          teacher_id: getUserInfo()?.id
        }
      }
    )

    if (response.data.success) {
      const tasks = response.data.data?.tasks || []
      
      // 处理任务数据，添加进度信息
      planTasks.value[planId] = tasks.map((task: any) => ({
        ...task,
        exam_progress: task.exam_progress || { total: 0, completed: 0, exams: [] },
        oj_progress: task.oj_progress || { total: 0, completed: 0, problems: [] }
      }))
    } else {
      console.error('获取任务详情失败:', response.data.message)
      planTasks.value[planId] = []
    }
  } catch (error: any) {
    console.error('获取任务详情失败:', error)
    planTasks.value[planId] = []
  } finally {
    planTasksLoading.value[planId] = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

// 获取进度百分比
const getProgressPercentage = (progress: any): number => {
  if (!progress || !progress.total || progress.total === 0) return 0
  const completed = progress.completed || 0
  return Math.round((completed / progress.total) * 100)
}

// 获取进度样式类
const getProgressClass = (progress: number) => {
  if (progress >= 100) return 'progress-completed'
  if (progress >= 80) return 'progress-good'
  if (progress >= 50) return 'progress-medium'
  return 'progress-low'
}

// 获取客观题最高分
const getMaxExamScore = (exams: any[]): number => {
  if (!exams || exams.length === 0) return 0
  const scores = exams
    .map((exam: any) => exam.best_score)
    .filter((score: any) => score !== null && score !== undefined)
    .map((score: any) => Number(score) || 0)
  return scores.length > 0 ? Math.max(...scores) : 0
}

// 获取编程题最高分（通过率）
const getMaxOJScore = (problems: any[]): number => {
  if (!problems || problems.length === 0) return 0
  
  // 计算每个题目的分数
  const scores = problems.map((problem: any) => {
    if (problem.best_verdict === 'Accepted' || problem.best_verdict === 'AC') {
      return 100
    }
    // PAC (Partial Accepted) - 使用 best_pass_rate
    if (problem.best_pass_rate !== undefined && problem.best_pass_rate !== null) {
      return Math.round(Number(problem.best_pass_rate)) || 0
    }
    return 0
  })
  
  return scores.length > 0 ? Math.max(...scores) : 0
}

// 计算考试模式总分
const getExamModeTotalScore = (task: any): number | null => {
  if (!task.is_exam_mode) return null

  const exams = task.exam_progress?.exams || []
  const problems = task.oj_progress?.problems || []

  // 客观题分数（占50%）- 取第一套试卷的最高分
  let examScore = 0
  if (exams.length > 0 && exams[0].best_score !== undefined && exams[0].best_score !== null) {
    examScore = Number(exams[0].best_score) || 0
  }

  // 编程题分数（每道各占25%）
  let oj1Score = 0
  let oj2Score = 0
  if (problems.length >= 1) {
    if (problems[0].best_verdict === 'Accepted' || problems[0].best_verdict === 'AC') {
      oj1Score = 100
    } else if (problems[0].best_pass_rate !== undefined && problems[0].best_pass_rate !== null) {
      oj1Score = Math.round(Number(problems[0].best_pass_rate)) || 0
    }
  }
  if (problems.length >= 2) {
    if (problems[1].best_verdict === 'Accepted' || problems[1].best_verdict === 'AC') {
      oj2Score = 100
    } else if (problems[1].best_pass_rate !== undefined && problems[1].best_pass_rate !== null) {
      oj2Score = Math.round(Number(problems[1].best_pass_rate)) || 0
    }
  }

  // 计算总分：客观题50% + 编程题1 25% + 编程题2 25%
  const totalScore = examScore * 0.5 + oj1Score * 0.25 + oj2Score * 0.25
  return Math.round(totalScore * 10) / 10
}

// 初始化
onMounted(() => {
  // 从路由参数获取学生ID
  const studentIdParam = route.params.studentId || route.query.student_id
  if (studentIdParam) {
    studentId.value = Number(studentIdParam)
    
    // 获取学生信息（从学生管理列表传递过来，或者重新获取）
    const studentInfoParam = route.query.student_info
    if (studentInfoParam) {
      try {
        studentInfo.value = JSON.parse(decodeURIComponent(studentInfoParam as string))
      } catch (e) {
        console.error('解析学生信息失败:', e)
      }
    }
    
    // 如果没有学生信息，尝试从localStorage获取（如果之前保存过）
    if (!studentInfo.value) {
      const savedStudentInfo = localStorage.getItem(`student_${studentId.value}_info`)
      if (savedStudentInfo) {
        try {
          studentInfo.value = JSON.parse(savedStudentInfo)
        } catch (e) {
          console.error('解析保存的学生信息失败:', e)
        }
      }
    }
    
    // 如果没有学生信息，至少设置基本信息
    if (!studentInfo.value && studentId.value) {
      studentInfo.value = {
        id: studentId.value,
        username: `学生${studentId.value}`,
        real_name: ''
      }
    }
    
    // 加载计划列表
    fetchStudentPlans()
  } else {
    alert('缺少学生ID参数')
    goBack()
  }
})
</script>

<style scoped>
.student-plan-progress-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 24px;
}

.student-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 24px;
}

.btn-back {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #e2e8f0;
  color: #475569;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.student-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.student-details h1 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.student-username {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #1e90ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #1e90ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  color: #64748b;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.plans-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.plan-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.plan-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-name {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.plan-level-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
}

.plan-progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.progress-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e90ff;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.progress-completed {
  background: #10b981;
}

.progress-fill.progress-good {
  background: #3b82f6;
}

.progress-fill.progress-medium {
  background: #f59e0b;
}

.progress-fill.progress-low {
  background: #ef4444;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  min-width: 40px;
}

.plan-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 14px;
}

.tasks-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #64748b;
  font-size: 14px;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.task-completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
  border-color: #10b981;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.task-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-name {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.exam-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.task-status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.task-status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.task-status-badge.in-progress {
  background: #fef3c7;
  color: #92400e;
}

.task-time {
  color: #64748b;
  font-size: 14px;
}

.task-description {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.6;
}

.task-progress-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.progress-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.progress-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-count {
  font-size: 14px;
  font-weight: 600;
  color: #1e90ff;
  min-width: 60px;
  text-align: right;
}

.progress-bar-small {
  width: 120px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: #1e90ff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.score-section {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.score-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e90ff;
}

.exam-total-score {
  padding: 16px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 8px;
  border: 2px solid #10b981;
}

.total-score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-score-label {
  font-size: 16px;
  font-weight: 600;
  color: #047857;
}

.total-score-value {
  font-size: 24px;
  font-weight: 800;
  color: #059669;
}

.empty-tasks {
  padding: 20px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 768px) {
  .student-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .plan-header {
    flex-direction: column;
  }

  .task-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .progress-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-item-content {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

