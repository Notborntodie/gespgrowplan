<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
      <nav class="sidebar-nav">
        <button 
          v-for="item in menuItems" 
          :key="item.key"
          @click="openSection(item.key)"
          :class="['nav-item', { active: currentActiveSection === item.key }]"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>
    <!-- 主内容区域 -->
    <main class="main-content">
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

      <!-- 页面内容区域 -->
      <div v-if="openedSections.length > 0" class="pages-container">
        <KeepAlive :max="10">
          <component
            v-if="activeComponent"
            :is="activeComponent"
            class="content-section"
            :key="currentActiveSection"
            :refresh-trigger="sectionRefreshTriggers[currentActiveSection] || 0"
          />
        </KeepAlive>
      </div>

      <!-- 欢迎页面 - 当没有打开任何页面时显示 -->
      <div v-else class="welcome-section">
        <div class="welcome-content">
          <i class="fas fa-tachometer-alt welcome-icon"></i>
          <h3>欢迎来到管理后台</h3>
          <p>请从左侧菜单选择要管理的功能模块</p>
          <div class="quick-actions">
            <button 
              v-for="item in menuItems.slice(0, 4)" 
              :key="item.key"
              @click="openSection(item.key)"
              class="quick-action-btn"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, KeepAlive } from 'vue'

import QuestionUpload from '@/components/admin/QuestionUpload.vue'
import KnowledgePointManagement from '@/components/admin/KnowledgePointManagement.vue'
import QuestionList from '@/components/admin/QuestionList.vue'
import ExamManagement from '@/components/admin/ExamManagement.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import OJManagement from '@/components/admin/OJManagement.vue'
import LeaningPlanManagement from '@/components/admin/LeaningPlanManagement.vue'

// 侧边栏菜单项
const menuItems = [
  { key: 'upload', label: '上传题目' },
  { key: 'knowledge-points', label: '知识点管理' },
  { key: 'questions', label: '题目列表' },
  { key: 'exam-management', label: '练习管理' },
  { key: 'oj-management', label: 'OJ 题目管理' },
  { key: 'plan-management', label: '学习计划管理' },
  { key: 'user-management', label: '用户管理' }
]

// 管理打开的页面
const openedSections = ref<string[]>([])
const currentActiveSection = ref<string>('')

// 页面刷新触发器 - 用于控制各个页面是否需要刷新数据
const sectionRefreshTriggers = ref<Record<string, number>>({})

// 触发特定页面的数据刷新
function triggerSectionRefresh(sectionKey: string) {
  if (!sectionRefreshTriggers.value[sectionKey]) {
    sectionRefreshTriggers.value[sectionKey] = 0
  }
  sectionRefreshTriggers.value[sectionKey]++
  console.log(`🔄 触发页面 ${sectionKey} 数据刷新, trigger: ${sectionRefreshTriggers.value[sectionKey]}`)
}

// 从侧边栏打开页面 - 需要刷新数据
function openSection(sectionKey: string) {
  console.log(`📂 从侧边栏打开页面: ${sectionKey}`)
  
  // 如果页面还没有打开，添加到打开列表
  if (!openedSections.value.includes(sectionKey)) {
    openedSections.value.push(sectionKey)
    console.log(`➕ 新打开页面 ${sectionKey}，触发数据刷新`)
    // 新打开的页面需要触发数据刷新
    triggerSectionRefresh(sectionKey)
  } else {
    console.log(`🔄 重新激活已存在页面 ${sectionKey}，触发数据刷新`)
    // 已存在的页面被重新激活，也需要刷新数据
    triggerSectionRefresh(sectionKey)
  }
  
  // 切换到该页面
  currentActiveSection.value = sectionKey
}

// 从标签栏切换页面 - 不需要刷新数据
function switchToSection(sectionKey: string) {
  console.log(`🔀 从标签栏切换到页面: ${sectionKey}，不刷新数据`)
  currentActiveSection.value = sectionKey
}

// 关闭页面
function closeSection(sectionKey: string) {
  console.log(`❌ 关闭页面: ${sectionKey}`)
  const index = openedSections.value.indexOf(sectionKey)
  if (index > -1) {
    openedSections.value.splice(index, 1)
    
    // 清理对应的刷新触发器（可选，也可以保留以便下次快速恢复）
    // delete sectionRefreshTriggers.value[sectionKey]
    
    // 如果关闭的是当前活跃的页面，需要切换到其他页面
    if (currentActiveSection.value === sectionKey) {
      if (openedSections.value.length > 0) {
        // 如果还有其他打开的页面，切换到最后一个
        const targetSection = openedSections.value[openedSections.value.length - 1]
        console.log(`🔀 自动切换到页面: ${targetSection}`)
        currentActiveSection.value = targetSection
      } else {
        // 如果没有其他页面了，清空当前活跃页面
        console.log(`🏠 回到欢迎页面`)
        currentActiveSection.value = ''
      }
    }
  }
}

// 根据key获取菜单项的标签
function getMenuLabel(key: string): string {
  const menuItem = menuItems.find(item => item.key === key)
  return menuItem ? menuItem.label : key
}

function formatDate(dateStr: string) {
  if (!dateStr) return '未知'
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

// 将 section key 映射到实际组件
const sectionComponentMap: Record<string, any> = {
  'upload': QuestionUpload,
  'knowledge-points': KnowledgePointManagement,
  'questions': QuestionList,
  'exam-management': ExamManagement,
  'oj-management': OJManagement,
  'plan-management': LeaningPlanManagement,
  'user-management': UserManagement,
}

// 当前激活的组件（用于 KeepAlive 的单一子节点）
const activeComponent = computed(() => sectionComponentMap[currentActiveSection.value] || null)
</script>

<style scoped>
/* 添加CSS变量定义，与天蓝色主题保持一致 */
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

/* 统一背景为渐变，与SelectLevelView一致 */
.admin-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, var(--primary-light, #87ceeb) 0%, var(--bg-secondary, #f8fafc) 100%);
  box-sizing: border-box;
}

/* 侧边栏样式 - 更窄、更浅、更高级 */
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

/* 页面容器样式 */
.pages-container {
  flex: 1;
  padding: 0;
  padding-top: 72px; /* 为NavBar(48px)和标签栏(24px)留出空间，紧贴 */
  overflow-y: auto;
}

/* 欢迎页面样式 */
.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  padding-top: 80px; /* NavBar 的高度 + 额外空间 */
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 48px 32px;
  border: 1px solid rgba(30, 144, 255, 0.1);
  box-shadow: 0 8px 32px rgba(30, 144, 255, 0.1);
}

.welcome-icon {
  font-size: 64px;
  color: #1e90ff;
  margin-bottom: 24px;
  opacity: 0.8;
}

.welcome-content h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 28px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0 0 32px 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.quick-action-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(30, 144, 255, 0.3);
}

.content-section {
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
  max-width: none;
  margin: 0;
  border-radius: 0;
  min-height: calc(100vh - 96px);
}

/* 缩小内部组件header的上下间距 */
.content-section :deep(.section-header) {
  margin-bottom: 12px !important;
  padding: 12px 16px;
}

.content-section :deep(.section-header h2) {
  margin: 0 !important;
  font-size: 20px !important;
}

.content-section :deep(.filters) {
  margin-bottom: 12px !important;
  padding: 12px 16px !important;
}

.content-section :deep(.batch-toolbar) {
  margin-bottom: 12px !important;
  padding: 8px 16px !important;
}

/* 缩小其他可能的header区域间距 */
.content-section :deep(.header-info) {
  gap: 8px !important;
}

.content-section :deep(.action-buttons) {
  gap: 8px !important;
}

.content-section :deep(.filter-group) {
  margin-bottom: 8px !important;
}

.content-section :deep(.question-count),
.content-section :deep(.cache-indicator) {
  padding: 4px 8px !important;
  font-size: 14px !important;
}

.content-section h2 {
  margin-top: 0;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 15px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.form-container {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #1e90ff);
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

/* 卡片样式与SelectLevelView统一 */
.questions-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.question-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.question-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px -2px rgb(0 0 0 / 0.15);
}

.question-card--expanded {
  grid-column: span 2;
  grid-row: span 2;
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 144, 255, 0.1);
  border-bottom: 1px solid #d1d5db;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 10px;
}

.number-badge {
  background: var(--primary-color, #1e90ff);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.level-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.level-1 { background: #fef3c7; color: #d97706; }
.level-2 { background: #d1fae5; color: #065f46; }
.level-3 { background: #e0f2fe; color: #1e40af; }
.level-4 { background: #f3e8ff; color: #6b21a8; }
.level-5 { background: #fdf6b2; color: #92400e; }

.question-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.btn-icon:hover {
  color: #4b5563;
}

.btn-icon--danger {
  color: #ef4444;
}

.btn-icon--danger:hover {
  color: #dc2626;
}

.question-details {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f9fafb;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.detail-section {
  margin-bottom: 15px;
}

.detail-section h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #374151;
  font-size: 16px;
}

.answer-box,
.explanation-box {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #374151;
}

.explanation-box p {
  margin: 0;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.exam-form {
  max-width: 1200px;
  margin: 0 auto;
}

.exams-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.question-content {
  padding: 16px 20px 0 20px;
  color: #334155;
  font-size: 15px;
  min-height: 48px;
  line-height: 1.7;
  background: #f9fafb;
  border-bottom: 1px solid #e2e8f0;
  word-break: break-all;
}

.question-card--expanded .question-content {
  border-bottom: none;
  background: #f3f4f6;
}

.btn-icon--edit {
  color: #f59e0b;
}
.btn-icon--edit:hover {
  color: #d97706;
}

/* New styles for upload section */
.knowledge-points-section,
.question-upload-section,
.upload-history-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.knowledge-points-form,
.single-upload,
.batch-upload {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.knowledge-points-list h4,
.question-upload-section h3,
.upload-history-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

.knowledge-points-grid,
.knowledge-points-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.knowledge-point-item {
  background: #e0f2fe;
  color: #1e40af;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.kp-name {
  flex-grow: 1;
}

.kp-category {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.kp-level {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.knowledge-points-selection label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.kp-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.upload-methods {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.method-btn {
  flex: 1;
  padding: 12px 20px;
  background: #e0f2fe;
  color: #1e40af;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.method-btn:hover {
  background: #d1d5db;
  color: #374151;
}

.method-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.single-upload .question-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.single-upload .form-row {
  display: flex;
  gap: 20px;
}

.single-upload .form-group {
  flex: 1;
}

.single-upload .form-group label {
  margin-bottom: 5px;
}

.single-upload .form-group input,
.single-upload .form-group select {
  width: 100%;
}

.single-upload .options-section {
  margin-top: 15px;
}

.single-upload .option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.single-upload .option-inputs {
  display: flex;
  gap: 10px;
  flex-grow: 1;
}

.single-upload .option-label,
.single-upload .option-value,
.single-upload .option-text {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.single-upload .option-label {
  width: 50px; /* Fixed width for label */
  text-align: center;
}

.single-upload .option-value {
  width: 80px; /* Fixed width for value */
  text-align: center;
}

.single-upload .option-text {
  flex: 2; /* Allow text to grow */
  min-width: 150px; /* Minimum width for text */
}

.single-upload .btn-remove {
  background: #ef4444;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s ease;
}

.single-upload .btn-remove:hover {
  background: #dc2626;
}

.single-upload .image-preview {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.single-upload .image-preview img {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.single-upload .btn-remove-image {
  background: #ef4444;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s ease;
}

.single-upload .btn-remove-image:hover {
  background: #dc2626;
}

.batch-upload .batch-upload-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.batch-upload .batch-upload-area textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 150px;
  resize: vertical;
}

.batch-upload .batch-upload-area textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.upload-history-section .upload-history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upload-history-section .upload-item {
  background: #f3f4f6;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.upload-history-section .upload-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.upload-history-section .upload-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.upload-history-section .upload-status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.upload-history-section .upload-status.approved {
  background-color: #d1fae5;
  color: #065f46;
}

.upload-history-section .upload-status.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.upload-history-section .upload-status.rejected {
  background-color: #fee2e2;
  color: #991b1b;
}

.upload-history-section .upload-time {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
  
  .main-content {
    margin-left: 200px;
  }
  
  .tabs-header {
    padding: 0 16px;
    top: 48px; /* NavBar 的高度 */
    left: 200px; /* 确保移动端也正确定位 */
    box-shadow: none;
    border-bottom: none;
  }
  
  .tab-item {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .tab-close {
    width: 16px;
    height: 16px;
    font-size: 14px;
  }
  
  .pages-container {
    padding: 0;
    padding-top: 72px; /* 为NavBar和标签栏留出空间，紧贴 */
  }
  
  .welcome-section {
    padding: 40px 16px;
  }
  
  .welcome-content {
    padding: 32px 24px;
  }

  .questions-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .search-box,
  .filter-dropdown {
    width: 100%;
  }

  .question-card--expanded {
    grid-column: span 1;
    grid-row: span 1;
  }

  .upload-methods {
    flex-direction: column;
    gap: 10px;
  }

  .method-btn {
    width: 100%;
  }

  .single-upload .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .single-upload .form-group {
    flex: none;
  }

  .single-upload .form-group label {
    margin-bottom: 5px;
  }

  .single-upload .option-inputs {
    flex-direction: column;
    gap: 5px;
  }

  .single-upload .option-label,
  .single-upload .option-value,
  .single-upload .option-text {
    width: 100%;
  }

  /* 移动端进一步缩小header间距 */
  .content-section :deep(.section-header) {
    margin-bottom: 4px !important;
    padding: 4px 8px !important;
  }

  .content-section :deep(.filters) {
    margin-bottom: 4px !important;
    padding: 4px 8px !important;
  }

  .content-section :deep(.batch-toolbar) {
    margin-bottom: 4px !important;
    padding: 4px 8px !important;
  }
}
</style>

