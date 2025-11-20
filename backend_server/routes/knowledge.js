const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { cacheMiddleware, cacheUtils } = require('../config/cache');
const { logger } = require('../config/logger');

// 获取知识点列表（带智能缓存）
router.get('/knowledge-points', async (req, res) => {
  try {
    const { category, level } = req.query;
    
    // 构建缓存键
    let cacheKey = 'cache:knowledge:all';
    if (category && level) {
      cacheKey = `cache:knowledge:category=${category}&level=${level}`;
    } else if (category) {
      cacheKey = `cache:knowledge:category=${category}`;
    } else if (level) {
      cacheKey = `cache:knowledge:level=${level}`;
    }
    
    // 尝试从缓存获取
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      console.log(`知识点缓存命中: ${cacheKey}`);
      return res.json(cached);
    }
    
    // 缓存未命中，从数据库查询
    const connection = await pool.getConnection();
    
    let sql = 'SELECT * FROM knowledge_points WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    
    sql += ' ORDER BY category, level, name';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    // 缓存结果
    await cacheUtils.set(cacheKey, results, 600);
    console.log(`知识点缓存已设置: ${cacheKey}`);
    
    res.json(results);
  } catch (error) {
    logger.error('获取知识点列表错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加知识点
router.post('/knowledge-points', async (req, res) => {
  try {
    const { name, description, category, level } = req.body;
    const connection = await pool.getConnection();
    
    // 检查知识点是否已存在
    const [existing] = await connection.execute(
      'SELECT id FROM knowledge_points WHERE name = ? AND level = ?',
      [name, level]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ message: '该知识点已存在' });
    }
    
    // 添加知识点
    const [result] = await connection.execute(
      'INSERT INTO knowledge_points (name, description, category, level) VALUES (?, ?, ?, ?)',
      [name, description, category, level]
    );
    
    connection.release();
    
    // 清除相关缓存
    await cacheUtils.knowledge.clearAll();
    
    res.json({ 
      message: '知识点添加成功', 
      id: result.insertId 
    });
  } catch (error) {
    logger.error('添加知识点错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 编辑知识点
router.put('/knowledge-points/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, level } = req.body;
    const connection = await pool.getConnection();
    
    // 检查知识点是否存在
    const [existing] = await connection.execute(
      'SELECT id FROM knowledge_points WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ message: '知识点不存在' });
    }
    
    // 检查新名称是否与其他知识点冲突（排除当前知识点）
    if (name) {
      const [nameConflict] = await connection.execute(
        'SELECT id FROM knowledge_points WHERE name = ? AND level = ? AND id != ?',
        [name, level, id]
      );
      
      if (nameConflict.length > 0) {
        connection.release();
        return res.status(400).json({ message: '该知识点名称已存在' });
      }
    }
    
    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (level !== undefined) {
      updateFields.push('level = ?');
      updateValues.push(level);
    }
    
    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ message: '没有提供要更新的字段' });
    }
    
    // 执行更新
    updateValues.push(id);
    await connection.execute(
      `UPDATE knowledge_points SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    connection.release();
    
    // 清除相关缓存
    await cacheUtils.knowledge.clearAll();
    
    res.json({ message: '知识点更新成功' });
  } catch (error) {
    logger.error('编辑知识点错误', { error: error.message, id: req.params.id });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除知识点
router.delete('/knowledge-points/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查知识点是否存在
      const [existing] = await connection.execute(
        'SELECT id FROM knowledge_points WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        connection.release();
        return res.status(404).json({ message: '知识点不存在' });
      }
      
      // 检查是否有题目关联此知识点
      const [relatedQuestions] = await connection.execute(
        'SELECT COUNT(*) as count FROM question_knowledge_points WHERE knowledge_point_id = ?',
        [id]
      );
      
      if (relatedQuestions[0].count > 0) {
        connection.release();
        return res.status(400).json({ 
          message: '无法删除该知识点，因为有题目正在使用此知识点',
          related_questions_count: relatedQuestions[0].count
        });
      }
      
      // 删除知识点
      await connection.execute('DELETE FROM knowledge_points WHERE id = ?', [id]);
      
      await connection.commit();
      connection.release();
      
      // 清除相关缓存
      await cacheUtils.knowledge.clearAll();
      
      res.json({ message: '知识点删除成功' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('删除知识点错误', { error: error.message, id: req.params.id });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 预加载知识点缓存
router.post('/knowledge-points/preload-cache', async (req, res) => {
  try {
    const success = await cacheUtils.knowledge.preload(pool);
    if (success) {
      res.json({ message: '知识点缓存预加载成功' });
    } else {
      res.status(500).json({ error: '知识点缓存预加载失败' });
    }
  } catch (error) {
    logger.error('预加载知识点缓存错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 清除知识点缓存
router.delete('/knowledge-points/cache', async (req, res) => {
  try {
    const deletedCount = await cacheUtils.knowledge.clearAll();
    res.json({ 
      message: '知识点缓存清除成功',
      deleted_keys: deletedCount
    });
  } catch (error) {
    logger.error('清除知识点缓存错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取知识点统计信息
router.get('/knowledge-points/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // 获取总数
    const [totalResult] = await connection.execute('SELECT COUNT(*) as total FROM knowledge_points');
    
    // 按分类统计
    const [categoryResult] = await connection.execute(`
      SELECT category, COUNT(*) as count 
      FROM knowledge_points 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    // 按级别统计
    const [levelResult] = await connection.execute(`
      SELECT level, COUNT(*) as count 
      FROM knowledge_points 
      GROUP BY level 
      ORDER BY level
    `);
    
    connection.release();
    
    res.json({
      total: totalResult[0].total,
      by_category: categoryResult,
      by_level: levelResult
    });
  } catch (error) {
    logger.error('获取知识点统计错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取角色列表（带缓存）
router.get('/roles', cacheMiddleware(600, 'roles'), async (req, res) => {
  try {
    const { is_system } = req.query;
    const connection = await pool.getConnection();
    
    let sql = 'SELECT id, name, display_name, description, is_system FROM roles WHERE 1=1';
    const params = [];
    
    if (is_system !== undefined) {
      sql += ' AND is_system = ?';
      params.push(is_system === 'true' ? 1 : 0);
    }
    
    sql += ' ORDER BY is_system DESC, name';
    
    const [results] = await connection.execute(sql, params);
    connection.release();
    
    res.json(results);
  } catch (error) {
    logger.error('获取角色列表错误', { error: error.message });
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
