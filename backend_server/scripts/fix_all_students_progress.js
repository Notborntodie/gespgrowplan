require('dotenv').config();
const { pool } = require('../config/database');
const { fixPlanProgressFromFreePractice } = require('./fix_plan_progress_from_free_practice');

/**
 * 批量纠正所有学生的完成状态脚本
 * 功能：根据自由练习的提交记录，更新指定老师绑定的所有学生的任务和计划完成状态
 * 
 * 使用方法:
 *   node scripts/fix_all_students_progress.js <teacher_username>
 *   例如: node scripts/fix_all_students_progress.js czy
 */
async function fixAllStudentsProgress(teacherUsername) {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log(`开始批量更新老师 ${teacherUsername} 绑定的所有学生的完成状态`);
    console.log('='.repeat(80));
    console.log();
    
    // 1. 查找老师
    const [teachers] = await connection.execute(
      'SELECT id, username, real_name FROM users WHERE username = ?',
      [teacherUsername]
    );
    
    if (teachers.length === 0) {
      console.log(`❌ 未找到老师: ${teacherUsername}`);
      return;
    }
    
    const teacher = teachers[0];
    console.log(`✅ 找到老师: ${teacher.username} (ID: ${teacher.id}, 姓名: ${teacher.real_name || '未设置'})`);
    console.log();
    
    // 2. 查找老师绑定的所有学生
    const [students] = await connection.execute(`
      SELECT DISTINCT u.id, u.username, u.real_name
      FROM users u
      JOIN teacher_students ts ON u.id = ts.student_id
      WHERE ts.teacher_id = ?
      ORDER BY u.username
    `, [teacher.id]);
    
    if (students.length === 0) {
      console.log(`⚠️  老师 ${teacherUsername} 没有绑定任何学生`);
      return;
    }
    
    console.log(`✅ 找到 ${students.length} 个学生:`);
    students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.username} (ID: ${student.id}, 姓名: ${student.real_name || '未设置'})`);
    });
    console.log();
    
    // 3. 对每个学生更新完成状态（批量处理时不关闭连接池）
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      console.log('\n' + '='.repeat(80));
      console.log(`[${i + 1}/${students.length}] 处理学生: ${student.username} (ID: ${student.id})`);
      console.log('='.repeat(80));
      
      try {
        // 批量处理时不关闭连接池
        await fixPlanProgressFromFreePractice(student.username, false);
        results.push({
          student_id: student.id,
          username: student.username,
          status: 'success'
        });
        successCount++;
        console.log(`✅ 学生 ${student.username} 更新成功`);
      } catch (error) {
        results.push({
          student_id: student.id,
          username: student.username,
          status: 'failed',
          error: error.message
        });
        failCount++;
        console.error(`❌ 学生 ${student.username} 更新失败:`, error.message);
      }
    }
    
    connection.release();
    
    // 4. 输出汇总信息
    console.log('\n' + '='.repeat(80));
    console.log('批量更新汇总');
    console.log('='.repeat(80));
    console.log(`总学生数: ${students.length}`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log();
    
    if (failCount > 0) {
      console.log('失败的学生列表:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.username}: ${r.error}`);
      });
    }
    
    console.log('='.repeat(80));
    console.log('批量更新完成！');
    console.log('='.repeat(80));
    
    // 最后关闭连接池
    await pool.end();
    
    return results;
    
  } catch (error) {
    console.error('❌ 批量更新失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 执行脚本
if (require.main === module) {
  const teacherUsername = process.argv[2];
  
  if (!teacherUsername) {
    console.error('❌ 错误: 请提供老师用户名');
    console.log('使用方法: node scripts/fix_all_students_progress.js <teacher_username>');
    console.log('示例: node scripts/fix_all_students_progress.js czy');
    process.exit(1);
  }
  
  fixAllStudentsProgress(teacherUsername)
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixAllStudentsProgress };

