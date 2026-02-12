<template>
    <!-- 全页面加载界面 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">
          <h2>练习加载中</h2>
          <p>正在准备练习内容，请稍候...</p>
        </div>
      </div>
    </div>

    <div v-else class="exam-layout">
      <div class="exam-content exam-content-flex-row">
        <!-- 左侧占位区域 -->
        <div class="sidebar-placeholder-left"></div>
  
        <!-- 主体：题目展示 -->
        <div class="question-main">
          <div class="question-card">
            <div class="question-card-header">
              <div class="question-title-section">
                <h2 class="question-title">{{ currentProblem.title }}</h2>
                <span class="level-badge">GESP {{ currentProblem.level }}级</span>
                <span class="question-date" v-if="currentProblem.date">
                  <Icon name="calendar" :size="16" />
                  <span>{{ formatDate(currentProblem.date) }}</span>
                </span>
                <!-- 计划标识 -->
                <span class="submission-mode-badge task-submission-badge" title="计划内提交，提交后会更新任务进度">
                  <Icon name="clipboard-check" :size="14" />
                  <span>计划</span>
                </span>
                <!-- 本次练习计时器（计划标签后） -->
                <span class="practice-timer-badge" title="本次练习已持续时间">
                  <Icon name="clock" :size="14" />
                  <span>{{ practiceTimerDisplay }}</span>
                </span>
              </div>
              <div class="header-buttons">
                <!-- 字体大小调整 -->
                <div class="font-size-control-header">
                  <Icon name="type" :size="14" />
                  <input
                    type="range"
                    v-model.number="fontSize"
                    min="10"
                    max="24"
                    step="1"
                    class="font-size-slider-header"
                    @input="updateFontSize"
                    title="字体大小"
                  />
                  <span class="font-size-value-header">{{ fontSize }}px</span>
                </div>
                <button 
                  @click="runCode" 
                  class="btn btn-test" 
                  :disabled="isRunning || runCooldown > 0" 
                  :class="{ 'btn-loading': isRunning }"
                >
                  <span v-if="!isRunning && runCooldown === 0" class="btn-content">
                    <Icon name="play" :size="16" />
                    <span>运行代码</span>
                  </span>
                  <span v-else-if="isRunning" class="btn-content">
                    <Icon name="loader-2" :size="16" spin />
                    <span>运行中...</span>
                  </span>
                  <span v-else class="btn-content">
                    <Icon name="clock" :size="16" />
                    <span>等待 {{ runCooldown }}s</span>
                  </span>
                </button>
                <button 
                  @click="submitCode" 
                  class="btn btn-submit" 
                  :disabled="isSubmitting || submitCooldown > 0" 
                  :class="{ 'btn-loading': isSubmitting }"
                >
                  <span v-if="!isSubmitting && submitCooldown === 0" class="btn-content">
                    <Icon name="rocket" :size="16" />
                    <span>提交代码</span>
                  </span>
                  <span v-else-if="isJudging" class="btn-content">
                    <Icon name="loader-2" :size="16" spin />
                    <span>判题中...</span>
                  </span>
                  <span v-else-if="isSubmitting" class="btn-content">
                    <Icon name="loader-2" :size="16" spin />
                    <span>提交中...</span>
                  </span>
                  <span v-else class="btn-content">
                    <Icon name="clock" :size="16" />
                    <span>等待 {{ submitCooldown }}s</span>
                  </span>
                </button>
              </div>
            </div>
  
            <!-- 统一的内容滚动区域 - 左右分栏 -->
            <div class="question-content-unified">
              <!-- 左侧：题目内容 -->
              <div class="question-left-panel" :style="{ width: leftPanelWidth + '%' }">
                <!-- 题目描述 -->
                  <div class="content-section question-text-section">
                    <div class="section-header">
                      <h4 class="section-title"><Icon name="file-text" :size="18" /> 题目描述</h4>
                    </div>
                    <div class="section-content">
                      <div class="problem-description">
                        <div
                          v-html="renderedDescription"
                          class="markdown-content"
                        ></div>
                      </div>
                    </div>
                  </div>
  
                  <!-- 输入输出格式 -->
                  <div class="content-section problem-io-section">
                    <div class="section-header">
                      <h4 class="section-title"><Icon name="download" :size="18" /> 输入格式</h4>
                    </div>
                    <div class="section-content">
                      <div class="problem-io">
                        <div
                          v-html="renderedInputFormat"
                          class="markdown-content"
                        ></div>
                      </div>
                    </div>
                  </div>
  
                  <div class="content-section problem-io-section">
                    <div class="section-header">
                      <h4 class="section-title"><Icon name="upload" :size="18" /> 输出格式</h4>
                    </div>
                    <div class="section-content">
                      <div class="problem-io">
                        <div
                          v-html="renderedOutputFormat"
                          class="markdown-content"
                        ></div>
                      </div>
                    </div>
                  </div>
  
                  <!-- 样例 -->
                  <div class="content-section problem-samples-section">
                    <div class="section-header">
                      <h4 class="section-title"><Icon name="lightbulb" :size="18" /> 样例</h4>
                    </div>
                    <div class="section-content">
                      <div class="problem-samples">
                        <div
                          v-for="(sample, index) in currentProblem.samples"
                          :key="index"
                          class="sample-item"
                        >
                          <div class="sample-block">
                            <div class="sample-label">输入 {{ index + 1 }}:</div>
                            <pre class="sample-code">{{ sample.input }}</pre>
                          </div>
                          <div class="sample-block">
                            <div class="sample-label">输出 {{ index + 1 }}:</div>
                            <pre class="sample-code">{{ sample.output }}</pre>
                          </div>
                          <div v-if="sample.explanation" class="sample-explanation">
                            <div class="sample-label">说明:</div>
                            <div
                              v-html="renderMarkdown(sample.explanation)"
                              class="markdown-content"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  <!-- 数据范围 -->
                  <div class="content-section problem-constraints-section">
                    <div class="section-header">
                      <h4 class="section-title"><Icon name="bar-chart-3" :size="18" /> 数据范围</h4>
                    </div>
                    <div class="section-content">
                      <div class="problem-constraints">
                        <ul>
                          <li
                            v-for="(constraint, index) in currentProblem.constraints"
                            :key="index"
                            v-html="renderedConstraints[index]"
                          ></li>
                        </ul>
                      </div>
                    </div>
                  </div>
              </div>
  
              <!-- 可拖动的分隔条 -->
              <div class="panel-resizer" @mousedown="startDrag">
                <div class="resizer-line"></div>
                <div class="resizer-handle">
                  <Icon name="grip-vertical" :size="16" />
                </div>
              </div>
  
              <!-- 右侧：代码编辑器 -->
              <div
                class="question-right-panel"
                :class="{ 'panel-collapsed': isEditorExpanded }"
                :style="{ width: 100 - leftPanelWidth + '%' }"
              >
                <!-- 代码编辑器区域 -->
                <div class="code-editor-wrapper" ref="editorContainer" @click="focusEditor" :style="{ fontSize: fontSize + 'px' }"></div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 右侧占位区域 -->
        <div class="sidebar-placeholder"></div>
      </div>
  
      <!-- 运行结果弹窗 -->
      <div v-if="testResult" class="result-modal-overlay" @click="closeTestResult">
        <div class="result-modal" @click.stop>
          <div class="result-modal-header">
            <span class="result-title">运行结果</span>
            <div class="result-header-right">
              <span
                :class="[
                  'result-status',
                  testResult.success ? 'status-success' : 'status-error',
                ]"
              >
                {{ testResult.success ? '✓ 通过' : '✗ 失败' }}
              </span>
              <button class="close-modal-btn" @click="closeTestResult">
                <Icon name="x" :size="18" />
              </button>
            </div>
          </div>
          <div class="result-modal-content">
            <div class="result-item">
              <span class="result-label">输入:</span>
              <pre class="result-value">{{ testResult.input }}</pre>
            </div>
            <div class="result-item">
              <span class="result-label">预期输出:</span>
              <pre class="result-value">{{ testResult.expected }}</pre>
            </div>
            <div class="result-item">
              <span class="result-label">实际输出:</span>
              <pre class="result-value">{{ testResult.actual }}</pre>
            </div>
            <div v-if="testResult.error" class="result-item error">
              <span class="result-label">错误信息:</span>
              <pre class="result-value">{{ testResult.error }}</pre>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 提交结果弹窗 -->
      <div v-if="submitResult" class="result-modal-overlay" @click="closeSubmitResult">
        <div class="result-modal submit-result-modal" @click.stop>
          <div class="result-modal-header">
            <span class="result-title">提交结果</span>
            <div class="result-header-right">
              <span :class="['result-status', getSubmitStatusClass(submitResult.status)]">
                {{ submitResult.statusText }}
              </span>
              <button class="close-modal-btn" @click="closeSubmitResult">
                <Icon name="x" :size="18" />
              </button>
            </div>
          </div>
          <div class="result-modal-content">
            <!-- 总体统计 -->
            <div class="result-stats">
              <div class="stat-box">
                <div class="stat-label">判题结果</div>
                <div class="stat-value verdict-text">{{ submitResult.verdict }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">通过测试点</div>
                <div class="stat-value">
                  {{ submitResult.passedTests }} / {{ submitResult.totalTests }}
                </div>
              </div>
            </div>

            <!-- 测试用例详情 -->
            <div v-if="submitResult.results && submitResult.results.length > 0" class="test-cases-section">
              <h4 class="section-subtitle">测试用例详情</h4>
              <div 
                v-for="(testCase, index) in submitResult.results" 
                :key="index" 
                class="test-case-item"
                :class="{ 'test-passed': testCase.passed, 'test-failed': !testCase.passed }"
              >
                <div class="test-case-header">
                  <span class="test-case-number">测试点 {{ testCase.sample }}</span>
                  <span :class="['test-case-status', testCase.passed ? 'status-pass' : 'status-fail']">
                    {{ testCase.passed ? '✓ 通过' : '✗ 失败' }}
                  </span>
                </div>
                
                <div v-if="!testCase.is_hidden" class="test-case-details">
                  <div class="test-detail-row">
                    <span class="detail-label">输入:</span>
                    <pre class="detail-value">{{ testCase.input }}</pre>
                  </div>
                  <div class="test-detail-row">
                    <span class="detail-label">期望输出:</span>
                    <pre class="detail-value">{{ testCase.expected }}</pre>
                  </div>
                  <div class="test-detail-row">
                    <span class="detail-label">实际输出:</span>
                    <pre class="detail-value" :class="{ 'output-error': !testCase.passed }">{{ testCase.actual }}</pre>
                  </div>
                  <div v-if="testCase.error" class="test-detail-row error-row">
                    <span class="detail-label">错误信息:</span>
                    <pre class="detail-value error-text">{{ testCase.error }}</pre>
                  </div>
                </div>
                
                <div v-else class="test-case-hidden">
                  <Icon name="lock" :size="16" />
                  <span>隐藏测试点</span>
                  <span v-if="testCase.passed" class="hidden-result">（已通过）</span>
                  <span v-else class="hidden-result">（未通过）</span>
                </div>
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="submitResult.error" class="result-item error" style="margin-top: 20px;">
              <span class="result-label">错误信息:</span>
              <pre class="result-value">{{ submitResult.error }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 烟花效果 -->
      <div v-if="showFireworks" class="fireworks-container">
        <div class="firework" v-for="n in 20" :key="n" :style="getFireworkStyle(n)"></div>
      </div>

      <!-- 火箭发射特效 -->
      <div v-if="showRocketLaunch" class="rocket-launch-container">
        <div class="rocket-trail"></div>
        <div class="rocket-icon">
          <Icon name="rocket" :size="64" />
        </div>
        <div class="rocket-particles">
          <div class="particle" v-for="n in 15" :key="n" :style="getParticleStyle(n)"></div>
        </div>
      </div>

      <!-- 返回确认弹窗 -->
      <div v-if="showReturnConfirmDialog" class="exit-confirm-modal-overlay" @click="cancelReturn">
        <div class="exit-confirm-modal-content return-confirm-modal" @click.stop>
          <div class="exit-confirm-header return-confirm-header">
            <h3>恭喜通过！</h3>
            <button @click="cancelReturn" class="exit-confirm-close">×</button>
          </div>
          <div class="exit-confirm-body">
            <div class="exit-confirm-icon success-icon"><Icon name="check-circle" :size="48" /></div>
            <p class="exit-confirm-message">
              恭喜您成功通过本题！<br>
              <span class="exit-confirm-warning">是否返回上一页？</span>
            </p>
          </div>
          <div class="exit-confirm-footer">
            <button @click="cancelReturn" class="btn btn-secondary">
              继续练习
            </button>
            <button @click="confirmReturn" class="btn btn-primary">
              返回
            </button>
          </div>
        </div>
      </div>

      <!-- 提交确认弹窗 -->
      <div v-if="showCaptchaModal" class="exit-confirm-modal-overlay" @click="closeCaptchaModal">
        <div class="exit-confirm-modal-content captcha-modal" @click.stop>
          <div class="exit-confirm-header">
            <h3>提交确认</h3>
            <button @click="closeCaptchaModal" class="exit-confirm-close">×</button>
          </div>
          <div class="exit-confirm-body">
            <div class="captcha-content">
              <!-- 提示信息 -->
              <div class="captcha-tip">
                <Icon name="info" :size="20" />
                <p class="captcha-tip-text">
                  提交后需要等待 <strong>15秒</strong> 才能再次提交。如果判题出现错误，请自行查看测试点信息排查问题。
                </p>
              </div>
              <div class="captcha-question">
                <Icon name="alert-triangle" :size="32" />
                <p class="captcha-text">确定要提交代码吗？</p>
              </div>
            </div>
          </div>
          <div class="exit-confirm-footer">
            <button @click="closeCaptchaModal" class="btn btn-secondary">
              取消
            </button>
            <button @click="confirmAndSubmit" class="btn btn-primary">
              确认提交
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  import { BASE_URL, OJ_API_CONFIGS } from '@/config/api'
  import Icon from '@/components/Icon.vue'
  
// 当前使用的API配置索引
let currentApiIndex = 0

// 负载均衡：随机选择服务器（50%概率）
const getRandomApiConfig = () => {
  const availableConfigs = OJ_API_CONFIGS.filter(config => config.enabled)
  if (availableConfigs.length === 0) return OJ_API_CONFIGS[0]
  const randomIndex = Math.floor(Math.random() * availableConfigs.length)
  currentApiIndex = randomIndex
  return availableConfigs[randomIndex]
}

// 获取当前有效的API配置
const getCurrentApiConfig = () => {
  // 按优先级排序并过滤启用的配置
  const availableConfigs = OJ_API_CONFIGS
    .filter(config => config.enabled)
    .sort((a, b) => a.priority - b.priority)
  
  // 如果当前索引超出范围，使用第一个可用的配置
  if (currentApiIndex >= availableConfigs.length) {
    currentApiIndex = 0
  }
  
  return availableConfigs[currentApiIndex] || availableConfigs[0]
}

// 获取当前API基础URL（使用负载均衡）
const getCurrentApiBaseUrl = () => {
  const config = getRandomApiConfig()
  return config ? config.url : OJ_API_CONFIGS[0].url
}
  
  // 切换到下一个可用的API配置
  const switchToNextApi = () => {
    const availableConfigs = OJ_API_CONFIGS
      .filter(config => config.enabled)
      .sort((a, b) => a.priority - b.priority)
    
    if (availableConfigs.length <= 1) {
      if (import.meta.env.DEV) console.warn('没有可用的备用API配置')
      return false
    }
    currentApiIndex = (currentApiIndex + 1) % availableConfigs.length
    getCurrentApiConfig()
    return true
  }
  
  // 带故障切换的API请求函数
  const apiRequestWithFallback = async (url: string, options: RequestInit, maxRetries = 1) => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const currentApiUrl = getCurrentApiBaseUrl()
      const fullUrl = `${currentApiUrl}${url}`
      
      try {
        const response = await fetch(fullUrl, options)
        
        if (response.ok) {
          return response
        }
        
        // 如果不是网络错误，直接抛出
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`API错误: ${response.status} ${response.statusText}`)
        }
        
        // 服务器错误，尝试切换API
        throw new Error(`服务器错误: ${response.status}`)
        
      } catch (error) {
        lastError = error as Error
        console.error(`API请求失败 (尝试 ${attempt + 1}):`, error)
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt >= maxRetries) {
          break
        }
        
        // 切换到下一个API配置
        if (!switchToNextApi()) {
          break // 没有可用的备用配置
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    throw lastError || new Error('所有API配置都失败了')
  }
  // 导入 CodeMirror 6
  import { EditorView, keymap, lineNumbers as cmLineNumbers } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  import { cpp } from '@codemirror/lang-cpp'
  import { indentWithTab, defaultKeymap, historyKeymap, history } from '@codemirror/commands'
  import {
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
    syntaxHighlighting,
    HighlightStyle,
    indentUnit,
  } from '@codemirror/language'
  import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
  import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
  } from '@codemirror/autocomplete'
  import { lintKeymap } from '@codemirror/lint'
  import { tags } from '@lezer/highlight'
import hljs from 'highlight.js'
// @ts-ignore
import katex from 'katex'
  
  const route = useRoute()
  const router = useRouter()
  const problemId = route.params.problemId
  
  // 检查是否从计划页面进入
  const urlParams = new URLSearchParams(window.location.search)
  const fromPlan = urlParams.get('from') === 'plan'
  const fromTaskView = urlParams.get('from') === 'taskview'
  const planId = urlParams.get('planId') || null
  const taskId = urlParams.get('taskId') || null
  
  // 调试日志
  console.log('🔍 [SmartOJView] URL参数检查:', {
    from: urlParams.get('from'),
    fromPlan,
    fromTaskView,
    planId,
    taskId,
    fullUrl: window.location.href
  })
  
  // 加载状态
  const loading = ref(true)
  
  // 本次练习开始时间（用于提交时计算练习持续时间，单位：毫秒时间戳）
  const practiceStartTime = ref<number | null>(null)
  // 计时器显示文案（每 1 秒更新）
  const practiceTimerDisplay = ref('00:00')
  
  function updatePracticeTimerDisplay() {
    if (practiceStartTime.value == null) {
      practiceTimerDisplay.value = '00:00'
      return
    }
    const totalSeconds = Math.max(0, Math.floor((Date.now() - practiceStartTime.value) / 1000))
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) {
      practiceTimerDisplay.value = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    } else {
      practiceTimerDisplay.value = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
  }
  
  // 当前题目数据（初始为空，从API加载）
  const currentProblem = ref({
    title: '加载中...',
    level: 1,
    date: '',
    difficulty: 'medium',
    submitStatus: 'not_submitted',
    description: '',
    inputFormat: '',
    outputFormat: '',
    samples: [] as any[],
    constraints: [] as string[],
  })

  // 计算属性：缓存渲染结果，避免重复计算
  const renderedDescription = computed(() => renderMarkdown(currentProblem.value.description))
  const renderedInputFormat = computed(() => renderMarkdown(currentProblem.value.inputFormat))
  const renderedOutputFormat = computed(() => renderMarkdown(currentProblem.value.outputFormat))
  const renderedConstraints = computed(() => 
    currentProblem.value.constraints.map(constraint => renderMarkdown(constraint))
  )
  
  // 从API获取题目详情
  async function fetchProblemDetail() {
    try {
      const response = await axios.get(`${BASE_URL}/oj/problems/${problemId}`)
      
      if (response.data.success) {
        const data = response.data.data
        currentProblem.value = {
          title: data.title,
          level: data.level,
          date: data.publish_date,
          difficulty: 'medium', // API未返回难度，使用默认值
          submitStatus: 'not_submitted',
          description: data.description,
          inputFormat: data.input_format,
          outputFormat: data.output_format,
          samples: data.samples || [],
          constraints: data.data_range ? [data.data_range] : [],
        }
        // 保存题目标题到localStorage，供NavBar显示
        localStorage.setItem('currentOJProblemTitle', data.title)
        // 记录本次练习开始时间（用于提交时计算练习持续时间）
        practiceStartTime.value = Date.now()
        updatePracticeTimerDisplay()
      }
      
      // 延迟一点时间再关闭加载界面，让动画更自然
      await new Promise(resolve => setTimeout(resolve, 300))
      // 加载完成
      loading.value = false
      
      // 加载完成后初始化编辑器
      setTimeout(() => {
        initEditor()
      }, 100)
    } catch (error) {
      console.error('获取题目详情失败:', error)
      alert('获取题目详情失败，请稍后重试')
      // 即使出错也要取消加载状态
      loading.value = false
      
      // 即使出错也初始化编辑器
      setTimeout(() => {
        initEditor()
      }, 100)
    }
  }
  
  const selectedLanguage = ref('cpp')
  const isRunning = ref(false)
  const isSubmitting = ref(false)
  const isJudging = ref(false) // 是否正在判题（轮询中）
  const testResult = ref<any>(null)
  const submitResult = ref<any>(null)
  const isEditorExpanded = ref(false) // 编辑器展开状态
  const leftPanelWidth = ref(50) // 左侧面板宽度百分比，默认50%
  
  // 字体大小相关状态
  const fontSize = ref(14) // 默认字体大小14px
  
  // 返回确认弹窗状态
  const showReturnConfirmDialog = ref(false)
  // 提交OJ答题相关状态
  const isSubmittingOJ = ref(false)
  // 烟花效果状态
  const showFireworks = ref(false)
  // 火箭发射特效状态
  const showRocketLaunch = ref(false)
  
  // 时间限制相关状态
  const lastRunTime = ref(0) // 上次运行代码的时间戳
  const lastSubmitTime = ref(0) // 上次提交代码的时间戳
  const runCooldown = ref(0) // 运行代码冷却时间（秒）
  const submitCooldown = ref(0) // 提交代码冷却时间（秒）
  const COOLDOWN_DURATION = 10000 // 冷却时间：10秒
  
  // 验证码相关状态
  const showCaptchaModal = ref(false)
  const captchaCode = ref('') // 用户输入的验证码
  const captchaAnswer = ref('') // 正确的验证码答案
  const captchaInput = ref('') // 验证码输入框的值
  const captchaError = ref('') // 验证码错误提示
  
  // 编辑器相关
  const editorContainer = ref<HTMLElement | null>(null)
  const expandedEditorContainer = ref<HTMLElement | null>(null)
  let editorView: EditorView | null = null
  let expandedEditorView: EditorView | null = null
  
  // 拖动相关
  let isDragging = false
  let startX = 0
  let startLeftWidth = 0
  
  // 从 localStorage 获取缓存的代码
  const getCachedCode = (pid: string) => {
    try {
      const cacheKey = `oj_code_${pid}`
      return localStorage.getItem(cacheKey) || ''
    } catch (error) {
      console.error('读取缓存代码失败:', error)
      return ''
    }
  }

  // 保存代码到 localStorage
  const saveCodeToCache = (pid: string, code: string) => {
    try {
      const cacheKey = `oj_code_${pid}`
      localStorage.setItem(cacheKey, code)
    } catch (error) {
      console.error('保存代码到缓存失败:', error)
    }
  }
  
  // 清除代码缓存
  const clearCachedCode = (pid: string) => {
    try {
      const cacheKey = `oj_code_${pid}`
      localStorage.removeItem(cacheKey)
      console.log('已清除代码缓存:', cacheKey)
    } catch (error) {
      console.error('清除代码缓存失败:', error)
    }
  }
  
  const initialCode = getCachedCode(problemId as string)

// 获取当前代码
const getCode = () => {
  // 如果展开的编辑器存在，从展开的编辑器获取代码
  if (isEditorExpanded.value && expandedEditorView) {
    return expandedEditorView.state.doc.toString()
  }
  return editorView?.state.doc.toString() || ''
}

// 渲染数学公式
const renderMath = (mathText: string, displayMode: boolean = false): string => {
  try {
    const cleanMathText = mathText.trim()
    return katex.renderToString(cleanMathText, {
      displayMode: displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      strict: false,
      trust: false,
      macros: {
        "\\f": "#1f(#2)"
      }
    })
  } catch (error) {
    console.warn('KaTeX 渲染失败:', error, '公式:', mathText)
    return `<span class="math-error">${mathText}</span>`
  }
}

// 简单的 Markdown 渲染器
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  try {
    // Step 1: 先提取并保护所有数学公式（在处理其他内容之前）
    const mathStore: Array<{ placeholder: string; html: string; original: string; isBlock: boolean }> = []
    let mathIndex = 0
    let processed = text

    // 先处理块级数学公式 $$...$$，使用非贪婪匹配，避免嵌套问题
    // 使用更严格的模式，避免在旧浏览器中出现问题
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, content, offset, string) => {
      // 避免处理已经被替换的内容
      if (match.indexOf('__MATH_') >= 0) {
        return match
      }
      // 检查是否是真正的块级公式（前后不是$字符）
      const beforeChar = offset > 0 ? string[offset - 1] : ''
      const afterChar = offset + match.length < string.length ? string[offset + match.length] : ''
      // 如果前后都是$，说明可能是行内公式的误匹配，跳过
      if (beforeChar === '$' || afterChar === '$') {
        return match
      }
      
      const placeholder = `__MATH_BLOCK_${mathIndex}__`
      const trimmedContent = content.trim()
      if (!trimmedContent) {
        return match // 如果内容为空，不处理
      }
      const rendered = renderMath(trimmedContent, true)
      mathStore.push({ 
        placeholder, 
        html: `<div class="math-block">${rendered}</div>`,
        original: match,
        isBlock: true
      })
      mathIndex++
      return placeholder
    })

    // 再处理行内数学公式 $...$，排除块级公式
    // 使用兼容旧浏览器的方式，避免使用负向后顾断言
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, content, offset, string) => {
      // 避免处理已经被替换的内容
      if (match.indexOf('__MATH_') >= 0) {
        return match
      }
      // 检查前后字符，确保不是块级公式的一部分
      const beforeChar = offset > 0 ? string[offset - 1] : ''
      const afterChar = offset + match.length < string.length ? string[offset + match.length] : ''
      // 如果前后是$，说明是块级公式，跳过
      if (beforeChar === '$' || afterChar === '$') {
        return match
      }
      
      // 去除首尾空白
      const trimmedContent = content.trim()
      if (!trimmedContent) {
        return match // 如果内容为空，不处理
      }
      const placeholder = `__MATH_INLINE_${mathIndex}__`
      const rendered = renderMath(trimmedContent, false)
      mathStore.push({ 
        placeholder, 
        html: `<span class="math-inline">${rendered}</span>`,
        original: match,
        isBlock: false
      })
      mathIndex++
      return placeholder
    })

    // Step 2: 先处理代码块（必须在换行符替换之前）
    const codeBlockStore: Array<{ placeholder: string; html: string }> = []
    let codeBlockIndex = 0
    
    // 匹配代码块：```可选语言\n代码内容\n```
    processed = processed.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      // 如果包含数学公式占位符，不处理
      if (match.indexOf('__MATH_') >= 0) {
        return match
      }
      const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`
      let html = ''
      
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(code.trim(), { language: lang, ignoreIllegals: true }).value
          html = `<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>`
        } catch (err) {
          console.warn('代码高亮失败:', err)
          html = `<pre><code>${code.trim()}</code></pre>`
        }
      } else {
        html = `<pre><code>${code.trim()}</code></pre>`
      }
      
      codeBlockStore.push({ placeholder, html })
      codeBlockIndex++
      return placeholder
    })

    // Step 3: 处理长字符串换行（但跳过已保护的数学公式和代码块占位符）
    processed = processed.replace(/([^\s__]{50,})/g, (match) => {
      // 如果是数学公式或代码块占位符，跳过
      if (match.indexOf('__MATH_') >= 0 || match.indexOf('__CODE_BLOCK_') >= 0) {
        return match
      }
      return match.replace(/(.{20})/g, '$1\u200B')
    })

    // Step 4: 基础 Markdown 处理（但跳过已保护的数学公式和代码块占位符）
    let result = processed
      // 处理换行（但保留占位符中的换行标记）
      .replace(/\n/g, '<br>')
      // 处理粗体（避免匹配数学公式和代码块占位符内的内容）
      .replace(/\*\*((?:(?!__MATH_)(?!__CODE_BLOCK_)[\s\S])*?)\*\*/g, '<strong>$1</strong>')
      // 处理斜体（避免匹配数学公式和代码块占位符内的内容）
      // 使用兼容旧浏览器的方式，先检查前面不是*号
      .replace(/([^*]|^)\*((?:(?!__MATH_)(?!__CODE_BLOCK_)[^*])+?)\*(?!\*)/g, (match, before, content, offset, string) => {
        // 检查前面不是*号（避免与粗体冲突）
        const charBefore = offset > 0 ? string[offset - 1] : ''
        if (charBefore === '*') {
          return match // 如果是粗体的一部分，不处理
        }
        return (before || '') + '<em>' + content + '</em>'
      })
      // 处理行内代码（避免匹配数学公式和代码块占位符）
      .replace(/`((?:(?!__MATH_)(?!__CODE_BLOCK_)[^`])+?)`/g, '<code>$1</code>')

    // Step 5: 还原代码块
    codeBlockStore.forEach(({ placeholder, html }) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      result = result.replace(regex, html)
    })

    // Step 6: 还原数学公式（只替换占位符，避免重复替换）
    // 按照添加顺序替换，确保每个占位符都被正确替换
    mathStore.forEach(({ placeholder, html }) => {
      // 转义占位符中的特殊字符，用于正则表达式
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // 使用全局替换，替换所有占位符实例（每个占位符应该只出现一次）
      const regex = new RegExp(escapedPlaceholder, 'g')
      result = result.replace(regex, html)
    })

    return result
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return `<p class="render-error">渲染失败: ${error}</p>`
  }
}
  
  const getDifficultyText = (difficulty: string) => {
    const map: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    }
    return map[difficulty] || difficulty
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
      })
    } catch (error) {
      console.error('日期格式化错误:', error)
      return dateString
    }
  }
  
  // 生成验证码（至少包含三个数）
  const generateCaptcha = () => {
    // 生成更难的数学验证码：所有题目至少包含三个数
    const operations = [
      // 混合运算：两位数 + 两位数 - 一位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 9) + 1 // 1-9
        const answer = num1 + num2 - num3
        return { question: `${num1} + ${num2} - ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 × 一位数 + 两位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 9) + 2 // 2-10
        const num3 = Math.floor(Math.random() * 90) + 10 // 10-99
        const answer = num1 * num2 + num3
        return { question: `${num1} × ${num2} + ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 + 两位数 + 一位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 9) + 1 // 1-9
        const answer = num1 + num2 + num3
        return { question: `${num1} + ${num2} + ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 - 一位数 + 两位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 9) + 1 // 1-9
        const num3 = Math.floor(Math.random() * 90) + 10 // 10-99
        const answer = num1 - num2 + num3
        return { question: `${num1} - ${num2} + ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 × 一位数 - 两位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 9) + 2 // 2-10
        const num3 = Math.floor(Math.random() * 90) + 10 // 10-99
        const answer = num1 * num2 - num3
        return { question: `${num1} × ${num2} - ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：三位数 + 两位数 - 一位数
      () => {
        const num1 = Math.floor(Math.random() * 900) + 100 // 100-999
        const num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 9) + 1 // 1-9
        const answer = num1 + num2 - num3
        return { question: `${num1} + ${num2} - ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 + 两位数 × 一位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 9) + 2 // 2-10
        const answer = num1 + num2 * num3
        return { question: `${num1} + ${num2} × ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：三位数 - 两位数 + 一位数
      () => {
        let num1 = Math.floor(Math.random() * 900) + 100 // 100-999
        let num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 9) + 1 // 1-9
        // 确保结果为正
        if (num1 - num2 < 0) {
          const temp = num1
          num1 = num2
          num2 = temp
        }
        const answer = num1 - num2 + num3
        return { question: `${num1} - ${num2} + ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：一位数 × 两位数 + 两位数
      () => {
        const num1 = Math.floor(Math.random() * 9) + 2 // 2-10
        const num2 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num3 = Math.floor(Math.random() * 90) + 10 // 10-99
        const answer = num1 * num2 + num3
        return { question: `${num1} × ${num2} + ${num3} = ?`, answer: answer.toString() }
      },
      // 混合运算：两位数 + 一位数 × 两位数
      () => {
        const num1 = Math.floor(Math.random() * 90) + 10 // 10-99
        const num2 = Math.floor(Math.random() * 9) + 2 // 2-10
        const num3 = Math.floor(Math.random() * 90) + 10 // 10-99
        const answer = num1 + num2 * num3
        return { question: `${num1} + ${num2} × ${num3} = ?`, answer: answer.toString() }
      }
    ]
    
    // 随机选择一种运算类型
    const randomOp = operations[Math.floor(Math.random() * operations.length)]
    const result = randomOp()
    captchaAnswer.value = result.answer
    captchaCode.value = result.question
    captchaInput.value = ''
    captchaError.value = '' // 清除错误信息
  }
  
  // 更新冷却时间倒计时
  const updateCooldowns = () => {
    const now = Date.now()
    
    // 更新运行代码冷却时间
    if (lastRunTime.value > 0) {
      const elapsed = now - lastRunTime.value
      const remaining = Math.max(0, COOLDOWN_DURATION - elapsed)
      runCooldown.value = Math.ceil(remaining / 1000)
    } else {
      runCooldown.value = 0
    }
    
    // 更新提交代码冷却时间
    if (lastSubmitTime.value > 0) {
      const elapsed = now - lastSubmitTime.value
      const remaining = Math.max(0, COOLDOWN_DURATION - elapsed)
      submitCooldown.value = Math.ceil(remaining / 1000)
    } else {
      submitCooldown.value = 0
    }
  }
  
  // 启动冷却时间定时器
  let cooldownTimer: number | null = null
  const startCooldownTimer = () => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
    }
    cooldownTimer = window.setInterval(() => {
      updateCooldowns()
    }, 100)
  }
  
  const runCode = async () => {
    // 检查冷却时间
    const now = Date.now()
    if (lastRunTime.value > 0) {
      const elapsed = now - lastRunTime.value
      if (elapsed < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - elapsed) / 1000)
        alert(`请等待 ${remaining} 秒后再运行代码`)
        return
      }
    }
    
    isRunning.value = true
    testResult.value = null
    submitResult.value = null
  
    try {
      // 获取编辑器中的代码
      const currentCode = getCode()
      console.log('运行代码:', currentCode)
  
      // 使用第一个样例进行测试
      const firstSample = currentProblem.value.samples[0]
      if (!firstSample) {
        testResult.value = {
          success: false,
          input: '',
          expected: '',
          actual: '',
          error: '没有可用的测试样例',
        }
        isRunning.value = false
        // 即使没有样例，也要开始倒计时
        lastRunTime.value = Date.now()
        updateCooldowns()
        return
      }
  
      // 准备发送的数据
      const requestData = {
        code: currentCode,
        language: selectedLanguage.value,
        input: firstSample.input,
        output: firstSample.output, // expected output
      }
      
      console.log('发送到后端的数据:', requestData)
  
      // 发送请求到后端（支持故障切换）
      const response = await apiRequestWithFallback('/api/oj/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
  
      console.log('后端响应状态:', response.status)
  
      // 先获取响应文本，这样即使不是JSON也能看到错误信息
      const responseText = await response.text()
      console.log('后端响应内容:', responseText)
  
      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('后端错误详情:', errorData)
        } catch (e) {
          console.error('无法解析错误响应:', responseText)
        }
        throw new Error(errorMessage)
      }
  
      // 解析成功的响应
      const result = JSON.parse(responseText)
      console.log('运行结果:', result)
  
      // 设置测试结果
      testResult.value = {
        success: result.success,
        input: result.input || firstSample.input,
        expected: result.expected || firstSample.output,
        actual: result.actual || '',
        error: result.error || null,
      }
    } catch (error) {
      console.error('运行代码失败:', error)
      testResult.value = {
        success: false,
        input: currentProblem.value.samples[0]?.input || '',
        expected: currentProblem.value.samples[0]?.output || '',
        actual: '',
        error: error instanceof Error ? error.message : '运行失败，请稍后重试',
      }
    } finally {
      isRunning.value = false
      // 运行完成后开始倒计时
      lastRunTime.value = Date.now()
      updateCooldowns()
    }
  }
  
// 打开提交确认弹窗
const openCaptchaModal = () => {
  showCaptchaModal.value = true
}
  
  // 关闭验证码弹窗
  const closeCaptchaModal = () => {
    showCaptchaModal.value = false
    captchaInput.value = ''
    captchaError.value = '' // 清除错误信息
  }
  
  // 提交代码（先检查冷却时间，然后打开验证码弹窗）
  const submitCode = () => {
    // 检查冷却时间
    const now = Date.now()
    if (lastSubmitTime.value > 0) {
      const elapsed = now - lastSubmitTime.value
      if (elapsed < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - elapsed) / 1000)
        alert(`请等待 ${remaining} 秒后再提交代码`)
        return
      }
    }
    
    // 打开验证码弹窗
    openCaptchaModal()
  }
  
// 确认并提交代码（无需验证码）
const confirmAndSubmit = async () => {
  // 关闭弹窗
  closeCaptchaModal()
  
  // 执行提交
  await doSubmitCode()
}
  
  // 执行提交代码的实际逻辑
  const doSubmitCode = async () => {
    // 检查冷却时间
    const now = Date.now()
    if (lastSubmitTime.value > 0) {
      const elapsed = now - lastSubmitTime.value
      if (elapsed < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - elapsed) / 1000)
        alert(`请等待 ${remaining} 秒后再提交代码`)
        return
      }
    }
    
    isSubmitting.value = true
    testResult.value = null
    submitResult.value = null
    
    // 触发火箭发射特效
    triggerRocketLaunch()
  
    try {
      // 获取用户信息
      const userInfoStr = localStorage.getItem('userInfo')
      if (!userInfoStr) {
        alert('请先登录')
        router.push('/login')
        return
      }
      
      const userInfo = JSON.parse(userInfoStr)
      
      // 获取编辑器中的代码
      const currentCode = getCode()
      console.log('提交代码:', currentCode)
  
      // 本次练习持续时间（秒），从进入页面到提交
      const practiceDurationSeconds = practiceStartTime.value != null
        ? Math.max(0, Math.round((Date.now() - practiceStartTime.value) / 1000))
        : null

      // 1. 提交代码
      const requestData = {
        problem_id: parseInt(problemId as string),
        code: currentCode,
        language: selectedLanguage.value,
        user_id: userInfo.id,
        practice_duration_seconds: practiceDurationSeconds,
      }
      
      console.log('发送到后端的提交数据:', requestData)
  
      // PlanSmartOJView 始终使用任务内提交接口
      if (!taskId || taskId.trim() === '') {
        alert('错误：缺少任务ID，无法提交代码。请从任务页面进入。')
        console.error('❌ [PlanSmartOJView] 缺少taskId参数，无法提交')
        isSubmitting.value = false
        return
      }
      
      // 任务内提交使用原 BASE_URL（不使用故障切换）
      const submitUrl = `${BASE_URL}/learning-tasks/${taskId}/submit-oj`
      console.log('✅ [PlanSmartOJView] 使用任务内提交接口:', submitUrl, {
        taskId,
        planId
      })

      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
  
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text()
        let errorMessage = `HTTP error! status: ${submitResponse.status}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          console.error('无法解析错误响应:', errorText)
        }
        throw new Error(errorMessage)
      }
  
      const submitData = await submitResponse.json()
      console.log('提交响应:', submitData)
      
      if (!submitData.success) {
        throw new Error(submitData.error || '提交失败')
      }
      
      const submissionId = submitData.submission_id
      console.log('提交成功，submission_id:', submissionId)
      
      // 辅助函数：处理判题结果
      const processSubmissionResult = (submission: any) => {
        // 根据 verdict 设置提交状态
        let status = 'wrong_answer'
        let statusText = '✗ 错误'
        
        if (submission.verdict === 'Accepted') {
          status = 'accepted'
          statusText = '✓ 通过'
        } else if (submission.verdict === 'Wrong Answer') {
          status = 'wrong_answer'
          statusText = '✗ 答案错误'
        } else if (submission.verdict === 'Time Limit Exceeded') {
          status = 'time_limit_exceeded'
          statusText = '⏱ 超时'
        } else if (submission.verdict === 'Memory Limit Exceeded') {
          status = 'memory_limit_exceeded'
          statusText = '💾 超内存'
        } else if (submission.verdict === 'Runtime Error') {
          status = 'runtime_error'
          statusText = '❌ 运行错误'
        } else if (submission.verdict === 'Compilation Error') {
          status = 'compile_error'
          statusText = '🔧 编译错误'
        }
        
        // 设置提交结果
        submitResult.value = {
          status: status,
          statusText: statusText,
          verdict: submission.verdict,
          passedTests: submission.passed_tests || 0,
          totalTests: submission.total_tests || 0,
          results: submission.results || [],
          runtime: submission.judge_duration || 0,
          memory: 0,
        }
        
        // 更新题目提交状态
        currentProblem.value.submitStatus = status
        
        // 如果 AC 了，触发烟花效果和返回确认弹窗，并清除代码缓存
        if (submission.verdict === 'Accepted') {
          // 清除代码缓存，下次进入时编辑器为空
          clearCachedCode(problemId as string)
          triggerFireworks()
          // 延迟显示返回确认弹窗，让用户先看到烟花效果
          setTimeout(() => {
            showReturnConfirmDialog.value = true
          }, 1500)
        }
      }
      
      // 检查提交响应中是否已经包含了判题结果（后端可能立即返回结果）
      // 支持多种响应格式：submitData.data 或 submitData 根级别
      const submissionResult = submitData.data || submitData
      if (submissionResult && (submissionResult.status === 'completed' || submissionResult.verdict)) {
        console.log('提交响应中已包含判题结果:', submissionResult)
        // 如果状态不是completed但有verdict，也认为已完成
        if (submissionResult.status !== 'completed' && submissionResult.verdict) {
          submissionResult.status = 'completed'
        }
        if (submissionResult.status === 'completed') {
          processSubmissionResult(submissionResult)
          return
        }
      }
      
      // 如果提交响应中没有结果，开始轮询判题结果
      isJudging.value = true
      
      // 立即查询一次，不等待
      for (let i = 0; i < 60; i++) {
        // 第一次查询不等待，后续查询等待1秒
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        console.log(`第 ${i + 1} 次查询判题结果...`)
        
        try {
          const queryResponse = await apiRequestWithFallback(`/api/oj/submissions/${submissionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (!queryResponse.ok) {
            console.warn('查询判题结果失败，继续重试...')
            // 如果是第一次查询失败，等待一下再继续
            if (i === 0) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            continue
          }
          
          const queryData = await queryResponse.json()
          console.log('判题结果:', queryData)
          
          if (!queryData.success) {
            // 如果查询失败但不是第一次，继续重试
            if (i > 0) {
              continue
            }
            throw new Error(queryData.error || '查询判题结果失败')
          }
          
          const submission = queryData.data
          
          // 判题完成
          if (submission.status === 'completed') {
            console.log('判题完成:', submission)
            processSubmissionResult(submission)
            return
          }
          
          // 判题出错
          if (submission.status === 'error') {
            throw new Error(submission.error_message || '判题出错')
          }
          
          // 继续等待判题
          console.log(`判题状态: ${submission.status}，继续等待...`)
        } catch (queryError) {
          console.error('查询判题结果出错:', queryError)
          // 如果是第一次查询出错，等待一下再继续
          if (i === 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
          // 后续查询出错，继续重试
          continue
        }
      }
      
      // 超时
      throw new Error('判题超时，请稍后在提交记录中查看结果')
      
    } catch (error) {
      console.error('提交代码失败:', error)
      // 显示错误信息
      submitResult.value = {
        status: 'runtime_error',
        statusText: '❌ 提交失败',
        verdict: 'Error',
        passedTests: 0,
        totalTests: 0,
        results: [],
        runtime: 0,
        memory: 0,
        error: error instanceof Error ? error.message : '提交失败，请稍后重试',
      }
    } finally {
      isSubmitting.value = false
      isJudging.value = false
      // 提交完成后开始倒计时
      lastSubmitTime.value = Date.now()
      updateCooldowns()
    }
  }

  const getSubmitStatusClass = (status: string) => {
    const map: Record<string, string> = {
      not_submitted: 'status-not-submitted',
      accepted: 'status-success',
      wrong_answer: 'status-error',
      time_limit_exceeded: 'status-warning',
      memory_limit_exceeded: 'status-warning',
      runtime_error: 'status-error',
      compile_error: 'status-error',
      partially_accepted: 'status-partial',
    }
    return map[status] || 'status-not-submitted'
  }
  
  const getSubmitStatusText = (status: string) => {
    const map: Record<string, string> = {
      not_submitted: '未提交',
      accepted: 'AC',
      wrong_answer: 'WA',
      time_limit_exceeded: 'TLE',
      memory_limit_exceeded: 'MLE',
      runtime_error: 'RE',
      compile_error: 'CE',
      partially_accepted: 'PAC',
    }
    return map[status] || '未提交'
  }
  
  // 返回上一页
  const goBack = () => {
    window.history.back()
  }

  // 关闭运行结果弹窗
  const closeTestResult = () => {
    testResult.value = null
  }
  
  // 关闭提交结果弹窗
  const closeSubmitResult = () => {
    submitResult.value = null
  }
  
  // 处理 NavBar 触发的退出请求（直接退出，无需确认）
  const handleExitOJRequest = () => {
    // 如果是从任务页面进入的，返回到任务页面并激活编程题标签
    const hasValidTaskParams = fromTaskView && planId && planId.trim() !== '' && taskId && taskId.trim() !== ''
    if (hasValidTaskParams) {
      console.log('✅ [PlanSmartOJView] 从任务页面退出，返回到任务页面（编程题标签）', { planId, taskId })
      router.push(`/plan/${planId}/tasks/${taskId}?tab=programming`)
    } else if (fromPlan) {
      console.log('✅ [PlanSmartOJView] 从计划页面退出，返回到计划页面')
      router.push('/plan')
    } else {
      // 其他情况，返回到上一页
      console.log('⚠️ [PlanSmartOJView] 返回到上一页', { fromTaskView, fromPlan, planId, taskId })
      window.history.back()
    }
  }
  
  // 触发烟花效果
  const triggerFireworks = () => {
    showFireworks.value = true
    // 3秒后自动关闭烟花效果
    setTimeout(() => {
      showFireworks.value = false
    }, 3000)
  }
  
  // 触发火箭发射特效
  const triggerRocketLaunch = () => {
    showRocketLaunch.value = true
    // 2秒后自动关闭火箭特效
    setTimeout(() => {
      showRocketLaunch.value = false
    }, 2000)
  }
  
  // 生成粒子样式
  const getParticleStyle = (index: number) => {
    const angle = (360 / 15) * index
    const distance = 30 + Math.random() * 20
    const x = Math.cos((angle * Math.PI) / 180) * distance
    const y = Math.sin((angle * Math.PI) / 180) * distance
    const delay = Math.random() * 0.3
    const duration = 0.8 + Math.random() * 0.4
    
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }
  }
  
  // 确认返回
  const confirmReturn = () => {
    showReturnConfirmDialog.value = false
    // 如果是从任务页面进入的，返回到任务页面并激活编程题标签
    const hasValidTaskParams = fromTaskView && planId && planId.trim() !== '' && taskId && taskId.trim() !== ''
    if (hasValidTaskParams) {
      console.log('✅ [SmartOJView] 从任务页面进入，返回到任务页面（编程题标签）', { planId, taskId })
      router.push(`/plan/${planId}/tasks/${taskId}?tab=programming`)
    } else if (fromPlan) {
      console.log('✅ [SmartOJView] 从计划页面进入，返回到计划页面')
      router.push('/plan')
    } else {
      // 其他情况，返回到上一页
      console.log('⚠️ [SmartOJView] 返回到上一页', { fromTaskView, fromPlan, planId, taskId })
      window.history.back()
    }
  }
  
  // 取消返回
  const cancelReturn = () => {
    showReturnConfirmDialog.value = false
  }
  
  // 生成烟花样式
  const getFireworkStyle = (index: number) => {
    const angle = (360 / 20) * index
    const distance = 200 + Math.random() * 100
    const x = Math.cos((angle * Math.PI) / 180) * distance
    const y = Math.sin((angle * Math.PI) / 180) * distance
    const delay = Math.random() * 0.5
    const duration = 1 + Math.random() * 0.5
    
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }
  }
  
  // 提交OJ答题（预留接口）
  const submitOJAnswers = async () => {
    // TODO: 实现OJ答题提交接口
    console.log('提交OJ答题（接口待实现）')
    isSubmittingOJ.value = true
    
    try {
      // 这里预留提交接口的调用
      // const response = await fetch(`${BASE_URL}/oj/submit-answers`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     problem_id: parseInt(problemId as string),
      //     // 其他提交数据
      //   })
      // })
      
      // 暂时使用 alert 提示
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('提交功能接口待实现')
    } catch (error) {
      console.error('提交OJ答题失败:', error)
      alert('提交失败，请稍后重试')
    } finally {
      isSubmittingOJ.value = false
    }
  }
  
  // 点击编辑器区域时聚焦编辑器
  const focusEditor = () => {
    if (editorView) {
      editorView.focus()
    }
  }
  
  // 更新字体大小
  const updateFontSize = () => {
    // 保存字体大小到 localStorage
    try {
      localStorage.setItem('oj_editor_font_size', fontSize.value.toString())
    } catch (error) {
      console.error('保存字体大小失败:', error)
    }
    
    // 通过 CSS 变量更新编辑器字体大小
    const editorElement = editorContainer.value
    if (editorElement) {
      editorElement.style.setProperty('--editor-font-size', fontSize.value + 'px')
    }
    
    // 更新编辑器内容区域的字体大小
    if (editorView) {
      const editorDom = editorView.dom
      if (editorDom) {
        editorDom.style.fontSize = fontSize.value + 'px'
        const content = editorDom.querySelector('.cm-content')
        if (content) {
          (content as HTMLElement).style.fontSize = fontSize.value + 'px'
        }
        const gutters = editorDom.querySelector('.cm-gutters')
        if (gutters) {
          (gutters as HTMLElement).style.fontSize = fontSize.value + 'px'
        }
      }
    }
    
    if (expandedEditorView) {
      const editorDom = expandedEditorView.dom
      if (editorDom) {
        editorDom.style.fontSize = fontSize.value + 'px'
        const content = editorDom.querySelector('.cm-content')
        if (content) {
          (content as HTMLElement).style.fontSize = fontSize.value + 'px'
        }
        const gutters = editorDom.querySelector('.cm-gutters')
        if (gutters) {
          (gutters as HTMLElement).style.fontSize = fontSize.value + 'px'
        }
      }
    }
  }
  
  // 从 localStorage 加载字体大小
  const loadFontSize = () => {
    try {
      const savedSize = localStorage.getItem('oj_editor_font_size')
      if (savedSize) {
        fontSize.value = parseInt(savedSize, 10)
      }
    } catch (error) {
      console.error('加载字体大小失败:', error)
    }
  }
  
  // 自定义天蓝色主题
  const customTheme = EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'transparent',
      },
      '&.cm-editor.cm-focused': {
        outline: 'none !important',
      },
      '.cm-content': {
        fontFamily: "'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
        padding: '20px',
        caretColor: '#0c4a6e',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: "'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
        borderRight: '2px solid #bae6fd',
        color: '#64748b',
        fontWeight: '500',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px',
        minWidth: '50px',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },
      '.cm-line': {
        padding: '0',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(30, 144, 255, 0.2) !important',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(30, 144, 255, 0.3) !important',
      },
      '.cm-cursor': {
        borderLeftColor: '#0c4a6e',
        borderLeftWidth: '2px',
      },
      '.cm-matchingBracket': {
        backgroundColor: 'rgba(30, 144, 255, 0.2)',
        outline: '1px solid rgba(30, 144, 255, 0.5)',
      },
      '.cm-nonmatchingBracket': {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
      },
    },
    { dark: false },
  )
  
  // 语法高亮主题 - 天蓝色配色
  const myHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: '#dc2626', fontWeight: '700' },
    { tag: tags.string, color: '#059669', fontWeight: '500' },
    { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
    { tag: tags.number, color: '#7c3aed', fontWeight: '600' },
    { tag: tags.operator, color: '#0c4a6e', fontWeight: '600' },
    { tag: tags.punctuation, color: '#0c4a6e' },
    { tag: tags.variableName, color: '#0c4a6e' },
    { tag: tags.typeName, color: '#0891b2', fontWeight: '600' },
    { tag: tags.function(tags.variableName), color: '#0284c7', fontWeight: '600' },
    { tag: tags.className, color: '#0284c7', fontWeight: '700' },
    { tag: tags.namespace, color: '#7c3aed', fontWeight: '600' },
    { tag: tags.propertyName, color: '#0c4a6e' },
    { tag: tags.meta, color: '#9333ea', fontWeight: '500' },
    { tag: tags.bool, color: '#7c3aed', fontWeight: '600' },
    { tag: tags.null, color: '#7c3aed', fontWeight: '600' },
    { tag: tags.definition(tags.variableName), color: '#0c4a6e', fontWeight: '600' },
    { tag: tags.definition(tags.function(tags.variableName)), color: '#0284c7', fontWeight: '700' },
  ])
  
  // 补充样式主题
  const additionalTheme = EditorView.baseTheme({
    '.cm-content': {
      color: '#0c4a6e',
    },
  })
  
  // 初始化 CodeMirror 编辑器
  const initEditor = () => {
    if (!editorContainer.value) return
  
    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        cmLineNumbers(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        cpp(),
        syntaxHighlighting(myHighlightStyle),
        customTheme,
        additionalTheme,
        indentUnit.of('    '), // 4个空格缩进
        EditorState.tabSize.of(4),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        EditorView.lineWrapping,
        // 监听内容变化，自动保存到缓存
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const code = update.state.doc.toString()
            saveCodeToCache(problemId as string, code)
          }
        }),
        // 确保编辑器可以获得焦点并显示光标
        EditorView.theme({
          '.cm-editor': {
            cursor: 'text',
          },
          '.cm-content': {
            cursor: 'text',
            minHeight: '100%',
          },
          '.cm-focused': {
            cursor: 'text',
          },
          '.cm-line': {
            minHeight: '1.5em',
          },
          '.cm-cursor': {
            display: 'block !important',
            visibility: 'visible !important',
          },
        }),
      ],
    })
  
    editorView = new EditorView({
      state: startState,
      parent: editorContainer.value,
    })
  
    // 应用字体大小
    updateFontSize()
  
    // 确保编辑器在挂载后立即获得焦点并显示光标
    setTimeout(() => {
      if (editorView) {
        editorView.focus()
        // 设置光标到文档开始位置
        editorView.dispatch({
          selection: { anchor: 0, head: 0 }
        })
      }
    }, 100)
  }
  
  // 切换语言
  const handleLanguageChange = () => {
    console.log('语言切换到:', selectedLanguage.value)
  }
  
  // 拖动分隔条开始
  const startDrag = (e: MouseEvent) => {
    isDragging = true
    startX = e.clientX
    startLeftWidth = leftPanelWidth.value
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }
  
  // 拖动过程中
  const onDrag = (e: MouseEvent) => {
    if (!isDragging) return
  
    const container = document.querySelector('.question-content-unified')
    if (!container) return
  
    const containerWidth = container.clientWidth
    const deltaX = e.clientX - startX
    const deltaPercent = (deltaX / containerWidth) * 100
  
    let newWidth = startLeftWidth + deltaPercent
  
    // 限制宽度范围在 20% - 80% 之间
    newWidth = Math.max(20, Math.min(80, newWidth))
  
    leftPanelWidth.value = newWidth
  }
  
  // 停止拖动
  const stopDrag = () => {
    isDragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }
  
  // 切换编辑器展开状态
  const toggleEditorExpand = () => {
    isEditorExpanded.value = !isEditorExpanded.value
  
    if (isEditorExpanded.value) {
      // 展开时，初始化展开的编辑器
      setTimeout(() => {
        initExpandedEditor()
      }, 100)
    } else {
      // 收起时，销毁展开的编辑器并同步代码到主编辑器
      if (expandedEditorView) {
        const code = expandedEditorView.state.doc.toString()
        if (editorView) {
          editorView.dispatch({
            changes: {
              from: 0,
              to: editorView.state.doc.length,
              insert: code,
            },
          })
        }
        expandedEditorView.destroy()
        expandedEditorView = null
      }
    }
  }
  
  // 初始化展开的编辑器
  const initExpandedEditor = () => {
    if (!expandedEditorContainer.value) return
  
    // 获取当前代码
    const currentCode = editorView?.state.doc.toString() || initialCode
  
    const startState = EditorState.create({
      doc: currentCode,
      extensions: [
        cmLineNumbers(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        cpp(),
        syntaxHighlighting(myHighlightStyle),
        customTheme,
        additionalTheme,
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        EditorView.lineWrapping,
        // 监听内容变化，自动保存到缓存
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const code = update.state.doc.toString()
            saveCodeToCache(problemId as string, code)
          }
        }),
        // 确保展开编辑器也可以获得焦点并显示光标
        EditorView.theme({
          '.cm-editor': {
            cursor: 'text',
          },
          '.cm-content': {
            cursor: 'text',
            minHeight: '100%',
          },
          '.cm-focused': {
            cursor: 'text',
          },
          '.cm-line': {
            minHeight: '1.5em',
          },
          '.cm-cursor': {
            display: 'block !important',
            visibility: 'visible !important',
          },
        }),
      ],
    })
  
    expandedEditorView = new EditorView({
      state: startState,
      parent: expandedEditorContainer.value,
    })
  
    // 应用字体大小
    updateFontSize()
  
    // 展开编辑器也立即获得焦点并显示光标
    setTimeout(() => {
      if (expandedEditorView) {
        expandedEditorView.focus()
        // 设置光标到文档开始位置
        expandedEditorView.dispatch({
          selection: { anchor: 0, head: 0 }
        })
      }
    }, 100)
  }
  
  let practiceTimerIntervalId: ReturnType<typeof setInterval> | null = null
  
  // 组件挂载时初始化编辑器
  onMounted(() => {
    loadFontSize()
    fetchProblemDetail()
    initEditor()
    // 每秒更新练习计时器显示
    practiceTimerIntervalId = setInterval(updatePracticeTimerDisplay, 1000)
    // 重置滚动位置到顶部
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    // 启动冷却时间定时器
    startCooldownTimer()
    // 监听 NavBar 触发的退出请求
    window.addEventListener('exitOJRequest', handleExitOJRequest)
    // 初始化字体大小
    setTimeout(() => {
      updateFontSize()
    }, 200)
  })
  
  // 组件卸载时清理编辑器和事件监听器
  onUnmounted(() => {
    if (practiceTimerIntervalId) {
      clearInterval(practiceTimerIntervalId)
      practiceTimerIntervalId = null
    }
    if (editorView) {
      editorView.destroy()
    }
    if (expandedEditorView) {
      expandedEditorView.destroy()
    }
    // 清理拖动事件监听器
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    // 清理冷却时间定时器
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
    // 移除退出事件监听器
    window.removeEventListener('exitOJRequest', handleExitOJRequest)
  })
  </script>
  
  <style scoped>
  /* 全页面加载界面样式 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 50%, #06b6d4 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: loadingFadeIn 0.5s ease-out;
  }

  @keyframes loadingFadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    text-align: center;
    color: white;
  }

  .loading-spinner {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .spinner-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 4px solid transparent;
    border-top: 4px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: spin 1.5s linear infinite;
  }

  .spinner-ring:nth-child(1) {
    animation-delay: 0s;
    border-top-color: rgba(255, 255, 255, 0.9);
  }

  .spinner-ring:nth-child(2) {
    animation-delay: 0.3s;
    border-top-color: rgba(255, 255, 255, 0.7);
    transform: scale(0.8);
  }

  .spinner-ring:nth-child(3) {
    animation-delay: 0.6s;
    border-top-color: rgba(255, 255, 255, 0.5);
    transform: scale(0.6);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-text h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    animation: textPulse 2s ease-in-out infinite;
  }

  .loading-text p {
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0;
    opacity: 0.9;
    animation: textFade 3s ease-in-out infinite;
  }

  @keyframes textPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  @keyframes textFade {
    0%, 100% {
      opacity: 0.9;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* 基础布局 */
  .exam-layout {
    min-height: 100vh;
    width: 100vw;
    background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
    padding: 0;
    margin: 0;
    margin-top: 0;
    padding-top: 0;
    display: flex;
    flex-direction: column;
    font-family:
      'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    position: relative;
    top: 0;
  }
  
  /* 考试头部 */
  .exam-header {
    background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
    padding: 12px 20px;
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    z-index: 999;
    backdrop-filter: blur(10px);
    background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    min-height: 60px;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    position: relative;
    padding: 0 20px;
  }
  
  .header-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }
  
  /* 退出练习按钮样式 */
  .exit-practice-btn {
    background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
    color: #2c5282;
    border: none;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    padding: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(135, 206, 235, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    position: relative;
    overflow: hidden;
  }
  
  .exit-practice-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
  }
  
  .exit-practice-btn:hover::before {
    left: 100%;
  }
  
  .exit-practice-btn:hover {
    background: linear-gradient(135deg, #b0e0e6 0%, #87ceeb 100%);
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 6px 16px rgba(135, 206, 235, 0.35);
  }
  
  .exit-practice-btn:active {
    transform: translateY(0) scale(0.95);
    box-shadow: 0 2px 8px rgba(135, 206, 235, 0.3);
  }
  
  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 300px;
  }
  
  .header-right {
    position: absolute;
    right: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 24px;
  }
  
  /* 头部提交按钮样式 */
  .submit-btn-header {
    padding: 8px 18px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(30,144,255,0.2);
    transition: all 0.3s ease;
    margin-left: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .submit-btn-header:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(30,144,255,0.3);
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  }
  
  .submit-btn-header:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* 头部内容 */
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    position: relative;
  }
  
  /* 头部左侧 */
  .header-left {
    position: absolute;
    left: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }
  
  /* 退出练习按钮 */
  .exit-practice-btn {
    background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
    color: #2c5282;
    border: none;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    padding: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(135, 206, 235, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
  }
  
  .exit-practice-btn:hover {
    background: linear-gradient(135deg, #b0e0e6 0%, #87ceeb 100%);
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 6px 16px rgba(135, 206, 235, 0.35);
  }
  
  /* 头部中间 */
  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 300px;
  }
  
  .header-center-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 800px;
  }
  
  /* 头部右侧 */
  .header-right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 24px;
  }
  
  /* 进度信息 */
  .progress-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    margin: 0;
    min-width: 90px;
  }
  
  .progress-info span {
    font-size: 11px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .progress-bar {
    width: 90px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(30, 144, 255, 0.08);
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e90ff 60%, #38bdf8 100%);
    border-radius: 4px;
    transition: width 0.3s;
  }
  
  /* 考试内容区域 - 横向flex布局 */
  .exam-content-flex-row {
    display: flex;
    flex-direction: row;
    gap: 32px;
    width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
    flex-shrink: 0;
    align-items: flex-start;
    justify-content: center;
    margin-top: 10px; /* 缩小与NavBar的距离 */
  }
  
  /* 复习模式容器 */
  .mode-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .review-mode-container {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    padding: 8px 18px;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .review-mode-text {
    margin: 0;
    color: #2c5282;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    position: relative;
    z-index: 1;
  }
  
  /* 退出确认弹窗样式 */
  .exit-confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
  }
  
  .exit-confirm-modal-content {
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 450px;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  
  .exit-confirm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .exit-confirm-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }
  
  .exit-confirm-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.8rem;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .exit-confirm-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .exit-confirm-body {
    padding: 24px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  
  .exit-confirm-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  .exit-confirm-message {
    margin: 0 0 20px 0;
    color: #374151;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .exit-confirm-warning {
    color: #ef4444;
    font-weight: 600;
    font-size: 14px;
  }
  
  .exit-confirm-footer {
    display: flex;
    justify-content: center;
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(239,68,68,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  
  .btn-danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.3);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
  }
  
  /* 题目卡片头部样式 - 与GESPEaxmView保持一致 */
  .question-card-header {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    padding: 7px 20px;
    border-bottom: 3px solid #e0f2fe;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
    gap: 16px;
    margin-top: 0;
  }
  
  .question-card-header .exit-practice-btn {
    background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
    color: #2c5282;
    border: none;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    padding: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(135, 206, 235, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    position: relative;
    overflow: hidden;
  }
  
  .question-card-header .exit-practice-btn:hover {
    background: linear-gradient(135deg, #b0e0e6 0%, #87ceeb 100%);
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 6px 16px rgba(135, 206, 235, 0.35);
  }
  
  .question-card-header .header-buttons {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 0 0 auto;
    z-index: 1;
  }
  
  .question-card-header .header-buttons .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
    min-width: 120px;
  }
  
  /* 头部字体大小调整控件 */
  .font-size-control-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }
  
  .font-size-control-header:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .font-size-control-header .lucide-icon {
    color: white;
    flex-shrink: 0;
  }
  
  .font-size-slider-header {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  
  .font-size-slider-header::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .font-size-slider-header::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }
  
  .font-size-slider-header::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .font-size-slider-header::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }
  
  .font-size-value-header {
    font-size: 11px;
    font-weight: 700;
    color: white;
    min-width: 32px;
    text-align: center;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .question-card-header .submit-btn-header {
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 8px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #1e90ff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: auto;
    max-width: 120px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .question-card-header .submit-btn-header:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  }
  
  .question-card-header .submit-btn-header:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* 题目标题样式 - 与GESPEaxmView保持一致 */
  .question-card-header .question-title-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
    z-index: 1;
  }
  
  .question-card-header .question-title {
    margin: 0;
    color: white;
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }
  
  .question-card-header .level-badge {
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
    color: white;
    padding: 6px 14px;
    border-radius: 18px;
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
  
  .question-card-header .question-date {
    font-size: 0.9rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
    padding: 6px 14px;
    border-radius: 18px;
    box-shadow: 0 4px 12px rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .question-card-header .question-date i {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.9);
  }
  
  /* 提交模式状态徽章样式 */
  .submission-mode-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 18px;
    font-weight: 700;
    font-size: 0.85rem;
    box-shadow: 0 4px 12px rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
    margin-left: 8px;
  }
  
  .submission-mode-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255,255,255,0.3);
  }
  
  /* 任务内提交徽章 - 橙色主题（更醒目） */
  .task-submission-badge {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    border-color: rgba(245, 158, 11, 0.6);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
    animation: taskBadgePulse 2s ease-in-out infinite;
  }
  
  @keyframes taskBadgePulse {
    0%, 100% {
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
      transform: scale(1.02);
    }
  }
  
  .task-submission-badge :deep(.lucide-icon) {
    color: white;
  }
  
  /* 本次练习计时器（计划标签后） */
  .practice-timer-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 18px;
    font-weight: 600;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    border: 1px solid rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(10px);
    flex-shrink: 0;
  }
  .practice-timer-badge :deep(.lucide-icon) {
    color: white;
  }
  
  .level-exams-container {
    width: 100vw;
    min-height: 100vh;
    background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    font-family:
      'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    overflow-x: hidden;
  }
  
  .level-exams-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.1);
    position: fixed;
    top: 48px; /* NavBar 的高度 */
    left: 0;
    right: 0;
    z-index: 999;
    backdrop-filter: blur(10px);
    background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    width: 100%;
    gap: 16px;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  
  .level-exams-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.4rem;
    font-weight: 700;
    text-align: center;
  }
  
  .exam-count {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .header-left h2 {
    margin: 0;
    color: #1e293b;
    font-weight: 700;
    font-size: 1.8rem;
    letter-spacing: 0.01em;
    font-family:
      'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    text-align: left;
    line-height: 1.3;
    position: relative;
    padding-left: 0;
    margin-left: 0;
  }
  
  .exam-count {
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }
  
  .level-exams-content {
    flex: 1;
    padding: 24px 32px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin-top: 96px; /* 为固定的header留出空间：48px(NavBar) + 48px(header) */
  }
  
  /* OJ 布局 */
  .oj-layout {
    display: flex;
    gap: 24px;
    height: 100%;
    width: 100%;
    min-width: 0;
  }
  
  /* 左侧题目区域 */
  .problem-section {
    width: 50%;
    min-width: 0;
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .problem-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(30, 144, 255, 0.1);
    border: 2px solid #e2e8f0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
  
  .problem-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    background: linear-gradient(135deg, #87ceeb 0%, #b6e0fe 100%);
    border-bottom: 2px solid #e2e8f0;
  }
  
  .problem-title {
    margin: 0;
    color: #1e293b;
    font-size: 24px;
    font-weight: 700;
  }
  
  .difficulty-badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .difficulty-easy {
    background: #d1fae5;
    color: #065f46;
  }
  
  .difficulty-medium {
    background: #fed7aa;
    color: #92400e;
  }
  
  .difficulty-hard {
    background: #fecaca;
    color: #991b1b;
  }
  
  .problem-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 28px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* 小标题区域 */
  .section-header {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    padding: 16px 24px;
    margin: -2px -2px 0 -2px;
    border-bottom: 2px solid #e0f2fe;
    position: sticky;
    top: 0;
    z-index: 5;
    backdrop-filter: blur(10px);
  }
  
  .section-title {
    margin: 0;
    color: white;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.3px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .problem-content h4 {
    margin: 0 0 12px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
  }
  
  .problem-description,
  .problem-io,
  .problem-samples,
  .problem-constraints {
    width: 100%;
    overflow: visible;
    box-sizing: border-box;
  }
  
  .problem-description p,
  .problem-io p {
    margin: 0 0 14px 0;
    color: #475569;
    font-size: 15px;
    line-height: 1.8;
    word-break: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
  }
  
  .problem-description p:last-child,
  .problem-io p:last-child {
    margin-bottom: 0;
  }
  
  .sample-item {
    margin-bottom: 20px;
    padding: 18px;
    background: #f8fafc;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: visible;
    box-sizing: border-box;
  }
  
  .sample-item:last-child {
    margin-bottom: 0;
  }
  
  .sample-block {
    margin-bottom: 14px;
    overflow: visible;
  }
  
  .sample-block:last-child {
    margin-bottom: 0;
  }
  
  .sample-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
  }
  
  .sample-code {
    margin: 0;
    padding: 14px 18px;
    background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
    border: 1px solid #bae6fd;
    border-radius: 10px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.7;
    color: #0c4a6e;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    overflow: visible;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .sample-explanation {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    overflow: visible;
  }
  
  .sample-explanation p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
    overflow: visible;
  }
  
  .problem-constraints ul {
    margin: 0;
    padding-left: 28px;
    color: #475569;
    font-size: 15px;
    line-height: 1.8;
    list-style-type: disc;
  }
  
  .problem-constraints li {
    margin-bottom: 12px;
    word-break: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
    padding-left: 8px;
  }
  
  .problem-constraints li:last-child {
    margin-bottom: 0;
  }
  
  /* 右侧编辑器区域 */
  .editor-section {
    width: 50%;
    min-width: 0;
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
  }
  
  .editor-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(30, 144, 255, 0.1);
    border: 2px solid #e2e8f0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #87ceeb 0%, #b6e0fe 100%);
    border-bottom: 2px solid #e2e8f0;
  }
  
  .header-title {
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .expand-btn {
    padding: 8px 12px;
    border: 2px solid #bae6fd;
    border-radius: 10px;
    background: white;
    color: #1e90ff;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .expand-btn:hover {
    border-color: #1e90ff;
    background: #e0f2fe;
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }
  
  .expand-btn i {
    transition: transform 0.3s ease;
  }
  
  .expand-btn:hover i {
    transform: rotate(15deg);
  }
  
  .language-selector {
    padding: 8px 16px;
    border: 2px solid #bae6fd;
    border-radius: 10px;
    background: white;
    color: #1e293b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .language-selector:hover {
    border-color: #1e90ff;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }
  
  .language-selector:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }
  
  
  /* CodeMirror 编辑器容器 */
  .code-editor-wrapper {
    flex: 1;
    overflow: hidden;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    display: flex;
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
    position: relative;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    box-sizing: border-box;
    min-height: 0;
  }
  
  /* CodeMirror 全局样式调整 */
  .code-editor-wrapper :deep(.cm-editor) {
    height: 100%;
    background: transparent;
    outline: none !important;
    display: flex !important;
    flex-direction: column !important;
    cursor: text !important;
    flex: 1 !important;
  }
  
  .code-editor-wrapper :deep(.cm-editor.cm-focused) {
    outline: none !important;
    cursor: text !important;
  }
  
  .code-editor-wrapper :deep(.cm-scroller) {
    overflow: auto !important;
    outline: none !important;
    flex: 1 !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    cursor: text !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  .code-editor-wrapper :deep(.cm-content) {
    outline: none !important;
    cursor: text !important;
    min-height: 100% !important;
    padding: 20px !important;
  }
  
  /* 确保空白编辑器也能显示光标 */
  .code-editor-wrapper :deep(.cm-line) {
    min-height: 1.5em !important;
  }
  
  .code-editor-wrapper :deep(.cm-editor.cm-focused .cm-cursor) {
    display: block !important;
    visibility: visible !important;
  }
  
  /* 空白状态下的光标显示 */
  .code-editor-wrapper :deep(.cm-editor .cm-cursor) {
    display: block !important;
    visibility: visible !important;
  }
  
  .code-editor-wrapper :deep(.cm-gutters) {
    position: relative !important;
    z-index: 1 !important;
    cursor: text !important;
  }
  
  .code-editor-wrapper :deep(.cm-cursor) {
    border-left: 2px solid #0c4a6e !important;
    border-left-width: 2px !important;
  }
  
  
  .editor-actions {
    display: flex;
    gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-top: none;
    border-radius: 0 0 16px 16px;
  }
  
  /* 固定的按钮区域 */
  .editor-actions-fixed {
    display: flex;
    gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-top: 2px solid #e2e8f0;
    border-radius: 0 0 16px 16px;
    flex-shrink: 0;
    box-shadow: 0 -4px 12px rgba(30, 144, 255, 0.08);
    box-sizing: border-box;
  }
  
  .btn {
    flex: 1;
    padding: 14px 24px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s ease;
  }

  .btn-content i {
    font-size: 18px;
    transition: transform 0.3s ease;
  }

  .btn:not(:disabled):hover .btn-content i:not(.fa-spin) {
    transform: scale(1.2);
  }
  
  .btn:disabled {
    cursor: not-allowed;
  }

  .btn-loading {
    position: relative;
  }

  .btn-loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
  
  .btn-test {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }
  
  .btn-test:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  }

  .btn-test:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(30, 144, 255, 0.3);
  }

  .btn-test.btn-loading {
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
    box-shadow: 0 4px 16px rgba(30, 144, 255, 0.5);
  }
  
  .btn-submit {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
  }

  .btn-submit.btn-loading {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);
  }

  /* Loading spinner 旋转动画 */
  .fa-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  /* 结果面板 */
  .result-panel {
    margin: 20px 24px 0;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    overflow: hidden;
    background: white;
  }
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
  }
  
  .result-title {
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }
  
  .result-status {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }
  
  .status-success {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-error {
    background: #fecaca;
    color: #991b1b;
  }
  
  .status-warning {
    background: #fed7aa;
    color: #92400e;
  }
  
  .result-content {
    padding: 20px;
  }
  
  .result-item {
    margin-bottom: 16px;
  }
  
  .result-item:last-child {
    margin-bottom: 0;
  }
  
  .result-item.error {
    padding: 12px;
    background: #fef2f2;
    border-radius: 8px;
    border: 1px solid #fecaca;
  }
  
  .result-label {
    display: block;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .result-value {
    margin: 0;
    padding: 12px 16px;
    background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
    border: 1px solid #bae6fd;
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #0c4a6e;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  .result-item.error .result-value {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }
  
  .result-stats {
    display: flex;
    gap: 16px;
  }
  
  .stat-box {
    flex: 1;
    padding: 16px;
    background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    text-align: center;
  }
  
  .stat-box .stat-label {
    display: block;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: none;
    letter-spacing: normal;
  }
  
  .stat-box .stat-value {
    color: #0c4a6e;
    font-size: 24px;
    font-weight: 700;
  }

  .verdict-text {
    color: #1e90ff;
    font-size: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* 测试用例详情样式 */
  .test-cases-section {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 2px solid #e2e8f0;
  }

  .section-subtitle {
    margin: 0 0 20px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .test-case-item {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    background: #f8fafc;
    transition: all 0.3s ease;
  }

  .test-case-item.test-passed {
    border-color: #86efac;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  }

  .test-case-item.test-failed {
    border-color: #fca5a5;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  }

  .test-case-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .test-case-number {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
  }

  .test-case-status {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .status-pass {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }

  .status-fail {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  }

  .test-case-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .test-detail-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    margin: 0;
    padding: 10px 14px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #1e293b;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .output-error {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #991b1b;
  }

  .error-row .error-text {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .test-case-hidden {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }

  .test-case-hidden i {
    color: #94a3b8;
    font-size: 16px;
  }

  .hidden-result {
    margin-left: 4px;
    color: #475569;
    font-weight: 600;
  }
  
  /* Markdown 内容样式 */
  .markdown-content {
    line-height: 1.8;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    max-width: 100%;
    width: 100%;
    overflow: visible;
    box-sizing: border-box;
    font-size: 15px;
    color: #374151;
    word-break: break-word;
    white-space: normal;
  }

  /* Markdown 标题样式 */
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    margin: 24px 0 16px 0;
    color: #1e293b;
    font-weight: 700;
    line-height: 1.4;
    word-break: break-word;
  }

  .markdown-content h1 {
    font-size: 1.8em;
    border-bottom: 3px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .markdown-content h2 {
    font-size: 1.5em;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
  }

  .markdown-content h3 {
    font-size: 1.3em;
  }

  .markdown-content h4 {
    font-size: 1.2em;
  }

  .markdown-content h5 {
    font-size: 1.1em;
  }

  .markdown-content h6 {
    font-size: 1em;
    color: #64748b;
  }

  /* Markdown 段落样式 */
  .markdown-content p {
    margin: 0 0 16px 0;
    color: #374151;
    word-break: break-word;
    white-space: normal;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
    line-height: 1.8;
  }

  .markdown-content p:last-child {
    margin-bottom: 0;
  }

  /* Markdown 强调样式 */
  .markdown-content strong,
  .markdown-content b {
    color: #1e293b;
    font-weight: 700;
  }

  .markdown-content em,
  .markdown-content i {
    font-style: italic;
    color: #475569;
  }

  /* Markdown 删除线样式 */
  .markdown-content del,
  .markdown-content s {
    text-decoration: line-through;
    color: #94a3b8;
  }

  /* Markdown 内联代码样式 */
  .markdown-content code {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    color: #dc2626;
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9em;
    font-weight: 600;
    word-break: break-word;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    display: inline-block;
    max-width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
  }

  /* Markdown 代码块样式 */
  .markdown-content pre {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9em;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-word;
    hyphens: none;
    tab-size: 4;
    max-width: 100%;
    box-sizing: border-box;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .markdown-content pre code {
    background: none;
    color: #374151;
    padding: 0;
    border-radius: 0;
    border: none;
    font-size: inherit;
    font-weight: normal;
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Markdown 引用块样式 */
  .markdown-content blockquote {
    margin: 20px 0;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-left: 4px solid #1e90ff;
    border-radius: 0 8px 8px 0;
    color: #475569;
    font-style: italic;
    position: relative;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.1);
  }

  .markdown-content blockquote p {
    margin: 0;
    color: #475569;
  }

  .markdown-content blockquote p:not(:last-child) {
    margin-bottom: 12px;
  }

  /* Markdown 列表样式 */
  .markdown-content ul,
  .markdown-content ol {
    margin: 16px 0;
    padding-left: 32px;
    list-style-position: outside;
  }

  .markdown-content ul:last-child,
  .markdown-content ol:last-child {
    margin-bottom: 0;
  }

  .markdown-content ul {
    list-style-type: disc;
  }

  .markdown-content ol {
    list-style-type: decimal;
  }

  .markdown-content ul ul,
  .markdown-content ol ol,
  .markdown-content ul ol,
  .markdown-content ol ul {
    margin: 8px 0;
  }

  .markdown-content li {
    margin: 8px 0;
    color: #374151;
    word-break: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible;
    line-height: 1.8;
  }

  .markdown-content li:last-child {
    margin-bottom: 0;
  }

  /* Markdown 任务列表样式 */
  .markdown-content ul li input[type="checkbox"] {
    margin-right: 8px;
    transform: scale(1.2);
  }

  /* Markdown 表格样式 */
  .markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 2px solid #e2e8f0;
  }

  .markdown-content th,
  .markdown-content td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    word-break: break-word;
    vertical-align: top;
  }

  .markdown-content th {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 700;
    color: #1e293b;
    border-bottom: 2px solid #cbd5e1;
  }

  .markdown-content tr:last-child td {
    border-bottom: none;
  }

  .markdown-content tr:nth-child(even) {
    background: #f8fafc;
  }

  /* Markdown 分割线样式 */
  .markdown-content hr {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #e2e8f0 20%, #cbd5e1 50%, #e2e8f0 80%, transparent 100%);
    margin: 32px 0;
    border-radius: 1px;
  }

  /* Markdown 链接样式 */
  .markdown-content a {
    color: #1e90ff;
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .markdown-content a:hover {
    color: #0c7cd5;
    border-bottom-color: #0c7cd5;
    text-decoration: none;
  }

  /* Markdown 图片样式 */
  .markdown-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 16px 0;
    display: block;
  }

  /* Markdown 键盘按键样式 */
  .markdown-content kbd {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    color: #374151;
    display: inline-block;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9em;
    font-weight: 600;
    padding: 2px 6px;
    white-space: nowrap;
  }

  /* Markdown 标记高亮样式 */
  .markdown-content mark {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 600;
  }

  /* Markdown 脚注样式 */
  .markdown-content .footnote-ref {
    color: #1e90ff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9em;
    vertical-align: super;
  }

  .markdown-content .footnote-ref:hover {
    text-decoration: underline;
  }

  /* Markdown 定义列表样式 */
  .markdown-content dl {
    margin: 16px 0;
  }

  .markdown-content dt {
    font-weight: 700;
    color: #1e293b;
    margin-top: 16px;
  }

  .markdown-content dt:first-child {
    margin-top: 0;
  }

  .markdown-content dd {
    margin: 8px 0 8px 20px;
    color: #475569;
  }

  /* Markdown 任务列表样式 */
  .markdown-content ul li input[type="checkbox"] {
    margin-right: 8px;
    transform: scale(1.2);
    accent-color: #1e90ff;
  }

  .markdown-content ul li input[type="checkbox"]:checked {
    accent-color: #22c55e;
  }

  /* Markdown 嵌套列表样式 */
  .markdown-content ul ul,
  .markdown-content ol ol,
  .markdown-content ul ol,
  .markdown-content ol ul {
    margin: 4px 0;
  }

  .markdown-content ul ul li,
  .markdown-content ol ol li,
  .markdown-content ul ol li,
  .markdown-content ol ul li {
    margin: 4px 0;
  }

  /* Markdown 内联元素样式 */
  .markdown-content sub,
  .markdown-content sup {
    font-size: 0.8em;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  .markdown-content sub {
    bottom: -0.25em;
  }

  .markdown-content sup {
    top: -0.5em;
  }

  /* Markdown 小标题样式 */
  .markdown-content small {
    font-size: 0.875em;
    color: #64748b;
  }

  /* Markdown 大标题样式 */
  .markdown-content big {
    font-size: 1.25em;
    color: #1e293b;
  }

  /* Markdown 缩写样式 */
  .markdown-content abbr {
    border-bottom: 1px dotted #64748b;
    cursor: help;
    text-decoration: none;
  }

  .markdown-content abbr:hover {
    border-bottom-color: #1e90ff;
  }

  /* 数学公式样式 */
  .markdown-content .math-inline {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #bae6fd;
    display: inline-block;
    margin: 0 2px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .markdown-content .math-block {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 16px 20px;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    text-align: center;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .markdown-content .math-error {
    background: #fee2e2;
    color: #dc2626;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #fecaca;
    font-family: monospace;
    font-size: 0.9em;
  }

  /* KaTeX 样式覆盖 */
  .markdown-content .katex {
    font-size: 1.1em;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    display: inline-block;
  }

  .markdown-content .katex-display {
    margin: 20px 0;
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .markdown-content .katex-display .katex {
    font-size: 1.2em;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  /* 确保 KaTeX 元素能够正确换行 */
  .markdown-content .katex * {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    max-width: 100% !important;
  }

  /* 处理长数学公式的换行 */
  .markdown-content .katex .base {
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .markdown-content .katex .mord {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* 强制数学公式容器换行 */
  .markdown-content .math-inline,
  .markdown-content .math-block {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* 确保数学公式在窄容器中正确显示 */
  .markdown-content .katex {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    max-width: 100% !important;
  }

  /* 处理长数学表达式 */
  .markdown-content .katex .base {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  
  /* Highlight.js 样式 */
  .hljs {
    display: block;
    overflow-x: auto;
    padding: 0;
    background: transparent;
    color: #374151;
    border-radius: 0;
    font-size: inherit;
    line-height: inherit;
  }
  
  /* Markdown 目录样式 */
  .markdown-content .table-of-contents {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  }
  
  .markdown-content .table-of-contents h2 {
    margin-top: 0;
    font-size: 1.2em;
    color: #0f172a;
  }
  
  .markdown-content .table-of-contents ul {
    list-style-type: none;
    padding-left: 0;
  }
  
  .markdown-content .table-of-contents ul ul {
    padding-left: 20px;
  }
  
  .markdown-content .table-of-contents li {
    margin: 8px 0;
  }
  
  .markdown-content .table-of-contents a {
    color: #0ea5e9;
    text-decoration: none;
  }
  
  .markdown-content .table-of-contents a:hover {
    text-decoration: underline;
  }
  
  /* 锚点链接样式 */
  .header-anchor {
    opacity: 0;
    margin-left: 8px;
    font-size: 0.8em;
    text-decoration: none;
    color: #94a3b8;
    transition: opacity 0.2s;
  }
  
  h1:hover .header-anchor,
  h2:hover .header-anchor,
  h3:hover .header-anchor,
  h4:hover .header-anchor,
  h5:hover .header-anchor,
  h6:hover .header-anchor {
    opacity: 1;
  }
  
  .header-anchor:hover {
    color: #0ea5e9;
    text-decoration: none;
  }
  
  .hljs-comment,
  .hljs-quote {
    color: #64748b;
    font-style: italic;
  }
  
  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-subst {
    color: #dc2626;
    font-weight: 700;
  }
  
  .hljs-number,
  .hljs-literal,
  .hljs-variable,
  .hljs-template-variable,
  .hljs-tag .hljs-attr {
    color: #1e90ff;
    font-weight: 600;
  }
  
  .hljs-string,
  .hljs-doctag {
    color: #059669;
    font-weight: 500;
  }
  
  .hljs-title,
  .hljs-section,
  .hljs-selector-id {
    color: #7c3aed;
    font-weight: 700;
  }
  
  .hljs-subst {
    font-weight: normal;
  }
  
  .hljs-type,
  .hljs-class .hljs-title {
    color: #0ea5e9;
    font-weight: 700;
  }
  
  .hljs-tag,
  .hljs-name,
  .hljs-attribute {
    color: #1e90ff;
    font-weight: 600;
  }
  
  .hljs-regexp,
  .hljs-link {
    color: #059669;
  }
  
  .hljs-symbol,
  .hljs-bullet {
    color: #7c3aed;
  }
  
  .hljs-built_in,
  .hljs-builtin-name {
    color: #0ea5e9;
    font-weight: 600;
  }
  
  .hljs-meta {
    color: #64748b;
    font-weight: 600;
  }
  
  .hljs-deletion {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .hljs-addition {
    background: #dcfce7;
    color: #065f46;
  }
  
  .hljs-emphasis {
    font-style: italic;
  }
  
  .hljs-strong {
    font-weight: 700;
  }

  /* Markdown 渲染错误样式 */
  .render-error {
    color: #dc2626;
    background: #fee2e2;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #fecaca;
    margin: 16px 0;
  }
  
  
  /* 统一的内容滚动区域 - 左右分栏 */
  .question-content-unified {
    flex: 1;
    overflow: hidden;
    padding: 24px;
    display: flex;
    flex-direction: row;
    gap: 0;
    background: transparent;
    box-sizing: border-box;
    align-items: stretch;
    min-height: 0;
  }
  
  /* 左侧面板 - 题目内容 */
  .question-left-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: scroll !important;
    overflow-x: hidden !important;
    padding: 0 12px 0 0;
    transition: width 0.1s ease;
    height: 100%;
    width: 50%;
    box-sizing: border-box;
    /* 滚动条隐藏 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    /* Chrome滚动优化 */
    -webkit-overflow-scrolling: touch;
  }
  
  /* 编辑器工具栏 */
  .editor-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    border-radius: 16px 16px 0 0;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .expand-btn {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }
  
  .expand-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }
  
  .expand-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(30, 144, 255, 0.2);
  }
  
  .language-selector {
    padding: 8px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .language-selector:hover {
    border-color: #cbd5e1;
  }
  
  .language-selector:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }
  
  /* 右侧面板 - 代码编辑器 */
  .question-right-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-left: 8px;
    transition: width 0.1s ease;
    background: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
    height: 100%;
    width: 50%;
    box-sizing: border-box;
    gap: 0;
  }
  
  /* 可拖动的分隔条 */
  .panel-resizer {
    width: 8px;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
    background: transparent;
    z-index: 10;
    transition: all 0.2s ease;
  }
  
  .panel-resizer:hover {
    background: rgba(30, 144, 255, 0.1);
  }
  
  .resizer-line {
    width: 2px;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent 0%,
      #e0f2fe 10%,
      #bae6fd 50%,
      #e0f2fe 90%,
      transparent 100%
    );
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    transition: all 0.2s ease;
  }
  
  .panel-resizer:hover .resizer-line {
    background: linear-gradient(
      180deg,
      transparent 0%,
      #1e90ff 10%,
      #38bdf8 50%,
      #1e90ff 90%,
      transparent 100%
    );
    width: 3px;
  }
  
  .resizer-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    padding: 12px 6px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
    opacity: 0;
    transition: all 0.2s ease;
    pointer-events: none;
    font-size: 12px;
  }
  
  .panel-resizer:hover .resizer-handle {
    opacity: 1;
  }
  
  .panel-resizer:active .resizer-handle {
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.4);
  }
  
  /* 内容区域通用样式 */
  .content-section {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(30, 144, 255, 0.12);
    overflow: visible;
    border: 2px solid #e0f2fe;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: fit-content;
  }
  
  .section-content {
    padding: 24px;
    background: transparent;
    position: relative;
    z-index: 1;
    overflow: visible;
    word-wrap: break-word;
    overflow-wrap: break-word;
    min-height: fit-content;
  }
  
  /* 确保所有文本内容都能完整显示 */
  .section-content * {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    box-sizing: border-box;
  }
  
  /* 题目文本区域 */
  .question-text-section .section-content {
    padding: 24px;
  }
  
  /* 图片区域 */
  .images-section .section-content {
    padding: 24px;
  }
  
  /* 代码区域 */
  .code-section .section-content {
    padding: 24px;
  }
  
  /* 样例区域 */
  .problem-samples-section .section-content {
    padding: 24px;
  }
  
  /* 数据范围区域 */
  .problem-constraints-section .section-content {
    padding: 24px;
  }
  
  /* 左侧面板中的content-section */
  .question-left-panel .content-section {
    flex-shrink: 0;
    width: 100%;
    overflow: visible;
  }
  
  /* 右侧面板的代码编辑器区域占满高度 */
  .question-right-panel .code-editor-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  /* 隐藏滚动条但保留滚动功能 - Chrome兼容 */
  .question-left-panel::-webkit-scrollbar {
    width: 0px !important;
    height: 0px !important;
    background: transparent !important;
    display: none !important;
  }
  
  .question-left-panel::-webkit-scrollbar-thumb {
    background: transparent !important;
    display: none !important;
  }
  
  .question-left-panel::-webkit-scrollbar-track {
    background: transparent !important;
    display: none !important;
  }
  
  /* CodeMirror滚动条样式 - 隐藏但保留功能 - Chrome兼容 */
  .code-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar {
    width: 0px !important;
    height: 0px !important;
    background: transparent !important;
    display: none !important;
  }
  
  .code-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-track {
    background: transparent !important;
    display: none !important;
  }
  
  .code-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-thumb {
    background: transparent !important;
    display: none !important;
  }
  
  .code-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-corner {
    background: transparent !important;
    display: none !important;
  }
  
  /* Chrome特定的滚动条隐藏 */
  @supports (-webkit-appearance: none) {
    .question-left-panel {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    
    .code-editor-wrapper :deep(.cm-scroller) {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  }
  
  
  /* 强制换行样式 - 确保所有内容都能正确换行 */
  .problem-content {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
  }
  
  .problem-content * {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .problem-content p,
  .problem-content div,
  .problem-content span {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
  }
  
  .problem-content pre,
  .problem-content code,
  .problem-content .sample-code {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    max-width: 100% !important;
  }
  
  .problem-content li {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
  }
  
  /* 修复内容截断问题 */
  .problem-content {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    overflow: visible !important;
  }
  
  .problem-content * {
    max-width: none !important;
    width: auto !important;
    min-width: 0 !important;
    overflow: visible !important;
  }
  
  .problem-content p,
  .problem-content div,
  .problem-content span {
    width: 100% !important;
    max-width: 100% !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    white-space: normal !important;
    display: block !important;
    box-sizing: border-box !important;
  }
  
  /* 特别处理长文本和代码块 */
  .problem-content pre,
  .problem-content code {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    max-width: 100% !important;
    width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
  }
  
  /* 处理内联元素 */
  .problem-content strong,
  .problem-content em,
  .problem-content b,
  .problem-content i {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    white-space: normal !important;
  }
  
  /* 展开的编辑器面板样式 */
  .expanded-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }
  
  .expanded-editor-panel {
    background: white;
    border-radius: 16px;
    width: 90vw;
    max-width: 1400px;
    height: 90vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: expandIn 0.3s ease-out;
    border: 2px solid #e2e8f0;
  }
  
  @keyframes expandIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .expanded-editor-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    border-radius: 16px 16px 0 0;
  }
  
  .expanded-editor-header .header-title {
    color: white;
    font-size: 20px;
    font-weight: 700;
  }
  
  .close-expand-btn {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }
  
  .close-expand-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }
  
  .close-expand-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(30, 144, 255, 0.2);
  }
  
  .expanded-editor-content {
    flex: 1;
    overflow: hidden;
    background: white;
    border-left: 2px solid #e2e8f0;
    border-right: 2px solid #e2e8f0;
    display: flex;
  }
  
  .code-editor-wrapper-expanded {
    flex: 1;
    overflow: hidden;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    display: flex;
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  }
  
  .code-editor-wrapper-expanded :deep(.cm-editor) {
    height: 100%;
    background: transparent;
    outline: none !important;
  }
  
  .code-editor-wrapper-expanded :deep(.cm-scroller) {
    overflow: auto !important;
    outline: none !important;
  }
  
  .expanded-editor-actions {
    display: flex;
    gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-top: 2px solid #e2e8f0;
    border-radius: 0 0 16px 16px;
  }
  
  /* 隐藏收起状态下的右侧面板 */
  .panel-collapsed {
    display: none;
  }
  
  /* 淡入淡出动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* 主体区域 - 占满页面宽度的100% */
  .question-main {
    width: 100%;
    margin: 0 auto;
    flex-shrink: 0;
    overflow: hidden;
    order: 2;
    margin-top: 0;
    padding-top: 0;
    position: relative;
    top: 0;
  }
  
  /* 题目卡片 - 类似GESP样式 */
  .question-card {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1);
    transition: all 0.3s ease;
    padding: 0;
    overflow: hidden;
    width: 100%;
    height: calc(100vh - 50px);
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    box-sizing: border-box;
    margin-top: 0;
    position: relative;
    top: 0;
  }
  
  /* 题目卡片头部 */
  .question-card-header {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    padding: 14px 28px;
    border-bottom: 3px solid #e0f2fe;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  
  .question-number {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .problem-title-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .problem-title {
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .question-date {
    margin-left: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    padding: 8px 14px;
    border-radius: 18px;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
  }
  
  .number-badge {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #1e90ff;
    padding: 10px 24px;
    border-radius: 24px;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: 0 6px 20px rgba(30, 144, 255, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
    white-space: nowrap;
  }
  
  .level-badge {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    color: white;
    padding: 8px 14px;
    border-radius: 18px;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
  }
  
  .status-answered {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    padding: 10px 18px;
    border-radius: 24px;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
  }
  
  .status-not-submitted {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
    padding: 10px 18px;
    border-radius: 24px;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
  }
  
  .status-partial {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 10px 18px;
    border-radius: 24px;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
  }
  
  /* 侧边占位区域 - 隐藏以实现100%宽度 */
  .sidebar-placeholder-left {
    display: none;
  }
  
  .sidebar-placeholder {
    display: none;
  }
  
  /* 响应式设计 */
  @media (max-width: 1200px) {
    .oj-layout {
      flex-direction: column;
    }
  
    .problem-section,
    .editor-section {
      width: 100%;
    }
  
    .problem-card,
    .editor-card {
      height: auto;
      min-height: 500px;
    }
  
    .expanded-editor-panel {
      width: 95vw;
      height: 95vh;
    }
  }
  
  
  
  /* 移动端滚动容器适配 */
  @media (max-width: 768px) {
    .question-content-unified {
      height: calc(100vh - 160px);
      min-height: 500px;
    }
  }
  
  @media (max-width: 480px) {
    .question-content-unified {
      height: calc(100vh - 140px);
      min-height: 400px;
    }
  }
  
  .oj-layout {
    gap: 16px;
  }
  
  /* 移动端隐藏占位区域 */
  .sidebar-placeholder-left,
  .sidebar-placeholder {
    display: none;
  }
  
  /* 移动端主体区域占满宽度 */
  .question-main {
    width: 100%;
  }
  
  /* 移动端也保持左右布局 */
  .question-content-unified {
    flex-direction: row;
    gap: 8px;
  }
  
  .question-left-panel {
    min-width: 40% !important;
  }
  
  .question-right-panel {
    min-width: 40% !important;
  }
  
  /* 移动端保持分隔条 */
  .panel-resizer {
    display: flex;
  }
  
  .problem-header {
    padding: 20px;
  }
  
  .problem-title {
    font-size: 20px;
  }
  
  .problem-content {
    padding: 20px;
  }
  
  .editor-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-title {
    font-size: 16px;
  }
  
  .language-selector {
    width: 100%;
  }
  
  .editor-actions {
    flex-direction: column;
    padding: 16px 20px;
  }
  
  .result-stats {
    flex-direction: column;
  }
  
  @media (max-width: 480px) {
    .question-card-header .question-title-section {
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .question-card-header .question-title {
      font-size: 1rem;
      max-width: 200px;
    }
    
    .question-card-header .level-badge,
    .question-card-header .question-date {
      font-size: 0.8rem;
      padding: 4px 10px;
    }
    
    .level-exams-header {
      padding: 8px 12px;
      gap: 12px;
    }
  
    .level-exams-header h2 {
      font-size: 1.1rem;
    }
  
    .exam-count {
      font-size: 0.8rem;
    }
  
    .level-exams-content {
      padding: 12px;
      margin-top: 80px;
    }
  
    .problem-header {
      padding: 16px;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  
    .problem-title {
      font-size: 18px;
    }
  
    .problem-content {
      padding: 16px;
    }
  
    .problem-content h4 {
      font-size: 16px;
    }
  
    .section-header {
      padding: 12px 16px;
      margin: -2px -2px 0 -2px;
    }
  
    .section-title {
      font-size: 14px;
      gap: 6px;
    }
  
    .section-content {
      padding: 16px;
    }
  
    .markdown-content {
      font-size: 13px;
      line-height: 1.7;
    }
  
    .markdown-content p {
      margin-bottom: 12px;
    }
  
    .sample-code {
      font-size: 12px;
      padding: 10px 12px;
    }
  
    .sample-item {
      padding: 14px;
    }
  
    .problem-constraints ul,
    .markdown-content ol,
    .markdown-content ul {
      padding-left: 20px;
    }
  
    .problem-constraints li,
    .markdown-content li {
      margin: 8px 0;
      font-size: 13px;
    }
  
    .code-editor {
      font-size: 12px;
      padding: 16px;
    }
  
    .btn {
      font-size: 14px;
      padding: 12px 16px;
    }
  
    .question-left-panel {
      gap: 16px;
      padding-right: 8px;
    }
  
    .content-section {
      border-radius: 16px;
    }
  }
  
  /* 运行结果弹窗样式 */
  .result-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .result-modal {
    background: white;
    border-radius: 20px;
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideUp 0.3s ease;
    border: 2px solid #e2e8f0;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .result-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    border-bottom: 2px solid #e2e8f0;
  }
  
  .result-modal-header .result-title {
    color: white;
    font-size: 20px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .result-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .close-modal-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    color: white;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 18px;
    backdrop-filter: blur(10px);
  }
  
  .close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  }
  
  .close-modal-btn:active {
    transform: scale(0.95);
  }
  
  .result-modal-content {
    padding: 28px;
    max-height: calc(80vh - 100px);
    overflow-y: auto;
  }
  
  /* 解析提示框样式 */
  .analysis-tip {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #fbbf24;
    border-radius: 12px;
    color: #92400e;
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
    animation: tipPulse 2s ease-in-out infinite;
  }
  
  .analysis-tip i {
    color: #f59e0b;
    flex-shrink: 0;
  }
  
  @keyframes tipPulse {
    0%, 100% {
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
    }
    50% {
      box-shadow: 0 6px 16px rgba(251, 191, 36, 0.3);
    }
  }
  
  /* 弹窗内容滚动条也隐藏 */
  .result-modal-content::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  .result-modal-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .result-modal-content::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  .result-modal-content {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  
  .submit-result-modal .result-modal-content {
    padding: 32px;
  }
  
  /* 响应式弹窗 */
  @media (max-width: 768px) {
    .result-modal {
      width: 95%;
      max-height: 85vh;
    }
  
    .result-modal-header {
      padding: 20px 24px;
    }
  
    .result-modal-header .result-title {
      font-size: 18px;
    }
  
    .result-modal-content {
      padding: 20px;
    }
  
    .close-modal-btn {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .result-modal {
      width: 96%;
      max-height: 90vh;
    }
  
    .result-modal-header {
      padding: 16px 20px;
      flex-direction: row;
    }
  
    .result-modal-header .result-title {
      font-size: 16px;
    }
  
    .result-modal-content {
      padding: 16px;
    }
  
    .result-header-right {
      gap: 12px;
    }
  
    .result-status {
      font-size: 12px;
      padding: 6px 12px;
    }
  }

  /* 火箭发射特效样式 */
  .rocket-launch-container {
    position: fixed;
    bottom: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(50%);
    pointer-events: none;
    z-index: 10003;
    width: 120px;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }
  
  .rocket-trail {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 150px;
    background: linear-gradient(180deg, transparent 0%, #ff6b35 20%, #f7931e 50%, #ffd700 80%, transparent 100%);
    border-radius: 4px;
    animation: rocketTrail 2s ease-out forwards;
    box-shadow: 0 0 30px #ff6b35, 0 0 60px #f7931e, 0 0 90px #ffd700;
  }
  
  @keyframes rocketTrail {
    0% {
      height: 150px;
      opacity: 1;
    }
    50% {
      height: 250px;
      opacity: 0.9;
    }
    100% {
      height: 400px;
      opacity: 0;
    }
  }
  
  .rocket-icon {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    color: #1e90ff;
    animation: rocketLaunch 2s ease-out forwards;
    filter: drop-shadow(0 0 20px rgba(30, 144, 255, 0.9));
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rocket-icon :deep(svg) {
    width: 64px !important;
    height: 64px !important;
  }
  
  @keyframes rocketLaunch {
    0% {
      transform: translateX(-50%) translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
    20% {
      transform: translateX(-50%) translateY(-60px) rotate(-8deg) scale(1.2);
      opacity: 1;
    }
    40% {
      transform: translateX(-50%) translateY(-150px) rotate(8deg) scale(1.4);
      opacity: 1;
    }
    60% {
      transform: translateX(-50%) translateY(-280px) rotate(-5deg) scale(1.3);
      opacity: 0.9;
    }
    80% {
      transform: translateX(-50%) translateY(-420px) rotate(5deg) scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: translateX(-50%) translateY(-600px) rotate(0deg) scale(0.9);
      opacity: 0;
    }
  }
  
  .rocket-particles {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
  }
  
  .particle {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ff6b35;
    box-shadow: 0 0 15px #ff6b35, 0 0 30px #f7931e, 0 0 45px #ffd700;
    animation: particleExplode 1.2s ease-out forwards;
  }
  
  @keyframes particleExplode {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      transform: translate(var(--particle-x, 0), var(--particle-y, 0)) scale(0);
      opacity: 0;
    }
  }
  
  .particle:nth-child(1) { --particle-x: -20px; --particle-y: -10px; background: #ff6b35; }
  .particle:nth-child(2) { --particle-x: 20px; --particle-y: -10px; background: #f7931e; }
  .particle:nth-child(3) { --particle-x: 0px; --particle-y: -20px; background: #ffd700; }
  .particle:nth-child(4) { --particle-x: -15px; --particle-y: -5px; background: #ff6b35; }
  .particle:nth-child(5) { --particle-x: 15px; --particle-y: -5px; background: #f7931e; }
  .particle:nth-child(6) { --particle-x: -10px; --particle-y: -15px; background: #ffd700; }
  .particle:nth-child(7) { --particle-x: 10px; --particle-y: -15px; background: #ff6b35; }
  .particle:nth-child(8) { --particle-x: -25px; --particle-y: 0px; background: #f7931e; }
  .particle:nth-child(9) { --particle-x: 25px; --particle-y: 0px; background: #ffd700; }
  .particle:nth-child(10) { --particle-x: -5px; --particle-y: -25px; background: #ff6b35; }
  .particle:nth-child(11) { --particle-x: 5px; --particle-y: -25px; background: #f7931e; }
  .particle:nth-child(12) { --particle-x: -30px; --particle-y: 5px; background: #ffd700; }
  .particle:nth-child(13) { --particle-x: 30px; --particle-y: 5px; background: #ff6b35; }
  .particle:nth-child(14) { --particle-x: 0px; --particle-y: -30px; background: #f7931e; }
  .particle:nth-child(15) { --particle-x: -20px; --particle-y: 10px; background: #ffd700; }
  
  /* 烟花效果样式 */
  .fireworks-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 10002;
    overflow: hidden;
  }

  .firework {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 
      0 0 10px currentColor,
      0 0 20px currentColor,
      0 0 30px currentColor,
      -30px -30px 0 currentColor,
      30px 30px 0 currentColor,
      -30px 30px 0 currentColor,
      30px -30px 0 currentColor,
      -60px 0 0 currentColor,
      60px 0 0 currentColor,
      0 -60px 0 currentColor,
      0 60px 0 currentColor;
    animation: firework-explode 2s ease-out forwards;
    transform: translate(-50%, -50%);
  }

  .firework:nth-child(1) { color: #1e90ff; }
  .firework:nth-child(2) { color: #38bdf8; }
  .firework:nth-child(3) { color: #06b6d4; }
  .firework:nth-child(4) { color: #22c55e; }
  .firework:nth-child(5) { color: #f59e0b; }
  .firework:nth-child(6) { color: #ef4444; }
  .firework:nth-child(7) { color: #8b5cf6; }
  .firework:nth-child(8) { color: #ec4899; }
  .firework:nth-child(9) { color: #1e90ff; }
  .firework:nth-child(10) { color: #38bdf8; }
  .firework:nth-child(11) { color: #06b6d4; }
  .firework:nth-child(12) { color: #22c55e; }
  .firework:nth-child(13) { color: #f59e0b; }
  .firework:nth-child(14) { color: #ef4444; }
  .firework:nth-child(15) { color: #8b5cf6; }
  .firework:nth-child(16) { color: #ec4899; }
  .firework:nth-child(17) { color: #1e90ff; }
  .firework:nth-child(18) { color: #38bdf8; }
  .firework:nth-child(19) { color: #06b6d4; }
  .firework:nth-child(20) { color: #22c55e; }

  @keyframes firework-explode {
    0% {
      transform: translate(-50%, -50%) scale(0) rotate(0deg);
      opacity: 1;
    }
    15% {
      transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1) rotate(360deg);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0) rotate(540deg);
      opacity: 0;
    }
  }

  /* 返回确认弹窗样式 */
  .return-confirm-modal {
    animation: successBounce 0.5s ease-out;
  }

  @keyframes successBounce {
    0% {
      transform: scale(0.8);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .return-confirm-header {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }

  .return-confirm-header h3 {
    color: white;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .success-icon {
    font-size: 64px;
    animation: successPulse 1s ease-in-out infinite;
  }

  @keyframes successPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .exit-confirm-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .btn-secondary {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(100, 116, 139, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-secondary:hover {
    background: linear-gradient(135deg, #475569 0%, #64748b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
  }

  .btn-primary {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  /* 验证码弹窗样式 */
  .captcha-modal {
    max-width: 500px;
  }

  .captcha-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
    padding: 20px 0;
  }

  .captcha-tip {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #fbbf24;
    border-radius: 12px;
    width: 100%;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
  }

  .captcha-tip i {
    color: #f59e0b;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .captcha-tip-text {
    margin: 0;
    color: #92400e;
    font-size: 14px;
    line-height: 1.6;
    text-align: left;
    font-weight: 500;
  }

  .captcha-question {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .captcha-question i {
    color: #1e90ff;
  }

  .captcha-text {
    margin: 0;
    color: #374151;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
  }

  .captcha-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #bae6fd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
  }

  .captcha-code {
    font-size: 24px;
    font-weight: 700;
    color: #0c4a6e;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    letter-spacing: 2px;
    min-width: 120px;
    text-align: center;
  }

  .captcha-refresh-btn {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
    color: white;
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }

  .captcha-refresh-btn:hover {
    background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
    transform: rotate(180deg);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .captcha-input-group {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .captcha-input {
    width: 100%;
    max-width: 300px;
    padding: 14px 18px;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    color: #1e293b;
    transition: all 0.3s ease;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  }

  .captcha-input:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
    background: #f8fafc;
  }

  .captcha-input::placeholder {
    color: #94a3b8;
    font-weight: normal;
  }

  .captcha-input-error {
    border-color: #ef4444 !important;
    background: #fef2f2 !important;
  }

  .captcha-input-error:focus {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    background: #fee2e2 !important;
  }

  .captcha-error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border: 2px solid #fca5a5;
    border-radius: 10px;
    color: #991b1b;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
    max-width: 300px;
    animation: shake 0.4s ease;
  }

  .captcha-error-message i {
    color: #dc2626;
    flex-shrink: 0;
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-8px);
    }
    75% {
      transform: translateX(8px);
    }
  }

  @media (max-width: 480px) {
    .captcha-modal {
      max-width: 90%;
    }

    .captcha-tip {
      padding: 12px 16px;
      gap: 10px;
    }

    .captcha-tip-text {
      font-size: 13px;
      line-height: 1.5;
    }

    .captcha-code {
      font-size: 20px;
      min-width: 100px;
    }

    .captcha-input {
      max-width: 100%;
      font-size: 16px;
    }
  }
  </style>
  