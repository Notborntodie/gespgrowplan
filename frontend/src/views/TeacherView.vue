
<template>
  <div class="profile-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>教师管理</h2>
      </div>
      <nav class="sidebar-nav">
        <button 
          v-for="item in menuItems" 
          :key="item.key"
          :class="['nav-item', { active: currentActiveSection === item.key }]"
          @click="openSection(item.key)"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content" :class="{ 'has-tabs': openedSections.length > 0 }">
      <!-- 次级页面标签栏 -->
      <div v-if="openedSections.length > 0" class="tabs-header">
        <div class="tabs-container">
          <div 
            v-for="section in openedSections" 
            :key="section"
            class="tab-item"
            :class="{ active: currentActiveSection === section }"
            @click="switchToSection(section)"
          >
            <span class="tab-label">{{ getMenuLabel(section) }}</span>
            <button 
              class="tab-close"
              @click.stop="closeSection(section)"
              title="关闭"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- 客观题提交 -->
      <ObjectiveSubmissionsSection v-if="currentActiveSection === 'objective-submissions'" />
      
      <!-- OJ提交 -->
      <OJSubmissionsSection v-if="currentActiveSection === 'oj-submissions'" />
      
      <!-- 学生管理 -->
      <StudentManagementSection 
        v-if="currentActiveSection === 'student-management'"
        :students="students"
        :loading="studentsLoading"
        @bind-student="handleBindStudent"
        @create-student="showCreateStudentDialog = true"
        @batch-create-student="showBatchCreateDialog = true"
        @view-student="showStudentDetail"
      />
      
      <!-- 学习计划管理 -->
      <LearningPlanManagementSection v-if="currentActiveSection === 'learning-plan-management'" />
      
      <!-- 计划完成 -->
      <PlanProgressSection v-if="currentActiveSection === 'plan-progress'" />
      
    </main>
      

      <!-- 创建学生对话框 -->
      <div v-if="showCreateStudentDialog" class="dialog-overlay" @click="closeCreateStudentDialog">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h3>创建学生</h3>
            <button @click="closeCreateStudentDialog" class="btn-close">&times;</button>
          </div>
          <div class="dialog-body">
            <form @submit.prevent="createStudent" class="user-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="student_username">用户名 *</label>
                  <input 
                    id="student_username"
                    v-model="newStudent.username" 
                    type="text" 
                    required 
                    placeholder="请输入用户名"
                  />
                </div>
                <div class="form-group">
                  <label for="student_password">密码 *</label>
                  <input 
                    id="student_password"
                    v-model="newStudent.password" 
                    type="password" 
                    required 
                    placeholder="请输入密码"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="student_email">邮箱</label>
                  <input 
                    id="student_email"
                    v-model="newStudent.email" 
                    type="email" 
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div class="form-group">
                  <label for="student_real_name">真实姓名</label>
                  <input 
                    id="student_real_name"
                    v-model="newStudent.real_name" 
                    type="text" 
                    placeholder="请输入真实姓名"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label>角色</label>
                <div class="role-info">
                  <span class="role-badge role-user">普通用户</span>
                  <span class="role-description">学生将自动获得普通用户角色</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>自动绑定</label>
                <div class="bind-option">
                  <label class="bind-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="autoBindStudent"
                      checked
                    />
                    <span class="bind-label">创建后自动绑定到我的学生列表</span>
                  </label>
                  <span class="bind-description">取消勾选则只创建学生账户，不进行绑定</span>
                </div>
              </div>
              
              <div class="dialog-actions">
                <button type="button" @click="closeCreateStudentDialog" class="btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn-primary" :disabled="isCreatingStudent">
                  {{ isCreatingStudent ? '创建中...' : '创建学生' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
        
      <!-- 绑定学生对话框 -->
      <div v-if="showBindStudentDialog" class="dialog-overlay" @click="closeBindStudentDialog">
        <div class="dialog dialog-large" @click.stop>
          <div class="dialog-header">
            <h3>绑定学生</h3>
            <button @click="closeBindStudentDialog" class="btn-close">&times;</button>
          </div>
          <div class="dialog-body">
            <div v-if="availableStudents.length === 0" class="empty-state">
              <p>暂无可绑定的学生</p>
          </div>
            <div v-else class="available-students">
              <h4>选择要绑定的学生：</h4>
              
              <!-- 搜索框 -->
              <div class="search-box">
                <input 
                  v-model="bindStudentSearchQuery" 
                  type="text" 
                  placeholder="搜索学生用户名、真实姓名或邮箱..."
                  class="search-input"
                />
                <Icon name="search" :size="18" class="search-icon" />
              </div>
              
              <!-- 搜索结果提示 -->
              <div v-if="bindStudentSearchQuery.trim()" class="search-results-info">
                <span>找到 {{ filteredAvailableStudents.length }} 个学生</span>
              </div>
              
              <div class="students-list">
                <div 
                  v-for="student in filteredAvailableStudents" 
                  :key="student.id"
                  class="student-option"
                  :class="{ selected: selectedStudentIds.includes(student.id) }"
                  @click="toggleStudentSelection(student.id)"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedStudentIds.includes(student.id)"
                    @change="toggleStudentSelection(student.id)"
                  />
                  <div class="student-option-info">
                    <div class="student-avatar-small">
                      {{ student.real_name ? student.real_name.charAt(0) : student.username.charAt(0) }}
                    </div>
                    <div class="student-option-details">
                      <h5>{{ student.real_name || student.username }}</h5>
                      <p>@{{ student.username }}</p>
                      <p v-if="student.email">{{ student.email }}</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
                
            <div class="dialog-actions">
              <button type="button" @click="closeBindStudentDialog" class="btn-secondary">
                取消
              </button>
              <button 
                @click="bindStudents(selectedStudentIds)" 
                class="btn-primary" 
                :disabled="isBindingStudent || selectedStudentIds.length === 0"
              >
                {{ isBindingStudent ? '绑定中...' : `绑定 ${selectedStudentIds.length} 个学生` }}
              </button>
          </div>
        </div>
            </div>
          </div>

    <!-- 批量导入学生对话框 -->
    <div v-if="showBatchCreateDialog" class="dialog-overlay" @click="closeBatchCreateDialog">
      <div class="dialog dialog-large" @click.stop>
        <div class="dialog-header">
          <h3>批量导入学生</h3>
          <button @click="closeBatchCreateDialog" class="btn-close">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="batch-info">
            <p>输入学生真实姓名，系统将自动生成用户名（拼音+随机数字）和初始密码（123456）</p>
          </div>
          <div class="batch-students-list">
            <div v-for="(item, index) in batchStudents" :key="index" class="batch-student-item">
              <input 
                v-model="item.real_name" 
                type="text" 
                placeholder="请输入学生真实姓名"
                class="batch-input"
              />
              <button @click="removeBatchStudent(index)" class="btn-remove" title="删除">
                <Icon name="x" :size="18" />
              </button>
            </div>
          </div>
          <button @click="addBatchStudent" class="btn-add-student">
            <Icon name="plus" :size="18" />
            添加学生
          </button>
          <div class="dialog-actions">
            <button type="button" @click="closeBatchCreateDialog" class="btn-secondary">
              取消
            </button>
            <button 
              @click="batchCreateStudents" 
              class="btn-primary" 
              :disabled="isBatchCreating || validBatchStudents.length === 0"
            >
              {{ isBatchCreating ? '创建中...' : `创建 ${validBatchStudents.length} 个学生` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功消息弹窗 -->
    <SuccessMessageDialog 
      :visible="showSuccessDialog" 
      :message="successMessage"
      @close="closeSuccessDialog"
    />
    
    <!-- 确认对话框 -->
    <ConfirmDialog 
      :visible="showConfirmDialog"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    
    <!-- 学生详情对话框 -->
    <div v-if="showStudentDetailDialog && selectedStudent" class="dialog-overlay" @click="closeStudentDetailDialog">
      <div class="dialog dialog-large" @click.stop>
        <div class="dialog-header">
          <h3>学生详情</h3>
          <button @click="closeStudentDetailDialog" class="btn-close">&times;</button>
          </div>
        <div class="dialog-body">
          <div class="student-detail-content">
            <div class="student-detail-header">
              <div class="student-avatar-large">
                {{ selectedStudent.real_name ? selectedStudent.real_name.charAt(0) : selectedStudent.username.charAt(0) }}
                  </div>
              <div class="student-detail-info">
                <h2 class="student-detail-name">{{ selectedStudent.real_name || selectedStudent.username }}</h2>
                <p class="student-detail-username">@{{ selectedStudent.username }}</p>
                <p v-if="selectedStudent.email" class="student-detail-email">{{ selectedStudent.email }}</p>
              </div>
            </div>
            
            <div class="student-detail-stats">
              <div class="stat-card">
                <Icon name="bar-chart-3" :size="32" class="stat-icon" />
                <div class="stat-content">
                  <div class="stat-number">{{ selectedStudent.total_submissions || 0 }}</div>
                  <div class="stat-label">总提交次数</div>
                  </div>
                    </div>
              <div class="stat-card">
                <Icon name="check-circle" :size="32" class="stat-icon" />
                <div class="stat-content">
                  <div class="stat-number">{{ selectedStudent.accuracy_rate || 0 }}%</div>
                  <div class="stat-label">正确率</div>
                    </div>
                  </div>
              <div class="stat-card">
                <Icon name="target" :size="32" class="stat-icon" />
                <div class="stat-content">
                  <div class="stat-number">{{ selectedStudent.completed_exams || 0 }}</div>
                  <div class="stat-label">完成考试</div>
                </div>
              </div>
            </div>
            
            <div class="student-detail-actions">
              <button @click="closeStudentDetailDialog" class="btn-secondary">
                关闭
              </button>
              <button @click="resetStudentPassword(selectedStudent.id)" class="btn-warning">
                重置密码
              </button>
              <button @click="unbindStudent(selectedStudent.id)" class="btn-danger">
                解除绑定
              </button>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 考试学生详情对话框 -->
    <div v-if="showExamStudentsDialog && selectedExam" class="dialog-overlay" @click="closeExamStudentsDialog">
      <div class="dialog dialog-large" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedExam.name }} - 学生提交情况</h3>
          <button @click="closeExamStudentsDialog" class="btn-close">&times;</button>
        </div>
        <div class="dialog-body">
          <div v-if="examStudentsLoading" class="loading">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else class="exam-students-content">
            <!-- 考试信息摘要 -->
            <div class="exam-summary">
              <div class="summary-card">
                <div class="summary-item">
                  <span class="summary-label">总学生数:</span>
                  <span class="summary-value">{{ examStudents.length }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">已提交:</span>
                  <span class="summary-value">{{ submittedCount }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">未提交:</span>
                  <span class="summary-value">{{ notSubmittedCount }}</span>
                </div>
              </div>
            </div>
            
            <!-- 学生列表 -->
            <div class="students-submission-list">
              <h4>已提交学生详情 ({{ submittedStudents.length }}人)</h4>
              <div class="students-list">
                <div 
                  v-for="student in submittedStudents" 
                  :key="student.student_id"
                  class="student-submission-item"
                  :class="{ 'submitted': student.submission_status === 'submitted' }"
                  @click="showStudentWrongQuestions(student)"
                >
                  <div class="student-submission-info">
                    <div class="student-avatar-small">
                      {{ student.real_name ? student.real_name.charAt(0) : student.username.charAt(0) }}
                    </div>
                    <div class="student-submission-details">
                      <h5>{{ student.real_name || student.username }}</h5>
                      <p>@{{ student.username }}</p>
                      <div class="submission-status">
                        <span v-if="student.submission_status === 'submitted'" class="status-badge submitted">
                          已提交
                        </span>
                        <span v-else class="status-badge not-submitted">
                          未提交
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="student.submission_status === 'submitted' && student.submission_info" class="submission-details">
                    <div class="submission-info">
                      <div class="info-item">
                        <span class="info-label">得分:</span>
                        <span class="info-value score">{{ student.submission_info.score || 0 }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">提交时间:</span>
                        <span class="info-value">{{ student.submission_info.submit_time || '未知' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">尝试次数:</span>
                        <span class="info-value">{{ student.submission_info.attempt_number || 1 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 学生提交详情对话框 -->
    <div v-if="showStudentSubmissionDetail && selectedStudentSubmission && studentSubmissionHistory" class="dialog-overlay" @click="closeStudentSubmissionDetail">
      <div class="dialog dialog-large" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedStudentSubmission.real_name || selectedStudentSubmission.username }} - 错题分析</h3>
          <button @click="closeStudentSubmissionDetail" class="btn-close">&times;</button>
        </div>
        <div class="dialog-body">
          <div v-if="studentSubmissionLoading" class="loading">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else class="submission-detail-content">
            <!-- 考试信息 -->
            <div class="exam-info-section">
              <h4>考试信息</h4>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">考试名称:</span>
                  <span class="info-value">{{ studentSubmissionHistory.exam_info.name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">考试级别:</span>
                  <span class="info-value">{{ studentSubmissionHistory.exam_info.level }}级</span>
                </div>
                <div class="info-row">
                  <span class="info-label">总题数:</span>
                  <span class="info-value">{{ studentSubmissionHistory.exam_info.total_questions }}</span>
                </div>
              </div>
            </div>
            
            <!-- 学生信息 -->
            <div class="student-info-section">
              <h4>学生信息</h4>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">用户名:</span>
                  <span class="info-value">{{ studentSubmissionHistory.student_info.username }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">真实姓名:</span>
                  <span class="info-value">{{ studentSubmissionHistory.student_info.real_name }}</span>
                </div>
              </div>
            </div>
            
            <!-- 统计信息 -->
            <div class="statistics-section">
              <h4>错题统计</h4>
              <div class="statistics-grid">
                <div class="stat-card">
                  <Icon name="bar-chart-3" :size="32" class="stat-icon" />
                  <div class="stat-content">
                    <div class="stat-number">{{ studentSubmissionHistory.statistics.total_attempts }}</div>
                    <div class="stat-label">总尝试次数</div>
                  </div>
                </div>
                <div class="stat-card">
                  <Icon name="x-circle" :size="32" class="stat-icon" />
                  <div class="stat-content">
                    <div class="stat-number">{{ studentSubmissionHistory.statistics.total_wrong_questions }}</div>
                    <div class="stat-label">错题数量</div>
                  </div>
                </div>
                <div class="stat-card">
                  <Icon name="trending-up" :size="32" class="stat-icon" />
                  <div class="stat-content">
                    <div class="stat-number">{{ Math.round((studentSubmissionHistory.statistics.total_wrong_questions / studentSubmissionHistory.exam_info.total_questions) * 100) }}%</div>
                    <div class="stat-label">错误率</div>
                  </div>
                </div>
                <div class="stat-card">
                  <Icon name="check-circle" :size="32" class="stat-icon" />
                  <div class="stat-content">
                    <div class="stat-number">{{ studentSubmissionHistory.exam_info.total_questions - studentSubmissionHistory.statistics.total_wrong_questions }}</div>
                    <div class="stat-label">正确题数</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 错题列表 -->
            <div class="wrong-questions-section">
              <h4>错题详情 ({{ studentSubmissionHistory.wrong_questions.length }}题)</h4>
              <div class="wrong-questions-list">
                <div 
                  v-for="(question, index) in studentSubmissionHistory.wrong_questions" 
                  :key="question.question_id"
                  class="wrong-question-item"
                >
                  <div class="question-header">
                    <div class="question-number">
                      <span class="question-label">第 {{ index + 1 }} 题</span>
                      <span class="question-id">(ID: {{ question.question_id }})</span>
                    </div>
                    <div class="question-meta">
                      <span class="difficulty-badge" :class="question.difficulty">{{ question.difficulty }}</span>
                      <span class="level-badge">{{ question.level }}级</span>
                    </div>
                  </div>
                  
                  <div class="question-content">
                    <div class="question-text">{{ question.question_text }}</div>
                  </div>
                  
                  <div class="answer-section">
                    <div class="answer-row">
                      <span class="answer-label">学生答案:</span>
                      <span class="student-answer wrong">{{ question.user_answer }}</span>
                    </div>
                    <div class="answer-row">
                      <span class="answer-label">正确性:</span>
                      <span class="correctness wrong"><Icon name="x" :size="14" /> 错误</span>
                    </div>
                  </div>
                  
                  <div class="explanation-section" v-if="question.explanation">
                    <div class="explanation-label">解析:</div>
                    <div class="explanation-text">{{ question.explanation }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="dialog-actions">
              <button @click="closeStudentSubmissionDetail" class="btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">import { BASE_URL } from '@/config/api'
import { pinyin } from 'pinyin-pro'

import { ref, onMounted, watch, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
  import axios from 'axios'
import SuccessMessageDialog from '@/components/admin/Dialog/SuccessMessageDialog.vue'
import ConfirmDialog from '@/components/admin/Dialog/ConfirmDialog.vue'
import ObjectiveSubmissionsSection from '@/components/teacher/ObjectiveSubmissionsSection.vue'
import OJSubmissionsSection from '@/components/teacher/OJSubmissionsSection.vue'
import StudentManagementSection from '@/components/teacher/StudentManagementSection.vue'
import LearningPlanManagementSection from '@/components/teacher/LearningPlanManagementSection.vue'
import PlanProgressSection from '@/components/teacher/PlanProgressSection.vue'
import Icon from '@/components/Icon.vue'
  
  // 路由
  const router = useRouter()
  const route = useRoute()
  
  // 响应式数据
  const userInfo = ref<any>(null)
  
  // 学生管理相关数据
  const students = ref<any[]>([])
  const studentsLoading = ref(false)
  const showCreateStudentDialog = ref(false)
  const showBindStudentDialog = ref(false)
  const showBatchCreateDialog = ref(false)
  const isCreatingStudent = ref(false)
  const isBindingStudent = ref(false)
  const isBatchCreating = ref(false)
  const availableStudents = ref<any[]>([])
  const selectedStudentIds = ref<number[]>([])
  const bindStudentSearchQuery = ref('')
  const batchStudents = ref<{real_name: string}[]>([{ real_name: '' }])
  
  // 成功消息弹窗
  const showSuccessDialog = ref(false)
  const successMessage = ref('')
  
  // 确认对话框
  const showConfirmDialog = ref(false)
  const confirmTitle = ref('')
  const confirmMessage = ref('')
  const confirmAction = ref<(() => void) | null>(null)
  
  // 学生详情对话框
  const showStudentDetailDialog = ref(false)
  const selectedStudent = ref<any>(null)
  
  // 管理打开的页面（标签栏功能）
  const openedSections = ref<string[]>([])
  const currentActiveSection = ref<string>('')
  
  // 学生提交相关数据
  const exams = ref<any[]>([])
  const examsLoading = ref(false)
  const selectedExam = ref<any>(null)
  const examStudents = ref<any[]>([])
  const examStudentsLoading = ref(false)
  const showExamStudentsDialog = ref(false)
  // 考级筛选 - 从 localStorage 恢复状态
  const getInitialSelectedLevel = () => {
    const saved = localStorage.getItem('teacherView_selectedLevel')
    if (!saved || saved === 'null') return null
    const num = Number(saved)
    return isNaN(num) ? saved : num
  }
  const selectedLevel = ref<number | string | null>(getInitialSelectedLevel())
  
  // 学生提交详情相关数据
  const showStudentSubmissionDetail = ref(false)
  const selectedStudentSubmission = ref<any>(null)
  const studentSubmissionHistory = ref<any>(null)
  const studentSubmissionLoading = ref(false)
  
  // OJ提交相关数据
  const ojProblems = ref<any[]>([])
  const ojProblemsLoading = ref(false)
  const selectedOJLevel = ref<number | string | null>(null)
  
  
  // 新学生表单数据
  const newStudent = reactive({
    username: '',
    password: '',
    email: '',
    real_name: '',
    role_id: 2 // 学生角色
  })
  
  // 自动绑定选项
  const autoBindStudent = ref(true)
  
  // 侧边栏菜单项
  const menuItems = [
    { key: 'objective-submissions', label: '客观题提交' },
    { key: 'oj-submissions', label: 'OJ提交' },
    { key: 'student-management', label: '学生管理' },
    { key: 'learning-plan-management', label: '学习计划管理' },
    { key: 'plan-progress', label: '计划完成' }
  ]

  // 从侧边栏打开页面
  function openSection(sectionKey: string) {
    // 如果页面还没有打开，添加到打开列表
    if (!openedSections.value.includes(sectionKey)) {
      openedSections.value.push(sectionKey)
    }
    
    // 切换到该页面
    currentActiveSection.value = sectionKey
    
    // 保存状态
    saveCurrentState()
    
    // 根据不同的section触发相应的数据加载
    if (sectionKey === 'student-management' && userInfo.value) {
      fetchStudents()
    }
    // 注意：objective-submissions 和 oj-submissions 的数据加载已移到各自的组件中
  }

  // 从标签栏切换页面
  function switchToSection(sectionKey: string) {
    currentActiveSection.value = sectionKey
    // 保存状态
    saveCurrentState()
  }

  // 关闭页面
  function closeSection(sectionKey: string) {
    const index = openedSections.value.indexOf(sectionKey)
    if (index > -1) {
      openedSections.value.splice(index, 1)
      
      // 如果关闭的是当前活跃的页面，需要切换到其他页面
      if (currentActiveSection.value === sectionKey) {
        if (openedSections.value.length > 0) {
          // 如果还有其他打开的页面，切换到最后一个
          currentActiveSection.value = openedSections.value[openedSections.value.length - 1]
        } else {
          // 如果没有其他页面了，清空当前活跃页面
          currentActiveSection.value = ''
        }
      }
      
      // 保存状态
      saveCurrentState()
    }
  }

  // 根据key获取菜单项的标签
  function getMenuLabel(key: string): string {
    const menuItem = menuItems.find(item => item.key === key)
    return menuItem ? menuItem.label : key
  }
  
  // 过滤后的可绑定学生列表
  const filteredAvailableStudents = computed(() => {
    if (!bindStudentSearchQuery.value.trim()) {
      return availableStudents.value
    }
    
    const query = bindStudentSearchQuery.value.toLowerCase().trim()
    return availableStudents.value.filter(student => {
      const username = (student.username || '').toLowerCase()
      const realName = (student.real_name || '').toLowerCase()
      const email = (student.email || '').toLowerCase()
      return username.includes(query) || realName.includes(query) || email.includes(query)
    })
  })
  
  // 过滤后的考试列表
  const filteredExams = computed(() => {
    if (selectedLevel.value === null || selectedLevel.value === '') {
      return exams.value
    }
    return exams.value.filter(exam => exam.level === selectedLevel.value)
  })
  
  // 已提交学生数量
  const submittedCount = computed(() => {
    return examStudents.value.filter(student => student.submission_status === 'submitted').length
  })
  
  // 未提交学生数量
  const notSubmittedCount = computed(() => {
    return examStudents.value.filter(student => student.submission_status === 'not_submitted').length
  })
  
  // 已提交学生列表（只显示已提交的学生）
  const submittedStudents = computed(() => {
    return examStudents.value.filter(student => student.submission_status === 'submitted')
  })
  
  // 有效的批量学生（过滤空姓名）
  const validBatchStudents = computed(() => {
    return batchStudents.value.filter(s => s.real_name.trim())
  })
  
  // 获取用户信息
  const getUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      userInfo.value = JSON.parse(userInfoStr)
    }
  }
  
  // 显示成功消息
  const showSuccess = (message: string) => {
    successMessage.value = message
    showSuccessDialog.value = true
  }
  
  // 关闭成功消息弹窗
  const closeSuccessDialog = () => {
    showSuccessDialog.value = false
  }
  
  // 显示确认对话框
  const showConfirm = (title: string, message: string, action: () => void) => {
    confirmTitle.value = title
    confirmMessage.value = message
    confirmAction.value = action
    showConfirmDialog.value = true
  }
  
  // 确认操作
  const handleConfirm = () => {
    if (confirmAction.value) {
      confirmAction.value()
    }
    showConfirmDialog.value = false
    confirmAction.value = null
  }
  
  // 取消操作
  const handleCancel = () => {
    showConfirmDialog.value = false
    confirmAction.value = null
  }
  
  // 显示学生详情
  const showStudentDetail = (student: any) => {
    selectedStudent.value = student
    showStudentDetailDialog.value = true
  }
  
  // 关闭学生详情对话框
  const closeStudentDetailDialog = () => {
    showStudentDetailDialog.value = false
    selectedStudent.value = null
  }
  

  // 获取教师的学生列表
  const fetchStudents = async () => {
    if (!userInfo.value) {
      console.log('用户信息未加载，跳过获取学生列表')
      return
    }
    
    console.log('开始获取学生列表，教师ID:', userInfo.value.id)
    studentsLoading.value = true
    try {
      const response = await axios.get(`${BASE_URL}/teacher/${userInfo.value.id}/students`)
      console.log('获取学生列表API响应:', response.data)
      
      // 处理不同的响应格式
      let studentList = []
      if (response.data.data?.students) {
        studentList = response.data.data.students
      } else if (response.data.students) {
        studentList = response.data.students
      } else if (Array.isArray(response.data.data)) {
        studentList = response.data.data
      } else if (Array.isArray(response.data)) {
        studentList = response.data
      }
      
      students.value = studentList
      console.log('学生列表更新完成，学生数量:', studentList.length)
    } catch (error: any) {
      console.error('获取学生列表失败:', error)
      console.error('错误详情:', error.response?.data)
      alert('获取学生列表失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
    } finally {
      studentsLoading.value = false
    }
  }
  
  // 处理绑定学生按钮点击
  const handleBindStudent = () => {
    showBindStudentDialog.value = true
    fetchAvailableStudents()
  }
  
  // 获取可绑定的学生列表（未绑定的学生）
  const fetchAvailableStudents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users`, {
        params: {
          role_id: 2, // 只获取学生角色
          limit: 100
        }
      })
      const allStudents = response.data || []
      // 过滤掉已经绑定的学生
      const boundStudentIds = students.value.map(s => s.id)
      availableStudents.value = allStudents.filter((student: any) => !boundStudentIds.includes(student.id))
    } catch (error: any) {
      console.error('获取可绑定学生列表失败:', error)
      alert('获取可绑定学生列表失败: ' + (error.response?.data?.error || error.message))
    }
  }
  
  // 创建学生
  const createStudent = async () => {
    isCreatingStudent.value = true
    try {
      // 准备学生数据，确保role_id为2（普通用户）
      const studentData = {
        ...newStudent,
        role_id: 2 // 学生角色固定为普通用户
      }
      
      console.log('开始创建学生，数据:', studentData)
      
      // 第一步：创建学生
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('创建学生API响应:', result)
        
        // 第二步：获取学生ID
        console.log('完整API响应结构:', JSON.stringify(result, null, 2))
        
        // 尝试多种可能的学生ID字段（参考用户管理的逻辑）
        const studentId = result.id || 
                         result.data?.id || 
                         result.data?.user_id || 
                         result.user_id ||
                         result.user?.id ||
                         result.data?.user?.id
        
        console.log('创建学生成功，学生ID:', studentId, '完整响应:', result)
        
        if (studentId) {
          // 关闭对话框和重置表单
          closeCreateStudentDialog()
          resetNewStudent()
          
          if (autoBindStudent.value) {
            console.log('开始自动绑定学生，ID:', studentId)
            
            // 第三步：绑定学生到教师
            try {
              const bindResponse = await axios.post(`${BASE_URL}/teacher/${userInfo.value.id}/students`, {
                student_ids: [studentId]
              })
              
              console.log('绑定学生API响应:', bindResponse.data)
              
              // 检查绑定是否成功
              if (bindResponse.data.success === true || 
                  bindResponse.data.message?.includes('绑定') || 
                  bindResponse.data.message?.includes('成功') ||
                  bindResponse.status === 200) {
                
                // 第四步：刷新学生列表
                await fetchStudents()
                console.log('学生创建并绑定成功')
                
                // 显示成功消息
                setTimeout(() => {
                  showSuccess('学生创建并绑定成功！')
                }, 100)
              } else {
                console.error('绑定学生失败:', bindResponse.data)
                alert('学生创建成功，但绑定失败: ' + (bindResponse.data.message || '未知错误'))
              }
            } catch (bindError: any) {
              console.error('绑定学生出错:', bindError)
              // 检查是否是网络错误但实际操作成功的情况
              if (bindError.response?.data?.message?.includes('绑定') || 
                  bindError.response?.data?.message?.includes('成功')) {
                await fetchStudents()
                console.log('学生自动绑定成功（网络错误但操作成功）')
                
                setTimeout(() => {
                  showSuccess('学生创建并绑定成功！')
                }, 100)
              } else {
                alert('学生创建成功，但绑定失败: ' + (bindError.response?.data?.error || bindError.response?.data?.message || bindError.message))
              }
            }
          } else {
            console.log('用户选择不自动绑定，只创建学生账户')
            // 显示成功消息
            setTimeout(() => {
              showSuccess('学生创建成功！')
            }, 100)
          }
        } else {
          console.error('无法获取学生ID')
          alert('学生创建成功，但无法获取学生ID')
        }
      } else {
        const error = await response.json()
        console.error('创建学生失败:', error)
        alert('创建学生失败: ' + (error.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('创建学生出错:', error)
      alert('创建学生出错: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      // 确保无论成功还是失败都重置创建状态
      isCreatingStudent.value = false
    }
  }
  
  // 绑定学生
  const bindStudents = async (studentIds: number[]) => {
    if (!userInfo.value) return
    
    isBindingStudent.value = true
    try {
      const response = await axios.post(`${BASE_URL}/teacher/${userInfo.value.id}/students`, {
        student_ids: studentIds
      })
      
      console.log('绑定学生API响应:', response.data)
      
      // 检查多种可能的成功响应格式
      if (response.data.success === true || 
          response.data.message?.includes('绑定') || 
          response.data.message?.includes('成功') ||
          response.status === 200) {
        await fetchStudents()
        showSuccess('学生绑定成功！')
      } else {
        alert('绑定学生失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('绑定学生失败:', error)
      // 检查是否是网络错误但实际操作成功的情况
      if (error.response?.data?.message?.includes('绑定') || 
          error.response?.data?.message?.includes('成功')) {
        await fetchStudents()
        showSuccess('学生绑定成功！')
      } else {
        alert('绑定学生失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
      }
    } finally {
      isBindingStudent.value = false
    }
  }
  
  // 静默绑定学生（不显示成功消息，用于创建学生后的自动绑定）
  const bindStudentsSilently = async (studentIds: number[]) => {
    if (!userInfo.value) return
    
    try {
      const response = await axios.post(`${BASE_URL}/teacher/${userInfo.value.id}/students`, {
        student_ids: studentIds
      })
      
      console.log('静默绑定学生API响应:', response.data)
      
      // 检查多种可能的成功响应格式
      if (response.data.success === true || 
          response.data.message?.includes('绑定') || 
          response.data.message?.includes('成功') ||
          response.status === 200) {
        await fetchStudents()
        console.log('学生自动绑定成功')
      } else {
        console.error('学生自动绑定失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('学生自动绑定失败:', error)
      // 检查是否是网络错误但实际操作成功的情况
      if (error.response?.data?.message?.includes('绑定') || 
          error.response?.data?.message?.includes('成功')) {
        await fetchStudents()
        console.log('学生自动绑定成功（网络错误但操作成功）')
      } else {
        console.error('学生自动绑定失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
      }
    }
  }
  
  // 重置学生密码
  const resetStudentPassword = async (studentId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${studentId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_user_id: userInfo.value?.id
        })
      })
      
      if (response.ok) {
        showSuccess('密码重置成功！新密码为: 123456')
      } else {
        const error = await response.json()
        alert('重置密码失败: ' + (error.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('重置密码失败:', error)
      alert('重置密码失败: ' + error.message)
    }
  }
  
  // 解绑学生
  const unbindStudent = async (studentId: number) => {
    if (!userInfo.value) return
    
    // 直接执行解绑操作
    await performUnbindStudent(studentId)
  }
  
  // 执行解绑学生操作
  const performUnbindStudent = async (studentId: number) => {
    try {
      const response = await axios.delete(`${BASE_URL}/teacher/${userInfo.value.id}/students/${studentId}`)
      
      console.log('解绑学生API响应:', response.data)
      
      // 检查多种可能的成功响应格式
      if (response.data.success === true || 
          response.data.message?.includes('解绑') || 
          response.data.message?.includes('成功') ||
          response.status === 200) {
        await fetchStudents()
        showSuccess('学生解绑成功！')
      } else {
        alert('解绑学生失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('解绑学生失败:', error)
      // 检查是否是网络错误但实际操作成功的情况
      if (error.response?.data?.message?.includes('解绑') || 
          error.response?.data?.message?.includes('成功')) {
        await fetchStudents()
        showSuccess('学生解绑成功！')
      } else {
        alert('解绑学生失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
      }
    }
  }
  
  // 关闭创建学生对话框
  const closeCreateStudentDialog = () => {
    showCreateStudentDialog.value = false
    resetNewStudent()
  }
  
  // 关闭绑定学生对话框
  const closeBindStudentDialog = () => {
    showBindStudentDialog.value = false
    selectedStudentIds.value = []
    bindStudentSearchQuery.value = ''
  }
  
  // 关闭批量创建对话框
  const closeBatchCreateDialog = () => {
    showBatchCreateDialog.value = false
    batchStudents.value = [{ real_name: '' }]
  }
  
  // 添加批量学生
  const addBatchStudent = () => {
    batchStudents.value.push({ real_name: '' })
  }
  
  // 移除批量学生
  const removeBatchStudent = (index: number) => {
    if (batchStudents.value.length > 1) {
      batchStudents.value.splice(index, 1)
    }
  }
  
  // 汉字转拼音（使用 pinyin-pro 库）
  const toPinyin = (name: string): string => {
    return pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase()
  }
  
  // 生成用户名
  const generateUsername = (realName: string): string => {
    const pinyin = toPinyin(realName)
    const randomNum = Math.floor(Math.random() * 90 + 10) // 10-99
    return `${pinyin}${randomNum}`
  }
  
  // 批量创建学生
  const batchCreateStudents = async () => {
    if (validBatchStudents.value.length === 0) return
    
    isBatchCreating.value = true
    const results: { name: string; success: boolean; username?: string; error?: string }[] = []
    
    try {
      for (const student of validBatchStudents.value) {
        const username = generateUsername(student.real_name)
        const studentData = {
          username,
          password: '123456',
          real_name: student.real_name,
          role_id: 2
        }
        
        try {
          const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          })
          
          if (response.ok) {
            const result = await response.json()
            const studentId = result.id || result.data?.id || result.user_id
            
            // 自动绑定到教师
            if (studentId && userInfo.value) {
              await axios.post(`${BASE_URL}/teacher/${userInfo.value.id}/students`, {
                student_ids: [studentId]
              })
            }
            
            results.push({ name: student.real_name, success: true, username })
          } else {
            const error = await response.json()
            results.push({ name: student.real_name, success: false, error: error.message })
          }
        } catch (err: any) {
          results.push({ name: student.real_name, success: false, error: err.message })
        }
      }
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      let message = `批量创建完成！成功: ${successCount}`
      if (failCount > 0) {
        message += `，失败: ${failCount}`
      }
      
      // 显示详细结果
      const successList = results.filter(r => r.success).map(r => `${r.name}(${r.username})`).join('、')
      if (successList) {
        message += `\n\n成功创建: ${successList}\n初始密码: 123456`
      }
      
      alert(message)
      closeBatchCreateDialog()
      await fetchStudents()
    } catch (error: any) {
      console.error('批量创建学生失败:', error)
      alert('批量创建学生失败: ' + error.message)
    } finally {
      isBatchCreating.value = false
    }
  }
  
  // 重置新学生表单
  const resetNewStudent = () => {
    newStudent.username = ''
    newStudent.password = ''
    newStudent.email = ''
    newStudent.real_name = ''
    newStudent.role_id = 2
    autoBindStudent.value = true // 重置为默认选中状态
  }
  
  // 切换学生选择
  const toggleStudentSelection = (studentId: number) => {
    const index = selectedStudentIds.value.indexOf(studentId)
    if (index > -1) {
      selectedStudentIds.value.splice(index, 1)
    } else {
      selectedStudentIds.value.push(studentId)
    }
  }
  
  // 类型文本转换
  const getTypeText = (type: string) => {
    return type || '真题'
  }

  // 获取正确率等级样式
  function getAccuracyClass(accuracy: number) {
    if (accuracy >= 90) return 'excellent'
    if (accuracy >= 80) return 'good'
    if (accuracy >= 60) return 'pass'
    return 'fail'
  }
  
  // 计算通过率
  function getPassRate(problem: any) {
    if (!problem.total_submissions || problem.total_submissions === 0) return '0.0'
    const rate = (problem.accepted_submissions || 0) / problem.total_submissions * 100
    return rate.toFixed(1)
  }
  
  // 获取通过率样式类
  function getPassRateClass(problem: any) {
    const rate = parseFloat(getPassRate(problem))
    if (rate >= 80) return 'excellent'
    if (rate >= 60) return 'good'
    if (rate >= 40) return 'pass'
    return 'fail'
  }
  
  // 格式化日期
  function formatDate(dateString: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  // 处理考级筛选变化，保存状态
  function handleLevelChange() {
    // 保存筛选状态到 localStorage
    if (selectedLevel.value === null || selectedLevel.value === '') {
      localStorage.setItem('teacherView_selectedLevel', 'null')
    } else {
      localStorage.setItem('teacherView_selectedLevel', String(selectedLevel.value))
    }
    // 触发数据加载
    fetchExams()
  }

  // 获取考试列表
  const fetchExams = async () => {
    if (!userInfo.value) {
      console.log('用户信息未加载，跳过获取考试列表')
      return
    }
    
    console.log('开始获取考试列表')
    examsLoading.value = true
    try {
      const response = await axios.get(`${BASE_URL}/exams`)
      console.log('获取考试列表API响应:', response.data)
      
      // 处理不同的响应格式
      let examList = []
      if (response.data.data?.exams) {
        examList = response.data.data.exams
      } else if (response.data.exams) {
        examList = response.data.exams
      } else if (Array.isArray(response.data.data)) {
        examList = response.data.data
      } else if (Array.isArray(response.data)) {
        examList = response.data
      }
      
      exams.value = examList
      console.log('考试列表更新完成，考试数量:', examList.length)
    } catch (error: any) {
      console.error('获取考试列表失败:', error)
      console.error('错误详情:', error.response?.data)
      alert('获取考试列表失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
    } finally {
      examsLoading.value = false
    }
  }
  
  // 获取OJ题目列表
  const fetchOJProblems = async () => {
    if (!userInfo.value) {
      console.log('用户信息未加载，跳过获取OJ题目列表')
      return
    }
    
    console.log('开始获取OJ题目列表')
    ojProblemsLoading.value = true
    try {
      const params: any = {
        page: 1,
        pageSize: 1000
      }
      
      if (selectedOJLevel.value) {
        params.level = selectedOJLevel.value
      }
      
      const response = await axios.get(`${BASE_URL}/oj/problems`, { params })
      console.log('获取OJ题目列表API响应:', response.data)
      
      if (response.data.success) {
        ojProblems.value = response.data.data || []
        console.log('OJ题目列表更新完成，题目数量:', ojProblems.value.length)
      } else {
        ojProblems.value = []
      }
    } catch (error: any) {
      console.error('获取OJ题目列表失败:', error)
      console.error('错误详情:', error.response?.data)
      alert('获取OJ题目列表失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
      ojProblems.value = []
    } finally {
      ojProblemsLoading.value = false
    }
  }
  
  // 处理OJ级别筛选变化
  function handleOJLevelChange() {
    fetchOJProblems()
  }
  
  // 过滤后的OJ题目列表
  const filteredOJProblems = computed(() => {
    if (selectedOJLevel.value === null || selectedOJLevel.value === '') {
      return ojProblems.value
    }
    return ojProblems.value.filter(problem => problem.level === selectedOJLevel.value)
  })
  
  // 查看OJ题目提交记录
  function showOJProblemSubmissions(problem: any) {
    if (!userInfo.value) {
      console.log('用户信息未加载，无法跳转')
      return
    }
    
    // 保存当前状态到 localStorage
    saveCurrentState()
    
    // 跳转到 TeacherOJSubmissionsView，传递 teacherId 和 problemId
    router.push({
      path: `/teacher/${userInfo.value.id}/oj-submissions/${problem.id}`,
      query: { 
        fromSection: currentActiveSection.value,
        fromTeacherView: 'true'
      }
    })
  }
  
  // 显示考试学生详情 - 跳转到 StudentSubmissionsView
  const showExamStudents = (exam: any) => {
    if (!userInfo.value) {
      console.log('用户信息未加载，无法跳转')
      return
    }
    
    // 保存当前状态到 localStorage
    saveCurrentState()
    
    // 跳转到 StudentSubmissionsView，传递 exam_id 作为查询参数
    router.push({
      path: `/teacher/${userInfo.value.id}/submissions`,
      query: { 
        exam_id: exam.id.toString(),
        fromSection: currentActiveSection.value,
        fromTeacherView: 'true'
      }
    })
  }
  
  // 保存当前状态到 localStorage
  function saveCurrentState() {
    if (currentActiveSection.value) {
      localStorage.setItem('teacherView_activeSection', currentActiveSection.value)
    }
    if (openedSections.value.length > 0) {
      localStorage.setItem('teacherView_openedSections', JSON.stringify(openedSections.value))
    }
  }
  
  // 恢复状态
  function restoreState() {
    // 如果已经有打开的页面，不重复恢复
    if (openedSections.value.length > 0 && currentActiveSection.value) {
      console.log('已有打开的页面，跳过状态恢复')
      return
    }
    
    // 优先从路由查询参数恢复
    const fromSection = route.query.fromSection as string
    if (fromSection) {
      console.log('从路由查询参数恢复状态:', fromSection)
      // 先恢复打开的页面列表
      const savedOpenedSections = localStorage.getItem('teacherView_openedSections')
      if (savedOpenedSections) {
        try {
          const parsed = JSON.parse(savedOpenedSections)
          if (Array.isArray(parsed) && parsed.length > 0) {
            openedSections.value = parsed
          }
        } catch (e) {
          console.error('解析保存的打开页面列表失败:', e)
        }
      }
      openSection(fromSection)
      return
    }
    
    // 从 localStorage 恢复
    const savedSection = localStorage.getItem('teacherView_activeSection')
    const savedOpenedSections = localStorage.getItem('teacherView_openedSections')
    
    if (savedSection) {
      console.log('从 localStorage 恢复状态:', savedSection)
      if (savedOpenedSections) {
        try {
          const parsed = JSON.parse(savedOpenedSections)
          if (Array.isArray(parsed) && parsed.length > 0) {
            openedSections.value = parsed
          }
        } catch (e) {
          console.error('解析保存的打开页面列表失败:', e)
        }
      }
      openSection(savedSection)
    } else {
      // 默认打开客观题提交页面
      openSection('objective-submissions')
    }
  }
  
  // 获取考试学生提交情况
  const fetchExamStudents = async (examId: number) => {
    if (!userInfo.value) return
    
    console.log('开始获取考试学生提交情况，考试ID:', examId)
    examStudentsLoading.value = true
    try {
      const response = await axios.get(`${BASE_URL}/teacher/${userInfo.value.id}/exams/${examId}/students`)
      console.log('获取考试学生提交情况API响应:', response.data)
      
      // 处理响应数据
      let studentList = []
      if (response.data.students) {
        studentList = response.data.students
      } else if (response.data.data?.students) {
        studentList = response.data.data.students
      } else if (Array.isArray(response.data.data)) {
        studentList = response.data.data
      } else if (Array.isArray(response.data)) {
        studentList = response.data
      }
      
      // 确保每个学生对象都有正确的结构
      examStudents.value = studentList.map((student: any) => ({
        ...student,
        submission_info: student.submission_info || null,
        submission_status: student.submission_status || 'not_submitted'
      }))
      
      console.log('考试学生提交情况更新完成，学生数量:', examStudents.value.length)
    } catch (error: any) {
      console.error('获取考试学生提交情况失败:', error)
      console.error('错误详情:', error.response?.data)
      alert('获取考试学生提交情况失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
    } finally {
      examStudentsLoading.value = false
    }
  }
  
  
  // 关闭考试学生详情对话框
  const closeExamStudentsDialog = () => {
    showExamStudentsDialog.value = false
    selectedExam.value = null
    examStudents.value = []
  }
  
  // 显示学生错题详情
  const showStudentWrongQuestions = async (student: any) => {
    if (!userInfo.value || !selectedExam.value) return
    
    selectedStudentSubmission.value = student
    showStudentSubmissionDetail.value = true
    await fetchStudentWrongQuestions(student.student_id, selectedExam.value.id)
  }
  
  // 获取学生错题情况
  const fetchStudentWrongQuestions = async (studentId: number, examId: number) => {
    if (!userInfo.value) return
    
    console.log('开始获取学生错题情况，学生ID:', studentId, '考试ID:', examId)
    studentSubmissionLoading.value = true
    try {
      const response = await axios.get(`${BASE_URL}/teacher/${userInfo.value.id}/students/${studentId}/exams/${examId}/wrong-questions`)
      console.log('获取学生错题情况API响应:', response.data)
      
      studentSubmissionHistory.value = response.data
    } catch (error: any) {
      console.error('获取学生错题情况失败:', error)
      console.error('错误详情:', error.response?.data)
      alert('获取学生错题情况失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message))
    } finally {
      studentSubmissionLoading.value = false
    }
  }
  
  // 关闭学生提交详情对话框
  const closeStudentSubmissionDetail = () => {
    showStudentSubmissionDetail.value = false
    selectedStudentSubmission.value = null
    studentSubmissionHistory.value = null
  }
  
  
  // 初始化时打开默认页面
  onMounted(() => {
    getUserInfo()
    // 恢复之前的状态或打开默认页面
    if (userInfo.value) {
      restoreState()
    }
  })
  
  // 监听用户信息变化，当用户信息加载完成后恢复状态
  watch(userInfo, (newUserInfo) => {
    if (newUserInfo && openedSections.value.length === 0) {
      restoreState()
    }
  })
  
  // 监听路由变化，当从子页面返回时恢复状态
  watch(() => route.path, (newPath) => {
    // 如果返回到 /teacher 页面，且当前没有打开的子页面，则恢复状态
    if (newPath === '/teacher' && openedSections.value.length === 0 && userInfo.value) {
      restoreState()
    }
  })

  // 监听 selectedLevel 变化，自动保存状态
  watch(selectedLevel, (newLevel) => {
    if (newLevel === null || newLevel === '') {
      localStorage.setItem('teacherView_selectedLevel', 'null')
    } else {
      localStorage.setItem('teacherView_selectedLevel', String(newLevel))
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
    display: flex;
    flex-direction: column;
  }

  /* 标签栏样式 */
  .tabs-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: none;
    padding: 0 24px;
    position: fixed;
    top: 48px; /* NavBar 的高度 */
    left: 200px; /* 侧边栏的宽度 */
    right: 0;
    z-index: 30;
    box-shadow: none;
  }

  .tabs-container {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    padding: 4px 0;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    min-width: fit-content;
    position: relative;
  }

  .tab-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }

  .tab-item.active {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.05) 100%);
    border-color: #1e90ff;
    color: #1e90ff;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
  }

  .tab-item.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #1e90ff 0%, #38bdf8 100%);
    border-radius: 2px 2px 0 0;
  }

  .tab-label {
    flex: 1;
  }

  .tab-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    border-radius: 4px;
    transition: all 0.2s ease;
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
  }

  .tab-close:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .tab-item.active .tab-close {
    color: #64748b;
  }

  .tab-item.active .tab-close:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  /* 标签栏不影响内容布局，内容正常平铺显示 */
  /* 标签栏是固定定位，覆盖在内容上方，但不影响内容流 */

  .content-section {
    background: #f8fafc;
    padding: 32px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    width: 100%;
    margin: 0 auto 32px auto;
    border: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  .content-section.learning-plan-section {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* 表格列表样式 - 参考 StudentSubmissionsView */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .section-header .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .section-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .section-header .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .count-info {
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }

  .table-container {
    width: 100%;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
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
    padding: 60px 20px;
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
    margin: 0;
    color: #64748b;
    font-size: 16px;
  }

  /* 表格容器 */
  .data-table-container {
    background: white;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    overflow: hidden;
    width: 100%;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table thead {
    background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  }

  .data-table th {
    padding: 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: white;
    white-space: nowrap;
  }

  .data-table td {
    padding: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 14px;
    color: #1e293b;
  }

  .table-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  /* 表格单元格样式 */
  .exam-name-cell,
  .student-name-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .exam-name-text,
  .student-name-text {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
  }

  .exam-level-badge {
    font-weight: 600;
    color: #1e90ff;
    font-size: 14px;
  }

  .type-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }

  .type-真题 {
    background: #e0f7fa;
    color: #1e90ff;
  }

  .type-模拟 {
    background: #fef3c7;
    color: #d97706;
  }

  .type-专项 {
    background: #d1fae5;
    color: #065f46;
  }

  .question-count {
    font-weight: 500;
    color: #1e293b;
  }

  .date-cell {
    color: #64748b;
    font-size: 13px;
  }

  .username-text {
    color: #64748b;
    font-size: 14px;
  }

  .email-text {
    color: #64748b;
    font-size: 14px;
  }

  .submission-count {
    font-weight: 600;
    color: #1e293b;
  }

  .accuracy-rate {
    font-weight: 600;
    font-size: 14px;
  }

  .accuracy-rate.excellent {
    color: #22c55e;
  }

  .accuracy-rate.good {
    color: #3b82f6;
  }

  .accuracy-rate.pass {
    color: #f59e0b;
  }

  .accuracy-rate.fail {
    color: #ef4444;
  }

  .pass-rate {
    font-weight: 600;
    font-size: 14px;
  }

  .pass-rate.excellent {
    color: #22c55e;
  }

  .pass-rate.good {
    color: #3b82f6;
  }

  .pass-rate.pass {
    color: #f59e0b;
  }

  .pass-rate.fail {
    color: #ef4444;
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

  @media (max-width: 768px) {
    .sidebar {
      width: 200px;
    }
    
    .main-content {
      margin-left: 200px;
      padding: 20px;
    }
  }

  /* 学生管理样式 */
  .student-management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .student-management-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding: 12px 16px 12px 40px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    width: 300px;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: #64748b;
    font-size: 16px;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 50%;
    transform: translateY(-50%);
  }

  .btn-primary {
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-secondary:hover {
    background: #e2e8f0;
    color: #475569;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2);
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-delete {
    color: #ef4444;
  }

  .btn-delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .students-container {
    margin-top: 24px;
  }

  .students-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }

  .student-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .student-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .student-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.02) 100%);
    border-bottom: 1px solid #e2e8f0;
  }

  .student-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .student-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
  }

  .student-details h3 {
    margin: 0 0 4px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }

  .student-details p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }

  .student-actions {
    display: flex;
    gap: 8px;
  }

  .student-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px 20px;
    background: #f8fafc;
  }

  .student-stats .stat-item {
    text-align: center;
  }

  .student-stats .stat-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .student-stats .stat-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #1e90ff;
  }

  /* 对话框样式 */
  .dialog-overlay {
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
  }

  .dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-large {
    max-width: 800px;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .dialog-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #64748b;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .btn-close:hover {
    background: #f1f5f9;
    color: #475569;
  }

  .dialog-body {
    padding: 24px;
  }

  .user-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 8px;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
  }

  .form-group input,
  .form-group select {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  /* 绑定学生对话框样式 */
  .available-students h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }

  .students-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .student-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .student-option:hover {
    background: #f8fafc;
    border-color: #1e90ff;
  }

  .student-option.selected {
    background: #eff6ff;
    border-color: #1e90ff;
  }

  .student-option input[type="checkbox"] {
    margin: 0;
    accent-color: #1e90ff;
  }

  .student-option-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .student-avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
  }

  .student-option-details h5 {
    margin: 0 0 2px 0;
    color: #1e293b;
    font-size: 14px;
    font-weight: 600;
  }

  .student-option-details p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }

  .search-results-info {
    margin: 12px 0;
    padding: 8px 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 14px;
    color: #0369a1;
  }

  .search-results-info span {
    font-weight: 500;
  }

  /* 学生详情对话框样式 */
  .student-detail-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .student-detail-header {
    display: flex;
    align-items: center;
      gap: 20px;
      padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.02) 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .student-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    display: flex;
      align-items: center;
      justify-content: center;
    font-weight: 600;
    font-size: 32px;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .student-detail-info h2 {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-size: 24px;
    font-weight: 600;
  }

  .student-detail-info p {
    margin: 0 0 4px 0;
    color: #64748b;
    font-size: 16px;
  }

  .student-detail-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0ea5e9;
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.05) 100%);
    border-radius: 12px;
  }

  .stat-content {
    flex: 1;
  }

  .stat-number {
    font-size: 24px;
    font-weight: 700;
    color: #1e90ff;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .student-detail-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-warning:hover {
    background: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  .btn-danger {
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-danger:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .icon-arrow {
    color: #64748b;
    font-size: 18px;
    font-weight: bold;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .students-grid {
      grid-template-columns: 1fr;
    }

    .student-management-header {
    flex-direction: column;
      align-items: flex-start;
    }

    .header-actions {
      flex-direction: column;
      align-items: stretch;
    gap: 12px;
      width: 100%;
    }

    .search-input {
      width: 100%;
    }

    .form-row {
      flex-direction: column;
      gap: 0;
    }

    .dialog {
      width: 95%;
      margin: 20px;
    }

    .dialog-actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
    }

    .student-detail-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }

    .student-detail-stats {
      grid-template-columns: 1fr;
    }

    .student-detail-actions {
      flex-direction: column;
    }

  .btn-danger {
    width: 100%;
  }
  }

  /* 角色信息样式 */
  .role-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .role-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }

  .role-badge.role-user {
    background: #bee3f8;
    color: #2b6cb0;
  }

  .role-description {
    font-size: 12px;
    color: #64748b;
    font-style: italic;
  }

  /* 自动绑定选项样式 */
  .bind-option {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .bind-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 0;
  }

  .bind-checkbox input[type="checkbox"] {
    margin: 0;
    accent-color: #1e90ff;
    width: 16px;
    height: 16px;
  }

  .bind-label {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }

  .bind-description {
    font-size: 12px;
    color: #64748b;
    font-style: italic;
    margin-left: 24px;
  }

  /* 学生提交相关样式 */
  .student-submissions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .student-submissions-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .level-filter {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .level-filter label {
    color: #64748b;
    font-weight: 600;
    font-size: 14px;
  }

  .level-select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .level-select:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .exams-container {
    margin-top: 24px;
  }

  .exams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }

  .exam-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .exam-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .exam-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.02) 100%);
    border-bottom: 1px solid #e2e8f0;
  }

  .exam-info h3 {
    margin: 0 0 4px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }

  .exam-info p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }

  .exam-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .type-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .type-真题 { background: #e0f7fa; color: #1e90ff; }
  .type-模拟 { background: #fef3c7; color: #d97706; }
  .type-专项 { background: #d1fae5; color: #065f46; }

  .exam-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px 20px;
    background: #f8fafc;
  }

  .exam-stats .stat-item {
    text-align: center;
  }

  .exam-stats .stat-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .exam-stats .stat-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #1e90ff;
  }

  /* 考试学生详情对话框样式 */
  .exam-students-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .exam-summary {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.02) 100%);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e2e8f0;
  }

  .summary-card {
    display: flex;
    justify-content: space-around;
    gap: 20px;
  }

  .summary-item {
    text-align: center;
  }

  .summary-label {
    display: block;
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .summary-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #1e90ff;
  }

  .students-submission-list h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
  }

  .students-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 500px;
    overflow-y: auto;
  }

  .student-submission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .student-submission-item.submitted {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
  }

  .student-submission-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .student-submission-details h5 {
    margin: 0 0 4px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }

  .student-submission-details p {
    margin: 0 0 8px 0;
    color: #64748b;
    font-size: 14px;
  }

  .submission-status {
    margin-top: 8px;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge.submitted {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.not-submitted {
    background: #fee2e2;
    color: #991b1b;
  }

  .submission-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .submission-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: right;
  }

  .info-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .info-label {
    font-size: 12px;
    color: #64748b;
  }

  .info-value {
    font-size: 14px;
    font-weight: 600;
  }

  .info-value.score {
    color: #1e90ff;
  }

  /* 学生提交详情对话框样式 */
  .submission-detail-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .exam-info-section,
  .student-info-section,
  .statistics-section,
  .submissions-section {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .exam-info-section h4,
  .student-info-section h4,
  .statistics-section h4,
  .submissions-section h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .info-card {
    background: #ffffff;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 600;
    color: #64748b;
    font-size: 14px;
  }

  .info-value {
    font-weight: 500;
    color: #1e293b;
    font-size: 14px;
  }

  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .submissions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .submission-item {
    background: #ffffff;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .submission-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .submission-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .submission-attempt {
    display: flex;
    align-items: center;
  }

  .attempt-label {
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
  }

  .submission-score {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .score-value {
    font-size: 24px;
    font-weight: 700;
    color: #1e90ff;
  }

  .score-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .submission-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .detail-value {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }

  /* 错题相关样式 */
  .wrong-questions-section {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .wrong-questions-section h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .wrong-questions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 500px;
    overflow-y: auto;
  }

  .wrong-question-item {
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .wrong-question-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
  }

  .question-number {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .question-label {
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
  }

  .question-id {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .question-meta {
    display: flex;
    gap: 8px;
  }

  .difficulty-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .difficulty-badge.easy {
    background: #d1fae5;
    color: #065f46;
  }

  .difficulty-badge.medium {
    background: #fef3c7;
    color: #92400e;
  }

  .difficulty-badge.hard {
    background: #fee2e2;
    color: #991b1b;
  }

  .level-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    background: #e0e7ff;
    color: #3730a3;
  }

  .question-content {
    margin-bottom: 16px;
  }

  .question-text {
    font-size: 16px;
    line-height: 1.6;
    color: #1e293b;
    font-weight: 500;
  }

  .answer-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background: #fef2f2;
    border-radius: 8px;
    border: 1px solid #fecaca;
  }

  .answer-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .answer-label {
    font-weight: 600;
    color: #374151;
    font-size: 14px;
    min-width: 80px;
  }

  .student-answer {
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
  }

  .student-answer.wrong {
    background: #fee2e2;
    color: #dc2626;
  }

  .correctness {
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .correctness.wrong {
    color: #dc2626;
  }

  .correctness :deep(.lucide-icon) {
    flex-shrink: 0;
    color: inherit;
  }

  .explanation-section {
    padding: 16px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bae6fd;
  }

  .explanation-label {
    font-weight: 600;
    color: #0369a1;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .explanation-text {
    font-size: 14px;
    line-height: 1.6;
    color: #0c4a6e;
  }

  /* 批量导入学生样式 */
  .batch-info {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .batch-info p {
    margin: 0;
    color: #0369a1;
    font-size: 14px;
  }

  .batch-students-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .batch-student-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .batch-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .batch-input:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .btn-remove {
    background: #fee2e2;
    color: #dc2626;
    border: none;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-remove:hover {
    background: #fecaca;
  }

  .btn-add-student {
    background: #f0f9ff;
    color: #0369a1;
    border: 1px dashed #bae6fd;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 24px;
  }

  .btn-add-student:hover {
    background: #e0f2fe;
    border-color: #7dd3fc;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .exams-grid {
      grid-template-columns: 1fr;
    }

    .student-submissions-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .level-filter {
      width: 100%;
      justify-content: space-between;
    }

    .level-select {
      flex: 1;
      max-width: 200px;
    }

    .summary-card {
      flex-direction: column;
      gap: 16px;
    }

    .student-submission-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .submission-details {
      align-items: flex-start;
      width: 100%;
    }

    .submission-info {
      text-align: left;
    }

    .statistics-grid {
      grid-template-columns: 1fr;
    }

    .submission-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .submission-score {
      align-self: flex-end;
    }

    .info-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .question-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .question-meta {
      align-self: flex-end;
    }

    .answer-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .answer-label {
      min-width: auto;
    }
  }
  </style>