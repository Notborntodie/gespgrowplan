<template>
  <div v-if="visible" class="modal-overlay" @click="handleCancel">
    <div class="export-dialog" @click.stop>
      <div class="dialog-header">
        <h3>导出错题为Word文档</h3>
        <button @click="handleCancel" class="close-btn">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="submission-info">
          <h4>{{ submission?.real_name || submission?.username || '学生' }} - {{ submission?.exam_name || '考试' }}</h4>
          <p>第 {{ submission?.attempt_number }} 次提交</p>
          <div class="submission-stats">
            <span class="stat">提交时间: {{ formatDate(submission?.submit_time) }}</span>
            <span class="stat">分数: {{ submission?.score }} 分</span>
            <span class="stat" v-if="wrongQuestionsCount > 0">错题数量: {{ wrongQuestionsCount }} 题</span>
          </div>
        </div>
        
        <div class="export-preview">
          <h5>导出预览：</h5>
          <div class="preview-content">
            <div class="preview-item" :class="{ 'editing': isEditingFilename }">
              <span class="preview-icon">📄</span>
              <div v-if="!isEditingFilename" class="preview-text-container" @click="startEditFilename">
                <span class="preview-text">{{ getPreviewFilename() }}</span>
                <span class="edit-hint">点击编辑</span>
              </div>
              <div v-else class="filename-edit-container">
                <input 
                  v-model="customFilename"
                  type="text"
                  class="filename-edit-input"
                  @blur="confirmEditFilename"
                  @keyup.enter="confirmEditFilename"
                  @keyup.escape="cancelEditFilename"
                  maxlength="100"
                  ref="filenameInput"
                />
                <div class="edit-actions">
                  <button @click="confirmEditFilename" class="edit-btn confirm-btn">✓</button>
                  <button @click="cancelEditFilename" class="edit-btn cancel-btn">✗</button>
                </div>
              </div>
            </div>
            <div v-if="wrongQuestionsCount === 0" class="preview-placeholder">
              该次提交没有错题，无需导出
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button @click="handleCancel" class="btn btn-cancel">取消</button>
        <button 
          @click="handleConfirm" 
          class="btn btn-confirm"
          :disabled="wrongQuestionsCount === 0"
        >
          导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

// Props
interface Props {
  visible: boolean
  submission: any
  wrongQuestions: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  confirm: [filename?: string]
  cancel: []
}>()

// 响应式数据
const customFilename = ref('')
const isEditingFilename = ref(false)
const filenameInput = ref<HTMLInputElement | null>(null)

// 计算错题数量
const wrongQuestionsCount = computed(() => {
  return props.wrongQuestions?.length || 0
})

// 监听弹窗显示状态，重置选项
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    customFilename.value = ''
    isEditingFilename.value = false
  }
})

// 方法
function handleConfirm() {
  if (wrongQuestionsCount.value === 0) {
    return
  }
  
  emit('confirm', customFilename.value.trim() || undefined)
}

function handleCancel() {
  emit('cancel')
}

// 开始编辑文件名
function startEditFilename() {
  isEditingFilename.value = true
  // 如果还没有自定义文件名，使用完整的预览文件名
  if (!customFilename.value.trim()) {
    customFilename.value = getPreviewFilename().replace('.docx', '') // 移除.docx后缀，让用户编辑
  }
  // 下一帧聚焦输入框
  nextTick(() => {
    if (filenameInput.value) {
      filenameInput.value.focus()
      filenameInput.value.select()
    }
  })
}

// 确认编辑文件名
function confirmEditFilename() {
  isEditingFilename.value = false
}

// 取消编辑文件名
function cancelEditFilename() {
  customFilename.value = '' // 清空当前编辑的文件名
  isEditingFilename.value = false
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0]
}

// 计算预览文件名
function getPreviewFilename(): string {
  // 如果有自定义文件名，直接使用（添加.docx后缀）
  if (customFilename.value.trim()) {
    const filename = customFilename.value.trim()
    // 如果已经包含.docx后缀，直接返回
    if (filename.endsWith('.docx')) {
      return filename
    }
    // 否则添加.docx后缀
    return `${filename}.docx`
  }
  
  // 没有自定义文件名时，使用默认格式
  const studentName = props.submission?.real_name || props.submission?.username || '学生'
  const examName = props.submission?.exam_name || '考试'
  const attemptNumber = props.submission?.attempt_number || 1
  const date = getCurrentDate()
  return `${studentName}_${examName}_第${attemptNumber}次错题_${date}.docx`
}
</script>

<style scoped>
/* 导出弹窗样式 */
.modal-overlay {
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
  backdrop-filter: blur(4px);
}

.export-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 550px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #87ceeb 0%, #1e90ff 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dialog-content {
  padding: 24px;
}

.submission-info {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #b6e0fe;
}

.submission-info h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.submission-info p {
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 14px;
}

.submission-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  background: rgba(30, 144, 255, 0.1);
  color: #1e90ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.export-preview {
  margin-bottom: 24px;
}

.export-preview h5 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.preview-content {
  background: #f9fafb;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.preview-item:hover {
  border-color: #1e90ff;
  background: #f8fafc;
}

.preview-item.editing {
  border-color: #1e90ff;
  background: #f0f9ff;
  box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.1);
}

.preview-text-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}

.preview-text-container:hover .edit-hint {
  opacity: 1;
}

.edit-hint {
  font-size: 11px;
  color: #1e90ff;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-style: italic;
}

.filename-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.filename-edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #1e90ff;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  font-family: monospace;
}

.filename-edit-input:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.2);
}

.edit-actions {
  display: flex;
  gap: 4px;
}

.edit-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.confirm-btn {
  background: #10b981;
  color: white;
}

.confirm-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn:hover {
  background: #dc2626;
}

.preview-icon {
  font-size: 16px;
}

.preview-text {
  font-size: 13px;
  color: #374151;
  font-family: monospace;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-confirm {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}

.btn-confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-dialog {
    width: 95%;
    max-width: none;
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .submission-info {
    padding: 16px;
  }
  
  .submission-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .dialog-footer {
    padding: 12px 16px 16px 16px;
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

