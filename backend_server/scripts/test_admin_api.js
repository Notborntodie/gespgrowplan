const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000/api';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`测试: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function runTests() {
  log('\n开始测试管理员专用API...', 'yellow');
  
  try {
    // 首先获取所有计划，选择一个测试
    logTest('准备：获取所有学习计划');
    const allPlansResponse = await axios.get(`${BASE_URL}/learning-plans/all`);
    
    if (allPlansResponse.data.data.length === 0) {
      logError('没有找到学习计划，无法进行测试');
      return;
    }
    
    // 选择第一个有任务的计划进行测试
    let testPlan = allPlansResponse.data.data.find(p => p.total_tasks > 0);
    if (!testPlan) {
      testPlan = allPlansResponse.data.data[0];
    }
    
    logSuccess(`找到测试计划: ${testPlan.name}`);
    logInfo(`计划ID: ${testPlan.id}`);
    logInfo(`任务数: ${testPlan.total_tasks}`);
    logInfo(`客观题数: ${testPlan.total_exams}`);
    logInfo(`OJ题目数: ${testPlan.total_oj_problems}`);
    
    const testPlanId = testPlan.id;
    
    // ==================== 测试1: 获取学习计划完整信息 ====================
    logTest('1. 获取学习计划完整信息（管理员API）');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/${testPlanId}/admin`);
      
      logSuccess('API调用成功');
      const data = response.data.data;
      
      logInfo(`计划名称: ${data.name}`);
      logInfo(`计划描述: ${data.description || '无'}`);
      logInfo(`等级: ${data.level || '未设置'}`);
      logInfo(`状态: ${data.is_active ? '激活' : '停用'}`);
      logInfo(`开始时间: ${data.start_time}`);
      logInfo(`结束时间: ${data.end_time}`);
      logInfo(`任务总数: ${data.tasks.length}`);
      
      console.log('\n完整的计划信息:');
      console.log(JSON.stringify(data, null, 2));
      
      // 显示任务详情
      if (data.tasks.length > 0) {
        console.log('\n任务详细信息:');
        data.tasks.forEach((task, index) => {
          console.log(`\n--- 任务 ${index + 1}: ${task.name} ---`);
          console.log(`  任务ID: ${task.id}`);
          console.log(`  描述: ${task.description || '无'}`);
          console.log(`  顺序: ${task.task_order}`);
          console.log(`  开始时间: ${task.start_time}`);
          console.log(`  结束时间: ${task.end_time}`);
          console.log(`  复习内容: ${task.review_content ? (task.review_content.substring(0, 50) + '...') : '无'}`);
          console.log(`  复习视频: ${task.review_video_url || '无'}`);
          
          // 客观题列表
          if (task.exams && task.exams.length > 0) {
            console.log(`\n  📝 客观题列表 (${task.exams.length}个):`);
            task.exams.forEach((exam, i) => {
              console.log(`    ${i + 1}. [ID:${exam.exam_id}] ${exam.exam_name}`);
              console.log(`       等级: ${exam.exam_level || '未设置'}, 类型: ${exam.exam_type || '未设置'}, 题数: ${exam.total_questions}`);
              console.log(`       顺序: ${exam.exam_order}`);
            });
          } else {
            console.log(`\n  📝 客观题: 无`);
          }
          
          // OJ题目列表
          if (task.oj_problems && task.oj_problems.length > 0) {
            console.log(`\n  💻 OJ题目列表 (${task.oj_problems.length}个):`);
            task.oj_problems.forEach((problem, i) => {
              console.log(`    ${i + 1}. [ID:${problem.problem_id}] ${problem.problem_title}`);
              console.log(`       等级: ${problem.problem_level || '未设置'}, 时间限制: ${problem.time_limit}ms, 内存限制: ${problem.memory_limit}KB`);
              console.log(`       顺序: ${problem.problem_order}`);
            });
          } else {
            console.log(`\n  💻 OJ题目: 无`);
          }
        });
      } else {
        console.log('\n该计划暂时没有任务');
      }
      
      // 统计信息
      console.log('\n=== 统计信息 ===');
      const totalExams = data.tasks.reduce((sum, task) => sum + (task.exams ? task.exams.length : 0), 0);
      const totalProblems = data.tasks.reduce((sum, task) => sum + (task.oj_problems ? task.oj_problems.length : 0), 0);
      console.log(`总任务数: ${data.tasks.length}`);
      console.log(`总客观题数: ${totalExams}`);
      console.log(`总OJ题目数: ${totalProblems}`);
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // ==================== 测试2: 获取不存在的计划 ====================
    logTest('2. 测试错误情况 - 获取不存在的计划');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/99999/admin`);
      
      logError('应该返回404错误，但请求成功了！');
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('正确返回404错误');
        logInfo(`错误信息: ${error.response.data.error}`);
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      } else {
        logError(`意外的错误: ${error.message}`);
      }
    }
    
    // ==================== 测试3: 测试其他计划 ====================
    if (allPlansResponse.data.data.length > 1) {
      const anotherPlan = allPlansResponse.data.data[1];
      
      logTest(`3. 获取另一个计划: ${anotherPlan.name}`);
      try {
        const response = await axios.get(`${BASE_URL}/learning-plans/${anotherPlan.id}/admin`);
        
        logSuccess('API调用成功');
        const data = response.data.data;
        
        logInfo(`计划名称: ${data.name}`);
        logInfo(`任务数: ${data.tasks.length}`);
        
        if (data.tasks.length > 0) {
          console.log('\n任务列表:');
          data.tasks.forEach((task, index) => {
            const examCount = task.exams ? task.exams.length : 0;
            const problemCount = task.oj_problems ? task.oj_problems.length : 0;
            console.log(`  ${index + 1}. ${task.name} (客观题:${examCount}, OJ题:${problemCount})`);
          });
        } else {
          logInfo('该计划没有任务');
        }
        
      } catch (error) {
        logError(`请求失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }
    
    // ==================== 测试总结 ====================
    console.log('\n' + '='.repeat(60));
    log('测试完成！', 'yellow');
    console.log('='.repeat(60));
    
    logInfo('所有API测试已完成');
    logInfo('管理员API可以获取完整的计划和任务信息，包括：');
    console.log('  - 计划基本信息');
    console.log('  - 所有任务详情');
    console.log('  - 每个任务的客观题列表（含详细信息）');
    console.log('  - 每个任务的OJ题目列表（含详细信息）');
    console.log('  - 无需用户ID，无需用户权限检查');
    console.log('  - 适合管理员查看和编辑使用');
    
  } catch (error) {
    logError(`测试过程出错: ${error.message}`);
    console.error(error);
  }
}

// 运行测试
runTests();

