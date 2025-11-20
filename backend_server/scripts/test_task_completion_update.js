const { pool } = require('../config/database');
const { submitExamInternal } = require('../routes/submissions');
const { submitOjInternal } = require('../routes/oj');

const TEST_USER_ID = 43; // test用户ID
const PLAN_ID = 1; // 冲击GESP 1级计划ID

async function testTaskCompletionUpdate() {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('测试任务完成状态更新逻辑');
    console.log('='.repeat(80));
    console.log();
    
    // 1. 获取test用户在GESP 1级的所有任务
    const [tasks] = await connection.execute(
      'SELECT * FROM learning_tasks WHERE plan_id = ? ORDER BY task_order',
      [PLAN_ID]
    );
    
    console.log(`找到 ${tasks.length} 个任务`);
    console.log();
    
    // 2. 保存所有提交记录和答案
    const savedData = {};
    
    for (const task of tasks) {
      console.log(`\n处理任务: ${task.name} (ID: ${task.id})`);
      
      // 获取任务内的客观题
      const [taskExams] = await connection.execute(
        'SELECT exam_id FROM task_exams WHERE task_id = ?',
        [task.id]
      );
      
      // 获取任务内的OJ题
      const [taskOjs] = await connection.execute(
        'SELECT problem_id FROM task_oj_problems WHERE task_id = ?',
        [task.id]
      );
      
      savedData[task.id] = {
        task_name: task.name,
        exams: [],
        ojs: []
      };
      
      // 保存客观题提交记录
      for (const exam of taskExams) {
        const [submissions] = await connection.execute(
          `SELECT s.* 
           FROM submissions s
           WHERE s.user_id = ? AND s.exam_id = ? AND s.task_id = ?
           ORDER BY s.attempt_number DESC
           LIMIT 1`,
          [TEST_USER_ID, exam.exam_id, task.id]
        );
        
        if (submissions.length > 0) {
          const submission = submissions[0];
          
          // 获取所有答案
          const [answers] = await connection.execute(
            'SELECT question_id, user_answer FROM submission_answers WHERE submission_id = ? ORDER BY question_id',
            [submission.id]
          );
          
          // 需要按照题目顺序排序
          const [examQuestions] = await connection.execute(
            'SELECT question_id, question_number FROM exam_questions WHERE exam_id = ? ORDER BY question_number',
            [exam.exam_id]
          );
          
          // 按题目顺序排列答案
          const sortedAnswers = examQuestions.map(eq => {
            const answer = answers.find(a => a.question_id === eq.question_id);
            return answer ? answer.user_answer : null;
          }).filter(a => a !== null);
          
          savedData[task.id].exams.push({
            exam_id: exam.exam_id,
            score: submission.score,
            answers: sortedAnswers
          });
          
          console.log(`  保存客观题: exam_id=${exam.exam_id}, score=${submission.score}, answers=${sortedAnswers.length}个`);
        }
      }
      
      // 保存OJ题提交记录
      for (const oj of taskOjs) {
        const [submissions] = await connection.execute(
          `SELECT * FROM oj_submissions 
           WHERE user_id = ? AND problem_id = ? AND task_id = ? AND verdict = 'Accepted'
           ORDER BY submit_time DESC
           LIMIT 1`,
          [TEST_USER_ID, oj.problem_id, task.id]
        );
        
        if (submissions.length > 0) {
          const submission = submissions[0];
          
          savedData[task.id].ojs.push({
            problem_id: oj.problem_id,
            code: submission.code,
            language: submission.language,
            verdict: submission.verdict
          });
          
          console.log(`  保存OJ题: problem_id=${oj.problem_id}, verdict=${submission.verdict}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('已保存所有提交记录');
    console.log('='.repeat(80));
    console.log(JSON.stringify(savedData, null, 2));
    console.log();
    
    // 3. 清除test在GESP 1级的所有提交记录和进度
    await connection.beginTransaction();
    
    try {
      // 清除任务进度
      await connection.execute(
        `DELETE FROM user_task_progress 
         WHERE user_id = ? AND task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除客观题进度
      await connection.execute(
        `DELETE FROM user_exam_progress 
         WHERE user_id = ? AND task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除OJ题进度
      await connection.execute(
        `DELETE FROM user_oj_progress 
         WHERE user_id = ? AND task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除提交答案
      await connection.execute(
        `DELETE sa FROM submission_answers sa
         JOIN submissions s ON sa.submission_id = s.id
         WHERE s.user_id = ? AND s.task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除客观题提交记录
      await connection.execute(
        `DELETE FROM submissions 
         WHERE user_id = ? AND task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除OJ题提交记录
      await connection.execute(
        `DELETE FROM oj_submissions 
         WHERE user_id = ? AND task_id IN (SELECT id FROM learning_tasks WHERE plan_id = ?)`,
        [TEST_USER_ID, PLAN_ID]
      );
      
      // 清除计划进度
      await connection.execute(
        'DELETE FROM user_plan_progress WHERE user_id = ? AND plan_id = ?',
        [TEST_USER_ID, PLAN_ID]
      );
      
      await connection.commit();
      console.log('✅ 已清除所有提交记录和进度');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
    // 4. 等待一下确保清除完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 5. 使用保存的答案重新提交
    console.log('\n' + '='.repeat(80));
    console.log('开始重新提交');
    console.log('='.repeat(80));
    
    for (const taskId in savedData) {
      const taskData = savedData[taskId];
      console.log(`\n处理任务: ${taskData.task_name} (ID: ${taskId})`);
      
      // 重新提交客观题
      for (const exam of taskData.exams) {
        try {
          console.log(`  提交客观题: exam_id=${exam.exam_id}`);
          
          const submitConnection = await pool.getConnection();
          try {
            await submitConnection.beginTransaction();
            
            const result = await submitExamInternal(submitConnection, TEST_USER_ID, exam.exam_id, exam.answers, parseInt(taskId));
            
            await submitConnection.commit();
            submitConnection.release();
            
            console.log(`    ✅ 提交成功: score=${result.score || 'N/A'}`);
            
            // 手动触发任务完成状态更新
            const updateConnection = await pool.getConnection();
            try {
              await updateConnection.beginTransaction();
              
              // 导入更新函数（需要从learningPlans.js导出）
              const { updateTaskCompletionStatus, updatePlanCompletionStatus } = require('../routes/learningPlans');
              
              // 获取任务信息
              const [taskInfo] = await updateConnection.execute(
                'SELECT plan_id FROM learning_tasks WHERE id = ?',
                [taskId]
              );
              
              if (taskInfo.length > 0) {
                await updateTaskCompletionStatus(updateConnection, TEST_USER_ID, parseInt(taskId));
                await updatePlanCompletionStatus(updateConnection, TEST_USER_ID, taskInfo[0].plan_id);
              }
              
              await updateConnection.commit();
              updateConnection.release();
              
              console.log(`    ✅ 任务完成状态已更新`);
              
            } catch (updateError) {
              await updateConnection.rollback();
              updateConnection.release();
              console.error(`    ⚠️  更新任务状态失败:`, updateError.message);
            }
            
            // 等待一下确保更新完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (submitError) {
            await submitConnection.rollback();
            submitConnection.release();
            throw submitError;
          }
          
        } catch (error) {
          console.error(`    ❌ 提交失败:`, error.message);
        }
      }
      
      // 重新提交OJ题
      for (const oj of taskData.ojs) {
        try {
          console.log(`  提交OJ题: problem_id=${oj.problem_id}`);
          
          const submitConnection = await pool.getConnection();
          try {
            await submitConnection.beginTransaction();
            
            const result = await submitOjInternal(submitConnection, TEST_USER_ID, oj.problem_id, oj.code, oj.language, parseInt(taskId));
            
            await submitConnection.commit();
            submitConnection.release();
            
            console.log(`    ✅ 提交成功: verdict=${result.verdict || 'N/A'}`);
            
            // 手动触发任务完成状态更新
            const updateConnection = await pool.getConnection();
            try {
              await updateConnection.beginTransaction();
              
              // 导入更新函数
              const { updateTaskCompletionStatus, updatePlanCompletionStatus } = require('../routes/learningPlans');
              
              // 获取任务信息
              const [taskInfo] = await updateConnection.execute(
                'SELECT plan_id FROM learning_tasks WHERE id = ?',
                [taskId]
              );
              
              if (taskInfo.length > 0) {
                await updateTaskCompletionStatus(updateConnection, TEST_USER_ID, parseInt(taskId));
                await updatePlanCompletionStatus(updateConnection, TEST_USER_ID, taskInfo[0].plan_id);
              }
              
              await updateConnection.commit();
              updateConnection.release();
              
              console.log(`    ✅ 任务完成状态已更新`);
              
            } catch (updateError) {
              await updateConnection.rollback();
              updateConnection.release();
              console.error(`    ⚠️  更新任务状态失败:`, updateError.message);
            }
            
            // 等待一下确保更新完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (submitError) {
            await submitConnection.rollback();
            submitConnection.release();
            throw submitError;
          }
          
        } catch (error) {
          console.error(`    ❌ 提交失败:`, error.message);
        }
      }
    }
    
    // 6. 等待异步更新完成
    console.log('\n等待异步更新完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 7. 检查任务完成状态
    console.log('\n' + '='.repeat(80));
    console.log('检查任务完成状态');
    console.log('='.repeat(80));
    
    for (const task of tasks) {
      const [taskProgress] = await connection.execute(
        'SELECT * FROM user_task_progress WHERE user_id = ? AND task_id = ?',
        [TEST_USER_ID, task.id]
      );
      
      // 获取客观题完成情况
      const [taskExams] = await connection.execute(
        'SELECT exam_id FROM task_exams WHERE task_id = ?',
        [task.id]
      );
      
      let allExamsCompleted = true;
      if (taskExams.length > 0) {
        const examIds = taskExams.map(te => te.exam_id);
        const placeholders = examIds.map(() => '?').join(',');
        const [examProgress] = await connection.execute(
          `SELECT COUNT(*) as completed_count 
           FROM user_exam_progress 
           WHERE user_id = ? AND exam_id IN (${placeholders}) AND task_id = ? AND is_completed = 1`,
          [TEST_USER_ID, ...examIds, task.id]
        );
        allExamsCompleted = examProgress[0].completed_count === examIds.length;
      }
      
      // 获取OJ题完成情况
      const [taskOjs] = await connection.execute(
        'SELECT problem_id FROM task_oj_problems WHERE task_id = ?',
        [task.id]
      );
      
      let allOjsCompleted = true;
      if (taskOjs.length > 0) {
        const problemIds = taskOjs.map(to => to.problem_id);
        const placeholders = problemIds.map(() => '?').join(',');
        const [ojProgress] = await connection.execute(
          `SELECT COUNT(*) as completed_count 
           FROM user_oj_progress 
           WHERE user_id = ? AND problem_id IN (${placeholders}) AND task_id = ? AND is_completed = 1`,
          [TEST_USER_ID, ...problemIds, task.id]
        );
        allOjsCompleted = ojProgress[0].completed_count === problemIds.length;
      }
      
      const taskIsCompleted = taskProgress.length > 0 && taskProgress[0].is_completed === 1;
      const shouldBeCompleted = allExamsCompleted && allOjsCompleted;
      
      console.log(`\n任务: ${task.name} (ID: ${task.id})`);
      console.log(`  客观题完成: ${allExamsCompleted ? '✅' : '❌'} (${taskExams.length}个)`);
      console.log(`  OJ题完成: ${allOjsCompleted ? '✅' : '❌'} (${taskOjs.length}个)`);
      console.log(`  应该完成: ${shouldBeCompleted ? '✅ 是' : '❌ 否'}`);
      console.log(`  实际状态: ${taskIsCompleted ? '✅ 已完成' : '❌ 未完成'}`);
      
      if (shouldBeCompleted && !taskIsCompleted) {
        console.log(`  ⚠️  问题: 应该完成但未标记为完成！`);
      } else if (taskIsCompleted && !shouldBeCompleted) {
        console.log(`  ⚠️  问题: 不应该完成但已标记为完成！`);
      } else if (shouldBeCompleted && taskIsCompleted) {
        console.log(`  ✅ 正确: 任务状态正确！`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('测试完成');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行测试
testTaskCompletionUpdate().catch(console.error);

