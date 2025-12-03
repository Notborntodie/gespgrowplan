<template>
    <div class="plan-management">
      <div class="section-header">
        <h2>学习计划管理</h2>
        <button v-if="mode === 'admin'" @click="showCreateDialog = true" class="btn btn-primary">
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
                  <!-- 管理后台模式：显示所有操作按钮 -->
                  <template v-if="mode === 'admin'">
                    <button @click="viewPlan(plan.id)" class="btn-action btn-view" title="查看详情">
                      <Icon name="eye" :size="18" />
                    </button>
                    <button @click="editPlan(plan.id)" class="btn-action btn-edit" title="编辑">
                      <Icon name="edit" :size="18" />
                    </button>
                    <button @click="togglePlanStatus(plan)" class="btn-action btn-toggle" :title="plan.is_active ? '停用' : '激活'">
                      <Icon :name="plan.is_active ? 'toggle-right' : 'toggle-left'" :size="18" />
                    </button>
                    <button @click="copyPlan(plan)" class="btn-action btn-copy" title="复制">
                      <Icon name="copy" :size="18" />
                    </button>
                    <button @click="deletePlan(plan.id)" class="btn-action btn-delete" title="删除">
                      <Icon name="trash-2" :size="18" />
                    </button>
                  </template>
                  <!-- 教师模式：只显示添加学生按钮 -->
                  <template v-else>
                    <button @click="openAddStudentsDialog(plan)" class="btn-action btn-add-students" title="添加学生">
                      <Icon name="user-plus" :size="18" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
  
        <div v-else class="empty-state">
          <Icon name="inbox" :size="64" class="empty-icon" />
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

      <!-- 添加学生对话框 -->
      <div v-if="showAddStudentsDialog" class="dialog-overlay" @click="showAddStudentsDialog = false">
        <div class="dialog add-students-dialog" @click.stop>
          <div class="dialog-header">
            <h3>添加学生到计划: {{ selectedPlanForStudents?.name }}</h3>
            <button @click="showAddStudentsDialog = false" class="btn-close">&times;</button>
          </div>
          <div class="dialog-body">
            <div v-if="loadingStudents" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>加载学生列表...</p>
            </div>
            <div v-else-if="teacherStudents.length === 0" class="empty-state">
              <p>暂无绑定的学生</p>
            </div>
            <div v-else class="students-list">
              <div class="select-all">
                <label>
                  <input type="checkbox" v-model="selectAllStudents" @change="toggleSelectAll" />
                  全选
                </label>
              </div>
              <div class="student-item" v-for="student in teacherStudents" :key="student.id">
                <label>
                  <input type="checkbox" v-model="selectedStudentIds" :value="student.id" />
                  {{ student.real_name || student.username }} ({{ student.username }})
                </label>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button @click="showAddStudentsDialog = false" class="btn btn-secondary">取消</button>
            <button @click="addStudentsToPlan" class="btn btn-primary" :disabled="selectedStudentIds.length === 0 || addingStudents">
              {{ addingStudents ? '添加中...' : `添加 (${selectedStudentIds.length})` }}
            </button>
          </div>
        </div>
      </div>

      <!-- 成功消息弹窗 -->
      <SuccessMessageDialog 
        :visible="showSuccessDialog" 
        :message="successMessage"
        @close="showSuccessDialog = false"
      />
    </div>
  </template>
  
  <script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import CreatePlanDialog from './Dialog/CreatePlanDialog.vue'
import PlanDetailDialog from './Dialog/PlanDetailDialog.vue'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'
import Icon from '@/components/Icon.vue'

import { BASE_URL } from '@/config/api'

// Props
const props = withDefaults(defineProps<{
  mode?: 'admin' | 'teacher'
}>(), {
  mode: 'admin'
})

const selectedLevel = ref('')
const selectedStatus = ref('1') // 默认显示激活的计划
const plans = ref<any[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const editingPlan = ref<any>(null)
const viewingPlanId = ref<number | null>(null)

// 教师模式：添加学生相关
const showAddStudentsDialog = ref(false)
const selectedPlanForStudents = ref<any>(null)
const teacherStudents = ref<any[]>([])
const selectedStudentIds = ref<number[]>([])
const loadingStudents = ref(false)
const addingStudents = ref(false)
const selectAllStudents = computed({
  get: () => selectedStudentIds.value.length === teacherStudents.value.length && teacherStudents.value.length > 0,
  set: () => {}
})

// 获取用户信息
const userInfo = ref<any>(null)

// 成功消息弹窗
const showSuccessDialog = ref(false)
const successMessage = ref('')

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessDialog.value = true
}

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
          review_content_type: task.review_content_type || 'text',
          review_video_url: task.review_video_url,
          start_time: task.start_time,
          end_time: task.end_time,
          task_order: task.task_order,
          is_exam_mode: task.is_exam_mode || false,
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

// 复制计划
async function copyPlan(plan: any) {
  const newName = prompt('请输入新计划名称（留空则自动添加"(副本)"后缀）：', `${plan.name}(副本)`)
  if (newName === null) return // 用户取消
  
  try {
    const params: any = {}
    if (newName.trim()) {
      params.name = newName.trim()
    }
    await axios.post(`${BASE_URL}/learning-plans/${plan.id}/copy`, params)
    alert('计划复制成功')
    fetchPlans()
  } catch (error: any) {
    console.error('复制计划失败:', error)
    alert('复制计划失败: ' + (error.response?.data?.error || error.message))
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

// 教师模式：打开添加学生弹窗
async function openAddStudentsDialog(plan: any) {
  selectedPlanForStudents.value = plan
  selectedStudentIds.value = []
  showAddStudentsDialog.value = true
  
  // 加载教师的学生列表
  loadingStudents.value = true
  try {
    const teacherId = userInfo.value?.id
    if (!teacherId) {
      alert('无法获取教师信息')
      return
    }
    const response = await axios.get(`${BASE_URL}/teacher/${teacherId}/students`)
    // 处理不同的响应格式
    let studentList = []
    if (response.data.data?.students) {
      studentList = response.data.data.students
    } else if (response.data.students) {
      studentList = response.data.students
    } else if (Array.isArray(response.data.data)) {
      studentList = response.data.data
    } else if (Array.isArray(response.data)) {
      studentList = response.data
    }
    teacherStudents.value = studentList
  } catch (error: any) {
    console.error('获取学生列表失败:', error)
    alert('获取学生列表失败')
  } finally {
    loadingStudents.value = false
  }
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectedStudentIds.value.length === teacherStudents.value.length) {
    selectedStudentIds.value = []
  } else {
    selectedStudentIds.value = teacherStudents.value.map((s: any) => s.id)
  }
}

// 添加学生到计划
async function addStudentsToPlan() {
  if (selectedStudentIds.value.length === 0) return
  
  addingStudents.value = true
  try {
    const teacherId = userInfo.value?.id
    const planId = selectedPlanForStudents.value?.id
    
    const response = await axios.post(`${BASE_URL}/teacher/${teacherId}/learning-plans/${planId}/add-students`, {
      student_ids: selectedStudentIds.value
    })
    
    if (response.data.success) {
      const results = response.data.data?.results || response.data.results || []
      const successCount = results.filter((r: any) => r.status === 'success').length
      const alreadyJoinedCount = results.filter((r: any) => r.status === 'already_joined').length
      
      let message = ''
      if (results.length > 0) {
        message = `添加完成！成功添加: ${successCount} 个学生`
        if (alreadyJoinedCount > 0) {
          message += `，已在计划中: ${alreadyJoinedCount} 个`
        }
      } else {
        message = `成功添加 ${selectedStudentIds.value.length} 个学生到计划`
      }
      showAddStudentsDialog.value = false
      showSuccess(message)
    } else if (response.data.message) {
      showAddStudentsDialog.value = false
      showSuccess(response.data.message)
    }
  } catch (error: any) {
    console.error('添加学生失败:', error)
    alert('添加学生失败: ' + (error.response?.data?.error || error.message))
  } finally {
    addingStudents.value = false
  }
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
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

  .btn-copy {
    background: #10b981;
    color: white;
  }
  
  .btn-copy:hover {
    background: #059669;
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

  .btn-add-students {
    background: #6366f1;
    color: white;
  }
  
  .btn-add-students:hover {
    background: #4f46e5;
    transform: translateY(-1px);
  }

  /* 添加学生弹窗样式 */
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
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
  }

  .dialog-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #1e293b;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .students-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .select-all {
    padding: 8px 12px;
    background: #f1f5f9;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .student-item {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .student-item label,
  .select-all label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .student-item input[type="checkbox"],
  .select-all input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
  </style>
  
  