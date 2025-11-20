<template>
  <BaseTeacherSection title="计划完成">
    <template #filters>
      <div class="level-filter">
        <label>级别筛选：</label>
        <select v-model="selectedLevel" @change="fetchPlans" class="level-select">
          <option value="">全部级别</option>
          <option value="1">GESP 1级</option>
          <option value="2">GESP 2级</option>
          <option value="3">GESP 3级</option>
          <option value="4">GESP 4级</option>
          <option value="5">GESP 5级</option>
          <option value="6">GESP 6级</option>
        </select>
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="selectedPlan">
        <!-- 计划信息 -->
        <div class="plan-info-card">
          <div class="plan-header">
            <h3>{{ selectedPlan.name }}</h3>
            <button @click="selectedPlan = null" class="btn-back">← 返回计划列表</button>
          </div>
          <div class="plan-meta">
            <span class="meta-item">级别: GESP {{ selectedPlan.level }}级</span>
            <span class="meta-item">开始时间: {{ formatDate(selectedPlan.start_time) }}</span>
            <span class="meta-item">结束时间: {{ formatDate(selectedPlan.end_time) }}</span>
          </div>
        </div>

        <!-- 学生完成情况列表 -->
        <div v-if="studentsLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载学生完成情况...</span>
        </div>

        <div v-else-if="students.length > 0" class="students-progress-container">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>学生姓名</th>
                  <th>用户名</th>
                  <th>完成状态</th>
                  <th>完成进度</th>
                  <th>完成率</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.student_id" class="table-row">
                  <td class="student-name-cell">
                    <div class="student-name-text">{{ student.real_name || student.username }}</div>
                  </td>
                  <td>
                    <span class="username-text">@{{ student.username }}</span>
                  </td>
                  <td>
                    <span 
                      class="status-badge" 
                      :class="student.plan_progress.is_completed ? 'completed' : 'in-progress'"
                    >
                      {{ student.plan_progress.is_completed ? '已完成' : '进行中' }}
                    </span>
                  </td>
                  <td>
                    <div class="progress-info">
                      <span class="progress-text">
                        {{ student.plan_progress.completed_tasks }} / {{ student.plan_progress.total_tasks }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="progress-bar-container">
                      <div 
                        class="progress-bar" 
                        :class="getProgressClass(student.plan_progress.progress_rate)"
                      >
                        <div 
                          class="progress-fill"
                          :style="{ width: student.plan_progress.progress_rate + '%' }"
                        ></div>
                      </div>
                      <span class="progress-percentage">{{ student.plan_progress.progress_rate }}%</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      @click="viewStudentDetail(student)" 
                      class="btn-action btn-view"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>该计划下暂无学生</p>
        </div>
      </div>

      <!-- 计划列表 -->
      <div v-else class="plans-container">
        <div v-if="plans.length > 0" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>计划名称</th>
                <th>级别</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in plans" :key="plan.id" class="table-row">
                <td>{{ plan.id }}</td>
                <td class="plan-name-cell">
                  <div class="plan-name-text">{{ plan.name }}</div>
                </td>
                <td>
                  <span class="level-badge">GESP {{ plan.level }}级</span>
                </td>
                <td class="date-cell">{{ formatDate(plan.start_time) }}</td>
                <td class="date-cell">{{ formatDate(plan.end_time) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(plan)">
                    {{ getStatusText(plan) }}
                  </span>
                </td>
                <td>
                  <button 
                    @click="viewPlanProgress(plan)" 
                    class="btn-action btn-view"
                  >
                    查看完成情况
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state">
          <p>暂无学习计划</p>
        </div>
      </div>
    </template>
  </BaseTeacherSection>

  <!-- 学生详细完成情况对话框 -->
  <div v-if="showStudentDetailDialog && selectedStudent && selectedPlan" class="dialog-overlay" @click="closeStudentDetailDialog">
    <div class="dialog dialog-large" @click.stop>
      <div class="dialog-header">
        <h3>{{ selectedStudent.real_name || selectedStudent.username }} - 详细完成情况</h3>
        <button @click="closeStudentDetailDialog" class="btn-close">&times;</button>
      </div>
      <div class="dialog-body">
        <div v-if="studentDetailLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="studentDetail" class="student-detail-content">
          <!-- 计划进度概览 -->
          <div class="progress-overview">
            <h4>计划进度概览</h4>
            <div class="overview-cards">
              <div class="overview-card">
                <div class="overview-label">完成状态</div>
                <div class="overview-value">
                  <span 
                    class="status-badge" 
                    :class="studentDetail.plan_progress.is_completed ? 'completed' : 'in-progress'"
                  >
                    {{ studentDetail.plan_progress.is_completed ? '已完成' : '进行中' }}
                  </span>
                </div>
              </div>
              <div class="overview-card">
                <div class="overview-label">完成进度</div>
                <div class="overview-value">
                  {{ studentDetail.plan_progress.completed_tasks }} / {{ studentDetail.plan_progress.total_tasks }}
                </div>
              </div>
              <div class="overview-card">
                <div class="overview-label">完成率</div>
                <div class="overview-value">{{ studentDetail.plan_progress.progress_rate }}%</div>
              </div>
            </div>
          </div>

          <!-- 任务详细列表 -->
          <div class="tasks-section">
            <h4>任务完成情况 ({{ studentDetail.tasks.length }})</h4>
            <div class="tasks-list">
              <div 
                v-for="task in studentDetail.tasks" 
                :key="task.id" 
                class="task-item"
              >
                <div class="task-header">
                  <div class="task-name">{{ task.name }}</div>
                  <span 
                    class="task-status-badge" 
                    :class="task.task_progress.is_completed ? 'completed' : 'in-progress'"
                  >
                    {{ task.task_progress.is_completed ? '已完成' : '未完成' }}
                  </span>
                </div>
                
                <div class="task-progress-details">
                  <!-- 客观题进度 -->
                  <div class="progress-item">
                    <div class="progress-label">客观题</div>
                    <div class="progress-detail">
                      <span class="progress-count">
                        {{ task.exam_progress.completed }} / {{ task.exam_progress.total }}
                      </span>
                      <div class="mini-progress-bar">
                        <div 
                          class="mini-progress-fill" 
                          :style="{ width: task.exam_progress.total > 0 ? (task.exam_progress.completed / task.exam_progress.total * 100) + '%' : '0%' }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- OJ题进度 -->
                  <div class="progress-item">
                    <div class="progress-label">OJ题</div>
                    <div class="progress-detail">
                      <span class="progress-count">
                        {{ task.oj_progress.completed }} / {{ task.oj_progress.total }}
                      </span>
                      <div class="mini-progress-bar">
                        <div 
                          class="mini-progress-fill" 
                          :style="{ width: task.oj_progress.total > 0 ? (task.oj_progress.completed / task.oj_progress.total * 100) + '%' : '0%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button @click="closeStudentDetailDialog" class="btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import BaseTeacherSection from './BaseTeacherSection.vue'

import { BASE_URL } from '@/config/api'

// 用户信息
const userInfo = ref<any>(null)

// 计划相关
const plans = ref<any[]>([])
const selectedPlan = ref<any>(null)
const selectedLevel = ref('')
const loading = ref(false)

// 学生完成情况
const students = ref<any[]>([])
const studentsLoading = ref(false)

// 学生详细完成情况
const showStudentDetailDialog = ref(false)
const selectedStudent = ref<any>(null)
const studentDetail = ref<any>(null)
const studentDetailLoading = ref(false)

// 获取用户信息
const getUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
}

// 获取计划列表
const fetchPlans = async () => {
  if (!userInfo.value) return
  
  loading.value = true
  try {
    const params: any = {}
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    // 只获取激活的计划
    params.is_active = '1'
    
    const response = await axios.get(`${BASE_URL}/learning-plans/all`, { params })
    
    if (response.data.success) {
      plans.value = response.data.data || []
    }
  } catch (error: any) {
    console.error('获取学习计划列表失败:', error)
    alert('获取学习计划列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 查看计划完成情况
const viewPlanProgress = async (plan: any) => {
  if (!userInfo.value) return
  
  selectedPlan.value = plan
  studentsLoading.value = true
  
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${plan.id}/students-progress`,
      { params: { teacher_id: userInfo.value.id } }
    )
    
    if (response.data.success) {
      students.value = response.data.data?.students || []
    } else {
      alert('获取学生完成情况失败: ' + (response.data.message || '未知错误'))
      students.value = []
    }
  } catch (error: any) {
    console.error('获取学生完成情况失败:', error)
    alert('获取学生完成情况失败: ' + (error.response?.data?.message || error.message))
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

// 查看学生详细完成情况
const viewStudentDetail = async (student: any) => {
  if (!userInfo.value || !selectedPlan.value) return
  
  selectedStudent.value = student
  showStudentDetailDialog.value = true
  studentDetailLoading.value = true
  
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${selectedPlan.value.id}/students/${student.student_id}/progress`,
      { params: { teacher_id: userInfo.value.id } }
    )
    
    if (response.data.success) {
      studentDetail.value = response.data.data
    } else {
      alert('获取学生详细完成情况失败: ' + (response.data.message || '未知错误'))
      studentDetail.value = null
    }
  } catch (error: any) {
    console.error('获取学生详细完成情况失败:', error)
    alert('获取学生详细完成情况失败: ' + (error.response?.data?.message || error.message))
    studentDetail.value = null
  } finally {
    studentDetailLoading.value = false
  }
}

// 关闭学生详细完成情况对话框
const closeStudentDetailDialog = () => {
  showStudentDetailDialog.value = false
  selectedStudent.value = null
  studentDetail.value = null
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 获取状态样式类
const getStatusClass = (plan: any) => {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return 'status-upcoming'
  if (now > end) return 'status-ended'
  return 'status-active'
}

// 获取状态文本
const getStatusText = (plan: any) => {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return '未开始'
  if (now > end) return '已结束'
  return '进行中'
}

// 获取进度样式类
const getProgressClass = (rate: number) => {
  if (rate >= 100) return 'progress-completed'
  if (rate >= 80) return 'progress-good'
  if (rate >= 50) return 'progress-medium'
  return 'progress-low'
}

// 初始化
onMounted(() => {
  getUserInfo()
  if (userInfo.value) {
    fetchPlans()
  }
})
</script>

<style scoped>
.level-filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-filter label {
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
}

.level-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
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
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.table-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
}

.data-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: white;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1e293b;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.plan-name-cell,
.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-name-text,
.student-name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
}

.date-cell {
  color: #64748b;
  font-size: 13px;
}

.username-text {
  color: #64748b;
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.in-progress {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-upcoming {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-ended {
  background: #fee2e2;
  color: #991b1b;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-weight: 500;
  color: #1e293b;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.progress-bar {
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  position: relative;
  flex: 1;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-bar.progress-completed .progress-fill {
  background: #10b981;
}

.progress-bar.progress-good .progress-fill {
  background: #3b82f6;
}

.progress-bar.progress-medium .progress-fill {
  background: #f59e0b;
}

.progress-bar.progress-low .progress-fill {
  background: #ef4444;
}

.progress-percentage {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 40px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-view {
  background: #0ea5e9;
  color: white;
}

.btn-view:hover {
  background: #0284c7;
  transform: translateY(-1px);
}

/* 计划信息卡片 */
.plan-info-card {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 24px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.btn-back {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #e2e8f0;
  color: #475569;
}

.plan-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  color: #64748b;
  font-size: 14px;
}

.students-progress-container {
  margin-top: 24px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-large {
  max-width: 900px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.dialog-body {
  padding: 24px;
}

.student-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-overview {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.progress-overview h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.overview-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.overview-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 500;
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e90ff;
}

.tasks-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.tasks-section h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
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

.task-progress-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  min-width: 60px;
}

.progress-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.progress-count {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  min-width: 60px;
}

.mini-progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: #1e90ff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}
</style>

