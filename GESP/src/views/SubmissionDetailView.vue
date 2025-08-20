<template>
  <div class="submission-detail-layout">
    <div class="submission-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h2 class="submission-title">答题详情</h2>
        </div>
        <div class="header-right">
          <div class="submission-info">
            <span class="exam-name">{{ submissionData.exam_name }}</span>
            <span class="exam-level">{{ getLevelText(submissionData.exam_level) }}</span>
            <span class="submission-time">{{ formatTime(submissionData.submit_time) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="submission-content">
      <!-- 成绩概览 -->
      <div class="score-overview">
        <div class="score-card">
          <div class="score-circle" :class="getScoreClass(submissionData.score)">
            <span class="score-number">{{ submissionData.score }}</span>
            <span class="score-label">分</span>
          </div>
          <div class="score-details">
            <h3>{{ getScoreText(submissionData.score) }}</h3>
            <p>第{{ submissionData.attempt_number }}次尝试</p>
            <div class="score-stats">
              <div class="stat">
                <span class="stat-value correct">{{ submissionData.correct_count }}</span>
                <span class="stat-label">正确</span>
              </div>
              <div class="stat">
                <span class="stat-value wrong">{{ submissionData.total_questions - submissionData.correct_count }}</span>
                <span class="stat-label">错误</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ Math.round((submissionData.correct_count / submissionData.total_questions) * 100) }}%</span>
                <span class="stat-label">正确率</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 答题详情列表 -->
      <div class="answers-list">
        <h3 class="section-title">答题详情</h3>
        <div class="answers-container">
          <div 
            v-for="(answer, index) in submissionData.answers" 
            :key="index"
            class="answer-item"
            :class="{ 'correct': answer.is_correct, 'incorrect': !answer.is_correct }"
          >
            <div class="answer-header">
              <div class="question-number">
                <span class="number-badge">{{ index + 1 }}</span>
                <span class="status-badge" :class="{ 'correct': answer.is_correct, 'incorrect': !answer.is_correct }">
                  <i :class="answer.is_correct ? 'fas fa-check' : 'fas fa-times'"></i>
                  {{ answer.is_correct ? '正确' : '错误' }}
                </span>
              </div>
              <div class="answer-score">
                <span class="score-text">{{ answer.is_correct ? '+1' : '0' }}分</span>
              </div>
            </div>
            
            <div class="question-content">
              <div class="question-text">
                <p>{{ answer.question_text }}</p>
              </div>
              
              <div class="answer-comparison">
                <div class="user-answer">
                  <h4>您的答案</h4>
                  <div class="answer-option" :class="{ 'wrong': !answer.is_correct }">
                    <span class="option-label">{{ answer.user_answer }}</span>
                  </div>
                </div>
                
                <div v-if="!answer.is_correct" class="correct-answer">
                  <h4>正确答案</h4>
                  <div class="answer-option correct">
                    <span class="option-label">{{ answer.correct_answer }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="answer.explanation" class="explanation">
                <h4>解析</h4>
                <p>{{ answer.explanation }}</p>
              </div>
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

interface Answer {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  correct_answer: string;
  question_text: string;
  explanation?: string;
}

interface SubmissionData {
  submission_id: number;
  user_id: number;
  exam_id: number;
  exam_name: string;
  exam_level: number;
  score: number;
  correct_count: number;
  total_questions: number;
  attempt_number: number;
  submit_time: string;
  answers: Answer[];
}

export default defineComponent({
  name: 'SubmissionDetailView',
  data() {
    return {
      BASE_URL: "http://localhost:3000/api",
      loading: true,
      error: null as string | null,
      submissionData: {} as SubmissionData
    };
  },
  mounted() {
    this.loadSubmissionDetail();
  },
  methods: {
    async loadSubmissionDetail() {
      const route = useRoute();
      const submissionId = route.params.submissionId as string;
      
      if (!submissionId) {
        this.error = '无效的提交ID';
        this.loading = false;
        return;
      }
      
      try {
        this.loading = true;
        const response = await fetch(`${this.BASE_URL}/submissions/${submissionId}`);
        
        if (!response.ok) {
          throw new Error(`获取提交详情失败: ${response.status}`);
        }
        
        const data = await response.json();
        // 合并提交信息和答案信息
        this.submissionData = {
          ...data.submission,
          answers: data.answers
        };
        
      } catch (error: any) {
        this.error = error.message;
        console.error('加载提交详情错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      const router = useRouter();
      // 返回到对应等级的考试列表页面
      if (this.submissionData.exam_level) {
        router.push(`/level-exams/${this.submissionData.exam_level}`);
      } else {
        // 如果没有等级信息，返回到等级选择页面
        router.push('/select-level');
      }
    },
    
    formatTime(timeString: string) {
      if (!timeString) return '';
      const date = new Date(timeString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    getScoreClass(score: number) {
      if (score >= 90) return 'score-excellent';
      if (score >= 80) return 'score-good';
      if (score >= 60) return 'score-pass';
      return 'score-fail';
    },
    
    getScoreText(score: number) {
      if (score >= 90) return '优秀';
      if (score >= 80) return '良好';
      if (score >= 60) return '及格';
      return '不及格';
    },
    
    getLevelText(level: number) {
      if (level === 6) return 'CSP-J';
      return `GESP ${level}级`;
    }
  }
});
</script>

<style scoped>
.submission-detail-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 0;
  margin: 0;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.submission-header {
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

.submission-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.header-right {
  text-align: right;
}

.submission-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-name {
  font-size: 1.2rem;
  font-weight: 600;
}

.exam-level {
  font-size: 0.9rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin: 4px 0;
  display: inline-block;
}

.submission-time {
  font-size: 0.9rem;
  opacity: 0.9;
}

.submission-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.score-overview {
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}

.score-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.15);
  display: flex;
  align-items: center;
  gap: 30px;
  border: 2px solid #e0f2fe;
  width: 100%;
  max-width: 600px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  position: relative;
  animation: scorePulse 2s ease-in-out infinite;
}

.score-circle.score-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
}

.score-circle.score-good {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.score-circle.score-pass {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

.score-circle.score-fail {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
}

@keyframes scorePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.score-number {
  font-size: 2.5rem;
  line-height: 1;
}

.score-label {
  font-size: 1rem;
  margin-top: 4px;
}

.score-details {
  flex: 1;
}

.score-details h3 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  color: #1e293b;
}

.score-details p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 1rem;
}

.score-stats {
  display: flex;
  gap: 20px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-value.correct {
  color: #22c55e;
}

.stat-value.wrong {
  color: #ef4444;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
}

.answers-list {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.15);
  border: 2px solid #e0f2fe;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-title {
  margin: 0 0 30px 0;
  font-size: 1.5rem;
  color: #1e293b;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 15px;
}

.answers-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 800px;
}

.answer-item {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.answer-item.correct {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.answer-item.incorrect {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-badge {
  background: #1e90ff;
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-badge.correct {
  background: #22c55e;
  color: white;
}

.status-badge.incorrect {
  background: #ef4444;
  color: white;
}

.answer-score {
  font-size: 1.1rem;
  font-weight: 700;
}

.score-text {
  color: #1e90ff;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-text p {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  line-height: 1.6;
  font-weight: 500;
}

.answer-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.user-answer h4,
.correct-answer h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.answer-option {
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: white;
  font-weight: 600;
  font-size: 1rem;
}

.answer-option.correct {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
}

.answer-option.wrong {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

.option-label {
  font-weight: 700;
}

.explanation {
  background: #f8fafc;
  border-left: 4px solid #1e90ff;
  padding: 16px 20px;
  border-radius: 8px;
}

.explanation h4 {
  margin: 0 0 8px 0;
  color: #1e90ff;
  font-size: 1rem;
  font-weight: 600;
}

.explanation p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .submission-content {
    padding: 20px 15px;
    justify-content: flex-start;
  }
  
  .score-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    max-width: 100%;
  }
  
  .score-stats {
    justify-content: center;
  }
  
  .answer-comparison {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .answer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .answers-container {
    max-width: 100%;
  }
}
</style>
