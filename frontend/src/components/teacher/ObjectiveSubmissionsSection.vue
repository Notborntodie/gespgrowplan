<template>
  <BaseTeacherSection title="客观题提交">
    <template #filters>
      <div class="level-filter">
        <label>考级筛选：</label>
        <select v-model="selectedLevel" @change="handleLevelChange" class="level-select">
          <option value="">全部考级</option>
          <option v-for="level in [1, 2, 3, 4, 5, 6, 7, 8]" :key="level" :value="level">
            {{ level }}级
          </option>
        </select>
      </div>
    </template>
    
    <template #header-right>
      <span class="count-info">共 {{ filteredExams.length }} 个考试</span>
    </template>
    
    <template #content>
      <div v-if="examsLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载考试列表...</p>
      </div>
      <div v-else-if="filteredExams.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无考试</h3>
        <p>当前筛选条件下没有考试</p>
      </div>
      <div v-else class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>考试名称</th>
              <th>考试等级</th>
              <th>考试类型</th>
              <th>总题数</th>
              <th>考试时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="exam in filteredExams" 
              :key="exam.id"
              class="table-row"
              @click="handleExamClick(exam)"
            >
              <td>
                <div class="exam-name-cell">
                  <span class="exam-name-text">{{ exam.name || '未知考试' }}</span>
                </div>
              </td>
              <td>
                <span class="exam-level-badge">{{ exam.level }}级</span>
              </td>
              <td>
                <span class="type-badge" :class="`type-${exam.type || '真题'}`">
                  {{ getTypeText(exam.type) }}
                </span>
              </td>
              <td>
                <span class="question-count">{{ exam.total_questions || 0 }} 题</span>
              </td>
              <td class="date-cell">{{ exam.exam_time || '未设置' }}</td>
              <td>
                <div class="action-buttons" @click.stop>
                  <button @click="handleExamClick(exam)" class="btn-action btn-view" title="查看详情">
                    <span>👀</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </BaseTeacherSection>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BaseTeacherSection from './BaseTeacherSection.vue'

const router = useRouter()

// 从 localStorage 恢复筛选状态
const getInitialSelectedLevel = () => {
  const saved = localStorage.getItem('teacherView_selectedLevel')
  if (!saved || saved === 'null') return null
  const num = Number(saved)
  return isNaN(num) ? saved : num
}

const selectedLevel = ref<number | string | null>(getInitialSelectedLevel())
const exams = ref<any[]>([])
const examsLoading = ref(false)

// 获取用户信息
const userInfo = ref<any>(null)

// 过滤后的考试列表
const filteredExams = computed(() => {
  if (selectedLevel.value === null || selectedLevel.value === '') {
    return exams.value
  }
  return exams.value.filter(exam => exam.level === selectedLevel.value)
})

// 类型文本转换
const getTypeText = (type: string) => {
  return type || '真题'
}

// 处理考级筛选变化
function handleLevelChange() {
  if (selectedLevel.value === null || selectedLevel.value === '') {
    localStorage.setItem('teacherView_selectedLevel', 'null')
  } else {
    localStorage.setItem('teacherView_selectedLevel', String(selectedLevel.value))
  }
  fetchExams()
}

// 获取考试列表
const fetchExams = async () => {
  if (!userInfo.value) {
    console.log('用户信息未加载，跳过获取考试列表')
    return
  }
  
  console.log('开始获取考试列表')
  examsLoading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/exams`)
    console.log('获取考试列表API响应:', response.data)
    
    // 处理不同的响应格式
    let examList = []
    if (response.data.data?.exams) {
      examList = response.data.data.exams
    } else if (response.data.exams) {
      examList = response.data.exams
    } else if (Array.isArray(response.data.data)) {
      examList = response.data.data
    } else if (Array.isArray(response.data)) {
      examList = response.data
    }
    
    exams.value = examList
    console.log('考试列表更新完成，考试数量:', examList.length)
  } catch (error: any) {
    console.error('获取考试列表失败:', error)
    console.error('错误详情:', error.response?.data)
    alert('获取考试列表失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
  } finally {
    examsLoading.value = false
  }
}

// 处理考试点击
function handleExamClick(exam: any) {
  if (!userInfo.value) {
    console.log('用户信息未加载，无法跳转')
    return
  }
  
  // 保存当前状态
  if (selectedLevel.value !== null && selectedLevel.value !== '') {
    localStorage.setItem('teacherView_selectedLevel', String(selectedLevel.value))
  }
  
  // 跳转到 StudentSubmissionsView
  router.push({
    path: `/teacher/${userInfo.value.id}/submissions`,
    query: { 
      exam_id: exam.id.toString(),
      fromSection: 'objective-submissions',
      fromTeacherView: 'true'
    }
  })
}

// 获取用户信息
const getUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
}

onMounted(() => {
  getUserInfo()
  if (userInfo.value) {
    fetchExams()
  }
})

// 监听用户信息变化
watch(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  return userInfoStr ? JSON.parse(userInfoStr) : null
}, (newUserInfo) => {
  if (newUserInfo && !userInfo.value) {
    userInfo.value = newUserInfo
    fetchExams()
  }
}, { immediate: true })
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

.count-info {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
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

.empty-icon {
  font-size: 64px;
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

.data-table-container {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  width: 100%;
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

.exam-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.exam-level-badge {
  font-weight: 600;
  color: #1e90ff;
  font-size: 14px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.type-真题 {
  background: #e0f7fa;
  color: #1e90ff;
}

.type-模拟 {
  background: #fef3c7;
  color: #d97706;
}

.type-专项 {
  background: #d1fae5;
  color: #065f46;
}

.question-count {
  font-weight: 500;
  color: #1e293b;
}

.date-cell {
  color: #64748b;
  font-size: 13px;
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
</style>

