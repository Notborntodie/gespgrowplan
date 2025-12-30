require('dotenv').config();
const { pool } = require('../config/database');
const { fixPlanProgressFromFreePractice } = require('./fix_plan_progress_from_free_practice');

/**
 * 批量纠正所有用户的完成状态脚本
 * 功能：根据自由练习的提交记录，更新所有用户的任务和计划完成状态
 * 
 * 使用方法:
 *   node scripts/fix_all_users_progress.js
 */
async function fixAllUsersProgress() {
  const connection = await pool.getConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('开始批量更新所有用户的完成状态');
    console.log('='.repeat(80));
    console.log();
    
    // 1. 获取所有用户
    const [users] = await connection.execute(`
      SELECT id, username, real_name
      FROM users
      ORDER BY id
    `);
    
    if (users.length === 0) {
      console.log('⚠️  系统中没有用户');
      return;
    }
    
    console.log(`✅ 找到 ${users.length} 个用户`);
    console.log();
    
    connection.release();
    
    // 2. 对每个用户更新完成状态（批量处理时不关闭连接池）
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log('\n' + '='.repeat(80));
      console.log(`[${i + 1}/${users.length}] 处理用户: ${user.username} (ID: ${user.id}, 姓名: ${user.real_name || '未设置'})`);
      console.log('='.repeat(80));
      
      try {
        // 批量处理时不关闭连接池
        await fixPlanProgressFromFreePractice(user.username, false);
        results.push({
          user_id: user.id,
          username: user.username,
          status: 'success'
        });
        successCount++;
        console.log(`✅ 用户 ${user.username} 更新成功`);
      } catch (error) {
        results.push({
          user_id: user.id,
          username: user.username,
          status: 'failed',
          error: error.message
        });
        failCount++;
        console.error(`❌ 用户 ${user.username} 更新失败:`, error.message);
      }
    }
    
    // 3. 输出汇总信息
    console.log('\n' + '='.repeat(80));
    console.log('批量更新汇总');
    console.log('='.repeat(80));
    console.log(`总用户数: ${users.length}`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log();
    
    if (failCount > 0) {
      console.log('失败的用户列表:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.username} (ID: ${r.user_id}): ${r.error}`);
      });
      console.log();
    }
    
    // 统计加入计划的用户数
    const usersWithPlans = results.filter(r => r.status === 'success').length;
    console.log(`加入学习计划的用户数: ${usersWithPlans}`);
    
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
  fixAllUsersProgress()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixAllUsersProgress };

