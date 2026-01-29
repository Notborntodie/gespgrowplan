<template>
  <div class="admin-plan-progress">
    <div class="section-header">
      <h2>计划完成</h2>
      <div class="filters">
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
      </div>
    </div>

    <div class="content-area">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 任务完成页面 -->
      <div v-else-if="selectedPlan && selectedTask">
        <!-- 计划信息 -->
        <div class="plan-info-card">
          <div class="plan-header">
            <h3>{{ selectedPlan.name }} - {{ selectedTask.task_name }}</h3>
            <button @click="selectedTask = null" class="btn-back">← 返回任务列表</button>
          </div>
          <div class="plan-meta">
            <span class="meta-item">级别: GESP {{ selectedPlan.level }}级</span>
            <span class="meta-item">任务顺序: {{ selectedTask.task_order }}</span>
          </div>
        </div>

        <!-- 学生完成情况列表 -->
        <div v-if="studentsLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载学生完成情况...</span>
        </div>

        <div v-else-if="taskStudents.length > 0" class="students-progress-container">
          <!-- 导出按钮 -->
          <div class="export-actions">
            <button 
              @click="exportTaskProgress(selectedTask)" 
              class="btn-action btn-export"
              title="导出学生完成情况"
            >
              <Icon name="download" :size="16" />
              导出学生完成情况
            </button>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>学生姓名</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>绑定状态</th>
                  <th>任务完成状态</th>
                  <th>客观题进度</th>
                  <th>OJ题进度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in sortedTaskStudents" :key="student.student_id" class="table-row">
                  <td class="student-name-cell">
                    <div class="student-name-text">{{ student.real_name || student.username }}</div>
                  </td>
                  <td>
                    <span class="username-text">@{{ student.username }}</span>
                  </td>
                  <td>
                    <span class="email-text">{{ student.email || '-' }}</span>
                  </td>
                  <td>
                    <span 
                      class="bind-badge" 
                      :class="student.is_bound ? 'bound' : 'unbound'"
                    >
                      {{ student.is_bound ? '已绑定' : '未绑定' }}
                    </span>
                  </td>
                  <td>
                    <span 
                      class="status-badge" 
                      :class="isCompleted(student.task_progress?.is_completed) ? 'completed' : 'in-progress'"
                    >
                      {{ isCompleted(student.task_progress?.is_completed) ? '已完成' : '进行中' }}
                    </span>
                  </td>
                  <td>
                    <div class="progress-info">
                      <span class="progress-text">
                        {{ formatTaskProgress(student, 'exam') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="progress-info">
                      <span class="progress-text">
                        {{ formatTaskProgress(student, 'oj') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button 
                      @click="viewTaskStudentDetail(student)" 
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
          <p>该任务下暂无学生</p>
        </div>
      </div>

      <!-- 任务列表页面 -->
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

        <!-- 统计摘要 -->
        <div class="summary-card">
          <div class="summary-item">
            <div class="summary-label">总学生数</div>
            <div class="summary-value">{{ summary.total_students }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已绑定学生</div>
            <div class="summary-value bound">{{ summary.bound_students }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">未绑定学生</div>
            <div class="summary-value unbound">{{ summary.unbound_students }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已完成计划</div>
            <div class="summary-value completed">{{ summary.completed_students }}</div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div v-if="tasksLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载任务列表...</span>
        </div>

        <div v-else-if="tasks.length > 0" class="tasks-progress-container">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>任务名称</th>
                  <th>任务顺序</th>
                  <th>客观题数量</th>
                  <th>OJ题数量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in tasks" :key="task.task_id" class="table-row">
                  <td class="task-name-cell">
                    <div class="task-name-text">{{ task.task_name }}</div>
                  </td>
                  <td>
                    <span class="task-order-badge">{{ task.task_order }}</span>
                  </td>
                  <td>
                    <span class="count-badge">{{ task.exam_total || 0 }}</span>
                  </td>
                  <td>
                    <span class="count-badge">{{ task.oj_total || 0 }}</span>
                  </td>
                  <td>
                    <button 
                      @click="viewTaskProgress(task)" 
                      class="btn-action btn-view"
                    >
                      查看学生完成情况
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>该计划下暂无任务</p>
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
    </div>

    <!-- 任务学生详细完成情况对话框 -->
    <div v-if="showTaskStudentDetailDialog && selectedTaskStudent && selectedTask && selectedPlan" class="dialog-overlay" @click="closeTaskStudentDetailDialog">
      <div class="dialog dialog-xlarge" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedTaskStudent.real_name || selectedTaskStudent.username }} - {{ selectedTask.task_name }} 完成情况</h3>
          <button @click="closeTaskStudentDetailDialog" class="btn-close">&times;</button>
        </div>
        <div class="dialog-body">
          <div v-if="taskStudentDetailLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else-if="taskStudentDetail" class="task-detail-content">
            <!-- 学生信息 -->
            <div class="student-info-section">
              <h4>学生信息</h4>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">学生姓名:</span>
                  <span class="info-value">{{ taskStudentDetail.student.real_name || taskStudentDetail.student.username }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">用户名:</span>
                  <span class="info-value">@{{ taskStudentDetail.student.username }}</span>
                </div>
                <div class="info-row" v-if="taskStudentDetail.student.email">
                  <span class="info-label">邮箱:</span>
                  <span class="info-value">{{ taskStudentDetail.student.email }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">绑定状态:</span>
                  <span class="info-value">
                    <span 
                      class="bind-badge" 
                      :class="taskStudentDetail.student.is_bound ? 'bound' : 'unbound'"
                    >
                      {{ taskStudentDetail.student.is_bound ? '已绑定' : '未绑定' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 任务信息 -->
            <div class="task-info-section">
              <h4>任务信息</h4>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">任务名称:</span>
                  <span class="info-value">{{ taskStudentDetail.task.task_name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">任务完成状态:</span>
                  <span class="info-value">
                    <span 
                      class="status-badge" 
                      :class="isCompleted(taskStudentDetail.task.is_completed) ? 'completed' : 'in-progress'"
                    >
                      {{ isCompleted(taskStudentDetail.task.is_completed) ? '已完成' : '进行中' }}
                    </span>
                  </span>
                </div>
                <div class="info-row" v-if="taskStudentDetail.task.completed_at">
                  <span class="info-label">完成时间:</span>
                  <span class="info-value">{{ formatDate(taskStudentDetail.task.completed_at) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">客观题进度:</span>
                  <span class="info-value">{{ taskStudentDetail.task.exam_completed }}/{{ taskStudentDetail.task.exam_total }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">OJ题进度:</span>
                  <span class="info-value">{{ taskStudentDetail.task.oj_completed }}/{{ taskStudentDetail.task.oj_total }}</span>
                </div>
              </div>
            </div>

            <div class="dialog-actions">
              <button @click="closeTaskStudentDetailDialog" class="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import Icon from '@/components/Icon.vue'
import { BASE_URL } from '@/config/api'

// 用户信息
const userInfo = ref<any>(null)

// 计划相关
const plans = ref<any[]>([])
const selectedPlan = ref<any>(null)
const selectedLevel = ref('')
const loading = ref(false)

// 任务列表
const tasks = ref<any[]>([])
const tasksLoading = ref(false)
const selectedTask = ref<any>(null)

// 任务下的学生完成情况
const taskStudents = ref<any[]>([])
const studentsLoading = ref(false)

// 所有学生数据（从接口获取）
const allStudents = ref<any[]>([])
const summary = ref({
  total_students: 0,
  bound_students: 0,
  unbound_students: 0,
  completed_students: 0
})

// 任务学生详细完成情况
const showTaskStudentDetailDialog = ref(false)
const selectedTaskStudent = ref<any>(null)
const taskStudentDetail = ref<any>(null)
const taskStudentDetailLoading = ref(false)

// 获取用户信息
const getUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
}

// 获取计划列表
const fetchPlans = async () => {
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

// 查看计划完成情况 - 进入任务列表
const viewPlanProgress = async (plan: any, retryCount = 0) => {
  if (!userInfo.value) {
    alert('请先登录')
    return
  }
  
  selectedPlan.value = plan
  selectedTask.value = null
  tasksLoading.value = true
  
  try {
    const teacherId = userInfo.value.id
    
    console.log(`正在获取计划完成情况: planId=${plan.id}, teacherId=${teacherId}`)
    
    const response = await axios.get(
      `${BASE_URL}/teacher/${teacherId}/learning-plans/${plan.id}/all-students-progress`,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('获取学生完成情况响应:', response.data)
    
    if (response.data.success) {
      const data = response.data.data || {}
      allStudents.value = data.students || []
      
      // 更新计划信息
      if (data.plan) {
        selectedPlan.value = { ...selectedPlan.value, ...data.plan }
      }
      
      // 更新统计摘要
      summary.value = data.summary || {
        total_students: allStudents.value.length,
        bound_students: allStudents.value.filter((s: any) => s.is_bound).length,
        unbound_students: allStudents.value.filter((s: any) => !s.is_bound).length,
        completed_students: allStudents.value.filter((s: any) => s.plan_progress?.is_completed).length
      }
      
      // 从学生的 tasks 数组中提取任务列表
      if (allStudents.value.length > 0) {
        const taskMap = new Map()
        allStudents.value.forEach((student: any) => {
          if (student.tasks && Array.isArray(student.tasks)) {
            student.tasks.forEach((task: any) => {
              if (!taskMap.has(task.task_id)) {
                taskMap.set(task.task_id, {
                  task_id: task.task_id,
                  task_name: task.task_name,
                  task_order: task.task_order,
                  exam_total: Number(task.exam_total) || 0,
                  oj_total: Number(task.oj_total) || 0
                })
              }
            })
          }
        })
        tasks.value = Array.from(taskMap.values()).sort((a: any, b: any) => a.task_order - b.task_order)
      } else {
        tasks.value = []
      }
      
      console.log(`成功获取 ${allStudents.value.length} 个学生的完成情况，${tasks.value.length} 个任务`)
    } else {
      const errorMsg = response.data.message || response.data.error || '未知错误'
      console.error('接口返回失败:', errorMsg)
      alert('获取学生完成情况失败: ' + errorMsg)
      allStudents.value = []
      tasks.value = []
    }
  } catch (error: any) {
    console.error('获取学生完成情况失败:', error)
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    })
    
    // 如果是网络错误且重试次数小于2，则重试
    if ((error.code === 'ECONNABORTED' || error.message === 'Network Error') && retryCount < 2) {
      console.log(`网络错误，2秒后重试 (${retryCount + 1}/2)...`)
      setTimeout(() => {
        viewPlanProgress(plan, retryCount + 1)
      }, 2000)
      return
    }
    
    // 如果是404错误，说明接口不存在
    if (error.response?.status === 404) {
      alert('接口不存在，请确认后端已实现该接口: /api/teacher/:teacherId/learning-plans/:planId/all-students-progress')
    } else if (error.response?.status === 403) {
      alert('权限不足，无法访问该接口')
    } else {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '网络错误'
      alert('获取学生完成情况失败: ' + errorMsg + (retryCount > 0 ? ' (已重试)' : ''))
    }
    
    allStudents.value = []
    tasks.value = []
  } finally {
    tasksLoading.value = false
  }
}

// 查看任务完成情况 - 进入学生列表
const viewTaskProgress = async (task: any) => {
  if (!userInfo.value || !selectedPlan.value) return
  
  selectedTask.value = task
  studentsLoading.value = true
  
  try {
    // 从已加载的学生数据中过滤出该任务的学生
    const studentsWithTask = allStudents.value
      .filter((student: any) => {
        if (!student.tasks || !Array.isArray(student.tasks)) return false
        return student.tasks.some((t: any) => t.task_id === task.task_id)
      })
      .map((student: any) => {
        const taskData = student.tasks.find((t: any) => t.task_id === task.task_id)
        return {
          ...student,
          task_progress: {
            is_completed: taskData?.is_completed || false,
            completed_at: taskData?.completed_at || null
          },
          exam_completed: Number(taskData?.exam_completed) || 0,
          exam_total: Number(taskData?.exam_total) || 0,
          oj_completed: Number(taskData?.oj_completed) || 0,
          oj_total: Number(taskData?.oj_total) || 0
        }
      })
    
    taskStudents.value = studentsWithTask
    console.log(`任务 ${task.task_name} 下有 ${taskStudents.value.length} 个学生`)
  } catch (error: any) {
    console.error('获取任务学生完成情况失败:', error)
    alert('获取任务学生完成情况失败: ' + (error.response?.data?.message || error.message))
    taskStudents.value = []
  } finally {
    studentsLoading.value = false
  }
}

// 导出任务学生完成情况
const exportTaskProgress = async (task: any) => {
  if (!userInfo.value || !selectedPlan.value) return
  
  try {
    if (taskStudents.value.length === 0) {
      alert('该任务下暂无学生完成情况')
      return
    }
    
    // 准备 CSV 数据
    let csvContent = '\uFEFF' // BOM for UTF-8
    
    // 表头
    csvContent += '学生姓名,用户名,邮箱,绑定状态,任务完成情况,客观题进度,OJ题进度\n'
    
    // 数据行
    sortedTaskStudents.value.forEach((student: any) => {
      const studentName = (student.real_name || student.username || '').replace(/,/g, '，')
      const username = (student.username || '').replace(/,/g, '，')
      const email = (student.email || '').replace(/,/g, '，')
      const bindStatus = student.is_bound ? '已绑定' : '未绑定'
      const taskStatus = isCompleted(student.task_progress?.is_completed) ? '已完成' : '进行中'
      const examProgress = `完成 ${student.exam_completed || 0}/${student.exam_total || 0}`
      const ojProgress = `完成 ${student.oj_completed || 0}/${student.oj_total || 0}`
      
      csvContent += `${studentName},${username},${email},${bindStatus},${taskStatus},${examProgress},${ojProgress}\n`
    })
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // 生成文件名
    const planName = (selectedPlan.value.name || '计划').replace(/[\/\\:*?"<>|]/g, '_')
    const taskName = (task.task_name || '任务').replace(/[\/\\:*?"<>|]/g, '_')
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `${planName}_${taskName}_学生完成情况_${timestamp}.csv`
    
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('导出成功！文件已下载到您的设备。')
  } catch (error: any) {
    console.error('导出失败:', error)
    alert('导出失败: ' + (error.response?.data?.message || error.message))
  }
}

// 查看任务学生详细完成情况
const viewTaskStudentDetail = async (student: any) => {
  if (!userInfo.value || !selectedPlan.value || !selectedTask.value) return
  
  selectedTaskStudent.value = student
  showTaskStudentDetailDialog.value = true
  taskStudentDetailLoading.value = true
  
  try {
    // 从学生的 tasks 数组中找到该任务的详细信息
    const taskData = student.tasks?.find((t: any) => t.task_id === selectedTask.value.task_id)
    
    if (taskData) {
      taskStudentDetail.value = {
        student: {
          ...student,
          email: student.email || '-'
        },
        task: {
          task_id: taskData.task_id,
          task_name: taskData.task_name,
          task_order: taskData.task_order,
          is_completed: taskData.is_completed,
          completed_at: taskData.completed_at,
          exam_completed: Number(taskData.exam_completed) || 0,
          exam_total: Number(taskData.exam_total) || 0,
          oj_completed: Number(taskData.oj_completed) || 0,
          oj_total: Number(taskData.oj_total) || 0
        }
      }
    } else {
      alert('未找到该学生的任务详细信息')
      taskStudentDetail.value = null
    }
  } catch (error: any) {
    console.error('获取学生详细完成情况失败:', error)
    alert('获取学生详细完成情况失败: ' + (error.response?.data?.message || error.message))
    taskStudentDetail.value = null
  } finally {
    taskStudentDetailLoading.value = false
  }
}

// 关闭任务学生详细完成情况对话框
const closeTaskStudentDetailDialog = () => {
  showTaskStudentDetailDialog.value = false
  selectedTaskStudent.value = null
  taskStudentDetail.value = null
}

// 判断是否完成
const isCompleted = (value: any): boolean => {
  if (value === true || value === 1) return true
  if (value === false || value === 0 || value === null || value === undefined) return false
  if (typeof value === 'string') {
    return value === '1' || value === 'true' || value.toLowerCase() === 'true'
  }
  return false
}

// 格式化任务进度
const formatTaskProgress = (student: any, type: 'exam' | 'oj'): string => {
  if (type === 'exam') {
    const completed = student.exam_completed || 0
    const total = student.exam_total || 0
    return `${completed}/${total}`
  } else {
    const completed = student.oj_completed || 0
    const total = student.oj_total || 0
    return `${completed}/${total}`
  }
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

// 排序后的学生列表（按完成情况排序）
const sortedTaskStudents = computed(() => {
  if (!taskStudents.value || taskStudents.value.length === 0) return []
  
  const students = [...taskStudents.value]
  return students.sort((a: any, b: any) => {
    const completedA = isCompleted(a.task_progress?.is_completed) ? 1 : 0
    const completedB = isCompleted(b.task_progress?.is_completed) ? 1 : 0
    return completedB - completedA // 已完成的在前
  })
})

// 初始化
onMounted(() => {
  getUserInfo()
  if (userInfo.value) {
    fetchPlans()
  }
})

// 监听用户信息变化
watch(userInfo, (newUserInfo) => {
  if (newUserInfo && plans.value.length === 0) {
    fetchPlans()
  }
})
</script>

<style scoped>
.admin-plan-progress {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
}

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
.student-name-cell,
.task-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-name-text,
.student-name-text,
.task-name-text {
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

.task-order-badge {
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

.username-text,
.email-text {
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

.bind-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.bind-badge.bound {
  background: #d1fae5;
  color: #065f46;
}

.bind-badge.unbound {
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
  font-size: 14px;
}

.count-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
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

.btn-export {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-export:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-export :deep(.lucide-icon) {
  color: white;
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

/* 统计摘要卡片 */
.summary-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 20px;
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e90ff;
}

.summary-value.bound {
  color: #10b981;
}

.summary-value.unbound {
  color: #ef4444;
}

.summary-value.completed {
  color: #10b981;
}

.tasks-progress-container {
  margin-top: 24px;
}

.students-progress-container {
  margin-top: 24px;
}

/* 导出操作区域 */
.export-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
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

.dialog-xlarge {
  max-width: 1200px;
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

.task-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.student-info-section,
.task-info-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.student-info-section h4,
.task-info-section h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.info-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
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
