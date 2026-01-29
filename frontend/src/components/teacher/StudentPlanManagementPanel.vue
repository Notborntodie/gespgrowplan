<template>
  <div class="student-plan-management-panel">
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
      <p>正在加载计划信息...</p>
    </div>

    <!-- 内容区域 -->
    <div v-else class="panel-content">
      <!-- 已加入的计划 -->
      <div class="section">
        <h4 class="section-title">已加入的计划 ({{ joinedPlans.length }})</h4>
        <div v-if="joinedPlans.length === 0" class="empty-plans">
          <Icon name="book-open" :size="32" class="empty-icon" />
          <p>该学生尚未加入任何学习计划</p>
        </div>
        <div v-else class="plans-list">
          <div 
            v-for="plan in joinedPlans" 
            :key="plan.id" 
            class="plan-item joined"
          >
            <div class="plan-info">
              <div class="plan-name-row">
                <h5 class="plan-name">{{ plan.name }}</h5>
                <span class="plan-level-badge">GESP {{ plan.level }}级</span>
              </div>
              <div class="plan-meta-info">
                <span class="meta-item">
                  <Icon name="calendar" :size="12" />
                  开始: {{ formatDate(plan.start_time) }}
                </span>
                <span class="meta-item">
                  <Icon name="calendar" :size="12" />
                  结束: {{ formatDate(plan.end_time) }}
                </span>
              </div>
            </div>
            <button 
              @click="removeFromPlan(plan.id)" 
              class="btn-remove-plan"
              :disabled="removingPlanId === plan.id"
            >
              <Icon name="x" :size="14" />
              {{ removingPlanId === plan.id ? '移除中...' : '移除' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 可加入的计划 -->
      <div class="section">
        <h4 class="section-title">可加入的计划 ({{ availablePlans.length }})</h4>
        <div v-if="availablePlans.length === 0" class="empty-plans">
          <Icon name="book" :size="32" class="empty-icon" />
          <p>暂无可加入的学习计划</p>
        </div>
        <div v-else class="plans-list">
          <div 
            v-for="plan in availablePlans" 
            :key="plan.id" 
            class="plan-item available"
          >
            <div class="plan-info">
              <div class="plan-name-row">
                <h5 class="plan-name">{{ plan.name }}</h5>
                <span class="plan-level-badge">GESP {{ plan.level }}级</span>
              </div>
              <div class="plan-meta-info">
                <span class="meta-item">
                  <Icon name="calendar" :size="12" />
                  开始: {{ formatDate(plan.start_time) }}
                </span>
                <span class="meta-item">
                  <Icon name="calendar" :size="12" />
                  结束: {{ formatDate(plan.end_time) }}
                </span>
              </div>
            </div>
            <button 
              @click="addToPlan(plan.id)" 
              class="btn-add-plan"
              :disabled="addingPlanId === plan.id"
            >
              <Icon name="plus" :size="14" />
              {{ addingPlanId === plan.id ? '添加中...' : '加入' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 成功消息弹窗 -->
    <SuccessMessageDialog 
      :visible="showSuccessDialog" 
      :message="successMessage"
      @close="closeSuccessDialog"
    />
    
    <!-- 确认对话框 -->
    <ConfirmDialog 
      :visible="showConfirmDialog"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirmRemove"
      @cancel="closeConfirmDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import Icon from '@/components/Icon.vue'
import SuccessMessageDialog from '@/components/admin/Dialog/SuccessMessageDialog.vue'
import ConfirmDialog from '@/components/admin/Dialog/ConfirmDialog.vue'
import { BASE_URL } from '@/config/api'

const props = defineProps<{
  studentId: number | null
  studentInfo: any
  teacherId: number
}>()

const emit = defineEmits<{
  'close': []
  'plan-updated': []
}>()

// 所有计划列表
const allPlans = ref<any[]>([])
// 学生已加入的计划ID列表
const joinedPlanIds = ref<number[]>([])
const loading = ref(false)
const addingPlanId = ref<number | null>(null)
const removingPlanId = ref<number | null>(null)

// 成功消息弹窗
const showSuccessDialog = ref(false)
const successMessage = ref('')

// 确认对话框
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const planIdToRemove = ref<number | null>(null)

// 已加入的计划
const joinedPlans = computed(() => {
  return allPlans.value.filter(plan => joinedPlanIds.value.includes(plan.id))
})

// 可加入的计划
const availablePlans = computed(() => {
  return allPlans.value.filter(plan => !joinedPlanIds.value.includes(plan.id))
})

// 显示成功消息
const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessDialog.value = true
}

// 关闭成功消息弹窗
const closeSuccessDialog = () => {
  showSuccessDialog.value = false
}

// 关闭确认对话框
const closeConfirmDialog = () => {
  showConfirmDialog.value = false
  planIdToRemove.value = null
}

// 处理确认移除
const handleConfirmRemove = async () => {
  if (planIdToRemove.value === null) return
  await performRemoveFromPlan(planIdToRemove.value)
  closeConfirmDialog()
}

// 获取所有计划列表
const fetchAllPlans = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/learning-plans/all`, {
      params: {
        is_active: 1
      }
    })
    
    if (response.data.success) {
      allPlans.value = response.data.data || []
    } else {
      console.error('获取计划列表失败:', response.data.message)
      allPlans.value = []
    }
  } catch (error: any) {
    console.error('获取计划列表失败:', error)
    allPlans.value = []
  } finally {
    loading.value = false
  }
}

// 获取学生已加入的计划
const fetchStudentPlans = async () => {
  if (!props.studentId) return

  try {
    const response = await axios.get(`${BASE_URL}/learning-plans/my-plans`, {
      params: {
        user_id: props.studentId
      }
    })

    if (response.data.success) {
      const plans = response.data.data || []
      joinedPlanIds.value = plans.map((plan: any) => plan.id)
    } else {
      console.error('获取学生计划列表失败:', response.data.message)
      joinedPlanIds.value = []
    }
  } catch (error: any) {
    console.error('获取学生计划列表失败:', error)
    joinedPlanIds.value = []
  }
}

// 添加学生到计划
const addToPlan = async (planId: number) => {
  if (!props.studentId || !props.teacherId) return

  addingPlanId.value = planId
  try {
    const response = await axios.post(
      `${BASE_URL}/teacher/${props.teacherId}/learning-plans/${planId}/add-students`,
      {
        student_ids: [props.studentId]
      }
    )

    if (response.data.success) {
      // 刷新学生计划列表
      await fetchStudentPlans()
      // 通知父组件更新
      emit('plan-updated')
      // 获取计划名称用于显示
      const plan = allPlans.value.find(p => p.id === planId)
      const planName = plan ? plan.name : '计划'
      showSuccess(`成功将学生添加到"${planName}"！`)
    } else {
      alert('添加失败: ' + (response.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('添加学生到计划失败:', error)
    alert('添加失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
  } finally {
    addingPlanId.value = null
  }
}

// 从计划中移除学生（显示确认弹窗）
const removeFromPlan = (planId: number) => {
  if (!props.studentId || !props.teacherId) return

  // 获取计划名称用于显示
  const plan = allPlans.value.find(p => p.id === planId)
  const planName = plan ? plan.name : '计划'
  
  planIdToRemove.value = planId
  confirmTitle.value = '确认移除'
  confirmMessage.value = `确定要将该学生从"${planName}"中移除吗？`
  showConfirmDialog.value = true
}

// 执行移除操作
const performRemoveFromPlan = async (planId: number) => {
  if (!props.studentId || !props.teacherId) return

  removingPlanId.value = planId
  try {
    const response = await fetch(
      `${BASE_URL}/teacher/${props.teacherId}/learning-plans/${planId}/remove-students`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_ids: [props.studentId]
        })
      }
    )

    const result = await response.json()

    if (result.success) {
      // 刷新学生计划列表
      await fetchStudentPlans()
      // 通知父组件更新
      emit('plan-updated')
      // 获取计划名称用于显示
      const plan = allPlans.value.find(p => p.id === planId)
      const planName = plan ? plan.name : '计划'
      showSuccess(`成功将学生从"${planName}"中移除！`)
    } else {
      alert('移除失败: ' + (result.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('从计划中移除学生失败:', error)
    alert('移除失败: ' + (error.message || '未知错误'))
  } finally {
    removingPlanId.value = null
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

// 监听学生ID变化，重新加载数据
watch(() => props.studentId, async (newStudentId) => {
  if (newStudentId) {
    await Promise.all([
      fetchAllPlans(),
      fetchStudentPlans()
    ])
  } else {
    allPlans.value = []
    joinedPlanIds.value = []
  }
}, { immediate: true })
</script>

<style scoped>
.student-plan-management-panel {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(30, 144, 255, 0.3) transparent;
}

.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(30, 144, 255, 0.3);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(30, 144, 255, 0.5);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  color: #0c4a6e;
  font-size: 20px;
  font-weight: 900;
  padding-bottom: 12px;
  border-bottom: 4px solid #87ceeb;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.empty-plans {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 8px;
}

.empty-plans p {
  margin: 0;
  font-size: 14px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 20px;
  border: 4px solid #b3d9ff;
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
}

.plan-item.joined {
  border-color: #4ade80;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.25);
}

.plan-item.available {
  border-color: #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.25);
}

.plan-item:hover {
  box-shadow: 0 10px 30px rgba(30, 144, 255, 0.3);
  transform: translateY(-4px) scale(1.02);
}

.plan-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-name {
  margin: 0;
  color: #0c4a6e;
  font-size: 18px;
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

.plan-meta-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 12px;
}

.btn-add-plan,
.btn-remove-plan {
  padding: 12px 20px;
  border: 3px solid white;
  border-radius: 16px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-add-plan {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.btn-add-plan:hover:not(:disabled) {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.5);
}

.btn-remove-plan {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

.btn-remove-plan:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

.btn-add-plan:disabled,
.btn-remove-plan:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>

