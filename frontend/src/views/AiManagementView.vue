<template>
  <div class="ai-management-page">
    <div class="chat-container">
      <div class="chat-header">
        <h2>AI 管理</h2>
        <p class="chat-desc">多轮对话查询数据，直到获得满意结果</p>
      </div>

      <div class="messages-area" ref="messagesEl">
        <div v-if="messages.length === 0 && !loading" class="welcome-hint">
          输入您想查询的问题，例如：GESP1 级某个任务全部学员的完成情况
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['message-row', msg.role]"
        >
          <div class="message-bubble">
            <div class="message-text">{{ msg.content }}</div>
            <div v-if="msg.steps && msg.steps.length" class="react-trace">
              <div class="react-trace-title">ReAct 思考与执行过程</div>
              <div v-for="(s, i) in msg.steps" :key="i" class="react-step">
                <div class="step-label">步骤 {{ i + 1 }}</div>
                <div v-if="s.thought" class="step-block">
                  <span class="step-tag">Thought</span>
                  <pre class="step-content">{{ s.thought }}</pre>
                </div>
                <div class="step-block">
                  <span class="step-tag">Action</span>
                  <pre class="step-content">{{ s.action }}</pre>
                </div>
                <div v-if="s.args && Object.keys(s.args).length" class="step-block">
                  <span class="step-tag">Args</span>
                  <pre class="step-content">{{ formatArgs(s.args) }}</pre>
                </div>
                <div v-if="s.observation != null" class="step-block">
                  <span class="step-tag">Observation</span>
                  <pre class="step-content">{{ s.observation }}</pre>
                </div>
              </div>
            </div>
            <div v-if="msg.result && msg.result.columns && msg.result.rows" class="message-result">
              <div class="result-actions">
                <span v-if="msg.result.truncated" class="truncated-hint">仅显示前 {{ msg.result.rows.length }} 条</span>
                <button type="button" class="btn-export" @click="exportCsv(msg.result, idx)">导出 CSV</button>
              </div>
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th v-for="col in msg.result.columns" :key="col">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in msg.result.rows" :key="i">
                      <td v-for="col in msg.result.columns" :key="col">{{ formatCell(row[col]) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading" class="message-row assistant">
          <div class="message-bubble loading-bubble">
            <div class="loading-spinner small"></div>
            <span>正在处理...</span>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-bar">{{ error }}</div>

      <div class="input-row">
        <textarea
          v-model="inputText"
          class="message-input"
          placeholder="输入消息..."
          rows="2"
          @keydown.enter.exact.prevent="send"
        />
        <button
          type="button"
          class="btn-send"
          :disabled="loading || !inputText.trim()"
          @click="send"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { BASE_URL } from '@/config/api'

interface ReactStep {
  thought: string
  action: string
  args: Record<string, unknown>
  observation: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  result?: { columns: string[]; rows: Record<string, unknown>[]; truncated?: boolean }
  result_type?: 'table' | 'page'
  steps?: ReactStep[]
}

const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const sessionId = ref<string | null>(null)
const userInfo = ref<{ id: number } | null>(null)
const messagesEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const raw = localStorage.getItem('userInfo')
  if (raw) {
    try {
      userInfo.value = JSON.parse(raw)
    } catch {
      userInfo.value = null
    }
  }
})

function formatCell(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function formatArgs(args: Record<string, unknown>): string {
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}

async function send() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  if (!userInfo.value?.id) {
    error.value = '请先登录'
    return
  }
  error.value = ''
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  try {
    const res = await axios.post(
      `${BASE_URL}/admin/agent/message`,
      {
        session_id: sessionId.value || undefined,
        user_message: text,
        admin_user_id: userInfo.value.id
      },
      { timeout: 90000 }
    )
    if (res.data && res.data.success) {
      if (res.data.session_id) sessionId.value = res.data.session_id
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.message || ''
      }
      if (res.data.steps && res.data.steps.length) {
        assistantMsg.steps = res.data.steps
      }
      if (res.data.result && res.data.result.columns && res.data.result.rows) {
        const cols = res.data.result.columns as string[]
        const rawRows = res.data.result.rows as Record<string, unknown>[]
        assistantMsg.result = {
          columns: [...cols],
          rows: rawRows.map((row) => {
            const plain: Record<string, unknown> = {}
            cols.forEach((c, i) => {
              plain[c] = row[c] !== undefined ? row[c] : (Array.isArray(row) ? (row as unknown[])[i] : row[c])
            })
            return plain
          }),
          truncated: res.data.result.truncated
        }
        assistantMsg.result_type = res.data.result_type === 'page' ? 'page' : 'table'
      }
      messages.value.push(assistantMsg)
    } else {
      error.value = res.data?.message || '请求失败'
      if (res.data?.steps?.length) {
        messages.value.push({
          role: 'assistant',
          content: res.data.message || '请求失败',
          steps: res.data.steps
        })
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; steps?: ReactStep[] } }; message?: string }
    error.value = err.response?.data?.message || err.message || '网络或服务错误'
    if (err.response?.data?.steps?.length) {
      messages.value.push({
        role: 'assistant',
        content: err.response?.data?.message || '网络或服务错误',
        steps: err.response.data.steps
      })
    }
  } finally {
    loading.value = false
    await nextTick()
    messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
  }
}

function exportCsv(result: { columns: string[]; rows: Record<string, unknown>[] } | undefined, messageIndex?: number) {
  const data = messageIndex != null && messages.value[messageIndex]?.result
    ? messages.value[messageIndex].result
    : result
  if (!data || !data.columns) return
  const cols = Array.isArray(data.columns) ? [...data.columns] : []
  const rows = Array.isArray(data.rows) ? data.rows : []
  const lines: string[] = ['\uFEFF' + cols.join(',')]
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row == null || typeof row !== 'object') continue
    const cells = cols.map((c, idx) => {
      const val = (row as Record<string, unknown>)[c] !== undefined
        ? (row as Record<string, unknown>)[c]
        : (Array.isArray(row) ? (row as unknown[])[idx] : (row as Record<string, unknown>)[c])
      return String(val ?? '').replace(/,/g, '，').replace(/\n/g, ' ')
    })
    lines.push(cells.join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-management-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.ai-management-page {
  min-height: calc(100vh - 48px);
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%);
}

.chat-container {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.chat-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.chat-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.chat-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  min-height: 280px;
}

.welcome-hint {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 32px 16px;
}

.message-row {
  margin-bottom: 16px;
}

.message-row.user .message-bubble {
  margin-left: 0;
  margin-right: 24px;
  background: #eff6ff;
  color: #1e40af;
}

.message-row.assistant .message-bubble {
  margin-left: 24px;
  margin-right: 0;
  background: #f1f5f9;
  color: #334155;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.message-bubble.loading-bubble {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin: 0;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.react-trace {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

.react-trace-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 10px;
}

.react-step {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #94a3b8;
}

.step-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
}

.step-block {
  margin-top: 6px;
}

.step-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-right: 8px;
  min-width: 72px;
}

.step-content {
  display: inline;
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.message-result {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.truncated-hint {
  font-size: 12px;
  color: #64748b;
}

.btn-export {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.btn-export:hover {
  background: #f1f5f9;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.error-bar {
  padding: 10px 24px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.input-row {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
}

.message-input:focus {
  outline: none;
  border-color: #1e90ff;
}

.btn-send {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  background: #1e90ff;
  color: #fff;
  cursor: pointer;
}

.btn-send:hover:not(:disabled) {
  background: #1a7fe6;
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner {
  border: 2px solid #e2e8f0;
  border-top-color: #1e90ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
