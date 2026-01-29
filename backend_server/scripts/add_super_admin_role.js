const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || 'Gesp@2025!',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4'
};

async function addSuperAdminRole() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 检查角色是否已存在
    const [existing] = await connection.query(
      'SELECT id FROM roles WHERE name = ?',
      ['super_admin']
    );
    
    if (existing.length > 0) {
      console.log('超级管理员角色已存在，ID:', existing[0].id);
      await connection.end();
      return;
    }
    
    // 插入超级管理员角色
    console.log('正在插入超级管理员角色...');
    const [result] = await connection.query(
      `INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        'super_admin',
        '超级管理员',
        '拥有系统所有权限的超级管理员角色',
        1  // is_system = 1 表示系统角色
      ]
    );
    
    console.log('✓ 超级管理员角色插入成功！');
    console.log('角色ID:', result.insertId);
    console.log('角色名称: super_admin');
    console.log('显示名称: 超级管理员');
    
    await connection.end();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('错误:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// 执行
addSuperAdminRole();

