<template>
  <div class="level-exams-container">
    <div class="level-exams-header">
      <h2>CSP-J/S 等级练习</h2>
      <span class="exam-count">功能开发中...</span>
    </div>

    <div class="level-exams-content">
      <div class="coming-soon-state">
        <div class="coming-soon-icon">🚧</div>
        <h3>CSP-J/S 功能开发中</h3>
        <p>CSP-J/S 等级练习功能正在开发中，敬请期待！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// CSP-J/S 功能开发中
</script>

<style scoped>
.level-exams-container {
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

.level-exams-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  gap: 8px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.level-exams-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
}

.exam-count {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  position: relative;
  padding-left: 0;
  margin-left: 0;
}

.exam-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.level-exams-content {
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

.coming-soon-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.coming-soon-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.coming-soon-state h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 28px;
  font-weight: 700;
}

.coming-soon-state p {
  margin: 0;
  color: #64748b;
  font-size: 18px;
  line-height: 1.6;
}

/* 台前调度布局 */
.stage-manager-layout {
  display: flex;
  gap: 40px;
  height: calc(100vh - 200px);
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 40px;
}

/* 左侧：选中的等级卡片 */
.selected-exam-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 20px;
}

.selected-exam-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(30,144,255,0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 600px;
  display: flex;
  flex-direction: column;
}

.selected-exam-card.breathing {
  animation: breathe 2s ease-in-out infinite;
}

.selected-exam-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 32px 80px rgba(30,144,255,0.25);
  border-color: #1e90ff;
  animation: none;
}

/* 呼吸动画 */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.selected-exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 36px;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 2px solid #b6e0fe;
  flex-shrink: 0;
}

.exam-name {
  margin: 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}



.exam-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.selected-exam-content {
  padding: 32px 36px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exam-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  gap: 12px;
}

.stat-item:hover {
  background: #f1f5f9;
  border-color: #1e90ff;
}

.stat-label {
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  text-align: left;
}

.knowledge-content .stat-value {
  max-height: 280px;
  overflow-y: auto;
}

/* 圆圈标记样式 */
.knowledge-content .stat-value {
  position: relative;
}

.knowledge-content .stat-value::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 8px;
  width: 4px;
  height: 4px;
  background: #1e90ff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.2);
}

.knowledge-goal .stat-value {
  max-height: 200px;
  overflow-y: auto;
}

.selected-exam-actions {
  display: flex;
  gap: 20px;
  padding: 32px 36px;
  border-top: 2px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

/* 未选择状态占位符 */
.no-selection-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 24px;
  color: #64748b;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.no-selection-placeholder h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.no-selection-placeholder p {
  margin: 0;
  font-size: 18px;
}

/* 右侧：堆叠的等级卡片 */
.stacked-exams-section {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  padding-top: 0;
}

.stacked-exams-container {
  position: relative;
  width: 600px;
  height: 500px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: -40px;
  margin-top: -40px;
}

.stacked-exam-card {
  position: absolute;
  width: 400px;
  height: 120px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}


.stacked-exam-card.selected {
  border-color: #1e90ff;
  border-width: 3px;
  box-shadow: 0 8px 24px rgba(30,144,255,0.4);
  transform: scale(1.02);
}

.card-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1px solid #b6e0fe;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.exam-title {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.exam-level {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}



.card-footer {
  padding: 24px 28px;
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  border-top: 1px solid #b6e0fe;
  display: flex;
  justify-content: flex-end;
}

.level-identifier {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 按钮样式 */
.btn {
  flex: 1;
  padding: 18px 24px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(107,114,128,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #1e90ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30,144,255,0.3);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .stage-manager-layout {
    padding: 0 20px;
    gap: 30px;
  }
  
  .selected-exam-card {
    height: 550px;
  }
  
  .stacked-exams-container {
    width: 550px;
    height: 600px;
  }
  
  .stacked-exam-card {
    width: 350px;
    height: 100px;
  }
}

@media (max-width: 1200px) {
  .stage-manager-layout {
    flex-direction: column;
    gap: 30px;
    height: auto;
    padding: 0 20px;
  }
  
  .selected-exam-section {
    order: 2;
  }
  
  .stacked-exams-section {
    order: 1;
  }
  
  .stacked-exams-container {
    width: 100%;
    max-width: 700px;
    height: 500px;
  }
  
  .stacked-exam-card {
    width: 450px;
    height: 100px;
  }
}

@media (max-width: 768px) {
  .level-exams-header {
    padding: 15px 20px;
  }
  
  .level-exams-header h2 {
    font-size: 1.5rem;
  }
  
  .exam-count {
    font-size: 0.9rem;
  }
  
  .level-exams-content {
    margin-top: 108px;
    padding: 20px 16px;
  }

  .stage-manager-layout {
    gap: 20px;
    padding: 0 16px;
  }

  .selected-exam-card {
    height: 450px;
  }

  .selected-exam-header {
    padding: 24px 28px;
  }

  .selected-exam-content {
    padding: 24px 28px;
  }

  .selected-exam-actions {
    padding: 24px 28px;
    flex-direction: column;
  }

  .stacked-exams-container {
    width: 100%;
    max-width: 450px;
    height: 400px;
  }

  .stacked-exam-card {
    width: 320px;
    height: 80px;
  }

  .exam-stats {
    grid-template-columns: 1fr;
  }
  
  .exam-name {
    font-size: 24px;
  }
  
  .exam-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .level-exams-header {
    padding: 16px;
  }
  
  .level-exams-header h2 {
    font-size: 1.3rem;
  }
  
  .exam-count {
    font-size: 0.85rem;
  }

  .level-exams-content {
    padding: 16px;
  }

  .selected-exam-card {
    height: 400px;
  }

  .stacked-exam-card {
    width: 280px;
    height: 70px;
  }
  
  .exam-name {
    font-size: 20px;
  }
  
  .exam-title {
    font-size: 16px;
  }
}
</style>
