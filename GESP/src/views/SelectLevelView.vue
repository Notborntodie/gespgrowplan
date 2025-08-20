<template>
  <div class="levels-layout">
    <!-- GESP等级练习 header -->
    <div class="levels-header">
      <div class="header-left">
        <h2>GESP等级练习</h2>
      </div>
      <span class="level-count">共 {{ levels.length }} 个等级</span>
    </div>
    <!-- 等级卡片横向滚动 -->
    <div class="levels-horizontal-scroll" ref="scrollContainer">
      <div
        v-for="level in levels"
        :key="level"
        class="level-card elevate-card"
        @click="selectLevel(level)"
      >
        <div class="level-card-header">
          <div class="level-number">
            <span class="level-badge" :class="`level-${level}`">
              GESP {{ level }}级
            </span>
          </div>
        </div>
        <div class="level-details">
          <div class="detail-section">
            <h5>等级简介</h5>
            <div class="description-box">
              {{ getLevelDescription(level) }}
            </div>
          </div>
          <div class="detail-section">
            <h5>统计信息</h5>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">题目数量</span>
                <span class="stat-value">{{ getQuestionCount(level) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">难度</span>
                <span class="stat-value">{{ getDifficulty(level) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 知识点练习 header -->
    <div class="levels-header">
      <div class="header-left">
        <h2>知识点练习</h2>
      </div>
      <span class="level-count">包含多种题库</span>
    </div>
    <!-- 总题库单独一行 -->
    <div class="total-bank-row">
      <div
        class="level-card total-bank-card elevate-card"
        @click="selectTotalBank"
      >
        <div class="level-card-header">
          <div class="level-number">
            <span class="level-badge total-level-badge">
              总题库
            </span>
          </div>
        </div>
        <div class="level-details">
          <div class="detail-section">
            <h5>题库简介</h5>
            <div class="description-box">
              包含所有等级的题目，适合全面练习和复习。
            </div>
          </div>
          <div class="detail-section">
            <h5>统计信息</h5>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">题目数量</span>
                <span class="stat-value">{{ getTotalQuestionCount() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">覆盖等级</span>
                <span class="stat-value">1-8级</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 练习模式弹窗 -->
    <PracticeModeDialog
      :visible="showPracticeDialog"
      :title="practiceDialogTitle"
      :message="practiceDialogMessage"
      :question-count="practiceDialogQuestionCount"
      :estimated-time="practiceDialogEstimatedTime"
      @confirm="handlePracticeConfirm"
      @cancel="handlePracticeCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted as vueOnMounted, ref as vueRef } from 'vue'
import PracticeModeDialog from '@/components/PracticeModeDialog.vue'

const router = useRouter()
const levels = [1,2,3,4,5,6,7,8]
const scrollContainer = vueRef<HTMLElement | null>(null)

// 弹窗状态
const showPracticeDialog = vueRef(false)
const practiceDialogTitle = vueRef('')
const practiceDialogMessage = vueRef('')
const practiceDialogQuestionCount = vueRef('')
const practiceDialogEstimatedTime = vueRef('')
const selectedLevel = vueRef<number | null>(null)
const isTotalBank = vueRef(false)

// 拖拽滚动实现
vueOnMounted(() => {
  const el = scrollContainer.value as HTMLElement | null
  if (!el) return
  
  let isDown = false
  let startX = 0, scrollLeft = 0
  
  el.addEventListener('mousedown', (e: MouseEvent) => {
    isDown = true
    el.classList.add('dragging')
    startX = e.pageX - el.offsetLeft
    scrollLeft = el.scrollLeft
  })
  
  el.addEventListener('mouseleave', () => {
    isDown = false
    el.classList.remove('dragging')
  })
  
  el.addEventListener('mouseup', () => {
    isDown = false
    el.classList.remove('dragging')
  })
  
  el.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.2 // 滚动速度
    el.scrollLeft = scrollLeft - walk
  })
})

// 假设每个等级的题目数量和难度可以自定义
function getQuestionCount(level: number) {
  // 这里可以根据实际数据返回题目数量
  if (level === 5) return 100
  return 50
}

// 总题库题目数量（示例：所有等级题目数量之和）
function getTotalQuestionCount() {
  return levels.reduce((sum, level) => sum + getQuestionCount(level), 0)
}

function getDifficulty(level: number) {
  if (level <= 2) return '简单'
  if (level <= 5) return '中等'
  return '困难'
}
function getLevelDescription(level: number) {
  return `GESP${level}级考试，适合对应水平的考生。`
}

// 显示练习弹窗
function showPracticeDialogForLevel(level: number, isTotal: boolean = false) {
  selectedLevel.value = level
  isTotalBank.value = isTotal
  
  if (isTotal) {
    practiceDialogTitle.value = '进入总题库练习'
    practiceDialogMessage.value = '您即将进入总题库练习模式，该题库包含所有等级的题目。'
    practiceDialogQuestionCount.value = `${getTotalQuestionCount()} 题`
    practiceDialogEstimatedTime.value = '约 60-90 分钟'
  } else {
    practiceDialogTitle.value = `进入 GESP${level}级 练习`
    practiceDialogMessage.value = `您即将进入 GESP${level}级 练习模式，开始针对性训练。`
    practiceDialogQuestionCount.value = `${getQuestionCount(level)} 题`
    practiceDialogEstimatedTime.value = '约 30-45 分钟'
  }
  
  showPracticeDialog.value = true
}

// 跳转到各自页面
function selectLevel(level: number) {
  // 跳转到该等级的考试列表页面
  router.push(`/level-exams/${level}`)
}

// 跳转到总题库
function selectTotalBank() {
  showPracticeDialogForLevel(0, true)
}

// 处理练习确认
function handlePracticeConfirm() {
  showPracticeDialog.value = false
  
  if (isTotalBank.value) {
    router.push('/practice/1')
  } else if (selectedLevel.value) {
    // 这里可以根据需要跳转到对应等级的练习页面
    alert(`你选择了 GESP${selectedLevel.value}级`)
  }
}

// 处理练习取消
function handlePracticeCancel() {
  showPracticeDialog.value = false
  selectedLevel.value = null
  isTotalBank.value = false
}

function logout() {
  localStorage.removeItem('isLoggedIn')
  router.push('/login')
}
</script>

<style scoped>
.levels-layout {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.levels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 40px 3vw 20px 3vw;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.total-bank-row {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 32px 3vw 0 3vw;
  box-sizing: border-box;
}
.total-bank-card {
  max-width: 600px;
  width: 100%;
  margin-bottom: 24px;
}

.levels-horizontal-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  white-space: nowrap;
  display: flex;
  gap: 32px;
  padding: 32px 3vw 32px 3vw;
  box-sizing: border-box;
  cursor: grab;
  user-select: none;
  scroll-behavior: smooth;
}
.levels-horizontal-scroll.dragging {
  cursor: grabbing;
}

.level-card {
  background: #fff;
  border: 1.5px solid #b6e0fe;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
  transition: box-shadow 0.3s, transform 0.3s;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  min-width: 320px;
  max-width: 340px;
  margin: 0;
  vertical-align: top;
  position: relative;
}
.level-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 12px 32px -2px rgba(30,144,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.06);
  z-index: 2;
}
.elevate-card {
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
}

.level-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1.5px solid #b6e0fe;
}

.level-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-badge {
  background: #1e90ff;
  color: white;
  padding: 7px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10);
}

.level-badge {
  background: #e0f7fa;
  color: #1e90ff;
  padding: 7px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
}

/* 总题库样式 */
.total-bank-card .number-badge,
.total-badge {
  background: #1e90ff;
  color: #fff;
}
.total-bank-card .level-badge,
.total-level-badge {
  background: #e0f7fa;
  color: #1e90ff;
}

.level-1 { background: #e0f7fa; color: #1e90ff; }
.level-2 { background: #b6e0fe; color: #1e90ff; }
.level-3 { background: #d1faff; color: #1e90ff; }
.level-4 { background: #e3f2fd; color: #1e90ff; }
.level-5 { background: #b3e5fc; color: #1e90ff; }
.level-6 { background: #bbdefb; color: #1e90ff; }
.level-7 { background: #e1f5fe; color: #1e90ff; }
.level-8 { background: #e0f2f1; color: #1e90ff; }

.level-details {
  padding: 18px 24px;
  border-top: 1.5px solid #b6e0fe;
  background: #f9fafb;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.detail-section {
  margin-bottom: 18px;
}

.detail-section h5 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
}

.description-box {
  background: #e3f2fd;
  border: 1.5px solid #b6e0fe;
  border-radius: 10px;
  padding: 14px;
  font-size: 15px;
  color: #1976d2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e90ff;
}
</style>
