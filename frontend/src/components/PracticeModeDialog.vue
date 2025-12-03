<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <Icon name="target" :size="32" class="dialog-icon" />
        <h3 class="dialog-title">{{ title }}</h3>
      </div>
      <div class="dialog-content">
        <p>{{ message }}</p>
        <div class="practice-info">
          <div class="info-item">
            <Icon name="book-open" :size="18" class="info-icon" />
            <span class="info-text">题目数量：{{ questionCount }}</span>
          </div>
        </div>
        
        <!-- 模式选择 -->
        <div class="mode-selection">
          <h4 class="mode-title">选择练习模式</h4>
          <div class="mode-options">
            <div 
              class="mode-option primary-mode"
              :class="{ 'selected': selectedMode === 'review' }"
              @click="selectMode('review')"
            >
              <Icon name="book-open" :size="36" class="mode-icon" />
              <div class="mode-content">
                <h5 class="mode-name">复习模式</h5>
                <p class="mode-description">学习模式，实时查看答案解析</p>
                <ul class="mode-features">
                  <li><Icon name="check" :size="14" /> 随时查看解析</li>
              
                  <li><Icon name="check" :size="14" /> 自由跳转题目</li>
                 
                </ul>
              </div>
            </div>
            
            <div 
              class="mode-option"
              :class="{ 'selected': selectedMode === 'exam' }"
              @click="selectMode('exam')"
            >
              <Icon name="file-text" :size="36" class="mode-icon" />
              <div class="mode-content">
                <h5 class="mode-name">考试模式</h5>
                <p class="mode-description">模拟真实考试，计时答题</p>
                <ul class="mode-features">
                  <li><Icon name="check" :size="14" /> 计时答题</li>
                  <li><Icon name="check" :size="14" /> 提交评分</li>
                  <li><Icon name="check" :size="14" /> 成绩统计</li>
                  <li><Icon name="x" :size="14" /> 无答案解析</li>
                </ul>
              </div>
            </div>
            
            <div 
              class="mode-option"
              :class="{ 'selected': selectedMode === 'classroom' }"
              @click="selectMode('classroom')"
            >
              <Icon name="school" :size="36" class="mode-icon" />
              <div class="mode-content">
                <h5 class="mode-name">课堂模式</h5>
                <p class="mode-description">适合课堂教学使用</p>
                <ul class="mode-features">
                  <li><Icon name="check" :size="14" /> 无解析干扰</li>
                  <li><Icon name="check" :size="14" /> 专注答题</li>
                  <li><Icon name="check" :size="14" /> 课堂氛围</li>
                  <li><Icon name="x" :size="14" /> 不能提交</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="handleCancel" class="btn btn-secondary">
          取消
        </button>
        <button @click="handleConfirm" class="btn btn-primary" :disabled="!selectedMode">
          开始练习
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  questionCount?: string
  hasSubmission?: boolean // 是否已经提交过该考试
}>()

const emit = defineEmits<{
  confirm: [mode: string]
  cancel: []
}>()

const selectedMode = ref<string>('review') // 默认选择复习模式

// 从本地缓存获取用户信息并判断是否为教师角色
const isTeacher = computed(() => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      return false
    }
    
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo.roles || !Array.isArray(userInfo.roles)) {
      return false
    }
    
    return userInfo.roles.some((role: any) => 
      role.id === '3' || role.id === 3 || role.name === 'teacher'
    )
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
})

function selectMode(mode: string) {
  selectedMode.value = mode
}

function handleConfirm() {
  if (selectedMode.value) {
    emit('confirm', selectedMode.value)
  }
}

function handleCancel() {
  selectedMode.value = ''
  emit('cancel')
}

function handleOverlayClick() {
  emit('cancel')
}
</script>

<style scoped>
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
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border-radius: 20px;
  padding: 32px;
  max-width: 900px;
  width: 95%;
  min-height: 400px;
  box-shadow: 0 25px 50px -12px rgba(30, 144, 255, 0.15), 0 0 0 1px rgba(30, 144, 255, 0.1);
  animation: dialogSlideIn 0.3s ease-out;
  border: 2px solid rgba(30, 144, 255, 0.1);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dialog-icon {
  font-size: 32px;
  animation: pulse 2s infinite;
  display: flex;
  align-items: center;
  color: #0ea5e9;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.dialog-title {
  margin: 0;
  color: #0ea5e9;
  font-size: 22px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(14, 165, 233, 0.1);
}

.dialog-content {
  margin-bottom: 24px;
}

.dialog-content p {
  margin: 0 0 16px 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.practice-info {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border: 2px solid #7dd3fc;
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  color: #0ea5e9;
  flex-shrink: 0;
}

.info-text {
  color: #0ea5e9;
  font-weight: 600;
  font-size: 15px;
}

.mode-selection {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 2px solid #bae6fd;
}

.mode-title {
  margin-bottom: 20px;
  color: #0ea5e9;
  font-size: 19px;
  font-weight: 600;
  text-align: center;
}

.mode-options {
  display: flex;
  gap: 20px;
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
}

.mode-option {
  flex: 1;
  min-width: 180px;
  max-width: 220px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 16px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.08);
  position: relative;
}

.mode-option:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #7dd3fc;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.15);
}

.mode-option.selected {
  border-color: #0ea5e9;
  background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.25);
  transform: translateY(-1px);
}

.mode-icon {
  font-size: 36px;
  color: #0ea5e9;
  margin-bottom: 14px;
  filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mode-name {
  margin: 0 0 10px 0;
  color: #0ea5e9;
  font-size: 17px;
  font-weight: 600;
}

.mode-description {
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
}

.mode-features {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.mode-features li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #495057;
  font-size: 12px;
  margin-bottom: 3px;
  text-align: center;
}

.mode-features li :deep(.lucide-icon) {
  flex-shrink: 0;
  color: inherit;
}

.mode-features li:last-child {
  margin-bottom: 0;
}

.mode-features li.checked {
  color: #28a745;
}

.mode-features li.checked::before {
  content: "✓";
  color: #28a745;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border: 2px solid #0ea5e9;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(14, 165, 233, 0.4);
  border-color: #0284c7;
}

.coming-soon-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 教师模式特殊样式 */
.mode-option.teacher-mode {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border: 2px solid #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
  opacity: 0.8;
}

.mode-option.teacher-mode:hover {
  background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
  border-color: #a855f7;
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.25);
  opacity: 0.9;
}

.mode-option.teacher-mode.selected {
  border-color: #a855f7;
  background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.3);
  opacity: 1;
}

.mode-option.teacher-mode .mode-icon {
  color: #a855f7;
}

.mode-option.teacher-mode .mode-name {
  color: #a855f7;
}

.mode-option.teacher-mode .coming-soon-badge {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

/* 主要模式样式 - 自由复习模式 */
.mode-option.primary-mode {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.mode-option.primary-mode:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0284c7;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.15);
}

.mode-option.primary-mode.selected {
  border-color: #0ea5e9;
  background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.25);
}

.mode-option.primary-mode .mode-icon {
  color: #0ea5e9;
}

.mode-option.primary-mode .mode-name {
  color: #0ea5e9;
  font-weight: 600;
}
</style> 