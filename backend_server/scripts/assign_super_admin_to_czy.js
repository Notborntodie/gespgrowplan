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

async function assignSuperAdminToCzy() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 1. 查找用户"czy"
    console.log('正在查找用户"czy"...');
    const [users] = await connection.query(
      'SELECT id, username, email FROM users WHERE username = ?',
      ['czy']
    );
    
    if (users.length === 0) {
      console.error('错误: 未找到用户"czy"');
      await connection.end();
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`✓ 找到用户: ${user.username} (ID: ${user.id})`);
    
    // 2. 查找超级管理员角色
    console.log('\n正在查找超级管理员角色...');
    const [roles] = await connection.query(
      'SELECT id, name, display_name FROM roles WHERE name = ?',
      ['super_admin']
    );
    
    if (roles.length === 0) {
      console.error('错误: 未找到超级管理员角色');
      await connection.end();
      process.exit(1);
    }
    
    const role = roles[0];
    console.log(`✓ 找到角色: ${role.display_name} (ID: ${role.id})`);
    
    // 3. 检查是否已经分配了该角色
    console.log('\n正在检查是否已分配该角色...');
    const [existing] = await connection.query(
      'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
      [user.id, role.id]
    );
    
    if (existing.length > 0) {
      console.log(`✓ 用户"${user.username}"已经拥有超级管理员角色`);
      await connection.end();
      return;
    }
    
    // 4. 分配角色
    console.log('\n正在分配超级管理员角色...');
    await connection.query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by, created_at) VALUES (?, ?, NULL, NOW())',
      [user.id, role.id]
    );
    
    console.log(`✓ 成功为用户"${user.username}"分配超级管理员角色！`);
    console.log(`  用户ID: ${user.id}`);
    console.log(`  角色ID: ${role.id}`);
    console.log(`  角色名称: ${role.display_name}`);
    
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
assignSuperAdminToCzy();


