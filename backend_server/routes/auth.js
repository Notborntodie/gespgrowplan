const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { logger } = require('../config/logger');

// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, real_name, role_id = 2 } = req.body; // 默认分配普通用户角色
    
    // 验证必需参数
    if (!username || !password) {
      return res.status(400).json({ 
        error: '缺少必需参数',
        required: ['username', 'password'],
        received: { username: !!username, password: !!password }
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查用户名是否已存在
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (existingUsers.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: '用户名已存在' });
      }
      
      // 检查邮箱是否已存在（如果提供了邮箱）
      if (email) {
        const [existingEmails] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );
        
        if (existingEmails.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: '邮箱已被使用' });
        }
      }
      
      // 验证角色是否存在
      const [roleExists] = await connection.execute(
        'SELECT id, name FROM roles WHERE id = ?',
        [role_id]
      );
      
      if (roleExists.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: '指定的角色不存在' });
      }
      
      // 创建新用户
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, password, email, real_name) VALUES (?, ?, ?, ?)',
        [username, password, email || null, real_name || null]
      );
      
      const userId = userResult.insertId;
      
      // 为用户分配角色
      await connection.execute(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, NULL)',
        [userId, role_id]
      );
      
      await connection.commit();
      connection.release();
      
      res.json({ 
        message: '注册成功',
        user_id: userId,
        role: roleExists[0].name,
        role_id: role_id
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    logger.error('注册错误', { error: error.message, username });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    
    // 查找用户基本信息
    const [users] = await connection.execute(
      'SELECT id, username, email, real_name, created_at FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 获取用户角色信息
    const [roleRows] = await connection.execute(`
      SELECT r.id, r.name, r.display_name, r.description, ur.created_at as assigned_at
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    // 获取用户权限信息
    const [permissionRows] = await connection.execute(`
      SELECT DISTINCT p.id, p.name, p.display_name, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY p.resource, p.action
    `, [user.id]);
    
    connection.release();
    
    // 整理用户完整信息
    const userInfo = {
      ...user,
      roles: roleRows,
      permissions: permissionRows,
      role_names: roleRows.map(role => role.name),
      permission_names: permissionRows.map(perm => perm.name)
    };
    
    res.json({ 
      message: '登录成功', 
      token: 'fake-jwt-token', 
      user: userInfo
    });
  } catch (error) {
    logger.error('登录错误', { error: error.message, username });
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
