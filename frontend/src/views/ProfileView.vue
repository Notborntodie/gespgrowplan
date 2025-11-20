
<template>
  <div class="profile-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>个人中心</h2>
      </div>
      <nav class="sidebar-nav">
        <button 
          v-for="item in menuItems" 
          :key="item.key"
          @click="activeSection = item.key"
          :class="['nav-item', { active: activeSection === item.key }]"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 个人信息 -->
      <section v-if="activeSection === 'profile'" class="content-section">
        <div class="profile-header">
          <h2>个人信息</h2>
          <p>欢迎回来，{{ userInfo?.real_name || userInfo?.username || '用户' }}！</p>
        </div>
        
        <div class="profile-content">
          <!-- 用户信息卡片 -->
          <div class="info-card">
            <h3>基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>用户名：</label>
                <span>{{ userInfo?.username || '未知' }}</span>
              </div>
              <div class="info-item" v-if="userInfo?.real_name">
                <label>真实姓名：</label>
                <span>{{ userInfo.real_name }}</span>
              </div>
              <div class="info-item">
                <label>邮箱：</label>
                <span>{{ userInfo?.email || '未设置' }}</span>
              </div>
              <div class="info-item">
                <label>角色：</label>
                <span class="role-badge" :class="getUserRoleClass()">
                  {{ getUserRoleDisplayName() }}
                </span>
              </div>
              <div class="info-item">
                <label>注册时间：</label>
                <span>{{ formatDate(userInfo?.created_at) }}</span>
              </div>
            </div>
          </div>
  
          <!-- 练习统计卡片 -->
          <div class="stats-card">
            <h3>练习统计</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ totalSubmissions }}</div>
                <div class="stat-label">总提交次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ completedExams }}</div>
                <div class="stat-label">完成考试数</div>
              </div>
            </div>
          </div>

          <!-- 账户操作卡片 -->
          <div class="actions-card">
            <h3>账户操作</h3>
            <div class="actions-grid">
              <button @click="changePassword" class="action-btn secondary">
                <span class="action-icon">🔒</span>
                <span>修改密码</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 练习记录 -->
      <section v-if="activeSection === 'records'" class="content-section">
        <h2>练习记录</h2>
        <div class="records-content">
  
          <!-- 所有提交记录 -->
          <div class="recent-submissions-card">
            <h3>所有提交记录</h3>
            <div v-if="loading" class="loading">
              <div class="loading-spinner"></div>
              <span>加载中...</span>
            </div>
            <div v-else-if="recentSubmissions.length === 0" class="empty-state">
              <p>暂无提交记录</p>
            </div>
            <div v-else class="submissions-list">
              <div 
                v-for="submission in recentSubmissions" 
                :key="submission.id"
                class="submission-item"
                @click="viewSubmissionDetail(submission)"
              >
                <div class="submission-info">
                  <h4>{{ submission.exam_name || '未知考试' }}</h4>
                  <p class="submission-time">提交时间：{{ formatDate(submission.submit_time) }}</p>
                  <p class="attempt-info">第 {{ submission.attempt_number || 1 }} 次尝试</p>
                  <div class="submission-stats">
                    <span class="stat-item">
                      <span class="stat-label">等级:</span>
                      <span class="stat-value">{{ getLevelText(submission.exam_level) }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">得分:</span>
                      <span class="stat-value">{{ submission.score || 0 }}分</span>
                    </span>
                  </div>
                </div>
                <div class="submission-score">
                  <span class="score" :class="getScoreClass(submission.score)">
                    {{ submission.score || 0 }}分
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 查看错题 -->
      <section v-if="activeSection === 'wrong-questions'" class="content-section">
        <div class="wrong-questions-header">
          <h2>查看错题</h2>
          <div class="filter-controls">
            <div class="filter-group">
              <label for="level-filter">按等级筛选：</label>
              <select id="level-filter" v-model="selectedLevel" @change="onLevelChange" class="filter-select">
                <option value="all">全部等级</option>
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">CSP-J</option>
              </select>
            </div>
            <div class="filter-group" v-if="availableExams.length > 0">
              <label for="exam-filter">按考试筛选：</label>
              <select id="exam-filter" v-model="selectedExam" @change="fetchWrongQuestions" class="filter-select">
                <option value="all">全部考试</option>
                <option v-for="exam in availableExams" :key="exam.exam_name" :value="exam.exam_name">
                  {{ exam.exam_name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="wrong-questions-content">
          <div v-if="wrongQuestionsLoading" class="loading">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else-if="wrongQuestions.length === 0" class="empty-state">
            <p>暂无错题记录</p>
          </div>
          <div v-else class="wrong-questions-list">
            <div 
              v-for="(question, index) in wrongQuestions" 
              :key="question.id"
              class="wrong-question-item"
            >
              <div class="question-header">
                <div class="question-info">
                  <span class="question-number">第 {{ index + 1 }} 题</span>
                  <span class="question-level">{{ getLevelText(question.level) }}</span>
                  <span class="question-difficulty" :class="question.difficulty">
                    {{ getDifficultyText(question.difficulty) }}
                  </span>
                </div>
                <div class="question-meta">
                  <span class="exam-name">{{ question.exam_name }}</span>
                  <span class="answered-time">{{ formatDate(question.answered_at) }}</span>
                </div>
              </div>
              
              <div class="question-content">
                <div class="question-text">{{ question.question_text }}</div>
                
                <div v-if="question.question_type === 'code' && question.question_code" class="question-code">
                  <pre><code>{{ question.question_code }}</code></pre>
                </div>
                
                <div class="question-options">
                  <div 
                    v-for="option in question.options" 
                    :key="option.id || option.label || option.option_label"
                    class="option-item"
                    :class="{ 
                      'correct': (option.value || option.option_value) === question.correct_answer,
                      'user-answer': (option.value || option.option_value) === question.user_answer,
                      'wrong': (option.value || option.option_value) === question.user_answer && (option.value || option.option_value) !== question.correct_answer
                    }"
                  >
                    <span class="option-label">{{ option.label || option.option_label }}.</span>
                    <span class="option-text">{{ option.text || option.option_text }}</span>
                    <div class="option-status">
                      <span v-if="(option.value || option.option_value) === question.correct_answer" class="status-badge correct-badge">正确答案</span>
                      <span v-if="(option.value || option.option_value) === question.user_answer && (option.value || option.option_value) !== question.correct_answer" class="status-badge wrong-badge">您的答案</span>
                      <span v-if="(option.value || option.option_value) !== question.correct_answer && (option.value || option.option_value) !== question.user_answer" class="status-badge other-badge">其他选项</span>
                    </div>
                  </div>
                </div>
                
                <div class="answer-explanation">
                  <h4>解析：</h4>
                  <p>{{ question.explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </main>
      
      <!-- 修改密码对话框 -->
      <ChangePasswordDialog
        :is-visible="showChangePasswordDialog"
        :user-id="userInfo?.id"
        @close="showChangePasswordDialog = false"
        @success="handlePasswordChangeSuccess"
      />

      <!-- 提交详情弹窗 -->
      <div v-if="showSubmissionDetailDialog" class="submission-detail-modal" @click="closeSubmissionDetailDialog">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>第 {{ selectedSubmission?.attempt_number || 1 }} 次提交详情</h3>
            <button @click="closeSubmissionDetailDialog" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-summary">
              <div class="summary-header">
                <div class="summary-score">
                  <div class="score-circle-large" :class="getScoreClass(selectedSubmission?.score)">
                    <span class="score-number-large">{{ selectedSubmission?.score }}</span>
                    <span class="score-label-large">分</span>
                  </div>
                </div>
                <div class="summary-info">
                  <h4>{{ selectedSubmission?.exam_name || '未知考试' }}</h4>
                  <p class="summary-date">{{ formatDate(selectedSubmission?.submit_time) }}</p>
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-label">等级:</span>
                      <span class="stat-value">{{ getLevelText(selectedSubmission?.exam_level) }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">尝试次数:</span>
                      <span class="stat-value">{{ selectedSubmission?.attempt_number || 1 }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="answers-section">
              <h4>答题详情</h4>
              <div class="answers-list">
                <div 
                  v-for="(answer, index) in submissionAnswers" 
                  :key="index"
                  class="answer-item"
                  :class="{ 'correct': answer.is_correct, 'incorrect': !answer.is_correct }"
                >
                  <div class="answer-header">
                    <span class="question-number">第 {{ answer.question_number || (index + 1) }} 题</span>
                    <span class="answer-status" :class="{ 'correct': answer.is_correct, 'incorrect': !answer.is_correct }">
                      {{ answer.is_correct ? '✓ 正确' : '✗ 错误' }}
                    </span>
                  </div>
                  <div class="question-text">{{ answer.question_text }}</div>
                  <div class="answer-details">
                    <div class="answer-choice">
                      <span class="choice-label">您的答案:</span>
                      <span class="choice-value" :class="{ 'correct': answer.is_correct, 'incorrect': !answer.is_correct }">
                        {{ answer.user_answer }}
                      </span>
                    </div>
                    <div v-if="!answer.is_correct" class="correct-answer">
                      <span class="choice-label">正确答案:</span>
                      <span class="choice-value correct">{{ answer.correct_answer }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeSubmissionDetailDialog" class="btn btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">import { BASE_URL } from '@/config/api'

  import { ref, onMounted, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import ChangePasswordDialog from '../components/Dialog/ChangePasswordDialog.vue'
  
  const router = useRouter()
  
  // 响应式数据
  const userInfo = ref<any>(null)
  const recentSubmissions = ref<any[]>([])
  const loading = ref(false)
  const totalSubmissions = ref(0)
  const correctAnswers = ref(0)
  const completedExams = ref(0)
  const showChangePasswordDialog = ref(false)
  const activeSection = ref('profile')
  const showSubmissionDetailDialog = ref(false)
  const selectedSubmission = ref<any>(null)
  const submissionAnswers = ref<any[]>([])
  const wrongQuestions = ref<any[]>([])
  const wrongQuestionsLoading = ref(false)
  const selectedLevel = ref('all')
  const selectedExam = ref('all')
  const availableExams = ref<any[]>([])
  
  // 侧边栏菜单项
  const menuItems = [
    { key: 'profile', label: '个人信息' },
    { key: 'records', label: '练习记录' },
    { key: 'wrong-questions', label: '查看错题' }
  ]
  
  // 计算属性
  const accuracy = computed(() => {
    if (totalSubmissions.value === 0) return 0
    return Math.round((correctAnswers.value / totalSubmissions.value) * 100)
  })
  
  // 获取用户信息
  const getUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      userInfo.value = JSON.parse(userInfoStr)
    }
  }
  
  // 获取用户提交记录
  const fetchUserSubmissions = async () => {
    if (!userInfo.value) return
    
    loading.value = true
    try {
      const response = await axios.get(`${BASE_URL}/submissions`, {
        params: {
          user_id: userInfo.value.id
          // 移除limit参数，获取所有提交记录
        }
      })
      
      recentSubmissions.value = response.data || []
      
      // 计算统计数据
      calculateStats(response.data || [])
    } catch (error: any) {
      console.error('获取提交记录失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  // 计算统计数据
  const calculateStats = (submissions: any[]) => {
    totalSubmissions.value = submissions.length
    correctAnswers.value = submissions.filter(s => s.score && s.score > 0).length
    completedExams.value = new Set(submissions.map(s => s.exam_id)).size
  }
  
  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知'
    return new Date(dateStr).toLocaleString('zh-CN')
  }
  
  // 获取分数样式类
  const getScoreClass = (score: number) => {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 60) return 'pass'
    return 'fail'
  }

  // 等级文本
  const getLevelText = (level: number) => {
    if (level === 6) return 'CSP-J'
    return `GESP ${level}级`
  }

  // 难度文本
  const getDifficultyText = (difficulty: string) => {
    const difficultyMap: { [key: string]: string } = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    }
    return difficultyMap[difficulty] || difficulty
  }
  
  // 获取用户角色显示名称
  const getUserRoleDisplayName = () => {
    if (!userInfo.value) return '未知'
    
    // 优先使用 roles 数组中的 display_name
    if (userInfo.value.roles && userInfo.value.roles.length > 0) {
      return userInfo.value.roles[0].display_name || userInfo.value.roles[0].name
    }
    
    // 兼容旧的数据结构
    if (userInfo.value.role) {
      return userInfo.value.role === 'admin' ? '管理员' : '普通用户'
    }
    
    return '普通用户'
  }
  
  // 获取用户角色样式类
  const getUserRoleClass = () => {
    if (!userInfo.value) return 'user'
    
    // 检查是否为管理员
    const isAdmin = userInfo.value.role_names?.includes('admin') || 
                    userInfo.value.roles?.some((role: any) => role.name === 'admin') ||
                    userInfo.value.role === 'admin'
    
    return isAdmin ? 'admin' : 'user'
  }
  
  // 获取提交详情
  const fetchSubmissionDetail = async (submissionId: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/submissions/${submissionId}`)
      // API返回的数据结构是 { submission: {...}, answers: [...] }
      submissionAnswers.value = response.data.answers || []
      // 更新selectedSubmission的详细信息
      if (response.data.submission) {
        selectedSubmission.value = { ...selectedSubmission.value, ...response.data.submission }
      }
    } catch (error: any) {
      console.error('获取提交详情失败:', error)
      alert('获取提交详情失败: ' + (error.response?.data?.error || error.message))
    }
  }

  // 查看提交详情
  const viewSubmissionDetail = async (submission: any) => {
    selectedSubmission.value = submission
    await fetchSubmissionDetail(submission.id)
    showSubmissionDetailDialog.value = true
  }

  // 关闭提交详情弹窗
  const closeSubmissionDetailDialog = () => {
    showSubmissionDetailDialog.value = false
    selectedSubmission.value = null
    submissionAnswers.value = []
  }
  
  
  // 修改密码
  const changePassword = () => {
    showChangePasswordDialog.value = true
  }
  
  // 处理密码修改成功
  const handlePasswordChangeSuccess = () => {
    // 可以在这里添加一些成功后的处理逻辑
    console.log('密码修改成功')
  }

  // 获取用户错题
  const fetchWrongQuestions = async () => {
    if (!userInfo.value) return
    
    wrongQuestionsLoading.value = true
    try {
      const params: any = {
        user_id: userInfo.value.id,
        limit: 50 // 限制返回数量
      }
      
      // 如果选择了特定等级，添加level参数
      if (selectedLevel.value !== 'all') {
        params.level = parseInt(selectedLevel.value)
      }
      
      const response = await axios.get(`${BASE_URL}/wrong-questions`, {
        params
      })
      
      // 对错题进行去重处理，根据question_id去重，保留最新的错误记录
      let rawQuestions = response.data || []
      const deduplicatedQuestions = deduplicateWrongQuestions(rawQuestions)
      
      // 如果选择了特定考试，进一步筛选
      if (selectedExam.value !== 'all') {
        rawQuestions = deduplicatedQuestions.filter(question => question.exam_name === selectedExam.value)
      } else {
        rawQuestions = deduplicatedQuestions
      }
      
      wrongQuestions.value = rawQuestions
      
      // 更新可用考试列表（基于去重后的数据）
      updateAvailableExams(deduplicatedQuestions)
      
      console.log(`去重前错题数量: ${response.data?.length || 0}, 去重后错题数量: ${deduplicatedQuestions.length}, 考试筛选后: ${rawQuestions.length}`)
    } catch (error: any) {
      console.error('获取错题失败:', error)
      wrongQuestions.value = []
    } finally {
      wrongQuestionsLoading.value = false
    }
  }

  // 错题去重函数
  const deduplicateWrongQuestions = (questions: any[]) => {
    const questionMap = new Map()
    
    questions.forEach(question => {
      const questionId = question.id // 使用题目的id作为唯一标识
      const answeredAt = new Date(question.answered_at).getTime()
      
      // 如果题目不存在或者当前记录更新，则更新记录
      if (!questionMap.has(questionId) || answeredAt > new Date(questionMap.get(questionId).answered_at).getTime()) {
        questionMap.set(questionId, question)
      }
    })
    
    // 转换为数组并按answered_at降序排序
    return Array.from(questionMap.values()).sort((a, b) => 
      new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
    )
  }

  // 等级变化时的处理函数
  const onLevelChange = async () => {
    // 重置考试选择
    selectedExam.value = 'all'
    
    // 获取错题数据
    await fetchWrongQuestions()
  }

  // 更新可用考试列表
  const updateAvailableExams = (questions: any[] = []) => {
    // 如果没有传入questions，使用当前的错题数据
    const questionsToProcess = questions.length > 0 ? questions : wrongQuestions.value
    
    if (!questionsToProcess || questionsToProcess.length === 0) {
      availableExams.value = []
      return
    }

    // 从错题中提取唯一的考试名称
    const examSet = new Set()
    questionsToProcess.forEach(question => {
      if (question.exam_name) {
        examSet.add(question.exam_name)
      }
    })

    // 转换为数组并按名称排序
    const examArray = Array.from(examSet)
    availableExams.value = examArray.map(examName => ({
      exam_name: examName as string
    })).sort((a: any, b: any) => a.exam_name.localeCompare(b.exam_name))
  }
  
  onMounted(() => {
    getUserInfo()
    fetchUserSubmissions()
  })

  // 监听activeSection变化，当切换到错题页面时加载数据
  watch(activeSection, (newSection) => {
    if (newSection === 'wrong-questions') {
      fetchWrongQuestions()
    }
  })
  </script>
  
  <style scoped>
  /* 添加CSS变量定义，与AdminView保持一致 */
  :root {
    --primary-color: #1e90ff; /* 天蓝色 */
    --primary-dark: #0066cc; /* 深天蓝色 */
    --primary-light: #87ceeb; /* 浅天蓝色 */
    --secondary-color: #f59e0b;
    --success-color: #10b981;
    --error-color: #ef4444;
    --warning-color: #f59e0b;
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-tertiary: #94a3b8;
    --border-primary: #e2e8f0;
    --border-secondary: #cbd5e1;
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --transition-normal: 250ms ease;
  }

  /* 统一背景为渐变，与AdminView一致 */
  .profile-layout {
    display: flex;
    min-height: 100vh;
    width: 100vw;
    background: linear-gradient(135deg, var(--primary-light, #87ceeb) 0%, var(--bg-secondary, #f8fafc) 100%);
    box-sizing: border-box;
  }

  /* 侧边栏样式 - 与AdminView保持一致 */
  .sidebar {
    width: 200px;
    background: linear-gradient(180deg, rgba(30, 144, 255, 0.08) 0%, rgba(135, 206, 235, 0.05) 100%);
    backdrop-filter: blur(10px);
    color: #374151;
    padding: 24px 0;
    position: fixed;
    left: 0;
    top: 48px; /* NavBar 的高度 */
    height: calc(100vh - 48px);
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 0 20px rgba(30, 144, 255, 0.1);
    border-right: 1px solid rgba(30, 144, 255, 0.1);
  }

  .sidebar-header {
    padding: 0 24px 24px;
    border-bottom: 1px solid rgba(30, 144, 255, 0.1);
    margin-bottom: 16px;
  }

  .sidebar-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .sidebar-nav {
    padding: 8px 0;
  }

  .nav-item {
    width: 100%;
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #475569;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.3px;
    position: relative;
    margin: 4px 0;
  }

  .nav-item:hover {
    background: rgba(30, 144, 255, 0.12);
    color: #1e293b;
    transform: translateX(4px);
  }

  .nav-item.active {
    background: linear-gradient(90deg, rgba(30, 144, 255, 0.2) 0%, rgba(135, 206, 235, 0.15) 100%);
    color: #1e90ff;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #1e90ff 0%, #87ceeb 100%);
    border-radius: 0 2px 2px 0;
  }

  .main-content {
    flex: 1;
    margin-left: 200px;
    padding: 40px 3vw 0 3vw;
    background: transparent;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .content-section {
    background: #f8fafc;
    padding: 32px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    max-width: 1400px;
    margin: 0 auto 32px auto;
    border: 1px solid #e2e8f0;
  }

  .content-section h2 {
    margin-top: 0;
    color: #1e293b;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 15px;
  }
  
  .profile-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .profile-header h2 {
    font-size: 1.8rem;
    color: #1e293b;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .profile-header p {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
  }
  
  .profile-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }
  
  .info-card,
  .stats-card,
  .recent-submissions-card,
  .actions-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    border: 1px solid #e2e8f0;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .info-card:hover,
  .stats-card:hover,
  .recent-submissions-card:hover,
  .actions-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -2px rgb(0 0 0 / 0.15);
  }
  
  .info-card h3,
  .stats-card h3,
  .recent-submissions-card h3,
  .actions-card h3 {
    color: #1e293b;
    margin-bottom: 16px;
    font-size: 1.25rem;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }
  
  .info-grid {
    display: grid;
    gap: 15px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .info-item label {
    font-weight: 600;
    color: #4a5568;
  }
  
  .info-item span {
    color: #2d3748;
  }
  
  .role-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .role-badge.admin {
    background: #fed7d7;
    color: #c53030;
  }
  
  .role-badge.user {
    background: #bee3f8;
    color: #2b6cb0;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .stat-item {
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.08) 0%, rgba(135, 206, 235, 0.05) 100%);
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 2px solid rgba(30, 144, 255, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
  }
  
  .stat-item:hover {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.12) 0%, rgba(135, 206, 235, 0.08) 100%);
    border-color: #1e90ff;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(30, 144, 255, 0.15);
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(30, 144, 255, 0.2);
  }
  
  .stat-label {
    font-size: 1rem;
    color: #1e90ff;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .submissions-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .submission-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.03) 100%);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid rgba(30, 144, 255, 0.2);
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.1);
    backdrop-filter: blur(10px);
  }
  
  .submission-item:hover {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.08) 100%);
    border-color: #1e90ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
  }
  
  .submission-info h4 {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-size: 1.1rem;
    font-weight: 600;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .submission-time {
    margin: 0 0 4px 0;
    color: #1e90ff;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .submission-info p {
    margin: 0;
    color: #1e90ff;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .submission-score .score {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 1.1rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .score.excellent {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
  }
  
  .score.good {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }
  
  .score.pass {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }
  
  .score.fail {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .action-btn.secondary {
    background: #f7fafc;
    color: #4a5568;
    border: 2px solid #e2e8f0;
  }
  
  .action-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .action-btn.primary:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  }
  
  .action-btn.secondary:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }
  
  .action-icon {
    font-size: 1.5rem;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 40px;
    color: #718096;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #718096;
  }
  
  .empty-state p {
    font-size: 1.1rem;
    margin: 0;
  }

  .attempt-info {
    font-size: 0.9rem;
    color: #64748b;
    margin: 4px 0 8px 0;
  }

  .submission-stats {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .submission-stats .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.05) 100%);
    border-radius: 6px;
    border: 1px solid rgba(30, 144, 255, 0.2);
    backdrop-filter: blur(5px);
  }

  .submission-stats .stat-label {
    font-size: 0.8rem;
    color: #1e90ff;
    font-weight: 600;
  }

  .submission-stats .stat-value {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1e293b;
  }

  .submission-stats .stat-value.correct {
    color: #22c55e;
  }

  .submission-stats .stat-value.incorrect {
    color: #ef4444;
  }

  /* 提交详情弹窗样式 */
  .submission-detail-modal {
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

  .modal-content {
    background: white;
    border-radius: 18px;
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.3s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .modal-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .detail-summary {
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.03) 100%);
    border-radius: 12px;
    border: 1px solid rgba(30, 144, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .summary-header {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .summary-score {
    flex-shrink: 0;
  }

  .score-circle-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: 700;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .score-circle-large.excellent {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }

  .score-circle-large.good {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .score-circle-large.pass {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .score-circle-large.fail {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .score-number-large {
    font-size: 2rem;
    line-height: 1;
  }

  .score-label-large {
    font-size: 1rem;
    margin-top: -4px;
  }

  .summary-info {
    flex: 1;
  }

  .summary-info h4 {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .summary-date {
    margin: 0 0 12px 0;
    color: #1e90ff;
    font-size: 14px;
    font-weight: 500;
  }

  .summary-stats {
    display: flex;
    gap: 16px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #1e90ff;
    font-weight: 600;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }

  .stat-value.correct {
    color: #22c55e;
  }

  .stat-value.incorrect {
    color: #ef4444;
  }

  .answers-section {
    margin-top: 24px;
  }

  .answers-section h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 2px solid rgba(30, 144, 255, 0.3);
    padding-bottom: 8px;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .answers-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .answer-item {
    padding: 16px;
    border-radius: 12px;
    border: 2px solid rgba(30, 144, 255, 0.2);
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.03) 0%, rgba(135, 206, 235, 0.02) 100%);
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
  }

  .answer-item.correct {
    border-color: #22c55e;
    background: #f0fdf4;
  }

  .answer-item.incorrect {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .answer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .question-number {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .answer-status {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .answer-status.correct {
    background: #22c55e;
    color: white;
  }

  .answer-status.incorrect {
    background: #ef4444;
    color: white;
  }

  .question-text {
    margin-bottom: 12px;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
  }

  .answer-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .answer-choice, .correct-answer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .choice-label {
    font-size: 14px;
    color: #1e90ff;
    font-weight: 600;
  }

  .choice-value {
    font-size: 14px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    background: #e2e8f0;
  }

  .choice-value.correct {
    background: #22c55e;
    color: white;
  }

  .choice-value.incorrect {
    background: #ef4444;
    color: white;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid rgba(30, 144, 255, 0.2);
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.03) 100%);
    backdrop-filter: blur(10px);
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(107,114,128,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-secondary {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
  }

  .btn-secondary:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107,114,128,0.3);
  }
  
  @media (max-width: 768px) {
    .sidebar {
      width: 200px;
    }
    
    .main-content {
      margin-left: 200px;
      padding: 20px;
    }
    
    .profile-header h2 {
      font-size: 1.5rem;
    }
    
    .profile-content {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .info-card,
    .stats-card,
    .recent-submissions-card,
    .actions-card {
      padding: 20px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .stat-item {
      padding: 20px;
    }
    
    .stat-number {
      font-size: 2rem;
    }
    
    .actions-grid {
      grid-template-columns: 1fr;
    }

    .summary-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .summary-stats {
      justify-content: center;
    }

    .modal-content {
      width: 95%;
      margin: 20px;
    }

    .modal-footer {
      flex-direction: column;
    }

    .submission-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .submission-score {
      align-self: flex-end;
    }

    .submission-stats {
      justify-content: flex-start;
    }
  }

  /* 错题页面样式 */
  .wrong-questions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .wrong-questions-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-group label {
    font-weight: 600;
    color: #1e90ff;
    font-size: 1rem;
    white-space: nowrap;
  }

  .filter-select {
    padding: 8px 16px;
    border: 2px solid rgba(30, 144, 255, 0.3);
    border-radius: 8px;
    background: white;
    color: #1e293b;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140px;
  }

  .filter-select:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .level-select {
    padding: 8px 16px;
    border: 2px solid rgba(30, 144, 255, 0.3);
    border-radius: 8px;
    background: white;
    color: #1e293b;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140px;
  }

  .level-select:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .wrong-questions-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .wrong-question-item {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(30, 144, 255, 0.1);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .wrong-question-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    border-color: rgba(30, 144, 255, 0.3);
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(30, 144, 255, 0.1);
    flex-wrap: wrap;
    gap: 12px;
  }

  .question-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .question-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e90ff;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.05) 100%);
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(30, 144, 255, 0.2);
  }

  .question-level {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e90ff;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .question-difficulty {
    font-size: 0.85rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .question-difficulty.easy {
    background: #dcfce7;
    color: #166534;
  }

  .question-difficulty.medium {
    background: #fef3c7;
    color: #92400e;
  }

  .question-difficulty.hard {
    background: #fee2e2;
    color: #991b1b;
  }

  .question-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    text-align: right;
  }

  .exam-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
  }

  .answered-time {
    font-size: 0.8rem;
    color: #64748b;
  }

  .question-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question-text {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #1e293b;
    font-weight: 500;
  }

  .question-code {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
  }

  .question-code pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #1e293b;
  }

  .question-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    background: #f8fafc;
    transition: all 0.3s ease;
    position: relative;
  }

  .option-item.correct {
    background: #f0fdf4;
    border-color: #22c55e;
    color: #166534;
  }

  .option-item.user-answer {
    background: #fef2f2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .option-item.wrong {
    background: #fef2f2;
    border-color: #ef4444;
    color: #991b1b;
  }

  /* 为所有选项添加默认样式，确保可见性 */
  .option-item:not(.correct):not(.user-answer):not(.wrong) {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #374151;
  }

  .option-label {
    font-weight: 700;
    font-size: 1rem;
    min-width: 24px;
    color: #1e90ff;
  }

  .option-text {
    flex: 1;
    font-size: 1rem;
    font-weight: 500;
  }

  .option-status {
    margin-left: auto;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .correct-badge {
    background: #22c55e;
    color: white;
  }

  .wrong-badge {
    background: #ef4444;
    color: white;
  }

  .other-badge {
    background: #6b7280;
    color: white;
  }

  .answer-explanation {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.03) 100%);
    border: 1px solid rgba(30, 144, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    margin-top: 8px;
  }

  .answer-explanation h4 {
    margin: 0 0 8px 0;
    color: #1e90ff;
    font-size: 1rem;
    font-weight: 600;
  }

  .answer-explanation p {
    margin: 0;
    color: #374151;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .wrong-questions-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-controls {
      width: 100%;
      justify-content: space-between;
    }

    .level-select {
      min-width: 120px;
    }

    .question-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .question-meta {
      align-items: flex-start;
      text-align: left;
    }

    .question-info {
      width: 100%;
      justify-content: flex-start;
    }

    .wrong-question-item {
      padding: 20px;
    }

    .question-code {
      padding: 12px;
    }

    .question-code pre {
      font-size: 0.8rem;
    }
  }
  </style>