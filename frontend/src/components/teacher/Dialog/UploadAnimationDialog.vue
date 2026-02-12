<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog dialog-large" @click.stop>
      <div class="dialog-header">
        <h3>上传动画HTML</h3>
        <button @click="closeDialog" class="btn-close">&times;</button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit" class="upload-form">
          <!-- 标题 -->
          <div class="form-group">
            <label for="animation-title">动画标题 *</label>
            <input 
              id="animation-title"
              v-model="formData.title" 
              type="text" 
              required 
              placeholder="请输入动画标题"
              class="form-input"
            />
          </div>
          
          <!-- 描述 -->
          <div class="form-group">
            <label for="animation-description">动画描述</label>
            <textarea 
              id="animation-description"
              v-model="formData.description" 
              placeholder="请输入动画描述（可选）"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <!-- 分类 -->
          <div class="form-group">
            <label for="animation-category">分类</label>
            <select 
              id="animation-category"
              v-model="formData.category" 
              class="form-select"
            >
              <option value="">选择分类（可选）</option>
              <option value="深度优先搜索 (DFS)">深度优先搜索 (DFS)</option>
              <option value="广度优先搜索 (BFS)">广度优先搜索 (BFS)</option>
              <option value="动态规划">动态规划</option>
              <option value="贪心算法">贪心算法</option>
              <option value="图论">图论</option>
              <option value="数据结构">数据结构</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <!-- 图标 -->
          <div class="form-group">
            <label for="animation-icon">图标</label>
            <input 
              id="animation-icon"
              v-model="formData.icon" 
              type="text" 
              placeholder="图标名称（默认：play-circle）"
              class="form-input"
            />
            <small class="form-hint">可用的图标名称：play-circle, grid, tree, layers, code 等</small>
          </div>
          
          <!-- 文件上传 -->
          <div class="form-group">
            <label>HTML文件 *</label>
            <div class="file-upload-area" 
                 @dragover.prevent="isDragging = true"
                 @dragleave.prevent="isDragging = false"
                 @drop.prevent="handleFileDrop">
              <input 
                ref="fileInput"
                type="file" 
                accept=".html"
                @change="handleFileSelect"
                class="file-input"
              />
              <div v-if="!selectedFile" class="upload-placeholder" :class="{ dragging: isDragging }">
                <Icon name="upload" :size="32" class="upload-icon" />
                <p class="upload-text">点击选择或拖拽HTML文件到此处</p>
                <p class="upload-hint">支持 .html 文件，最大 10MB</p>
              </div>
              <div v-else class="file-selected">
                <Icon name="file" :size="24" class="file-icon" />
                <span class="file-name">{{ selectedFile.name }}</span>
                <button type="button" @click="removeFile" class="btn-remove-file">
                  <Icon name="x" :size="18" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- 上传进度 -->
          <div v-if="uploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <div class="progress-text">上传中... {{ uploadProgress }}%</div>
          </div>
          
          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            <Icon name="alert-circle" :size="18" />
            <span>{{ errorMessage }}</span>
          </div>
          
          <!-- 操作按钮 -->
          <div class="dialog-actions">
            <button type="button" @click="closeDialog" class="btn-secondary" :disabled="uploading">
              取消
            </button>
            <button type="submit" class="btn-primary" :disabled="uploading || !selectedFile || !formData.title.trim()">
              {{ uploading ? '上传中...' : '上传' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { BASE_URL } from '@/config/api'
import axios from 'axios'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  visible: boolean
  teacherId: number
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const formData = reactive({
  title: '',
  description: '',
  category: '',
  icon: 'play-circle'
})

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')

// 监听visible变化，重置表单
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.category = ''
  formData.icon = 'play-circle'
  selectedFile.value = null
  uploading.value = false
  uploadProgress.value = 0
  errorMessage.value = ''
  isDragging.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      errorMessage.value = '请选择HTML文件'
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = '文件大小不能超过10MB'
      return
    }
    selectedFile.value = file
    errorMessage.value = ''
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      errorMessage.value = '请选择HTML文件'
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = '文件大小不能超过10MB'
      return
    }
    selectedFile.value = file
    errorMessage.value = ''
    if (fileInput.value) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.value.files = dataTransfer.files
    }
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleOverlayClick = () => {
  if (!uploading.value) {
    closeDialog()
  }
}

const closeDialog = () => {
  if (!uploading.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  if (!selectedFile.value || !formData.title.trim()) {
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''
  
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('htmlFile', selectedFile.value)
    formDataToSend.append('title', formData.title.trim())
    if (formData.description.trim()) {
      formDataToSend.append('description', formData.description.trim())
    }
    if (formData.category) {
      formDataToSend.append('category', formData.category)
    }
    if (formData.icon) {
      formDataToSend.append('icon', formData.icon)
    }
    
    // 使用axios上传，支持进度
    const response = await axios.post(
      `${BASE_URL}/teacher/${props.teacherId}/animations/upload`,
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
          }
        }
      }
    )
    
    if (response.data.success) {
      resetForm()
      emit('success')
      emit('close')
    } else {
      errorMessage.value = response.data.error || '上传失败'
    }
  } catch (error: any) {
    console.error('上传动画失败:', error)
    errorMessage.value = error.response?.data?.error || error.message || '上传失败'
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.dialog-large {
  max-width: 700px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
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
  padding: 24px 28px;
  border-bottom: 2px solid #e0f2fe;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-radius: 20px 20px 0 0;
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 1.8rem;
  font-weight: 900;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-size: 24px;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
  border-width: 3px;
}

.dialog-body {
  padding: 24px;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 14px 16px;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: white;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #1e90ff;
  border-width: 4px;
  box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
}

.form-hint {
  font-size: 12px;
  color: #64748b;
  margin-top: -4px;
}

.file-upload-area {
  position: relative;
  border: 3px dashed #e2e8f0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.file-upload-area.dragging {
  border-color: #1e90ff;
  background: #eff6ff;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #94a3b8;
}

.upload-text {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.upload-hint {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #1e90ff;
}

.file-icon {
  color: #1e90ff;
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  text-align: left;
}

.btn-remove-file {
  background: #fee2e2;
  border: none;
  color: #dc2626;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove-file:hover {
  background: #fecaca;
}

.upload-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #64748b;
  text-align: center;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 2px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #64748b;
  border: 3px solid #e2e8f0;
  padding: 14px 24px;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  transform: translateY(-2px) scale(1.05);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: 5px solid #0c7cd5;
  padding: 14px 24px;
  border-radius: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(30, 144, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
