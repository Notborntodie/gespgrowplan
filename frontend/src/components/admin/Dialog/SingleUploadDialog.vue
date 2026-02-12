<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">📝</div>
        <h3 class="dialog-title">单个题目上传</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="dialog-content">
        <form @submit.prevent="uploadSingleQuestion" class="question-form">
          <div class="form-row">
            <div class="form-group">
              <label>等级：</label>
              <select v-model="newQuestion.level" required>
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">CSP-J</option>
              </select>
            </div>
            <div class="form-group">
              <label>难度：</label>
              <select v-model="newQuestion.difficulty">
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div class="form-group">
              <label>题目日期：</label>
              <input 
                type="month" 
                v-model="newQuestion.question_date" 
                placeholder="选择年月"
                class="date-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>题目内容：</label>
            <textarea v-model="newQuestion.question_text" required placeholder="请输入题目内容"></textarea>
          </div>

          <div class="form-group">
            <label>题目类型：</label>
            <select v-model="newQuestion.question_type">
              <option value="text">文本题</option>
              <option value="code">代码题</option>
            </select>
          </div>

          <!-- 代码题目内容 -->
          <div v-if="newQuestion.question_type === 'code'" class="form-group">
            <label>代码内容：</label>
            <textarea 
              v-model="newQuestion.question_code" 
              placeholder="请输入代码内容"
              class="code-textarea"
              rows="10"
            ></textarea>
            <div class="code-hint">
              <small>支持各种编程语言的代码，如C++、Python、Java等</small>
            </div>
          </div>

          <!-- 图片上传 -->
          <div class="form-group">
            <label>题目图片：</label>
            <input type="file" @change="handleImageUpload" accept="image/*" />
            <div v-if="uploadedImage" class="image-preview">
              <img :src="uploadedImage" alt="题目图片" />
              <button type="button" @click="removeImage" class="btn-remove-image">删除图片</button>
            </div>
          </div>

          <!-- 选项管理 -->
          <div class="options-section">
            <label>选项：</label>
            <div v-for="(option, index) in newQuestion.options" :key="index" class="option-item">
              <div class="option-inputs">
                <input v-model="option.label" placeholder="标签(A/B/C/D)" class="option-label" />
                <input v-model="option.value" placeholder="值" class="option-value" />
                <input v-model="option.text" placeholder="选项内容" class="option-text" />
                <button type="button" @click="removeOption(index)" class="btn-remove">删除</button>
              </div>
            </div>
            <button type="button" @click="addOption" class="btn btn-secondary">添加选项</button>
          </div>

          <div class="form-group">
            <label>正确答案：</label>
            <input v-model="newQuestion.correct_answer" required placeholder="如：A" />
          </div>

          <div class="form-group">
            <label>解释：</label>
            <textarea v-model="newQuestion.explanation" placeholder="题目解释"></textarea>
          </div>

          <!-- 知识点关联 -->
          <div class="form-group">
            <label>关联知识点：</label>
            <div class="knowledge-points-selection">
              <label v-for="kp in knowledgePoints" :key="kp.id" class="kp-checkbox">
                <input 
                  type="checkbox" 
                  :value="kp.id" 
                  v-model="newQuestion.knowledge_point_ids" 
                />
                {{ kp.name }} ({{ kp.category }})
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">取消</button>
        <button @click="uploadSingleQuestion" class="btn btn-primary" :disabled="uploading">
          {{ uploading ? '上传中...' : '上传题目' }}
        </button>
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

<script setup lang="ts">import { BASE_URL, API_SERVER_BASE, normalizeImageUrl } from '@/config/api'

import { ref, onMounted } from 'vue'
import axios from 'axios'
import SuccessMessageDialog from './SuccessMessageDialog.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const uploading = ref(false)
const uploadedImage = ref('')
const knowledgePoints = ref<any[]>([])

// 成功提示相关
const showSuccessMessage = ref(false)
const successMessage = ref('')

const newQuestion = ref({
  question_text: '',
  question_type: 'text',
  question_code: '',
  correct_answer: '',
  explanation: '',
  level: 1,
  difficulty: 'medium',
  image_url: null,
  question_date: '',
  knowledge_point_ids: [],
  options: [] as any[]
})

// 获取知识点列表
async function fetchKnowledgePoints() {
  try {
          const response = await axios.get(`${BASE_URL}/knowledge-points`)
    knowledgePoints.value = response.data
  } catch (error) {
    console.error('获取知识点失败:', error)
  }
}

// 图片上传相关方法
async function handleImageUpload(event: any) {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await axios.post(`${BASE_URL}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    let url = response.data.imageUrl
    if (url) {
      let normalized = normalizeImageUrl(url)
      if (!normalized) normalized = url
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = normalized.startsWith('/') ? `${API_SERVER_BASE}${normalized}` : `${API_SERVER_BASE}/${normalized}`
      }
      url = normalized
    }
    uploadedImage.value = url
    newQuestion.value.image_url = url
  } catch (error: any) {
    alert('图片上传失败: ' + error.response?.data?.error || error.message)
  }
}

function removeImage() {
  uploadedImage.value = ''
  newQuestion.value.image_url = null
}

// 选项管理方法
function addOption() {
  newQuestion.value.options.push({
    label: '',
    value: '',
    text: ''
  })
}

function removeOption(index: number) {
  newQuestion.value.options.splice(index, 1)
}

// 题目上传方法
async function uploadSingleQuestion() {
  if (!newQuestion.value.question_text || !newQuestion.value.correct_answer) {
    alert('请填写必填字段')
    return
  }

  // 处理题目日期格式
  if (newQuestion.value.question_date) {
    // 将 YYYY-MM 格式转换为后端期望的格式
    newQuestion.value.question_date = newQuestion.value.question_date
  }

  uploading.value = true
  try {
          const response = await axios.post(`${BASE_URL}/upload-question`, newQuestion.value)
    // 显示成功提示
    successMessage.value = '题目上传成功！'
    showSuccessMessage.value = true
    
    // 重置表单
    newQuestion.value = {
      question_text: '',
      question_type: 'text',
      question_code: '',
      correct_answer: '',
      explanation: '',
      level: 1,
      difficulty: 'medium',
      image_url: null,
      question_date: '',
      knowledge_point_ids: [],
      options: []
    }
    uploadedImage.value = ''
    
    handleClose()
  } catch (error: any) {
    alert('题目上传失败: ' + error.response?.data?.error || error.message)
  } finally {
    uploading.value = false
  }
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
}

onMounted(() => {
  fetchKnowledgePoints()
})
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
  max-width: 800px;
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

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  margin-bottom: 16px;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.code-textarea {
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: #1e293b;
  color: #f8fafc;
  border: 1.5px solid #475569;
  border-radius: 10px;
  padding: 16px;
  resize: vertical;
  min-height: 200px;
}

.code-hint {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.image-preview {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
}

.btn-remove-image {
  background: #ef4444;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remove-image:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.options-section {
  margin-bottom: 20px;
}

.options-section label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.option-item {
  margin-bottom: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
}

.option-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.option-label,
.option-value,
.option-text {
  padding: 8px 12px;
  border: 1.5px solid #b6e0fe;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.option-label {
  width: 60px;
  text-align: center;
}

.option-value {
  width: 80px;
  text-align: center;
}

.option-text {
  flex: 1;
  min-width: 150px;
}

.btn-remove {
  background: #ef4444;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.knowledge-points-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.kp-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.kp-checkbox:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.kp-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #1e90ff;
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
}

.btn-primary {
  background: #1e90ff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}
</style> 