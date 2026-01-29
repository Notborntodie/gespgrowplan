<template>
  <div class="student-plan-progress-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="student-info-header">
        <div class="student-avatar-small">
          {{ studentInfo?.real_name ? studentInfo.real_name.charAt(0) : studentInfo?.username?.charAt(0) }}
        </div>
        <div class="student-details-header">
          <h3 class="student-name-header">{{ studentInfo?.real_name || studentInfo?.username || '未知学生' }}</h3>
          <p class="student-username-header">@{{ studentInfo?.username }}</p>
        </div>
      </div>
      <button @click="$emit('close')" class="btn-close-panel">
        <Icon name="x" :size="20" />
      </button>
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
            <h4 class="plan-name">{{ plan.name }}</h4>
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
            <Icon name="calendar" :size="12" />
            开始: {{ formatDate(plan.start_time) }}
          </span>
          <span class="meta-item">
            <Icon name="calendar" :size="12" />
            结束: {{ formatDate(plan.end_time) }}
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
                <h5 class="task-name">{{ task.name }}</h5>
                <span 
                  v-if="task.is_exam_mode" 
                  class="exam-mode-tag"
                >
                  <Icon name="clipboard-check" :size="12" />
                  考试模式
                </span>
                <span 
                  class="task-status-badge" 
                  :class="task.is_completed ? 'completed' : 'in-progress'"
                >
                  {{ task.is_completed ? '已完成' : '进行中' }}
                </span>
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
                  <Icon name="file-text" :size="14" />
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
                  <Icon name="code" :size="14" />
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

              <!-- 考试模式总分 -->
              <div v-if="task.is_exam_mode && getExamModeTotalScore(task)" class="exam-total-score">
                <div class="total-score-display">
                  <Icon name="trophy" :size="16" />
                  <span class="total-score-label">考试总分:</span>
                  <span class="total-score-value">{{ getExamModeTotalScore(task) }}分</span>
                </div>
              </div>

              <!-- 专项分数（非考试模式） -->
              <div v-if="!task.is_exam_mode && getSpecialTaskScore(task)" class="special-total-score">
                <div class="total-score-display">
                  <Icon name="trophy" :size="16" />
                  <span class="total-score-label">专项分数:</span>
                  <span class="total-score-value">{{ getSpecialTaskScore(task) }}分</span>
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
      <Icon name="book-open" :size="48" class="empty-icon" />
      <h4>暂无学习计划</h4>
      <p>该学生尚未加入任何学习计划</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'
import Icon from '@/components/Icon.vue'
import { BASE_URL } from '@/config/api'

const props = defineProps<{
  studentId: number | null
  studentInfo: any
  teacherId: number
}>()

const emit = defineEmits<{
  'close': []
}>()

// 计划列表
const plans = ref<any[]>([])
const loading = ref(false)

// 每个计划的任务列表
const planTasks = ref<Record<number, any[]>>({})
const planTasksLoading = ref<Record<number, boolean>>({})

// 获取学生加入的所有计划
const fetchStudentPlans = async () => {
  if (!props.studentId) return

  loading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/learning-plans/my-plans`, {
      params: {
        user_id: props.studentId
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
    plans.value = []
  } finally {
    loading.value = false
  }
}

// 获取计划的任务详情
const fetchPlanTasks = async (planId: number) => {
  if (!props.studentId) return

  planTasksLoading.value[planId] = true
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${planId}/students/${props.studentId}/progress`,
      {
        params: {
          teacher_id: props.teacherId
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

// 计算专项分数（非考试模式，计算方式与考试模式相同）
const getSpecialTaskScore = (task: any): number | null => {
  if (task.is_exam_mode) return null

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

// 监听学生ID变化，重新加载数据
watch(() => props.studentId, (newStudentId) => {
  if (newStudentId) {
    plans.value = []
    planTasks.value = {}
    planTasksLoading.value = {}
    fetchStudentPlans()
  }
}, { immediate: true })
</script>

<style scoped>
.student-plan-progress-panel {
  flex: 0 0 50%;
  max-width: 50%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #e0f7fa 100%);
  border-left: 4px solid #1e90ff;
  overflow: hidden;
  box-shadow: -4px 0 20px rgba(30, 144, 255, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 3px solid #87ceeb;
  background: linear-gradient(135deg, #87ceeb 0%, #b3d9ff 50%, #cce5ff 100%);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
}

.student-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar-small {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 50%, #87ceeb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
}

.student-details-header h3 {
  margin: 0 0 4px 0;
  color: #0c4a6e;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.student-username-header {
  margin: 0;
  color: #0369a1;
  font-size: 14px;
  font-weight: 600;
}

.btn-close-panel {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #1e90ff;
  color: #1e90ff;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}

.btn-close-panel:hover {
  background: #1e90ff;
  color: white;
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.5);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748b;
  flex: 1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #1e90ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
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
  padding: 40px 20px;
  text-align: center;
  flex: 1;
}

.empty-icon {
  color: #64748b;
  margin-bottom: 12px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.plans-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  /* 确保滚动条独立 */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(30, 144, 255, 0.3) transparent;
}

.plans-container::-webkit-scrollbar {
  width: 8px;
}

.plans-container::-webkit-scrollbar-track {
  background: transparent;
}

.plans-container::-webkit-scrollbar-thumb {
  background: rgba(30, 144, 255, 0.3);
  border-radius: 4px;
}

.plans-container::-webkit-scrollbar-thumb:hover {
  background: rgba(30, 144, 255, 0.5);
}

.plan-card {
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  border-radius: 20px;
  padding: 20px;
  border: 4px solid #87ceeb;
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.2);
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(30, 144, 255, 0.3);
  border-color: #1e90ff;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.plan-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-name {
  margin: 0;
  color: #0c4a6e;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.plan-level-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.4);
}

.plan-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e90ff;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: #dbeafe;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #87ceeb;
  box-shadow: inset 0 2px 4px rgba(30, 144, 255, 0.2);
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.4);
}

.progress-fill.progress-completed {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.progress-fill.progress-good {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

.progress-fill.progress-medium {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.progress-fill.progress-low {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.progress-percentage {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 35px;
}

.plan-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 12px;
}

.tasks-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #64748b;
  font-size: 12px;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 16px;
  border: 3px solid #b3d9ff;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
}

.task-card:hover {
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.25);
  transform: translateY(-2px);
  border-color: #87ceeb;
}

.task-card.task-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #4ade80;
  border-width: 4px;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.task-title-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.task-name {
  margin: 0;
  color: #0c4a6e;
  font-size: 18px;
  font-weight: 800;
}

.exam-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
}

.task-status-badge {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-status-badge.completed {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.task-status-badge.in-progress {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.task-description {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.task-progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.progress-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-item-label {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.progress-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-count {
  font-size: 12px;
  font-weight: 600;
  color: #1e90ff;
  min-width: 50px;
  text-align: right;
}

.progress-bar-small {
  width: 100px;
  height: 8px;
  background: #dbeafe;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #87ceeb;
  box-shadow: inset 0 2px 4px rgba(30, 144, 255, 0.2);
}

.progress-fill-small {
  height: 100%;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-radius: 8px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(30, 144, 255, 0.4);
}

.score-section {
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.score-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e90ff;
}

.exam-total-score {
  padding: 16px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 16px;
  border: 4px solid #4ade80;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.special-total-score {
  padding: 16px;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  border-radius: 16px;
  border: 4px solid #1e90ff;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.special-total-score .total-score-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

.special-total-score .total-score-value {
  font-size: 18px;
  font-weight: 800;
  color: #2563eb;
}

.total-score-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.total-score-label {
  font-size: 13px;
  font-weight: 600;
  color: #047857;
}

.total-score-value {
  font-size: 18px;
  font-weight: 800;
  color: #059669;
}

.empty-tasks {
  padding: 12px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
}
</style>

