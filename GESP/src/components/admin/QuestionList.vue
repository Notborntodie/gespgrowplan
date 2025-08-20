<template>
  <div class="content-section">
    <div class="questions-header">
      <div class="header-left">
        <h2>题目列表</h2>
        <span class="question-count">共 {{ questions.length }} 道题目</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索题目内容..." 
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
        <div class="filter-dropdown">
          <input 
            type="month" 
            v-model="filterDate" 
            class="filter-select"
            placeholder="按日期筛选"
          />
        </div>
        <!-- 批量操作按钮 -->
        <div v-if="selectedQuestions.length > 0" class="batch-actions">
          <span class="selected-count">已选择 {{ selectedQuestions.length }} 道题目</span>
          <button @click="selectAll" class="btn-batch">全选</button>
          <button @click="clearSelection" class="btn-batch">取消选择</button>
          <button @click="batchDelete" class="btn-batch btn-batch--danger">批量删除</button>
        </div>
        <div v-else class="batch-actions">
          <button @click="selectAll" class="btn-batch">批量选择</button>
        </div>
      </div>
    </div>

    <div class="questions-list-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载题目列表...</p>
      </div>
      <div v-else class="questions-list">
        <div 
          v-for="q in filteredQuestions" 
          :key="q.id" 
          class="question-item elevate-card"
        >
          <div class="question-item-header">
            <!-- 选择框 -->
            <div class="question-checkbox">
              <input 
                type="checkbox" 
                :id="`question-${q.id}`"
                :checked="selectedQuestions.includes(q.id)"
                @change="toggleQuestionSelection(q.id)"
                class="checkbox-input"
              />
              <label :for="`question-${q.id}`" class="checkbox-label"></label>
            </div>
            <div class="question-info">
              <span class="level-badge" :class="`level-${q.level || 1}`">
                {{ getLevelText(q.level || 1) }}
              </span>
              <div class="difficulty-badge" :class="`difficulty-${q.difficulty || 'medium'}`">
                {{ getDifficultyText(q.difficulty || 'medium') }}
              </div>
            </div>
            <div class="question-actions">
              <button 
                @click="openDetailDialog(q)" 
                class="btn-icon"
                title="查看详情"
              >
                🔍
              </button>
              <button @click="openEditDialog(q)" class="btn-icon btn-icon--edit" title="编辑">
                ✏️
              </button>
              <button @click="deleteQuestion(q.id)" class="btn-icon btn-icon--danger" title="删除">
                🗑️
              </button>
            </div>
          </div>

          <!-- 题目内容预览 -->
          <div class="question-text-box">
            <div class="question-text">
              {{ q.question_text || '题目内容加载中...' }}
            </div>
          </div>
          
          <!-- 题目图片预览 -->
          <div v-if="(q.images && q.images.length > 0) || q.image_url" class="question-images-preview">
            <div class="images-preview-grid">
              <!-- 显示题目主图片 -->
               
              <div 
                v-if="q.image_url"
                class="preview-image-item"
                @click="openImageModal(q.image_url)"
              >
                <img 
                  :src="q.image_url" 
                  :alt="`题目图片`"
                  class="preview-image"
                />
                <div class="preview-image-overlay">
                  <span class="preview-image-count">主</span>
                </div>
              </div>
              <!-- 显示附加图片 -->
              <div 
                v-for="(image, index) in q.images.slice(0, 3)" 
                :key="index"
                class="preview-image-item"
                @click="openImageModal(image.image_url)"
              >
                <img 
                  :src="image.image_url" 
                  :alt="`附加图片 ${index + 1}`"
                  class="preview-image"
                />
                <div class="preview-image-overlay">
                  <span class="preview-image-count">{{ index + 1 }}</span>
                </div>
              </div>
              <div v-if="q.images && q.images.length > 3" class="more-images-indicator">
                <span>+{{ q.images.length - 3 }}</span>
              </div>
            </div>
          </div>

          <!-- 展开的详细信息 -->
          <div v-if="expandedQuestions.includes(q.id)" class="question-details">
            <!-- 题目类型和基本信息 -->
            <div class="detail-section">
              <h5>题目信息</h5>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">题目类型:</span>
                  <span class="info-value">{{ q.question_type === 'code' ? '代码题' : '文本题' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间:</span>
                  <span class="info-value">{{ formatDate(q.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">题目编号:</span>
                  <span class="info-value">#{{ q.question_number }}</span>
                </div>
                <div class="info-item" v-if="q.question_date">
                  <span class="info-label">题目日期:</span>
                  <span class="info-value">{{ q.question_date }}</span>
                </div>
              </div>
            </div>

            <!-- 题目代码（如果是代码题） -->
            <div v-if="q.question_code" class="detail-section">
              <h5>题目代码</h5>
              <div class="code-block">
                <pre>{{ q.question_code }}</pre>
              </div>
            </div>

            <!-- 选项列表 -->
            <div v-if="q.options && q.options.length > 0" class="detail-section">
              <h5>选项列表</h5>
              <div class="options-list">
                <div 
                  v-for="option in q.options" 
                  :key="option.option_label"
                  class="option-item"
                  :class="{ 'option-correct': option.option_value === q.correct_answer }"
                >
                  <span class="option-label">{{ option.option_label }}.</span>
                  <span class="option-text">{{ option.option_text }}</span>
                  <span v-if="option.option_value === q.correct_answer" class="correct-indicator">✓</span>
                </div>
              </div>
            </div>

            <!-- 正确答案 -->
            <div class="detail-section">
              <h5>正确答案</h5>
              <div class="answer-box">
                <span class="correct-answer">{{ q.correct_answer }}</span>
              </div>
            </div>
            
            <!-- 解释说明 -->
            <div v-if="q.explanation" class="detail-section">
              <h5>解释说明</h5>
              <div class="explanation-box">
                <p>{{ q.explanation }}</p>
              </div>
            </div>

            <!-- 知识点 -->
            <div v-if="q.knowledge_points && q.knowledge_points.length > 0" class="detail-section">
              <h5>相关知识点</h5>
              <div class="knowledge-points">
                <span 
                  v-for="kp in q.knowledge_points" 
                  :key="kp.id"
                  class="knowledge-tag"
                >
                  {{ kp.name }}
                </span>
              </div>
            </div>

            <!-- 题目统计 -->
            <div class="detail-section">
              <h5>题目统计</h5>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">使用次数</span>
                  <span class="stat-value">{{ q.usage_count || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">正确率</span>
                  <span class="stat-value">{{ q.correct_rate || 'N/A' }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">难度</span>
                  <span class="stat-value">{{ getDifficultyText(q.difficulty || 'medium') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">选项数量</span>
                  <span class="stat-value">{{ q.options ? q.options.length : 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加确认弹窗 -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="确认删除"
      message="确定要删除这道题目吗？此操作不可撤销。"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
    <!-- 题目详情弹窗 -->
    <QuestionDetailDialog
      :visible="showDetailDialog"
      :question="detailQuestion"
      @close="closeDetailDialog"
    />
    
    <!-- 题目编辑弹窗 -->
    <QuestionEditDialog
      :visible="showEditDialog"
      :question="editQuestion"
      @close="closeEditDialog"
      @updated="handleQuestionUpdated"
    />

    <!-- 成功提示弹窗 -->
    <SuccessMessageDialog
      :visible="showSuccessMessage"
      :message="successMessage"
      @close="closeSuccessMessage"
    />

    <!-- 批量删除确认弹窗 -->
    <ConfirmDialog
      :visible="showBatchDeleteDialog"
      title="确认批量删除"
      :message="`确定要删除选中的 ${selectedQuestions.length} 道题目吗？此操作不可撤销。`"
      @confirm="confirmBatchDelete"
      @cancel="cancelBatchDelete"
    />
    
    <!-- 图片模态框 -->
    <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <button @click="closeImageModal" class="image-modal-close">×</button>
        <img :src="selectedImageUrl" alt="题目图片" class="modal-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import ConfirmDialog from './Dialog/ConfirmDialog.vue'
import QuestionDetailDialog from './Dialog/QuestionDetailDialog.vue'
import QuestionEditDialog from './Dialog/QuestionEditDialog.vue'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'

// 题目列表相关数据
const questions = ref<any[]>([])
const searchQuery = ref('')
const filterLevel = ref('')
const filterDate = ref('')
const expandedQuestions = ref<number[]>([])
const loading = ref(false)

// 添加弹窗相关数据
const showDeleteDialog = ref(false)
const questionToDelete = ref<number | null>(null)

// 详情弹窗相关数据
const showDetailDialog = ref(false)
const detailQuestion = ref<any>(null)

// 编辑弹窗相关数据
const showEditDialog = ref(false)
const editQuestion = ref<any>(null)

// 成功提示相关数据
const showSuccessMessage = ref(false)
const successMessage = ref('')

// 图片模态框相关数据
const showImageModal = ref(false)
const selectedImageUrl = ref('')

// 批量选择相关数据
const selectedQuestions = ref<number[]>([])
const showBatchDeleteDialog = ref(false)


function openDetailDialog(q: any) {
  detailQuestion.value = q
  showDetailDialog.value = true
}
function closeDetailDialog() {
  showDetailDialog.value = false
  detailQuestion.value = null
}

// 编辑弹窗事件处理
function closeEditDialog() {
  showEditDialog.value = false
  editQuestion.value = null
}

function handleQuestionUpdated() {
  // 题目更新后刷新列表并显示成功提示
  fetchQuestions()
  showSuccessMessage.value = true
  successMessage.value = '题目更新成功！'
}

// 获取题目列表
async function fetchQuestions() {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3000/api/questions')
    // 为每个题目获取详细信息
    const questionsWithDetails = await Promise.all(
      response.data.map(async (question: any) => {
        try {
          const detailResponse = await axios.get(`http://localhost:3000/api/questions/${question.id}`)
          return detailResponse.data
        } catch (error: any) {
          console.warn(`获取题目 ${question.id} 详情失败:`, error)
          return question
        }
      })
    )
    questions.value = questionsWithDetails
  } catch (error: any) {
    console.error('获取题目列表失败:', error)
    alert('获取题目列表失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 过滤题目
const filteredQuestions = computed(() => {
  let list = questions.value
  if (filterLevel.value) {
    list = list.filter(q => String(q.level || 1) === filterLevel.value)
  }
  if (filterDate.value) {
    list = list.filter(q => q.question_date === filterDate.value)
  }
  if (searchQuery.value) {
    list = list.filter(q => q.question_text?.includes(searchQuery.value))
  }
  return list
})

// 切换题目展开状态
function toggleQuestionExpansion(id: number) {
  const idx = expandedQuestions.value.indexOf(id)
  if (idx === -1) {
    expandedQuestions.value.push(id)
  } else {
    expandedQuestions.value.splice(idx, 1)
  }
}

// 编辑题目
function openEditDialog(q: any) {
  // 打开编辑弹窗
  editQuestion.value = q
  showEditDialog.value = true
}

// 删除题目
function deleteQuestion(id: number) {
  questionToDelete.value = id
  showDeleteDialog.value = true
}

// 确认删除
async function confirmDelete() {
  if (!questionToDelete.value) return
  
  try {
    const response = await axios.delete(`http://localhost:3000/api/questions/${questionToDelete.value}`)
    // 删除成功后关闭弹窗并刷新列表
    showDeleteDialog.value = false
    questionToDelete.value = null
    await fetchQuestions()
    showSuccessMessage.value = true
    successMessage.value = '题目删除成功！'
  } catch (error: any) {
    console.error('删除题目失败:', error)
    alert('删除题目失败: ' + error.response?.data?.error || error.message)
  }
}

// 取消删除
function cancelDelete() {
  showDeleteDialog.value = false
  questionToDelete.value = null
}

// 关闭成功提示
function closeSuccessMessage() {
  showSuccessMessage.value = false
  successMessage.value = ''
}

// 打开图片模态框
function openImageModal(imageUrl: string) {
  selectedImageUrl.value = imageUrl
  showImageModal.value = true
}

// 关闭图片模态框
function closeImageModal() {
  showImageModal.value = false
  selectedImageUrl.value = ''
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

// 时间格式化
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

// 批量选择相关方法
function toggleQuestionSelection(questionId: number) {
  const index = selectedQuestions.value.indexOf(questionId)
  if (index === -1) {
    selectedQuestions.value.push(questionId)
  } else {
    selectedQuestions.value.splice(index, 1)
  }
}

function selectAll() {
  if (selectedQuestions.value.length === filteredQuestions.value.length) {
    // 如果已经全选，则取消全选
    selectedQuestions.value = []
  } else {
    // 全选当前过滤后的题目
    selectedQuestions.value = filteredQuestions.value.map(q => q.id)
  }
}

function clearSelection() {
  selectedQuestions.value = []
}

function batchDelete() {
  if (selectedQuestions.value.length === 0) {
    alert('请先选择要删除的题目')
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    // 批量删除选中的题目
    const deletePromises = selectedQuestions.value.map(id => 
      axios.delete(`http://localhost:3000/api/questions/${id}`)
    )
    
    await Promise.all(deletePromises)
    
    // 清空选择并刷新列表
    selectedQuestions.value = []
    showBatchDeleteDialog.value = false
    await fetchQuestions()
    
    showSuccessMessage.value = true
    successMessage.value = `成功删除 ${deletePromises.length} 道题目！`
  } catch (error: any) {
    console.error('批量删除失败:', error)
    alert('批量删除失败: ' + (error.response?.data?.error || error.message))
  }
}

function cancelBatchDelete() {
  showBatchDeleteDialog.value = false
}

onMounted(async () => {
  await fetchQuestions()
})
</script>

<style scoped>
/* CSS变量定义，与天蓝色主题保持一致 */
:root {
  --primary-color: #1e90ff; /* 天蓝色 */
  --primary-dark: #0066cc; /* 深天蓝色 */
  --primary-light: #87ceeb; /* 浅天蓝色 */
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

.questions-header {
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

.question-count {
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

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.selected-count {
  color: #1e90ff;
  font-weight: 600;
  font-size: 14px;
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

.btn-batch:hover {
  background: #f0f9ff;
  border-color: #1e90ff;
}

.btn-batch--danger {
  color: #ef4444;
  border-color: #fecaca;
}

.btn-batch--danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
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
  
  .filter-dropdown input[type="month"] {
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
  
  .filter-dropdown input[type="month"]:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
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

/* 题目网格样式 */
.questions-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.question-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.question-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px -2px rgb(0 0 0 / 0.15);
}

.question-card--expanded {
  grid-column: span 2;
  grid-row: span 2;
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 144, 255, 0.1);
  border-bottom: 1px solid #d1d5db;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 10px;
}

.number-badge {
  background: var(--primary-color, #1e90ff);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.level-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.level-1 { background: #e0f7fa; color: #1e90ff; }
.level-2 { background: #b6e0fe; color: #1e90ff; }
.level-3 { background: #d1faff; color: #1e90ff; }
.level-4 { background: #e3f2fd; color: #1e90ff; }
.level-5 { background: #b3e5fc; color: #1e90ff; }
.level-6 { background: #fef3c7; color: #d97706; }

.question-actions {
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



/* 题目列表样式 */
.questions-list-container {
  width: 100%;
  padding: 32px 24px 32px 24px;
  box-sizing: border-box;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-item {
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

.question-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px -2px rgba(30,144,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.06);
  z-index: 2;
}

.question-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1.5px solid #b6e0fe;
}

.question-checkbox {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.checkbox-input {
  display: none;
}

.checkbox-label {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 1);
}

.checkbox-input:checked + .checkbox-label {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-input:checked + .checkbox-label::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.question-info {
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

.difficulty-badge {
  background: #e0e7ef;
  color: #1e293b;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.difficulty-easy { background: #d1fae5; color: #065f46; }
.difficulty-medium { background: #e0e7ef; color: #1e293b; }
.difficulty-hard { background: #fee2e2; color: #b91c1c; }

.question-text-box {
  background: #f9fafb;
  border-top: 1.5px solid #b6e0fe;
  padding: 18px 24px;
  flex: 1;
}

.question-text {
  color: #1e293b;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

.question-images-preview {
  margin-top: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1.5px solid #b6e0fe;
  border-bottom: 1.5px solid #b6e0fe;
}

.images-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.preview-image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  background: white;
}

.preview-image-item:hover {
  transform: scale(1.05);
  border-color: #1e90ff;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.2);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f8fafc;
}

.preview-image-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(30, 144, 255, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.preview-image-count {
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.more-images-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.question-details {
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

.code-block {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  border: 1px solid #334155;
}

.code-block pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.option-item.option-correct {
  background: #f0fdf4;
  border-color: #10b981;
  border-left: 4px solid #10b981;
}

.option-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  min-width: 24px;
}

.option-text {
  flex: 1;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.correct-indicator {
  color: #10b981;
  font-weight: bold;
  font-size: 16px;
  margin-left: 8px;
}

.answer-box,
.explanation-box {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #374151;
}

.explanation-box p {
  margin: 0;
  line-height: 1.6;
}

.correct-answer {
  font-weight: 600;
  color: #10b981;
  font-size: 16px;
}

.knowledge-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-tag {
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #bae6fd;
}

.knowledge-tag:hover {
  background: #bae6fd;
  color: #075985;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
  transition: color 0.3s ease;
  padding: 4px;
  border-radius: 4px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .questions-header {
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

  .batch-actions {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .btn-batch {
    width: 100%;
    text-align: center;
  }

  .question-item-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .question-checkbox {
    margin-right: 8px;
  }

  .questions-list-container {
    padding: 24px 24px 24px 24px;
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

/* 图片模态框样式 */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.image-modal-content {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.image-modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.image-modal-close:hover {
  background-color: #f0f0f0;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  margin-top: 20px;
}
</style> 