<template>
  <div v-if="isVisible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h2>修改密码</h2>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>
      
      <div class="dialog-content">
        <form @submit.prevent="handleSubmit" class="password-form">
          <div class="form-group">
            <label for="oldPassword">当前密码</label>
            <input
              id="oldPassword"
              v-model="formData.oldPassword"
              type="password"
              placeholder="请输入当前密码"
              required
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              required
              :disabled="loading"
              @input="validatePassword"
            />
            <div v-if="passwordError" class="error-text">
              {{ passwordError }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              required
              :disabled="loading"
              @input="validateConfirmPassword"
            />
            <div v-if="confirmPasswordError" class="error-text">
              {{ confirmPasswordError }}
            </div>
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeDialog" class="btn btn-secondary" :disabled="loading">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading || !isFormValid">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 成功消息对话框 -->
    <SuccessMessageDialog
      :visible="showSuccessDialog"
      :message="successMessage"
      @close="handleSuccessDialogClose"
    />
  </div>
</template>

<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, computed, watch } from 'vue'
import axios from 'axios'
import SuccessMessageDialog from '../admin/Dialog/SuccessMessageDialog.vue'

// Props
const props = defineProps<{
  isVisible: boolean
  userId: number
}>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// 响应式数据
const loading = ref(false)
const error = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const showSuccessDialog = ref(false)
const successMessage = ref('')

const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 计算属性
const isFormValid = computed(() => {
  return formData.value.oldPassword && 
         formData.value.newPassword && 
         formData.value.confirmPassword &&
         !passwordError.value &&
         !confirmPasswordError.value
})

// 监听对话框显示状态，重置表单
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

// 重置表单
const resetForm = () => {
  formData.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  error.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  showSuccessDialog.value = false
  successMessage.value = ''
}

// 验证新密码
const validatePassword = () => {
  const password = formData.value.newPassword
  if (password && password.length < 6) {
    passwordError.value = '密码长度不能少于6位'
  } else {
    passwordError.value = ''
  }
  
  // 如果确认密码已输入，重新验证确认密码
  if (formData.value.confirmPassword) {
    validateConfirmPassword()
  }
}

// 验证确认密码
const validateConfirmPassword = () => {
  const password = formData.value.newPassword
  const confirmPassword = formData.value.confirmPassword
  
  if (confirmPassword && password !== confirmPassword) {
    confirmPasswordError.value = '两次输入的密码不一致'
  } else {
    confirmPasswordError.value = ''
  }
}

// 关闭对话框
const closeDialog = () => {
  emit('close')
}

// 处理成功对话框关闭
const handleSuccessDialogClose = () => {
  showSuccessDialog.value = false
  emit('success')
  closeDialog()
}

// 提交表单
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.put(`${BASE_URL}/users/${props.userId}/password`, {
      old_password: formData.value.oldPassword,
      new_password: formData.value.newPassword
    })
    
    if (response.data.message === '密码修改成功') {
      // 显示成功对话框
      successMessage.value = '密码修改成功！'
      showSuccessDialog.value = true
    }
  } catch (err: any) {
    console.error('修改密码失败:', err)
    
    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else if (err.response?.status === 400) {
      error.value = '请求参数错误，请检查输入'
    } else if (err.response?.status === 500) {
      error.value = '服务器错误，请稍后重试'
    } else {
      error.value = '网络错误，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
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
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
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
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.dialog-content {
  padding: 30px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #fafafa;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 4px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 10px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .dialog-container {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-header {
    padding: 20px 24px;
  }
  
  .dialog-content {
    padding: 24px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
