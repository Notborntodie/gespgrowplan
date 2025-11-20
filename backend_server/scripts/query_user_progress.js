const { pool } = require('../config/database');

async function queryUserProgress() {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('查询用户 test 在 GESP4级 的完成情况');
    console.log('='.repeat(80));
    console.log();

    // 1. 查找用户 test
    const [users] = await connection.execute(
      'SELECT id, username, real_name FROM users WHERE username = ?',
      ['test']
    );

    if (users.length === 0) {
      console.log('❌ 未找到用户 test');
      return;
    }

    const user = users[0];
    console.log(`✅ 找到用户: ${user.username} (ID: ${user.id}, 姓名: ${user.real_name || '未设置'})`);
    console.log();

    // 2. 查找名为 "GESP4级" 的学习计划
    const [plans] = await connection.execute(
      'SELECT id, name, description, level, start_time, end_time, is_active FROM learning_plans WHERE name LIKE ?',
      ['%GESP1级%']
    );

    if (plans.length === 0) {
      console.log('❌ 未找到名为 "GESP4级" 的学习计划');
      return;
    }

    console.log(`✅ 找到 ${plans.length} 个相关计划:`);
    plans.forEach(plan => {
      console.log(`   - ID: ${plan.id}, 名称: ${plan.name}, 级别: ${plan.level}, 状态: ${plan.is_active ? '启用' : '禁用'}`);
      console.log(`     开始时间: ${plan.start_time}, 结束时间: ${plan.end_time}`);
    });
    console.log();

    // 3. 对每个计划查询详细信息
    for (const plan of plans) {
      console.log('='.repeat(80));
      console.log(`📋 计划: ${plan.name} (ID: ${plan.id})`);
      console.log('='.repeat(80));
      console.log();

      // 检查用户是否加入了该计划
      const [joined] = await connection.execute(
        'SELECT * FROM user_learning_plans WHERE user_id = ? AND plan_id = ?',
        [user.id, plan.id]
      );

      if (joined.length === 0) {
        console.log('⚠️  用户未加入该计划');
        console.log();
        continue;
      }

      console.log(`✅ 用户已加入该计划 (加入时间: ${joined[0].joined_at}, 状态: ${joined[0].status})`);
      console.log();

      // 获取计划完成进度
      const [planProgress] = await connection.execute(
        'SELECT * FROM user_plan_progress WHERE user_id = ? AND plan_id = ?',
        [user.id, plan.id]
      );

      if (planProgress.length > 0) {
        const progress = planProgress[0];
        console.log('📊 计划完成进度:');
        console.log(`   - 是否完成: ${progress.is_completed ? '✅ 是' : '❌ 否'}`);
        console.log(`   - 已完成任务: ${progress.completed_tasks} / ${progress.total_tasks}`);
        console.log(`   - 完成率: ${progress.total_tasks > 0 ? ((progress.completed_tasks / progress.total_tasks) * 100).toFixed(2) : 0}%`);
        console.log(`   - 完成时间: ${progress.completed_at || '未完成'}`);
      } else {
        console.log('📊 计划完成进度: 暂无记录');
      }
      console.log();

      // 获取计划内的所有任务
      const [tasks] = await connection.execute(
        'SELECT * FROM learning_tasks WHERE plan_id = ? ORDER BY task_order',
        [plan.id]
      );

      console.log(`📝 计划内共有 ${tasks.length} 个任务:`);
      console.log();

      // 4. 对每个任务查询详细信息
      for (const task of tasks) {
        console.log('-'.repeat(80));
        console.log(`📌 任务: ${task.name} (ID: ${task.id}, 顺序: ${task.task_order})`);
        console.log(`   开始时间: ${task.start_time}, 结束时间: ${task.end_time}`);
        console.log();

        // 获取任务完成状态
        const [taskProgress] = await connection.execute(
          'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
          [user.id, task.id]
        );

        if (taskProgress.length > 0) {
          const tp = taskProgress[0];
          console.log('   ✅ 任务完成状态:');
          console.log(`      - 是否完成: ${tp.is_completed ? '✅ 是' : '❌ 否'}`);
          console.log(`      - 完成时间: ${tp.completed_at || '未完成'}`);
        } else {
          console.log('   ⚠️  任务完成状态: 未开始');
        }
        console.log();

        // 获取任务内的客观题完成情况
        const [examProgress] = await connection.execute(`
          SELECT 
            e.id,
            e.name,
            e.level,
            e.type,
            e.total_questions,
            te.exam_order,
            COALESCE(uep.is_completed, 0) as is_completed,
            COALESCE(uep.best_score, 0) as best_score,
            COALESCE(uep.attempt_count, 0) as attempt_count,
            uep.completed_at
          FROM task_exams te
          JOIN exams e ON te.exam_id = e.id
          LEFT JOIN user_exam_progress uep ON e.id = uep.exam_id 
            AND uep.user_id = ? AND uep.task_id = ?
          WHERE te.task_id = ?
          ORDER BY te.exam_order
        `, [user.id, task.id, task.id]);

        console.log(`   📚 客观题完成情况 (共 ${examProgress.length} 个):`);
        if (examProgress.length === 0) {
          console.log('      无客观题');
        } else {
          examProgress.forEach((exam, index) => {
            // 确保 is_completed 是数字或布尔值，而不是字符串
            const isCompleted = Number(exam.is_completed) === 1 || exam.is_completed === true;
            const status = isCompleted ? '✅' : '❌';
            console.log(`      ${index + 1}. ${status} ${exam.name} (ID: ${exam.id})`);
            console.log(`         类型: ${exam.type}, 级别: ${exam.level}, 题目数: ${exam.total_questions}`);
            console.log(`         最高分: ${exam.best_score}, 尝试次数: ${exam.attempt_count}`);
            console.log(`         完成时间: ${exam.completed_at || '未完成'}`);
          });
        }
        console.log();

        // 获取任务内的OJ题完成情况
        const [ojProgress] = await connection.execute(`
          SELECT 
            op.id,
            op.title,
            op.level,
            top.problem_order,
            COALESCE(uop.is_completed, 0) as is_completed,
            uop.best_verdict,
            COALESCE(uop.attempt_count, 0) as attempt_count,
            uop.completed_at
          FROM task_oj_problems top
          JOIN oj_problems op ON top.problem_id = op.id
          LEFT JOIN user_oj_progress uop ON op.id = uop.problem_id 
            AND uop.user_id = ? AND uop.task_id = ?
          WHERE top.task_id = ?
          ORDER BY top.problem_order
        `, [user.id, task.id, task.id]);

        console.log(`   💻 OJ题完成情况 (共 ${ojProgress.length} 个):`);
        if (ojProgress.length === 0) {
          console.log('      无OJ题');
        } else {
          ojProgress.forEach((oj, index) => {
            // 确保 is_completed 是数字或布尔值，而不是字符串
            const isCompleted = Number(oj.is_completed) === 1 || oj.is_completed === true;
            const status = isCompleted ? '✅' : '❌';
            console.log(`      ${index + 1}. ${status} ${oj.title} (ID: ${oj.id})`);
            console.log(`         级别: ${oj.level}, 最佳结果: ${oj.best_verdict || '无'}`);
            console.log(`         尝试次数: ${oj.attempt_count}`);
            console.log(`         完成时间: ${oj.completed_at || '未完成'}`);
          });
        }
        console.log();
      }
    }

    console.log('='.repeat(80));
    console.log('查询完成');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行查询
queryUserProgress().catch(console.error);

