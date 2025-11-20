<template>
  <div class="selector-overlay" @click="$emit('close')">
    <div class="selector-content" @click.stop>
      <div class="selector-header">
        <h3>选择试卷</h3>
        <button class="close-btn" @click="$emit('close')">
          ×
        </button>
      </div>

      <div class="selector-body">
        <!-- 搜索和筛选 -->
        <div class="search-section">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="搜索试卷名称..." 
            class="search-input"
          />
          <select v-model="selectedLevel" class="level-filter">
            <option value="">全部级别</option>
            <option value="1">GESP 1级</option>
            <option value="2">GESP 2级</option>
            <option value="3">GESP 3级</option>
            <option value="4">GESP 4级</option>
            <option value="5">GESP 5级</option>
            <option value="6">GESP 6级</option>
          </select>
        </div>

        <!-- 试卷列表 -->
        <div class="exam-list">
          <div v-if="loading" class="loading">
            <div class="spinner">⟲</div>
            加载中...
          </div>
          <div v-else-if="filteredExams.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>{{ exams.length === 0 ? '暂无试卷' : '没有符合条件的试卷' }}</p>
          </div>
          <div 
            v-else
            v-for="exam in filteredExams" 
            :key="exam.id"
            class="exam-item"
            :class="{ selected: selectedExams.includes(exam.id) }"
            @click="toggleExam(exam.id)"
          >
            <div class="exam-info">
              <div class="exam-title">{{ exam.name }}</div>
              <div class="exam-meta">
                <span class="meta-item">
                  <span class="meta-icon">📊</span>
                  GESP {{ exam.level }}级
                </span>
                <span class="meta-item">
                  <span class="meta-icon">❓</span>
                  {{ exam.question_count }}题
                </span>
                <span class="meta-item">
                  <span class="meta-icon">🕒</span>
                  {{ exam.duration }}分钟
                </span>
              </div>
            </div>
            <div class="exam-checkbox">
              <span v-if="selectedExams.includes(exam.id)" class="checkbox-checked">✓</span>
              <span v-else class="checkbox-unchecked">○</span>
            </div>
          </div>
        </div>
      </div>

      <div class="selector-footer">
        <div class="selected-count">已选择: {{ selectedExams.length }}</div>
        <div class="footer-actions">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-confirm" @click="handleConfirm" :disabled="selectedExams.length === 0">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close', 'select'])

import { BASE_URL } from '@/config/api'

const loading = ref(false)
const exams = ref<any[]>([])
const selectedExams = ref<number[]>([])
const searchKeyword = ref('')
const selectedLevel = ref('')

// 过滤后的试卷列表
const filteredExams = computed(() => {
  let result = exams.value

  // 按级别筛选
  if (selectedLevel.value) {
    result = result.filter(exam => String(exam.level) === selectedLevel.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(exam => 
      exam.name.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 获取试卷列表
async function fetchExams() {
  loading.value = true
  try {
    console.log('📡 [ExamSelector] 开始获取试卷列表...')
    const response = await axios.get(`${BASE_URL}/exams`)
    
    console.log('📡 [ExamSelector] API响应:', response.data)
    
    // API返回的数据直接是数组，不是包装在 {success, data} 中
    if (Array.isArray(response.data)) {
      exams.value = response.data
      console.log('✅ [ExamSelector] 试卷数量:', exams.value.length)
      if (exams.value.length > 0) {
        console.log('📋 [ExamSelector] 第一个试卷:', exams.value[0])
      } else {
        console.warn('⚠️ [ExamSelector] 试卷列表为空')
      }
    } else if (response.data.success) {
      // 如果是包装格式，也支持
      exams.value = response.data.data || []
      console.log('✅ [ExamSelector] 试卷数量:', exams.value.length)
    } else {
      console.warn('⚠️ [ExamSelector] 未知的响应格式')
      exams.value = []
    }
  } catch (error) {
    console.error('❌ [ExamSelector] 获取试卷列表失败:', error)
    alert('获取试卷列表失败')
  } finally {
    loading.value = false
  }
}

// 切换选择
function toggleExam(examId: number) {
  const index = selectedExams.value.indexOf(examId)
  if (index > -1) {
    selectedExams.value.splice(index, 1)
  } else {
    selectedExams.value.push(examId)
  }
}

// 确认选择
function handleConfirm() {
  emit('select', selectedExams.value)
}

onMounted(() => {
  fetchExams()
})
</script>

<style scoped>
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.selector-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-header h3 {
  color: white;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-family: Arial, sans-serif;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #1e90ff;
}

.level-filter {
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.level-filter:focus {
  outline: none;
  border-color: #1e90ff;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #1e90ff;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
  color: #1e90ff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exam-item:hover {
  border-color: #1e90ff;
  background: #f0f9ff;
}

.exam-item.selected {
  border-color: #1e90ff;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
}

.exam-info {
  flex: 1;
}

.exam-title {
  color: #1e293b;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
}

.exam-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  color: #64748b;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 14px;
}

.exam-checkbox {
  font-size: 24px;
}

.checkbox-checked {
  color: #1e90ff;
  font-weight: bold;
}

.checkbox-unchecked {
  color: #cbd5e1;
}

.selector-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  color: #1e90ff;
  font-weight: 600;
  font-size: 14px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #0c7cd5 0%, #1e90ff 100%);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>


