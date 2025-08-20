<template>
  <div class="submissions-layout">
    <div class="submissions-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h2 class="submissions-title">提交记录</h2>
        </div>
        <div class="header-right">
          <div class="filter-controls">
            <select v-model="selectedExamId" @change="filterSubmissions" class="exam-filter">
              <option value="">所有考试</option>
              <option v-for="exam in exams" :key="exam.id" :value="exam.id">
                {{ exam.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="submissions-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ submissions.length }}</span>
            <span class="stat-label">总提交次数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ averageScore }}</span>
            <span class="stat-label">平均分数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ bestScore }}</span>
            <span class="stat-label">最高分数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ recentSubmissions }}</span>
            <span class="stat-label">最近7天</span>
          </div>
        </div>
      </div>

      <!-- 提交记录列表 -->
      <div class="submissions-list">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="submissions.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>暂无提交记录</h3>
          <p>开始参加考试来创建您的第一条提交记录</p>
          <button @click="goToExams" class="btn btn-primary">去考试</button>
        </div>
        
        <div v-else class="submissions-grid">
          <div 
            v-for="submission in submissions" 
            :key="submission.id"
            class="submission-card"
            :class="{ 'best-score': submission.score === bestScore }"
          >
            <div class="submission-header">
              <div class="exam-info">
                <h3 class="exam-name">{{ submission.exam_name }}</h3>
                <span class="submission-time">{{ formatTime(submission.submit_time) }}</span>
              </div>
              <div class="score-display" :class="getScoreClass(submission.score)">
                <span class="score-number">{{ submission.score }}</span>
                <span class="score-label">分</span>
              </div>
            </div>
            
            <div class="submission-details">
              <div class="detail-row">
                <span class="detail-label">尝试次数:</span>
                <span class="detail-value">第{{ submission.attempt_number }}次</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">正确题数:</span>
                <span class="detail-value correct">{{ submission.correct_count }}/{{ submission.total_questions }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">正确率:</span>
                <span class="detail-value">{{ Math.round((submission.correct_count / submission.total_questions) * 100) }}%</span>
              </div>
            </div>
            
            <div class="submission-actions">
              <button @click="viewSubmissionDetail(submission.id)" class="btn btn-primary">
                <i class="fas fa-eye"></i> 查看详情
              </button>
              <button @click="retakeExam(submission.exam_id)" class="btn btn-secondary">
                <i class="fas fa-redo"></i> 重新考试
              </button>
            </div>
            
            <div v-if="submission.score === bestScore" class="best-badge">
              <i class="fas fa-crown"></i> 最高分
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Submission {
  id: number;
  user_id: number;
  exam_id: number;
  exam_name: string;
  score: number;
  correct_count: number;
  total_questions: number;
  attempt_number: number;
  submit_time: string;
}

interface Exam {
  id: number;
  name: string;
  level: number;
}

export default defineComponent({
  name: 'SubmissionsView',
  data() {
    return {
      BASE_URL: "http://localhost:3000/api",
      loading: true,
      error: null as string | null,
      submissions: [] as Submission[],
      exams: [] as Exam[],
      selectedExamId: '',
      currentUser: null as any
    };
  },
  computed: {
    averageScore(): number {
      if (this.submissions.length === 0) return 0;
      const total = this.submissions.reduce((sum, sub) => sum + sub.score, 0);
      return Math.round(total / this.submissions.length);
    },
    bestScore(): number {
      if (this.submissions.length === 0) return 0;
      return Math.max(...this.submissions.map(sub => sub.score));
    },
    recentSubmissions(): number {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return this.submissions.filter(sub => new Date(sub.submit_time) > sevenDaysAgo).length;
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.currentUser = this.getCurrentUser();
      if (!this.currentUser) {
        this.error = '请先登录';
        return;
      }
      
      await Promise.all([
        this.loadSubmissions(),
        this.loadExams()
      ]);
    },
    
    async loadSubmissions() {
      try {
        this.loading = true;
        const params = new URLSearchParams({
          user_id: this.currentUser.id.toString()
        });
        
        if (this.selectedExamId) {
          params.append('exam_id', this.selectedExamId);
        }
        
        const response = await fetch(`${this.BASE_URL}/submissions?${params}`);
        
        if (!response.ok) {
          throw new Error(`获取提交记录失败: ${response.status}`);
        }
        
        const data = await response.json();
        this.submissions = data;
        
      } catch (error: any) {
        this.error = error.message;
        console.error('加载提交记录错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadExams() {
      try {
        const response = await fetch(`${this.BASE_URL}/exams`);
        
        if (!response.ok) {
          throw new Error(`获取考试列表失败: ${response.status}`);
        }
        
        const data = await response.json();
        this.exams = data;
        
      } catch (error: any) {
        console.error('加载考试列表错误:', error);
      }
    },
    
    filterSubmissions() {
      this.loadSubmissions();
    },
    
    getCurrentUser() {
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
    },
    
    goBack() {
      const router = useRouter();
      router.back();
    },
    
    goToExams() {
      const router = useRouter();
      router.push('/select-level');
    },
    
    viewSubmissionDetail(submissionId: number) {
      const router = useRouter();
      router.push(`/submission/${submissionId}`);
    },
    
    retakeExam(examId: number) {
      const router = useRouter();
      router.push(`/exam/${examId}`);
    },
    
    formatTime(timeString: string) {
      if (!timeString) return '';
      const date = new Date(timeString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getScoreClass(score: number) {
      if (score >= 90) return 'score-excellent';
      if (score >= 80) return 'score-good';
      if (score >= 60) return 'score-pass';
      return 'score-fail';
    }
  }
});
</script>

<style scoped>
.submissions-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 0;
  margin: 0;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.submissions-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 20px 30px;
  color: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-2px);
}

.submissions-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
}

.exam-filter {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.exam-filter option {
  background: #1e90ff;
  color: white;
}

.submissions-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 2px solid #e0f2fe;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 4px;
}

.submissions-list {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.15);
  border: 2px solid #e0f2fe;
  flex: 1;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  color: #1e90ff;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}

.submissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.submission-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.submission-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.15);
  border-color: #1e90ff;
}

.submission-card.best-score {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.exam-info {
  flex: 1;
}

.exam-name {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  color: #1e293b;
  font-weight: 600;
}

.submission-time {
  font-size: 0.9rem;
  color: #64748b;
}

.score-display {
  text-align: center;
  padding: 8px 12px;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  min-width: 80px;
}

.score-display.score-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.score-display.score-good {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.score-display.score-pass {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.score-display.score-fail {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.score-number {
  display: block;
  font-size: 1.5rem;
  line-height: 1;
}

.score-label {
  font-size: 0.8rem;
}

.submission-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #64748b;
  font-size: 0.9rem;
}

.detail-value {
  color: #1e293b;
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-value.correct {
  color: #22c55e;
}

.submission-actions {
  display: flex;
  gap: 12px;
}

.submission-actions .btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.submission-actions .btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.submission-actions .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.submission-actions .btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.submission-actions .btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

.best-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

@media (max-width: 768px) {
  .submissions-content {
    padding: 20px 15px;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .submissions-grid {
    grid-template-columns: 1fr;
  }
  
  .submission-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .submission-actions {
    flex-direction: column;
  }
}
</style>
