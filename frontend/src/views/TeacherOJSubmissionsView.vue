<template>
  <div class="oj-submissions-container">
    <div class="submissions-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          ← 返回
        </button>
        <h2>{{ problemInfo.title ? problemInfo.title + ' - 学生提交记录' : '学生提交记录' }}</h2>
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
        <p>您的学生还没有提交过这道题目</p>
      </div>
      
      <div v-else class="submissions-table-container">
        <table class="submissions-table">
          <thead>
            <tr>
              <th>提交ID</th>
              <th>学生姓名</th>
              <th>用户名</th>
              <th>提交时间</th>
              <th>语言</th>
              <th>状态</th>
              <th>判题结果</th>
              <th>通过测试</th>
              <th>运行时间</th>
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
              <td>#{{ submission.id }}</td>
              <td>
                <div class="student-name-cell">
                  <span class="student-name-text">{{ submission.real_name || '未知' }}</span>
                </div>
              </td>
              <td>
                <span class="username-text">{{ submission.username || '未知' }}</span>
              </td>
              <td class="date-cell">{{ formatDateTime(submission.submit_time) }}</td>
              <td>
                <span class="language-badge">{{ getLanguageName(submission.language) }}</span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(submission.status)">
                  {{ getStatusText(submission.status) }}
                </span>
              </td>
              <td>
                <span class="verdict-badge" :class="getVerdictClass(submission.verdict)">
                  {{ getVerdictText(submission.verdict) }}
                </span>
              </td>
              <td>
                <span v-if="submission.total_tests" class="test-info">
                  {{ submission.passed_tests || 0 }}/{{ submission.total_tests }}
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <span v-if="submission.judge_duration" class="runtime-info">
                  {{ submission.judge_duration }}ms
                </span>
                <span v-else>-</span>
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
          <h3>提交详情 #{{ selectedSubmission?.id }} - {{ selectedSubmission?.real_name || selectedSubmission?.username || '学生' }}</h3>
          <button @click="closeDetailDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="detailLoading" class="detail-loading">
            <div class="loading-spinner"></div>
            <p>加载详情中...</p>
          </div>
          <div v-else-if="submissionDetail">
            <!-- 基本信息 -->
            <div class="detail-summary">
              <div class="summary-header">
                <div class="summary-info">
                  <h4>{{ problemInfo.title || '未知题目' }}</h4>
                  <div class="student-info">
                    <span class="student-label">学生：</span>
                    <span class="student-name">{{ submissionDetail.real_name || submissionDetail.username || '未知' }}</span>
                    <span v-if="submissionDetail.username" class="student-username">(@{{ submissionDetail.username }})</span>
                  </div>
                  <p class="summary-date">{{ formatDateTime(selectedSubmission?.submit_time) }}</p>
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-label">语言:</span>
                      <span class="stat-value">{{ getLanguageName(submissionDetail.language) }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">状态:</span>
                      <span class="stat-value" :class="getStatusClass(submissionDetail.status)">
                        {{ getStatusText(submissionDetail.status) }}
                      </span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">结果:</span>
                      <span class="stat-value" :class="getVerdictClass(submissionDetail.verdict)">
                        {{ getVerdictText(submissionDetail.verdict) }}
                      </span>
                    </span>
                  </div>
                  <div class="summary-stats" v-if="submissionDetail.total_tests">
                    <span class="stat-item">
                      <span class="stat-label">通过测试:</span>
                      <span class="stat-value" :class="submissionDetail.passed_tests === submissionDetail.total_tests ? 'correct' : 'incorrect'">
                        {{ submissionDetail.passed_tests }}/{{ submissionDetail.total_tests }}
                      </span>
                    </span>
                    <span class="stat-item" v-if="submissionDetail.judge_duration">
                      <span class="stat-label">运行时间:</span>
                      <span class="stat-value">{{ submissionDetail.judge_duration }}ms</span>
                    </span>
                  </div>
                  <div v-if="submissionDetail.task_id" class="task-info-summary">
                    <div class="task-info-item">
                      <span class="task-label">任务:</span>
                      <span class="task-value">{{ submissionDetail.task_name || '未知任务' }}</span>
                    </div>
                    <div v-if="submissionDetail.plan_name" class="task-info-item">
                      <span class="task-label">计划:</span>
                      <span class="task-value">{{ submissionDetail.plan_name }}</span>
                    </div>
                  </div>
                  <div v-else class="task-info-summary">
                    <span class="no-task-text">自主练习</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 判题结果详情 -->
            <div v-if="submissionDetail.results && submissionDetail.results.length > 0" class="test-results-section">
              <h4>测试用例结果</h4>
              <div class="test-results-list">
                <div 
                  v-for="(result, index) in submissionDetail.results" 
                  :key="index"
                  class="test-result-item"
                  :class="{ 'passed': result.passed, 'failed': !result.passed }"
                >
                  <div class="test-result-header">
                    <span class="test-number">测试用例 {{ index + 1 }}</span>
                    <span class="test-status" :class="{ 'passed': result.passed, 'failed': !result.passed }">
                      {{ result.passed ? '✓ 通过' : '✗ 失败' }}
                    </span>
                  </div>
                  <div v-if="result.input" class="test-io">
                    <div class="test-input">
                      <span class="test-label">输入:</span>
                      <pre><code>{{ result.input }}</code></pre>
                    </div>
                    <div class="test-output">
                      <span class="test-label">期望输出:</span>
                      <pre><code>{{ result.expected_output }}</code></pre>
                    </div>
                    <div v-if="!result.passed && result.actual_output" class="test-output">
                      <span class="test-label">实际输出:</span>
                      <pre><code>{{ result.actual_output }}</code></pre>
                    </div>
                    <div v-if="result.error" class="test-error">
                      <span class="test-label">错误信息:</span>
                      <pre><code>{{ result.error }}</code></pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 提交的代码 -->
            <div v-if="submissionDetail.code" class="code-section">
              <h4>提交的代码</h4>
              <div class="code-container">
                <pre><code class="language-{{ submissionDetail.language }}">{{ submissionDetail.code }}</code></pre>
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="submissionDetail.error_message" class="error-section">
              <h4>错误信息</h4>
              <div class="error-container">
                <pre><code>{{ submissionDetail.error_message }}</code></pre>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailDialog" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// 从路由参数获取教师ID和题目ID
const teacherId = ref<number | null>(route.params.teacherId ? parseInt(route.params.teacherId as string) : null)
const problemId = ref<number | null>(route.params.problemId ? parseInt(route.params.problemId as string) : null)

// 数据状态
const problemInfo = ref<any>({})
const submissions = ref<any[]>([])
const loading = ref(false)
const showDetailDialog = ref(false)
const selectedSubmission = ref<any>(null)
const submissionDetail = ref<any>(null)
const detailLoading = ref(false)

// 获取题目信息
async function fetchProblemInfo() {
  if (!problemId.value) return
  try {
    const response = await axios.get(`${BASE_URL}/oj/problems/${problemId.value}`)
    if (response.data.success) {
      problemInfo.value = response.data.data
    }
  } catch (error: any) {
    console.error('获取题目信息失败:', error)
  }
}

// 获取学生提交记录
async function fetchSubmissions() {
  loading.value = true
  try {
    if (!teacherId.value) {
      alert('无法获取教师ID')
      router.push('/smartoj')
      return
    }
    
    const params: any = {
      page: 1,
      pageSize: 100
    }
    
    // 如果指定了题目ID，添加过滤
    if (problemId.value) {
      params.problemId = problemId.value
    }
    
    const response = await axios.get(`${BASE_URL}/teacher/${teacherId.value}/oj-submissions`, { params })
    
    // 按提交时间倒序排列（最新的在前）
    if (response.data.success && response.data.data) {
      submissions.value = response.data.data.sort((a: any, b: any) => {
        const timeA = new Date(a.submit_time).getTime()
        const timeB = new Date(b.submit_time).getTime()
        return timeB - timeA
      })
    } else {
      submissions.value = []
    }
  } catch (error: any) {
    console.error('获取提交记录失败:', error)
    if (error.response?.status === 403) {
      alert('您没有权限查看该学生的提交记录')
    } else {
      alert('获取提交记录失败: ' + (error.response?.data?.error || error.message))
    }
    submissions.value = []
  } finally {
    loading.value = false
  }
}

// 获取提交详情（含代码）
async function fetchSubmissionDetail(submission: any) {
  detailLoading.value = true
  try {
    if (!teacherId.value || !submission.user_id || !submission.id) {
      throw new Error('缺少必要参数')
    }
    
    const response = await axios.get(
      `${BASE_URL}/teacher/${teacherId.value}/students/${submission.user_id}/oj-submissions/${submission.id}`
    )
    
    if (response.data.success) {
      submissionDetail.value = response.data.data
    } else {
      throw new Error(response.data.error || '获取详情失败')
    }
  } catch (error: any) {
    console.error('获取提交详情失败:', error)
    if (error.response?.status === 403) {
      alert('您没有权限查看该学生的提交详情')
    } else {
      alert('获取提交详情失败: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    detailLoading.value = false
  }
}

// 获取语言名称
function getLanguageName(language: string) {
  const languageMap: Record<string, string> = {
    'cpp': 'C++',
    'c': 'C',
    'java': 'Java',
    'python': 'Python',
    'python3': 'Python3',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript'
  }
  return languageMap[language] || language.toUpperCase()
}

// 获取状态样式类
function getStatusClass(status: string) {
  if (status === 'completed') return 'completed'
  if (status === 'judging') return 'judging'
  if (status === 'error') return 'error'
  return 'pending'
}

// 获取状态文本
function getStatusText(status: string) {
  if (status === 'completed') return '已完成'
  if (status === 'judging') return '判题中'
  if (status === 'error') return '错误'
  return '等待中'
}

// 获取判题结果样式类
function getVerdictClass(verdict: string) {
  if (verdict === 'Accepted') return 'accepted'
  if (verdict === 'Wrong Answer') return 'wrong-answer'
  if (verdict === 'Time Limit Exceeded') return 'tle'
  if (verdict === 'Memory Limit Exceeded') return 'mle'
  if (verdict === 'Runtime Error') return 'runtime-error'
  if (verdict === 'Compilation Error') return 'compile-error'
  return 'unknown'
}

// 获取判题结果文本
function getVerdictText(verdict: string) {
  if (verdict === 'Accepted') return '✓ 通过'
  if (verdict === 'Wrong Answer') return '✗ 答案错误'
  if (verdict === 'Time Limit Exceeded') return '⏱ 超时'
  if (verdict === 'Memory Limit Exceeded') return '💾 超内存'
  if (verdict === 'Runtime Error') return '❌ 运行错误'
  if (verdict === 'Compilation Error') return '🔧 编译错误'
  return verdict || '未知'
}

// 格式化日期时间
function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 返回上一页
function goBack() {
  router.back()
}

// 查看提交详情
async function viewSubmissionDetail(submission: any) {
  selectedSubmission.value = submission
  await fetchSubmissionDetail(submission)
  showDetailDialog.value = true
}

// 关闭详情弹窗
function closeDetailDialog() {
  showDetailDialog.value = false
  selectedSubmission.value = null
  submissionDetail.value = null
}

onMounted(() => {
  if (problemId.value) {
    fetchProblemInfo()
  }
  fetchSubmissions()
})
</script>

<style scoped>
.oj-submissions-container {
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

.date-cell {
  color: #64748b;
  font-size: 13px;
}

.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name-text {
  font-weight: 500;
  color: #1e293b;
}

.username-text {
  color: #64748b;
  font-size: 12px;
}

.language-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e2e8f0;
  color: #1e293b;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.9);
}

.status-badge.judging {
  background: rgba(59, 130, 246, 0.9);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.9);
}

.status-badge.pending {
  background: rgba(107, 114, 128, 0.9);
}

.verdict-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.verdict-badge.accepted {
  background: rgba(34, 197, 94, 0.9);
}

.verdict-badge.wrong-answer {
  background: rgba(239, 68, 68, 0.9);
}

.verdict-badge.tle {
  background: rgba(245, 158, 11, 0.9);
}

.verdict-badge.mle {
  background: rgba(168, 85, 247, 0.9);
}

.verdict-badge.runtime-error {
  background: rgba(239, 68, 68, 0.9);
}

.verdict-badge.compile-error {
  background: rgba(156, 163, 175, 0.9);
}

.verdict-badge.unknown {
  background: rgba(107, 114, 128, 0.9);
}

.test-info {
  font-weight: 600;
  color: #1e293b;
}

.runtime-info {
  color: #64748b;
  font-size: 13px;
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

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30,144,255,0.3);
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
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
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

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
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

.summary-info {
  flex: 1;
}

.summary-info h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.student-info {
  margin: 8px 0;
  color: #64748b;
  font-size: 14px;
}

.student-label {
  font-weight: 500;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
}

.student-username {
  color: #64748b;
  font-size: 13px;
}

.summary-date {
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 14px;
}

.summary-stats {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.stat-value.correct {
  color: #22c55e;
}

.stat-value.incorrect {
  color: #ef4444;
}

.test-results-section {
  margin-top: 24px;
}

.test-results-section h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.test-results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-result-item {
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.test-result-item.passed {
  border-color: #22c55e;
  background: #f0fdf4;
}

.test-result-item.failed {
  border-color: #ef4444;
  background: #fef2f2;
}

.test-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.test-number {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.test-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.test-status.passed {
  background: #22c55e;
}

.test-status.failed {
  background: #ef4444;
}

.test-io {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-input, .test-output, .test-error {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.test-io pre {
  margin: 0;
  padding: 12px;
  background: #1e293b;
  border-radius: 8px;
  overflow-x: auto;
}

.test-io code {
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.test-error pre {
  background: #fef2f2;
}

.test-error code {
  color: #dc2626;
}

.code-section, .error-section {
  margin-top: 24px;
}

.code-section h4, .error-section h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.code-container, .error-container {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.code-container pre, .error-container pre {
  margin: 0;
  padding: 0;
}

.code-container code, .error-container code {
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-container {
  background: #fef2f2;
}

.error-container code {
  color: #dc2626;
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

  .summary-stats {
    flex-direction: column;
    gap: 8px;
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
}
</style>

