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
          @click="activeSection = item.key"
          :class="['nav-item', { active: activeSection === item.key }]"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 上传题目 -->
      <section v-if="activeSection === 'upload'" class="content-section">
        <QuestionUpload />
      </section>

      <!-- 题目列表 -->
      <section v-if="activeSection === 'questions'" class="content-section">
        <QuestionList />
      </section>

      <!-- 创建考试 -->
      <section v-if="activeSection === 'create-exam'" class="content-section">
        <CreateExam />
      </section>

      <!-- 考试管理 -->
      <section v-if="activeSection === 'exam-management'" class="content-section">
        <ExamManagement />
      </section>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import QuestionUpload from '@/components/admin/QuestionUpload.vue'
import QuestionList from '@/components/admin/QuestionList.vue'
import ExamManagement from '@/components/admin/ExamManagement.vue'
import CreateExam from '@/components/admin/CreateExam.vue'

// 侧边栏菜单项
const menuItems = [
  { key: 'upload', label: '上传题目' },
  { key: 'questions', label: '题目列表' },
  { key: 'create-exam', label: '创建练习' },
  { key: 'exam-management', label: '练习管理' }
]

const activeSection = ref('upload')


function formatDate(dateStr: string) {
  if (!dateStr) return '未知'
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}
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
  top: 0;
  height: 100vh;
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
}

.content-section {
  background: #f8fafc;
  padding: 32px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  max-width: 1400px;
  margin: 0 auto 32px auto;
  border: 1px solid #e2e8f0;
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
    padding: 20px;
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
}
</style>

