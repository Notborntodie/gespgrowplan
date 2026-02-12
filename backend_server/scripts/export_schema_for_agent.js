/**
 * 从当前数据库导出表结构，生成 schema_for_agent.txt 供 AI 管理 Agent 生成 SQL 使用。
 * 运行：在 backend_server 目录下执行 node scripts/export_schema_for_agent.js
 * 依赖：.env 中配置好 DB_*，与主应用使用同一数据库。
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

const OUT_FILE = path.join(__dirname, '..', 'database', 'schema_for_agent.txt');

async function exportSchema() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT TABLE_NAME AS tbl, COLUMN_NAME AS col, DATA_TYPE AS dtype, IS_NULLABLE AS nullable, COLUMN_KEY AS \`key\`
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    const byTable = new Map();
    for (const r of rows) {
      const t = r.tbl;
      if (!byTable.has(t)) byTable.set(t, []);
      const key = r.key === 'PRI' ? ' (主键)' : '';
      const nullTag = r.nullable === 'YES' ? '' : ' 非空';
      byTable.get(t).push(`${r.col} ${r.dtype}${nullTag}${key}`);
    }

    const lines = [
      '# 当前数据库表结构（由 export_schema_for_agent.js 从 information_schema 生成，供 Agent 生成 SQL 使用）',
      `# 生成时间: ${new Date().toISOString()}`,
      '# 仅包含表名与列（类型、是否非空、是否主键），便于 LLM 生成正确 SELECT。',
      ''
    ];

    for (const [table, cols] of byTable.entries()) {
      lines.push(`表 ${table}:`);
      cols.forEach((c) => lines.push(`  - ${c}`));
      lines.push('');
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
    console.log('已写入:', OUT_FILE);
    console.log('表数量:', byTable.size);
  } finally {
    connection.release();
    await pool.end();
  }
}

exportSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
