<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">✏️</div>
        <h3 class="dialog-title">编辑题目</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="dialog-content">
        <div v-if="question" class="question-edit-content">
          <form @submit.prevent="handleSubmit">
            <!-- 基本信息编辑 -->
            <div class="edit-section">
              <h5>基本信息</h5>
              <div class="form-row">
                <div class="form-group">
                  <label>等级：</label>
                  <select v-model="editForm.level" required>
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
                  <select v-model="editForm.difficulty">
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>题目类型：</label>
                  <select v-model="editForm.question_type">
                    <option value="text">文本题</option>
                    <option value="code">代码题</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>题目日期：</label>
                  <input 
                    type="month" 
                    v-model="editForm.question_date" 
                    placeholder="选择年月"
                  />
                </div>
              </div>
            </div>

            <!-- 题目内容编辑 -->
            <div class="edit-section">
              <h5>题目内容</h5>
              <div class="form-group">
                <label>题目内容：</label>
                <textarea 
                  v-model="editForm.question_text" 
                  required 
                  placeholder="请输入题目内容"
                  rows="4"
                ></textarea>
              </div>

              <!-- 代码内容编辑 -->
              <div v-if="editForm.question_type === 'code'" class="form-group">
                <label class="code-label">
                  <i class="fas fa-code"></i>
                  代码内容：
                </label>
                <textarea 
                  v-model="editForm.question_code" 
                  placeholder="请输入代码内容，支持多种编程语言..."
                  class="code-textarea"
                  rows="8"
                ></textarea>
              </div>
            </div>

            <!-- 选项编辑 -->
            <div class="edit-section">
              <h5>选项设置</h5>
              <div v-for="(option, index) in editForm.options" :key="index" class="option-edit-item">
                <div class="option-inputs">
                  <input v-model="option.label" placeholder="标签(A/B/C/D)" class="option-label" />
                  <input v-model="option.value" placeholder="值" class="option-value" />
                  <textarea 
                    v-model="option.text" 
                    placeholder="选项内容（支持多行代码）" 
                    class="option-textarea"
                    rows="3"
                  ></textarea>
                  <button type="button" @click="removeOption(index)" class="btn-remove">删除</button>
                </div>
              </div>
              <div class="option-actions">
                <button type="button" @click="addOption" class="btn btn-secondary">添加选项</button>
                <button 
                  v-if="editForm.options.length > 0" 
                  type="button" 
                  @click="reorderOptions" 
                  class="btn btn-secondary"
                  title="重新整理选项字母序"
                >
                  🔄 重新整理字母序
                </button>
              </div>
            </div>

            <!-- 答案和解释编辑 -->
            <div class="edit-section">
              <h5>答案设置</h5>
              <div class="form-group">
                <label>正确答案：</label>
                <input v-model="editForm.correct_answer" required placeholder="如：A" />
              </div>
              <div class="form-group">
                <label>解释说明：</label>
                <textarea v-model="editForm.explanation" placeholder="题目解释"></textarea>
              </div>
            </div>

            <!-- 知识点编辑 -->
            <div class="edit-section">
              <h5>关联知识点</h5>
              <div class="knowledge-points-selection">
                <label v-for="kp in knowledgePoints" :key="kp.id" class="kp-checkbox">
                  <input 
                    type="checkbox" 
                    :value="kp.id" 
                    v-model="editForm.knowledge_point_ids" 
                  />
                  {{ kp.name }} ({{ kp.category }})
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">取消</button>
        <button @click="handleSubmit" class="btn btn-primary" :disabled="updating">
          {{ updating ? '更新中...' : '保存更新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps<{
  visible: boolean
  question: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', question: any): void
}>()

const updating = ref(false)
const knowledgePoints = ref<any[]>([])

const editForm = ref({
  question_text: '',
  question_type: 'text',
  question_code: '',
  correct_answer: '',
  explanation: '',
  level: 1,
  difficulty: 'medium',
  question_date: '',
  knowledge_point_ids: [],
  options: [] as any[]
})

// 监听题目变化，初始化表单
watch(() => props.question, (newQuestion) => {
  if (newQuestion) {
    console.log('初始化编辑表单，题目数据:', newQuestion)
    console.log('选项数据:', newQuestion.options)
    
    editForm.value = {
      question_text: newQuestion.question_text || '',
      question_type: newQuestion.question_type || 'text',
      question_code: newQuestion.question_code || '',
      correct_answer: newQuestion.correct_answer || '',
      explanation: newQuestion.explanation || '',
      level: newQuestion.level || 1,
      difficulty: newQuestion.difficulty || 'medium',
      question_date: newQuestion.question_date || '',
      knowledge_point_ids: newQuestion.knowledge_points ? newQuestion.knowledge_points.map((kp: any) => kp.id) : [],
      options: newQuestion.options ? newQuestion.options.map((opt: any) => ({
        label: opt.label || opt.option_label || '',
        value: opt.value || opt.option_value || '',
        text: opt.text || opt.option_text || ''
      })) : []
    }
    
    console.log('初始化后的表单数据:', editForm.value)
  }
}, { immediate: true })

// 监听对话框显示状态，确保数据正确初始化
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.question) {
    console.log('对话框打开，重新初始化数据')
    // 延迟一点时间确保数据已经准备好
    setTimeout(() => {
      if (props.question) {
        editForm.value = {
          question_text: props.question.question_text || '',
          question_type: props.question.question_type || 'text',
          question_code: props.question.question_code || '',
          correct_answer: props.question.correct_answer || '',
          explanation: props.question.explanation || '',
          level: props.question.level || 1,
          difficulty: props.question.difficulty || 'medium',
          question_date: props.question.question_date || '',
          knowledge_point_ids: props.question.knowledge_points ? props.question.knowledge_points.map((kp: any) => kp.id) : [],
          options: props.question.options ? props.question.options.map((opt: any) => ({
            label: opt.label || opt.option_label || '',
            value: opt.value || opt.option_value || '',
            text: opt.text || opt.option_text || ''
          })) : []
        }
        console.log('重新初始化后的表单数据:', editForm.value)
      }
    }, 100)
  }
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

// 添加选项
function addOption() {
  // 获取当前选项数量，用于生成下一个字母
  const currentCount = editForm.value.options.length
  const nextLetter = String.fromCharCode(65 + currentCount) // A=65, B=66, C=67, D=68...
  
  editForm.value.options.push({
    label: nextLetter,
    value: nextLetter,
    text: ''
  })
}

// 重新整理选项字母序
function reorderOptions() {
  editForm.value.options.forEach((option, idx) => {
    const letter = String.fromCharCode(65 + idx) // A=65, B=66, C=67, D=68...
    option.label = letter
    option.value = letter
  })
}

// 删除选项
function removeOption(index: number) {
  editForm.value.options.splice(index, 1)
  
  // 重新整理剩余选项的label和value，确保字母序连续
  reorderOptions()
}

// 提交更新
async function handleSubmit() {
  if (!editForm.value.question_text || !editForm.value.correct_answer) {
    alert('请填写必填字段')
    return
  }

  updating.value = true
  try {
    const response = await axios.put(`${BASE_URL}/questions/${props.question.id}`, editForm.value)
    
    // 构建更新后的题目数据
    const updatedQuestion = {
      ...props.question,
      ...editForm.value
    }
    
    // 通知父组件，传递更新后的数据
    emit('updated', updatedQuestion)
    handleClose()
  } catch (error: any) {
    alert('题目更新失败: ' + error.response?.data?.error || error.message)
  } finally {
    updating.value = false
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  emit('close')
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

.edit-section {
  margin-bottom: 24px;
}

.edit-section h5 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  margin-bottom: 16px;
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
  line-height: 1.6;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
  border: 2px solid #1e90ff;
  border-radius: 12px;
  padding: 20px;
  resize: vertical;
  min-height: 200px;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15);
  transition: all 0.3s ease;
}

.code-textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2), 0 8px 24px rgba(30, 144, 255, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

/* 代码编辑区域的占位符样式 */
.code-textarea::placeholder {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

/* 代码编辑区域的滚动条样式 */
.code-textarea::-webkit-scrollbar {
  width: 8px;
}

.code-textarea::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.code-textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.code-textarea::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 代码标签样式 */
.code-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e90ff;
  font-weight: 700;
  font-size: 15px;
}

.code-label i {
  font-size: 16px;
  color: #1e90ff;
}

.option-edit-item {
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
.option-value {
  padding: 8px 12px;
  border: 1.5px solid #b6e0fe;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.option-textarea {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;
}

.option-textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
  background: #f8fafc;
}

.option-textarea::placeholder {
  color: #94a3b8;
  font-style: italic;
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

.option-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
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