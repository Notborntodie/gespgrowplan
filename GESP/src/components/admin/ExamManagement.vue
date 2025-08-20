<template>
  <div class="content-section">
    <div class="exams-header">
      <div class="header-left">
        <h2>考试管理</h2>
        <span class="exam-count">共 {{ exams.length }} 场考试</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索考试名称..." 
            class="search-input"
          />
          <i class="search-icon">🔍</i>
        </div>
        <div class="filter-dropdown">
          <select v-model="filterLevel" class="filter-select">
            <option value="">全部等级</option>
            <option value="1">GESP 1级</option>
            <option value="2">GESP 2级</option>
            <option value="3">GESP 3级</option>
                                <option value="4">GESP 4级</option>
                    <option value="5">GESP 5级</option>
                    <option value="6">CSP-J</option>
                  </select>
        </div>
        
      </div>
    </div>

    <div class="exams-list-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载考试列表...</p>
      </div>
      <div v-else class="exams-list">
        <div 
          v-for="exam in filteredExams" 
          :key="exam.id" 
          class="exam-item elevate-card"
          @click="toggleExamExpansion(exam.id)"
        >
          <div class="exam-item-header">
            <div class="exam-info">
              <span class="level-badge" :class="`level-${exam.level || 1}`">
                {{ getLevelText(exam.level || 1) }}
              </span>
              <div class="exam-status">
                <span class="status-badge">进行中</span>
              </div>
            </div>
            <div class="exam-actions">
              <button 
                @click.stop="openDetailDialog(exam)" 
                class="btn-icon"
                title="查看详情"
              >
                🔍
              </button>
              <button @click.stop="openEditDialog(exam)" class="btn-icon btn-icon--edit" title="编辑">
                ✏️
              </button>
              <button @click.stop="deleteExam(exam.id)" class="btn-icon btn-icon--danger" title="删除">
                🗑️
              </button>
            </div>
          </div>

          <!-- 考试基本信息 -->
          <div class="exam-content">
            <div class="exam-title">
              <h3>{{ exam.name || '考试名称加载中...' }}</h3>
            </div>
            
            <div class="exam-description">
              <p>{{ exam.description || '暂无描述' }}</p>
            </div>
            
            <div class="exam-stats">
              <div class="stat-item">
                <span class="stat-label">题目数量</span>
                <span class="stat-value">{{ exam.questions ? exam.questions.length : (exam.question_count || exam.total_questions || 0) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">创建时间</span>
                <span class="stat-value">{{ formatDate(exam.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 展开的详细信息 -->
          <div v-if="expandedExams.includes(exam.id)" class="exam-details">
            <!-- 考试基本信息 -->
            <div class="detail-section">
              <h5>考试信息</h5>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">考试ID:</span>
                  <span class="info-value">#{{ exam.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">考试等级:</span>
                  <span class="info-value">{{ getLevelText(exam.level) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">题目总数:</span>
                  <span class="info-value">{{ exam.questions ? exam.questions.length : (exam.total_questions || 0) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间:</span>
                  <span class="info-value">{{ formatDate(exam.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- 题目列表 -->
            <div v-if="exam.questions && exam.questions.length > 0" class="detail-section">
              <h5>题目列表 ({{ exam.questions.length }}题)</h5>
              <div class="questions-preview">
                <div 
                  v-for="question in exam.questions.slice(0, 5)" 
                  :key="question.id"
                  class="question-preview-item"
                >
                  <div class="question-preview-header">
                    <span class="question-number">#{{ question.question_number }}</span>
                    <span class="question-type">{{ question.question_type === 'code' ? '代码题' : '文本题' }}</span>
                    <span class="question-difficulty" :class="`difficulty-${question.difficulty || 'medium'}`">
                      {{ getDifficultyText(question.difficulty || 'medium') }}
                    </span>
                  </div>
                  <div class="question-preview-text">
                    {{ question.question_text }}
                  </div>
                </div>
                <div v-if="exam.questions.length > 5" class="more-questions">
                  <span>还有 {{ exam.questions.length - 5 }} 道题目...</span>
                </div>
              </div>
            </div>

            <!-- 考试统计 -->
            <div class="detail-section">
              <h5>考试统计</h5>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">题目数量</span>
                  <span class="stat-value">{{ exam.questions ? exam.questions.length : (exam.total_questions || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均难度</span>
                  <span class="stat-value">{{ getAverageDifficulty(exam.questions || []) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">代码题数量</span>
                  <span class="stat-value">{{ getCodeQuestionCount(exam.questions || []) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">文本题数量</span>
                  <span class="stat-value">{{ getTextQuestionCount(exam.questions || []) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认删除弹窗 -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="确认删除"
      message="确定要删除这场考试吗？此操作不可撤销。"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 成功提示弹窗 -->
    <SuccessMessageDialog
      :visible="showSuccessMessage"
      :message="successMessage"
      @close="closeSuccessMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import ConfirmDialog from './Dialog/ConfirmDialog.vue'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'

// 考试列表相关数据
const exams = ref<any[]>([])
const searchQuery = ref('')
const filterLevel = ref('')
const expandedExams = ref<number[]>([])
const loading = ref(false)

// 弹窗相关数据
const showDeleteDialog = ref(false)
const examToDelete = ref<number | null>(null)

const showSuccessMessage = ref(false)
const successMessage = ref('')

// 获取考试列表
async function fetchExams() {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3000/api/exams')
    console.log('获取到的考试列表:', response.data)
    
    // 为每个考试获取详细信息
    const examsWithDetails = await Promise.all(
      response.data.map(async (exam: any) => {
        try {
          const detailResponse = await axios.get(`http://localhost:3000/api/exams/${exam.id}`)
          console.log(`考试 ${exam.id} 详情:`, detailResponse.data)
          // 合并考试基本信息和题目信息
          return {
            ...exam,
            questions: detailResponse.data.questions || []
          }
        } catch (error: any) {
          console.warn(`获取考试 ${exam.id} 详情失败:`, error)
          return {
            ...exam,
            questions: []
          }
        }
      })
    )
    exams.value = examsWithDetails
    console.log('处理后的考试数据:', exams.value)
  } catch (error: any) {
    console.error('获取考试列表失败:', error)
    alert('获取考试列表失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 过滤考试
const filteredExams = computed(() => {
  let list = exams.value
  if (filterLevel.value) {
    list = list.filter(exam => String(exam.level || 1) === filterLevel.value)
  }
  if (searchQuery.value) {
    list = list.filter(exam => exam.name?.includes(searchQuery.value))
  }
  return list
})

// 切换考试展开状态
function toggleExamExpansion(id: number) {
  const idx = expandedExams.value.indexOf(id)
  if (idx === -1) {
    expandedExams.value.push(id)
  } else {
    expandedExams.value.splice(idx, 1)
  }
}

// 详情弹窗事件处理
function openDetailDialog(exam: any) {
  // 暂时用alert显示详情
  alert(`考试详情：${exam.name}\n等级：${getLevelText(exam.level)}\n题目数量：${exam.total_questions || 0}`)
}

// 编辑弹窗事件处理
function openEditDialog(exam: any) {
  // 暂时用alert显示编辑功能
  alert(`编辑考试：${exam.name}\n此功能正在开发中...`)
}

// 创建弹窗事件处理
function openCreateDialog() {
  // 暂时用alert显示创建功能
  alert('创建考试功能正在开发中...')
}

// 删除考试
function deleteExam(id: number) {
  examToDelete.value = id
  showDeleteDialog.value = true
}

// 确认删除
async function confirmDelete() {
  if (!examToDelete.value) return
  
  try {
    const response = await axios.delete(`http://localhost:3000/api/exams/${examToDelete.value}`)
    showDeleteDialog.value = false
    examToDelete.value = null
    await fetchExams()
    showSuccessMessage.value = true
    successMessage.value = '考试删除成功！'
  } catch (error: any) {
    console.error('删除考试失败:', error)
    alert('删除考试失败: ' + error.response?.data?.error || error.message)
  }
}

// 取消删除
function cancelDelete() {
  showDeleteDialog.value = false
  examToDelete.value = null
}

// 关闭成功提示
function closeSuccessMessage() {
  showSuccessMessage.value = false
  successMessage.value = ''
}

// 难度文本
function getDifficultyText(d: string) {
  if (d === 'easy') return '简单'
  if (d === 'hard') return '困难'
  return '中等'
}

// 时间格式化
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

// 等级文本
function getLevelText(level: number) {
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 获取平均难度
function getAverageDifficulty(questions: any[]) {
  if (!questions || questions.length === 0) return 'N/A'
  
  const difficultyMap: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 }
  const total = questions.reduce((sum, q) => {
    return sum + (difficultyMap[q.difficulty] || 2)
  }, 0)
  
  const average = total / questions.length
  if (average <= 1.5) return '简单'
  if (average <= 2.5) return '中等'
  return '困难'
}

// 获取代码题数量
function getCodeQuestionCount(questions: any[]) {
  if (!questions) return 0
  return questions.filter(q => q.question_type === 'code').length
}

// 获取文本题数量
function getTextQuestionCount(questions: any[]) {
  if (!questions) return 0
  return questions.filter(q => q.question_type === 'text').length
}

onMounted(async () => {
  await fetchExams()
})
</script>

<style scoped>
/* CSS变量定义，与天蓝色主题保持一致 */
:root {
  --primary-color: #1e90ff;
  --primary-dark: #0066cc;
  --primary-light: #87ceeb;
  --secondary-color: #f59e0b;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --transition-normal: 250ms ease;
}

.content-section {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  overflow-x: hidden;
}

.exams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 40px 24px 20px 24px;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.exam-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1.5px solid #b6e0fe;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.search-input:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 16px;
}

.filter-dropdown {
  min-width: 150px;
}

.filter-select {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.filter-select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}

.create-btn span:first-child {
  font-size: 18px;
  font-weight: bold;
}

/* 考试列表样式 */
.exams-list-container {
  width: 100%;
  padding: 32px 24px 32px 24px;
  box-sizing: border-box;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
}

.exams-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.exam-item {
  background: #fff;
  border: 1.5px solid #b6e0fe;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
  transition: box-shadow 0.3s, transform 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
}

.exam-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px -2px rgba(30,144,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.06);
  z-index: 2;
}

.exam-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1.5px solid #b6e0fe;
}

.exam-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-badge {
  background: #e0f7fa;
  color: #1e90ff;
  padding: 7px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
}

.level-1 { background: #e0f7fa; color: #1e90ff; }
.level-2 { background: #b6e0fe; color: #1e90ff; }
.level-3 { background: #d1faff; color: #1e90ff; }
.level-4 { background: #e3f2fd; color: #1e90ff; }
.level-5 { background: #b3e5fc; color: #1e90ff; }
.level-6 { background: #fef3c7; color: #d97706; }

.exam-status {
  display: flex;
  align-items: center;
}

.status-badge {
  background: #10b981;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.exam-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
  transition: color 0.3s ease;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon:hover {
  color: #4b5563;
  background: rgba(107, 114, 128, 0.1);
}

.btn-icon--danger {
  color: #ef4444;
}

.btn-icon--danger:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

.btn-icon--edit {
  color: #f59e0b;
}

.btn-icon--edit:hover {
  color: #d97706;
  background: rgba(245, 158, 11, 0.1);
}

.exam-content {
  background: #f9fafb;
  border-top: 1.5px solid #b6e0fe;
  padding: 18px 24px;
  flex: 1;
}

.exam-title h3 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.exam-description {
  margin-bottom: 16px;
}

.exam-description p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.exam-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.exam-details {
  margin-top: 12px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h5 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.info-value {
  color: #1e293b;
  font-size: 14px;
}

.questions-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-preview-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.question-preview-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.question-preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.question-number {
  background: #1e90ff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.question-type {
  background: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.question-difficulty {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-easy { background: #d1fae5; color: #065f46; }
.difficulty-medium { background: #e0e7ef; color: #1e293b; }
.difficulty-hard { background: #fee2e2; color: #b91c1c; }

.question-preview-text {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.more-questions {
  text-align: center;
  padding: 12px;
  color: #64748b;
  font-size: 14px;
  font-style: italic;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exams-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-box,
  .filter-dropdown {
    width: 100%;
  }

  .search-box {
    min-width: auto;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .exams-list-container {
    padding: 24px 24px 24px 24px;
  }

  .exam-stats {
    flex-direction: column;
    gap: 12px;
  }
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
</style> 