<template>
  <div class="level-exams-container">
    <div class="level-exams-header">
      <div class="header-top">
        <div class="header-left">
          <button @click="goBack" class="back-btn">
            ← 返回
          </button>
          <!-- 考试类型选择器 -->
          <div class="type-selector">
            <nav class="type-nav">
              <button 
                v-for="type in examTypes" 
                :key="type.key"
                @click="selectExamType(type)"
                :class="['type-menu-item', { active: selectedExamType === type.key }]"
              >
                {{ type.label }}
              </button>
            </nav>
          </div>
        </div>
        <div class="level-display">
          <span class="level-text">{{ getLevelText(level) }}</span>
        </div>
      </div>
      
      <!-- 考试选择器 -->
      <div class="exam-selector">
        <div class="selector-tabs">
          <div 
            v-for="(exam, index) in filteredExams" 
            :key="exam.id"
            class="exam-tab"
            :class="{ 'active': selectedExam?.id === exam.id }"
            :data-exam-type="exam.type"
            @click="selectExam(exam)"
          >
            <div class="exam-tab-content">
              <span v-if="exam.type === '模拟'" class="exam-number">{{ index + 1 }}</span>
              <div class="exam-info">
                <div v-if="exam.type === '真题'" class="exam-time-only">
                  {{ getExamTime(exam) }}
                </div>
                <div v-else class="exam-title">{{ exam.name }}</div>
                <div class="exam-detail" v-if="exam.type === '模拟'">
                  <span class="exam-difficulty">
                    {{ getDifficultyText(exam.difficulty) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="selector-underline"></div>
      </div>
    </div>

    <div class="level-exams-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载考试列表...</p>
      </div>
      
      <div v-else-if="filteredExams.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>暂无练习</h3>
        <p>该等级暂时没有可用的练习</p>
      </div>
      
      <div v-else class="exam-detail-layout">
        <!-- 考试详情卡片 -->
        <div class="exam-detail-section">
          <div v-if="selectedExam" class="selected-exam-card" :class="{ 'breathing': isBreathing }">
            <div class="selected-exam-header">
              <div class="exam-info">
                <h3 class="exam-name">{{ selectedExam.name }}</h3>
                <div class="exam-badges">
                  <span class="type-badge" :class="`type-${selectedExam.type || '真题'}`">
                    {{ getTypeText(selectedExam.type) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="selected-exam-content">
              <div class="exam-stats">
                <div class="stat-item exam-description">
                  <span class="stat-label">考试描述</span>
                  <span class="stat-value">{{ selectedExam.description || '暂无描述' }}</span>
                </div>
                <div class="stat-item exam-actions">
                  <span class="stat-label">操作选项</span>
                  <div class="action-buttons">
                    <button @click.stop="showPracticeDialogForExam(selectedExam)" class="btn btn-primary">
                      🎯 开始练习
                    </button>
                    <button @click.stop="viewSubmissions(selectedExam)" class="btn btn-info">
                      📊 查看提交记录
                    </button>
                    <button 
                      v-if="isTeacher" 
                      @click.stop="viewStudentSubmissions(selectedExam)" 
                      class="btn btn-teacher"
                    >
                      👨‍🎓 查看学生提交记录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-selection-placeholder">
            <div class="placeholder-icon">📚</div>
            <h3>选择考试</h3>
            <p>点击上方的考试序号开始</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习模式对话框 -->
    <PracticeModeDialog
      :visible="showPracticeDialog"
      :title="practiceDialogTitle"
      :message="practiceDialogMessage"
      :questionCount="practiceDialogQuestionCount"
      @confirm="handlePracticeConfirm"
      @cancel="handlePracticeCancel"
    />

  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PracticeModeDialog from '@/components/PracticeModeDialog.vue'

const route = useRoute()
const router = useRouter()

// 从路由参数获取等级
const level = ref(parseInt(route.params.level as string))

// 数据状态
const exams = ref<any[]>([])
const filteredExams = ref<any[]>([])
const loading = ref(false)
const selectedExam = ref<any>(null)
const selectedExamType = ref('真题')

// PracticeModeDialog 相关状态
const showPracticeDialog = ref(false)
const practiceDialogTitle = ref('')
const practiceDialogMessage = ref('')
const practiceDialogQuestionCount = ref('')

// 呼吸动画状态
const isBreathing = ref(false)

// 教师权限检查
const isTeacher = computed(() => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      return false
    }
    
    const userInfo = JSON.parse(userInfoStr)
    return userInfo.role_names?.includes('teacher') || 
           userInfo.roles?.some((role: any) => role.name === 'teacher')
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
})

// 用户信息
const userInfo = ref<any>(null)

// 考试类型选项
const examTypes = [
  { key: '真题', label: '真题' },
  { key: '专项', label: '专项' },
  { key: '模拟', label: '模拟' }
]

// 获取考试列表
async function fetchExams() {
  loading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/exams?level=${level.value}`)
    exams.value = response.data
    // 初始化过滤后的考试列表
    filterExams()
  } catch (error: any) {
    console.error('获取考试列表失败:', error)
    alert('获取考试列表失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 根据类型过滤考试
function filterExams() {
  filteredExams.value = exams.value.filter(exam => exam.type === selectedExamType.value)
  
  // 按时间排序，最新的在前面
  filteredExams.value.sort((a, b) => {
    const timeA = getExamTimeForSort(a)
    const timeB = getExamTimeForSort(b)
    return timeB.getTime() - timeA.getTime() // 降序排列，最新的在前
  })
  
  // 重置选中的考试
  if (filteredExams.value.length > 0) {
    selectedExam.value = filteredExams.value[0]
  } else {
    selectedExam.value = null
  }
}

// 选择考试类型
function selectExamType(type: any) {
  selectedExamType.value = type.key
  filterExams()
}

// 选择考试
function selectExam(exam: any) {
  selectedExam.value = exam
  
  // 触发呼吸动画
  isBreathing.value = true
  
  // 3秒后停止呼吸动画
  setTimeout(() => {
    isBreathing.value = false
  }, 6000)
}

// 等级文本
function getLevelText(level: number) {
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 类型文本
function getTypeText(type: string) {
  return type || '真题'
}

// 格式化考试时间
function formatExamTime(dateString: string) {
  if (!dateString) return '未知时间'
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}年${month}月${day}日`
}

// 获取难度文本
function getDifficultyText(difficulty: string) {
  const difficultyMap: { [key: string]: string } = {
    'easy': '简单',
    'medium': '中等', 
    'hard': '困难'
  }
  return difficultyMap[difficulty] || '中等'
}

// 从考试名称中提取时间信息
function getExamTime(exam: any) {
  if (!exam.name) {
    return '未知时间'
  }
  
  // 正则表达式匹配年份和月份
  // 匹配格式：2024年、2024、2024年9月、2024年09月等
  const yearMatch = exam.name.match(/(\d{4})年?/)
  const monthMatch = exam.name.match(/(\d{1,2})月/)
  
  if (yearMatch) {
    const year = yearMatch[1]
    if (monthMatch) {
      const month = monthMatch[1].padStart(2, '0')
      return `${year}-${month}`
    } else {
      // 只有年份，默认显示为01月
      return `${year}-01`
    }
  }
  
  return '未知时间'
}

// 从考试名称中提取时间用于排序
function getExamTimeForSort(exam: any) {
  if (!exam.name) {
    return new Date('1900-01-01') // 未知时间的排在最后
  }
  
  const yearMatch = exam.name.match(/(\d{4})年?/)
  const monthMatch = exam.name.match(/(\d{1,2})月/)
  
  if (yearMatch) {
    const year = parseInt(yearMatch[1])
    const month = monthMatch ? parseInt(monthMatch[1]) : 1
    return new Date(year, month - 1, 1) // 月份从0开始，所以减1
  }
  
  return new Date('1900-01-01') // 无法解析时间的排在最后
}

// 获取平均难度
function getAverageDifficulty(questions: any[]) {
  if (!questions || questions.length === 0) return 'N/A'
  
  const difficultyMap: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 }
  const total = questions.reduce((sum, q) => {
    return sum + (difficultyMap[q.difficulty] || 2)
  }, 0)
  
  const average = total / questions.length
  if (average <= 1.5) return '简单'
  if (average <= 2.5) return '中等'
  return '困难'
}

// 获取代码题数量
function getCodeQuestionCount(questions: any[]) {
  if (!questions) return 0
  return questions.filter(q => q.question_type === 'code').length
}

// 获取文本题数量
function getTextQuestionCount(questions: any[]) {
  if (!questions) return 0
  return questions.filter(q => q.question_type === 'text').length
}

// 返回上一页
function goBack() {
  router.push('/select-level')
}

// 跳转到创建考试页面
function goToCreateExam() {
  router.push('/admin/create-exam')
}

// 查看提交记录
function viewSubmissions(exam: any) {
  router.push(`/exam-submissions/${exam.id}`)
}

// 显示练习模式对话框
function showPracticeDialogForExam(exam: any) {
  selectedExam.value = exam
  practiceDialogTitle.value = `${exam.name} 练习`
  practiceDialogMessage.value = `您确定要开始练习 "${exam.name}" 吗？`
  practiceDialogQuestionCount.value = `${exam.total_questions || 0} 题`
  showPracticeDialog.value = true
}

// 处理练习模式确认
function handlePracticeConfirm(mode: string) {
  showPracticeDialog.value = false
  
  if (selectedExam.value) {
    // 根据模式跳转到不同的路由
    if (mode === 'exam') {
      // 考试模式
      router.push(`/exam/${selectedExam.value.id}`)
    } else if (mode === 'review') {
      // 复习模式
      router.push(`/exam/${selectedExam.value.id}?mode=review`)
    } else if (mode === 'classroom') {
      // 课堂模式
      router.push(`/exam/${selectedExam.value.id}?mode=classroom`)
    }
  }
}

// 处理练习模式取消
function handlePracticeCancel() {
  showPracticeDialog.value = false
}

// 查看学生提交记录
function viewStudentSubmissions(exam: any) {
  // 获取用户信息
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      alert('请先登录')
      router.push('/login')
      return
    }
    userInfo.value = JSON.parse(userInfoStr)
    
    // 直接跳转到学生提交记录页面（显示所有学生）
    const route = `/teacher/${userInfo.value.id}/submissions`
    if (exam.id) {
      router.push({ path: route, query: { exam_id: exam.id.toString() } })
    } else {
      router.push(route)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    alert('获取用户信息失败')
  }
}

onMounted(() => {
  fetchExams()
})
</script>

<style scoped>
.level-exams-container {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

.level-exams-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 30px;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  border-bottom: 2px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  position: fixed;
  top: 48px; /* NavBar 的高度 */
  left: 0;
  right: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  width: 100%;
  gap: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.back-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30,144,255,0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30,144,255,0.3);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-display {
  display: flex;
  align-items: center;
}

.level-text {
  color: #1e90ff;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: right;
}

/* 考试类型选择器样式 */
.type-selector {
  display: flex;
  align-items: center;
}

.type-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.9) 0%, rgba(30, 144, 255, 0.8) 100%);
  padding: 4px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(135, 206, 235, 0.5);
}

.type-menu-item {
  background: transparent;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
}

.type-menu-item:hover {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.type-menu-item.active {
  background: rgba(255, 255, 255, 0.4);
  color: #ffffff;
  font-weight: 600;
}

.type-menu-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
}

/* 考试选择器样式 */
.exam-selector {
  margin-top: 0px;
  width: 100%;
}

.selector-tabs {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}

.exam-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  min-width: 120px;
  max-width: 200px;
}

.exam-tab:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: #1e90ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
}

.exam-tab:hover .exam-time-only {
  color: #1e90ff !important;
}

.exam-tab:hover .exam-title {
  color: #1e90ff !important;
}

.exam-tab:hover .exam-difficulty {
  color: #1e90ff !important;
}

.exam-tab.active {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border-color: #1e90ff;
  color: white;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
}

.exam-tab.active .exam-time-only {
  color: white !important;
}

.exam-tab.active .exam-title {
  color: white !important;
}

.exam-tab.active .exam-difficulty {
  color: rgba(255, 255, 255, 0.9) !important;
}

.exam-tab-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.exam-tab-content:has(.exam-number) {
  gap: 12px;
}

.exam-tab-content:not(:has(.exam-number)) {
  gap: 0;
  justify-content: center;
}

.exam-number {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: #1e90ff;
  flex-shrink: 0;
}

.exam-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.exam-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 专项考试标题颜色 */
.exam-tab[data-exam-type="专项"] .exam-title {
  color: #065f46;
}

/* 模拟考试标题颜色 */
.exam-tab[data-exam-type="模拟"] .exam-title {
  color: #d97706;
}

.exam-detail {
  font-size: 12px;
  color: #64748b;
  line-height: 1.2;
}

.exam-time {
  color: #059669;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.exam-time-only {
  color: #1e90ff;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 1px;
  text-align: center;
  width: 100%;
}

.exam-topic {
  color: #dc2626;
  font-weight: 500;
}

.exam-difficulty {
  color: #d97706;
  font-weight: 500;
}

.selector-underline {
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #1e90ff 50%, transparent 100%);
  margin-top: 16px;
  border-radius: 2px;
  opacity: 0.6;
}

.level-exams-content {
  flex: 1;
  padding: 24px 32px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-top: 80px; /* 为固定的header留出空间：60px(NavBar) + 20px(header) */
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #1e90ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 16px;
}

/* 考试详情布局 */
.exam-detail-layout {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 40px;
}

/* 考试详情卡片 */
.exam-detail-section {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 48px;
}

.selected-exam-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(30,144,255,0.12), 0 8px 32px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.selected-exam-card.breathing {
  animation: breathe 2s ease-in-out infinite;
}

.selected-exam-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 32px 80px rgba(30,144,255,0.25);
  border-color: #1e90ff;
  animation: none;
}

/* 呼吸动画 */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.selected-exam-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 36px;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 2px solid #b6e0fe;
  flex-shrink: 0;
}

.exam-name {
  margin: 0 0 12px 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.exam-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.type-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.type-真题 { background: rgba(30, 144, 255, 0.8); }
.type-模拟 { background: rgba(217, 119, 6, 0.8); }
.type-专项 { background: rgba(6, 95, 70, 0.8); }

.exam-actions-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.enter-exam-hint-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.enter-exam-hint-header:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.enter-exam-hint-header .hint-text {
  display: block;
}

.enter-exam-hint-header .hint-text-short {
  display: none;
}

.enter-exam-hint-header .hint-icon {
  font-size: 18px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.enter-exam-hint-header:hover .hint-icon {
  transform: translateX(4px);
}

.exam-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.level-badge {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.level-1 { background: rgba(224, 247, 250, 0.3); }
.level-2 { background: rgba(182, 224, 254, 0.3); }
.level-3 { background: rgba(209, 250, 255, 0.3); }
.level-4 { background: rgba(227, 242, 253, 0.3); }
.level-5 { background: rgba(179, 229, 252, 0.3); }
.level-6 { background: rgba(254, 243, 199, 0.3); }

.question-count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.exam-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.selected-exam-content {
  padding: 32px 36px 40px 36px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exam-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  gap: 12px;
}

.stat-item.exam-actions {
  align-items: center;
}

.stat-item:hover {
  background: #f1f5f9;
  border-color: #1e90ff;
}

.stat-label {
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  text-align: left;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
  justify-content: center;
}

.action-buttons .btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid #d1d5db;
}

.action-buttons .btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: rotate(45deg);
  transition: all 0.6s ease;
  opacity: 0;
}

.action-buttons .btn:hover::before {
  opacity: 1;
  animation: shimmer 1.5s ease-in-out;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}


/* 未选择状态占位符 */
.no-selection-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 24px;
  color: #64748b;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.no-selection-placeholder h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.no-selection-placeholder p {
  margin: 0;
  font-size: 18px;
}


/* 按钮样式 */
.btn {
  flex: 1;
  padding: 18px 24px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(107,114,128,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
  border: 3px solid #d1d5db;
}

.btn-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(30,144,255,0.25);
  border-color: #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #1e90ff;
}

.btn-info {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
  border: 3px solid #d1d5db;
}

.btn-info:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.25);
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .exam-detail-layout {
    padding: 0 20px;
  }
  
  .selected-exam-card {
    min-height: 350px;
  }
}

@media (max-width: 1200px) {
  .exam-detail-layout {
    padding: 0 20px;
  }
  
  .exam-detail-section {
    max-width: 700px;
  }
}

@media (max-width: 768px) {
  .level-exams-header {
    padding: 3px 20px;
  }
  
  .level-exams-content {
    margin-top: 65px;
    padding: 20px 16px;
  }

  .header-left {
    gap: 12px;
  }

  .type-nav {
    gap: 6px;
    padding: 3px 8px;
  }

  .type-menu-item {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 35px;
  }

  .exam-detail-layout {
    gap: 20px;
    padding: 0 16px;
  }

  .selected-exam-card {
    min-height: 300px;
  }

  .selected-exam-header {
    padding: 24px 28px;
    flex-direction: column;
    gap: 16px;
  }

  .enter-exam-hint-header {
    padding: 10px 16px;
    font-size: 14px;
  }

  .enter-exam-hint-header .hint-text {
    display: none;
  }

  .enter-exam-hint-header .hint-text-short {
    display: block;
  }

  .selected-exam-content {
    padding: 24px 28px 32px 28px;
  }

  .exam-detail-section {
    padding-top: 30px;
  }

  .header-top {
    margin-bottom: 3px;
  }

  .level-text {
    font-size: 1.5rem;
  }

  .exam-selector {
    margin-top: 0px;
  }

  .selector-tabs {
    gap: 12px;
  }

  .exam-tab {
    padding: 10px 12px;
    min-width: 100px;
    max-width: 160px;
  }

  .exam-tab-content {
    gap: 8px;
  }

  .exam-number {
    font-size: 16px;
  }

  .exam-title {
    font-size: 13px;
  }

  .exam-detail {
    font-size: 11px;
  }

  .exam-time-only {
    font-size: 14px;
  }
  
  .exam-name {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .level-exams-header {
    padding: 2px 16px;
  }

  .level-exams-content {
    margin-top: 48px;
    padding: 16px;
  }

  .header-left {
    gap: 8px;
  }

  .type-nav {
    gap: 4px;
    padding: 2px 6px;
  }

  .type-menu-item {
    padding: 3px 6px;
    font-size: 10px;
    min-width: 30px;
  }

  .selected-exam-card {
    min-height: 280px;
  }

  .enter-exam-hint-header {
    padding: 8px 12px;
    font-size: 13px;
  }

  .header-top {
    margin-bottom: 2px;
  }

  .level-text {
    font-size: 1.3rem;
  }

  .exam-selector {
    margin-top: 0px;
  }

  .selector-tabs {
    gap: 8px;
  }

  .exam-tab {
    padding: 8px 10px;
    min-width: 80px;
    max-width: 120px;
  }

  .exam-tab-content {
    gap: 6px;
  }

  .exam-number {
    font-size: 14px;
  }

  .exam-title {
    font-size: 12px;
  }

  .exam-detail {
    font-size: 10px;
  }

  .exam-time-only {
    font-size: 12px;
  }

  .exam-detail-section {
    padding-top: 25px;
  }
  
  .exam-name {
    font-size: 20px;
  }
}

.btn-teacher {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
  border: 3px solid #d1d5db;
}

.btn-teacher:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.25);
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
}
</style>
