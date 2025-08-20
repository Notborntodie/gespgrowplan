<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">🤖</div>
        <h3 class="dialog-title">AI上传题目</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="dialog-content">
        <div class="ai-upload-area">
          <!-- AI功能说明区域 -->
          <div class="ai-description">
            <div class="description-header">
              <h4>🚀 AI智能题目生成</h4>
              <div class="feature-badge">AI 驱动</div>
            </div>
            <div class="description-content">
              <p>通过AI技术，您可以：</p>
              <ul>
                <li>📄 上传PDF文件自动提取题目</li>
                <li>🤖 使用大模型智能解析内容</li>
                <li>📝 自动生成标准化的题目格式</li>
                <li>📤 一键批量上传到题库</li>
              </ul>
            </div>
          </div>
          
          <!-- PDF上传区域 -->
          <div class="upload-section">
            <div class="upload-header">
              <h5>📄 上传PDF文件</h5>
            </div>
            
            <div class="file-upload-area">
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileChange" 
                accept=".pdf" 
                class="file-input"
                style="display: none;"
              />
              <div class="upload-zone" @click="triggerFileInput">
                <div class="upload-icon">📄</div>
                <div class="upload-text">
                  <span v-if="!selectedFile">点击选择PDF文件</span>
                  <span v-else>{{ selectedFile.name }}</span>
                </div>
                <div class="upload-hint" v-if="!selectedFile">
                  支持PDF格式，文件大小不超过10MB
                </div>
              </div>
            </div>
            
            <!-- 处理参数配置 -->
            <div class="config-section" v-if="selectedFile">
              <div class="config-header">
                <h6>⚙️ 处理参数</h6>
              </div>
              
              <div class="config-grid">
                <div class="config-item">
                  <label>并行线程数:</label>
                  <select v-model="parallelWorkers" class="config-select">
                    <option value="1">1 (串行)</option>
                    <option value="2">2</option>
                    <option value="3" selected>3 (推荐)</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                  </select>
                </div>
                
                <div class="config-item">
                  <label>预期题目数:</label>
                  <input 
                    type="number" 
                    v-model="expectedQuestions" 
                    placeholder="可选，用于校准"
                    class="config-input"
                    min="1"
                    max="1000"
                  >
                </div>
                
                <div class="config-item">
                  <label>题目等级:</label>
                  <select v-model="presetLevel" class="config-select">
                    <option value="1">GESP 1级</option>
                    <option value="2">GESP 2级</option>
                    <option value="3">GESP 3级</option>
                    <option value="4">GESP 4级</option>
                    <option value="5">GESP 5级</option>
                    <option value="6">CSP-J</option>
                  </select>
                </div>
                
                <div class="config-item">
                  <label>题目日期:</label>
                  <input 
                    type="month" 
                    v-model="presetQuestionDate" 
                    placeholder="选择年月"
                    class="config-input"
                  >
                </div>
              </div>
            </div>
          </div>
          
          <!-- 处理状态显示 -->
          <div class="processing-section" v-if="processing">
            <div class="processing-header">
              <h5>🔄 处理进度</h5>
            </div>
            <div class="processing-status">
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span>{{ processingMessage }}</span>
              </div>
              <div class="progress-info" v-if="progressInfo">
                <div class="progress-item">
                  <span>文本长度:</span>
                  <span>{{ progressInfo.textLength }} 字符</span>
                </div>
                <div class="progress-item">
                  <span>分割片段:</span>
                  <span>{{ progressInfo.segmentCount }}</span>
                </div>
                <div class="progress-item">
                  <span>已找到题目:</span>
                  <span>{{ progressInfo.questionsFound }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 处理结果显示 -->
          <div class="result-section" v-if="processedQuestions.length > 0">
            <div class="result-header">
              <h5>📋 处理结果</h5>
              <div class="result-actions">
                <button @click="copyQuestionsJson" class="btn btn-secondary">
                  📋 复制JSON
                </button>
                <button @click="clearResults" class="btn btn-secondary">
                  🗑️ 清空结果
                </button>
              </div>
            </div>
            
            <div class="questions-preview">
              <div class="preview-header">
                <span>共找到 {{ processedQuestions.length }} 个题目</span>
                <span class="preview-toggle" @click="togglePreview">
                  {{ showPreview ? '收起预览' : '展开预览' }}
                </span>
              </div>
              
              <div class="questions-list" v-if="showPreview">
                <div 
                  v-for="(question, index) in processedQuestions" 
                  :key="index"
                  class="question-item"
                >
                  <div class="question-header">
                    <span class="question-type">{{ question.question_type.toUpperCase() }}</span>
                    <span class="question-number">题目 {{ index + 1 }}</span>
                  </div>
                  <div class="question-text">{{ question.question_text }}</div>
                  <div class="question-code" v-if="question.question_code">
                    <pre>{{ question.question_code }}</pre>
                  </div>
                  <div class="question-options">
                    <div 
                      v-for="option in question.options" 
                      :key="option.label"
                      class="option-item"
                      :class="{ correct: option.value === question.correct_answer }"
                    >
                      <span class="option-label">{{ option.label }}.</span>
                      <span class="option-text">{{ option.text }}</span>
                    </div>
                  </div>
                  <div class="question-answer">
                    <strong>正确答案:</strong> {{ question.correct_answer }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮区域 -->
          <div class="action-section">
            <div class="action-buttons">
              <button 
                @click="resetForm" 
                class="btn btn-secondary"
                :disabled="processing"
              >
                🔄 重置
              </button>
              <button 
                @click="processPDF" 
                class="btn btn-primary" 
                :disabled="processing || !selectedFile"
              >
                <span v-if="processing" class="loading-spinner">⏳</span>
                <span v-else>🤖</span>
                {{ processing ? '处理中...' : '开始处理' }}
              </button>
              <button 
                @click="uploadToBatch" 
                class="btn btn-success" 
                :disabled="processedQuestions.length === 0"
              >
                📤 批量上传
              </button>
            </div>
            
            <!-- 处理结果显示 -->
            <div v-if="processResult.type" class="process-result" :class="processResult.type">
              <div class="result-icon">
                {{ processResult.type === 'success' ? '✅' : '❌' }}
              </div>
              <div class="result-message">
                {{ processResult.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">关闭</button>
      </div>
    </div>
  </div>
  
  <!-- 成功提示弹窗 -->
  <SuccessMessageDialog
    :visible="showSuccessMessage"
    :message="successMessage"
    @close="closeSuccessMessage"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import SuccessMessageDialog from './SuccessMessageDialog.vue'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'upload-batch', questions: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 文件相关
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)

// 处理参数
const parallelWorkers = ref(3)
const expectedQuestions = ref('')
const presetLevel = ref(3)
const presetQuestionDate = ref('')

// 处理状态
const processing = ref(false)
const processingMessage = ref('')
const progressInfo = ref<any>(null)
const processResult = ref<{
  type: 'success' | 'error' | null
  message: string
}>({ type: null, message: '' })

// 处理结果
const processedQuestions = ref<any[]>([])
const showPreview = ref(false)

// 成功提示相关
const showSuccessMessage = ref(false)
const successMessage = ref('')

// 方法
function handleOverlayClick() {
  emit('close')
}

function handleClose() {
  emit('close')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    // 重置处理结果
    processedQuestions.value = []
    processResult.value = { type: null, message: '' }
  }
}

function resetForm() {
  selectedFile.value = null
  parallelWorkers.value = 3
  expectedQuestions.value = ''
  presetLevel.value = 3
  presetQuestionDate.value = ''
  processedQuestions.value = []
  processResult.value = { type: null, message: '' }
  progressInfo.value = null
  showPreview.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function processPDF() {
  if (!selectedFile.value) return
  
  processing.value = true
  processingMessage.value = '正在上传PDF文件...'
  processResult.value = { type: null, message: '' }
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('use_llm', 'true')
    formData.append('parallel_workers', parallelWorkers.value.toString())
    if (expectedQuestions.value) {
      formData.append('expected_questions', expectedQuestions.value)
    }
    
    processingMessage.value = '正在处理PDF文件...'
    
    // 调用后端API
    const response = await fetch('http://localhost:8000/api/extract', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.status === 'success') {
      // 为所有题目添加预设的level和question_date
      const questionsWithPresets = (result.questions || []).map((question: any) => ({
        ...question,
        level: presetLevel.value,
        question_date: presetQuestionDate.value
      }))
      
      processedQuestions.value = questionsWithPresets
      processResult.value = {
        type: 'success',
        message: `成功处理PDF文件！提取到 ${processedQuestions.value.length} 个题目`
      }
      showPreview.value = true
      
      // 显示成功提示弹窗
      successMessage.value = `成功处理PDF文件！提取到 ${processedQuestions.value.length} 个题目`
      showSuccessMessage.value = true
    } else {
      throw new Error(result.error || '处理失败')
    }
    
  } catch (error) {
    console.error('处理PDF失败:', error)
    processResult.value = {
      type: 'error',
      message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    processing.value = false
    processingMessage.value = ''
  }
}

function copyQuestionsJson() {
  const jsonText = JSON.stringify(processedQuestions.value, null, 2)
  navigator.clipboard.writeText(jsonText).then(() => {
    alert('题目JSON已复制到剪贴板！')
  }).catch(() => {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = jsonText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('题目JSON已复制到剪贴板！')
  })
}

function clearResults() {
  processedQuestions.value = []
  processResult.value = { type: null, message: '' }
  showPreview.value = false
}

function togglePreview() {
  showPreview.value = !showPreview.value
}

async function uploadToBatch() {
  if (processedQuestions.value.length > 0) {
    try {
      const response = await axios.post('http://localhost:3000/api/questions/batch', { 
        questions: processedQuestions.value 
      })
      
      // 显示成功消息
      processResult.value = { 
        type: 'success', 
        message: `批量上传成功，共上传 ${response.data.results.length} 道题目` 
      }
      
      // 显示成功提示弹窗
      successMessage.value = `批量上传成功，共上传 ${response.data.results.length} 道题目`
      showSuccessMessage.value = true
      
      // 清空处理结果
      processedQuestions.value = []
      showPreview.value = false
      
    } catch (error: any) {
      processResult.value = { 
        type: 'error', 
        message: '批量上传失败: ' + (error.response?.data?.error || error.message) 
      }
    }
  }
}

function closeSuccessMessage() {
  showSuccessMessage.value = false
  successMessage.value = ''
}
</script>

<style scoped>
/* 继承基础样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border-bottom: 1px solid #b6e0fe;
}

.dialog-icon {
  font-size: 28px;
  margin-right: 16px;
}

.dialog-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.ai-upload-area {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.ai-description {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #b6e0fe;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px 0 rgba(30,144,255,0.10);
}

.description-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.description-header h4 {
  margin: 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
}

.feature-badge {
  background: #e0f2fe;
  color: #1e90ff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #b6e0fe;
}

.description-content p {
  margin: 0 0 12px 0;
  color: #374151;
  font-weight: 500;
}

.description-content ul {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
}

.description-content li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.upload-section {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.upload-header h5 {
  margin: 0 0 20px 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
}

.file-upload-area {
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed #b6e0fe;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-zone:hover {
  border-color: #1e90ff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #64748b;
}

.config-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

.config-header h6 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.config-select,
.config-input {
  padding: 10px 12px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.config-select:focus,
.config-input:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.processing-section {
  background: #f0f9ff;
  border: 1.5px solid #b6e0fe;
  border-radius: 12px;
  padding: 20px;
}

.processing-header h5 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
}

.processing-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1e90ff;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: #1e90ff;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}

@keyframes blink {
  0% { opacity: 1; }
  100% { opacity: 0.3; }
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
}

.result-section {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-header h5 {
  margin: 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.questions-preview {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
  color: #374151;
}

.preview-toggle {
  color: #1e90ff;
  cursor: pointer;
  font-weight: 500;
}

.preview-toggle:hover {
  text-decoration: underline;
}

.questions-list {
  max-height: 400px;
  overflow-y: auto;
}

.question-item {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.question-item:last-child {
  border-bottom: none;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-type {
  background: #1e90ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.question-number {
  font-size: 12px;
  color: #64748b;
}

.question-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
  line-height: 1.5;
}

.question-code {
  background: #1e293b;
  color: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.question-code pre {
  margin: 0;
  white-space: pre-wrap;
}

.question-options {
  margin-bottom: 12px;
}

.option-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.option-item.correct {
  color: #059669;
  font-weight: 500;
}

.option-label {
  font-weight: 600;
  color: #1e90ff;
  min-width: 20px;
}

.question-answer {
  font-size: 13px;
  color: #64748b;
}

.action-section {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10);
  transition: background 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #1976d2 0%, #0066cc 100%);
  box-shadow: 0 4px 12px 0 rgba(30,144,255,0.20);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #b6e0fe;
  color: #fff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  transition: background 0.2s, color 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-success {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(16,185,129,0.10);
  transition: background 0.2s, box-shadow 0.2s;
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(90deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 12px 0 rgba(16,185,129,0.20);
  transform: translateY(-1px);
}

.btn-success:disabled {
  background: #9ca3af;
  color: #fff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.process-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 18px;
}

.process-result.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.process-result.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.result-icon {
  font-size: 16px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dialog-actions {
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-content {
    padding: 20px;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .action-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .action-buttons {
    justify-content: center;
  }
}
</style> 