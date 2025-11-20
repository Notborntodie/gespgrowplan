<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">📦</div>
        <h3 class="dialog-title">批量上传题目</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="dialog-content">
        <div class="batch-upload-area">
          <!-- 格式说明区域 -->
          <div class="batch-example">
            <div class="example-header">
              <h4>📋 批量上传格式示例</h4>
              <div class="format-badge">JSON 格式</div>
            </div>
            <div class="code-container" @click="copyExample">
              <pre class="example-code">{{ batchExample }}</pre>
              <div class="code-overlay">
                <span class="copy-hint">{{ copyStatus }}</span>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 -->
          <div class="input-section">
            <div class="input-header">
              <h5>📝 输入题目数据</h5>
              <div class="input-stats">
                <span class="char-count">{{ batchQuestionsText.length }} 字符</span>
              </div>
            </div>
            <div class="textarea-container">
              <textarea 
                v-model="batchQuestionsText" 
                placeholder="请输入批量题目数据（JSON格式）&#10;&#10;支持格式：&#10;• 题目文本&#10;• 代码内容&#10;• 选项配置&#10;• 正确答案&#10;• 难度等级&#10;• 题目日期 (YYYY-MM)"
                rows="20"
                class="batch-textarea"
              ></textarea>
              <div class="textarea-overlay">
                <div class="format-tips">
                  <span class="tip">💡 提示：确保JSON格式正确</span>
                  <span class="tip">📊 支持多题目批量上传</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮区域 -->
          <div class="action-section">
            <div class="action-buttons">
              <button 
                @click="clearBatchInput" 
                class="btn btn-secondary"
                :disabled="!batchQuestionsText.trim()"
              >
                🗑️ 清空输入
              </button>
              <button 
                @click="uploadBatchQuestions" 
                class="btn btn-primary" 
                :disabled="uploading || !batchQuestionsText.trim()"
              >
                <span v-if="uploading" class="loading-spinner">⏳</span>
                <span v-else>📤</span>
                {{ uploading ? '上传中...' : '批量上传' }}
              </button>
            </div>
            
            <!-- 上传状态显示 -->
            <div class="upload-status" v-if="uploading">
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span>正在处理批量数据...</span>
              </div>
            </div>
            
            <!-- 上传结果显示 -->
            <div v-if="uploadResult.type" class="upload-result" :class="uploadResult.type">
              <div class="result-icon">
                {{ uploadResult.type === 'success' ? '✅' : '❌' }}
              </div>
              <div class="result-message">
                {{ uploadResult.message }}
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

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref } from 'vue'
import axios from 'axios'
import SuccessMessageDialog from './SuccessMessageDialog.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const uploading = ref(false)
const batchQuestionsText = ref('')
const uploadResult = ref<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
const copyStatus = ref('点击可复制示例')

// 成功提示相关
const showSuccessMessage = ref(false)
const successMessage = ref('')

const batchExample = ref(`[
  {
    "question_text": "请分析以下代码的输出结果",
    "question_type": "code",
    "question_code": "#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    int a = 5, b = 3;\\n    cout << a + b << endl;\\n    return 0;\\n}",
    "correct_answer": "A",
    "explanation": "代码输出8",
    "level": 3,
    "difficulty": "medium",
    "question_date": "2025-07",
    "options": [
      {"label": "A", "value": "A", "text": "8"},
      {"label": "B", "value": "B", "text": "5"},
      {"label": "C", "value": "C", "text": "3"},
      {"label": "D", "value": "D", "text": "15"}
    ]
  }
]`)

// 复制示例功能
async function copyExample() {
  try {
    await navigator.clipboard.writeText(batchExample.value)
    copyStatus.value = '✅ 已复制到剪贴板'
    setTimeout(() => {
      copyStatus.value = '点击可复制示例'
    }, 2000)
  } catch (error) {
    copyStatus.value = '❌ 复制失败'
    setTimeout(() => {
      copyStatus.value = '点击可复制示例'
    }, 2000)
  }
}

async function uploadBatchQuestions() {
  if (!batchQuestionsText.value) {
    uploadResult.value = { type: 'error', message: '请输入批量题目数据' }
    return
  }

  try {
    const questions = JSON.parse(batchQuestionsText.value)
    uploading.value = true
    uploadResult.value = { type: null, message: '' }
    
          const response = await axios.post(`${BASE_URL}/upload-questions-batch`, { questions })
    uploadResult.value = { type: 'success', message: `批量上传成功，共上传 ${response.data.results.length} 道题目` }
    
    batchQuestionsText.value = ''
    // 显示成功提示
    successMessage.value = `批量上传成功，共上传 ${response.data.results.length} 道题目`
    showSuccessMessage.value = true
  } catch (error: any) {
    uploadResult.value = { type: 'error', message: '批量上传失败: ' + (error.response?.data?.error || error.message) }
  } finally {
    uploading.value = false
  }
}

function clearBatchInput() {
  batchQuestionsText.value = ''
  uploadResult.value = { type: null, message: '' }
  showSuccessMessage.value = false
  successMessage.value = ''
}

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  emit('close')
}

function closeSuccessMessage() {
  showSuccessMessage.value = false
  successMessage.value = ''
  uploadResult.value = { type: null, message: '' }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 18px;
  padding: 24px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
  animation: dialogSlideIn 0.3s ease-out;
  position: relative;
  border: 1.5px solid #b6e0fe;
  display: flex;
  flex-direction: column;
}

@keyframes dialogSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(-20px);}
  to { opacity: 1; transform: scale(1) translateY(0);}
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-radius: 12px;
  margin: -24px -24px 20px -24px;
}

.dialog-icon {
  font-size: 32px;
}

.dialog-title {
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
  margin-left: auto;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.batch-upload-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.batch-example {
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.example-header h4 {
  margin: 0;
  color: #1e40af;
  font-size: 18px;
  font-weight: 600;
}

.format-badge {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}

.code-container {
  position: relative;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

.code-container:hover {
  border-color: #1e90ff;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  transform: translateY(-2px);
}

.code-container:active {
  transform: translateY(0);
}

.example-code {
  margin: 0;
  padding: 20px;
  color: #f8fafc;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: transparent;
  white-space: pre-wrap;
  word-break: break-word;
}

.code-overlay {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(30, 144, 255, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 0 10px 0 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.input-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.input-header h5 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.input-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.char-count {
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #bae6fd;
}

.textarea-container {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.textarea-container:focus-within {
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.batch-textarea {
  width: 100%;
  min-height: 300px;
  padding: 20px;
  border: none;
  outline: none;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: transparent;
  resize: vertical;
  color: #1e293b;
}

.textarea-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(248, 250, 252, 0.9));
  padding: 20px;
  pointer-events: none;
}

.format-tips {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.tip {
  background: rgba(30, 144, 255, 0.1);
  color: #0369a1;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(30, 144, 255, 0.2);
}

.action-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 16px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-status {
  text-align: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #0369a1;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #1e90ff;
  border-radius: 50%;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.upload-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 12px;
  margin-top: 16px;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.upload-result.success {
  border-color: #bae6fd;
  background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%);
  color: #0369a1;
}

.upload-result.error {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fef3f2 0%, #f8fafc 100%);
  color: #991b1b;
}

.result-icon {
  font-size: 24px;
}

.result-message {
  flex: 1;
  text-align: left;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1976d2 0%, #5ba3d1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  border: 1.5px solid #cbd5e1;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  background: #f1f5f9;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}
</style>
