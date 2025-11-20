/**
 * 数据库迁移脚本：添加 is_displayed 字段
 * 运行方式：node scripts/run_migration_add_is_displayed.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    console.log('开始数据库迁移：添加 is_displayed 字段到 oj_samples 表\n');
    
    // 连接数据库（使用项目配置）
    connection = await mysql.createConnection({
      host: '106.14.143.27',
      user: 'gesp_user',
      password: 'Gesp@2025!',
      database: 'gesp_practice_system',
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    console.log('✓ 数据库连接成功\n');
    
    // 检查字段是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'oj_samples' 
        AND COLUMN_NAME = 'is_displayed'
    `, ['gesp_practice_system']);
    
    if (columns.length > 0) {
      console.log('⚠ is_displayed 字段已存在，跳过迁移');
      return;
    }
    
    console.log('添加 is_displayed 字段...');
    await connection.query(`
      ALTER TABLE oj_samples 
      ADD COLUMN is_displayed BOOLEAN DEFAULT TRUE 
      COMMENT '是否在查看题目时展示（true=展示，false=不展示）' 
      AFTER is_hidden
    `);
    console.log('✓ is_displayed 字段添加成功\n');
    
    console.log('更新 is_hidden 字段注释...');
    await connection.query(`
      ALTER TABLE oj_samples 
      MODIFY COLUMN is_hidden BOOLEAN DEFAULT FALSE 
      COMMENT '是否为隐藏测试点（true=提交后不显示详细信息，false=提交后可显示）'
    `);
    console.log('✓ is_hidden 字段注释更新成功\n');
    
    console.log('添加索引以优化查询性能...');
    try {
      await connection.query(`
        ALTER TABLE oj_samples 
        ADD INDEX idx_problem_displayed (problem_id, is_displayed)
      `);
      console.log('✓ 索引添加成功\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ 索引已存在，跳过\n');
      } else {
        throw error;
      }
    }
    
    // 验证修改
    console.log('验证表结构...');
    const [tableDesc] = await connection.query('DESCRIBE oj_samples');
    console.log('\n当前 oj_samples 表结构：');
    console.table(tableDesc);
    
    // 显示现有数据
    const [samples] = await connection.query(`
      SELECT 
        id,
        problem_id,
        is_hidden,
        is_displayed,
        sort_order
      FROM oj_samples
      LIMIT 5
    `);
    
    if (samples.length > 0) {
      console.log('\n示例数据（前5条）：');
      console.table(samples);
    }
    
    console.log('\n✓ 数据库迁移完成！\n');
    console.log('说明：');
    console.log('  - is_hidden: 表示提交后能否展示样例（true=隐藏测试点，提交后不显示详细信息）');
    console.log('  - is_displayed: 表示用户查看题目时是否展示样例（true=查看时显示，false=查看时不显示）');
    
  } catch (error) {
    console.error('\n✗ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行迁移
runMigration();

