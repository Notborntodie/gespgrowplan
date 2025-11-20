<template>
  <div class="student-submissions-container">
    <div class="submissions-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          ← 返回
        </button>
        <h2>{{ examInfo.name || '所有学生提交记录' }}</h2>
      </div>
      <div class="header-right">
        <span class="submission-count">共 {{ submissions.length }} 次提交</span>
      </div>
    </div>

    <div class="submissions-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载提交记录...</p>
      </div>
      
      <div v-else-if="submissions.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无提交记录</h3>
        <p>该学生还没有参加过这个考试</p>
      </div>
      
      <div v-else class="submissions-table-container">
        <table class="submissions-table">
          <thead>
            <tr>
              <th>学生姓名</th>
              <th>尝试次数</th>
              <th>提交时间</th>
              <th>分数</th>
              <th>状态</th>
              <th>考试名称</th>
              <th>考试等级</th>
              <th>任务信息</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="submission in submissions" 
              :key="submission.id"
              class="submission-row"
              @click="viewSubmissionDetail(submission)"
            >
              <td>
                <div class="student-name-cell">
                  <span class="student-name-text">{{ submission.real_name || submission.username || '未知学生' }}</span>
                  <span class="student-username-text" v-if="submission.username">@{{ submission.username }}</span>
                </div>
              </td>
              <td>
                <span class="attempt-number">第 {{ submission.attempt_number }} 次</span>
              </td>
              <td class="date-cell">{{ formatDate(submission.submit_time) }}</td>
              <td>
                <div class="score-display" :class="getScoreClass(submission.score)">
                  <span class="score-value">{{ submission.score }}</span>
                  <span class="score-unit">分</span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getScoreClass(submission.score)">
                  {{ getScoreText(submission.score) }}
                </span>
              </td>
              <td>{{ submission.exam_name || '未知考试' }}</td>
              <td>
                <span class="exam-level">{{ getLevelText(submission.exam_level) }}</span>
              </td>
              <td>
                <div v-if="submission.task_id" class="task-info-cell">
                  <div class="task-badge">
                    <span class="task-icon">📋</span>
                    <span class="task-name">{{ submission.task_name || '任务' }}</span>
                  </div>
                  <div v-if="submission.plan_name" class="plan-name">{{ submission.plan_name }}</div>
                </div>
                <span v-else class="no-task">自主练习</span>
              </td>
              <td>
                <div class="action-buttons" @click.stop>
                  <button @click="viewSubmissionDetail(submission)" class="btn-action btn-view" title="查看详情">
                    <span>👀</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 提交详情弹窗 -->
    <div v-if="showDetailDialog" class="submission-detail-modal" @click="closeDetailDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedSubmission?.real_name || selectedSubmission?.username || '学生' }} - 第 {{ selectedSubmission?.attempt_number }} 次提交详情</h3>
          <button @click="closeDetailDialog" class="close-btn">×</button>
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
                <h4>{{ selectedSubmission?.exam_name || examInfo.name }}</h4>
                <p class="summary-date">{{ formatDateTime(selectedSubmission?.submit_time) }}</p>
                <p class="student-name">学生: {{ selectedSubmission?.real_name || selectedSubmission?.username || '未知学生' }}</p>
                <div v-if="selectedSubmission?.task_id" class="task-info-summary">
                  <div class="task-info-item">
                    <span class="task-label">任务:</span>
                    <span class="task-value">{{ selectedSubmission?.task_name || '未知任务' }}</span>
                  </div>
                  <div v-if="selectedSubmission?.plan_name" class="task-info-item">
                    <span class="task-label">计划:</span>
                    <span class="task-value">{{ selectedSubmission?.plan_name }}</span>
                  </div>
                </div>
                <div v-else class="task-info-summary">
                  <span class="no-task-text">自主练习</span>
                </div>
                <div class="summary-stats">
                  <span class="stat-item">
                    <span class="stat-label">总题数:</span>
                    <span class="stat-value">{{ submissionAnswers.length }}</span>
                  </span>
                  <span class="stat-item">
                    <span class="stat-label">正确:</span>
                    <span class="stat-value correct">{{ submissionAnswers.filter((a: any) => a.is_correct === 1 || a.is_correct === true).length }}</span>
                  </span>
                  <span class="stat-item">
                    <span class="stat-label">错误:</span>
                    <span class="stat-value incorrect">{{ submissionAnswers.filter((a: any) => !(a.is_correct === 1 || a.is_correct === true)).length }}</span>
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
                :key="answer.id || index"
                class="answer-item"
                :class="{ 'correct': answer.is_correct === 1 || answer.is_correct === true, 'incorrect': !(answer.is_correct === 1 || answer.is_correct === true) }"
              >
                <div class="answer-header">
                  <div class="question-header-left">
                    <span class="question-number">第 {{ answer.question_number || (index + 1) }} 题</span>
                    <div class="question-meta">
                      <span class="meta-tag" v-if="answer.level">等级: {{ getLevelText(answer.level) }}</span>
                      <span class="meta-tag" v-if="answer.difficulty">难度: {{ answer.difficulty }}</span>
                      <span class="meta-tag" v-if="answer.question_type">类型: {{ answer.question_type }}</span>
                    </div>
                  </div>
                  <span class="answer-status" :class="{ 'correct': answer.is_correct === 1 || answer.is_correct === true, 'incorrect': !(answer.is_correct === 1 || answer.is_correct === true) }">
                    {{ (answer.is_correct === 1 || answer.is_correct === true) ? '✓ 正确' : '✗ 错误' }}
                  </span>
                </div>
                
                <div class="question-content">
                  <div class="question-text">{{ answer.question_text }}</div>
                  <div v-if="answer.question_code" class="question-code">
                    <pre><code>{{ answer.question_code }}</code></pre>
                  </div>
                </div>

                <div class="options-section">
                  <div class="options-title">选项：</div>
                  <div class="options-list">
                    <div 
                      v-for="option in (answer.options || [])" 
                      :key="option.id"
                      class="option-item"
                      :class="{
                        'user-selected': option.value === answer.user_answer,
                        'correct-option': option.value === answer.correct_answer,
                        'wrong-selected': option.value === answer.user_answer && !(answer.is_correct === 1 || answer.is_correct === true)
                      }"
                    >
                      <span class="option-label">{{ option.label }}.</span>
                      <span class="option-text">{{ option.text }}</span>
                      <span class="option-indicator">
                        <span v-if="option.value === answer.correct_answer" class="correct-mark">✓ 正确答案</span>
                        <span v-if="option.value === answer.user_answer && (answer.is_correct === 1 || answer.is_correct === true)" class="user-mark correct">学生答案</span>
                        <span v-if="option.value === answer.user_answer && !(answer.is_correct === 1 || answer.is_correct === true)" class="user-mark wrong">学生答案</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="answer-summary">
                  <div class="answer-choice">
                    <span class="choice-label">学生答案:</span>
                    <span class="choice-value" :class="{ 'correct': answer.is_correct === 1 || answer.is_correct === true, 'incorrect': !(answer.is_correct === 1 || answer.is_correct === true) }">
                      {{ answer.user_answer }}
                    </span>
                  </div>
                  <div class="correct-answer">
                    <span class="choice-label">正确答案:</span>
                    <span class="choice-value correct">{{ answer.correct_answer }}</span>
                  </div>
                </div>

                <div v-if="answer.explanation" class="explanation-section">
                  <div class="explanation-title">解析：</div>
                  <div class="explanation-text">{{ answer.explanation }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailDialog" class="btn btn-secondary">关闭</button>
          <button 
            v-if="wrongQuestions.length > 0"
            @click="showExportDialog" 
            class="btn btn-export"
          >
            📥 导出错题
          </button>
        </div>
      </div>
    </div>

    <!-- 导出错题对话框 -->
    <ExportWrongQuestionsDialog
      :visible="showExportWrongQuestionsDialog"
      :submission="selectedSubmission"
      :wrongQuestions="wrongQuestions"
      @confirm="handleExportConfirm"
      @cancel="handleExportCancel"
    />
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ExportWrongQuestionsDialog from '@/components/admin/Dialog/ExportWrongQuestionsDialog.vue'
import docxExportService from '@/services/docxExportService'

const route = useRoute()
const router = useRouter()

// 从路由参数获取教师ID和考试ID
const teacherId = ref(parseInt(route.params.teacherId as string))
const examId = ref(route.query.exam_id ? parseInt(route.query.exam_id as string) : null)
const studentId = ref(route.query.student_id ? parseInt(route.query.student_id as string) : null)

// 数据状态
const examInfo = ref<any>({})
const submissions = ref<any[]>([])
const loading = ref(false)
const showDetailDialog = ref(false)
const selectedSubmission = ref<any>(null)
const submissionAnswers = ref<any[]>([])
const showExportWrongQuestionsDialog = ref(false)

// 计算错题列表
const wrongQuestions = computed(() => {
  return submissionAnswers.value.filter((answer: any) => 
    !(answer.is_correct === 1 || answer.is_correct === true)
  )
})

// 获取考试信息
async function fetchExamInfo() {
  if (!examId.value) return
  try {
    const response = await axios.get(`${BASE_URL}/exams/${examId.value}`)
    examInfo.value = response.data.exam || response.data
  } catch (error: any) {
    console.error('获取考试信息失败:', error)
  }
}

// 获取提交记录
async function fetchSubmissions() {
  loading.value = true
  try {
    const params: any = {}
    if (examId.value) {
      params.exam_id = examId.value
    }
    if (studentId.value) {
      params.student_id = studentId.value
    }
    
    const response = await axios.get(`${BASE_URL}/teacher/${teacherId.value}/submissions-list`, {
      params
    })
    
    // 处理响应数据，支持不同的响应格式
    let submissionsData = []
    if (response.data.success && response.data.data) {
      submissionsData = response.data.data
    } else if (Array.isArray(response.data)) {
      submissionsData = response.data
    } else if (response.data.data && Array.isArray(response.data.data)) {
      submissionsData = response.data.data
    }
    
    // 按提交时间倒序排列（最新的在前）
    submissions.value = submissionsData.sort((a: any, b: any) => {
      const timeA = new Date(a.submit_time).getTime()
      const timeB = new Date(b.submit_time).getTime()
      return timeB - timeA
    })
    
    // 如果只有一个考试，自动获取考试信息
    if (submissions.value.length > 0 && !examInfo.value.name && examId.value) {
      try {
        const examResponse = await axios.get(`${BASE_URL}/exams/${examId.value}`)
        examInfo.value = examResponse.data.exam || examResponse.data
      } catch (e) {
        console.error('获取考试信息失败:', e)
      }
    }
  } catch (error: any) {
    console.error('获取提交记录失败:', error)
    if (error.response?.status === 403) {
      alert('没有权限查看提交记录')
    } else {
      alert('获取提交记录失败: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    loading.value = false
  }
}

// 获取提交详情
async function fetchSubmissionDetail(submissionId: number) {
  try {
    // 从选中的提交记录中获取学生ID和真实姓名
    const submissionUserId = selectedSubmission.value?.user_id
    const originalRealName = selectedSubmission.value?.real_name
    const originalUsername = selectedSubmission.value?.username
    
    if (!submissionUserId) {
      alert('无法获取学生信息')
      return
    }
    
    const response = await axios.get(`${BASE_URL}/teacher/${teacherId.value}/students/${submissionUserId}/submissions/${submissionId}`)
    const data = response.data
    if (data.submission) {
      // 保留原来的真实姓名和用户名（如果详情接口返回的数据中没有）
      selectedSubmission.value = {
        ...data.submission,
        real_name: data.submission.real_name || originalRealName,
        username: data.submission.username || originalUsername
      }
    }
    const answers = data.answers || []
    // 按题目序号排序
    submissionAnswers.value = answers.sort((a: any, b: any) => {
      const numA = a.question_number || 0
      const numB = b.question_number || 0
      return numA - numB
    })
  } catch (error: any) {
    console.error('获取提交详情失败:', error)
    if (error.response?.status === 403) {
      alert('没有权限查看该提交详情')
    } else if (error.response?.status === 404) {
      alert('提交记录不存在')
    } else {
      alert('获取提交详情失败: ' + (error.response?.data?.error || error.message))
    }
  }
}

// 等级文本
function getLevelText(level: number) {
  if (!level) return '未知'
  if (level === 6) return 'CSP-J'
  return `GESP ${level}级`
}

// 格式化日期
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString()
}

// 获取分数等级
function getScoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

// 获取分数文本
function getScoreText(score: number) {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '及格'
  return '不及格'
}

// 返回上一页
function goBack() {
  router.back()
}

// 查看提交详情
async function viewSubmissionDetail(submission: any) {
  selectedSubmission.value = submission
  await fetchSubmissionDetail(submission.id)
  showDetailDialog.value = true
}

// 关闭详情弹窗
function closeDetailDialog() {
  showDetailDialog.value = false
  selectedSubmission.value = null
  submissionAnswers.value = []
  showExportWrongQuestionsDialog.value = false
}

// 显示导出对话框
function showExportDialog() {
  showExportWrongQuestionsDialog.value = true
}

// 处理导出确认
async function handleExportConfirm(customFilename?: string) {
  try {
    if (!selectedSubmission.value || wrongQuestions.value.length === 0) {
      alert('没有错题可导出')
      return
    }
    
    await docxExportService.exportWrongQuestions(
      selectedSubmission.value,
      wrongQuestions.value,
      customFilename
    )
    
    showExportWrongQuestionsDialog.value = false
    alert('错题导出成功！文件已下载到您的设备。')
  } catch (error: any) {
    console.error('导出错题失败:', error)
    alert('导出错题失败: ' + (error.message || '未知错误'))
  }
}

// 处理导出取消
function handleExportCancel() {
  showExportWrongQuestionsDialog.value = false
}

onMounted(() => {
  if (examId.value) {
    fetchExamInfo()
  }
  fetchSubmissions()
})
</script>

<style scoped>
.student-submissions-container {
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

.submissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
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
  box-sizing: border-box;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 16px;
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

.header-left h2 {
  margin: 0;
  color: #1e293b;
  font-weight: 700;
  font-size: 1.8rem;
  letter-spacing: 0.01em;
  font-family: 'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: left;
  line-height: 1.3;
  position: relative;
  padding-left: 0;
  margin-left: 0;
}

.submission-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.submissions-content {
  flex: 1;
  padding: 24px 32px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-top: 128px; /* 为固定的header留出空间：48px(NavBar) + 80px(header) */
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

/* 表格容器 */
.submissions-table-container {
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.submissions-table {
  width: 100%;
  border-collapse: collapse;
}

.submissions-table thead {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
}

.submissions-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: white;
  white-space: nowrap;
}

.submissions-table td {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1e293b;
}

.submission-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submission-row:hover {
  background: #f8fafc;
}

.attempt-number {
  font-weight: 600;
  color: #1e293b;
}

.date-cell {
  color: #64748b;
  font-size: 13px;
}

.score-display {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
}

.score-display.excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.score-display.good {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.score-display.pass {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.score-display.fail {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.score-value {
  font-size: 16px;
  line-height: 1;
}

.score-unit {
  font-size: 12px;
  line-height: 1;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-badge.excellent {
  background: rgba(34, 197, 94, 0.9);
}

.status-badge.good {
  background: rgba(59, 130, 246, 0.9);
}

.status-badge.pass {
  background: rgba(245, 158, 11, 0.9);
}

.status-badge.fail {
  background: rgba(239, 68, 68, 0.9);
}

.exam-level {
  font-weight: 600;
  color: #1e90ff;
}

.task-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.task-icon {
  font-size: 14px;
}

.task-name {
  font-weight: 600;
}

.plan-name {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

.no-task {
  color: #94a3b8;
  font-size: 12px;
  font-style: italic;
}

.task-info-summary {
  margin: 12px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.task-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.task-info-item:last-child {
  margin-bottom: 0;
}

.task-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.task-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
  padding: 4px 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border-radius: 6px;
}

.no-task-text {
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
}

.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.student-username-text {
  font-size: 12px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-view {
  background: #0ea5e9;
  color: white;
}

.btn-view:hover {
  background: #0284c7;
  transform: translateY(-1px);
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

/* 模态框样式 */
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
  max-width: 1400px;
  width: 95%;
  max-height: 95vh;
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
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
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
}

.summary-date {
  margin: 0 0 8px 0;
  color: #64748b;
  font-size: 14px;
}

.student-name {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
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
  color: #64748b;
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
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-item {
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.3s ease;
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
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.question-header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  padding: 4px 8px;
  background: rgba(30, 144, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #1e90ff;
  font-weight: 500;
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

.question-content {
  margin-bottom: 16px;
}

.question-text {
  margin-bottom: 12px;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}

.question-code {
  margin-top: 12px;
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.question-code pre {
  margin: 0;
  padding: 0;
}

.question-code code {
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.options-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.options-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.option-item.user-selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.option-item.correct-option {
  background: #f0fdf4;
  border-color: #22c55e;
}

.option-item.wrong-selected {
  background: #fef2f2;
  border-color: #ef4444;
}

.option-item.user-selected.correct-option {
  background: #f0fdf4;
  border-color: #22c55e;
}

.option-label {
  font-weight: 700;
  color: #1e293b;
  min-width: 24px;
  font-size: 15px;
}

.option-text {
  flex: 1;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.option-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.correct-mark {
  padding: 4px 8px;
  background: #22c55e;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.user-mark {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.user-mark.correct {
  background: #22c55e;
  color: white;
}

.user-mark.wrong {
  background: #ef4444;
  color: white;
}

.answer-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.answer-choice, .correct-answer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.choice-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
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

.explanation-section {
  margin-top: 16px;
  padding: 16px;
  background: #fefce8;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
}

.explanation-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.explanation-text {
  color: #78350f;
  font-size: 14px;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-export {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-export:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* 响应式设计调整 */
@media (max-width: 1200px) {
  .submissions-table {
    font-size: 13px;
  }
  
  .submissions-table th,
  .submissions-table td {
    padding: 12px 8px;
  }
}

@media (max-width: 768px) {
  .submissions-header {
    padding: 15px 20px;
    top: 48px;
  }
  
  .submissions-content {
    margin-top: 108px;
    padding: 20px 16px;
  }

  .submissions-table-container {
    overflow-x: auto;
  }

  .submissions-table {
    min-width: 800px;
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
    width: 98%;
    max-width: 98%;
    max-height: 98vh;
    margin: 10px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .answer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-meta {
    flex-direction: column;
  }

  .option-item {
    flex-wrap: wrap;
    padding: 10px 12px;
  }

  .option-indicator {
    width: 100%;
    justify-content: flex-start;
    margin-top: 8px;
  }

  .question-code {
    padding: 12px;
    font-size: 12px;
  }

  .options-section {
    padding: 12px;
  }

  .explanation-section {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .submissions-header {
    padding: 16px;
  }

  .submissions-content {
    padding: 16px;
    margin-top: 100px;
  }

  .submissions-table-container {
    border-radius: 8px;
  }

  .submissions-table th,
  .submissions-table td {
    padding: 10px 6px;
    font-size: 12px;
  }

  .score-display {
    padding: 4px 8px;
  }

  .score-value {
    font-size: 14px;
  }

  .score-unit {
    font-size: 10px;
  }

  .status-badge {
    padding: 4px 8px;
    font-size: 11px;
  }

  .option-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .option-label {
    font-size: 14px;
  }

  .option-text {
    width: 100%;
  }

  .question-code code {
    font-size: 11px;
  }
}
</style>

