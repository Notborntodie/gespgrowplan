<template>
  <div class="content-section">
    <div class="upload-header">
      <h2>上传题目</h2>
    </div>
    
    <div class="upload-cards-container">
      <!-- 单个题目上传卡片 -->
      <div class="upload-card elevate-card">
        <div class="card-header" @click="openSingleUploadDialog">
          <div class="card-title">
            <Icon name="file-text" :size="32" class="card-icon" />
            <h3>单个题目上传</h3>
          </div>
          <div class="card-actions">
            <button class="btn-icon" title="打开">
              <Icon name="plus" :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!--
      <div class="upload-card elevate-card">
        <div class="card-header" @click="openBatchUploadDialog">
          <div class="card-title">
            <div class="card-icon">📦</div>
            <h3>批量上传题目</h3>
          </div>
          <div class="card-actions">
            <button class="btn-icon" title="打开">
              ➕
            </button>
          </div>
        </div>
      </div>
      量上传卡片 -->
      <!-- AI上传卡片 -->
      <div class="upload-card elevate-card">
        <div class="card-header" @click="openAIUploadDialog">
          <div class="card-title">
            <Icon name="bot" :size="32" class="card-icon" />
            <h3>AI上传题目</h3>
          </div>
          <div class="card-actions">
            <button class="btn-icon" title="打开">
              <Icon name="plus" :size="20" />
            </button>
          </div>
        </div>
      </div>

    
    </div>

    <!-- 单个题目上传弹窗 -->
    <SingleUploadDialog
      :visible="showSingleUploadDialog"
      @close="closeSingleUploadDialog"
    />

    <!-- 批量上传弹窗 -->
    <BatchUploadDialog
      :visible="showBatchUploadDialog"
      @close="closeBatchUploadDialog"
    />

    <!-- AI上传弹窗 -->
    <AIUploadDialog
      :visible="showAIUploadDialog"
      @close="closeAIUploadDialog"
    />

  </div>
</template>
  
  <script setup lang="ts">
import { ref, onMounted } from 'vue'
  import axios from 'axios'
import SingleUploadDialog from './Dialog/SingleUploadDialog.vue'
import BatchUploadDialog from './Dialog/BatchUploadDialog.vue'
import AIUploadDialog from './Dialog/AIUploadDialog.vue'
import Icon from '@/components/Icon.vue'

// 弹窗状态管理
const showSingleUploadDialog = ref(false)
const showBatchUploadDialog = ref(false)
const showAIUploadDialog = ref(false)

// 打开弹窗方法
function openSingleUploadDialog() {
  showSingleUploadDialog.value = true
}

function openBatchUploadDialog() {
  showBatchUploadDialog.value = true
}

function openAIUploadDialog() {
  showAIUploadDialog.value = true
}


// 关闭弹窗方法
function closeSingleUploadDialog() {
  showSingleUploadDialog.value = false
}

function closeBatchUploadDialog() {
  showBatchUploadDialog.value = false
}

function closeAIUploadDialog() {
  showAIUploadDialog.value = false
}

  
  </script>
  
  <style scoped>
/* CSS变量定义，与天蓝色主题保持一致 */
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

.content-section {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  overflow-x: hidden;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 40px 24px 20px 24px;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
  max-width: 1200px;
  margin: 0 auto;
}

.upload-cards-container {
  width: 100%;
  padding: 32px 24px 32px 24px;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-section h2 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

/* 卡片样式 */
.upload-card {
  background: #fff;
  border: 1.5px solid #b6e0fe;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
  transition: box-shadow 0.3s, transform 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
}

.upload-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px -2px rgba(30,144,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.06);
  z-index: 2;
}

.elevate-card {
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-bottom: 1.5px solid #b6e0fe;
  cursor: pointer;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ea5e9;
  flex-shrink: 0;
}

.card-title h3 {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: white;
  transition: color 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.btn-icon:hover {
  color: #4b5563;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.card-content {
  background: #f9fafb;
  border-top: 1.5px solid #b6e0fe;
  padding: 18px 24px;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
}

.btn-primary {
  background: #1e90ff;
  color: white;
}

.btn-primary:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 144, 255, 0.3);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 知识点管理样式 */
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
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.knowledge-points-list h4,
.question-upload-section h3,
.upload-history-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 12px;
}

.knowledge-points-grid,
.knowledge-points-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.knowledge-point-item {
  background: #e0f2fe;
  color: #1e40af;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1.5px solid #bae6fd;
  transition: all 0.2s ease;
}

.knowledge-point-item:hover {
  background: #bae6fd;
  color: #075985;
}

.kp-name {
  flex-grow: 1;
}

.kp-category {
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #bae6fd;
}

.kp-level {
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #bae6fd;
}

.knowledge-points-selection label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #374151;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.knowledge-points-selection label:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.kp-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #1e90ff;
}

/* 上传方式选择样式 */
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

/* 单个上传样式 */
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
  gap: 12px;
  margin-bottom: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.single-upload .option-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.single-upload .option-inputs {
  display: flex;
  gap: 12px;
  flex-grow: 1;
}

.single-upload .option-label,
.single-upload .option-value,
.single-upload .option-text {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 15px;
  background: white;
  transition: all 0.3s ease;
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
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.single-upload .btn-remove:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.single-upload .image-preview {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
}

.single-upload .image-preview img {
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.single-upload .btn-remove-image {
  background: #ef4444;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.single-upload .btn-remove-image:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

/* 代码题目样式 */
.code-textarea {
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: #1e293b;
  color: #f8fafc;
  border: 1.5px solid #475569;
  border-radius: 10px;
  padding: 16px;
  resize: vertical;
  min-height: 200px;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.code-textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.code-hint {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.code-hint small {
  color: #94a3b8;
}

/* 批量上传样式 - 使用更高优先级的选择器 */
.card-content .batch-upload-area {
  display: flex !important;
  flex-direction: column !important;
  gap: 28px !important;
  padding: 32px !important;
  background: linear-gradient(135deg, #e0f7fa 0%, #f8fafc 100%) !important;
  border-radius: 20px !important;
  border: 2px solid #b6e0fe !important;
  box-shadow: 0 8px 32px -4px rgba(30,144,255,0.12), 0 2px 8px 0 rgba(0,0,0,0.04) !important;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif !important;
}

.card-content .batch-example {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
  border: 2px solid #b6e0fe !important;
  border-radius: 16px !important;
  padding: 28px 28px 18px 28px !important;
  margin-bottom: 18px !important;
  box-shadow: 0 4px 16px 0 rgba(30,144,255,0.10) !important;
  position: relative !important;
}

.card-content .batch-example h4 {
  color: #1976d2 !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  margin-bottom: 10px !important;
  letter-spacing: 1px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.card-content .example-code {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
  color: #f8fafc !important;
  padding: 22px 18px !important;
  border-radius: 12px !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', 'monospace' !important;
  font-size: 15px !important;
  line-height: 1.7 !important;
  border: 1.5px solid #475569 !important;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10) !important;
  margin-bottom: 8px !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  position: relative !important;
  transition: box-shadow 0.2s !important;
}

.card-content .example-code:hover {
  box-shadow: 0 6px 24px 0 rgba(30,144,255,0.18) !important;
}

.card-content .batch-textarea {
  width: 100% !important;
  padding: 22px 18px !important;
  border: 2px solid #b6e0fe !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  min-height: 180px !important;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%) !important;
  color: #1e293b !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', 'monospace' !important;
  line-height: 1.7 !important;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08) !important;
  transition: border-color 0.2s, box-shadow 0.2s !important;
  resize: vertical !important;
}

.card-content .batch-textarea:focus {
  border-color: #1e90ff !important;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15) !important;
  outline: none !important;
}

.card-content .btn-primary {
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 12px 28px !important;
  border-radius: 10px !important;
  letter-spacing: 1px !important;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10) !important;
  transition: background 0.2s, box-shadow 0.2s !important;
}

.card-content .btn-secondary {
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 12px 28px !important;
  border-radius: 10px !important;
  letter-spacing: 1px !important;
  background: #f1f5f9 !important;
  color: #64748b !important;
  border: 1.5px solid #e2e8f0 !important;
  transition: background 0.2s, color 0.2s !important;
}

/* 新增的样式类 */
.card-content .input-header {
  margin-bottom: 12px !important;
}

.card-content .input-header h5 {
  font-size: 17px !important;
  color: #1976d2 !important;
  font-weight: 600 !important;
  margin-bottom: 6px !important;
  letter-spacing: 1px !important;
}

.card-content .input-stats {
  font-size: 13px !important;
  color: #64748b !important;
  margin-left: 10px !important;
}

.card-content .action-section {
  display: flex !important;
  align-items: center !important;
  gap: 18px !important;
  margin-top: 10px !important;
}

.card-content .action-buttons {
  display: flex !important;
  gap: 12px !important;
}

.card-content .format-badge {
  display: inline-block !important;
  background: #e0f2fe !important;
  color: #1e90ff !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  padding: 2px 10px !important;
  margin-left: 12px !important;
  border: 1px solid #b6e0fe !important;
  letter-spacing: 1px !important;
}

.batch-upload .batch-upload-area {
  background: linear-gradient(135deg, #e0f7fa 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 2px solid #b6e0fe;
  box-shadow: 0 8px 32px -4px rgba(30,144,255,0.12), 0 2px 8px 0 rgba(0,0,0,0.04);
  padding: 36px 32px 32px 32px;
  gap: 32px;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

.batch-upload .batch-example {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #b6e0fe;
  border-radius: 16px;
  padding: 28px 28px 18px 28px;
  margin-bottom: 18px;
  box-shadow: 0 4px 16px 0 rgba(30,144,255,0.10);
  position: relative;
}

.batch-upload .batch-example h4 {
  color: #1976d2;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-upload .batch-example .format-badge {
  display: inline-block;
  background: #e0f2fe;
  color: #1e90ff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  margin-left: 12px;
  border: 1px solid #b6e0fe;
  letter-spacing: 1px;
}

.batch-upload .example-code {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #f8fafc;
  padding: 22px 18px;
  border-radius: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', 'monospace';
  font-size: 15px;
  line-height: 1.7;
  border: 1.5px solid #475569;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10);
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  position: relative;
  transition: box-shadow 0.2s;
}

.batch-upload .example-code:hover {
  box-shadow: 0 6px 24px 0 rgba(30,144,255,0.18);
}

.batch-upload .code-overlay {
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 12px;
  color: #94a3b8;
  opacity: 0.7;
  pointer-events: none;
}

.batch-upload .input-section {
  margin-top: 10px;
}

.batch-upload .input-header h5 {
  font-size: 17px;
  color: #1976d2;
  font-weight: 600;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.batch-upload .input-stats {
  font-size: 13px;
  color: #64748b;
  margin-left: 10px;
}

.batch-upload .textarea-container {
  position: relative;
}

.batch-upload .batch-textarea {
  width: 100%;
  padding: 22px 18px;
  border: 2px solid #b6e0fe;
  border-radius: 12px;
  font-size: 15px;
  min-height: 180px;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', 'monospace';
  line-height: 1.7;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
}

.batch-upload .batch-textarea:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15);
  outline: none;
}

.batch-upload .textarea-overlay {
  position: absolute;
  left: 18px;
  bottom: 10px;
  font-size: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.batch-upload .format-tips .tip {
  display: inline-block;
  margin-right: 16px;
  font-size: 12px;
  color: #1e90ff;
  background: #e0f2fe;
  border-radius: 6px;
  padding: 2px 8px;
  font-weight: 500;
}

.batch-upload .action-section {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 10px;
}

.batch-upload .action-buttons {
  display: flex;
  gap: 12px;
}

.batch-upload .btn-primary, .batch-upload .btn-secondary {
  font-size: 15px;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: 10px;
  letter-spacing: 1px;
}

.batch-upload .btn-primary {
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.10);
  transition: background 0.2s, box-shadow 0.2s;
}

.batch-upload .btn-primary:disabled {
  background: #b6e0fe;
  color: #fff;
  cursor: not-allowed;
}

.batch-upload .btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  transition: background 0.2s, color 0.2s;
}

.batch-upload .btn-secondary:disabled {
  background: #f3f4f6;
  color: #b6b6b6;
  cursor: not-allowed;
}

.batch-upload .upload-status {
  font-size: 14px;
  color: #1e90ff;
  margin-left: 18px;
}

.batch-upload .status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-upload .status-dot {
  width: 10px;
  height: 10px;
  background: #1e90ff;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}

@keyframes blink {
  0% { opacity: 1; }
  100% { opacity: 0.3; }
}

/* 上传历史样式 */
.upload-history-section .upload-history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upload-history-section .upload-item {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px 0 rgba(30,144,255,0.08);
}

.upload-history-section .upload-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(30,144,255,0.12);
}

.upload-history-section .upload-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.upload-history-section .upload-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
  line-height: 1.5;
}

.upload-history-section .upload-status {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
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

.upload-history-section .upload-code {
  margin: 8px 0;
}

.upload-history-section .code-label {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.upload-history-section .code-preview {
  background-color: #1e293b;
  color: #f8fafc;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.3;
  margin: 4px 0;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 响应式设计 */
@media (max-width: 768px) {
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

  .knowledge-points-grid,
  .knowledge-points-selection {
    grid-template-columns: 1fr;
  }
}
</style>
  
  