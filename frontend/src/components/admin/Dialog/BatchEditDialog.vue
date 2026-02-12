<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="header-left">
          <div class="dialog-icon">✏️</div>
          <h3 class="dialog-title">批量编辑题目</h3>
        </div>
        
        <div class="header-controls">
          <div class="header-stats" v-if="questions.length > 0">
            <span class="stats-text">共 {{ questions.length }} 道题目</span>
            <span class="current-question">第 {{ currentQuestionIndex + 1 }} 题</span>
          </div>
          
          <div class="header-actions">
            <button @click="handleClose" class="close-btn">×</button>
          </div>
        </div>
      </div>
      
      <div class="dialog-main-content">
        <!-- 左侧：题目导航 -->
        <div class="left-panel">
          <div class="section-header">
            <h4>📝 题目导航</h4>
          </div>
          
          <!-- 题目列表 -->
          <div v-if="questions.length > 0" class="questions-nav">
            <div 
              v-for="(question, index) in questions" 
              :key="`question-${question.id}`"
              class="question-nav-item"
              :class="{ 
                active: index === currentQuestionIndex,
                edited: question.isEdited,
                loading: !question.options && question.id
              }"
              @click="goToQuestion(index)"
            >
              <div class="nav-item-header">
                <span class="nav-item-number">{{ index + 1 }}</span>
                <span class="nav-item-level">{{ getLevelText(question.level || 1) }}</span>
                <span v-if="!question.options && question.id" class="loading-indicator">⏳</span>
              </div>
              <div class="nav-item-content">
                <div class="nav-item-text">
                  {{ question.question_text?.substring(0, 50) || '题目内容加载中...' }}
                  <span v-if="question.question_text?.length > 50">...</span>
                </div>
                <div class="nav-item-answer" v-if="question.correct_answer">
                  答案: {{ question.correct_answer }}
                </div>
                <div class="nav-item-answer empty" v-else-if="question.options">
                  答案: 未设置
                </div>
                <div class="nav-item-answer loading" v-else>
                  正在加载详情...
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-nav">
            <div class="empty-icon">📝</div>
            <div class="empty-text">没有可编辑的题目</div>
          </div>
        </div>
        
        <!-- 中间：题目编辑区域 -->
        <div class="center-panel">
          <div class="questions-editor">
            <div class="editor-header">
              <div class="editor-header-top">
                <h4>📝 题目编辑</h4>
                <div class="editor-stats" v-if="questions.length > 0">
                  <span>共 {{ questions.length }} 道题目</span>
                  <span class="current-question">第 {{ currentQuestionIndex + 1 }} 题</span>
                </div>
              </div>
              
              <!-- 题目导航按钮 -->
              <div v-if="questions.length > 0" class="nav-controls">
                <button 
                  @click="previousQuestion" 
                  class="nav-btn-horizontal"
                  :disabled="currentQuestionIndex === 0"
                  title="上一题"
                >
                  ◀ 上一题
                </button>
                <button 
                  @click="nextQuestion" 
                  class="nav-btn-horizontal"
                  :disabled="currentQuestionIndex === questions.length - 1"
                  title="下一题"
                >
                  下一题 ▶
                </button>
                <button 
                  @click="generateExplanation(currentQuestionIndex)" 
                  class="nav-btn-horizontal nav-btn-ai"
                  :disabled="generatingExplanation"
                  title="AI生成解析"
                >
                  <span v-if="generatingExplanation" class="loading-spinner">⏳</span>
                  <span v-else>🤖 AI解析</span>
                </button>
              </div>
            </div>
            
            <!-- 题目编辑表单 -->
            <div v-if="currentQuestion" class="question-edit-form" ref="questionEditForm">
              <form @submit.prevent="saveQuestion">
                <!-- 基本信息编辑 -->
                <div class="edit-section">
                  <h5>基本信息</h5>
                  <div class="form-row">
                    <div class="form-group">
                      <label>等级：</label>
                      <select v-model="currentQuestion.level" required @change="markAsEdited">
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
                      <select v-model="currentQuestion.difficulty" @change="markAsEdited">
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>题目类型：</label>
                      <select v-model="currentQuestion.question_type" @change="markAsEdited">
                        <option value="text">文本题</option>
                        <option value="code">代码题</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>题目日期：</label>
                      <input 
                        type="month" 
                        v-model="currentQuestion.question_date" 
                        placeholder="选择年月"
                        @change="markAsEdited"
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
                      v-model="currentQuestion.question_text" 
                      required 
                      placeholder="请输入题目内容"
                      rows="4"
                      @input="markAsEdited"
                    ></textarea>
                  </div>

                  <!-- 题目图片 -->
                  <div class="form-group">
                    <label>题目图片：</label>
                    
                    <!-- 如果已有图片，显示图片 -->
                    <div v-if="currentQuestion.image_url" class="image-preview-container">
                      <img :src="getImageUrl(currentQuestion.image_url)" alt="题目图片" class="question-image-preview" />
                      <button type="button" @click="removeImage" class="btn-remove-image">删除图片</button>
                    </div>
                    
                    <!-- 如果没有图片，显示上传区域 -->
                    <div 
                      v-else
                      class="image-upload-area"
                      :class="{ 'dragging': isDragging }"
                      @dragover.prevent="handleDragOver"
                      @dragleave.prevent="handleDragLeave"
                      @drop.prevent="handleDrop"
                      @click="triggerFileInput"
                    >
                      <input 
                        ref="imageFileInput"
                        type="file" 
                        accept="image/*" 
                        @change="handleFileSelect"
                        style="display: none;"
                      />
                      <div class="upload-icon">📷</div>
                      <div class="upload-text">点击或拖拽图片到此处上传</div>
                      <div class="upload-hint">支持 JPG、PNG、GIF 格式</div>
                    </div>
                    
                    <!-- 上传进度 -->
                    <div v-if="uploadingImage" class="upload-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                      </div>
                      <div class="progress-text">上传中... {{ uploadProgress }}%</div>
                    </div>
                  </div>

                  <!-- 代码内容编辑 -->
                  <div v-if="currentQuestion.question_type === 'code'" class="form-group">
                    <label class="code-label">
                      <i class="fas fa-code"></i>
                      代码内容：
                    </label>
                    <textarea 
                      v-model="currentQuestion.question_code" 
                      placeholder="请输入代码内容，支持多种编程语言..."
                      class="code-textarea"
                      rows="8"
                      @input="markAsEdited"
                    ></textarea>
                  </div>
                </div>

                <!-- 选项编辑 -->
                <div class="edit-section">
                  <h5>选项设置 ({{ (currentQuestion.options || []).length }} 个选项)</h5>
                  <div v-for="(option, index) in (currentQuestion.options || [])" :key="index" class="option-edit-item">
                    <div class="option-inputs">
                      <input v-model="option.label" placeholder="标签(A/B/C/D)" class="option-label" @input="markAsEdited" />
                      <input v-model="option.value" placeholder="值" class="option-value" @input="markAsEdited" />
                      <textarea 
                        v-model="option.text" 
                        placeholder="选项内容（支持多行代码）" 
                        class="option-textarea"
                        rows="3"
                        @input="markAsEdited"
                      ></textarea>
                      <button type="button" @click="removeOption(index)" class="btn-remove">删除</button>
                    </div>
                  </div>
                  <div class="option-actions">
                    <button type="button" @click="addOption" class="btn btn-secondary">添加选项</button>
                    <button 
                      v-if="currentQuestion.options && currentQuestion.options.length > 0" 
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
                    <div class="answer-input-group">
                      <input 
                        v-model="currentQuestion.correct_answer" 
                        required 
                        placeholder="如：A" 
                        @input="onAnswerChange"
                      />
                      <button 
                        type="button" 
                        @click="generateExplanation(currentQuestionIndex)" 
                        class="btn btn-ai"
                        :disabled="generatingExplanation || !currentQuestion.correct_answer"
                        title="AI生成解析"
                      >
                        <span v-if="generatingExplanation" class="loading-spinner">⏳</span>
                        <span v-else>🤖</span>
                        {{ generatingExplanation ? '生成中...' : 'AI解析' }}
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>解释说明：</label>
                    <textarea v-model="currentQuestion.explanation" placeholder="题目解释" @input="markAsEdited"></textarea>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">📝</div>
              <div class="empty-text">
                <h5>没有可编辑的题目</h5>
                <p>请先选择要编辑的题目</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：关联知识点 -->
        <div class="right-panel">
          <div class="knowledge-points-panel">
            <div class="section-header">
              <h4>📚 关联知识点</h4>
            </div>
            
            <div v-if="currentQuestion" class="knowledge-points-content">
              <!-- 按级别分组显示知识点 -->
              <div class="level-groups">
                <div 
                  v-for="level in [1, 2, 3, 4, 5]" 
                  :key="`level-${level}`" 
                  class="level-group-card"
                >
                  <!-- 级别标题（可点击折叠） -->
                  <div 
                    class="level-header" 
                    @click="toggleLevel(level)"
                    :class="{ collapsed: collapsedLevels[level] }"
                  >
                    <div class="level-header-left">
                      <span class="level-badge">{{ getLevelText(level) }}</span>
                      <span class="level-count">{{ groupedKnowledgePoints[level].length }} 个知识点</span>
                    </div>
                    <span class="collapse-icon" :class="{ expanded: !collapsedLevels[level] }">
                      ▼
                    </span>
                  </div>
                  
                  <!-- 知识点列表（可折叠） -->
                  <div v-show="!collapsedLevels[level]" class="level-content">
                    <div v-if="groupedKnowledgePoints[level].length > 0" class="knowledge-points-selection">
                      <label v-for="kp in groupedKnowledgePoints[level]" :key="kp.id" class="kp-checkbox">
                        <input 
                          type="checkbox" 
                          :value="kp.id" 
                          v-model="currentQuestion.knowledge_point_ids" 
                          @change="markAsEdited"
                        />
                        {{ kp.name }} ({{ kp.category === 'algorithm' ? '算法' : kp.category === 'data_structure' ? '数据结构' : kp.category === 'programming' ? '编程' : kp.category === 'math' ? '数学' : kp.category }})
                      </label>
                    </div>
                    <div v-else class="no-knowledge-points-small">
                      暂无知识点
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 无题目时的空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">📚</div>
              <div class="empty-text">
                <h5>请先选择题目</h5>
                <p>选择题目后可编辑关联知识点</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">关闭</button>
        <button 
          v-if="questions.length > 0"
          @click="saveAllQuestions" 
          class="btn btn-success" 
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '💾 保存所有修改' }}
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

<script setup lang="ts">import { BASE_URL, API_SERVER_BASE, AI_API_BASE_URL, normalizeImageUrl } from '@/config/api'

function getImageUrl(url: string | undefined): string {
  if (!url || !url.trim()) return ''
  const n = normalizeImageUrl(url)
  if (!n) return ''
  if (n.startsWith('http://') || n.startsWith('https://')) return n
  return n.startsWith('/') ? `${API_SERVER_BASE}${n}` : `${API_SERVER_BASE}/${n}`
}

import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import SuccessMessageDialog from './SuccessMessageDialog.vue'

interface Props {
  visible: boolean
  selectedQuestions: any[]
}

interface Emits {
  (e: 'close'): void
  (e: 'updated', questions: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const currentQuestion = computed(() => {
  if (questions.value.length > 0 && currentQuestionIndex.value < questions.value.length) {
    const question = questions.value[currentQuestionIndex.value]
    console.log('当前题目:', question)
    console.log('当前题目选项:', question?.options)
    return question
  }
  return null
})

// 按级别分组知识点（1-5级）
const groupedKnowledgePoints = computed(() => {
  const groups: { [key: number]: any[] } = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  }
  
  knowledgePoints.value.forEach(kp => {
    const level = kp.level || 1
    if (level >= 1 && level <= 5) {
      groups[level].push(kp)
    }
  })
  
  return groups
})

// 本地状态
const questions = ref<any[]>([])
const currentQuestionIndex = ref(0)
const knowledgePoints = ref<any[]>([])
const saving = ref(false)
const questionEditForm = ref<HTMLElement>()
const isKnowledgePointsExpanded = ref(true)
// 知识点折叠状态（默认全部折叠）
const collapsedLevels = ref<{ [key: number]: boolean }>({
  1: true,
  2: true,
  3: true,
  4: true,
  5: true
})

// 成功提示相关
const showSuccessMessage = ref(false)
const successMessage = ref('')

// AI生成解析相关
const generatingExplanation = ref(false)
const answerChangeTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)

// 图片上传相关
const isDragging = ref(false)
const uploadingImage = ref(false)
const uploadProgress = ref(0)
const imageFileInput = ref<HTMLInputElement>()

// 方法
function handleOverlayClick() {
  emit('close')
}

function handleClose() {
  emit('close')
}

// 初始化题目数据
function initializeQuestions() {
  questions.value = props.selectedQuestions.map(q => {
    console.log('初始化题目数据:', q)
    console.log('原始选项数据:', q.options)
    
    const processedQuestion = {
      ...q,
      isEdited: false,
      knowledge_point_ids: q.knowledge_points?.map((kp: any) => kp.id) || [],
      options: q.options ? q.options.map((opt: any) => {
        console.log('处理选项:', opt)
        return {
          label: opt.label || opt.option_label || '',
          value: opt.value || opt.option_value || '',
          text: opt.text || opt.option_text || ''
        }
      }) : [],
      level: q.level || 1,
      difficulty: q.difficulty || 'medium',
      question_type: q.question_type || 'text',
      question_text: q.question_text || '',
      question_code: q.question_code || '',
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      question_date: q.question_date || ''
    }
    
    console.log('处理后的题目数据:', processedQuestion)
    console.log('处理后的选项数据:', processedQuestion.options)
    
    return processedQuestion
  })
  currentQuestionIndex.value = 0
}

// 题目导航方法
function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    nextTick(() => {
      if (questionEditForm.value) {
        questionEditForm.value.scrollTop = 0
      }
    })
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    nextTick(() => {
      if (questionEditForm.value) {
        questionEditForm.value.scrollTop = 0
      }
    })
  }
}

function goToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    currentQuestionIndex.value = index
    nextTick(() => {
      if (questionEditForm.value) {
        questionEditForm.value.scrollTop = 0
      }
    })
  }
}

// 题目编辑方法
function addOption() {
  if (currentQuestion.value) {
    if (!currentQuestion.value.options) {
      currentQuestion.value.options = []
    }
    const currentCount = currentQuestion.value.options.length
    const nextLetter = String.fromCharCode(65 + currentCount)
    
    currentQuestion.value.options.push({
      label: nextLetter,
      value: nextLetter,
      text: ''
    })
    markAsEdited()
  }
}

function removeOption(index: number) {
  if (currentQuestion.value && currentQuestion.value.options) {
    currentQuestion.value.options.splice(index, 1)
    reorderOptions()
    markAsEdited()
  }
}

function reorderOptions() {
  if (currentQuestion.value && currentQuestion.value.options) {
    currentQuestion.value.options.forEach((option: any, idx: number) => {
      const letter = String.fromCharCode(65 + idx)
      option.label = letter
      option.value = letter
    })
    markAsEdited()
  }
}

function saveQuestion() {
  if (currentQuestion.value) {
    markAsEdited()
  }
}

function markAsEdited() {
  if (currentQuestion.value) {
    currentQuestion.value.isEdited = true
  }
}

// 监听答案变化
function onAnswerChange() {
  if (currentQuestion.value) {
    markAsEdited()
    // 延迟自动生成解析，避免频繁调用
    if (answerChangeTimer.value) {
      clearTimeout(answerChangeTimer.value)
    }
    answerChangeTimer.value = setTimeout(() => {
      if (currentQuestion.value && currentQuestion.value.correct_answer && currentQuestion.value.question_text) {
        autoGenerateExplanation(currentQuestionIndex.value)
      }
    }, 1000) // 1秒后自动生成
  }
}

// 获取知识点列表
async function fetchKnowledgePoints() {
  try {
    const response = await axios.get(`${BASE_URL}/knowledge-points`)
    knowledgePoints.value = response.data
  } catch (error) {
    console.error('获取知识点失败:', error)
  }
}

// 保存所有题目 - 使用单个更新API
async function saveAllQuestions() {
  if (questions.value.length === 0) return
  
  saving.value = true
  try {
    const editedQuestions = questions.value.filter(q => q.isEdited)
    
    if (editedQuestions.length === 0) {
      successMessage.value = '没有需要保存的修改'
      showSuccessMessage.value = true
      return
    }
    
    // 使用单个更新API逐个更新题目
    const updatePromises = editedQuestions.map(async (question) => {
      const updateData = {
        question_text: question.question_text,
        question_type: question.question_type,
        question_code: question.question_code || '',
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        level: question.level,
        difficulty: question.difficulty,
        image_url: question.image_url || '',
        question_date: question.question_date || '',
        knowledge_point_ids: question.knowledge_point_ids || [],
        options: question.options ? question.options.map((opt: any) => ({
          label: opt.label,
          value: opt.value,
          text: opt.text
        })) : []
      }
      
      return axios.put(`${BASE_URL}/questions/${question.id}`, updateData)
    })
    
    // 并行执行所有更新请求
    const responses = await Promise.all(updatePromises)
    
    // 显示成功提示
    successMessage.value = `成功保存 ${editedQuestions.length} 道题目的修改！`
    showSuccessMessage.value = true
    
    // 重置编辑状态
    editedQuestions.forEach(question => {
      question.isEdited = false
    })
    
    // 通知父组件更新
    emit('updated', questions.value)
    
  } catch (error: any) {
    console.error('批量保存失败:', error)
    const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message
    alert('保存失败: ' + errorMessage)
  } finally {
    saving.value = false
  }
}

// AI生成解析方法
async function generateExplanation(questionIndex: number) {
  const question = questions.value[questionIndex]
  if (!question || !question.correct_answer) {
    alert('请先设置正确答案')
    return
  }

  generatingExplanation.value = true
  try {
    const requestData = {
      question: {
        question_text: question.question_text,
        question_type: question.question_type || 'text',
        question_code: question.question_code || '',
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        level: question.level || 3,
        difficulty: question.difficulty || 'medium',
        options: question.options || []
      }
    }

    const response = await fetch(`${AI_API_BASE_URL}/generate-explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.status === 'success' && result.explanation) {
      question.explanation = result.explanation
      markAsEdited()
      
      // 不再显示弹窗提示，只在控制台输出
      console.log(`第${questionIndex + 1}题解析生成成功！`)
    } else {
      throw new Error(result.error || '生成解析失败')
    }
    
  } catch (error) {
    console.error('生成解析失败:', error)
    alert(`生成解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    generatingExplanation.value = false
  }
}

// 自动生成解析（在答案修改后调用）
async function autoGenerateExplanation(questionIndex: number) {
  const question = questions.value[questionIndex]
  if (question && question.correct_answer && question.question_text) {
    // 延迟一点时间再生成，避免频繁调用
    setTimeout(() => {
      generateExplanation(questionIndex)
    }, 500)
  }
}

// 等级文本
function getLevelText(level: number) {
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 切换级别折叠状态
function toggleLevel(level: number) {
  collapsedLevels.value[level] = !collapsedLevels.value[level]
}

function closeSuccessMessage() {
  showSuccessMessage.value = false
  successMessage.value = ''
}

// 图片处理方法
function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await uploadImage(files[0])
  }
}

function triggerFileInput() {
  imageFileInput.value?.click()
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await uploadImage(files[0])
  }
}

async function uploadImage(file: File) {
  if (!currentQuestion.value) {
    alert('请先选择要编辑的题目')
    return
  }
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    alert('请上传有效的图片文件 (JPG, PNG, GIF, WebP)')
    return
  }
  
  // 验证文件大小 (限制为 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    alert('图片文件不能超过 5MB')
    return
  }
  
  uploadingImage.value = true
  uploadProgress.value = 0
  
  try {
    console.log('开始上传图片:', file.name, file.type, file.size)
    
    const formData = new FormData()
    formData.append('image', file)
    
    
    const response = await axios.post(`${BASE_URL}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })
    
    console.log('上传响应:', response.data)
    
    // 支持多种响应格式
    let imageUrl = null
    if (response.data) {
      // 尝试不同的字段名
      imageUrl = response.data.imageUrl || response.data.image_url || response.data.url || response.data.path
      
      // 如果是字符串直接返回
      if (typeof response.data === 'string') {
        imageUrl = response.data
      }
    }
    
    if (imageUrl) {
      // 规范化 URL，避免 HTTPS 下 Mixed Content 及错误端口导致 404
      let normalized = normalizeImageUrl(imageUrl)
      if (!normalized) normalized = imageUrl
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = normalized.startsWith('/')
          ? `${API_SERVER_BASE}${normalized}`
          : `${API_SERVER_BASE}/${normalized}`
      }
      currentQuestion.value.image_url = normalized
      markAsEdited()
      
      console.log('图片上传成功！URL:', normalized)
      successMessage.value = '图片上传成功！'
      showSuccessMessage.value = true
    } else {
      console.error('响应数据格式不正确:', response.data)
      throw new Error('上传失败：未返回有效的图片URL')
    }
  } catch (error: any) {
    console.error('图片上传失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    
    let errorMessage = '图片上传失败'
    if (error.response) {
      // 服务器返回了错误
      errorMessage = error.response.data?.error || error.response.data?.message || error.response.statusText || `HTTP ${error.response.status}`
    } else if (error.request) {
      // 请求发送了但没有收到响应
      errorMessage = '无法连接到服务器，请检查网络连接'
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误'
    }
    
    alert(errorMessage)
  } finally {
    uploadingImage.value = false
    uploadProgress.value = 0
    // 重置文件输入
    if (imageFileInput.value) {
      imageFileInput.value.value = ''
    }
  }
}

function removeImage() {
  if (currentQuestion.value) {
    currentQuestion.value.image_url = ''
    markAsEdited()
  }
}

// 监听props变化
function watchProps() {
  if (props.visible && props.selectedQuestions.length > 0) {
    initializeQuestions()
  }
}

onMounted(() => {
  fetchKnowledgePoints()
  watchProps()
})

// 监听visible变化
import { watch } from 'vue'
watch(() => props.visible, (newVal) => {
  if (newVal) {
    watchProps()
  }
})

watch(() => props.selectedQuestions, () => {
  if (props.visible) {
    watchProps()
  }
}, { deep: true })
</script>

<style scoped>
/* 继承基础样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 0;
  box-shadow: none;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border-bottom: 1px solid #b6e0fe;
  min-height: 80px;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-icon {
  font-size: 28px;
}

.dialog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: space-between;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.current-question {
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.3s;
  margin-left: 8px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 350px;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
}

.center-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: white;
  border-right: 1px solid #e2e8f0;
}

.right-panel {
  width: 350px;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
}

.questions-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-nav-item {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.question-nav-item:hover {
  border-color: #b6e0fe;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.question-nav-item.active {
  border-color: #1e90ff;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
}

.question-nav-item.edited {
  border-color: #10b981;
  background: #f0fdf4;
}

.question-nav-item.loading {
  border-color: #f59e0b;
  background: #fffbeb;
  opacity: 0.8;
}

.loading-indicator {
  color: #f59e0b;
  font-size: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

.nav-item-answer.loading {
  color: #f59e0b;
  font-style: italic;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.nav-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nav-item-number {
  background: #1e90ff;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.nav-item-level {
  background: #e0f7fa;
  color: #1e90ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.nav-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
  font-weight: 500;
}

.nav-item-answer {
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}

.nav-item-answer.empty {
  color: #ef4444;
}

.empty-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.questions-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.editor-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-header h4 {
  margin: 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
}

.editor-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #64748b;
}

.nav-controls {
  display: flex;
  gap: 12px;
  padding: 0;
  border: none;
  margin: 0;
  flex-wrap: wrap;
}

.nav-btn-horizontal {
  padding: 8px 16px;
  border: 1px solid #b6e0fe;
  background: white;
  color: #1976d2;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
  justify-content: center;
}

.nav-btn-horizontal:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #1e90ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
}

.nav-btn-horizontal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.nav-btn-horizontal.nav-btn-ai {
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-color: #8b5cf6;
}

.nav-btn-horizontal.nav-btn-ai:hover:not(:disabled) {
  background: linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%);
  border-color: #7c3aed;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
}

.question-edit-form {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text h5 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 18px;
}

.empty-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* 编辑表单样式 */
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

.section-header-collapsible {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.section-header-collapsible:hover {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 0 -12px 16px -12px;
}

.section-header-collapsible h5 {
  margin: 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
  border-bottom: none;
  padding-bottom: 0;
}

.collapse-icon {
  color: #64748b;
  font-size: 14px;
  transition: transform 0.3s ease;
  user-select: none;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
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

.code-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e90ff;
  font-weight: 700;
  font-size: 15px;
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

.option-label {
  width: 60px;
  text-align: center;
}

.option-value {
  width: 80px;
  text-align: center;
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

.answer-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.answer-input-group input {
  flex: 1;
}

.btn-ai {
  background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.10);
  transition: background 0.2s, box-shadow 0.2s;
  white-space: nowrap;
  min-width: 100px;
}

.btn-ai:hover:not(:disabled) {
  background: linear-gradient(90deg, #7c3aed 0%, #9333ea 100%);
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.20);
  transform: translateY(-1px);
}

.btn-ai:disabled {
  background: #9ca3af;
  color: #fff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

/* 过滤信息样式 */
.filter-info {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  border-left: 4px solid #1e90ff;
}

.filter-text {
  font-size: 14px;
  color: #1976d2;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 无知识点时的样式 */
.no-knowledge-points {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  margin: 16px 0;
}

.no-kp-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-kp-text p {
  margin: 0 0 8px 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.no-kp-text p:first-child {
  color: #374151;
  font-weight: 600;
  font-size: 16px;
}

.no-kp-hint {
  font-size: 12px !important;
  color: #9ca3af !important;
  font-style: italic;
}

/* 右侧知识点面板样式 */
.knowledge-points-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.knowledge-points-content {
  flex: 1;
  overflow-y: auto;
}

/* 级别分组样式 */
.level-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-group-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.level-group-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e2e8f0;
}

.level-header:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}

.level-header.collapsed {
  border-bottom: none;
}

.level-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-badge {
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(30, 144, 255, 0.2);
}

.level-count {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.collapse-icon {
  color: #64748b;
  font-size: 12px;
  transition: transform 0.3s ease;
  user-select: none;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

.level-content {
  padding: 12px;
  background: white;
}

.knowledge-points-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.knowledge-points-selection .kp-checkbox {
  margin-bottom: 0;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.4;
}

.no-knowledge-points-small {
  padding: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
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

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dialog-actions {
  padding: 20px 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  min-height: 80px;
  align-items: center;
}

/* 图片上传和预览样式 */
.image-preview-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.question-image-preview {
  max-width: 100%;
  max-height: 400px;
  border-radius: 12px;
  border: 2px solid #b6e0fe;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
  display: block;
}

.btn-remove-image {
  margin-top: 12px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remove-image:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.image-upload-area {
  border: 2px dashed #b6e0fe;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-upload-area:hover {
  border-color: #1e90ff;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.15);
}

.image-upload-area.dragging {
  border-color: #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-width: 3px;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.25);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #1976d2;
  font-weight: 600;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #64748b;
}

.upload-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 14px;
  color: #1976d2;
  font-weight: 600;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel,
  .right-panel {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .dialog-container {
    width: 100vw;
    height: 100vh;
    margin: 0;
  }
  
  .dialog-main-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100% !important;
    height: 30vh;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .center-panel {
    height: 40vh;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .right-panel {
    width: 100% !important;
    height: 30vh;
  }
  
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .knowledge-points-selection {
    grid-template-columns: 1fr;
  }
  
  .nav-controls {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .nav-btn-horizontal {
    font-size: 12px;
    padding: 6px 12px;
    min-width: 80px;
  }
}
</style>
