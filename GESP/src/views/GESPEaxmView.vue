<template>
  <div class="exam-layout">
    <div class="exam-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="exam-title">{{ examInfo.name || '加载中...' }}</h2>
        </div>
        <div class="header-center">
          <div class="nav-buttons">
            <button class="btn btn-secondary nav-btn" @click="prevQuestion" :disabled="currentQuestionIndex === 0">
              <i class="fas fa-chevron-left"></i> 上一题
            </button>
            <div class="progress-info">
              <span>进度: {{ answeredCount }}/{{ questions.length }}</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
            </div>
            <button class="btn btn-secondary nav-btn" @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1">
              下一题 <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="header-right">
          <button 
            class="btn btn-primary submit-btn-header" 
            @click="submitAnswers" 
            :disabled="loading || questions.length === 0"
          >
            <i class="fas fa-paper-plane"></i> 提交答题
          </button>
        </div>
      </div>
    </div>

    <div class="exam-content exam-content-flex-row">
      <!-- 侧边栏：题号与完成状态 - 垂直排列 -->
      <div class="sidebar-vertical">
        <div 
          v-for="(question, idx) in questions" 
          :key="idx" 
          class="sidebar-item"
          :class="{
            'sidebar-item--active': idx === currentQuestionIndex,
            'sidebar-item--answered': answers[idx],
            'sidebar-item--unanswered': highlightUnanswered && !answers[idx]
          }"
          @click="goToQuestion(idx)"
        >
          <span class="sidebar-number">{{ idx + 1 }}</span>
          <span class="sidebar-status">
            <i v-if="answers[idx]" class="fas fa-check-circle"></i>
            <i v-else class="fas fa-circle"></i>
          </span>
        </div>
      </div>
      <!-- 主体：单题展示 -->
      <div class="question-main">
        <transition name="fade-slide" mode="out-in">
          <div v-if="questions.length > 0" :key="currentQuestionIndex" class="question-card">
            <div class="question-card-header">
              <div class="question-number">
                <span class="number-badge">{{ currentQuestionIndex + 1 }}</span>
                <span class="level-badge">GESP {{ currentQuestion.level }}级</span>
              </div>
              <div :class="answers[currentQuestionIndex] ? 'status-answered' : 'status-unanswered'">
                {{ answers[currentQuestionIndex] ? '已回答' : '未作答' }}
              </div>
            </div>
            
            <!-- 统一的内容滚动区域 -->
            <div class="question-content-unified">
              <!-- 题目文本 -->
              <div class="content-section question-text-section">
                <div class="section-content">
                  <p class="question-text">{{ currentQuestion.question_text }}</p>
                </div>
              </div>
              
              <!-- 题目图片显示 -->
              <div v-if="(currentQuestion.images && currentQuestion.images.length > 0) || currentQuestion.image_url" 
                   class="content-section images-section">
                <div class="section-content">
                  <div class="images-grid">
                    <!-- 显示题目主图片 -->
                    <div 
                      v-if="currentQuestion.image_url"
                      class="image-item"
                      @click="openImageModal(currentQuestion.image_url)"
                    >
                      <img 
                        :src="currentQuestion.image_url" 
                        :alt="`题目图片`"
                        class="question-image"
                      />
                      <div class="image-info">
                        <span class="image-order">题目图片</span>
                      </div>
                    </div>
                    <!-- 显示附加图片 -->
                    <div 
                      v-for="(image, index) in currentQuestion.images" 
                      :key="index"
                      class="image-item"
                      @click="openImageModal(image.image_url)"
                    >
                      <img 
                        :src="image.image_url" 
                        :alt="`附加图片 ${index + 1}`"
                        class="question-image"
                      />
                      <div class="image-info">
                        <span class="image-order">附加图片 {{ index + 1 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 代码题目显示 -->
              <div v-if="currentQuestion.question_type === 'code'" class="content-section code-section">
                <div class="section-content">
                  <pre v-if="currentQuestion.question_code" class="code-block"><code>{{ currentQuestion.question_code }}</code></pre>
                  <div v-else class="code-placeholder">
                    <p>暂无代码内容</p>
                  </div>
                </div>
              </div>
              
              <!-- 选项部分 -->
              <div class="content-section options-section">
                <div class="section-content">
                  <div class="options-list">
                    <label 
                      v-for="option in currentQuestion.options" 
                      :key="option.option_label" 
                      class="option-item"
                      :class="{ 'option-selected': answers[currentQuestionIndex] === option.option_value }"
                      @click="selectOption(option.option_value)"
                    >
                      <span class="option-label">{{ option.option_label }}.</span>
                      <span class="option-text">{{ option.option_text }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <!-- 右侧解析栏 -->
      <div class="sidebar-explanation">   
        
        <div class="question-explanation">
          <transition name="explanation-slide" mode="out-in">
            <div v-show="showExplain" class="explanation-content" key="explanation">
              <p>{{ currentQuestion.explanation }}</p>
            </div>
          </transition>
        </div>
    </div>
    </div>
  </div>

  <!-- 浮动题目解析按钮 -->
  <div class="floating-ai-button">
    <button class="ai-button" @click="toggleAIPanel">
      <span class="ai-button-text">题目解析</span>
      <i class="fas fa-lightbulb"></i>
    </button>
  </div>

  <!-- 题目解析面板 -->
  <transition name="fade">
    <div v-if="showAIPanel" class="ai-panel">
      <div class="ai-panel-header">
        <h3>题目解析</h3>
        <button class="ai-close-btn" @click="toggleAIPanel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ai-panel-content">
        <div v-if="loading" class="ai-placeholder">
          <i class="fas fa-spinner ai-placeholder-icon"></i>
          正在加载解析...
        </div>
        <div v-else-if="currentQuestion.explanation">
          <div class="ai-response-header">
            <i class="fas fa-lightbulb"></i>
            题目解析
          </div>
          <div class="explanation-content">
            <p>{{ currentQuestion.explanation }}</p>
          </div>
        </div>
        <div v-else class="ai-placeholder">
          <i class="fas fa-info-circle ai-placeholder-icon"></i>
          该题目暂无解析内容
        </div>
      </div>
    </div>
  </transition>
  
  <!-- 图片模态框 -->
  <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
    <div class="image-modal-content" @click.stop>
      <button @click="closeImageModal" class="image-modal-close">×</button>
      <img :src="selectedImageUrl" alt="题目图片" class="modal-image" />
    </div>
  </div>
  
  <!-- 提交结果模态框 -->
  <div v-if="showResultModal" class="result-modal-overlay" @click="closeResultModal">
    <div class="result-modal-content" @click.stop>
      <div class="result-modal-header">
        <h3>答题结果</h3>
        <button @click="closeResultModal" class="result-modal-close">×</button>
      </div>
      <div class="result-modal-body">
        <div v-if="submitResult" class="result-summary">
          <div class="score-display">
            <div class="score-circle" :class="getScoreClass(submitResult.score)">
              <span class="score-number">{{ submitResult.score }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="score-info">
              <p class="score-text">{{ getScoreText(submitResult.score) }}</p>
              <p class="attempt-text">第{{ submitResult.attempt_number }}次尝试</p>
            </div>
          </div>
          
          <div class="result-stats">
            <div class="stat-item">
              <span class="stat-label">总题数</span>
              <span class="stat-value">{{ submitResult.total_questions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">正确题数</span>
              <span class="stat-value correct">{{ submitResult.correct_count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">错误题数</span>
              <span class="stat-value wrong">{{ submitResult.total_questions - submitResult.correct_count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">正确率</span>
              <span class="stat-value">{{ Math.round((submitResult.correct_count / submitResult.total_questions) * 100) }}%</span>
            </div>
          </div>
        </div>
        
        <div class="result-actions">
          <button @click="closeResultModal" class="btn btn-secondary">关闭</button>
          <button @click="viewSubmissionDetail" class="btn btn-primary">查看详情</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 未完成答题模态框 -->
  <div v-if="showIncompleteModalDialog" class="incomplete-modal-overlay" @click="closeIncompleteModal">
    <div class="incomplete-modal-content" @click.stop>
      <div class="incomplete-modal-header">
        <h3>⚠️ 答题未完成</h3>
        <button @click="closeIncompleteModal" class="incomplete-modal-close">×</button>
      </div>
      <div class="incomplete-modal-body">
        <div class="incomplete-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="incomplete-message">
          <p>还有 <strong>{{ incompleteCount }}</strong> 道题目未回答</p>
          <p>请完成所有题目后再提交</p>
        </div>
        <div class="incomplete-actions">
          <button @click="closeIncompleteModal" class="btn btn-primary">继续答题</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'

// 定义接口类型
interface Option {
  option_label: string;
  option_value: string;
  option_text: string;
}

interface Question {
  id: number;
  exam_id: number;
  question_number: number;
  question_text: string;
  question_type: string;
  question_code?: string;
  correct_answer: string;
  explanation: string;
  level: number;
  difficulty: string;
  image_url?: string;
  created_at: string;
  options: Option[];
  images?: { image_url: string }[]; // 新增图片属性
}

interface ExamInfo {
  id: number;
  name: string;
  level: number;
  description: string;
  total_questions: number;
}

export default defineComponent({
  name: 'PracticeView',
  data() {
    return {
      BASE_URL: "http://localhost:3000/api",
      EXAM_ID: null as number | null,
      loading: true,
      error: null as string | null,
      examInfo: {} as ExamInfo,
      questions: [] as Question[],
      answers: [] as string[],
      showExplainOverlay: false,
      showExplainContent: false,
      currentQuestionIndex: 0, // 当前题目索引
      showExplain: false, // 控制解析是否展开
      highlightUnanswered: false, // 控制未答题高亮
      // 题目解析相关
      showAIPanel: false,
      // 新增图片模态框相关
      showImageModal: false,
      selectedImageUrl: '',
      // 新增提交结果模态框相关
      showResultModal: false,
      submitResult: null as any,
      // 新增未完成答题模态框相关
      showIncompleteModalDialog: false,
      incompleteCount: 0
    };
  },
  computed: {
    progressPercentage() {
      const answeredCount = this.answeredCount;
      return this.questions.length > 0 ? (answeredCount / this.questions.length) * 100 : 0;
    },
    answeredCount() {
      return this.answers.filter(answer => answer !== null && answer !== undefined && answer !== '').length;
    },
    currentQuestion(): Question {
      return this.questions[this.currentQuestionIndex] || {} as Question;
    }
  },
  mounted() {
    // 从路由参数获取考试ID
    const route = useRoute();
    this.EXAM_ID = parseInt(route.params.examId as string) || 1;
    this.loadExamData();
  },
  watch: {
    // 监听路由参数变化，重新加载数据
    '$route.params.examId': {
      handler(newExamId: string) {
        this.EXAM_ID = parseInt(newExamId) || 1;
        this.loadExamData();
      },
      immediate: false
    }
  },
  methods: {
    async loadExamData() {
      if (!this.EXAM_ID) {
        this.error = '无效的考试ID';
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${this.BASE_URL}/exam/${this.EXAM_ID}`);
        if (!response.ok) {
          throw new Error(`获取考试信息失败: ${response.status}`);
        }
        const data = await response.json();
        this.examInfo = data.exam;
        this.questions = data.questions;
        this.answers = Array(this.questions.length).fill('');
        this.currentQuestionIndex = 0;
        
        // 调试信息：检查题目数据
        console.log('加载的题目数据:', this.questions);
        if (this.questions.length > 0) {
          console.log('第一题数据:', this.questions[0]);
          console.log('第一题类型:', this.questions[0].question_type);
          console.log('第一题代码:', this.questions[0].question_code);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '加载考试信息失败';
      } finally {
        this.loading = false;
      }
    },
    async submitAnswers() {
      const unansweredCount = this.answers.filter(answer => !answer).length;
      if (unansweredCount > 0) {
        this.highlightUnanswered = true;
        // 显示未完成答题的模态框
        this.showIncompleteModalDialog(unansweredCount);
        return;
      }
      this.highlightUnanswered = false;
      
      // 检查是否有用户登录信息
      const currentUser = this.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        alert('请先登录后再提交答案');
        return;
      }
      
      // 准备提交数据
      const answers = [];
      for (let i = 0; i < this.questions.length; i++) {
        if (this.answers[i]) {
          answers.push({
            question_id: this.questions[i].id,
            user_answer: this.answers[i]
          });
        }
      }
      
      if (answers.length === 0) {
        alert('没有可提交的答案');
        return;
      }
      
      const submitData = {
        user_id: currentUser.id,
        exam_id: this.EXAM_ID,
        answers: answers
      };
      
      try {
        this.loading = true;
        
        const response = await fetch(`${this.BASE_URL}/submit-exam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `提交失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 显示提交结果
        this.showSubmitResult(result);
        
      } catch (error: any) {
        console.error('提交答案错误:', error);
        alert(`提交失败: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    // 获取当前用户信息（这里需要根据您的用户管理系统调整）
    getCurrentUser() {
      // 从localStorage或Vuex store获取用户信息
      // 这里假设用户信息存储在localStorage中
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
    
    // 显示提交结果
    showSubmitResult(result: any) {
      // 直接显示结果模态框
      this.showResultModalDialog(result);
    },
    
    // 显示详细答题结果
    showDetailedResult(result: any) {
      // 这里可以实现跳转到答题详情页面
      // 或者在当前页面显示详细结果
      console.log('详细答题结果:', result);
      
      // 示例：跳转到答题详情页面
      // this.$router.push(`/submission/${result.submission_id}`);
      
              // 或者显示一个模态框显示详细结果
        this.showResultModalDialog(result);
    },
    
    // 显示结果模态框
    showResultModalDialog(result: any) {
      this.submitResult = result;
      this.showResultModal = true;
    },
    
    // 关闭结果模态框
    closeResultModal() {
      this.showResultModal = false;
      this.submitResult = null;
    },
    
    // 获取分数样式类
    getScoreClass(score: number) {
      if (score >= 90) return 'score-excellent';
      if (score >= 80) return 'score-good';
      if (score >= 60) return 'score-pass';
      return 'score-fail';
    },
    
    // 获取分数文本
    getScoreText(score: number) {
      if (score >= 90) return '优秀';
      if (score >= 80) return '良好';
      if (score >= 60) return '及格';
      return '不及格';
    },
    
    // 查看提交详情
    viewSubmissionDetail() {
      if (this.submitResult && this.submitResult.submission_id) {
        // 跳转到提交详情页面
        window.location.href = `/submission/${this.submitResult.submission_id}`;
      } else {
        alert('无法获取提交详情');
      }
    },
    
    // 显示未完成答题模态框
    showIncompleteModalDialog(count: number) {
      this.incompleteCount = count;
      this.showIncompleteModalDialog = true;
    },
    
    // 关闭未完成答题模态框
    closeIncompleteModal() {
      this.showIncompleteModalDialog = false;
      this.incompleteCount = 0;
    },
    goToQuestion(idx: number) {
      this.currentQuestionIndex = idx;
      this.showExplain = false;
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.showExplain = false;
      }
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.showExplain = false;
      }
    },
    selectOption(value: string) {
      this.answers[this.currentQuestionIndex] = value;
      this.autoNext();
    },
    autoNext() {
      // 自动跳到下一题
      if (this.currentQuestionIndex < this.questions.length - 1) {
        setTimeout(() => this.nextQuestion(), 200);
      }
    },
    toggleExplain() {
      this.showExplain = !this.showExplain;
    },
    toggleAIPanel() {
      this.showAIPanel = !this.showAIPanel;
    },
    openImageModal(imageUrl: string) {
      this.selectedImageUrl = imageUrl;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.selectedImageUrl = '';
    }
  }
});
</script>

<style scoped>
/* 重置和基础样式 */
* {
  box-sizing: border-box;
}

.exam-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.exam-header {
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 20px 30px;
  border-bottom: 2px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  position: fixed;
  top: 60px; /* NavBar 的高度 */
  left: 0;
  right: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 0;
  margin-left: 0;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
}

.nav-buttons {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.nav-btn {
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(107,114,128,0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107,114,128,0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.nav-btn i {
  font-size: 0.9rem;
}

/* 新增：解析按钮样式 */
.nav-btn.btn-info {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(6,182,212,0.2);
}

.nav-btn.btn-info:hover:not(:disabled) {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6,182,212,0.3);
}

.nav-btn.btn-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0 8px;
  min-width: 120px;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(30,144,255,0.08);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff 60%, #38bdf8 100%);
  border-radius: 6px;
  transition: width 0.3s;
}

/* 新增横向flex布局 - 居中布局 */
.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 1400px !important;
  max-width: 1400px !important;
  min-width: 1400px !important;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 140px; /* 为固定的header留出空间：60px(NavBar) + 80px(exam-header) */
}

/* 侧边栏垂直排列 - 自适应高度 */
.sidebar-vertical {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(30,144,255,0.10);
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  overflow: hidden;
  flex-shrink: 0;
  margin: 0;
  height: auto;
  align-content: start;
  justify-content: center;
  margin-left: -10px;
  position: sticky;
  top: 140px; /* 调整sticky位置，为固定的header留出空间 */
  z-index: 10;
}

/* 侧边栏item样式 - 调整大小 */
.sidebar-item {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid #d1d5db;
  transition: all 0.2s ease;
  position: relative;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(30,144,255,0.08);
  flex-shrink: 0;
  margin: 0;
  aspect-ratio: 1;
  color: #374151;
}

/* 新增：高亮当前题目 */
.sidebar-item--active {
  border: 2px solid #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 60%, #bae6fd 100%);
  color: #1e90ff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(30,144,255,0.15);
}

/* 新增：已作答 */
.sidebar-item--answered {
  border: 2px solid #22c55e;
  background: #e7f9ef;
  color: #22c55e;
}

/* 新增：未作答高亮 */
.sidebar-item--unanswered {
  border: 2px solid #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

/* 题号数字 */
.sidebar-number {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 2px;
  color: inherit;
}

/* 状态icon */
.sidebar-status {
  font-size: 1rem;
  margin-top: 2px;
  color: inherit;
}

/* 主体区域 - 增加宽度 */
.question-main {
  width: 900px !important;
  max-width: 900px !important;
  min-width: 900px !important;
  margin: 0;
  flex-shrink: 0;
  overflow: hidden;
  order: 2;
}

/* 右侧占位区域 - 调整大小 */
.sidebar-placeholder {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  order: 3;
}

/* 左侧侧边栏 */
.sidebar-vertical {
  order: 1;
}

/* 题目卡片 - 增加高度和宽度 */
.question-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10);
  transition: all 0.3s ease;
  padding: 0;
  overflow: hidden;
  width: 900px !important;
  height: auto !important; /* 改为自适应高度 */
  min-height: 900px;
  max-height: 1200px !important; /* 设置最大高度 */
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 900px !important;
  min-width: 900px !important;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* 统一的内容滚动区域 - 增加高度 */
.question-content-unified {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  height: calc(100% - 80px); /* 减去头部高度 */
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 600px; /* 确保最小高度 */
  max-height: 1100px; /* 设置最大高度，留出头部空间 */
}

/* 内容区域通用样式 - 更有趣的设计 */
.content-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  margin: 16px;
  box-shadow: 0 8px 32px rgba(30,144,255,0.12);
  overflow: hidden;
  border: 2px solid #e0f2fe;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.content-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1e90ff, #38bdf8, #06b6d4, #1e90ff);
  background-size: 200% 100%;
  animation: gradientMove 3s ease-in-out infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.content-section:hover {
  box-shadow: 0 12px 40px rgba(30,144,255,0.2);
  transform: translateY(-4px) scale(1.02);
  border-color: #1e90ff;
}

/* 区域头部样式 - 减少内边距 */
.section-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.section-header i {
  color: #1e90ff;
  font-size: 1rem;
}

/* 区域内容样式 - 更有趣的设计 */
.section-content {
  padding: 20px;
  background: transparent;
  position: relative;
  z-index: 1;
}

/* 题目文本区域 - 更有趣的设计 */
.question-text-section .section-content {
  padding: 24px;
}

.question-text {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 600;
  line-height: 1.8;
  margin: 0;
  text-align: left;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal !important;
  position: relative;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  border-radius: 16px;
  border-left: 4px solid #1e90ff;
  box-shadow: 0 4px 16px rgba(30,144,255,0.1);
  animation: textGlow 2s ease-in-out infinite alternate;
}

@keyframes textGlow {
  from { box-shadow: 0 4px 16px rgba(30,144,255,0.1); }
  to { box-shadow: 0 4px 20px rgba(30,144,255,0.2); }
}

/* 图片区域优化 - 更有趣的设计 */
.images-section .section-content {
  padding: 20px;
}

.images-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: white;
  border: 3px solid #e0f2fe;
  transform: perspective(1000px) rotateX(0deg);
}

.image-item:hover {
  transform: perspective(1000px) rotateX(5deg) translateY(-8px) scale(1.02);
  box-shadow: 0 16px 40px rgba(30, 144, 255, 0.3);
  border-color: #1e90ff;
}

.question-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
  transition: all 0.3s ease;
  background: #f8fafc;
}

/* 代码区域优化 - 更有趣的设计 */
.code-section .section-content {
  padding: 20px;
}

.code-block {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;
  padding: 20px;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
  border-radius: 16px;
  border: 2px solid #374151;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: codeGlow 3s ease-in-out infinite alternate;
}

.code-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #06b6d4, #1e90ff, #38bdf8);
  border-radius: 16px 16px 0 0;
}

@keyframes codeGlow {
  from { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  to { box-shadow: 0 8px 32px rgba(6, 182, 212, 0.2); }
}

.code-placeholder {
  padding: 14px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
  font-style: italic;
  border-radius: 8px;
  margin: 12px;
}

/* 选项区域优化 - 更有趣的设计 */
.options-section .section-content {
  padding: 20px;
  max-height: none; /* 移除高度限制 */
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start; /* 改为顶部对齐，适应长文本 */
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  border: 3px solid #e0f2fe;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  word-break: break-word;
  color: #374151;
  min-height: 60px;
  max-height: none; /* 移除最大高度限制 */
  position: relative;
  overflow: visible; /* 改为visible，允许内容完全显示 */
  transform: perspective(1000px) rotateX(0deg);
}

.option-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(30, 144, 255, 0.1), transparent);
  transition: left 0.6s ease;
  pointer-events: none; /* 确保不影响文本选择 */
}

.option-item:hover::before {
  left: 100%;
}

.option-item:hover, .option-selected {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #1e90ff;
  font-weight: 700;
  border-color: #1e90ff;
  transform: perspective(1000px) rotateX(2deg) translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(30,144,255,0.25);
}

.option-selected {
  animation: optionPulse 2s ease-in-out infinite;
}

@keyframes optionPulse {
  0%, 100% { box-shadow: 0 12px 32px rgba(30,144,255,0.25); }
  50% { box-shadow: 0 12px 32px rgba(30,144,255,0.4); }
}

.option-label {
  font-weight: 800;
  color: #1e90ff;
  margin-right: 12px;
  min-width: 24px;
  text-align: center;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 6px 10px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(30,144,255,0.3);
  animation: labelBounce 0.6s ease-out;
}

@keyframes labelBounce {
  0% { transform: scale(0.8) rotate(-10deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.option-text {
  flex: 1;
  line-height: 1.6;
  font-weight: 600;
  white-space: normal; /* 确保文本正常换行 */
  overflow-wrap: break-word; /* 长单词换行 */
  hyphens: auto; /* 自动连字符 */
  max-width: none; /* 移除最大宽度限制 */
}

/* 解析区域 - 固定高度和宽度 */
.question-explanation {
  margin-top: 16px;
  background: #f3f4f6;
  border-left: 4px solid #1e90ff;
  border-radius: 8px;
  padding: 16px 20px;
  height: 100px !important;
  overflow-y: auto;
  flex-shrink: 0;
  width: 100% !important;
  box-sizing: border-box;
}

.question-explanation h5 {
  margin: 0 0 6px 0;
  color: #374151;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 解析动画效果 */
.explanation-slide-enter-active {
  animation: explanationSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.explanation-slide-leave-active {
  animation: explanationSlideOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

@keyframes explanationSlideIn {
  0% {
    opacity: 0;
    transform: translateX(100px) scale(0.8) rotateY(-15deg);
    filter: blur(4px);
  }
  50% {
    opacity: 0.7;
    transform: translateX(20px) scale(0.95) rotateY(-5deg);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1) rotateY(0deg);
    filter: blur(0);
  }
}

@keyframes explanationSlideOut {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1) rotateY(0deg);
    filter: blur(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-50px) scale(0.8) rotateY(10deg);
    filter: blur(3px);
  }
}

/* 为解析内容添加额外的视觉效果 */
.explanation-content {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 12px;
  height: auto !important;
  min-height: 300px;
  overflow-y: auto;
  width: 100% !important;
  box-sizing: border-box;
  word-wrap: break-word;
  word-break: break-word;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(30,144,255,0.15);
  position: relative;
  backdrop-filter: blur(10px);
}

.explanation-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1e90ff, #38bdf8, #06b6d4);
  border-radius: 12px 12px 0 0;
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background: linear-gradient(90deg, #1e90ff, #38bdf8, #06b6d4);
  }
  50% {
    background: linear-gradient(90deg, #06b6d4, #1e90ff, #38bdf8);
  }
}

/* 解析内容文字的动画效果 */
.explanation-content p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  animation: textFadeIn 0.8s ease-out 0.3s both;
}

@keyframes textFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.explain-toggle {
  background: none;
  border: none;
  color: #1e90ff;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 6px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.explain-toggle:hover {
  background-color: #e0f2fe;
}

/* 删除原来的导航区域样式 */
.question-nav {
  display: none;
}

/* 头部提交按钮样式 */
.submit-btn-header {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(30,144,255,0.2);
  transition: all 0.3s ease;
  margin-left: 20px;
}

.submit-btn-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30,144,255,0.3);
}

.submit-btn-header:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 优化进度文本 */
.progress-info span {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  display: block;
  text-align: center;
}

/* 题目卡片头部样式优化 - 更有趣的设计 */
.question-card-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 24px 28px;
  border-bottom: 3px solid #e0f2fe;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.question-card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.question-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-badge {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1e90ff;
  padding: 10px 18px;
  border-radius: 24px;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 6px 20px rgba(30,144,255,0.4);
  border: 2px solid rgba(255,255,255,0.3);
  animation: numberPulse 2s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes numberPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 更新level-badge样式 */
.level-badge {
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

/* 状态样式优化 - 更有趣的设计 */
.status-answered {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 6px 20px rgba(34,197,94,0.4);
  border: 2px solid rgba(255,255,255,0.3);
  position: relative;
  z-index: 1;
  animation: statusGlow 2s ease-in-out infinite alternate;
}

@keyframes statusGlow {
  from { box-shadow: 0 6px 20px rgba(34,197,94,0.4); }
  to { box-shadow: 0 6px 20px rgba(34,197,94,0.6); }
}

.status-unanswered {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 6px 20px rgba(239,68,68,0.4);
  border: 2px solid rgba(255,255,255,0.3);
  position: relative;
  z-index: 1;
  animation: statusPulse 1.5s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 删除原来的提交区域样式 */
.submit-section {
  display: none;
}

/* 动画 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}

.fade-slide-enter, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 响应式设计调整 */
@media (max-width: 1400px) {
  .exam-content-flex-row {
    width: 100% !important;
    max-width: 100% !important;
    min-width: auto !important;
    padding: 0 16px;
    justify-content: center;
    margin-top: 140px; /* 保持为固定的header留出空间 */
  }
  
  .sidebar-vertical {
    width: 240px !important;
    max-width: 240px !important;
    min-width: 240px !important;
    padding: 12px;
    gap: 8px;
    margin-left: -8px;
  }

  .sidebar-item {
    width: 50px;
    height: 50px;
  }
  
  .sidebar-placeholder {
    width: 240px !important;
    min-width: 240px !important;
    max-width: 240px !important;
  }
  
  .question-main {
    width: 800px !important;
    max-width: 800px !important;
    min-width: 800px !important;
  }
  
  .question-card {
    width: 800px !important;
    height: auto !important;
    min-height: 800px;
    max-height: 1200px !important;
    max-width: 800px !important;
    min-width: 800px !important;
  }
}

@media (max-width: 1200px) {
  .sidebar-vertical {
    width: 200px !important;
    max-width: 200px !important;
    min-width: 200px !important;
    padding: 10px;
    gap: 6px;
    margin-left: -6px;
  }
  
  .sidebar-item {
    width: 45px;
    height: 45px;
  }
  
  .sidebar-placeholder {
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
  }
  
  .question-main {
    width: 700px !important;
    max-width: 700px !important;
    min-width: 700px !important;
  }
  
  .question-card {
    width: 700px !important;
    height: auto !important;
    min-height: 700px;
    max-height: 1200px !important;
    max-width: 700px !important;
    min-width: 700px !important;
  }
}

@media (max-width: 1024px) {
  .sidebar-vertical {
    width: 240px !important;
    max-width: 240px !important;
    min-width: 240px !important;
    padding: 14px;
    gap: 6px;
    margin-left: -6px;
  }
  
  .sidebar-item {
    width: 50px;
    height: 50px;
  }
  
  .sidebar-placeholder {
    width: 240px !important;
    min-width: 240px !important;
    max-width: 240px !important;
  }
}

@media (max-width: 768px) {
  .exam-header {
    padding: 15px 20px;
    top: 60px;
  }
  
  .exam-content-flex-row {
    margin-top: 120px; /* 移动端减少间距 */
  }
  
  .sidebar-vertical {
    width: 200px !important;
    max-width: 200px !important;
    min-width: 200px !important;
    padding: 12px;
    gap: 5px;
    margin-left: -4px;
    top: 120px; /* 移动端调整sticky位置 */
  }
  
  .sidebar-item {
    width: 45px;
    height: 45px;
  }
  
  .sidebar-placeholder {
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
  }
  
  .sidebar-explanation {
    top: 120px; /* 移动端调整sticky位置 */
  }
}

.sidebar-explanation {
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 20px;
  margin: 0;
  height: auto;
  align-content: start;
  justify-content: flex-start;
  position: sticky;
  top: 140px; /* 调整sticky位置，为固定的header留出空间 */
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  order: 3;
}

/* 右侧解析栏内的题目解析样式调整 */
.sidebar-explanation .question-explanation {
  margin-top: 0;
  background: transparent; /* 去掉背景 */
  border-left: none; /* 去掉左边框 */
  border-radius: 0; /* 去掉圆角 */
  padding: 0; /* 去掉内边距 */
  height: auto !important;
  min-height: auto; /* 去掉最小高度限制 */
  overflow-y: visible; /* 改为visible */
  flex-shrink: 0;
  width: 100% !important;
  box-sizing: border-box;
}

.sidebar-explanation .explanation-content {
  background: #f8fafc; /* 给内容区域添加背景 */
  border-radius: 12px; /* 给内容区域添加圆角 */
  padding: 16px 20px;
  margin-top: 12px;
  height: auto !important;
  min-height: 300px;
  overflow-y: auto;
  width: 100% !important;
  box-sizing: border-box;
  word-wrap: break-word;
  word-break: break-word;
  border: 1px solid #e2e8f0; /* 给内容区域添加边框 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* 给内容区域添加阴影 */
}

/* 解析按钮样式调整 */
.sidebar-explanation .explain-toggle {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); /* 给按钮添加渐变背景 */
  border: none;
  color: white; /* 改为白色文字 */
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px; /* 增加按钮内边距 */
  border-radius: 10px; /* 给按钮添加圆角 */
  transition: all 0.3s ease; /* 添加过渡效果 */
  box-shadow: 0 2px 8px rgba(30,144,255,0.3); /* 给按钮添加阴影 */
}

.sidebar-explanation .explain-toggle:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%); /* hover时反转渐变 */
  transform: translateY(-1px); /* hover时轻微上移 */
  box-shadow: 0 4px 12px rgba(30,144,255,0.4); /* hover时增强阴影 */
}

/* 浮动题目解析按钮样式 */
.floating-ai-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ai-button {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: #fff;
  border: none;
  border-radius: 34px; /* 椭圆形 */
  min-width: 90px;
  height: 68px;
  box-shadow: 0 4px 16px rgba(30,144,255,0.25);
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  outline: none;
  padding: 0 22px 0 18px;
  gap: 10px;
}

.ai-button-text {
  position: static;
  font-size: 1.1rem;
  background: none;
  color: #fff;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  white-space: nowrap;
  font-weight: 600;
  opacity: 1;
  pointer-events: none;
}

.ai-button i {
  font-size: 2rem;
  margin-left: 0;
}

.ai-button--loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 让面板绝对定位在按钮上方 */
.ai-panel {
  position: absolute;
  right: 0;
  bottom: 80px; /* 按钮高度+间距 */
  width: 380px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(30,144,255,0.18);
  padding: 0;
  overflow: hidden;
  animation: aiPanelInUp 0.3s;
}

/* 向上展开动画 */
@keyframes aiPanelInUp {
  from { opacity: 0; transform: translateY(40px);}
  to { opacity: 1; transform: translateY(0);}
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: #fff;
  padding: 18px 24px;
}

.ai-panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.ai-close-btn:hover {
  background: rgba(255,255,255,0.12);
}

.ai-panel-content {
  padding: 24px;
}

.ai-placeholder {
  text-align: center;
  color: #64748b;
}

.ai-placeholder-icon {
  font-size: 2.5rem;
  color: #1e90ff;
  margin-bottom: 12px;
}

.ai-analyze-btn {
  margin-top: 18px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 28px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30,144,255,0.18);
  transition: all 0.2s;
}
.ai-analyze-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.ai-analyze-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-1px) scale(1.04);
}

.ai-response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #1e90ff;
  font-weight: 700;
  margin-bottom: 12px;
}

.ai-response-content h4 {
  margin: 12px 0 6px 0;
  color: #1e90ff;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-analysis-section,
.ai-solution-section,
.ai-tips-section {
  margin-bottom: 10px;
}

.ai-tips-section ul {
  padding-left: 18px;
  margin: 0;
  color: #64748b;
  font-size: 0.98rem;
}

.ai-tips-section li {
  margin-bottom: 4px;
}

@media (max-width: 600px) {
  .floating-ai-button {
    right: 10px;
    bottom: 10px;
  }
  .ai-panel {
    width: 95vw;
    min-width: 0;
    max-width: 98vw;
    right: 0;
    bottom: 80px;
  }
}

/* 考试标题样式 - 简约大气 */
.exam-title {
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

/* 图片网格样式 */
.images-section {
  margin-bottom: 24px;
}

.images-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
  border: 2px solid #e2e8f0;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.25);
  border-color: #1e90ff;
}

.question-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.image-item:hover .question-image {
  transform: scale(1.02);
}

.image-info {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(30, 144, 255, 0.9);
  color: white;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.image-order {
  display: block;
}

/* 图片模态框样式 */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.image-modal-content {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
  position: relative;
}

.image-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #333;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.image-modal-close:hover {
  background-color: #eee;
}

.modal-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 提交结果模态框样式 */
.result-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.result-modal-content {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.result-modal-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.result-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.result-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.result-modal-body {
  padding: 24px;
}

.result-summary {
  text-align: center;
  margin-bottom: 24px;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
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

.score-info {
  text-align: left;
}

.score-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1e293b;
}

.attempt-text {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: #1e90ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.correct {
  color: #22c55e;
}

.stat-value.wrong {
  color: #ef4444;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.result-actions .btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-actions .btn-secondary {
  background: #6b7280;
  color: white;
}

.result-actions .btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.result-actions .btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.result-actions .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}

/* 未完成答题模态框样式 */
.incomplete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.incomplete-modal-content {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

.incomplete-modal-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.incomplete-modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.incomplete-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.incomplete-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.incomplete-modal-body {
  padding: 32px 24px;
  text-align: center;
}

.incomplete-icon {
  margin-bottom: 20px;
}

.incomplete-icon i {
  font-size: 4rem;
  color: #f59e0b;
  animation: warningPulse 2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.incomplete-message {
  margin-bottom: 24px;
}

.incomplete-message p {
  margin: 8px 0;
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.5;
}

.incomplete-message strong {
  color: #f59e0b;
  font-weight: 700;
}

.incomplete-actions {
  display: flex;
  justify-content: center;
}

.incomplete-actions .btn {
  padding: 12px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.incomplete-actions .btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.incomplete-actions .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}
</style>