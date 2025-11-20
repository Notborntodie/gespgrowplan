const { pool } = require('../config/database');
const { logger } = require('../config/logger');

/**
 * 修复任务完成状态
 * 检查所有已完成客观题和OJ题的任务，更新任务完成状态
 */
async function fixTaskProgress() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('='.repeat(80));
    console.log('开始修复任务完成状态');
    console.log('='.repeat(80));
    console.log();
    
    // 1. 获取所有任务
    const [tasks] = await connection.execute(
      'SELECT id, name, plan_id FROM learning_tasks'
    );
    
    console.log(`找到 ${tasks.length} 个任务`);
    console.log();
    
    let fixedCount = 0;
    let checkedCount = 0;
    
    // 2. 对每个任务检查所有用户的完成状态
    for (const task of tasks) {
      // 获取任务内的所有客观题
      const [taskExams] = await connection.execute(
        'SELECT exam_id FROM task_exams WHERE task_id = ?',
        [task.id]
      );
      
      // 获取任务内的所有OJ题
      const [taskOjs] = await connection.execute(
        'SELECT problem_id FROM task_oj_problems WHERE task_id = ?',
        [task.id]
      );
      
      if (taskExams.length === 0 && taskOjs.length === 0) {
        continue; // 跳过没有题目的任务
      }
      
      // 获取所有加入该计划的用户
      const [users] = await connection.execute(
        `SELECT DISTINCT ulp.user_id 
         FROM user_learning_plans ulp
         JOIN learning_tasks lt ON ulp.plan_id = lt.plan_id
         WHERE lt.id = ?`,
        [task.id]
      );
      
      for (const user of users) {
        const user_id = user.user_id;
        checkedCount++;
        
        // 检查所有客观题是否都完成
        let allExamsCompleted = true;
        if (taskExams.length > 0) {
          const examIds = taskExams.map(te => te.exam_id);
          const placeholders = examIds.map(() => '?').join(',');
          const [examProgress] = await connection.execute(
            `SELECT COUNT(*) as completed_count 
             FROM user_exam_progress 
             WHERE user_id = ? AND exam_id IN (${placeholders}) AND task_id = ? AND is_completed = 1`,
            [user_id, ...examIds, task.id]
          );
          allExamsCompleted = examProgress[0].completed_count === examIds.length;
        }
        
        // 检查所有OJ题是否都完成
        let allOjsCompleted = true;
        if (taskOjs.length > 0) {
          const problemIds = taskOjs.map(to => to.problem_id);
          const placeholders = problemIds.map(() => '?').join(',');
          const [ojProgress] = await connection.execute(
            `SELECT COUNT(*) as completed_count 
             FROM user_oj_progress 
             WHERE user_id = ? AND problem_id IN (${placeholders}) AND task_id = ? AND is_completed = 1`,
            [user_id, ...problemIds, task.id]
          );
          allOjsCompleted = ojProgress[0].completed_count === problemIds.length;
        }
        
        // 如果都完成了，检查任务状态
        const isTaskCompleted = allExamsCompleted && allOjsCompleted;
        
        if (isTaskCompleted) {
          // 检查当前任务状态
          const [currentProgress] = await connection.execute(
            'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
            [user_id, task.id]
          );
          
          // 确保 is_completed 是数字或布尔值，而不是字符串
          const currentIsCompleted = currentProgress.length > 0 
            ? (Number(currentProgress[0].is_completed) === 1 || currentProgress[0].is_completed === true)
            : false;
          
          if (currentProgress.length === 0 || !currentIsCompleted) {
            // 需要更新任务状态
            await connection.execute(`
              INSERT INTO user_task_progress (user_id, task_id, is_completed, completed_at)
              VALUES (?, ?, TRUE, NOW())
              ON DUPLICATE KEY UPDATE 
                is_completed = TRUE,
                completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END,
                updated_at = NOW()
            `, [user_id, task.id]);
            
            fixedCount++;
            console.log(`✅ 修复: 用户 ${user_id} 的任务 "${task.name}" (ID: ${task.id})`);
          }
        }
      }
    }
    
    await connection.commit();
    
    console.log();
    console.log('='.repeat(80));
    console.log('修复完成');
    console.log(`检查了 ${checkedCount} 个用户任务组合`);
    console.log(`修复了 ${fixedCount} 个任务完成状态`);
    console.log('='.repeat(80));
    
  } catch (error) {
    await connection.rollback();
    console.error('修复失败:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行修复
fixTaskProgress().catch(console.error);

