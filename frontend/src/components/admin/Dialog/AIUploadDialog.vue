<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="header-left">
          <div class="dialog-icon">🤖</div>
          <h3 class="dialog-title">AI智能题目生成</h3>
        </div>
        
        <!-- 处理参数和控制 -->
        <div v-if="selectedFile" class="header-controls">
          <!-- 处理参数 -->
          <div class="header-params">
            <div class="param-group">
              <label>线程数:</label>
              <select v-model="parallelWorkers" class="param-select">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3" selected>3</option>
                <option value="5">5</option>
                <option value="8">8</option>
              </select>
            </div>
            
            <div class="param-group">
              <label>预期题目:</label>
              <input 
                type="number" 
                v-model="expectedQuestions" 
                placeholder="可选"
                class="param-input"
                min="1"
                max="1000"
              >
            </div>
            
            <div class="param-group">
              <label>等级:</label>
              <select v-model="presetLevel" class="param-select">
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">CSP-J</option>
              </select>
            </div>
            
            <div class="param-group">
              <label>日期:</label>
              <input 
                type="month" 
                v-model="presetQuestionDate" 
                class="param-input"
              >
            </div>
          </div>
          
          <!-- 处理状态显示 -->
          <div v-if="processing" class="header-status">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-message">{{ processingMessage }}</span>
            </div>
            <div class="progress-info" v-if="progressInfo">
              <span class="progress-text">
                已生成: <strong>{{ progressInfo.questionsFound }}</strong>
                <span v-if="expectedQuestions">/ {{ expectedQuestions }}</span>
              </span>
            </div>
            <div class="streaming-indicator">
              <div class="streaming-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          
          <!-- 处理控制按钮 -->
          <div class="header-actions">
            <button 
              v-if="!processing"
              @click="processPDF" 
              class="btn btn-primary btn-header"
            >
              🤖 开始处理
            </button>
            
            <button 
              v-if="processing"
              @click="stopProcessing" 
              class="btn btn-danger btn-header"
            >
              ⏹️ 停止
            </button>
            
            <button 
              v-if="processedQuestions.length > 0"
              @click="resetForm" 
              class="btn btn-secondary btn-header"
              :disabled="processing"
            >
              🔄 重新开始
            </button>
            
            <button @click="handleClose" class="close-btn">×</button>
          </div>
        </div>
        
        <button v-else @click="handleClose" class="close-btn">×</button>
      </div>
      
      <div class="dialog-main-content">
        <!-- 左侧：PDF预览和处理控制 -->
        <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
          <!-- PDF上传区域 -->
          <div v-if="!selectedFile" class="pdf-upload-section">
            <div class="section-header">
              <h4>📄 PDF文件</h4>
            </div>
            
            <div class="upload-zone" @click="triggerFileInput">
              <div class="upload-icon">📄</div>
              <div class="upload-text">点击选择PDF文件</div>
              <div class="upload-hint">支持PDF格式，文件大小不超过10MB</div>
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileChange" 
                accept=".pdf" 
                class="file-input"
                style="display: none;"
              />
            </div>
          </div>
          
          <!-- PDF文件信息（仅在已选择文件时显示） -->
          <div v-if="selectedFile" class="pdf-info-section">
            <div class="section-header">
              <h4>📄 {{ selectedFile.name }}</h4>
              <div class="pdf-meta">
                <span class="pdf-size">{{ formatFileSize(selectedFile.size) }}</span>
                <button @click="resetForm" class="btn btn-secondary btn-small">重新选择</button>
              </div>
            </div>
          </div>
          
          <!-- PDF预览区域 -->
          <div v-if="selectedFile && pdfUrl" class="pdf-preview-section">
            <div class="section-header">
              <h4>📖 PDF预览</h4>
              <div class="pdf-info-text">
                用于矫正题目内容，支持缩放和拖拽
                <button @click="resetPanelWidth" class="reset-width-btn" title="重置面板宽度">
                  🔄
                </button>
              </div>
            </div>
            <div class="pdf-viewer">
              <div class="pdf-controls">
                <button @click="zoomIn" class="pdf-control-btn" title="放大">
                  🔍+
                </button>
                <button @click="zoomOut" class="pdf-control-btn" title="缩小">
                  🔍-
                </button>
                <button @click="resetZoom" class="pdf-control-btn" title="重置缩放">
                  🔄
                </button>
                <button @click="resetPosition" class="pdf-control-btn" title="重置位置">
                  🎯
                </button>
                <button @click="toggleFullscreen" class="pdf-control-btn" title="全屏">
                  ⛶
                </button>
              </div>
              <div 
                class="pdf-container" 
                ref="pdfContainer"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
              >
                <iframe 
                  :src="pdfUrl + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH'" 
                  class="pdf-iframe"
                  :style="{ transform: `scale(${pdfZoom})` }"
                ></iframe>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- 竖向题目导航 + 拖拽分隔线 -->
        <div class="vertical-question-nav">
          <!-- 竖向题目点 -->
          <div v-if="processedQuestions.length > 0" class="vertical-question-dots">
            <div 
              v-for="(question, index) in processedQuestions" 
              :key="`question-${index}`"
              class="vertical-question-dot"
              :class="{ 
                active: index === currentQuestionIndex, 
                completed: question.isEdited,
                'new-question': !question.isEdited && processing
              }"
              @click="goToQuestion(index)"
            >
              <div class="dot-number">{{ index + 1 }}</div>
              <div class="dot-answer" v-if="question.correct_answer">
                {{ question.correct_answer }}
              </div>
              <div class="dot-answer empty" v-else>
                ?
              </div>
            </div>
          </div>
          
          <!-- 拖拽指示器 -->
          <div 
            class="drag-indicator"
            @mousedown="startResize"
          >
            <div class="drag-line"></div>
          </div>
        </div>
        
        <!-- 右侧：题目编辑区域 -->
        <div class="right-panel" :style="{ width: `calc(100% - ${leftPanelWidth}px - 80px)` }">
          <div class="questions-editor">
            <div class="editor-header">
              <div class="editor-header-top">
                <h4>📝 题目编辑</h4>
                <div class="editor-stats" v-if="processedQuestions.length > 0">
                  <span>共 {{ processedQuestions.length }} 道题目</span>
                  <span class="current-question">第 {{ currentQuestionIndex + 1 }} 题</span>
                </div>
              </div>
              
              <!-- 题目导航按钮 -->
              <div v-if="processedQuestions.length > 0" class="nav-controls">
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
                  :disabled="currentQuestionIndex === processedQuestions.length - 1"
                  title="下一题"
                >
                  下一题 ▶
                </button>
                <button 
                  @click="addNewQuestion" 
                  class="nav-btn-horizontal nav-btn-add"
                  title="添加题目"
                >
                  ➕ 添加题目
                </button>
                <button 
                  @click="deleteCurrentQuestion" 
                  class="nav-btn-horizontal nav-btn-delete"
                  :disabled="processedQuestions.length <= 1"
                  title="删除题目"
                >
                  🗑️ 删除题目
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
                      <select v-model="currentQuestion.level" required>
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
                      <select v-model="currentQuestion.difficulty">
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>题目类型：</label>
                      <select v-model="currentQuestion.question_type">
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
                    ></textarea>
                  </div>

                  <!-- 题目图片 -->
                  <div class="form-group">
                    <label>题目图片：</label>
                    
                    <!-- 如果已有图片，显示图片 -->
                    <div v-if="currentQuestion.image_url" class="image-preview-container">
                      <img :src="currentQuestion.image_url" alt="题目图片" class="question-image-preview" />
                      <button type="button" @click="removeImage" class="btn-remove-image">删除图片</button>
                    </div>
                    
                    <!-- 如果没有图片，显示上传区域 -->
                    <div 
                      v-else
                      class="image-upload-area"
                      :class="{ 'dragging': isDraggingImage }"
                      @dragover.prevent="handleImageDragOver"
                      @dragleave.prevent="handleImageDragLeave"
                      @drop.prevent="handleImageDrop"
                      @click="triggerImageFileInput"
                    >
                      <input 
                        ref="imageFileInput"
                        type="file" 
                        accept="image/*" 
                        @change="handleImageFileSelect"
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
                    ></textarea>
                  </div>
                </div>

                <!-- 选项编辑 -->
                <div class="edit-section">
                  <h5>选项设置</h5>
                  <div v-for="(option, index) in currentQuestion.options" :key="index" class="option-edit-item">
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
                      v-if="currentQuestion.options.length > 0" 
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
                    <textarea v-model="currentQuestion.explanation" placeholder="题目解释"></textarea>
                  </div>
                </div>

                <!-- 知识点编辑 -->
                <div class="edit-section">
                  <div class="section-header-collapsible" @click="isKnowledgePointsExpanded = !isKnowledgePointsExpanded">
                    <h5>关联知识点</h5>
                    <span class="collapse-icon" :class="{ expanded: isKnowledgePointsExpanded }">▼</span>
                  </div>
                  <div v-show="isKnowledgePointsExpanded" class="knowledge-points-selection">
                    <label v-for="kp in knowledgePoints" :key="kp.id" class="kp-checkbox">
                      <input 
                        type="checkbox" 
                        :value="kp.id" 
                        v-model="currentQuestion.knowledge_point_ids" 
                      />
                      {{ kp.name }} ({{ kp.category }})
                    </label>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">📝</div>
              <div class="empty-text">
                <h5>等待处理题目</h5>
                <p>请先上传PDF文件并开始处理，处理完成后将在此显示题目编辑界面</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">关闭</button>
        <button 
          v-if="processedQuestions.length > 0"
          @click="uploadAllQuestions" 
          class="btn btn-success" 
          :disabled="uploading"
        >
          {{ uploading ? '上传中...' : '📤 上传所有题目' }}
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

<script setup lang="ts">import { BASE_URL, API_SERVER_BASE, AI_API_BASE_URL } from '@/config/api'

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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

// 计算属性
const currentQuestion = computed(() => {
  if (processedQuestions.value.length > 0 && currentQuestionIndex.value < processedQuestions.value.length) {
    return processedQuestions.value[currentQuestionIndex.value]
  }
  return null
})

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
const streamController = ref<AbortController | null>(null)

// 处理结果
const processedQuestions = ref<any[]>([])
const showPreview = ref(false)

// 题目编辑相关
const currentQuestionIndex = ref(0)
const knowledgePoints = ref<any[]>([])
const uploading = ref(false)
const questionEditForm = ref<HTMLElement>()
const isKnowledgePointsExpanded = ref(false)

// 面板宽度调整相关
const leftPanelWidth = ref(1200)
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(400)

// PDF预览相关
const pdfUrl = ref<string>('')
const pdfZoom = ref(1.0)
const pdfContainer = ref<HTMLElement>()
const isFullscreen = ref(false)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const pdfPosition = ref({ x: 0, y: 0 })

// 成功提示相关
const showSuccessMessage = ref(false)
const successMessage = ref('')

// 快速编辑答案相关
const quickEditIndex = ref(-1)
const quickEditValue = ref('')

// AI生成解析相关
const generatingExplanation = ref(false)
const answerChangeTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)

// 图片上传相关
const isDraggingImage = ref(false)
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

function triggerFileInput() {
  fileInput.value?.click()
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
  
  // 清空之前的题目
  processedQuestions.value = []
  currentQuestionIndex.value = 0
  
  // 创建AbortController用于取消请求
  streamController.value = new AbortController()
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (expectedQuestions.value) {
      formData.append('expected_questions', expectedQuestions.value)
    }
    
    processingMessage.value = '正在处理PDF文件...'
    
    // 调用流式API
    const response = await fetch(`${AI_API_BASE_URL}/stream-extract`, {
      method: 'POST',
      body: formData,
      signal: streamController.value.signal
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) {
      throw new Error('无法读取响应流')
    }
    
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      // 处理完整的消息
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的消息
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) // 移除 'data: ' 前缀
            await handleStreamMessage(data)
          } catch (parseError) {
            console.warn('解析流式消息失败:', parseError, '原始数据:', line)
          }
        }
      }
    }
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('用户取消了处理')
      processingMessage.value = '处理已取消'
      processResult.value = {
        type: 'error',
        message: '处理已取消'
      }
    } else {
      console.error('处理PDF失败:', error)
      processResult.value = {
        type: 'error',
        message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  } finally {
    processing.value = false
    processingMessage.value = ''
    streamController.value = null
  }
}

// 停止处理
function stopProcessing() {
  if (streamController.value) {
    streamController.value.abort()
  }
}

// 处理流式消息
async function handleStreamMessage(data: any) {
  try {
    switch (data.type) {
      case 'process_start':
        processingMessage.value = data.message
        break
        
      case 'llm_start':
        processingMessage.value = data.message
        break
        
      case 'question':
        // 添加新题目到列表
        const questionWithPresets = {
          ...data.question,
          level: presetLevel.value,
          difficulty: data.question.difficulty || 'medium',
          question_date: presetQuestionDate.value,
          knowledge_point_ids: [],
          image_url: data.question.image_url || '',
          isEdited: false
        }
        
        processedQuestions.value.push(questionWithPresets)
        
        // 如果是第一个题目，自动跳转到它
        if (processedQuestions.value.length === 1) {
          currentQuestionIndex.value = 0
        }
        
        // 更新进度信息
        progressInfo.value = {
          textLength: 0, // 流式处理中无法获取
          segmentCount: 0, // 流式处理中无法获取
          questionsFound: processedQuestions.value.length
        }
        
        processingMessage.value = data.message
        break
        
      case 'process_complete':
        processingMessage.value = data.message
        processResult.value = {
          type: 'success',
          message: `成功处理PDF文件！提取到 ${data.total_questions} 个题目`
        }
        
        // 显示成功提示弹窗
        successMessage.value = `成功处理PDF文件！提取到 ${data.total_questions} 个题目`
        showSuccessMessage.value = true
        break
        
      case 'error':
        // 处理流式错误
        processingMessage.value = `错误: ${data.message}`
        processResult.value = {
          type: 'error',
          message: data.message
        }
        break
        
      default:
        console.log('未知消息类型:', data.type, data)
    }
  } catch (error) {
    console.error('处理流式消息时出错:', error)
    processingMessage.value = '处理消息时出现错误'
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
      const response = await axios.post(`${BASE_URL}/upload-questions-batch`, { 
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

// 新增方法
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    // 创建PDF预览URL
    pdfUrl.value = URL.createObjectURL(target.files[0])
    // 重置处理结果
    processedQuestions.value = []
    processResult.value = { type: null, message: '' }
    currentQuestionIndex.value = 0
  }
}

// 题目导航方法
function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    // 切换到上一题时重置滚动位置到顶部
    nextTick(() => {
      if (questionEditForm.value) {
        questionEditForm.value.scrollTop = 0
      }
    })
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < processedQuestions.value.length - 1) {
    currentQuestionIndex.value++
    // 切换到下一题时重置滚动位置到顶部
    nextTick(() => {
      if (questionEditForm.value) {
        questionEditForm.value.scrollTop = 0
      }
    })
  }
}

function goToQuestion(index: number) {
  if (index >= 0 && index < processedQuestions.value.length) {
    currentQuestionIndex.value = index
    // 切换题目时重置滚动位置
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
    const currentCount = currentQuestion.value.options.length
    const nextLetter = String.fromCharCode(65 + currentCount)
    
    currentQuestion.value.options.push({
      label: nextLetter,
      value: nextLetter,
      text: ''
    })
  }
}

function removeOption(index: number) {
  if (currentQuestion.value) {
    currentQuestion.value.options.splice(index, 1)
    reorderOptions()
  }
}

function reorderOptions() {
  if (currentQuestion.value) {
    currentQuestion.value.options.forEach((option: any, idx: number) => {
      const letter = String.fromCharCode(65 + idx)
      option.label = letter
      option.value = letter
    })
  }
}

function saveQuestion() {
  if (currentQuestion.value) {
    currentQuestion.value.isEdited = true
    // 可以在这里添加保存逻辑
  }
}

// 监听答案变化
function onAnswerChange() {
  if (currentQuestion.value) {
    currentQuestion.value.isEdited = true
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

// 上传所有题目
async function uploadAllQuestions() {
  if (processedQuestions.value.length === 0) return
  
  uploading.value = true
  try {
    const response = await axios.post(`${BASE_URL}/upload-questions-batch`, { 
      questions: processedQuestions.value 
    })
    
    // 显示成功消息
    successMessage.value = `批量上传成功，共上传 ${response.data.results.length} 道题目`
    showSuccessMessage.value = true
    
    // 清空处理结果
    processedQuestions.value = []
    currentQuestionIndex.value = 0
    
  } catch (error: any) {
    alert('批量上传失败: ' + (error.response?.data?.error || error.message))
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  fetchKnowledgePoints()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

// PDF控制方法
function zoomIn() {
  if (pdfZoom.value < 3.0) {
    pdfZoom.value += 0.2
  }
}

function zoomOut() {
  if (pdfZoom.value > 0.3) {
    pdfZoom.value -= 0.2
  }
}

function resetZoom() {
  pdfZoom.value = 1.0
}

function toggleFullscreen() {
  if (!isFullscreen.value) {
    // 进入全屏模式
    if (pdfContainer.value) {
      pdfContainer.value.requestFullscreen()
      isFullscreen.value = true
    }
  } else {
    // 退出全屏模式
    if (document.fullscreenElement) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

// 拖拽功能
function handleMouseDown(event: MouseEvent) {
  if (event.button === 0) { // 左键
    isDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    if (pdfContainer.value) {
      pdfContainer.value.style.cursor = 'grabbing'
    }
  }
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    pdfPosition.value.x += deltaX
    pdfPosition.value.y += deltaY
    
    dragStart.value = { x: event.clientX, y: event.clientY }
    
    if (pdfContainer.value) {
      pdfContainer.value.style.transform = `translate(${pdfPosition.value.x}px, ${pdfPosition.value.y}px)`
    }
  }
}

function handleMouseUp() {
  isDragging.value = false
  if (pdfContainer.value) {
    pdfContainer.value.style.cursor = 'grab'
  }
}

function resetPosition() {
  pdfPosition.value = { x: 0, y: 0 }
  if (pdfContainer.value) {
    pdfContainer.value.style.transform = 'translate(0px, 0px)'
  }
}

// 面板宽度调整方法
function startResize(event: MouseEvent) {
  // 阻止事件冒泡，避免触发其他点击事件
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizeStartX.value = event.clientX
  resizeStartWidth.value = leftPanelWidth.value
  
  // 设置全局样式
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  // 添加全局事件监听器
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('mouseleave', stopResize)
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return
  
  event.preventDefault()
  
  const deltaX = event.clientX - resizeStartX.value
  const newWidth = resizeStartWidth.value + deltaX
  
  // 限制最小和最大宽度
  const minWidth = 300
  const maxWidth = window.innerWidth * 0.8
  
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    leftPanelWidth.value = newWidth
  }
}

function stopResize() {
  if (!isResizing.value) return
  
  isResizing.value = false
  
  // 恢复全局样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mouseleave', stopResize)
}

function resetPanelWidth() {
  leftPanelWidth.value = 1200
}

// 题目管理方法
function addNewQuestion() {
  const newQuestion = {
    question_text: '',
    question_type: 'text',
    question_code: '',
    correct_answer: '',
    explanation: '',
    level: presetLevel.value,
    difficulty: 'medium',
    question_date: presetQuestionDate.value,
    knowledge_point_ids: [],
    image_url: '',
    options: [],
    isEdited: false
  }
  
  // 在当前题目后插入新题目
  processedQuestions.value.splice(currentQuestionIndex.value + 1, 0, newQuestion)
  // 跳转到新添加的题目
  currentQuestionIndex.value = currentQuestionIndex.value + 1
}

function deleteCurrentQuestion() {
  if (processedQuestions.value.length > 1) {
    // 删除当前题目
    processedQuestions.value.splice(currentQuestionIndex.value, 1)
    
    // 调整当前题目索引
    if (currentQuestionIndex.value >= processedQuestions.value.length) {
      currentQuestionIndex.value = processedQuestions.value.length - 1
    }
  }
}

// 监听全屏状态变化
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// 快速编辑答案方法
function quickEditAnswer(index: number) {
  quickEditIndex.value = index
  quickEditValue.value = processedQuestions.value[index].correct_answer || ''
  // 在下一个tick中聚焦输入框
  nextTick(() => {
    const input = document.querySelector('.answer-input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function saveQuickEdit() {
  if (quickEditIndex.value >= 0 && quickEditIndex.value < processedQuestions.value.length) {
    const oldAnswer = processedQuestions.value[quickEditIndex.value].correct_answer
    processedQuestions.value[quickEditIndex.value].correct_answer = quickEditValue.value
    processedQuestions.value[quickEditIndex.value].isEdited = true
    
    // 如果答案发生了变化，自动生成解析
    if (oldAnswer !== quickEditValue.value && quickEditValue.value.trim()) {
      autoGenerateExplanation(quickEditIndex.value)
    }
  }
  quickEditIndex.value = -1
  quickEditValue.value = ''
}


function cancelQuickEdit() {
  quickEditIndex.value = -1
  quickEditValue.value = ''
}

// AI生成解析方法
async function generateExplanation(questionIndex: number) {
  const question = processedQuestions.value[questionIndex]
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
      question.isEdited = true
      
      // 显示成功提示
      successMessage.value = `第${questionIndex + 1}题解析生成成功！`
      showSuccessMessage.value = true
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
  const question = processedQuestions.value[questionIndex]
  if (question && question.correct_answer && question.question_text) {
    // 延迟一点时间再生成，避免频繁调用
    setTimeout(() => {
      generateExplanation(questionIndex)
    }, 500)
  }
}

// 图片处理方法
function handleImageDragOver() {
  isDraggingImage.value = true
}

function handleImageDragLeave() {
  isDraggingImage.value = false
}

async function handleImageDrop(e: DragEvent) {
  isDraggingImage.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await uploadImage(files[0])
  }
}

function triggerImageFileInput() {
  imageFileInput.value?.click()
}

async function handleImageFileSelect(e: Event) {
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
    
    console.log('发送上传请求到:', `${BASE_URL}/upload-image`)
    
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
      // 确保URL是完整的
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = imageUrl.startsWith('/') 
          ? `${API_SERVER_BASE}${imageUrl}` 
          : `${API_SERVER_BASE}/${imageUrl}`
      }
      
      // 替换localhost为实际服务器地址
      imageUrl = imageUrl.replace(/http:\/\/localhost:3000/g, `${API_SERVER_BASE}`)
      imageUrl = imageUrl.replace(/http:\/\/127\.0\.0\.1:3000/g, `${API_SERVER_BASE}`)
      
      currentQuestion.value.image_url = imageUrl
      currentQuestion.value.isEdited = true
      
      console.log('图片上传成功！URL:', imageUrl)
      // 显示成功提示
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
    currentQuestion.value.isEdited = true
  }
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  // 清理拖拽事件监听器（如果还在拖拽中）
  if (isResizing.value) {
    stopResize()
  }
  // 清理定时器
  if (answerChangeTimer.value) {
    clearTimeout(answerChangeTimer.value)
  }
})
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

.header-params {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.param-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-group label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.param-select,
.param-input {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 12px;
  min-width: 60px;
}

.param-select:focus,
.param-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.2);
}

.param-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-status .status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-status .status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}

.header-status .status-message {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.header-status .progress-info {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.header-status .progress-text strong {
  color: #10b981;
  font-weight: 600;
}

.header-status .streaming-indicator {
  display: flex;
  align-items: center;
}

.header-status .streaming-dots {
  display: flex;
  gap: 2px;
}

.header-status .streaming-dots span {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: streaming-pulse 1.4s infinite ease-in-out both;
}

.header-status .streaming-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.header-status .streaming-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.header-status .streaming-dots span:nth-child(3) {
  animation-delay: 0s;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-header {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  font-weight: 500;
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
  min-width: 300px;
  max-width: 80%;
  border-right: none;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
  transition: width 0.1s ease;
}

.right-panel {
  min-width: 300px;
  overflow-y: auto;
  padding: 24px;
  background: white;
  transition: width 0.1s ease;
}

.vertical-question-nav {
  width: 80px;
  background: #f8fafc;
  position: relative;
  transition: background-color 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  min-height: 200px;
  overflow-y: auto;
}

.vertical-question-nav:hover {
  background: #f0f9ff;
}

.vertical-question-nav:active {
  background: #e0f2fe;
}

.nav-controls {
  display: flex;
  gap: 12px;
  padding: 0;
  border: none;
  margin: 0;
  flex-wrap: wrap;
}

.nav-btn-vertical {
  width: 48px;
  height: 36px;
  border: 1px solid #b6e0fe;
  background: white;
  color: #1976d2;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn-vertical:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #1e90ff;
  transform: scale(1.05);
}

.nav-btn-vertical:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn-vertical.nav-btn-add {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.nav-btn-vertical.nav-btn-add:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.nav-btn-vertical.nav-btn-delete {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.nav-btn-vertical.nav-btn-delete:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.vertical-question-dots {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 8px;
  flex: 1;
  align-items: center;
}

.vertical-question-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 56px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.vertical-question-dot:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.vertical-question-dot.active {
  border-color: #1e90ff;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
  transform: translateY(-1px);
}

.vertical-question-dot.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.vertical-question-dot.new-question {
  border-color: #f59e0b;
  background: #fffbeb;
  animation: new-question-pulse 2s ease-in-out;
}

.vertical-question-dot .dot-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1e90ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  transition: all 0.3s ease;
}

.vertical-question-dot.completed .dot-number {
  background: #10b981;
}

.vertical-question-dot.new-question .dot-number {
  background: #f59e0b;
}

.vertical-question-dot .dot-answer {
  font-size: 12px;
  color: #1e90ff;
  font-weight: 600;
  text-align: center;
  min-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vertical-question-dot .dot-answer.empty {
  color: #ef4444;
}

.drag-indicator {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 2px solid #e2e8f0;
  margin-top: 8px;
  cursor: col-resize;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 8px 8px 0 0;
}

.drag-indicator:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #b6e0fe 100%);
  border-top-color: #1e90ff;
  transform: translateY(-1px);
}

.drag-line {
  width: 4px;
  height: 32px;
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 3px;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.drag-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background: #64748b;
  border-radius: 1px;
}

.drag-line::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #64748b;
  border-radius: 50%;
  opacity: 0.6;
}

.drag-indicator:hover .drag-line {
  background: linear-gradient(180deg, #1e90ff 0%, #1976d2 100%);
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(30, 144, 255, 0.3);
}

.drag-indicator:hover .drag-line::before {
  background: white;
}

.drag-indicator:hover .drag-line::after {
  background: white;
  opacity: 1;
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

.pdf-upload-section,
.pdf-preview-section,
.config-section,
.processing-control {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.pdf-info-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #b6e0fe;
  border-radius: 8px;
}

.pdf-info-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.pdf-info-section h4 {
  margin: 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.pdf-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pdf-size {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.pdf-viewer {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  height: 600px;
  position: relative;
  background: #f8fafc;
}

.pdf-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  transition: transform 0.1s ease;
}

.pdf-container:active {
  cursor: grabbing;
}

.pdf-container.dragging {
  cursor: grabbing;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  transform-origin: top left;
  transition: transform 0.3s ease;
}

.pdf-info-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-width-btn {
  background: none;
  border: none;
  color: #1e90ff;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.reset-width-btn:hover {
  background: #f0f9ff;
  transform: scale(1.1);
}

/* PDF预览增强样式 */
.pdf-preview-section {
  margin-bottom: 32px;
}

.pdf-viewer {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
}

.pdf-controls {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  padding: 4px;
}

.pdf-control-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 36px;
}

.pdf-control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.pdf-control-btn:active {
  transform: scale(0.95);
}

.pdf-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.pdf-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-zone:hover {
  border-color: #1e90ff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.upload-text {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
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

.config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-form .form-group {
  margin-bottom: 0;
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

.current-question {
  color: #1e90ff;
  font-weight: 600;
}

/* 水平导航按钮样式 */
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

.nav-btn-horizontal.nav-btn-add {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;
}

.nav-btn-horizontal.nav-btn-add:hover:not(:disabled) {
  background: linear-gradient(90deg, #059669 0%, #047857 100%);
  border-color: #059669;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.nav-btn-horizontal.nav-btn-delete {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-color: #ef4444;
}

.nav-btn-horizontal.nav-btn-delete:hover:not(:disabled) {
  background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
  border-color: #dc2626;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
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

.question-count {
  color: #1e90ff;
  font-weight: 600;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #b6e0fe;
}

.status-text {
  color: #10b981;
  font-weight: 500;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #b6e0fe;
  border-radius: 8px;
}

.streaming-dots {
  display: flex;
  gap: 4px;
}

.streaming-dots span {
  width: 8px;
  height: 8px;
  background: #1e90ff;
  border-radius: 50%;
  animation: streaming-pulse 1.4s infinite ease-in-out both;
}

.streaming-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.streaming-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.streaming-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes streaming-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.streaming-text {
  font-size: 14px;
  color: #1e90ff;
  font-weight: 500;
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
  max-height: 600px;
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

.btn-danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(239, 68, 68, 0.10);
  transition: background 0.2s, box-shadow 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 12px 0 rgba(239, 68, 68, 0.20);
  transform: translateY(-1px);
}

.btn-danger:disabled {
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
@media (max-width: 768px) {
  .dialog-container {
    width: 100vw;
    height: 100vh;
    margin: 0;
  }
  
  .dialog-main-content {
    flex-direction: column;
  }
  
  .left-panel,
  .right-panel {
    width: 100% !important;
    height: 50vh;
    min-width: auto;
    max-width: none;
  }
  
  .left-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .vertical-question-nav {
    display: none;
  }
  
  .pdf-viewer {
    height: 300px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .knowledge-points-selection {
    grid-template-columns: 1fr;
  }
  
  .nav-buttons {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .nav-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .question-dots {
    max-width: 100%;
    overflow-x: auto;
  }
}
</style> 