<template>
  <div class="exam-layout">
    <div class="exam-content exam-content-flex-row">
      <div class="sidebar-placeholder-left"></div>

      <div class="question-main">
        <div class="question-card">
          <div class="question-card-header">
            <div class="header-left-section">
              <button class="back-btn-header" @click="goBack">&lt;- 返回</button>
            </div>
            <div class="header-center-section">
              <span class="number-badge">学习总结（费恩曼学习法）</span>
            </div>
            <div class="header-right-section">
              <span class="level-badge" v-if="levelText">GESP {{ levelText }}</span>
            </div>
          </div>

          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">

              <div class="content-section">
                <div class="section-header">
                  <h4 class="section-title">📘 方法简介</h4>
                </div>
                <div class="section-content">
                  <div class="feynman-intro">
                    <p><strong>费恩曼学习法</strong>强调：把刚学到的知识用自己的话“讲给一个零基础的听众”。在讲解中暴露理解漏洞，再补齐并迭代表达，最终形成扎实掌握。</p>
                    <ul>
                      <li><strong>用自己的话解释</strong>：假设你的听众是同学或家人，避免专业术语。</li>
                      <li><strong>发现卡点</strong>：哪里解释不顺畅，哪里就是需要补课的地方。</li>
                      <li><strong>回顾并简化</strong>：把复杂的概念拆小、举例子、做类比。</li>
                    </ul>
                    <p>建议录制 <strong>3-5 分钟</strong> 的视频总结，覆盖：本任务要点、你的理解过程、常见错误与如何避免。</p>
                  </div>
                </div>
              </div>

              <div class="content-section">
                <div class="section-header">
                  <h4 class="section-title">🎥 开始录制</h4>
                </div>
                <div class="section-content">
                  <div class="recorder-panel">
                    <div class="recorder-actions">
                      <button class="rec-btn start" @click="startRecording" :disabled="isRecording">
                        <i class="fas fa-circle"></i> 开始录制
                      </button>
                      <button class="rec-btn stop" @click="stopRecording" :disabled="!isRecording">
                        <i class="fas fa-stop"></i> 停止
                      </button>
                      <span class="record-timer" :class="{ active: isRecording }">{{ formattedDuration }}</span>
                    </div>

                    <div class="recorder-preview" v-if="recordedBlobUrl">
                      <video :src="recordedBlobUrl" controls playsinline class="preview-video"></video>
                      <div class="preview-actions">
                        <a :href="recordedBlobUrl" download="feynman-summary.webm" class="rec-btn download">
                          <i class="fas fa-download"></i> 下载视频
                        </a>
                        <button class="rec-btn danger" @click="clearRecording"><i class="fas fa-trash"></i> 删除</button>
                      </div>
                    </div>

                    <div class="recorder-permission-tip" v-if="permissionError">
                      <span>无法访问摄像头/麦克风：{{ permissionError }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-placeholder-right"></div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const planId = route.query.planId as string | undefined
const taskId = route.query.taskId as string | undefined
const levelText = route.query.level as string | undefined

const goBack = () => {
  if (document.referrer) {
    router.back()
  } else {
    router.push('/plan')
  }
}

// 录制逻辑
const isRecording = ref(false)
const mediaStream = ref<MediaStream | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<BlobPart[]>([])
const recordedBlobUrl = ref<string>('')
const permissionError = ref<string>('')
const recordDurationSeconds = ref(0)
let recordTimer: number | null = null

const formattedDuration = computed(() => {
  const m = String(Math.floor(recordDurationSeconds.value / 60)).padStart(2, '0')
  const s = String(recordDurationSeconds.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

const startRecording = async () => {
  try {
    permissionError.value = ''
    recordedChunks.value = []
    if (!mediaStream.value) {
      mediaStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    }
    const options: MediaRecorderOptions = {}
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) options.mimeType = 'video/webm;codecs=vp9'
    else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) options.mimeType = 'video/webm;codecs=vp8'
    else if (MediaRecorder.isTypeSupported('video/webm')) options.mimeType = 'video/webm'

    mediaRecorder.value = new MediaRecorder(mediaStream.value, options)
    mediaRecorder.value.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) recordedChunks.value.push(e.data)
    }
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, { type: mediaRecorder.value?.mimeType || 'video/webm' })
      if (recordedBlobUrl.value) URL.revokeObjectURL(recordedBlobUrl.value)
      recordedBlobUrl.value = URL.createObjectURL(blob)
    }
    mediaRecorder.value.start()
    isRecording.value = true
    recordDurationSeconds.value = 0
    if (recordTimer) {
      window.clearInterval(recordTimer)
      recordTimer = null
    }
    recordTimer = window.setInterval(() => {
      recordDurationSeconds.value += 1
    }, 1000)
  } catch (err: any) {
    permissionError.value = err?.message || '请检查设备权限'
    isRecording.value = false
  }
}

const stopRecording = () => {
  if (!isRecording.value) return
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
  isRecording.value = false
  if (recordTimer) {
    window.clearInterval(recordTimer)
    recordTimer = null
  }
}

const clearRecording = () => {
  if (recordedBlobUrl.value) URL.revokeObjectURL(recordedBlobUrl.value)
  recordedBlobUrl.value = ''
  recordedChunks.value = []
  recordDurationSeconds.value = 0
}

onUnmounted(() => {
  if (recordTimer) {
    window.clearInterval(recordTimer)
    recordTimer = null
  }
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(t => t.stop())
    mediaStream.value = null
  }
})
</script>

<style scoped>
.exam-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
}
.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0;
}
.sidebar-placeholder-left { width: 50px; flex-shrink: 0; }
.sidebar-placeholder-right { width: 50px; flex-shrink: 0; }
.question-main { flex: 1; max-width: 1600px; min-width: 0; }
.question-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  box-sizing: border-box;
}
.question-card-header {
  background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%);
  padding: 12px 28px;
  border-bottom: 3px solid #e0f2fe;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.header-left-section { display: flex; align-items: center; gap: 12px; min-width: 150px; }
.header-right-section { display: flex; align-items: center; gap: 12px; min-width: 150px; justify-content: flex-end; }
.header-center-section { display: flex; align-items: center; justify-content: center; gap: 12px; flex: 1; }
.number-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 1.1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}
.level-badge {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 8px 14px;
  border-radius: 18px;
  font-weight: 600;
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.back-btn-header {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
}
.back-btn-header:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}
.question-content-unified { flex: 1; display: flex; flex-direction: row; overflow: hidden; background: #f8fafc; }
.question-left-panel { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.question-left-panel-centered { max-width: 1600px; margin: 0 auto; width: 100%; }
.content-section { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 20px; box-shadow: 0 8px 32px rgba(30, 144, 255, 0.12); overflow: visible; border: 2px solid #e0f2fe; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; display: flex; flex-direction: column; min-height: fit-content; }
.section-header { background: linear-gradient(135deg, #1e90ff 0%, #38bdf8 100%); padding: 18px 24px; border-bottom: 2px solid #e0f2fe; border-radius: 18px 18px 0 0; position: relative; }
.section-title { margin: 0; color: white; font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.section-content { padding: 24px; background: transparent; }

.feynman-intro { color: #475569; font-size: 0.95rem; line-height: 1.7; }
.recorder-panel { border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
.recorder-actions { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.rec-btn { padding: 8px 14px; border-radius: 10px; border: 2px solid #bae6fd; background: white; color: #1e90ff; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; }
.rec-btn.start { border-color: #86efac; color: #16a34a; }
.rec-btn.stop { border-color: #fecaca; color: #dc2626; }
.rec-btn.download { border-color: #bae6fd; color: #1e90ff; }
.rec-btn.danger { border-color: #fecaca; color: #dc2626; }
.rec-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(30,144,255,0.15); }
.rec-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.record-timer { margin-left: auto; font-weight: 700; color: #64748b; }
.record-timer.active { color: #dc2626; }
.recorder-preview { margin-top: 8px; }
.preview-video { width: 100%; max-height: 420px; border-radius: 10px; border: 2px solid #e2e8f0; background: #000; }
.preview-actions { margin-top: 10px; display: flex; gap: 10px; }
.recorder-permission-tip { color: #dc2626; font-weight: 600; margin-top: 10px; }

@media (max-width: 768px) {
  .exam-content-flex-row { flex-direction: column; gap: 16px; padding: 0 16px; }
  .sidebar-placeholder-left, .sidebar-placeholder-right { display: none; }
  .question-main { max-width: 100%; }
  .question-card { height: auto; min-height: calc(100vh - 20px); }
}
</style>


