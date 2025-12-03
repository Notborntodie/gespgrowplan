<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>学习计划详情</h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <div v-else-if="planData">
          <!-- 计划基本信息 -->
          <div class="plan-info-section">
            <div class="info-header">
              <h2>{{ planData.plan.name }}</h2>
              <span class="level-badge">GESP {{ planData.plan.level }}级</span>
            </div>
            <p class="plan-description">{{ planData.plan.description }}</p>
            
            <div class="plan-stats">
              <div class="stat-item">
                <span class="stat-label">完成进度</span>
                <span class="stat-value">{{ planData.plan.progress || 0 }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成任务</span>
                <span class="stat-value">{{ planData.plan.completed_tasks || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总任务数</span>
                <span class="stat-value">{{ planData.plan.total_tasks || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 任务列表 -->
          <div class="tasks-section">
            <h4>学习任务</h4>
            <div v-if="planData.tasks && planData.tasks.length > 0" class="tasks-list">
              <div 
                v-for="(task, index) in planData.tasks" 
                :key="task.id"
                class="task-detail-item"
              >
                <div class="task-detail-header">
                  <div class="task-title-row">
                    <span class="task-number">{{ index + 1 }}</span>
                    <h5>{{ task.name }}</h5>
                    <span v-if="task.is_exam_mode" class="exam-mode-badge">
                      <i class="fas fa-clipboard-check"></i> 考试模式
                    </span>
                  </div>
                  <span class="task-status" :class="getTaskStatusClass(task)">
                    {{ getTaskStatusText(task) }}
                  </span>
                </div>

                <p class="task-description">{{ task.description }}</p>

                <div v-if="task.review_content" class="review-section">
                  <div class="review-label">
                    <i class="fas fa-book"></i> 复习内容
                  </div>
                  <div class="review-content">{{ task.review_content }}</div>
                  <a v-if="task.review_video_url" :href="task.review_video_url" target="_blank" class="video-link">
                    <span>▶️</span> 观看复习视频
                  </a>
                </div>

                <div class="task-time">
                  <i class="fas fa-clock"></i>
                  {{ formatDateTime(task.start_time) }} - {{ formatDateTime(task.end_time) }}
                </div>

                <div class="task-exercises-info">
                  <div class="exercise-count">
                    <i class="fas fa-file-alt"></i>
                    客观题: {{ task.exam_count || 0 }}套
                  </div>
                  <div class="exercise-count">
                    <i class="fas fa-code"></i>
                    OJ题: {{ task.oj_count || 0 }}道
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-tasks">
              <p>暂无任务</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps<{
  visible: boolean
  planId: number | null
}>()

const emit = defineEmits(['close'])

import { BASE_URL } from '@/config/api'

const loading = ref(false)
const planData = ref<any>(null)
const userInfo = ref<any>(null)

// 获取计划详情
async function fetchPlanDetail() {
  if (!props.planId) return

  loading.value = true
  try {
    // 使用管理员专用 API 获取完整的计划详情（无需权限检查）
    const response = await axios.get(`${BASE_URL}/learning-plans/${props.planId}/admin`)
    console.log('📡 [PlanDetailDialog] 管理员API响应:', response.data)
    
    if (response.data.success) {
      const data = response.data.data
      
      // 转换数据格式以适配显示组件
      planData.value = {
        plan: {
          id: data.id,
          name: data.name,
          description: data.description,
          level: data.level,
          start_time: data.start_time,
          end_time: data.end_time,
          is_active: data.is_active,
          total_tasks: data.tasks?.length || 0
        },
        tasks: (data.tasks || []).map((task: any) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          review_content: task.review_content,
          review_video_url: task.review_video_url,
          start_time: task.start_time,
          end_time: task.end_time,
          is_completed: task.is_completed || false,
          is_exam_mode: task.is_exam_mode || false,
          exam_count: task.exams?.length || 0,
          oj_count: task.oj_problems?.length || 0
        }))
      }
      
      console.log('✅ [PlanDetailDialog] 计划详情加载成功')
      console.log('📋 [PlanDetailDialog] 任务数量:', planData.value.tasks.length)
    } else {
      console.warn('⚠️ [PlanDetailDialog] 响应success为false')
      alert('获取计划详情失败')
    }
  } catch (error: any) {
    console.error('❌ [PlanDetailDialog] 获取计划详情失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '获取计划详情失败'
    alert(`获取计划详情失败: ${errorMsg}`)
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
function formatDateTime(dateString: string) {
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

// 获取任务状态样式类
function getTaskStatusClass(task: any) {
  if (task.is_completed) return 'status-completed'
  
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  
  if (now < start) return 'status-upcoming'
  if (now > end) return 'status-overdue'
  return 'status-active'
}

// 获取任务状态文本
function getTaskStatusText(task: any) {
  if (task.is_completed) return '已完成'
  
  const now = new Date()
  const start = new Date(task.start_time)
  const end = new Date(task.end_time)
  
  if (now < start) return '未开始'
  if (now > end) return '已过期'
  return '进行中'
}

watch(() => props.visible, (newVal) => {
  if (newVal && props.planId) {
    fetchPlanDetail()
  }
})

onMounted(() => {
  // 获取用户信息
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
})
</script>

<style scoped>
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
  max-width: 1000px;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
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
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

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

.plan-info-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px;
  border-radius: 16px;
  border: 2px solid #bae6fd;
  margin-bottom: 24px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.info-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
}

.level-badge {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.plan-description {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.plan-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e0f2fe;
}

.stat-label {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  color: #1e90ff;
  font-size: 1.8rem;
  font-weight: 700;
}

.tasks-section {
  margin-top: 24px;
}

.tasks-section h4 {
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-detail-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 20px;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.task-detail-item:hover {
  border-color: #1e90ff;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15);
}

.task-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-number {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.task-detail-header h5 {
  margin: 0;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 700;
}

.exam-mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-status {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}

.status-active {
  background: #dbeafe;
  color: #1e90ff;
}

.status-upcoming {
  background: #fef3c7;
  color: #d97706;
}

.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}

.task-description {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.review-section {
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

.task-exercises-info {
  display: flex;
  gap: 16px;
}

.exercise-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.no-tasks {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
}

.btn-close {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: #f1f5f9;
  color: #64748b;
}

.btn-close:hover {
  background: #e2e8f0;
}
</style>

