<template>
    <div class="plan-management">
      <div class="section-header">
        <h2>学习计划管理</h2>
        <button @click="showCreateDialog = true" class="btn btn-primary">
          <i class="fas fa-plus"></i> 创建新计划
        </button>
      </div>
  
      <!-- 筛选器 -->
      <div class="filters">
        <div class="filter-group">
          <label>级别筛选：</label>
          <select v-model="selectedLevel" @change="fetchPlans" class="filter-select">
            <option value="">全部级别</option>
            <option value="1">GESP 1级</option>
            <option value="2">GESP 2级</option>
            <option value="3">GESP 3级</option>
            <option value="4">GESP 4级</option>
            <option value="5">GESP 5级</option>
            <option value="6">GESP 6级</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>状态筛选：</label>
          <select v-model="selectedStatus" @change="fetchPlans" class="filter-select">
            <option value="">全部状态</option>
            <option value="1">激活</option>
            <option value="0">停用</option>
          </select>
        </div>
      </div>
  
      <!-- 计划列表 -->
      <div class="plans-table-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>
  
        <table v-else-if="plans.length > 0" class="plans-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>计划名称</th>
              <th>级别</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>任务数量</th>
              <th>激活状态</th>
              <th>时间状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in plans" :key="plan.id">
              <td>{{ plan.id }}</td>
              <td class="title-cell">{{ plan.name }}</td>
              <td>
                <span class="level-badge">GESP {{ plan.level }}级</span>
              </td>
              <td>{{ formatDate(plan.start_time) }}</td>
              <td>{{ formatDate(plan.end_time) }}</td>
              <td>{{ plan.total_tasks || 0 }}</td>
              <td>
                <span class="active-badge" :class="plan.is_active ? 'is-active' : 'is-inactive'">
                  {{ plan.is_active ? '激活' : '停用' }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(plan)">
                  {{ getStatusText(plan) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewPlan(plan.id)" class="btn-action btn-view" title="查看详情">
                    <span class="action-icon">👀</span>
                  </button>
                  <button @click="editPlan(plan.id)" class="btn-action btn-edit" title="编辑">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="togglePlanStatus(plan)" class="btn-action btn-toggle" :title="plan.is_active ? '停用' : '激活'">
                    <i :class="plan.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                  </button>
                  <button @click="deletePlan(plan.id)" class="btn-action btn-delete" title="删除">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
  
        <div v-else class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无学习计划</p>
        </div>
      </div>
  
      <!-- 创建/编辑计划对话框 -->
      <CreatePlanDialog
        :visible="showCreateDialog || showEditDialog"
        :plan="editingPlan"
        @close="handleDialogClose"
        @success="handleSuccess"
      />
  
      <!-- 查看计划详情对话框 -->
      <PlanDetailDialog
        :visible="showDetailDialog"
        :plan-id="viewingPlanId"
        @close="showDetailDialog = false; viewingPlanId = null"
      />
    </div>
  </template>
  
  <script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CreatePlanDialog from './Dialog/CreatePlanDialog.vue'
import PlanDetailDialog from './Dialog/PlanDetailDialog.vue'

import { BASE_URL } from '@/config/api'

const selectedLevel = ref('')
const selectedStatus = ref('1') // 默认显示激活的计划
const plans = ref<any[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const editingPlan = ref<any>(null)
const viewingPlanId = ref<number | null>(null)

// 获取用户信息
const userInfo = ref<any>(null)

// 获取计划列表
async function fetchPlans() {
  loading.value = true
  try {
    // 构建查询参数
    const params: any = {}
    
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    
    if (selectedStatus.value !== '') {
      params.is_active = selectedStatus.value
    }
    
    const response = await axios.get(`${BASE_URL}/learning-plans/all`, { params })
    
    if (response.data.success) {
      plans.value = response.data.data || []
    }
  } catch (error: any) {
    console.error('获取学习计划列表失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '获取学习计划列表失败'
    alert(`获取学习计划列表失败: ${errorMsg}`)
  } finally {
    loading.value = false
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 获取状态样式类
function getStatusClass(plan: any) {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return 'status-upcoming'
  if (now > end) return 'status-ended'
  return 'status-active'
}

// 获取状态文本
function getStatusText(plan: any) {
  const now = new Date()
  const start = new Date(plan.start_time)
  const end = new Date(plan.end_time)
  
  if (now < start) return '未开始'
  if (now > end) return '已结束'
  return '进行中'
}

// 查看计划详情
function viewPlan(id: number) {
  viewingPlanId.value = id
  showDetailDialog.value = true
}

// 编辑计划
async function editPlan(id: number) {
  console.log('🔧 [PlanManagement] 开始编辑计划, ID:', id)
  try {
    // 使用管理员专用 API 获取完整的计划详情（包括所有任务和练习）
    const response = await axios.get(`${BASE_URL}/learning-plans/${id}/admin`)
    console.log('📡 [PlanManagement] 管理员API响应:', response.data)
    
    if (response.data.success) {
      const planData = response.data.data
      
      // 转换数据格式以适配 CreatePlanDialog 组件
      editingPlan.value = {
        id: planData.id,
        name: planData.name,
        description: planData.description,
        level: planData.level,
        start_time: planData.start_time,
        end_time: planData.end_time,
        is_active: planData.is_active,
        tasks: (planData.tasks || []).map((task: any) => ({
          name: task.name,
          description: task.description,
          review_content: task.review_content,
          review_video_url: task.review_video_url,
          start_time: task.start_time,
          end_time: task.end_time,
          task_order: task.task_order,
          // 保留试卷的所有详细信息
          exams: (task.exams || []).map((exam: any) => ({
            exam_id: exam.exam_id,
            exam_order: exam.exam_order,
            exam_name: exam.exam_name,
            exam_level: exam.exam_level,
            exam_type: exam.exam_type,
            total_questions: exam.total_questions
          })),
          // 保留OJ题目的所有详细信息
          oj_problems: (task.oj_problems || []).map((problem: any) => ({
            problem_id: problem.problem_id,
            problem_order: problem.problem_order,
            problem_title: problem.problem_title,
            problem_description: problem.problem_description,
            problem_level: problem.problem_level,
            time_limit: problem.time_limit,
            memory_limit: problem.memory_limit
          }))
        }))
      }
      
      showEditDialog.value = true
      console.log('✅ [PlanManagement] 打开编辑弹窗，计划数据:', editingPlan.value)
      console.log('📋 [PlanManagement] 任务数量:', editingPlan.value.tasks.length)
    } else {
      console.warn('⚠️ [PlanManagement] 响应success为false')
      alert('获取计划详情失败')
    }
  } catch (error: any) {
    console.error('❌ [PlanManagement] 获取计划详情失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '获取计划详情失败'
    alert(`获取计划详情失败: ${errorMsg}`)
  }
}

// 切换计划激活状态
async function togglePlanStatus(plan: any) {
  const action = plan.is_active ? '停用' : '激活'
  if (!confirm(`确定要${action}这个学习计划吗？`)) {
    return
  }
  
  try {
    await axios.put(`${BASE_URL}/learning-plans/${plan.id}`, {
      is_active: plan.is_active ? 0 : 1
    })
    alert(`学习计划${action}成功`)
    fetchPlans()
  } catch (error: any) {
    console.error('修改计划状态失败:', error)
    alert('修改计划状态失败: ' + (error.response?.data?.error || error.message))
  }
}

// 删除计划
async function deletePlan(id: number) {
  if (!confirm('确定要删除这个学习计划吗？此操作不可恢复！')) {
    return
  }
  
  try {
    await axios.delete(`${BASE_URL}/learning-plans/${id}`)
    alert('学习计划删除成功')
    fetchPlans()
  } catch (error: any) {
    console.error('删除学习计划失败:', error)
    alert('删除学习计划失败: ' + (error.response?.data?.error || error.message))
  }
}

// 关闭对话框
function handleDialogClose() {
  showCreateDialog.value = false
  showEditDialog.value = false
  editingPlan.value = null
}

// 成功回调
function handleSuccess() {
  handleDialogClose()
  fetchPlans()
}

onMounted(() => {
  // 获取用户信息
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
  
  fetchPlans()
})
</script>
  
<style scoped>
.plan-management {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
}

.filter-select {
  padding: 8px 16px;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #1e90ff;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
}

.filter-select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.plans-table-container {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
}

.plans-table {
  width: 100%;
  border-collapse: collapse;
}

.plans-table thead {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
}

.plans-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: white;
  white-space: nowrap;
}

.plans-table td {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1e293b;
}

.plans-table tbody tr:hover {
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

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.active-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.active-badge.is-active {
  background: #d1fae5;
  color: #059669;
}

.active-badge.is-inactive {
  background: #fee2e2;
  color: #dc2626;
}
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .btn-action {
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
  }
  
  .btn-view {
    background: #0ea5e9;
    color: white;
  }
  
  .btn-view:hover {
    background: #0284c7;
    transform: translateY(-1px);
  }
  
  .btn-edit {
    background: #f59e0b;
    color: white;
  }
  
  .btn-edit:hover {
    background: #d97706;
    transform: translateY(-1px);
  }
  
  .btn-toggle {
    background: #8b5cf6;
    color: white;
  }
  
  .btn-toggle:hover {
    background: #7c3aed;
    transform: translateY(-1px);
  }

  .btn-delete {
    background: #ef4444;
    color: white;
  }
  
  .btn-delete:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
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
  
  .loading-state p {
    font-size: 16px;
    font-weight: 500;
    color: #64748b;
  }
  
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
  </style>
  
  