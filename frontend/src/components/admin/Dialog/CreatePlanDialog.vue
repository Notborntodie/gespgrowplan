<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ plan ? '编辑学习计划' : '创建学习计划' }}</h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 基本信息 -->
        <div class="form-section">
          <h4>基本信息</h4>
          <div class="form-group">
            <label>计划名称<span class="required">*</span></label>
            <input v-model="formData.name" type="text" placeholder="请输入计划名称" />
          </div>

          <div class="form-group">
            <label>计划描述<span class="required">*</span></label>
            <textarea v-model="formData.description" placeholder="请输入计划描述" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>级别<span class="required">*</span></label>
              <select v-model="formData.level">
                <option value="1">GESP 1级</option>
                <option value="2">GESP 2级</option>
                <option value="3">GESP 3级</option>
                <option value="4">GESP 4级</option>
                <option value="5">GESP 5级</option>
                <option value="6">GESP 6级</option>
              </select>
            </div>

            <div class="form-group">
              <label>开始时间<span class="required">*</span></label>
              <input v-model="formData.start_time" type="datetime-local" />
            </div>

            <div class="form-group">
              <label>结束时间<span class="required">*</span></label>
              <input v-model="formData.end_time" type="datetime-local" />
            </div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="form-section">
          <div class="section-title-row">
            <h4>学习任务</h4>
            <button @click="addTask" class="btn-add-task">
              <i class="fas fa-plus"></i> 添加任务
            </button>
          </div>

          <div v-if="formData.tasks.length === 0" class="empty-tasks">
            <p>暂无任务，点击右侧按钮添加任务</p>
          </div>

          <div v-for="(task, index) in formData.tasks" :key="index" class="task-item">
            <div class="task-header">
              <h5>任务 {{ index + 1 }}</h5>
              <button @click="removeTask(index)" class="btn-remove-task">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="form-group">
              <label>任务名称<span class="required">*</span></label>
              <input v-model="task.name" type="text" placeholder="请输入任务名称" />
            </div>

            <div class="form-group">
              <label>任务描述</label>
              <textarea v-model="task.description" placeholder="请输入任务描述" rows="2"></textarea>
            </div>

            <div class="form-group">
              <label>复习内容</label>
              <textarea v-model="task.review_content" placeholder="请输入复习内容" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>复习视频URL</label>
              <input v-model="task.review_video_url" type="url" placeholder="https://example.com/video.mp4" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>开始时间<span class="required">*</span></label>
                <input v-model="task.start_time" type="datetime-local" />
              </div>

              <div class="form-group">
                <label>结束时间<span class="required">*</span></label>
                <input v-model="task.end_time" type="datetime-local" />
              </div>
            </div>

            <!-- 客观题练习 -->
            <div class="exercise-section">
              <div class="exercise-header">
                <label>客观题练习</label>
                <button @click="showExamSelector(index)" class="btn-select">
                  <i class="fas fa-plus"></i> 选择试卷
                </button>
              </div>
              <div v-if="task.exams && task.exams.length > 0" class="selected-items">
                <div v-for="(exam, examIndex) in task.exams" :key="examIndex" class="selected-item">
                  <div class="item-info">
                    <span class="item-id">ID: {{ exam.exam_id }}</span>
                    <span v-if="exam.exam_name" class="item-name">{{ exam.exam_name }}</span>
                    <span v-if="exam.exam_type" class="item-tag">{{ exam.exam_type }}</span>
                    <span v-if="exam.total_questions" class="item-detail">{{ exam.total_questions }}题</span>
                  </div>
                  <button @click="removeExam(index, examIndex)" class="btn-remove-item">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div v-else class="no-items">
                <span>暂未选择试卷</span>
              </div>
            </div>

            <!-- OJ题目 -->
            <div class="exercise-section">
              <div class="exercise-header">
                <label>OJ编程题</label>
                <button @click="showOJSelector(index)" class="btn-select">
                  <i class="fas fa-plus"></i> 选择题目
                </button>
              </div>
              <div v-if="task.oj_problems && task.oj_problems.length > 0" class="selected-items">
                <div v-for="(problem, problemIndex) in task.oj_problems" :key="problemIndex" class="selected-item">
                  <div class="item-info">
                    <span class="item-id">ID: {{ problem.problem_id }}</span>
                    <span v-if="problem.problem_title" class="item-name">{{ problem.problem_title }}</span>
                    <span v-if="problem.problem_level" class="item-tag">{{ problem.problem_level }}级</span>
                  </div>
                  <button @click="removeProblem(index, problemIndex)" class="btn-remove-item">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div v-else class="no-items">
                <span>暂未选择OJ题目</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : (plan ? '保存' : '创建') }}
        </button>
      </div>
    </div>

    <!-- 选择试卷弹窗 -->
    <ExamSelectorDialog
      v-if="showExamSelectorDialog"
      @close="showExamSelectorDialog = false"
      @select="handleExamSelect"
    />

    <!-- 选择OJ题目弹窗 -->
    <OJSelectorDialog
      v-if="showOJSelectorDialog"
      @close="showOJSelectorDialog = false"
      @select="handleOJSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import ExamSelectorDialog from './ExamSelectorDialog.vue'
import OJSelectorDialog from './OJSelectorDialog.vue'

const props = defineProps<{
  visible: boolean
  plan?: any
}>()

const emit = defineEmits(['close', 'success'])

import { BASE_URL } from '@/config/api'

const formData = ref({
  name: '',
  description: '',
  level: '1',
  start_time: '',
  end_time: '',
  tasks: [] as any[]
})

const submitting = ref(false)
const showExamSelectorDialog = ref(false)
const showOJSelectorDialog = ref(false)
const currentTaskIndex = ref<number | null>(null)

// 添加任务
function addTask() {
  formData.value.tasks.push({
    name: '',
    description: '',
    review_content: '',
    review_video_url: '',
    start_time: '',
    end_time: '',
    task_order: formData.value.tasks.length + 1,
    exams: [],
    oj_problems: []
  })
}

// 移除任务
function removeTask(index: number) {
  if (confirm('确定要删除这个任务吗？')) {
    formData.value.tasks.splice(index, 1)
    // 更新任务顺序
    formData.value.tasks.forEach((task, i) => {
      task.task_order = i + 1
    })
  }
}

// 显示试卷选择器
function showExamSelector(index: number) {
  currentTaskIndex.value = index
  showExamSelectorDialog.value = true
}

// 显示OJ题目选择器
function showOJSelector(index: number) {
  currentTaskIndex.value = index
  showOJSelectorDialog.value = true
}

// 处理试卷选择
function handleExamSelect(examIds: number[]) {
  if (currentTaskIndex.value !== null) {
    const task = formData.value.tasks[currentTaskIndex.value]
    if (!task.exams) task.exams = []
    
    examIds.forEach((examId, index) => {
      if (!task.exams.find((e: any) => e.exam_id === examId)) {
        task.exams.push({
          exam_id: examId,
          exam_order: task.exams.length + index + 1
        })
      }
    })
  }
  showExamSelectorDialog.value = false
}

// 处理OJ题目选择
function handleOJSelect(problemIds: number[]) {
  if (currentTaskIndex.value !== null) {
    const task = formData.value.tasks[currentTaskIndex.value]
    if (!task.oj_problems) task.oj_problems = []
    
    problemIds.forEach((problemId, index) => {
      if (!task.oj_problems.find((p: any) => p.problem_id === problemId)) {
        task.oj_problems.push({
          problem_id: problemId,
          problem_order: task.oj_problems.length + index + 1
        })
      }
    })
  }
  showOJSelectorDialog.value = false
}

// 移除试卷
function removeExam(taskIndex: number, examIndex: number) {
  formData.value.tasks[taskIndex].exams.splice(examIndex, 1)
}

// 移除OJ题目
function removeProblem(taskIndex: number, problemIndex: number) {
  formData.value.tasks[taskIndex].oj_problems.splice(problemIndex, 1)
}

// 提交表单
async function handleSubmit() {
  // 验证必填字段
  if (!formData.value.name || !formData.value.description || !formData.value.start_time || !formData.value.end_time) {
    alert('请填写所有必填字段')
    return
  }

  if (formData.value.tasks.length === 0) {
    alert('至少需要添加一个任务')
    return
  }

  // 验证任务
  for (const task of formData.value.tasks) {
    if (!task.name || !task.start_time || !task.end_time) {
      alert('请填写所有任务的必填字段')
      return
    }
  }

  submitting.value = true

  try {
    if (props.plan) {
      // 编辑计划
      await axios.put(`${BASE_URL}/learning-plans/${props.plan.id}`, formData.value)
      alert('学习计划更新成功')
    } else {
      // 创建计划
      await axios.post(`${BASE_URL}/learning-plans`, formData.value)
      alert('学习计划创建成功')
    }
    emit('success')
  } catch (error: any) {
    console.error('提交失败:', error)
    alert('操作失败: ' + (error.response?.data?.error || error.message))
  } finally {
    submitting.value = false
  }
}

// 初始化表单数据
function initFormData() {
  if (props.plan) {
    console.log('🔧 [CreatePlanDialog] 初始化编辑模式，计划数据:', props.plan)
    
    formData.value = {
      name: props.plan.name || '',
      description: props.plan.description || '',
      level: String(props.plan.level || '1'),
      start_time: formatDateTimeForInput(props.plan.start_time),
      end_time: formatDateTimeForInput(props.plan.end_time),
      // 确保每个任务都有正确的 exams 和 oj_problems 数组
      tasks: (props.plan.tasks || []).map((task: any) => ({
        name: task.name || '',
        description: task.description || '',
        review_content: task.review_content || '',
        review_video_url: task.review_video_url || '',
        start_time: formatDateTimeForInput(task.start_time),
        end_time: formatDateTimeForInput(task.end_time),
        task_order: task.task_order || 0,
        exams: task.exams || [],
        oj_problems: task.oj_problems || []
      }))
    }
    
    console.log('✅ [CreatePlanDialog] 初始化完成，任务数量:', formData.value.tasks.length)
    formData.value.tasks.forEach((task, index) => {
      console.log(`📋 [CreatePlanDialog] 任务 ${index + 1}:`, {
        name: task.name,
        exams: task.exams.length,
        oj_problems: task.oj_problems.length
      })
    })
  } else {
    console.log('🆕 [CreatePlanDialog] 初始化创建模式')
    formData.value = {
      name: '',
      description: '',
      level: '1',
      start_time: '',
      end_time: '',
      tasks: []
    }
  }
}

// 格式化日期时间为输入框格式
function formatDateTimeForInput(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    initFormData()
  }
})

onMounted(() => {
  if (props.visible) {
    initFormData()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.form-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.form-section h4 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 600;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title-row h4 {
  margin: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.btn-add-task {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add-task:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
}

.empty-tasks {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: white;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.task-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin-bottom: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.task-header h5 {
  margin: 0;
  color: #1e90ff;
  font-size: 1.1rem;
  font-weight: 700;
}

.btn-remove-task {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove-task:hover {
  background: #dc2626;
}

.exercise-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.exercise-header label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.btn-select {
  background: #1e90ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-select:hover {
  background: #0c7cd5;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #1e90ff;
  border-radius: 8px;
  font-size: 12px;
  min-width: 250px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.item-id {
  color: #1e90ff;
  font-weight: 700;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-name {
  color: #1e293b;
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-tag {
  background: #fef3c7;
  color: #d97706;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.item-detail {
  color: #64748b;
  font-size: 11px;
}

.no-items {
  padding: 12px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 6px;
}

.btn-remove-item {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-remove-item:hover {
  color: #dc2626;
  transform: scale(1.2);
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
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
  transform: translateY(-2px);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

