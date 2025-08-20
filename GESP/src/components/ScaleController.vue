<template>
  <div class="scale-controller">
    <button @click="toggleScale" class="scale-btn">
      {{ isEnabled ? '关闭缩放' : '开启缩放' }}
    </button>
    <div class="scale-info">
      当前缩放: {{ currentScale.toFixed(2) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

const scaler = inject('scaler') as any
const isEnabled = ref(true)
const currentScale = ref(1)

onMounted(() => {
  if (scaler) {
    isEnabled.value = scaler.isEnabled()
    currentScale.value = scaler.getScale()
    
    // 监听缩放变化
    setInterval(() => {
      currentScale.value = scaler.getScale()
    }, 100)
  }
})

const toggleScale = () => {
  if (scaler) {
    scaler.toggleScale()
    isEnabled.value = scaler.isEnabled()
  }
}
</script>

<style scoped>
.scale-controller {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
}

.scale-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 5px;
}

.scale-btn:hover {
  background: #4f46e5;
}

.scale-info {
  font-size: 11px;
  opacity: 0.8;
}
</style> 