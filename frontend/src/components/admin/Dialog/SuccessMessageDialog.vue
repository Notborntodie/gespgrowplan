<template>
  <div v-if="visible" class="success-overlay" @click="handleClose">
    <div class="success-container" @click.stop>
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="url(#gradient)" />
          <path d="M20 28.5L16 24.5L14.5 26L20 31.5L34 17.5L32.5 16L20 28.5Z" fill="white" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1e90ff;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#87ceeb;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="success-content">
        <h3 class="success-title">操作成功</h3>
        <p class="success-message">{{ message }}</p>
      </div>
      <button @click="handleClose" class="success-btn">确定</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.success-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.success-container {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px -4px rgba(30,144,255,0.15), 0 2px 8px 0 rgba(0,0,0,0.05);
  animation: successSlideIn 0.3s ease-out;
  position: relative;
  border: 2px solid #1e90ff;
  text-align: center;
}

@keyframes successSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(-20px);}
  to { opacity: 1; transform: scale(1) translateY(0);}
}

.success-icon {
  margin-bottom: 16px;
  animation: successIconAppear 0.6s ease-out;
  display: flex;
  justify-content: center;
}

.success-icon svg {
  filter: drop-shadow(0 4px 8px rgba(30, 144, 255, 0.3));
}

@keyframes successIconAppear {
  0% { 
    opacity: 0; 
    transform: scale(0.5) rotate(-180deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.1) rotate(0deg); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) rotate(0deg); 
  }
}

.success-content {
  margin-bottom: 24px;
}

.success-title {
  margin: 0 0 8px 0;
  color: #1e90ff;
  font-size: 20px;
  font-weight: 600;
}

.success-message {
  margin: 0;
  color: #374151;
  font-size: 16px;
  line-height: 1.5;
}

.success-btn {
  background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
}

.success-btn:hover {
  background: linear-gradient(135deg, #1976d2 0%, #5ba3d1 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
}
</style> 