<template>
  <div class="register-container">
    <div class="register-card">
      <!-- 系统标题 -->
      <div class="system-title">GESP 练习系统</div>
      <div class="register-header">
        <h2>用户注册</h2>
      </div>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            placeholder="请输入用户名"
            required
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            required
            autocomplete="new-password"
          />
        </div>
        <button class="register-btn" type="submit" :disabled="loading">
          <span v-if="loading">注册中...</span>
          <span v-else>注册</span>
        </button>
        <div v-if="error" class="error-msg">
          {{ error }}
        </div>
      </form>
      <div class="register-footer">
        <router-link to="/login">
          已有账号？去登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok) {
      alert('注册成功，请登录')
      router.push('/login')
    } else {
      error.value = data.message || '注册失败'
    }
  } catch (e) {
    error.value = '无法连接服务器'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3e7fa 0%, #e3eeff 100%);
  overflow: auto;
}

.register-card {
  background: #fff;
  padding: 40px 32px 32px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(94, 53, 177, 0.12);
  width: 370px;
  min-width: 320px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.system-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #5e35b1;
  letter-spacing: 2px;
  margin-bottom: 18px;
  text-align: center;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

h2 {
  font-weight: 700;
  color: #4527a0;
  margin: 0;
}

.register-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 500;
  color: #5e35b1;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

input {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  transition: border 0.2s;
  font-family: inherit;
}

input:focus {
  border-color: #5e35b1;
  outline: none;
}

.register-btn {
  background: linear-gradient(90deg, #5e35b1, #7e57c2);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(94, 53, 177, 0.08);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #f44336;
  background: #fff3f3;
  border: 1px solid #f44336;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 0.98rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.register-footer {
  margin-top: 18px;
  width: 100%;
  text-align: center;
}

.register-footer a {
  color: #5e35b1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.register-footer a:hover {
  color: #ff5722;
}

@media (max-width: 400px) {
  .register-card {
    width: 98vw;
    min-width: unset;
    padding: 24px 4vw 24px 4vw;
  }
}


.system-title {
  font-size: 2.35rem;
  font-weight: 700;
  color: #5e35b1;
  letter-spacing: 2px;
  margin-bottom: 18px;
  text-align: center;
}
</style>