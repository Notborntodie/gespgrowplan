/**
 * 测试 AI 管理 ReAct 相关接口
 * 1. Al_server: POST /api/admin/agent/next-action
 * 2. Node: POST /api/admin/agent/message
 * 需要：Al_server 运行在 8000，Node 运行在 3000，.env 已配置，数据库有管理员用户
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const { pool } = require('../config/database');

const AL_SERVER = process.env.AL_SERVER_URL || 'http://127.0.0.1:8000';
const NODE_API = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';

async function getAdminUserId() {
  const [rows] = await pool.execute(
    `SELECT u.id FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     JOIN roles r ON ur.role_id = r.id
     WHERE r.name IN ('admin', 'super_admin') LIMIT 1`
  );
  return rows[0] ? rows[0].id : null;
}

async function testNextAction() {
  console.log('\n--- 1. 测试 Al_server next-action ---');
  try {
    const res = await axios.post(
      `${AL_SERVER}/api/admin/agent/next-action`,
      {
        system_prompt: '你是数据查询助手。',
        context: '表结构：learning_plans(id, name, level)\n\nUser: 有多少个学习计划？'
      },
      { timeout: 25000, headers: { 'Content-Type': 'application/json' } }
    );
    console.log('状态:', res.status);
    console.log('返回:', JSON.stringify(res.data, null, 2));
    if (res.data && res.data.action && res.data.thought !== undefined) {
      console.log('OK: next-action 返回 thought + action + args');
      return true;
    }
    console.log('WARN: 返回格式可能不完整');
    return false;
  } catch (e) {
    console.log('失败:', e.message);
    if (e.response) console.log('响应:', e.response.status, e.response.data);
    return false;
  }
}

async function testAgentMessage(adminUserId) {
  console.log('\n--- 2. 测试 Node agent/message ---');
  try {
    const res = await axios.post(
      `${NODE_API}/admin/agent/message`,
      {
        user_message: '当前有多少个学习计划？',
        admin_user_id: adminUserId
      },
      { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
    );
    console.log('状态:', res.status);
    console.log('返回 keys:', Object.keys(res.data || {}));
    if (res.data && res.data.success) {
      console.log('session_id:', res.data.session_id);
      console.log('message:', (res.data.message || '').slice(0, 200));
      if (res.data.result) console.log('result 行数:', res.data.result.rows?.length ?? 0);
      console.log('OK: agent/message 成功');
      return true;
    }
    console.log('响应:', res.data);
    return false;
  } catch (e) {
    console.log('失败:', e.message);
    if (e.response) console.log('响应:', e.response.status, e.response.data);
    return false;
  }
}

async function main() {
  console.log('Al_server:', AL_SERVER);
  console.log('Node API:', NODE_API);

  let adminId = null;
  try {
    adminId = await getAdminUserId();
    console.log('管理员用户 ID:', adminId || '未找到');
  } catch (e) {
    console.log('获取管理员失败:', e.message);
  }

  const r1 = await testNextAction();
  const r2 = adminId ? await testAgentMessage(adminId) : (console.log('跳过 agent/message（无管理员）'), false);

  console.log('\n--- 结果 ---');
  console.log('next-action:', r1 ? '通过' : '失败');
  console.log('agent/message:', r2 ? '通过' : '失败或跳过');
  process.exit(r1 && (r2 || !adminId) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
