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
      <div class="header-right-content" :class="{ collapsed: hasPanel }">
        <span class="count-info">共 {{ filteredStudents.length }} 个学生</span>
        <div class="header-actions">
          <button @click="$emit('bind-student')" class="btn-secondary">
            <Icon name="plus" :size="18" />
            绑定学生
          </button>
          <button @click="$emit('batch-create-student')" class="btn-secondary">
            <Icon name="users" :size="18" />
            批量创建学生
          </button>
          <button @click="$emit('create-student')" class="btn-primary">
            <Icon name="plus" :size="18" />
            创建学生
          </button>
        </div>
      </div>
    </template>
    
    <template #content>
      <div v-if="loading" class="loading-state">
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="student in filteredStudents" 
              :key="student.id"
              class="table-row"
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
                <div class="action-buttons" @click.stop>
                  <button @click="$emit('view-plan-progress', student)" class="btn-action btn-view-plan" title="查看计划完成">
                    <Icon name="book-open" :size="16" />
                    <span>查看计划完成</span>
                  </button>
                  <button @click="$emit('manage-plans', student)" class="btn-action btn-manage-plans" title="增加/删除计划">
                    <Icon name="settings" :size="16" />
                    <span>增加/删除计划</span>
                  </button>
                  <button @click="$emit('unbind-student', student)" class="btn-action btn-unbind" title="解除绑定">
                    <Icon name="user-x" :size="16" />
                    <span>解除绑定</span>
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
  hasPanel?: boolean
}>()

const emit = defineEmits<{
  'bind-student': []
  'create-student': []
  'batch-create-student': []
  'view-plan-progress': [student: any]
  'manage-plans': [student: any]
  'unbind-student': [student: any]
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
</script>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 16px 20px 16px 48px;
  border: 3px solid #87ceeb;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  width: 300px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
}

.search-input:focus {
  outline: none;
  border-color: #1e90ff;
  border-width: 4px;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
  transform: scale(1.02);
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #1e90ff;
  font-size: 20px;
  pointer-events: none;
}

.header-right-content {
  display: flex;
  align-items: center;
  gap: 16px;
  transition: opacity 0.3s ease, max-width 0.3s ease, visibility 0.3s ease;
  overflow: hidden;
  max-width: 1000px;
}

.header-right-content.collapsed {
  max-width: 0;
  opacity: 0;
  visibility: hidden;
  gap: 0;
  margin: 0;
  padding: 0;
}

.header-right-content.collapsed * {
  display: none;
}

.count-info {
  color: #0369a1;
  font-size: 16px;
  font-weight: 700;
  padding: 8px 16px;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  border-radius: 12px;
  border: 2px solid #87ceeb;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: 3px solid white;
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  color: #0369a1;
  border: 3px solid #87ceeb;
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #0c4a6e;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
  border-color: #1e90ff;
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
  width: 48px;
  height: 48px;
  border: 5px solid #dbeafe;
  border-top: 5px solid #1e90ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
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
  font-size: 80px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #87ceeb;
  filter: drop-shadow(0 4px 8px rgba(30, 144, 255, 0.3));
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #0c4a6e;
  font-size: 24px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.empty-state p {
  margin: 0;
  color: #0369a1;
  font-size: 18px;
  font-weight: 600;
}

.data-table-container {
  background: linear-gradient(135deg, #cce5ff 0%, #e0f2fe 50%, #ffffff 100%);
  border-radius: 0 0 16px 16px;
  border: none;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
  box-shadow: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  border-spacing: 0;
}

.data-table thead {
  background: linear-gradient(135deg, #87ceeb 0%, #b3d9ff 50%, #cce5ff 100%);
  box-shadow: none;
  border-top: none;
  margin: 0;
  padding: 0;
  display: table-header-group;
}

.data-table th {
  padding: 20px;
  padding-top: 20px;
  text-align: left;
  font-weight: 800;
  font-size: 16px;
  color: white;
  white-space: nowrap;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
  border-top: none;
}

.data-table td {
  padding: 20px;
  border-top: 2px solid #b3d9ff;
  font-size: 15px;
  color: #0c4a6e;
  font-weight: 600;
}

.table-row {
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
}

.table-row:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
}

.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name-text {
  font-weight: 800;
  color: #0c4a6e;
  font-size: 16px;
}

.username-text {
  color: #0369a1;
  font-size: 15px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 10px 16px;
  border: 2px solid white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-view-plan {
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: white;
}

.btn-view-plan:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

.btn-manage-plans {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.btn-manage-plans:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-unbind {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

.btn-unbind:hover {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
</style>

