<template>
  <div class="level-exams-container">
    <div class="level-exams-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          ← 返回
        </button>
        <h2>{{ getLevelText(level) }} 考试列表</h2>
      </div>
      <div class="header-right">
        <span class="exam-count">共 {{ exams.length }} 个考试</span>
      </div>
    </div>

    <div class="level-exams-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载考试列表...</p>
      </div>
      
      <div v-else-if="exams.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无考试</h3>
        <p>该等级还没有创建任何考试</p>
        <button @click="goToCreateExam" class="btn btn-primary">
          创建考试
        </button>
      </div>
      
      <div v-else class="exams-grid">
        <div 
          v-for="exam in exams" 
          :key="exam.id"
          class="exam-card elevate-card"
          @click="startExam(exam)"
        >
          <div class="exam-card-header">
            <div class="exam-info">
              <h3 class="exam-name">{{ exam.name }}</h3>
              <div class="exam-badges">
                <span class="level-badge" :class="`level-${exam.level}`">
                  {{ getLevelText(exam.level) }}
                </span>
                <span class="question-count-badge">
                  {{ exam.total_questions || 0 }} 题
                </span>
              </div>
            </div>
            <div class="exam-status">
              <span class="status-indicator">可参加</span>
            </div>
          </div>
          
          <div class="exam-card-content">
            <div class="exam-description">
              <p>{{ exam.description || '暂无描述' }}</p>
            </div>
            
            <div class="exam-stats">
              <div class="stat-item">
                <span class="stat-label">题目数量</span>
                <span class="stat-value">{{ exam.total_questions || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均难度</span>
                <span class="stat-value">{{ getAverageDifficulty(exam.questions) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">代码题</span>
                <span class="stat-value">{{ getCodeQuestionCount(exam.questions) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">文本题</span>
                <span class="stat-value">{{ getTextQuestionCount(exam.questions) }}</span>
              </div>
            </div>
          </div>
          
          <div class="exam-card-actions">
            <button @click.stop="viewExamDetail(exam)" class="btn btn-secondary">
              查看详情
            </button>
            <button @click.stop="viewSubmissions(exam)" class="btn btn-info">
              查看提交
            </button>
            <button @click.stop="startExam(exam)" class="btn btn-primary">
              开始考试
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 考试详情弹窗 -->
    <div v-if="showDetailDialog" class="exam-detail-modal" @click="closeDetailDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedExam?.name }}</h3>
          <button @click="closeDetailDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>考试信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">等级:</span>
                <span class="info-value">{{ getLevelText(selectedExam?.level) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">题目数量:</span>
                <span class="info-value">{{ selectedExam?.total_questions || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间:</span>
                <span class="info-value">{{ formatDate(selectedExam?.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>考试描述</h4>
            <p>{{ selectedExam?.description || '暂无描述' }}</p>
          </div>
          
          <div class="detail-section">
            <h4>题目统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">平均难度</span>
                <span class="stat-value">{{ getAverageDifficulty(selectedExam?.questions) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">代码题</span>
                <span class="stat-value">{{ getCodeQuestionCount(selectedExam?.questions) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">文本题</span>
                <span class="stat-value">{{ getTextQuestionCount(selectedExam?.questions) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailDialog" class="btn btn-secondary">关闭</button>
          <button @click="startExam(selectedExam)" class="btn btn-primary">开始考试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// 从路由参数获取等级
const level = ref(parseInt(route.params.level as string))

// 数据状态
const exams = ref<any[]>([])
const loading = ref(false)
const showDetailDialog = ref(false)
const selectedExam = ref<any>(null)

// 获取考试列表
async function fetchExams() {
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:3000/api/exams?level=${level.value}`)
    exams.value = response.data
  } catch (error: any) {
    console.error('获取考试列表失败:', error)
    alert('获取考试列表失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 等级文本
function getLevelText(level: number) {
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 格式化日期
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString()
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

// 开始考试
function startExam(exam: any) {
  router.push(`/exam/${exam.id}`)
}

// 查看考试详情
function viewExamDetail(exam: any) {
  selectedExam.value = exam
  showDetailDialog.value = true
}

// 关闭详情弹窗
function closeDetailDialog() {
  showDetailDialog.value = false
  selectedExam.value = null
}

// 查看提交记录
function viewSubmissions(exam: any) {
  // 跳转到提交记录页面，这里可以显示该考试的所有提交记录
  // 或者直接跳转到用户自己的提交记录
  const currentUser = getCurrentUser();
  if (currentUser) {
    // 跳转到该考试的提交记录页面
    router.push(`/submissions?exam_id=${exam.id}&user_id=${currentUser.id}`);
  } else {
    alert('请先登录');
  }
}

// 获取当前用户信息
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return null;
    }
  }
  
  // 如果没有用户信息，创建一个测试用户（仅用于测试）
  const testUser = {
    id: 1,
    username: 'test_user'
  };
  localStorage.setItem('currentUser', JSON.stringify(testUser));
  return testUser;
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
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.level-exams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: #1e90ff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(30, 144, 255, 0.1);
}

.header-left h2 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
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

.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  width: 100%;
  flex: 1;
}

.exam-card {
  background: white;
  border: 1.5px solid #b6e0fe;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10);
  transition: all 0.3s ease;
  cursor: pointer;
  height: fit-content;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px -2px rgba(30,144,255,0.18);
  border-color: #1e90ff;
}

.exam-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1.5px solid #b6e0fe;
  flex-shrink: 0;
}

.exam-name {
  margin: 0 0 12px 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.exam-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
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
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.exam-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.exam-card-content {
  padding: 20px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exam-description {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.exam-description p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.exam-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex: 1;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.stat-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
}

.exam-card-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

.btn-info {
  background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.btn-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

/* 模态框样式 */
.exam-detail-modal {
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
  max-width: 600px;
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

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .exams-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .level-exams-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 16px;
  }

  .header-left {
    width: 100%;
  }

  .level-exams-content {
    padding: 20px 16px;
  }

  .exams-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .exam-stats {
    grid-template-columns: 1fr;
  }

  .exam-card-actions {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .level-exams-header {
    padding: 16px;
  }

  .level-exams-content {
    padding: 16px;
  }

  .exam-card {
    min-height: 260px;
  }

  .exam-card-header {
    padding: 16px 20px;
  }

  .exam-card-content {
    padding: 16px 20px;
  }

  .exam-card-actions {
    padding: 16px 20px;
  }
}
</style>
