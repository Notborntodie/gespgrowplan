require('dotenv').config();
const { pool } = require('../config/database');

/**
 * 修复空任务完成状态脚本
 * 功能：如果任务内部没有编程题和客观题，将该任务标记为未完成
 * 
 * 使用方法:
 *   node scripts/fix_empty_tasks_completion.js
 */
async function fixEmptyTasksCompletion() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('='.repeat(80));
    console.log('开始修复空任务的完成状态');
    console.log('='.repeat(80));
    console.log();
    
    // 1. 查找所有任务
    const [tasks] = await connection.execute(`
      SELECT id, name, plan_id
      FROM learning_tasks
      ORDER BY plan_id, task_order
    `);
    
    console.log(`✅ 找到 ${tasks.length} 个任务`);
    console.log();
    
    let fixedCount = 0;
    let checkedCount = 0;
    
    // 2. 对每个任务检查是否有题目
    for (const task of tasks) {
      // 检查任务是否有客观题
      const [taskExams] = await connection.execute(
        'SELECT COUNT(*) as count FROM task_exams WHERE task_id = ?',
        [task.id]
      );
      const examCount = Number(taskExams[0].count) || 0;
      
      // 检查任务是否有OJ题
      const [taskOjs] = await connection.execute(
        'SELECT COUNT(*) as count FROM task_oj_problems WHERE task_id = ?',
        [task.id]
      );
      const ojCount = Number(taskOjs[0].count) || 0;
      
      // 如果任务既没有客观题也没有OJ题，则修复其完成状态
      if (examCount === 0 && ojCount === 0) {
        checkedCount++;
        
        // 查找所有将该任务标记为已完成的用户
        const [completedUsers] = await connection.execute(`
          SELECT user_id, task_id, is_completed, completed_at
          FROM user_task_progress
          WHERE task_id = ? AND is_completed = 1
        `, [task.id]);
        
        if (completedUsers.length > 0) {
          // 将这些用户的任务状态改为未完成
          await connection.execute(`
            UPDATE user_task_progress
            SET is_completed = FALSE,
                completed_at = NULL,
                updated_at = NOW()
            WHERE task_id = ? AND is_completed = 1
          `, [task.id]);
          
          fixedCount += completedUsers.length;
          
          // 获取计划名称以便显示
          const [planInfo] = await connection.execute(
            'SELECT name FROM learning_plans WHERE id = ?',
            [task.plan_id]
          );
          const planName = planInfo[0] ? planInfo[0].name : `计划ID: ${task.plan_id}`;
          
          console.log(`✅ 修复任务: ${task.name} (ID: ${task.id})`);
          console.log(`   计划: ${planName}`);
          console.log(`   客观题数: ${examCount}, OJ题数: ${ojCount}`);
          console.log(`   修复了 ${completedUsers.length} 个用户的完成状态`);
          console.log();
        } else {
          console.log(`ℹ️  任务: ${task.name} (ID: ${task.id}) - 空任务，但无用户标记为已完成`);
        }
      }
    }
    
    // 3. 重新计算所有计划的完成状态
    console.log('🔄 重新计算所有计划的完成状态...');
    console.log();
    
    // 获取所有计划
    const [plans] = await connection.execute(
      'SELECT id FROM learning_plans WHERE is_active = 1'
    );
    
    let planFixedCount = 0;
    
    for (const plan of plans) {
      // 获取该计划的所有用户
      const [joinedUsers] = await connection.execute(
        'SELECT DISTINCT user_id FROM user_learning_plans WHERE plan_id = ?',
        [plan.id]
      );
      
      for (const user of joinedUsers) {
        // 获取计划的所有任务
        const [tasks] = await connection.execute(
          'SELECT id FROM learning_tasks WHERE plan_id = ?',
          [plan.id]
        );
        
        if (tasks.length === 0) {
          continue;
        }
        
        // 统计已完成任务数
        const taskIds = tasks.map(t => t.id);
        const placeholders = taskIds.map(() => '?').join(',');
        const [completedTasks] = await connection.execute(
          `SELECT COUNT(*) as completed_count 
           FROM user_task_progress 
           WHERE user_id = ? AND task_id IN (${placeholders}) AND is_completed = 1`,
          [user.user_id, ...taskIds]
        );
        
        const completedCount = completedTasks[0].completed_count || 0;
        const totalCount = tasks.length;
        const isPlanCompleted = completedCount === totalCount;
        
        // 更新或创建计划完成进度
        await connection.execute(`
          INSERT INTO user_plan_progress (user_id, plan_id, is_completed, completed_tasks, total_tasks, completed_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            is_completed = ?,
            completed_tasks = ?,
            total_tasks = ?,
            completed_at = CASE WHEN ? AND completed_at IS NULL THEN NOW() ELSE completed_at END,
            updated_at = NOW()
        `, [
          user.user_id, plan.id, 
          isPlanCompleted ? 1 : 0, completedCount, totalCount,
          isPlanCompleted ? new Date() : null,
          isPlanCompleted ? 1 : 0, completedCount, totalCount,
          isPlanCompleted ? 1 : 0
        ]);
        
        planFixedCount++;
      }
    }
    
    await connection.commit();
    
    console.log('='.repeat(80));
    console.log('修复汇总');
    console.log('='.repeat(80));
    console.log(`检查了 ${checkedCount} 个空任务`);
    console.log(`修复了 ${fixedCount} 个用户的错误完成状态`);
    console.log(`重新计算了 ${planFixedCount} 个用户的计划完成状态`);
    console.log();
    console.log('='.repeat(80));
    console.log('✅ 修复完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 修复失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行脚本
if (require.main === module) {
  fixEmptyTasksCompletion()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixEmptyTasksCompletion };

