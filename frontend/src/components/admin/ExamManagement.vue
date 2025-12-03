<template>
  <div class="exam-management">
    <div class="section-header">
      <h2>练习管理</h2>
      <div class="header-info">
        <span class="exam-count">共 {{ exams.length }} 场考试</span>
        <span v-if="examStore.isCacheValid && examStore.hasExams" class="cache-indicator">
          <Icon name="package" :size="16" /> 使用缓存数据
        </span>
      </div>
      <div class="action-buttons">
        <button @click="refreshExams" class="btn btn-secondary" title="刷新考试列表">
          <Icon name="refresh-cw" :size="18" /> 刷新
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-group">
        <label>搜索考试：</label>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索考试名称..." 
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label>级别筛选：</label>
        <select v-model="filterLevel" class="filter-select">
          <option value="">全部</option>
          <option value="1">GESP 1级</option>
          <option value="2">GESP 2级</option>
          <option value="3">GESP 3级</option>
          <option value="4">GESP 4级</option>
          <option value="5">GESP 5级</option>
          <option value="6">CSP-J</option>
        </select>
      </div>
      <div class="filter-group">
        <label>类型筛选：</label>
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="真题">真题</option>
          <option value="模拟">模拟</option>
          <option value="专项">专项</option>
        </select>
      </div>
    </div>

    <!-- 考试列表 -->
    <div class="exams-table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner">●</div>
        <p>加载中...</p>
      </div>

      <table v-else-if="filteredExams.length > 0" class="exams-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>考试名称</th>
            <th>级别</th>
            <th>类型</th>
            <th>题目数量</th>
            <th>创建时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(exam, index) in filteredExams" :key="exam.id" @click="toggleExamExpansion(exam.id)" class="table-row">
            <td>{{ index + 1 }}</td>
            <td class="name-cell">
              <div class="exam-name-preview">
                {{ exam.name || '考试名称加载中...' }}
              </div>
              <div v-if="exam.description" class="exam-description-preview">
                {{ truncateText(exam.description, 40) }}
              </div>
            </td>
            <td>
              <span class="level-badge">{{ getLevelText(exam.level || 1) }}</span>
            </td>
            <td>
              <span class="type-badge" :class="`type-${exam.type || '真题'}`">
                {{ getTypeText(exam.type) }}
              </span>
            </td>
            <td class="question-count-cell">
              {{ exam.questions ? exam.questions.length : (exam.question_count || exam.total_questions || 0) }}
            </td>
            <td>{{ formatDate(exam.created_at) }}</td>
            <td>
              <span class="status-badge">进行中</span>
            </td>
            <td @click.stop>
              <div class="action-buttons">
                <button @click="viewExamDetails(exam.id)" class="btn-action btn-view" title="查看详情">
                  <Icon name="eye" :size="18" />
                </button>
                <button @click="openExportDialog(exam)" class="btn-action btn-export" title="导出">
                  <Icon name="download" :size="18" />
                </button>
                <button @click="openEditDialog(exam)" class="btn-action btn-edit" title="编辑">
                  <Icon name="edit" :size="18" />
                </button>
                <button @click="deleteExam(exam.id)" class="btn-action btn-delete" title="删除">
                  <Icon name="trash-2" :size="18" />
                </button>
              </div>
            </td>
          </tr>
          <!-- 展开的详细信息行 -->
          <tr v-for="examDetail in filteredExams.filter(exam => expandedExams.includes(exam.id))" :key="`detail-${examDetail.id}`" class="detail-row">
            <td colspan="8">
              <div class="exam-details">
                <!-- 考试基本信息 -->
                <div class="detail-section">
                  <h5>考试详细信息</h5>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">考试ID:</span>
                      <span class="info-value">#{{ examDetail.id }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">考试等级:</span>
                      <span class="info-value">{{ getLevelText(examDetail.level) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">考试类型:</span>
                      <span class="info-value">{{ getTypeText(examDetail.type) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">题目总数:</span>
                      <span class="info-value">{{ examDetail.questions ? examDetail.questions.length : (examDetail.total_questions || 0) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">创建时间:</span>
                      <span class="info-value">{{ formatDate(examDetail.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 完整描述 -->
                <div v-if="examDetail.description" class="detail-section">
                  <h5>考试描述</h5>
                  <div class="description-box">
                    <p>{{ examDetail.description }}</p>
                  </div>
                </div>

                <!-- 题目列表预览 -->
                <div v-if="examDetail.questions && examDetail.questions.length > 0" class="detail-section">
                  <h5>题目列表 ({{ examDetail.questions.length }}题)</h5>
                  <div class="questions-preview">
                    <div 
                      v-for="question in examDetail.questions.slice(0, 5)" 
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
                    <div v-if="examDetail.questions.length > 5" class="more-questions">
                      <span>还有 {{ examDetail.questions.length - 5 }} 道题目...</span>
                    </div>
                  </div>
                </div>

                <!-- 考试统计 -->
                <div class="detail-section">
                  <h5>考试统计</h5>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-label">题目数量</span>
                      <span class="stat-value">{{ examDetail.questions ? examDetail.questions.length : (examDetail.total_questions || 0) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">平均难度</span>
                      <span class="stat-value">{{ getAverageDifficulty(examDetail.questions || []) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">代码题数量</span>
                      <span class="stat-value">{{ getCodeQuestionCount(examDetail.questions || []) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">文本题数量</span>
                      <span class="stat-value">{{ getTextQuestionCount(examDetail.questions || []) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无考试</p>
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

    <!-- 导出选项弹窗 -->
    <ExportDialog
      :visible="showExportDialog"
      :exam="examToExport"
      @confirm="handleExportConfirm"
      @cancel="cancelExport"
    />
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import ConfirmDialog from './Dialog/ConfirmDialog.vue'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'
import ExportDialog from './Dialog/ExportDialog.vue'
import { useExamStore } from '../../stores/examStore'
import docxExportService from '../../services/docxExportService'
import Icon from '@/components/Icon.vue'

// Props 定义
interface Props {
  refreshTrigger?: number
}

const props = withDefaults(defineProps<Props>(), {
  refreshTrigger: 0
})

// 使用考试store
const examStore = useExamStore()

// 本地状态
const searchQuery = ref('')
const filterLevel = ref('')
const filterType = ref('')
const expandedExams = ref<number[]>([])

// 从store获取状态
const { exams, loading } = examStore

// 弹窗相关数据
const showDeleteDialog = ref(false)
const examToDelete = ref<number | null>(null)

const showSuccessMessage = ref(false)
const successMessage = ref('')

// 导出相关数据
const showExportDialog = ref(false)
const examToExport = ref<any>(null)

// 截断文本
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 获取考试列表
async function fetchExams(forceRefresh = false) {
  try {
    await examStore.fetchExams(forceRefresh)
  } catch (error: any) {
    console.error('获取考试列表失败:', error)
    alert('获取考试列表失败: ' + (error.response?.data?.error || error.message))
  }
}

// 过滤考试
const filteredExams = computed(() => {
  let list = [...examStore.exams.value] // 创建副本避免修改原始数据
  
  // 按等级过滤
  if (filterLevel.value) {
    list = list.filter(exam => String(exam.level || 1) === filterLevel.value)
  }
  
  // 按类型过滤
  if (filterType.value) {
    list = list.filter(exam => (exam.type || '真题') === filterType.value)
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(exam => 
      exam.name?.toLowerCase().includes(query) ||
      exam.description?.toLowerCase().includes(query)
    )
  }
  
  return list
})

// 切换考试展开状态
function toggleExamExpansion(id: number) {
  const idx = expandedExams.value.indexOf(id)
  if (idx === -1) {
    expandedExams.value.push(id)
    // 预加载考试详情
    const exam = examStore.exams.value.find(e => e.id === id)
    if (exam && !exam.questions) {
      examStore.preloadExamDetails(id)
    }
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

// 导出弹窗事件处理
function openExportDialog(exam: any) {
  examToExport.value = exam
  showExportDialog.value = true
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
    await examStore.deleteExam(examToDelete.value)
    showDeleteDialog.value = false
    examToDelete.value = null
    showSuccessMessage.value = true
    successMessage.value = '考试删除成功！'
  } catch (error: any) {
    console.error('删除考试失败:', error)
    alert('删除考试失败: ' + (error.response?.data?.error || error.message))
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

// 处理导出确认
async function handleExportConfirm(options: { withAnswers: boolean; withoutAnswers: boolean; answerOnly: boolean; customFilenames?: { withAnswers?: string; withoutAnswers?: string; answerOnly?: string } }) {
  try {
    // 确保考试数据包含完整的题目列表
    let examData = examToExport.value
    if (!examData.questions || examData.questions.length === 0) {
      // 如果题目列表未加载，先加载完整的考试数据
      console.log('导出前加载考试完整数据...')
      await examStore.preloadExamDetails(examData.id)
      // 从store中获取更新后的考试数据
      examData = examStore.getExam(examData.id) || examData
      
      // 如果还是没有题目，尝试直接请求API
      if (!examData.questions || examData.questions.length === 0) {
        try {
          const response = await axios.get(`${BASE_URL}/exams/${examData.id}`)
          examData = response.data
        } catch (apiError) {
          console.error('获取考试详情失败:', apiError)
          throw new Error('无法加载考试题目数据，请稍后重试')
        }
      }
    }
    
    // 确保questions是一个数组
    if (!Array.isArray(examData.questions)) {
      examData.questions = []
    }
    
    // 调用真正的docx导出服务
    await docxExportService.exportExam(examData, options)
    showExportDialog.value = false
    examToExport.value = null
    showSuccessMessage.value = true
    successMessage.value = '考试导出成功！文件已下载到您的设备。'
  } catch (error: any) {
    console.error('导出考试失败:', error)
    alert('导出考试失败: ' + (error.message || '未知错误'))
  }
}

// 取消导出
function cancelExport() {
  showExportDialog.value = false
  examToExport.value = null
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

// 类型文本
function getTypeText(type: string) {
  return type || '真题'
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

// 手动刷新考试列表
async function refreshExams() {
  try {
    await fetchExams(true) // 强制刷新
    showSuccessMessage.value = true
    successMessage.value = '考试列表已刷新！'
  } catch (error: any) {
    alert('刷新失败: ' + (error.response?.data?.error || error.message))
  }
}

// 查看考试详情（展开/收起）
function viewExamDetails(examId: number) {
  toggleExamExpansion(examId)
}

// 监听刷新触发器变化
watch(() => props.refreshTrigger, async (newTrigger, oldTrigger) => {
  if (newTrigger && newTrigger !== oldTrigger && newTrigger > 0) {
    console.log(`🔄 [ExamManagement] 检测到刷新触发器变化: ${oldTrigger} -> ${newTrigger}，开始刷新数据`)
    await fetchExams(true) // 强制刷新
    console.log('✅ [ExamManagement] 数据刷新完成')
  }
})

onMounted(async () => {
  console.log('📦 [ExamManagement] 组件挂载，初始化数据')
  // 只在没有缓存数据时才显示loading状态
  if (!examStore.hasExams.value) {
    await fetchExams()
  } else {
    // 如果有缓存数据，直接使用，在后台刷新
    console.log('📋 [ExamManagement] 使用现有考试缓存数据，在后台刷新')
    examStore.fetchExams()
  }
})
</script>

<style scoped>
.exam-management {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.section-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.exam-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.cache-indicator {
  color: #10b981;
  font-size: 12px;
  font-weight: 600;
  background: #d1fae5;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #a7f3d0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.filter-group label {
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.filter-input,
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
  flex: 1;
  min-width: 150px;
}

.filter-input:hover,
.filter-select:hover {
  border-color: #1e90ff;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.exams-table-container {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
}

.exams-table {
  width: 100%;
  border-collapse: collapse;
}

.exams-table thead {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
}

.exams-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: white;
  white-space: nowrap;
}

.exams-table td {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1e293b;
  max-width: 200px;
}

.exams-table tbody .table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.exams-table tbody .table-row:hover {
  background: #f8fafc;
}

.name-cell {
  max-width: 300px;
}

.exam-name-preview {
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  margin-bottom: 4px;
}

.exam-description-preview {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  line-height: 1.3;
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

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.type-真题 { background: #e0f7fa; color: #1e90ff; }
.type-模拟 { background: #fef3c7; color: #d97706; }
.type-专项 { background: #d1fae5; color: #065f46; }

.question-count-cell {
  font-weight: 600;
  color: #1e90ff;
}

.status-badge {
  background: #10b981;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
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

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover {
  background: #059669;
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

.btn-secondary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.detail-row {
  background: #f8fafc;
}

.detail-row td {
  padding: 0;
}

.exam-details {
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
  margin: 16px;
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

.description-box {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #374151;
}

.description-box p {
  margin: 0;
  line-height: 1.6;
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

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #1e90ff;
}

.spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
  color: #1e90ff;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  font-weight: 500;
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
  margin-right: 4px;
}

.action-icon {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action :deep(.lucide-icon) {
  flex-shrink: 0;
  color: inherit;
}
</style> 