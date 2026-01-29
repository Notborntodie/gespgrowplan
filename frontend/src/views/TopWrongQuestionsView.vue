<template>
  <div class="exam-layout">
    <!-- 独立的固定Header -->
    <div class="fixed-header-wrapper">
      <div class="fixed-header-container">
        <div class="section-header fixed-header">
          <div class="header-left">
            <h4 class="section-title">
              GESP {{ level }}级 易错客观题 TOP {{ questions.length }}
              <span class="stats-highlight">基于 {{ totalAttempts }} 次答题数据分析</span>
            </h4>
          </div>
          <div class="header-actions">
            <button class="toggle-explanation-btn" @click="toggleAllExplanations" title="折叠/展开解析">
              <Icon :name="showAllExplanations ? 'eye-off' : 'eye'" :size="20" />
              <span class="toggle-explanation-text">{{ showAllExplanations ? '折叠解析' : '展开解析' }}</span>
            </button>
            <button class="share-button" @click="showShareDialog = true" title="分享链接">
              <Icon name="link" :size="20" />
              <span class="share-button-text">分享链接</span>
            </button>
            <button class="download-button" @click="showExportDialog = true" title="导出为Word" :disabled="exporting">
              <Icon name="download" :size="20" />
              <span class="download-button-text">{{ exporting ? '导出中...' : '导出Word' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="exam-content exam-content-flex-row">
      <!-- 左侧占位区域 -->
      <div class="sidebar-placeholder-left"></div>

      <!-- 主体：易错题内容 -->
      <div class="question-main">
        <div class="question-content-unified">
          <div class="question-left-panel question-left-panel-centered" style="width: 100%;">

            <!-- 分享链接弹窗 -->
            <transition name="modal-fade">
              <div v-if="showShareDialog" class="share-modal-overlay" @click="showShareDialog = false">
                <div class="share-modal" @click.stop>
                  <div class="share-modal-header">
                    <h3 class="share-modal-title">分享链接</h3>
                    <button class="share-modal-close" @click="showShareDialog = false">
                      <Icon name="x" :size="20" />
                    </button>
                  </div>
                  <div class="share-modal-body">
                    <label class="share-label">分享链接：</label>
                    <div class="share-input-wrapper">
                      <input 
                        ref="shareInputRef"
                        type="text" 
                        :value="shareLink" 
                        readonly
                        class="share-input"
                        @click="selectShareLink"
                      />
                      <button class="copy-share-btn" @click="copyShareLink" title="复制链接">
                        <Icon name="copy" :size="18" />
                      </button>
                    </div>
                    <p class="share-tip">复制此链接即可分享给他人，无需登录即可访问</p>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 导出选项弹窗 -->
            <transition name="modal-fade">
              <div v-if="showExportDialog" class="share-modal-overlay" @click="showExportDialog = false">
                <div class="share-modal" @click.stop>
                  <div class="share-modal-header">
                    <h3 class="share-modal-title">导出Word文档</h3>
                    <button class="share-modal-close" @click="showExportDialog = false">
                      <Icon name="x" :size="20" />
                    </button>
                  </div>
                  <div class="share-modal-body">
                    <p class="export-tip">请选择要导出的版本：</p>
                    <div class="export-options">
                      <button 
                        class="export-option-btn" 
                        @click="exportToWord(true)"
                        :disabled="exporting"
                      >
                        <div class="export-option-icon">
                          <Icon name="file-text" :size="24" />
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">完整版</div>
                          <div class="export-option-desc">包含题目、选项、统计信息、解析等全部内容</div>
                        </div>
                      </button>
                      <button 
                        class="export-option-btn" 
                        @click="exportToWord(false)"
                        :disabled="exporting"
                      >
                        <div class="export-option-icon">
                          <Icon name="file" :size="24" />
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">精简版</div>
                          <div class="export-option-desc">仅包含题目、选项，不含统计信息和解析</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 复制成功提示 -->
            <transition name="toast-fade">
              <div v-if="showCopyToast" class="copy-toast">
                <div class="toast-content">
                  <Icon name="check-circle" :size="18" />
                  <span>{{ toastMessage }}</span>
                </div>
              </div>
            </transition>

            <!-- 图片模态框 -->
            <transition name="modal-fade">
              <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
                <div class="image-modal-content" @click.stop>
                  <button class="image-modal-close" @click="closeImageModal">
                    <Icon name="x" :size="24" />
                  </button>
                  <img 
                    :src="getImageUrl(selectedImageUrl)" 
                    alt="题目图片" 
                    class="modal-image"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </transition>

            <!-- 题目列表 -->
            <div class="content-section" v-for="(question, index) in questions" :key="question.question_id">
              <div class="question-card">
                <div class="question-header">
                  <div class="question-title-info">
                    <span class="question-number">题目 {{ index + 1 }}</span>
                    <div class="practice-result-selector">
                      <span class="result-label">还记得自己在成长计划练习的时候选对了嘛？</span>
                      <div class="result-buttons">
                        <button 
                          class="result-btn result-btn-correct"
                          :class="{ active: questionPracticeResult[question.question_id] === true }"
                          @click="setPracticeResult(question.question_id, true)"
                          title="选对了"
                        >
                          <Icon name="check" :size="18" />
                        </button>
                        <span v-if="questionPracticeResult[question.question_id] === true" class="result-feedback result-feedback-correct">
                          👍
                        </span>
                        <button 
                          class="result-btn result-btn-wrong"
                          :class="{ active: questionPracticeResult[question.question_id] === false }"
                          @click="setPracticeResult(question.question_id, false)"
                          title="选错了"
                        >
                          <Icon name="x" :size="18" />
                        </button>
                        <span v-if="questionPracticeResult[question.question_id] === false" class="result-feedback result-feedback-wrong">
                          那这次得记住喽～
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="question-stats">
                    <span class="stat-item">错误率: {{ question.wrong_rate }}%</span>
                    <span class="stat-item">错误次数: {{ question.wrong_count }}</span>
                    <span class="stat-item">总次数: {{ question.total_attempts }}</span>
                  </div>
                </div>


                <div class="question-body">
                  <div class="question-text">
                    {{ question.question_text }}
                  </div>

                  <!-- 题目图片显示 -->
                  <div v-if="question.image_url" class="question-image-section">
                    <img 
                      :src="getImageUrl(question.image_url)" 
                      :alt="`题目图片`"
                      class="question-image"
                      @error="handleImageError"
                      @click="openImageModal(question.image_url)"
                    />
                  </div>

                  <div v-if="question.question_code" class="question-code">
                    <pre><code>{{ question.question_code }}</code></pre>
                  </div>

                  <!-- 选项（始终显示） -->
                  <div class="question-options">
                    <div 
                      v-for="option in question.options" 
                      :key="option.label"
                      :class="['option-item', {
                        'correct': showAllExplanations && option.label === question.correct_answer,
                        'most-wrong': showAllExplanations && option.label === question.most_wrong_option_label
                      }]"
                    >
                      <div class="option-header">
                        <span class="option-label">{{ option.label }}:</span>
                        <span class="option-text">{{ option.text }}</span>
                        <template v-if="showAllExplanations">
                          <span class="option-wrong-count" v-if="option.wrong_count > 0">
                            (错误 {{ option.wrong_count }} 次)
                          </span>
                          <span class="correct-badge" v-if="option.label === question.correct_answer">✓ 正确答案</span>
                          <span class="most-wrong-badge" v-if="option.label === question.most_wrong_option_label">
                            ⚠ 最多人错选
                          </span>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- 解析（可折叠） -->
                  <div v-if="showAllExplanations" class="explanation-content-wrapper">
                    <div class="question-explanation">
                      <div class="explanation-header">
                        <strong>解析：</strong>
                      </div>
                      <div class="explanation-content">
                        {{ question.explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧占位区域 -->
      <div class="sidebar-placeholder-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ImageRun } from 'docx'
import { saveAs } from 'file-saver'

const route = useRoute()

// 从路由参数获取级别，默认为1级
const level = computed(() => {
  const levelParam = route.params.level as string
  return levelParam ? parseInt(levelParam) : 1
})

// 根据级别获取CSV文件名
const getCSVFileName = (level: number): string => {
  const fileMap: Record<number, string> = {
    1: 'top_wrong_questions_level_1_2025-12-24T06-38-30.csv',
    2: 'top_wrong_questions_level_2_2025-12-24T06-56-09.csv',
    3: 'top_wrong_questions_level_3_2025-12-24T06-56-09.csv',
    4: 'top_wrong_questions_level_4_2025-12-24T06-56-09.csv'
  }
  return fileMap[level] || fileMap[1]
}

interface QuestionOption {
  label: string
  text: string
  wrong_count: number
}

interface Question {
  level: number
  question_id: number
  question_text: string
  question_code: string
  question_type: string
  difficulty: string
  correct_answer: string
  explanation: string
  options: QuestionOption[]
  wrong_count: number
  total_attempts: number
  correct_count: number
  wrong_rate: number
  correct_rate: number
  rank_in_level: number
  most_wrong_option_label: string
  most_wrong_option_text: string
  most_wrong_option_count: number
  image_url?: string
}

const questions = ref<Question[]>([])
const totalAttempts = ref(0)

// 分享相关
const showShareDialog = ref(false)
const showCopyToast = ref(false)
const toastMessage = ref('链接已复制到剪贴板！')
const shareInputRef = ref<HTMLInputElement | null>(null)

// 导出相关
const exporting = ref(false)
const showExportDialog = ref(false)

// 展开解析相关（全局控制）
const showAllExplanations = ref(true)

// 切换所有题目的解析显示
const toggleAllExplanations = () => {
  showAllExplanations.value = !showAllExplanations.value
}

// 练习结果相关
const questionPracticeResult = ref<Record<number, boolean | null>>({})

// 设置练习结果
const setPracticeResult = (questionId: number, isCorrect: boolean) => {
  // 如果之前已经选对了，再次点击时取消选择
  if (questionPracticeResult.value[questionId] === true && isCorrect) {
    questionPracticeResult.value[questionId] = null
  } 
  // 如果之前已经选错了，再次点击时取消选择
  else if (questionPracticeResult.value[questionId] === false && !isCorrect) {
    questionPracticeResult.value[questionId] = null
  } 
  else {
    questionPracticeResult.value[questionId] = isCorrect
  }
}

// 图片相关
const showImageModal = ref(false)
const selectedImageUrl = ref('')

// 获取图片URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // 否则从public/html目录加载
  return `/html/${imagePath}`
}

// 打开图片模态框
const openImageModal = (imageUrl: string) => {
  selectedImageUrl.value = imageUrl
  showImageModal.value = true
}

// 关闭图片模态框
const closeImageModal = () => {
  showImageModal.value = false
  selectedImageUrl.value = ''
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  console.warn('图片加载失败:', img.src)
}

// 生成分享链接
const shareLink = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}${route.path}`
})

// 监听级别变化，重新加载数据
watch(level, () => {
  questions.value = []
  parseCSV()
}, { immediate: false })

// 选择分享链接文本
const selectShareLink = () => {
  if (shareInputRef.value) {
    shareInputRef.value.select()
  }
}

// 复制分享链接
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toastMessage.value = '链接已复制到剪贴板！'
    showCopyToast.value = true
    setTimeout(() => {
      showCopyToast.value = false
    }, 2000)
    // 关闭弹窗
    setTimeout(() => {
      showShareDialog.value = false
    }, 500)
  } catch (error) {
    // 降级方案：使用传统方法复制
    if (shareInputRef.value) {
      shareInputRef.value.select()
      try {
        document.execCommand('copy')
        toastMessage.value = '链接已复制到剪贴板！'
        showCopyToast.value = true
        setTimeout(() => {
          showCopyToast.value = false
        }, 2000)
        setTimeout(() => {
          showShareDialog.value = false
        }, 500)
      } catch (err) {
        console.error('复制失败:', err)
        alert('复制失败，请手动复制链接：\n' + shareLink.value)
      }
    }
  }
}

// 解析CSV数据
const parseCSV = async () => {
  try {
    const fileName = getCSVFileName(level.value)
    const response = await fetch(`/html/${fileName}`)
    const text = await response.text()
    
    if (!text.trim()) return

    // 使用正则表达式解析CSV，处理引号内的换行符和逗号
    const parseCSVLine = (csvText: string): string[][] => {
      const rows: string[][] = []
      let currentRow: string[] = []
      let currentField = ''
      let inQuotes = false
      let i = 0

      while (i < csvText.length) {
        const char = csvText[i]
        const nextChar = csvText[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // 转义的双引号
            currentField += '"'
            i += 2
            continue
          } else {
            // 切换引号状态
            inQuotes = !inQuotes
            i++
            continue
          }
        }

        if (char === ',' && !inQuotes) {
          // 字段结束
          currentRow.push(currentField.trim())
          currentField = ''
          i++
          continue
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
          // 行结束
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim())
            currentField = ''
            if (currentRow.some(f => f)) {
              rows.push(currentRow)
            }
            currentRow = []
          }
          // 跳过\r\n组合
          if (char === '\r' && nextChar === '\n') {
            i += 2
          } else {
            i++
          }
          continue
        }

        currentField += char
        i++
      }

      // 处理最后一行
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim())
        if (currentRow.some(f => f)) {
          rows.push(currentRow)
        }
      }

      return rows
    }

    const rows = parseCSVLine(text)
    if (rows.length < 2) return

    const headers = rows[0]
    const parsedQuestions: Question[] = []

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i]
      if (values.length < headers.length) continue

      const question: any = {}
      headers.forEach((header, idx) => {
        let value = values[idx]?.trim() || ''
        // 移除字段两端的引号（如果有）
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        }
        // 处理转义的双引号
        value = value.replace(/""/g, '"')
        question[header.trim()] = value
      })

      // 构建选项数组
      const options: QuestionOption[] = []
      if (question.option_a_label && question.option_a_text) {
        options.push({
          label: question.option_a_label,
          text: question.option_a_text,
          wrong_count: parseInt(question.option_a_wrong_count) || 0
        })
      }
      if (question.option_b_label && question.option_b_text) {
        options.push({
          label: question.option_b_label,
          text: question.option_b_text,
          wrong_count: parseInt(question.option_b_wrong_count) || 0
        })
      }
      if (question.option_c_label && question.option_c_text) {
        options.push({
          label: question.option_c_label,
          text: question.option_c_text,
          wrong_count: parseInt(question.option_c_wrong_count) || 0
        })
      }
      if (question.option_d_label && question.option_d_text) {
        options.push({
          label: question.option_d_label,
          text: question.option_d_text,
          wrong_count: parseInt(question.option_d_wrong_count) || 0
        })
      }

      const questionLevel = parseInt(question.level) || 1
      const questionId = parseInt(question.question_id) || 0
      
      // 根据题目ID和级别设置图片URL
      let imageUrl = ''
      // 2级题目1311（"下面C++代码实现输出如下图形"）- 题目43
      if (questionLevel === 2 && questionId === 1311) {
        imageUrl = '2级43题.png'
      }
      // 2级题目1067（"下面C++代码实现输出如下图形，横线应填入的代码是"）- 题目50
      else if (questionLevel === 2 && questionId === 1067) {
        imageUrl = '2级50题.png'
      }
      // 可以在这里添加更多图片映射规则
      // else if (questionLevel === X && questionId === Y) {
      //   imageUrl = '图片文件名.png'
      // }

      parsedQuestions.push({
        level: questionLevel,
        question_id: questionId,
        question_text: question.question_text || '',
        question_code: question.question_code || '',
        question_type: question.question_type || '',
        difficulty: question.difficulty || '',
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || '',
        options: options,
        wrong_count: parseInt(question.wrong_count) || 0,
        total_attempts: parseInt(question.total_attempts) || 0,
        correct_count: parseInt(question.correct_count) || 0,
        wrong_rate: parseFloat(question.wrong_rate) || 0,
        correct_rate: parseFloat(question.correct_rate) || 0,
        rank_in_level: parseInt(question.rank_in_level) || 0,
        most_wrong_option_label: question.most_wrong_option_label || '',
        most_wrong_option_text: question.most_wrong_option_text || '',
        most_wrong_option_count: parseInt(question.most_wrong_option_count) || 0,
        image_url: imageUrl || undefined
      })
    }

    questions.value = parsedQuestions
    totalAttempts.value = parsedQuestions.reduce((sum, q) => sum + q.total_attempts, 0)
  } catch (error) {
    console.error('解析CSV失败:', error)
  }
}

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return map[difficulty] || difficulty
}

// 下载图片并转换为 ArrayBuffer
const downloadImage = async (imageUrl: string): Promise<ArrayBuffer | null> => {
  try {
    // 处理相对URL和绝对URL
    let fullUrl = imageUrl
    if (imageUrl.startsWith('/html/')) {
      // 相对路径，使用当前域名
      fullUrl = `${window.location.origin}${imageUrl}`
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      // 相对路径，添加/html/前缀
      fullUrl = `${window.location.origin}/html/${imageUrl}`
    }

    const response = await fetch(fullUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.arrayBuffer()
  } catch (error) {
    console.error('下载图片失败:', imageUrl, error)
    return null
  }
}

// 获取图片的原始尺寸
const getImageDimensions = (imageBuffer: ArrayBuffer): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageBuffer])
    const url = URL.createObjectURL(blob)
    const img = new Image()
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法加载图片'))
    }
    
    img.src = url
  })
}

// 计算适合Word文档的图片尺寸
const calculateImageSize = (originalWidth: number, originalHeight: number): { width: number; height: number } => {
  // Word文档页面宽度约为 595 点（A4纸），留边距后可用宽度约 500 点
  const maxWidth = 500
  const maxHeight = 400
  
  let width = originalWidth
  let height = originalHeight
  
  // 如果图片宽度超过最大宽度，按比例缩放
  if (width > maxWidth) {
    const ratio = maxWidth / width
    width = maxWidth
    height = height * ratio
  }
  
  // 如果缩放后高度仍超过最大高度，再次按比例缩放
  if (height > maxHeight) {
    const ratio = maxHeight / height
    height = maxHeight
    width = width * ratio
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

// 创建图片段落
const createImageParagraph = async (imageUrl: string): Promise<Paragraph | null> => {
  try {
    const fullImageUrl = getImageUrl(imageUrl)
    if (!fullImageUrl) return null

    const imageBuffer = await downloadImage(fullImageUrl)
    if (!imageBuffer) {
      return null
    }

    // 获取图片原始尺寸
    const originalSize = await getImageDimensions(imageBuffer)
    
    // 计算适合的显示尺寸
    const displaySize = calculateImageSize(originalSize.width, originalSize.height)

    // 将 ArrayBuffer 转换为 Uint8Array（浏览器兼容）
    const uint8Array = new Uint8Array(imageBuffer)

    // 创建带图片的段落
    return new Paragraph({
      children: [
        new ImageRun({
          data: uint8Array,
          transformation: {
            width: displaySize.width,
            height: displaySize.height
          }
        } as any)
      ],
      spacing: { before: 150, after: 150 },
      alignment: AlignmentType.CENTER  // 图片居中显示
    })
  } catch (error) {
    console.error('创建图片段落失败:', error)
    return null
  }
}

// 导出为Word文档
const exportToWord = async (fullVersion: boolean = true) => {
  if (questions.value.length === 0) {
    alert('没有题目可导出')
    return
  }

  // 关闭导出对话框
  showExportDialog.value = false
  exporting.value = true
  try {
    const paragraphs: Paragraph[] = []

    // 标题
    const versionSuffix = fullVersion ? '完整版' : '精简版'
    paragraphs.push(
      new Paragraph({
        text: `GESP ${level.value}级 易错客观题 TOP ${questions.value.length}（${versionSuffix}）`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )

    // 统计信息（仅完整版）
    if (fullVersion) {
      paragraphs.push(
        new Paragraph({
          text: `共 ${questions.value.length} 道题目，基于 ${totalAttempts.value} 次答题数据分析`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        })
      )
    }

    // 遍历每道题目（需要异步处理图片）
    for (let index = 0; index < questions.value.length; index++) {
      const question = questions.value[index]
      
      // 题目编号和排名（完整版显示排名）
      const titleText = fullVersion 
        ? `题目 ${index + 1}（第 ${question.rank_in_level} 名）`
        : `题目 ${index + 1}`
      paragraphs.push(
        new Paragraph({
          text: titleText,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      // 统计信息（仅完整版）
      if (fullVersion) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `错误率: ${question.wrong_rate.toFixed(2)}% | `,
                bold: true
              }),
              new TextRun({
                text: `错误次数: ${question.wrong_count} | `
              }),
              new TextRun({
                text: `总次数: ${question.total_attempts}`
              })
            ],
            spacing: { after: 200 }
          })
        )
      }

      // 题目内容
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: question.question_text,
              bold: true
            })
          ],
          spacing: { after: 200 }
        })
      )

      // 题目图片（如果有）
      if (question.image_url) {
        const imageParagraph = await createImageParagraph(question.image_url)
        if (imageParagraph) {
          paragraphs.push(imageParagraph)
        }
      }

      // 代码部分
      if (question.question_code) {
        paragraphs.push(
          new Paragraph({
            text: '代码：',
            spacing: { before: 200, after: 100 }
          })
        )
        
        // 将代码按行分割
        const codeLines = question.question_code.split('\n')
        codeLines.forEach(line => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || ' ',
                  font: 'Courier New',
                  size: 20
                })
              ],
              spacing: { after: 50 }
            })
          )
        })
      }

      // 选项
      paragraphs.push(
        new Paragraph({
          text: '选项：',
          spacing: { before: 200, after: 100 }
        })
      )

      question.options.forEach(option => {
        const isCorrect = option.label === question.correct_answer
        const isMostWrong = option.label === question.most_wrong_option_label
        
        const optionText = `${option.label}. ${option.text}`
        
        // 完整版显示错误次数和标记
        if (fullVersion) {
          const wrongCountText = option.wrong_count > 0 ? ` (错误 ${option.wrong_count} 次)` : ''
          const badgeText = isCorrect ? ' [✓ 正确答案]' : isMostWrong ? ' [⚠ 最多人错选]' : ''
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: optionText,
                  bold: isCorrect || isMostWrong,
                  color: isCorrect ? '008000' : isMostWrong ? 'FF0000' : undefined
                }),
                new TextRun({
                  text: wrongCountText,
                  color: '666666'
                }),
                new TextRun({
                  text: badgeText,
                  bold: true,
                  color: isCorrect ? '008000' : 'FF0000'
                })
              ],
              spacing: { after: 100 },
              indent: { left: 400 }
            })
          )
        } else {
          // 精简版只显示选项文本
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: optionText
                })
              ],
              spacing: { after: 100 },
              indent: { left: 400 }
            })
          )
        }
      })

      // 解析（仅完整版）
      if (fullVersion) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '解析：',
                bold: true
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        )
        
        paragraphs.push(
          new Paragraph({
            text: question.explanation,
            spacing: { after: 200 },
            indent: { left: 400 }
          })
        )

        // 难度（仅完整版）
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `难度: ${getDifficultyText(question.difficulty)}`,
                color: '666666',
                italics: true
              })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 }
          })
        )
      } else {
        // 精简版在选项后添加一些间距
        paragraphs.push(
          new Paragraph({
            spacing: { after: 200 }
          })
        )
      }

      // 分隔线（最后一道题不添加）
      if (index < questions.value.length - 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '────────────────────────────────────────',
                color: 'CCCCCC'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
          })
        )
      }
    }

    // 页脚
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
            color: '999999'
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 600 }
      })
    )

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    })

    // 导出文件
    const blob = await Packer.toBlob(doc)
    const versionText = fullVersion ? '完整版' : '精简版'
    const fileName = `GESP_${level.value}级_易错题_TOP${questions.value.length}_${versionText}_${new Date().toISOString().split('T')[0]}.docx`
    saveAs(blob, fileName)
    
    // 显示成功提示
    toastMessage.value = 'Word文档导出成功！'
    showCopyToast.value = true
    setTimeout(() => {
      showCopyToast.value = false
    }, 2000)
  } catch (error) {
    console.error('导出Word失败:', error)
    alert('导出Word失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  parseCSV()
})
</script>

<style scoped>
/* 使用与homeView相同的布局样式 */
.exam-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  position: relative;
}

/* 独立的固定Header */
.fixed-header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fixed-header-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 0;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 20px;
  padding-top: 90px; /* 为固定header留出空间 */
}

.sidebar-placeholder-left {
  width: 5%;
  flex-shrink: 0;
}

.sidebar-placeholder-right {
  width: 5%;
  flex-shrink: 0;
}

.question-main {
  flex: 1;
  max-width: none;
  min-width: 0;
  width: 90%;
  padding: 0;
  box-sizing: border-box;
  background: #f8fafc;
  border: 0;
  border-radius: 18px;
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  margin: 0;
}

.question-content-unified {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background: white;
  border-radius: 18px;
}

.question-left-panel {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  border-radius: 18px;
}

.question-left-panel-centered {
  max-width: none;
  margin: 0;
  width: 100%;
}

.content-section {
  background: transparent;
  border-radius: 20px;
  box-shadow: none;
  overflow: visible;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: fit-content;
}

/* 固定header区域覆盖content-section的样式 */

.section-header {
  background: linear-gradient(135deg, #e6f7ff 0%, #b3e5fc 100%);
  padding: 12px 24px;
  border-bottom: 2px solid #87ceeb;
  border-radius: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.fixed-header {
  border-radius: 0;
  box-shadow: none;
  background: linear-gradient(135deg, #e6f7ff 0%, #b3e5fc 100%);
  margin: 0;
  width: 100%;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.section-title {
  margin: 0;
  color: #2c5282;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-highlight {
  color: #1e90ff;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.1), rgba(135, 206, 235, 0.1));
  padding: 6px 16px;
  border-radius: 12px;
  border: 2px solid rgba(30, 144, 255, 0.3);
  display: inline-block;
}

.share-button {
  background: rgba(30, 144, 255, 0.25);
  border: 2px solid #1e90ff;
  color: #0066cc;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.share-button:hover {
  background: rgba(30, 144, 255, 0.35);
  border-color: #0066cc;
  color: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 144, 255, 0.3);
}

.share-button:active {
  transform: translateY(0);
}

.share-button-text {
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.download-button {
  background: rgba(16, 185, 129, 0.25);
  border: 2px solid #10b981;
  color: #059669;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.download-button:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.35);
  border-color: #059669;
  color: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.download-button:active:not(:disabled) {
  transform: translateY(0);
}

.download-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-button-text {
  white-space: nowrap;
}

.toggle-explanation-btn {
  background: rgba(239, 68, 68, 0.25);
  border: 2px solid #ef4444;
  color: #dc2626;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.toggle-explanation-btn:hover {
  background: rgba(239, 68, 68, 0.35);
  border-color: #dc2626;
  color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.toggle-explanation-btn:active {
  transform: translateY(0);
}

.toggle-explanation-text {
  white-space: nowrap;
}

.section-content {
  padding: 24px;
  background: transparent;
}


.question-card {
  background: white;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.question-card:hover {
  box-shadow: 0 8px 25px rgba(135, 206, 235, 0.2);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.question-title-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.question-number {
  background: linear-gradient(135deg, #87ceeb, #1e90ff);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1rem;
}

.practice-result-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.result-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-feedback {
  font-size: 1rem;
  font-weight: 600;
  animation: feedbackFadeIn 0.3s ease-out;
}

.result-feedback-correct {
  color: #10b981;
  font-size: 1.2rem;
}

.result-feedback-wrong {
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #fbbf24;
}

@keyframes feedbackFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.result-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #64748b;
}

.result-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.result-btn-correct {
  color: #10b981;
}

.result-btn-correct:hover {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.result-btn-correct.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.result-btn-wrong {
  color: #ef4444;
}

.result-btn-wrong:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.result-btn-wrong.active {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 大拇指特效 */
.thumbs-up-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.thumbs-up-icon {
  font-size: 80px;
  animation: thumbsUpBounce 1s ease-out;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

@keyframes thumbsUpBounce {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.95) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.thumbs-up-fade-enter-active {
  animation: thumbsUpBounce 1s ease-out;
}

.thumbs-up-fade-leave-active {
  animation: thumbsUpFadeOut 0.5s ease-in;
}

@keyframes thumbsUpFadeOut {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(0.5) rotate(20deg);
    opacity: 0;
  }
}

/* 选错提示特效 */
.reminder-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.reminder-text {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(146, 64, 14, 0.3);
  border: 2px solid #fbbf24;
  animation: reminderBounce 1s ease-out;
  white-space: nowrap;
}

@keyframes reminderBounce {
  0% {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) translateY(-10px);
    opacity: 1;
  }
  70% {
    transform: scale(0.95) translateY(0);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.reminder-fade-enter-active {
  animation: reminderBounce 1s ease-out;
}

.reminder-fade-leave-active {
  animation: reminderFadeOut 0.5s ease-in;
}

@keyframes reminderFadeOut {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(0.8) translateY(-20px);
    opacity: 0;
  }
}

.question-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  background: #e6f7ff;
  color: #2c5282;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.question-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #374151;
}

.question-code {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  overflow-x: auto;
}

.question-code pre {
  margin: 0;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.6;
}

.question-code code {
  color: #e2e8f0;
}

/* 题目图片样式 */
.question-image-section {
  margin: 20px 0;
  text-align: center;
}

.question-image {
  max-width: 20%;
  height: auto;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-image:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #87ceeb;
}

/* 图片模态框样式 */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.image-modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #1e293b;
  z-index: 2001;
}

.image-modal-close:hover {
  background: white;
  transform: scale(1.1);
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.explanation-content-wrapper {
  margin-top: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.option-item.correct {
  background: #ecfdf5;
  border-color: #10b981;
}

.option-item.most-wrong {
  background: #fef2f2;
  border-color: #ef4444;
}

.option-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.option-label {
  font-weight: 700;
  color: #2c5282;
  min-width: 30px;
}

.option-text {
  flex: 1;
  color: #374151;
  line-height: 1.6;
}

.option-wrong-count {
  color: #ef4444;
  font-size: 0.9rem;
  font-weight: 500;
}

.correct-badge {
  background: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.most-wrong-badge {
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.question-explanation {
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #87ceeb;
}

.explanation-header {
  color: #2c5282;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.explanation-content {
  color: #374151;
  line-height: 1.8;
  font-size: 1rem;
}


/* 分享弹窗样式 */
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.share-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  overflow: hidden;
}

.share-modal-header {
  background: linear-gradient(135deg, #e6f7ff 0%, #b3e5fc 100%);
  padding: 20px 24px;
  border-bottom: 2px solid #87ceeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.share-modal-title {
  margin: 0;
  color: #2c5282;
  font-size: 1.3rem;
  font-weight: 600;
}

.share-modal-close {
  background: transparent;
  border: none;
  color: #2c5282;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.share-modal-close:hover {
  background: rgba(30, 144, 255, 0.1);
}

.share-modal-body {
  padding: 24px;
}

.share-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.share-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  color: #1e293b;
  background: #f8fafc;
  cursor: text;
  transition: all 0.2s ease;
}

.share-input:focus {
  outline: none;
  border-color: #1e90ff;
  background: white;
}

.copy-share-btn {
  background: #1e90ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-share-btn:hover {
  background: #0c7cd5;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 144, 255, 0.3);
}

.copy-share-btn:active {
  transform: translateY(0);
}

.share-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

/* 复制成功提示 */
.copy-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  pointer-events: none;
}

.toast-content {
  background: rgba(30, 144, 255, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
  font-size: 14px;
  font-weight: 500;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .share-modal,
.modal-fade-leave-to .share-modal {
  transform: scale(0.95) translateY(-10px);
}

/* 提示动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 导出选项样式 */
.export-tip {
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #475569;
  font-weight: 500;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-option-btn {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.export-option-btn:hover:not(:disabled) {
  border-color: #1e90ff;
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
}

.export-option-btn:active:not(:disabled) {
  transform: translateY(0);
}

.export-option-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-option-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 12px;
  color: #1e90ff;
}

.export-option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-option-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c5282;
}

.export-option-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exam-content-flex-row {
    flex-direction: column;
    gap: 0;
    padding: 0;
    width: 100%;
  }

  .sidebar-placeholder-left,
  .sidebar-placeholder-right {
    display: none;
  }

  .question-main {
    width: 100%;
    padding: 0;
  }

  .question-left-panel {
    padding: 0;
    gap: 16px;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .question-stats {
    width: 100%;
  }

  .option-header {
    flex-direction: column;
    gap: 8px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .share-button,
  .download-button {
    width: 100%;
    justify-content: center;
  }

  .share-modal {
    max-width: 100%;
    margin: 0;
  }

  .share-input-wrapper {
    flex-direction: column;
  }

  .copy-share-btn {
    width: 100%;
  }

  .export-option-btn {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .export-option-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
