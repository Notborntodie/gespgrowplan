require('dotenv').config();
const { pool } = require('../config/database');
const { updateTaskCompletionStatus, updatePlanCompletionStatus } = require('../routes/learningPlans');

/**
 * 纠正学习计划完成状态脚本
 * 功能：根据自由练习的提交记录，更新任务和计划的完成状态
 * 逻辑：
 * 1. 查找学生是否绑定计划
 * 2. 如果在某个计划内，查看内部任务
 * 3. 如果某个任务内的编程题和客观题有提交记录（包括自由练习），就标记题目为完成
 * 4. 重新计算任务和计划的完成状态
 * 
 * @param {string} username - 用户名
 * @param {boolean} closePool - 是否关闭连接池（批量处理时设为false）
 */
async function fixPlanProgressFromFreePractice(username = 'czy', closePool = true) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('='.repeat(80));
    console.log(`开始纠正用户 ${username} 的学习计划完成状态`);
    console.log('='.repeat(80));
    console.log();
    
    // 1. 查找用户
    const [users] = await connection.execute(
      'SELECT id, username, real_name FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      console.log(`❌ 未找到用户: ${username}`);
      return;
    }
    
    const user = users[0];
    console.log(`✅ 找到用户: ${user.username} (ID: ${user.id}, 姓名: ${user.real_name || '未设置'})`);
    console.log();
    
    // 2. 查找用户加入的所有计划
    const [joinedPlans] = await connection.execute(`
      SELECT ulp.*, lp.name as plan_name, lp.level as plan_level
      FROM user_learning_plans ulp
      JOIN learning_plans lp ON ulp.plan_id = lp.id
      WHERE ulp.user_id = ? AND lp.is_active = 1
      ORDER BY ulp.joined_at DESC
    `, [user.id]);
    
    if (joinedPlans.length === 0) {
      console.log(`⚠️  用户 ${username} 未加入任何学习计划`);
      return;
    }
    
    console.log(`✅ 用户加入了 ${joinedPlans.length} 个计划:`);
    joinedPlans.forEach(plan => {
      console.log(`   - 计划ID: ${plan.plan_id}, 名称: ${plan.plan_name}, 级别: ${plan.plan_level}`);
    });
    console.log();
    
    // 3. 处理每个计划
    for (const joinedPlan of joinedPlans) {
      const planId = joinedPlan.plan_id;
      const planName = joinedPlan.plan_name;
      
      console.log('='.repeat(80));
      console.log(`📋 处理计划: ${planName} (ID: ${planId})`);
      console.log('='.repeat(80));
      console.log();
      
      // 获取计划的所有任务
      const [tasks] = await connection.execute(
        'SELECT * FROM learning_tasks WHERE plan_id = ? ORDER BY task_order',
        [planId]
      );
      
      console.log(`📝 计划内共有 ${tasks.length} 个任务`);
      console.log();
      
      // 4. 处理每个任务
      for (const task of tasks) {
        console.log('-'.repeat(80));
        console.log(`📌 处理任务: ${task.name} (ID: ${task.id}, 顺序: ${task.task_order})`);
        console.log();
        
        // 4.1 处理任务内的客观题
        const [taskExams] = await connection.execute(
          'SELECT exam_id FROM task_exams WHERE task_id = ?',
          [task.id]
        );
        
        let examUpdatedCount = 0;
        let examCreatedCount = 0;
        
        for (const taskExam of taskExams) {
          const examId = taskExam.exam_id;
          
          // 查找该用户对该考试的所有提交（包括自由练习，task_id 为 NULL）
          const [allSubmissions] = await connection.execute(`
            SELECT 
              id,
              task_id,
              score,
              submit_time,
              attempt_number
            FROM submissions
            WHERE user_id = ? AND exam_id = ?
            ORDER BY score DESC, submit_time DESC
          `, [user.id, examId]);
          
          if (allSubmissions.length === 0) {
            continue; // 没有提交记录，跳过
          }
          
          // 找出最高分
          const bestSubmission = allSubmissions[0];
          const bestScore = bestSubmission.score || 0;
          const isCompleted = bestScore >= 60; // 完成标准：60分以上
          
          // 检查是否已有该任务的进度记录
          const [existingProgress] = await connection.execute(
            'SELECT * FROM user_exam_progress WHERE user_id = ? AND exam_id = ? AND task_id = ?',
            [user.id, examId, task.id]
          );
          
          // 计算尝试次数（包括所有提交，无论是否在任务内）
          const attemptCount = allSubmissions.length;
          
          // 找出最早的 >= 60 分的提交时间作为完成时间（需要按时间排序查找）
          const passedSubmissions = allSubmissions.filter(s => s.score >= 60);
          const completedSubmission = passedSubmissions.length > 0 
            ? passedSubmissions.sort((a, b) => new Date(a.submit_time) - new Date(b.submit_time))[0]
            : null;
          const completedAt = isCompleted && completedSubmission ? completedSubmission.submit_time : null;
          
          if (existingProgress.length > 0) {
            // 更新现有进度
            const current = existingProgress[0];
            const newBestScore = Math.max(current.best_score || 0, bestScore);
            const newIsCompleted = newBestScore >= 60 || current.is_completed === 1;
            const newCompletedAt = newIsCompleted && (completedAt || current.completed_at) 
              ? (completedAt || current.completed_at) 
              : current.completed_at;
            
            await connection.execute(`
              UPDATE user_exam_progress 
              SET is_completed = ?,
                  best_score = ?,
                  attempt_count = ?,
                  completed_at = ?,
                  updated_at = NOW()
              WHERE user_id = ? AND exam_id = ? AND task_id = ?
            `, [
              newIsCompleted ? 1 : 0,
              newBestScore,
              attemptCount,
              newCompletedAt,
              user.id,
              examId,
              task.id
            ]);
            
            examUpdatedCount++;
            console.log(`   ✅ 客观题 ID ${examId}: 更新进度 (最高分: ${newBestScore}, 完成: ${newIsCompleted ? '是' : '否'}, 尝试次数: ${attemptCount})`);
          } else {
            // 创建新进度记录
            await connection.execute(`
              INSERT INTO user_exam_progress 
              (user_id, exam_id, task_id, is_completed, best_score, attempt_count, completed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              user.id,
              examId,
              task.id,
              isCompleted ? 1 : 0,
              bestScore,
              attemptCount,
              completedAt
            ]);
            
            examCreatedCount++;
            console.log(`   ✅ 客观题 ID ${examId}: 创建进度 (最高分: ${bestScore}, 完成: ${isCompleted ? '是' : '否'}, 尝试次数: ${attemptCount})`);
          }
        }
        
        console.log(`   📊 客观题处理完成: 创建 ${examCreatedCount} 条，更新 ${examUpdatedCount} 条`);
        console.log();
        
        // 4.2 处理任务内的OJ题
        const [taskOjProblems] = await connection.execute(
          'SELECT problem_id FROM task_oj_problems WHERE task_id = ?',
          [task.id]
        );
        
        let ojUpdatedCount = 0;
        let ojCreatedCount = 0;
        
        for (const taskOj of taskOjProblems) {
          const problemId = taskOj.problem_id;
          
          // 查找该用户对该题目的所有提交（包括自由练习，task_id 为 NULL）
          const [allOjSubmissions] = await connection.execute(`
            SELECT 
              id,
              task_id,
              verdict,
              submit_time,
              status
            FROM oj_submissions
            WHERE user_id = ? AND problem_id = ? AND status = 'completed'
            ORDER BY 
              CASE WHEN verdict = 'Accepted' THEN 0 ELSE 1 END,
              submit_time DESC
          `, [user.id, problemId]);
          
          if (allOjSubmissions.length === 0) {
            continue; // 没有提交记录，跳过
          }
          
          // 检查是否有 Accepted 的提交
          const acceptedSubmission = allOjSubmissions.find(s => s.verdict === 'Accepted');
          const isCompleted = acceptedSubmission !== undefined;
          const bestVerdict = acceptedSubmission 
            ? 'Accepted' 
            : allOjSubmissions[0].verdict;
          
          // 检查是否已有该任务的进度记录
          const [existingProgress] = await connection.execute(
            'SELECT * FROM user_oj_progress WHERE user_id = ? AND problem_id = ? AND task_id = ?',
            [user.id, problemId, task.id]
          );
          
          // 计算尝试次数（包括所有提交，无论是否在任务内）
          const attemptCount = allOjSubmissions.length;
          
          // 找出最早的 Accepted 提交时间作为完成时间
          const acceptedSubmissions = allOjSubmissions.filter(s => s.verdict === 'Accepted');
          const earliestAccepted = acceptedSubmissions.length > 0
            ? acceptedSubmissions.sort((a, b) => new Date(a.submit_time) - new Date(b.submit_time))[0]
            : null;
          const completedAt = isCompleted && earliestAccepted ? earliestAccepted.submit_time : null;
          
          if (existingProgress.length > 0) {
            // 更新现有进度
            const current = existingProgress[0];
            const newBestVerdict = current.best_verdict === 'Accepted' || isCompleted 
              ? 'Accepted' 
              : bestVerdict;
            const newIsCompleted = isCompleted || current.is_completed === 1;
            const newCompletedAt = newIsCompleted && (completedAt || current.completed_at)
              ? (completedAt || current.completed_at)
              : current.completed_at;
            
            await connection.execute(`
              UPDATE user_oj_progress 
              SET is_completed = ?,
                  best_verdict = ?,
                  attempt_count = ?,
                  completed_at = ?,
                  updated_at = NOW()
              WHERE user_id = ? AND problem_id = ? AND task_id = ?
            `, [
              newIsCompleted ? 1 : 0,
              newBestVerdict,
              attemptCount,
              newCompletedAt,
              user.id,
              problemId,
              task.id
            ]);
            
            ojUpdatedCount++;
            console.log(`   ✅ OJ题 ID ${problemId}: 更新进度 (最佳结果: ${newBestVerdict}, 完成: ${newIsCompleted ? '是' : '否'}, 尝试次数: ${attemptCount})`);
          } else {
            // 创建新进度记录
            await connection.execute(`
              INSERT INTO user_oj_progress 
              (user_id, problem_id, task_id, is_completed, best_verdict, attempt_count, completed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              user.id,
              problemId,
              task.id,
              isCompleted ? 1 : 0,
              bestVerdict,
              attemptCount,
              completedAt
            ]);
            
            ojCreatedCount++;
            console.log(`   ✅ OJ题 ID ${problemId}: 创建进度 (最佳结果: ${bestVerdict}, 完成: ${isCompleted ? '是' : '否'}, 尝试次数: ${attemptCount})`);
          }
        }
        
        console.log(`   📊 OJ题处理完成: 创建 ${ojCreatedCount} 条，更新 ${ojUpdatedCount} 条`);
        console.log();
        
        // 4.3 重新计算任务完成状态
        console.log(`   🔄 重新计算任务完成状态...`);
        await updateTaskCompletionStatus(connection, user.id, task.id);
        
        // 检查任务完成状态
        const [taskProgress] = await connection.execute(
          'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
          [user.id, task.id]
        );
        
        if (taskProgress.length > 0 && (taskProgress[0].is_completed === 1 || taskProgress[0].is_completed === true)) {
          console.log(`   ✅ 任务已完成`);
        } else {
          console.log(`   ⚠️  任务未完成`);
        }
        console.log();
      }
      
      // 5. 重新计算计划完成状态
      console.log(`🔄 重新计算计划完成状态...`);
      await updatePlanCompletionStatus(connection, user.id, planId);
      
      // 检查计划完成状态
      const [planProgress] = await connection.execute(
        'SELECT * FROM user_plan_progress WHERE user_id = ? AND plan_id = ?',
        [user.id, planId]
      );
      
      if (planProgress.length > 0) {
        const progress = planProgress[0];
        const isCompleted = progress.is_completed === 1 || progress.is_completed === true;
        console.log(`📊 计划完成状态:`);
        console.log(`   - 是否完成: ${isCompleted ? '✅ 是' : '❌ 否'}`);
        console.log(`   - 已完成任务: ${progress.completed_tasks || 0} / ${progress.total_tasks || tasks.length}`);
        console.log(`   - 完成率: ${progress.total_tasks > 0 ? ((progress.completed_tasks / progress.total_tasks) * 100).toFixed(2) : 0}%`);
      }
      console.log();
    }
    
    await connection.commit();
    
    console.log('='.repeat(80));
    console.log('✅ 纠正完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 纠正失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  } finally {
    connection.release();
    if (closePool) {
      await pool.end();
    }
  }
}

// 执行脚本
if (require.main === module) {
  const username = process.argv[2] || 'czy';
  fixPlanProgressFromFreePractice(username)
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixPlanProgressFromFreePractice };

