<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">📚</div>
        <h3 class="dialog-title">知识点管理</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="dialog-content">
        <!-- 添加知识点表单 -->
        <div class="knowledge-points-form">
          <h5>添加新知识点</h5>
          <div class="form-row">
            <div class="form-group">
              <label>知识点名称：</label>
              <input v-model="newKnowledgePoint.name" placeholder="如：链表基础" />
            </div>
            <div class="form-group">
              <label>分类：</label>
              <select v-model="newKnowledgePoint.category">
                <option value="algorithm">算法</option>
                <option value="data_structure">数据结构</option>
                <option value="programming">编程</option>
                <option value="math">数学</option>
              </select>
            </div>
            <div class="form-group">
              <label>等级：</label>
              <select v-model="newKnowledgePoint.level">
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">CSP-J</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>描述：</label>
            <textarea v-model="newKnowledgePoint.description" placeholder="知识点详细描述"></textarea>
          </div>
          <button @click="addKnowledgePoint" class="btn btn-secondary">添加知识点</button>
        </div>
        
        <!-- 现有知识点列表 -->
        <div class="knowledge-points-list">
          <h5>现有知识点</h5>
          <div class="knowledge-points-grid">
            <div v-for="kp in knowledgePoints" :key="kp.id" class="knowledge-point-item">
              <span class="kp-name">{{ kp.name }}</span>
              <span class="kp-category">{{ kp.category }}</span>
              <span class="kp-level">{{ kp.level === 6 ? 'CSP-J' : `GESP ${kp.level}级` }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="handleClose" class="btn btn-secondary">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const knowledgePoints = ref<any[]>([])
const newKnowledgePoint = ref({
  name: '',
  description: '',
  category: 'data_structure',
  level: 1
})

// 获取知识点列表
async function fetchKnowledgePoints() {
  try {
    const response = await axios.get('http://localhost:3000/api/knowledge-points')
    knowledgePoints.value = response.data
  } catch (error) {
    console.error('获取知识点失败:', error)
  }
}

// 添加知识点
async function addKnowledgePoint() {
  try {
    const response = await axios.post('http://localhost:3000/api/knowledge-points', newKnowledgePoint.value)
    alert('知识点添加成功')
    newKnowledgePoint.value = { name: '', description: '', category: 'data_structure', level: 1 }
    await fetchKnowledgePoints()
  } catch (error: any) {
    alert('知识点添加失败: ' + error.response?.data?.message || error.message)
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  emit('close')
}

onMounted(() => {
  fetchKnowledgePoints()
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 18px;
  padding: 24px;
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  box-shadow: 0 6px 24px -4px rgba(30,144,255,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.03);
  animation: dialogSlideIn 0.3s ease-out;
  position: relative;
  border: 1.5px solid #b6e0fe;
  display: flex;
  flex-direction: column;
}

@keyframes dialogSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(-20px);}
  to { opacity: 1; transform: scale(1) translateY(0);}
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: linear-gradient(90deg, #1e90ff 0%, #87ceeb 100%);
  border-radius: 12px;
  margin: -24px -24px 20px -24px;
}

.dialog-icon {
  font-size: 32px;
}

.dialog-title {
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
  margin-left: auto;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.knowledge-points-form {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
}

.knowledge-points-form h5 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #b6e0fe;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.2);
}

.knowledge-points-list h5 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.knowledge-points-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
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

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
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
}
</style> 