const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const { logger } = require('../config/logger');

const AL_SERVER_BASE = process.env.AL_SERVER_URL || 'http://localhost:8000';
const QUERY_TIMEOUT_MS = 10000;
const MAX_ROWS = 5000;
const MAX_REACT_STEPS = 10;
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema_for_agent.txt');

const sessionStore = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000;

function getSchemaHint(tableName) {
  try {
    const content = fs.readFileSync(SCHEMA_FILE, 'utf8');
    let text = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n')
      .trim();
    if (tableName && tableName.trim()) {
      const lower = tableName.trim().toLowerCase();
      const lines = text.split('\n').filter((l) => l.includes('表 ') && l.toLowerCase().includes(lower));
      text = lines.length ? lines.join('\n') : text;
    }
    return text || '表结构见 schema_for_agent.txt。';
  } catch {
    return '学习计划相关表: learning_plans, learning_tasks, user_learning_plans, user_task_progress, users 等。';
  }
}

function isAllowedSql(sql) {
  const s = (sql || '').trim();
  if (!s) return false;
  const upper = s.toUpperCase();
  if (!upper.startsWith('SELECT')) return false;
  const withoutTrailing = s.replace(/;\s*$/, '');
  if (withoutTrailing.includes(';')) return false;
  if (/\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b/i.test(s)) return false;
  return true;
}

const SYSTEM_PROMPT = `你是管理后台的「数据查询助手」，通过多轮对话帮管理员从数据库中查到满意结果。

你可以使用的动作（每次只输出一个）：
1. think - 内部推理，args: { "reasoning": "字符串" }
2. execute_sql - 执行只读 SELECT，args: { "sql": "单条 SELECT 语句" }
3. query_schema - 查看表结构，args: { "table_name": "可选，表名" }
4. ask_user - 向用户提问并结束本轮，args: { "message": "字符串" }
5. present_result - 向用户展示结果并结束本轮，args: { "message": "必填", "result": 可选 { "columns": [], "rows": [] }, "result_type": 可选 "table"|"page" }

规则：只生成单条 SELECT；禁止写操作与多语句。信息不足时用 ask_user 确认。有结果时用 present_result。`;

async function ensureAdmin(connection, userId) {
  if (!userId) return false;
  const [rows] = await connection.execute(
    `SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ? AND r.name IN ('admin', 'super_admin')`,
    [userId]
  );
  return rows.length > 0;
}

const NEXT_ACTION_TIMEOUT_MS = 60000; // 与前端 90s 留余量，LLM 可能较慢

async function callNextAction(systemPrompt, context) {
  const res = await axios.post(
    `${AL_SERVER_BASE}/api/admin/agent/next-action`,
    { system_prompt: systemPrompt, context },
    { timeout: NEXT_ACTION_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

async function executeSql(sql) {
  const connection = await pool.getConnection();
  try {
    if (!isAllowedSql(sql)) return { ok: false, observation: '仅允许单条 SELECT 语句。' };
    const runQuery = () => connection.execute(sql);
    const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('查询超时')), QUERY_TIMEOUT_MS));
    const [rows, fields] = await Promise.race([runQuery(), timeoutPromise]);
    const columns = (fields || []).map((f) => f.name);
    let resultRows = Array.isArray(rows) ? rows : [];
    const truncated = resultRows.length > MAX_ROWS;
    if (truncated) resultRows = resultRows.slice(0, MAX_ROWS);
    // 转为纯对象并用 columns 顺序取值，保证前端/CSV 导出列顺序与键一致
    const plainRows = resultRows.map((r) => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = r[col] !== undefined ? r[col] : (Array.isArray(r) ? r[i] : r[col]);
      });
      return obj;
    });
    const summary = resultRows.length > 0
      ? `执行成功。共 ${rows.length} 行${truncated ? `（已截断至${MAX_ROWS}行）` : ''}。列: ${columns.join(', ')}。前3行: ${JSON.stringify(plainRows.slice(0, 3))}`
      : '执行成功。共 0 行。';
    return { ok: true, observation: summary, columns, rows: plainRows, truncated };
  } catch (err) {
    const msg = err.sqlMessage || err.message || '执行失败';
    return { ok: false, observation: `执行失败。错误: ${msg}` };
  } finally {
    connection.release();
  }
}

function appendBlock(context, thought, action, args, observation) {
  const argsStr = typeof args === 'object' && args !== null ? JSON.stringify(args, null, 0) : String(args || '');
  let out = context + `\n\nThought: ${thought}\nAction: ${action}\nArgs: ${argsStr}`;
  if (observation !== undefined && observation !== null) out += `\nObservation: ${observation}`;
  return out;
}

router.post('/admin/agent/message', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { session_id: sessionId, user_message: userMessage, admin_user_id: adminUserId } = req.body || {};
    const message = (userMessage && typeof userMessage === 'string') ? userMessage.trim() : '';
    if (!message) {
      return res.status(400).json({ success: false, message: '缺少 user_message' });
    }
    const userId = adminUserId != null ? parseInt(adminUserId, 10) : null;
    const isAdmin = await ensureAdmin(connection, userId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: '仅管理员可调用' });
    }

    const schemaHint = getSchemaHint();
    let sid = sessionId && typeof sessionId === 'string' ? sessionId.trim() : null;
    let context;

    if (!sid) {
      sid = randomUUID();
      context = `表结构摘要：\n${schemaHint}\n\nUser: ${message}`;
    } else {
      const entry = sessionStore.get(sid);
      if (!entry) {
        context = `表结构摘要：\n${schemaHint}\n\nUser: ${message}`;
      } else {
        context = entry.context + `\n\nUser: ${message}`;
      }
    }

    sessionStore.set(sid, { context, updatedAt: Date.now() });

    logger.info('agent/message 请求', {
      session_id: sid,
      user_message: message,
      context_length: context.length
    });

    const steps = [];
    let lastResult = null;
    for (let step = 0; step < MAX_REACT_STEPS; step++) {
      let nextResp;
      try {
        nextResp = await callNextAction(SYSTEM_PROMPT, context);
      } catch (err) {
        const code = err.code || '';
        const status = err.response?.status;
        const body = err.response?.data;
        logger.warn('agent next-action 调用失败', {
          error: err.message,
          code,
          status,
          url: AL_SERVER_BASE,
          response_body: body
        });
        const detail = code === 'ECONNREFUSED' ? 'AI 服务未启动或不可达'
          : code === 'ETIMEDOUT' || code === 'ECONNABORTED' ? 'AI 服务响应超时'
          : status === 400 && body?.error ? `AI 服务 400: ${body.error}`
          : status ? `AI 服务返回 ${status}` : err.message || '未知错误';
        return res.status(502).json({
          success: false,
          message: `AI 服务不可用：${detail}`,
          session_id: sid,
          steps
        });
      }

      const { thought = '', action = '', args = {} } = nextResp;
      const act = String(action).toLowerCase();

      context = appendBlock(context, thought, action, args, null);

      if (act === 'ask_user') {
        const msg = args.message != null ? String(args.message) : '请补充说明您的需求。';
        sessionStore.set(sid, { context, updatedAt: Date.now() });
        steps.push({ thought, action: act, args, observation: null });
        return res.json({ success: true, session_id: sid, message: msg, steps });
      }

      if (act === 'present_result') {
        const msg = args.message != null ? String(args.message) : '查询结果如下。';
        const resultType = args.result_type === 'page' ? 'page' : 'table';
        sessionStore.set(sid, { context, updatedAt: Date.now() });
        const payload = { success: true, session_id: sid, message: msg, steps };
        // 优先用本轮 execute_sql 的完整结果（lastResult），LLM 的 args.result 只含 Observation 里的“前3行”，会丢数据
        const result =
          lastResult && Array.isArray(lastResult.rows) && lastResult.rows.length > 0
            ? { columns: lastResult.columns, rows: lastResult.rows, truncated: lastResult.truncated }
            : args.result && typeof args.result === 'object' && Array.isArray(args.result?.rows)
              ? { columns: args.result.columns, rows: args.result.rows, truncated: args.result.truncated }
              : null;
        if (result && Array.isArray(result.columns) && Array.isArray(result.rows)) {
          payload.result = { columns: result.columns, rows: result.rows, truncated: result.truncated };
          payload.result_type = resultType;
        }
        return res.json(payload);
      }

      let observation;
      if (act === 'think') {
        observation = '[已记录]';
      } else if (act === 'query_schema') {
        const tableName = args.table_name;
        observation = getSchemaHint(tableName);
      } else if (act === 'execute_sql') {
        const sql = args.sql;
        const run = await executeSql(sql);
        observation = run.observation;
        if (run.ok && run.columns && run.rows) lastResult = { columns: run.columns, rows: run.rows, truncated: run.truncated };
      } else {
        observation = '未知动作，请使用 think / execute_sql / query_schema / ask_user / present_result 之一。';
      }

      steps.push({ thought, action: act, args, observation });
      context = context + `\nObservation: ${observation}`;
      sessionStore.set(sid, { context, updatedAt: Date.now() });
    }

    sessionStore.set(sid, { context, updatedAt: Date.now() });
    return res.json({
      success: true,
      session_id: sid,
      message: '步骤过多，请简化需求后重试。',
      steps,
      ...(lastResult && { result: lastResult, result_type: 'table' })
    });
  } catch (err) {
    logger.error('agent/message 错误', { error: err.message });
    res.status(500).json({ success: false, message: err.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessionStore.entries()) {
    if (now - entry.updatedAt > SESSION_TTL_MS) sessionStore.delete(id);
  }
}, 60000);

module.exports = router;
