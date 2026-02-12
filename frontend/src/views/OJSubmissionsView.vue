<template>
  <div class="oj-submissions-container">
    <!-- 左侧返回按钮 -->
    <button 
      class="back-nav-arrow" 
      @click="goBack" 
      title="返回"
    >
      <Icon name="arrow-left" :size="32" />
    </button>

    <div class="submissions-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载提交记录...</p>
      </div>
      
      <div v-else-if="submissions.length === 0 && !accessDenied" class="empty-state">
        <div class="empty-icon"><Icon name="file-text" :size="64" /></div>
        <h3>暂无提交记录</h3>
        <p>您还没有提交过这道题目</p>
      </div>
      
      <div v-else-if="!accessDenied" class="submissions-by-month">
        <div v-for="(monthData, monthKey) in groupedSubmissions" :key="monthKey" class="month-group">
          <div class="month-header">
            <span class="month-title"><Icon name="calendar" :size="18" /> {{ monthKey }}</span>
            <span class="month-count">{{ monthData.length }} 次提交</span>
          </div>
          <div class="submissions-table-container">
            <table class="submissions-table">
              <thead>
                <tr>
                  <th>提交ID</th>
                  <th v-if="!problemId">题目</th>
                  <th>提交时间</th>
                  <th>语言</th>
                  <th>状态</th>
                  <th>判题结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="submission in monthData" 
                  :key="submission.id"
                  class="submission-row"
                >
                  <td>#{{ submission.id }}</td>
                  <td v-if="!problemId" class="problem-title-cell">
                    <span class="problem-title" @click.stop="goToProblemFromSubmission(submission.problem_id)">
                      {{ submission.problem_title || `题目 #${submission.problem_id}` }}
                    </span>
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
                    <div class="action-buttons">
                      <button 
                        v-if="submission.verdict !== 'Accepted'" 
                        class="btn-action btn-view" 
                        @click="viewSubmissionDetail(submission)"
                      >
                        <Icon name="eye" :size="16" /> 查看详情
                      </button>
                      <span v-else class="no-detail-text">-</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交详情弹窗 -->
    <div v-if="showDetailDialog" class="submission-detail-modal" @click="closeDetailDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>提交详情 #{{ selectedSubmission?.id }}</h3>
          <button @click="closeDetailDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="detailLoading" class="detail-loading">
            <div class="loading-spinner"></div>
            <p>加载详情中...</p>
          </div>
          <div v-else-if="submissionDetail">
            <!-- 提交的代码（放在第一位） -->
            <div v-if="submissionDetail.code" class="code-section">
              <div class="code-section-header">
                <h4>提交的代码</h4>
                <button class="btn-copy-code" @click="copyCode" :class="{ copied: codeCopied }">
                  <Icon name="copy" :size="16" /> {{ codeCopied ? '已复制' : '复制代码' }}
                </button>
              </div>
              <div class="code-container">
                <pre><code class="language-{{ submissionDetail.language }}">{{ submissionDetail.code }}</code></pre>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="detail-summary">
              <div class="summary-header">
                <div class="summary-info">
                  <h4>{{ problemInfo.title || '未知题目' }}</h4>
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

    <!-- 访问被拒绝弹窗 -->
    <div v-if="accessDenied" class="access-denied-modal" @click="goBack">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ accessDeniedReason === 'expired' ? '提交时间已过期' : '暂无提交记录' }}</h3>
          <button @click="goBack" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="access-denied-message">
            <div class="access-denied-icon">
              <Icon name="lock" :size="64" />
            </div>
            <p>{{ accessDeniedReason === 'expired' ? '只有近24小时内的提交才能查看提交记录，请重新提交后再查看。' : '您还没有提交过该题目，请先提交后再查看提交记录。' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="goBack" class="btn btn-primary">
            <Icon name="arrow-left" :size="16" />
            <span>返回</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部 Header -->
    <div class="submissions-header-bottom">
      <h2>{{ problemInfo.title ? problemInfo.title + ' - 提交记录' : '提交记录' }}</h2>
      <span class="submission-count">共 {{ submissions.length }} 次提交</span>
    </div>
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()

// 从路由参数获取题目ID
const problemId = ref<number | null>(route.params.problemId ? parseInt(route.params.problemId as string) : null)

// 数据状态
const problemInfo = ref<any>({})
const submissions = ref<any[]>([])
const loading = ref(false)
const showDetailDialog = ref(false)
const selectedSubmission = ref<any>(null)
const submissionDetail = ref<any>(null)
const detailLoading = ref(false)
const codeCopied = ref(false)
const accessDenied = ref(false)
const accessDeniedReason = ref<'none' | 'expired'>('none')

// 按月份分组提交记录
const groupedSubmissions = computed(() => {
  const groups: Record<string, any[]> = {}
  submissions.value.forEach((submission: any) => {
    const date = new Date(submission.submit_time)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(submission)
  })
  return groups
})

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

// 获取提交记录
async function fetchSubmissions() {
  loading.value = true
  try {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      alert('请先登录')
      router.push('/login')
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    
    const params: any = {
      userId: userInfo.id,
      page: 1,
      pageSize: 100
    }
    
    // 如果指定了题目ID，添加过滤
    if (problemId.value) {
      params.problemId = problemId.value
    }
    
    const response = await axios.get(`${BASE_URL}/oj/submissions`, { params })
    
    const allSubmissions = response.data?.data || []
    
    // 如果没有提交记录
    if (allSubmissions.length === 0) {
      accessDenied.value = true
      accessDeniedReason.value = 'none'
      submissions.value = []
      return
    }
    
    // 按提交时间倒序排列（最新的在前）
    const sortedSubmissions = allSubmissions.sort((a: any, b: any) => {
      const timeA = new Date(a.submit_time).getTime()
      const timeB = new Date(b.submit_time).getTime()
      return timeB - timeA
    })
    
    // 检查最近一次提交是否在24小时内
    const latestSubmission = sortedSubmissions[0]
    const submissionTime = new Date(latestSubmission.submit_time).getTime()
    const now = new Date().getTime()
    const oneDayInMs = 24 * 60 * 60 * 1000 // 24小时
    const timeDiff = now - submissionTime
    
    console.log('OJ提交时间检查:', {
      submissionTime: new Date(latestSubmission.submit_time),
      now: new Date(),
      timeDiff: timeDiff,
      oneDayInMs: oneDayInMs,
      hoursDiff: timeDiff / (60 * 60 * 1000),
      shouldDeny: timeDiff > oneDayInMs
    })
    
    if (timeDiff > oneDayInMs) {
      console.log('访问被拒绝：提交时间超过24小时')
      accessDenied.value = true
      accessDeniedReason.value = 'expired'
      submissions.value = []
      return
    }
    
    console.log('访问允许：提交时间在24小时内')
    // 有近1天的提交，允许查看
    accessDenied.value = false
    submissions.value = sortedSubmissions
  } catch (error: any) {
    console.error('获取提交记录失败:', error)
    accessDenied.value = true
    accessDeniedReason.value = 'none'
    submissions.value = []
  } finally {
    loading.value = false
  }
}

// 获取提交详情（含代码）
async function fetchSubmissionDetail(submissionId: number) {
  detailLoading.value = true
  try {
    const response = await axios.get(`${BASE_URL}/oj/submissions/${submissionId}/detail`)
    if (response.data.success) {
      submissionDetail.value = response.data.data
    } else {
      throw new Error(response.data.error || '获取详情失败')
    }
  } catch (error: any) {
    console.error('获取提交详情失败:', error)
    alert('获取提交详情失败: ' + (error.response?.data?.error || error.message))
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
  // 检查是否从任务页面跳转过来
  const from = route.query.from as string
  const planId = route.query.planId as string
  const taskId = route.query.taskId as string
  
  if (from === 'taskview' && planId && taskId) {
    // 从任务页面跳转过来的，返回到任务页面的编程题标签
    router.push(`/plan/${planId}/tasks/${taskId}?tab=programming`)
  } else {
    // 默认使用浏览器返回
    router.back()
  }
}

// 跳转到题目
function goToProblem() {
  if (problemId.value) {
    router.push(`/smartoj/${problemId.value}`)
  } else {
    router.push('/smartoj')
  }
  closeDetailDialog()
}

// 从提交记录跳转到题目
function goToProblemFromSubmission(problemId: number) {
  router.push(`/smartoj/${problemId}`)
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
  submissionDetail.value = null
  codeCopied.value = false
}

// 复制代码
async function copyCode() {
  if (!submissionDetail.value?.code) return
  try {
    // 优先使用 Clipboard API（需要 HTTPS）
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(submissionDetail.value.code)
    } else {
      // 降级方案：使用 textarea + execCommand
      const textarea = document.createElement('textarea')
      textarea.value = submissionDetail.value.code
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动选择复制')
  }
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

/* 左侧返回按钮样式 - 固定定位 */
.back-nav-arrow {
  position: fixed;
  left: 20px;
  top: 80px;
  background: rgba(30, 144, 255, 0.15);
  backdrop-filter: blur(10px);
  color: #1e90ff;
  border: 2px solid rgba(30, 144, 255, 0.3);
  border-radius: 12px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.2);
  z-index: 100;
}

.back-nav-arrow:hover {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.5);
  color: #0c7cd5;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
}

.back-nav-arrow:active {
  transform: scale(0.95);
}

.back-nav-arrow :deep(.lucide-icon) {
  flex-shrink: 0;
}

/* 底部固定 Header */
.submissions-header-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-top: 2px solid #e2e8f0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: rgba(135, 206, 235, 0.95);
  width: 100%;
  gap: 4px;
  box-sizing: border-box;
}

.submissions-header-bottom h2 {
  margin: 0;
  color: #1e293b;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: 0.01em;
  text-align: center;
}

.submission-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.submissions-content {
  flex: 1;
  padding: 24px 32px;
  padding-left: 100px; /* 为左侧返回按钮留出空间 */
  padding-bottom: 100px; /* 为底部固定的header留出空间 */
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-top: 20px; /* 减少顶部间距，让卡片上移 */
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

/* 按月份分组 */
.submissions-by-month {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.month-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
}

.month-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.month-count {
  font-size: 14px;
  color: #64748b;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

/* 表格容器 */
.submissions-table-container {
  overflow: hidden;
  width: 100%;
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

.problem-title-cell {
  max-width: 200px;
}

.problem-title {
  color: #1e90ff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
}

.problem-title:hover {
  color: #0284c7;
  text-decoration: underline;
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

.no-detail-text {
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
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
  margin-bottom: 24px;
}

.code-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.code-section-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.btn-copy-code {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-copy-code:hover {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.btn-copy-code.copied {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.error-section h4 {
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

/* 访问被拒绝弹窗样式 */
.access-denied-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  backdrop-filter: blur(4px);
}

.access-denied-modal .modal-content {
  max-width: 500px;
  width: 90%;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.access-denied-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
}

.access-denied-icon {
  margin-bottom: 24px;
  color: #f59e0b;
}

.access-denied-message p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.access-denied-modal .modal-footer {
  justify-content: center;
}

.access-denied-modal .btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
}

.access-denied-modal .btn-primary:hover {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
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
  .back-nav-arrow {
    width: 48px;
    height: 48px;
    left: 16px;
    top: 70px;
  }

  .back-nav-arrow :deep(.lucide-icon) {
    width: 24px;
    height: 24px;
  }
  
  .submissions-content {
    margin-top: 50px;
    padding: 20px 16px;
    padding-left: 16px;
    padding-bottom: 90px;
  }

  .submissions-header-bottom {
    padding: 10px 16px;
  }

  .submissions-header-bottom h2 {
    font-size: 1.2rem;
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
  .submissions-content {
    padding: 16px;
    padding-bottom: 90px;
  }

  .submissions-table th,
  .submissions-table td {
    padding: 10px 6px;
    font-size: 12px;
  }
}
</style>
