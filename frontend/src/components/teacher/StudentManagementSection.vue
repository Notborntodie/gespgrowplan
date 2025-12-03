<template>
  <BaseTeacherSection title="学生管理">
    <template #filters>
      <div class="search-box">
        <input 
          v-model="studentSearchQuery" 
          type="text" 
          placeholder="搜索学生用户名或真实姓名..."
          class="search-input"
        />
        <Icon name="search" :size="18" class="search-icon" />
      </div>
    </template>
    
    <template #header-right>
      <span class="count-info">共 {{ filteredStudents.length }} 个学生</span>
      <div class="header-actions">
        <button @click="$emit('bind-student')" class="btn-secondary">
          <Icon name="plus" :size="18" />
          绑定学生
        </button>
        <button @click="$emit('batch-create-student')" class="btn-secondary">
          <Icon name="users" :size="18" />
          批量导入
        </button>
        <button @click="$emit('create-student')" class="btn-primary">
          <Icon name="plus" :size="18" />
          创建学生
        </button>
      </div>
    </template>
    
    <template #content>
      <div v-if="studentsLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载学生列表...</p>
      </div>
      <div v-else-if="filteredStudents.length === 0" class="empty-state">
        <Icon name="user" :size="64" class="empty-icon" />
        <h3>暂无学生</h3>
        <p>当前筛选条件下没有学生</p>
      </div>
      <div v-else class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>学生姓名</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>总提交次数</th>
              <th>正确率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="student in filteredStudents" 
              :key="student.id"
              class="table-row"
              @click="$emit('view-student', student)"
            >
              <td>
                <div class="student-name-cell">
                  <span class="student-name-text">{{ student.real_name || student.username || '未知学生' }}</span>
                </div>
              </td>
              <td>
                <span class="username-text">@{{ student.username }}</span>
              </td>
              <td>
                <span class="email-text">{{ student.email || '未设置' }}</span>
              </td>
              <td>
                <span class="submission-count">{{ student.total_submissions || 0 }}</span>
              </td>
              <td>
                <span class="accuracy-rate" :class="getAccuracyClass(student.accuracy_rate)">
                  {{ student.accuracy_rate || 0 }}%
                </span>
              </td>
              <td>
                <div class="action-buttons" @click.stop>
                  <button @click="$emit('view-student', student)" class="btn-action btn-view" title="查看详情">
                    <Icon name="eye" :size="18" />
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseTeacherSection from './BaseTeacherSection.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  students: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  'bind-student': []
  'create-student': []
  'batch-create-student': []
  'view-student': [student: any]
}>()

const studentSearchQuery = ref('')

// 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!studentSearchQuery.value.trim()) {
    return props.students
  }
  
  const query = studentSearchQuery.value.toLowerCase().trim()
  return props.students.filter(student => {
    const username = (student.username || '').toLowerCase()
    const realName = (student.real_name || '').toLowerCase()
    return username.includes(query) || realName.includes(query)
  })
})

// 获取正确率等级样式
function getAccuracyClass(accuracy: number) {
  if (accuracy >= 90) return 'excellent'
  if (accuracy >= 80) return 'good'
  if (accuracy >= 60) return 'pass'
  return 'fail'
}
</script>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 12px 16px 12px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
  font-size: 16px;
  pointer-events: none;
}

.count-info {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2);
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
  display: flex;
  justify-content: center;
  align-items: center;
  color: #64748b;
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

.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.username-text {
  color: #64748b;
  font-size: 14px;
}

.email-text {
  color: #64748b;
  font-size: 14px;
}

.submission-count {
  font-weight: 600;
  color: #1e293b;
}

.accuracy-rate {
  font-weight: 600;
  font-size: 14px;
}

.accuracy-rate.excellent {
  color: #22c55e;
}

.accuracy-rate.good {
  color: #3b82f6;
}

.accuracy-rate.pass {
  color: #f59e0b;
}

.accuracy-rate.fail {
  color: #ef4444;
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
</style>

