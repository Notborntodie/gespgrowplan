<template>
  <div class="create-exam-container">
    <div class="create-exam-header">
      <h2>创建新考试</h2>
      <p class="subtitle">设置考试基本信息并选择题目</p>
    </div>

    <div class="create-exam-content">
      <!-- 考试基本信息 -->
      <div class="exam-info-section">
        <h3>考试基本信息</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="examName">考试名称 *</label>
            <input 
              id="examName"
              v-model="examForm.name" 
              type="text" 
              placeholder="请输入考试名称"
              class="form-input"
              :class="{ 'error': errors.name }"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="examLevel">考试等级 *</label>
            <select 
              id="examLevel"
              v-model="examForm.level" 
              class="form-select"
              :class="{ 'error': errors.level }"
            >
              <option value="">请选择考试等级</option>
              <option value="1">GESP 1级</option>
              <option value="2">GESP 2级</option>
              <option value="3">GESP 3级</option>
              <option value="4">GESP 4级</option>
              <option value="5">GESP 5级</option>
              <option value="6">CSP-J</option>
            </select>
            <span v-if="errors.level" class="error-message">{{ errors.level }}</span>
          </div>

          <div class="form-group">
            <label for="examType">考试类型 *</label>
            <select 
              id="examType"
              v-model="examForm.type" 
              class="form-select"
              :class="{ 'error': errors.type }"
            >
              <option value="">请选择考试类型</option>
              <option value="真题">真题</option>
              <option value="模拟">模拟</option>
              <option value="专项">专项</option>
            </select>
            <span v-if="errors.type" class="error-message">{{ errors.type }}</span>
          </div>

          <div class="form-group full-width">
            <label for="examDescription">考试描述</label>
            <textarea 
              id="examDescription"
              v-model="examForm.description" 
              placeholder="请输入考试描述（可选）"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 题目选择 -->
      <div class="questions-section">
        <div class="section-header">
          <h3>选择题目</h3>
          <div class="section-actions">
            <div class="search-box">
              <input 
                v-model="questionSearch" 
                type="text" 
                placeholder="搜索题目内容..." 
                class="search-input"
              />
              <i class="search-icon">🔍</i>
            </div>
            <div class="filter-dropdown">
              <select v-model="questionFilter" class="filter-select">
                <option value="">全部等级</option>
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">CSP-J</option>
              </select>
            </div>
            <div class="filter-dropdown">
              <select v-model="difficultyFilter" class="filter-select">
                <option value="">全部难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div class="filter-dropdown">
              <input 
                type="month" 
                v-model="dateFilter" 
                class="filter-select"
                placeholder="按日期筛选"
              />
            </div>
            <div class="batch-actions">
              <button 
                @click="selectAllFiltered" 
                class="btn-batch"
                :disabled="filteredAvailableQuestions.length === 0"
              >
                {{ isAllFilteredSelected ? '取消全选' : '全选' }}
              </button>
              <button 
                @click="clearSelection" 
                class="btn-batch"
                :disabled="selectedQuestions.length === 0"
              >
                清空选择
              </button>
            </div>
          </div>
        </div>

        <!-- 已选题目 -->
        <div v-if="selectedQuestions.length > 0" class="selected-questions">
          <h4>已选题目 ({{ selectedQuestions.length }})</h4>
          <div class="selected-questions-list">
            <div 
              v-for="(question, index) in selectedQuestions" 
              :key="question.id"
              class="selected-question-item"
            >
              <div class="question-info">
                <span class="question-number">#{{ index + 1 }}</span>
                <span class="level-badge" :class="`level-${question.level}`">
                  {{ getLevelText(question.level) }}
                </span>
                <span class="difficulty-badge" :class="`difficulty-${question.difficulty}`">
                  {{ getDifficultyText(question.difficulty) }}
                </span>
                <span class="question-text">{{ question.question_text }}</span>
              </div>
              <div class="question-actions">
                <button 
                  @click="moveQuestion(index, 'up')" 
                  class="btn-icon"
                  :disabled="index === 0"
                  title="上移"
                >
                  ⬆️
                </button>
                <button 
                  @click="moveQuestion(index, 'down')" 
                  class="btn-icon"
                  :disabled="index === selectedQuestions.length - 1"
                  title="下移"
                >
                  ⬇️
                </button>
                <button 
                  @click="removeQuestion(index)" 
                  class="btn-icon btn-icon--danger"
                  title="移除"
                >
                  ❌
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 可用题目列表 -->
        <div class="available-questions">
          <h4>可用题目 ({{ filteredAvailableQuestions.length }})</h4>
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在加载题目...</p>
          </div>
          <div v-else class="questions-grid">
            <div 
              v-for="question in filteredAvailableQuestions" 
              :key="question.id"
              class="question-card"
              :class="{ 'selected': isQuestionSelected(question.id) }"
            >
              <div class="question-card-header">
                <div class="question-badges">
                                  <span class="level-badge" :class="`level-${question.level}`">
                  {{ getLevelText(question.level) }}
                </span>
                  <span class="difficulty-badge" :class="`difficulty-${question.difficulty}`">
                    {{ getDifficultyText(question.difficulty) }}
                  </span>
                </div>
                <button 
                  @click="toggleQuestionSelection(question)"
                  class="select-btn"
                  :class="{ 'selected': isQuestionSelected(question.id) }"
                >
                  {{ isQuestionSelected(question.id) ? '✓' : '+' }}
                </button>
              </div>
              <div class="question-content">
                <p class="question-text">{{ question.question_text }}</p>
                <div v-if="question.question_code" class="question-code">
                  <span class="code-indicator">代码题</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <button @click="goBack" class="btn btn-secondary">
          取消
        </button>
        <button @click="createExam" class="btn btn-primary" :disabled="!canCreate">
          {{ creating ? '创建中...' : '创建考试' }}
        </button>
      </div>
    </div>

    <!-- 成功提示弹窗 -->
    <SuccessMessageDialog
      :visible="showSuccessMessage"
      :message="successMessage"
      @close="closeSuccessMessage"
    />
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'

const router = useRouter()

// 表单数据
const examForm = ref({
  name: '',
  level: '',
  type: '',
  description: ''
})

// 错误信息
const errors = ref({
  name: '',
  level: '',
  type: ''
})

// 题目相关数据
const availableQuestions = ref<any[]>([])
const selectedQuestions = ref<any[]>([])
const questionSearch = ref('')
const questionFilter = ref('')
const difficultyFilter = ref('')
const dateFilter = ref('')
const loading = ref(false)

// 状态数据
const creating = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')

// 获取可用题目
async function fetchAvailableQuestions() {
  loading.value = true
  try {
          const response = await axios.get(`${BASE_URL}/available-questions`)
    availableQuestions.value = response.data
  } catch (error: any) {
    console.error('获取可用题目失败:', error)
    alert('获取可用题目失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 过滤可用题目
const filteredAvailableQuestions = computed(() => {
  let questions = availableQuestions.value

  // 排除已选题目
  questions = questions.filter(q => !isQuestionSelected(q.id))

  // 按搜索关键词过滤
  if (questionSearch.value) {
    questions = questions.filter(q => 
      q.question_text?.includes(questionSearch.value)
    )
  }

  // 按等级过滤
  if (questionFilter.value) {
    questions = questions.filter(q => String(q.level) === questionFilter.value)
  }

  // 按难度过滤
  if (difficultyFilter.value) {
    questions = questions.filter(q => q.difficulty === difficultyFilter.value)
  }

  // 按日期过滤
  if (dateFilter.value) {
    questions = questions.filter(q => q.question_date === dateFilter.value)
  }

  return questions
})

// 检查题目是否已选择
function isQuestionSelected(questionId: number) {
  return selectedQuestions.value.some(q => q.id === questionId)
}

// 切换题目选择状态
function toggleQuestionSelection(question: any) {
  if (isQuestionSelected(question.id)) {
    removeQuestionFromSelection(question.id)
  } else {
    addQuestionToSelection(question)
  }
}

// 添加题目到选择列表
function addQuestionToSelection(question: any) {
  selectedQuestions.value.push({
    ...question,
    question_number: selectedQuestions.value.length + 1
  })
}

// 从选择列表中移除题目
function removeQuestionFromSelection(questionId: number) {
  const index = selectedQuestions.value.findIndex(q => q.id === questionId)
  if (index > -1) {
    selectedQuestions.value.splice(index, 1)
    // 重新编号
    selectedQuestions.value.forEach((q, i) => {
      q.question_number = i + 1
    })
  }
}

// 移除题目（通过索引）
function removeQuestion(index: number) {
  selectedQuestions.value.splice(index, 1)
  // 重新编号
  selectedQuestions.value.forEach((q, i) => {
    q.question_number = i + 1
  })
}

// 移动题目位置
function moveQuestion(index: number, direction: 'up' | 'down') {
  if (direction === 'up' && index > 0) {
    const temp = selectedQuestions.value[index]
    selectedQuestions.value[index] = selectedQuestions.value[index - 1]
    selectedQuestions.value[index - 1] = temp
  } else if (direction === 'down' && index < selectedQuestions.value.length - 1) {
    const temp = selectedQuestions.value[index]
    selectedQuestions.value[index] = selectedQuestions.value[index + 1]
    selectedQuestions.value[index + 1] = temp
  }
  
  // 重新编号
  selectedQuestions.value.forEach((q, i) => {
    q.question_number = i + 1
  })
}

// 验证表单
function validateForm() {
  errors.value = { name: '', level: '', type: '' }
  let isValid = true

  if (!examForm.value.name.trim()) {
    errors.value.name = '请输入考试名称'
    isValid = false
  }

  if (!examForm.value.level) {
    errors.value.level = '请选择考试等级'
    isValid = false
  }

  if (!examForm.value.type) {
    errors.value.type = '请选择考试类型'
    isValid = false
  }

  return isValid
}

// 检查是否可以创建考试
const canCreate = computed(() => {
  return examForm.value.name.trim() && 
         examForm.value.level && 
         examForm.value.type &&
         selectedQuestions.value.length > 0 &&
         !creating.value
})

// 检查是否所有过滤后的题目都已选择
const isAllFilteredSelected = computed(() => {
  if (filteredAvailableQuestions.value.length === 0) return false
  return filteredAvailableQuestions.value.every(q => isQuestionSelected(q.id))
})

// 创建考试
async function createExam() {
  if (!validateForm()) return

  creating.value = true
  try {
    const examData = {
      name: examForm.value.name.trim(),
      level: parseInt(examForm.value.level),
      type: examForm.value.type,
      description: examForm.value.description.trim(),
      question_ids: selectedQuestions.value.map(q => ({
        id: q.id,
        question_number: q.question_number
      }))
    }

          const response = await axios.post(`${BASE_URL}/exams`, examData)
    
    showSuccessMessage.value = true
    successMessage.value = `考试"${examForm.value.name}"创建成功！`
    
    // 延迟跳转
    setTimeout(() => {
      router.push('/admin')
    }, 2000)
    
  } catch (error: any) {
    console.error('创建考试失败:', error)
    alert('创建考试失败: ' + (error.response?.data?.error || error.message))
  } finally {
    creating.value = false
  }
}

// 返回上一页
function goBack() {
  router.back()
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

// 等级文本
function getLevelText(level: number) {
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 类型文本
function getTypeText(type: string) {
  return type || '真题'
}

// 全选/取消全选过滤后的题目
function selectAllFiltered() {
  if (isAllFilteredSelected.value) {
    // 取消全选：移除所有过滤后的题目
    filteredAvailableQuestions.value.forEach(q => {
      removeQuestionFromSelection(q.id)
    })
  } else {
    // 全选：添加所有过滤后的题目
    filteredAvailableQuestions.value.forEach(q => {
      if (!isQuestionSelected(q.id)) {
        addQuestionToSelection(q)
      }
    })
  }
}

// 清空所有选择
function clearSelection() {
  selectedQuestions.value = []
}

onMounted(() => {
  fetchAvailableQuestions()
})
</script>

<style scoped>
.create-exam-container {
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

.create-exam-header {
  padding: 40px 24px 20px 24px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
  border-bottom: 2px solid #e2e8f0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.create-exam-header h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.create-exam-content {
  flex: 1;
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.exam-info-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10);
  border: 1.5px solid #b6e0fe;
}

.exam-info-section h3 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.questions-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10);
  border: 1.5px solid #b6e0fe;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.btn-batch {
  padding: 8px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  background: white;
  color: #1e90ff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-batch:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #1e90ff;
}

.btn-batch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-box {
  position: relative;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 36px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
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
  font-size: 14px;
}

.filter-dropdown {
  min-width: 120px;
}

.filter-select {
  width: 100%;
  padding: 10px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.filter-dropdown input[type="month"] {
  width: 100%;
  padding: 10px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-dropdown input[type="month"]:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.selected-questions {
  margin-bottom: 32px;
}

.selected-questions h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.selected-questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #b6e0fe;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.selected-question-item:hover {
  background: #e0f2fe;
  border-color: #1e90ff;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.question-number {
  background: #1e90ff;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.level-1 { background: #e0f7fa; color: #1e90ff; }
.level-2 { background: #b6e0fe; color: #1e90ff; }
.level-3 { background: #d1faff; color: #1e90ff; }
.level-4 { background: #e3f2fd; color: #1e90ff; }
.level-5 { background: #b3e5fc; color: #1e90ff; }
.level-6 { background: #fef3c7; color: #d97706; }

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.difficulty-easy { background: #d1fae5; color: #065f46; }
.difficulty-medium { background: #e0e7ef; color: #1e293b; }
.difficulty-hard { background: #fee2e2; color: #b91c1c; }

.question-text {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #6b7280;
  transition: all 0.3s ease;
  padding: 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
}

.btn-icon:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.1);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon--danger {
  color: #ef4444;
}

.btn-icon--danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.available-questions h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
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

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.question-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #1e90ff;
}

.question-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(30, 144, 255, 0.1);
  border-bottom: 1px solid #e2e8f0;
}

.question-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.select-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: white;
  color: #64748b;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-btn:hover {
  border-color: #1e90ff;
  color: #1e90ff;
}

.select-btn.selected {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.question-content {
  padding: 16px;
}

.question-content .question-text {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px 0;
  word-break: break-word;
}

.question-code {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-indicator {
  background: #1e293b;
  color: #e2e8f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.actions-section {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-exam-header {
    padding: 24px 16px 16px 16px;
  }

  .create-exam-content {
    padding: 24px 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-actions {
    width: 100%;
    flex-direction: column;
  }

  .search-box,
  .filter-dropdown {
    width: 100%;
  }

  .search-box {
    min-width: auto;
  }

  .questions-grid {
    grid-template-columns: 1fr;
  }

  .question-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .actions-section {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style> 