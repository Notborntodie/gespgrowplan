<template>
    <div class="exam-layout">
      <div class="exam-content exam-content-flex-row">
        <!-- 左侧占位区域 -->
        <div class="sidebar-placeholder-left"></div>
  
        <!-- 主体：计划内容 -->
        <div class="question-main">
          <!-- 统一的内容滚动区域 -->
          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">
              <!-- 信奥成长计划介绍区域 -->
              <div class="content-section">
                <div class="section-header">
                  <h4 class="section-title">信奥成长计划</h4>
                </div>
                <div class="section-content">
                  <div class="growth-plan-intro">
                    <div class="intro-main">
                      <div class="intro-text">
                        <p>我们的<strong>信奥成长计划</strong>旨在帮助编程小白通过完成GESP考级来成长为优秀的信奥生。通过系统化的学习路径，让每一位学生都能在信息学奥林匹克竞赛的道路上稳步前行。</p>
                        <div class="growth-path">
                          <h4>成长路径</h4>
                          <div class="path-stages">
                            <div class="stage-group">
                              <div class="stage-label">成长阶段</div>
                              <div class="level-cards">
                                <div class="level-card level-1-4" v-for="level in [1,2,3,4]" :key="level">
                                  <div class="level-number">GESP {{ level }}级</div>
                                </div>
                              </div>
                            </div>
                            <div class="path-arrow">→</div>
                            <div class="stage-group">
                              <div class="stage-label">信奥阶段</div>
                              <div class="level-cards">
                                <div class="level-card level-5-8" v-for="level in [5,6,7,8]" :key="level">
                                  <div class="level-number">GESP {{ level }}级</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="cta-section">
                        <h3>准备好开始您的GESP备考之旅了吗？</h3>
                        <p>选择适合您的学习计划，让学习更加高效！</p>
                        <button class="cta-button" @click="goToPlan">
                          查看学习计划
                        </button>
                      </div>
                    </div>
                    <div class="countdown-section">
                      <div class="countdown-card">
                        <div class="countdown-header">
                          <h4>距离下次GESP考级</h4>
                          <div class="exam-date">{{ nextExamDate }}</div>
                        </div>
                        <div class="countdown-timer">
                          <div class="time-unit">
                            <div class="time-value">{{ countdown.days }}</div>
                            <div class="time-label">天</div>
                          </div>
                          <div class="time-unit">
                            <div class="time-value">{{ countdown.hours }}</div>
                            <div class="time-label">时</div>
                          </div>
                          <div class="time-unit">
                            <div class="time-value">{{ countdown.minutes }}</div>
                            <div class="time-label">分</div>
                          </div>
                          <div class="time-unit">
                            <div class="time-value">{{ countdown.seconds }}</div>
                            <div class="time-label">秒</div>
                          </div>
                        </div>
                        <div class="exam-info">
                          <p>GESP考级时间：2025年3月22日、6月28日、9月27日、12月27日</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- GESP练习链接区域 -->
              <div class="content-section">
                <div class="section-header">
                  <h4 class="section-title">GESP练习专区</h4>
                </div>
                <div class="section-content">
                  <div class="practice-links">
                    <div class="link-grid">
                      <div class="link-item">
                        <div class="link-icon">💻</div>
                        <h4>GESP编程题</h4>
                        <p>练习编程实现题目，提升编程能力</p>
                        <button class="link-button" @click="goToProgramming">
                          开始练习
                        </button>
                      </div>
                      <div class="link-item">
                        <div class="link-icon">📝</div>
                        <h4>GESP客观题</h4>
                        <p>练习选择题和判断题，巩固理论知识</p>
                        <button class="link-button" @click="goToObjective">
                          开始练习
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- GESP介绍区域 -->
              <div class="content-section">
                <div class="section-header">
                  <h4 class="section-title">关于GESP</h4>
                </div>
                <div class="section-content">
                  <div class="gesp-intro">
                    <div class="gesp-logo">
                      <h2>GESP</h2>
                      <p>编程能力等级认证</p>
                    </div>
                    <div class="gesp-description">
                      <p><strong>CCF编程能力等级认证</strong>，英文名Grade Examination of Software Programming（以下简称GESP），由中国计算机学会发起并主办，是为青少年计算机和编程学习者提供学业能力验证的平台。</p>
                      <p>GESP旨在提升青少年计算机和编程教育水平，推广和普及青少年计算机和编程教育。GESP覆盖中小学全学段，符合条件的青少年均可参加认证。</p>
                      <p>GESP考察语言为<strong>图形化编程、Python编程及C++编程</strong>，主要考察学生掌握相关编程知识和操作能力，熟悉编程各项基础知识和理论框架，通过设定不同等级的考试目标，让学生具备编程从简单的程序到复杂程序设计的编程能力，为后期专业化编程学习打下良好基础。</p>
                    </div>
                    <div class="gesp-features">
                      <div class="feature-item">
                        <span class="feature-icon">📚</span>
                        <div class="feature-content">
                          <h4>全面覆盖</h4>
                          <p>覆盖中小学全学段，适合不同年龄段学生</p>
                        </div>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">🎯</span>
                        <div class="feature-content">
                          <h4>权威认证</h4>
                          <p>由中国计算机学会主办，权威性高</p>
                        </div>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">🚀</span>
                        <div class="feature-content">
                          <h4>能力提升</h4>
                          <p>从基础语法到复杂程序设计，全面提升编程能力</p>
                        </div>
                      </div>
                    </div>
                    <div class="gesp-official-link">
                      <h4>官方资源</h4>
                      <p>了解更多GESP认证信息，请访问官方网站：</p>
                      <a href="https://gesp.ccf.org.cn" target="_blank" class="official-link">
                        <span class="link-icon">🌐</span>
                        <span>GESP官方网站</span>
                        <span class="external-icon">↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 右侧占位区域 -->
        <div class="sidebar-placeholder-right"></div>
      </div>
    </div>
  </template>
  
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 倒计时相关
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

const nextExamDate = ref('')

let countdownInterval: ReturnType<typeof setInterval> | null = null

// 获取2025年GESP考试日期
const getGESPExamDates = (year: number): Date[] => {
  // 2025年GESP考试具体日期：3月22日、6月28日、9月27日、12月20日
  const examDates = [
    new Date(year, 2, 22),  // 3月22日 (月份从0开始，所以3月是2)
    new Date(year, 5, 28),  // 6月28日
    new Date(year, 8, 27),  // 9月27日
    new Date(year, 11, 27)  // 12月27日
  ]
  return examDates
}

// 获取下次考试日期
const getNextExamDate = (): Date => {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // 获取当前年份和下一年的考试日期
  const currentYearExams = getGESPExamDates(currentYear)
  const nextYearExams = getGESPExamDates(currentYear + 1)
  
  // 找到当前年份中还未进行的考试
  for (const examDate of currentYearExams) {
    if (examDate > now) {
      return examDate
    }
  }
  
  // 如果当年没有更多考试，返回下一年的第一个考试（3月22日）
  return nextYearExams[0]
}

// 更新倒计时
const updateCountdown = () => {
  const nextExam = getNextExamDate()
  const now = new Date()
  const timeDiff = nextExam.getTime() - now.getTime()
  
  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
    
    countdown.value = { days, hours, minutes, seconds }
    
    // 格式化考试日期显示
    nextExamDate.value = nextExam.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  } else {
    // 如果考试时间已过，重新计算下次考试
    const nextExam = getNextExamDate()
    nextExamDate.value = nextExam.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
}

// 跳转到学习计划页面
const goToPlan = () => {
  // 这里可以添加路由跳转逻辑
  window.location.href = '/plan'
}

// 跳转到编程题练习页面
const goToProgramming = () => {
  // 跳转到SmartOJView.vue
  window.location.href = '/smartoj'
}

// 跳转到客观题练习页面
const goToObjective = () => {
  // 跳转到SelectLevelView.vue
  window.location.href = '/select'
}

// 组件挂载时启动倒计时
onMounted(() => {
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
  </script>
  
  <style scoped>
  /* 使用与SmartOJView相同的布局样式 */
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
  
.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 0;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 20px;
}
  
.sidebar-placeholder-left {
  width: 5%;
  flex-shrink: 0;
}

.sidebar-placeholder-right {
  width: 5%;
  flex-shrink: 0;
}
  
.question-main {
  flex: 1;
  max-width: none;
  min-width: 0;
  width: 90%;
  padding: 0;
  box-sizing: border-box;
  background: #f8fafc;
  border: 0;
  border-radius: 18px;
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  margin: 0;
}
  
  
  .question-content-unified {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    background: #f8fafc;
  }
  
  .question-left-panel {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
.question-left-panel-centered {
  max-width: none;
  margin: 0;
  width: 100%;
}
  
  .content-section {
    background: transparent;
    border-radius: 20px;
    box-shadow: none;
    overflow: visible;
    border: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: fit-content;
  }
  
.section-header {
  background: linear-gradient(135deg, #e6f7ff 0%, #b3e5fc 100%);
  padding: 20px 24px;
  border-bottom: 2px solid #87ceeb;
  border-radius: 18px 18px 0 0;
  position: relative;
}
  
.section-title {
  margin: 0;
  color: #2c5282;
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
  
  .section-content {
    padding: 24px;
    background: transparent;
  }
  
/* GESP介绍区域 */
.gesp-intro {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.gesp-logo {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #87ceeb, #b0e0e6);
  border-radius: 16px;
  color: #2c5282;
}

.gesp-logo h2 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 4px;
}

.gesp-logo p {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.8;
}

.gesp-description {
  line-height: 1.8;
}

.gesp-description p {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1rem;
}

.gesp-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 12px;
  border: 2px solid #87ceeb;
}

.feature-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.feature-content h4 {
  margin: 0 0 8px 0;
  color: #2c5282;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* 信奥成长计划介绍区域 */
.growth-plan-intro {
  display: flex;
  flex-direction: row;
  gap: 32px;
  align-items: flex-start;
}

.intro-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.countdown-section {
  flex: 0 0 320px;
  min-width: 0;
}

/* 倒计时卡片样式 */
.countdown-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e0f2fe;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.12);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.countdown-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #87ceeb, #1e90ff, #87ceeb);
}

.countdown-header {
  margin-bottom: 20px;
}

.countdown-header h4 {
  margin: 0 0 8px 0;
  color: #2c5282;
  font-size: 1.1rem;
  font-weight: 600;
}

.exam-date {
  color: #1e90ff;
  font-size: 0.9rem;
  font-weight: 500;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #87ceeb;
}

.countdown-timer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
}

.time-unit {
  flex: 1;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border: 2px solid #87ceeb;
  border-radius: 12px;
  padding: 12px 8px;
  transition: all 0.3s ease;
}

.time-unit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
}

.time-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c5282;
  line-height: 1;
  margin-bottom: 4px;
}

.time-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.exam-info {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.exam-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.intro-text {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 12px;
  border: 2px solid #87ceeb;
}

.intro-text p {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1.1rem;
  line-height: 1.6;
}

.intro-text p:last-child {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c5282;
}

/* 成长路径样式 */
.growth-path {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc, #e6f7ff);
  border-radius: 12px;
  border: 2px solid #bae6fd;
}

.growth-path h4 {
  margin: 0 0 20px 0;
  color: #2c5282;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.path-stages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stage-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.stage-label {
  background: linear-gradient(135deg, #87ceeb, #1e90ff);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.level-cards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.level-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 12px;
  text-align: center;
  min-width: 80px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.level-1-4 {
  border-color: #10b981;
}

.level-1-4:hover {
  border-color: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.level-5-8 {
  border-color: #f59e0b;
}

.level-5-8:hover {
  border-color: #d97706;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.level-number {
  font-size: 0.9rem;
  font-weight: 700;
  color: #2c5282;
  line-height: 1.2;
}

.level-desc {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.path-arrow {
  font-size: 2rem;
  color: #1e90ff;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(30, 144, 255, 0.3);
}

/* GESP练习链接区域 */
.practice-links {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.link-item {
  text-align: center;
  padding: 32px 24px;
  background: white;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.1);
}

.link-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(135, 206, 235, 0.3);
  border-color: #87ceeb;
}

.link-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.link-item h4 {
  margin: 0 0 12px 0;
  color: #2c5282;
  font-size: 1.3rem;
  font-weight: 600;
}

.link-item p {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

.link-button {
  background: linear-gradient(135deg, #87ceeb, #b0e0e6);
  color: #2c5282;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
}

.link-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(135, 206, 235, 0.5);
}

/* GESP官方链接样式 */
.gesp-official-link {
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 12px;
  border: 2px solid #87ceeb;
  text-align: center;
}

.gesp-official-link h4 {
  margin: 0 0 12px 0;
  color: #2c5282;
  font-size: 1.2rem;
  font-weight: 600;
}

.gesp-official-link p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

.official-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #87ceeb, #b0e0e6);
  color: #2c5282;
  text-decoration: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.official-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(135, 206, 235, 0.5);
  background: linear-gradient(135deg, #b0e0e6, #87ceeb);
  text-decoration: none;
  color: #2c5282;
}

.official-link .link-icon {
  font-size: 1.3rem;
}

.official-link .external-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.cta-section {
  text-align: center;
  padding: 32px;
  background: linear-gradient(135deg, #e6f7ff, #b3e5fc);
  border-radius: 16px;
  border: 2px solid #87ceeb;
}

.cta-section h3 {
  margin: 0 0 12px 0;
  color: #2c5282;
  font-size: 1.5rem;
  font-weight: 600;
}

.cta-section p {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 1.1rem;
}

.cta-button {
  background: linear-gradient(135deg, #87ceeb, #b0e0e6);
  color: #2c5282;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(135, 206, 235, 0.5);
}

  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .exam-content-flex-row {
      flex-direction: column;
      gap: 0;
      padding: 0;
      width: 100%;
    }
    
    .sidebar-placeholder-left {
      display: none;
    }
    
    .sidebar-placeholder-right {
      display: none;
    }
    
    .question-main {
      height: auto;
      min-height: calc(100vh - 20px);
      width: 100%;
      padding: 0;
    }
    
    .question-left-panel {
      padding: 0;
      gap: 16px;
    }
    
  
  .gesp-features {
    grid-template-columns: 1fr;
  }
  
  .link-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .gesp-logo h2 {
    font-size: 2.5rem;
  }
  
  .cta-section {
    padding: 24px 16px;
  }
  
  .cta-section h3 {
    font-size: 1.3rem;
  }
  
  .link-item {
    padding: 24px 16px;
  }
  
  .link-icon {
    font-size: 2.5rem;
  }
  
  /* 移动端倒计时布局调整 */
  .growth-plan-intro {
    flex-direction: column;
    gap: 24px;
  }
  
  .countdown-section {
    flex: none;
    width: 100%;
  }
  
  .countdown-timer {
    gap: 6px;
  }
  
  .time-unit {
    padding: 10px 6px;
  }
  
  .time-value {
    font-size: 1.5rem;
  }
  
  .time-label {
    font-size: 0.75rem;
  }
  
  /* 移动端成长路径调整 */
  .path-stages {
    flex-direction: column;
    gap: 16px;
  }
  
  .path-arrow {
    transform: rotate(90deg);
    font-size: 1.5rem;
  }
  
  .level-cards {
    gap: 6px;
  }
  
  .level-card {
    min-width: 70px;
    padding: 12px 8px;
  }
  
  .level-number {
    font-size: 0.8rem;
  }
  
  .level-desc {
    font-size: 0.7rem;
  }
}
  </style>
  