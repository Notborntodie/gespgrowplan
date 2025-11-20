const { pool } = require('../config/database');

async function debugTaskCompletion() {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('调试任务完成状态更新逻辑');
    console.log('='.repeat(80));
    console.log();

    // 查找用户 test
    const [users] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ?',
      ['test']
    );

    if (users.length === 0) {
      console.log('❌ 未找到用户 test');
      return;
    }

    const user = users[0];
    console.log(`✅ 找到用户: ${user.username} (ID: ${user.id})`);
    console.log();

    // 查找名为 "GESP4级" 的计划
    const [plans] = await connection.execute(
      'SELECT id, name FROM learning_plans WHERE name LIKE ?',
      ['%冲击GESP1级%']
    );

    if (plans.length === 0) {
      console.log('❌ 未找到计划');
      return;
    }

    const plan = plans[0];
    console.log(`✅ 找到计划: ${plan.name} (ID: ${plan.id})`);
    console.log();

    // 获取计划内的所有任务
    const [tasks] = await connection.execute(
      'SELECT id, name FROM learning_tasks WHERE plan_id = ? ORDER BY task_order',
      [plan.id]
    );

    console.log(`📝 计划内共有 ${tasks.length} 个任务:`);
    console.log();

    for (const task of tasks) {
      console.log('-'.repeat(80));
      console.log(`📌 任务: ${task.name} (ID: ${task.id})`);
      console.log();

      // 1. 获取任务内的所有客观题
      const [taskExams] = await connection.execute(
        'SELECT exam_id FROM task_exams WHERE task_id = ?',
        [task.id]
      );
      console.log(`   任务内客观题数量: ${taskExams.length}`);
      if (taskExams.length > 0) {
        const examIds = taskExams.map(te => te.exam_id);
        console.log(`   客观题ID: ${examIds.join(', ')}`);
      }

      // 2. 获取任务内的所有OJ题
      const [taskOjs] = await connection.execute(
        'SELECT problem_id FROM task_oj_problems WHERE task_id = ?',
        [task.id]
      );
      console.log(`   任务内OJ题数量: ${taskOjs.length}`);
      if (taskOjs.length > 0) {
        const problemIds = taskOjs.map(to => to.problem_id);
        console.log(`   OJ题ID: ${problemIds.join(', ')}`);
      }
      console.log();

      // 3. 检查所有客观题是否都完成
      let allExamsCompleted = true;
      if (taskExams.length > 0) {
        const examIds = taskExams.map(te => te.exam_id);
        const placeholders = examIds.map(() => '?').join(',');
        const [examProgress] = await connection.execute(
          `SELECT exam_id, is_completed, best_score, attempt_count 
           FROM user_exam_progress 
           WHERE user_id = ? AND exam_id IN (${placeholders}) AND task_id = ?`,
          [user.id, ...examIds, task.id]
        );
        
        console.log(`   客观题完成情况:`);
        examProgress.forEach(ep => {
          console.log(`     - 考试ID ${ep.exam_id}: 完成=${ep.is_completed}, 最高分=${ep.best_score}, 尝试次数=${ep.attempt_count}`);
        });
        
        const completedCount = examProgress.filter(ep => ep.is_completed === 1).length;
        console.log(`   已完成: ${completedCount} / ${examIds.length}`);
        allExamsCompleted = completedCount === examIds.length;
      } else {
        console.log(`   无客观题，allExamsCompleted = true (默认值)`);
      }
      console.log();

      // 4. 检查所有OJ题是否都完成
      let allOjsCompleted = true;
      if (taskOjs.length > 0) {
        const problemIds = taskOjs.map(to => to.problem_id);
        const placeholders = problemIds.map(() => '?').join(',');
        const [ojProgress] = await connection.execute(
          `SELECT problem_id, is_completed, best_verdict, attempt_count 
           FROM user_oj_progress 
           WHERE user_id = ? AND problem_id IN (${placeholders}) AND task_id = ?`,
          [user.id, ...problemIds, task.id]
        );
        
        console.log(`   OJ题完成情况:`);
        ojProgress.forEach(op => {
          console.log(`     - 题目ID ${op.problem_id}: 完成=${op.is_completed}, 最佳结果=${op.best_verdict || '无'}, 尝试次数=${op.attempt_count}`);
        });
        
        const completedCount = ojProgress.filter(op => op.is_completed === 1).length;
        console.log(`   已完成: ${completedCount} / ${problemIds.length}`);
        allOjsCompleted = completedCount === problemIds.length;
      } else {
        console.log(`   无OJ题，allOjsCompleted = true (默认值)`);
      }
      console.log();

      // 5. 检查任务完成状态
      const isTaskCompleted = allExamsCompleted && allOjsCompleted;
      console.log(`   任务完成判断: allExamsCompleted=${allExamsCompleted}, allOjsCompleted=${allOjsCompleted}`);
      console.log(`   任务应该完成: ${isTaskCompleted ? '✅ 是' : '❌ 否'}`);
      console.log();

      // 6. 检查实际的任务完成状态
      const [taskProgress] = await connection.execute(
        'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
        [user.id, task.id]
      );

      if (taskProgress.length > 0) {
        const tp = taskProgress[0];
        console.log(`   实际任务完成状态: ${tp.is_completed ? '✅ 已完成' : '❌ 未完成'}`);
        console.log(`   完成时间: ${tp.completed_at || '无'}`);
        
        if (isTaskCompleted && !tp.is_completed) {
          console.log(`   ⚠️  问题：任务应该完成但实际未完成！`);
        } else if (!isTaskCompleted && tp.is_completed) {
          console.log(`   ⚠️  问题：任务不应该完成但实际已完成！`);
        } else {
          console.log(`   ✅ 状态一致`);
        }
      } else {
        console.log(`   实际任务完成状态: 无记录`);
        if (isTaskCompleted) {
          console.log(`   ⚠️  问题：任务应该完成但没有记录！`);
        }
      }
      console.log();
    }

    console.log('='.repeat(80));
    console.log('调试完成');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('调试出错:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行调试
debugTaskCompletion().catch(console.error);

