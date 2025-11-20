const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000/api';

// 测试用户ID（请根据实际情况修改）
const TEST_USER_ID = 1;

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

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 测试变量
let testPlanId = null;
let testTaskId = null;

async function runTests() {
  log('\n开始测试学习计划API...', 'yellow');
  log(`测试用户ID: ${TEST_USER_ID}`, 'yellow');
  
  try {
    // ==================== 测试1: 获取可加入的计划列表 ====================
    logTest('1. 获取可加入的计划列表');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/available`, {
        params: { user_id: TEST_USER_ID, level: 1 }
      });
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个可加入的计划`);
      
      if (response.data.data.length > 0) {
        testPlanId = response.data.data[0].id;
        logInfo(`测试计划ID: ${testPlanId}`);
        console.log(JSON.stringify(response.data.data[0], null, 2));
      } else {
        logError('没有可加入的计划，请先运行 insert_learning_plan_test_data.js');
      }
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', error.response.data);
      }
    }
    
    await delay(500);
    
    // ==================== 测试2: 加入学习计划 ====================
    if (testPlanId) {
      logTest('2. 加入学习计划');
      try {
        const response = await axios.post(`${BASE_URL}/learning-plans/join`, {
          user_id: TEST_USER_ID,
          plan_id: testPlanId
        });
        
        logSuccess('成功加入学习计划');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        if (error.response && error.response.data.error === '您已加入该学习计划') {
          logInfo('用户已经加入该计划（正常情况）');
        } else {
          logError(`请求失败: ${error.message}`);
          if (error.response) {
            console.log('错误响应:', error.response.data);
          }
        }
      }
      
      await delay(500);
    }
    
    // ==================== 测试3: 获取我的学习计划列表 ====================
    logTest('3. 获取我的学习计划列表');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/my-plans`, {
        params: { user_id: TEST_USER_ID }
      });
      
      logSuccess('API调用成功');
      logInfo(`用户已加入 ${response.data.data.length} 个计划`);
      
      if (response.data.data.length > 0) {
        const plan = response.data.data[0];
        logInfo(`计划: ${plan.name}`);
        logInfo(`进度: ${plan.completed_tasks}/${plan.total_tasks} (${plan.progress}%)`);
        console.log(JSON.stringify(plan, null, 2));
      }
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', error.response.data);
      }
    }
    
    await delay(500);
    
    // ==================== 测试4: 获取计划的任务列表 ====================
    if (testPlanId) {
      logTest('4. 获取计划的任务列表');
      try {
        const response = await axios.get(`${BASE_URL}/learning-plans/${testPlanId}/tasks`, {
          params: { user_id: TEST_USER_ID }
        });
        
        logSuccess('API调用成功');
        logInfo(`计划名称: ${response.data.data.plan.name}`);
        logInfo(`任务总数: ${response.data.data.tasks.length}`);
        
        if (response.data.data.tasks.length > 0) {
          testTaskId = response.data.data.tasks[0].id;
          const task = response.data.data.tasks[0];
          logInfo(`第一个任务: ${task.name}`);
          logInfo(`任务ID: ${testTaskId}`);
          console.log(JSON.stringify(task, null, 2));
        }
      } catch (error) {
        logError(`请求失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', error.response.data);
        }
      }
      
      await delay(500);
    }
    
    // ==================== 测试5: 获取任务的练习列表 ====================
    if (testTaskId) {
      logTest('5. 获取任务的练习列表');
      try {
        const response = await axios.get(`${BASE_URL}/learning-tasks/${testTaskId}/exercises`, {
          params: { user_id: TEST_USER_ID }
        });
        
        logSuccess('API调用成功');
        logInfo(`任务名称: ${response.data.data.task.name}`);
        logInfo(`客观题数量: ${response.data.data.exams.length}`);
        logInfo(`OJ题目数量: ${response.data.data.oj_problems.length}`);
        
        console.log('\n任务信息:');
        console.log(JSON.stringify(response.data.data.task, null, 2));
        
        if (response.data.data.exams.length > 0) {
          console.log('\n客观题列表:');
          console.log(JSON.stringify(response.data.data.exams, null, 2));
        }
        
        if (response.data.data.oj_problems.length > 0) {
          console.log('\nOJ题目列表:');
          console.log(JSON.stringify(response.data.data.oj_problems, null, 2));
        }
      } catch (error) {
        logError(`请求失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', error.response.data);
        }
      }
      
      await delay(500);
    }
    
    // ==================== 测试6: 标记任务完成 ====================
    if (testTaskId) {
      logTest('6. 标记任务完成');
      try {
        const response = await axios.post(`${BASE_URL}/learning-tasks/${testTaskId}/complete`, {
          user_id: TEST_USER_ID
        });
        
        logSuccess('任务标记完成成功');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logError(`请求失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', error.response.data);
        }
      }
      
      await delay(500);
    }
    
    // ==================== 验证任务完成状态 ====================
    if (testPlanId) {
      logTest('验证: 再次获取计划任务列表（查看完成状态）');
      try {
        const response = await axios.get(`${BASE_URL}/learning-plans/${testPlanId}/tasks`, {
          params: { user_id: TEST_USER_ID }
        });
        
        logSuccess('API调用成功');
        const plan = response.data.data.plan;
        logInfo(`更新后的进度: ${plan.completed_tasks}/${plan.total_tasks} (${plan.progress}%)`);
        
        const completedTasks = response.data.data.tasks.filter(t => t.is_completed);
        logInfo(`已完成任务数: ${completedTasks.length}`);
        
        if (completedTasks.length > 0) {
          console.log('\n已完成的任务:');
          completedTasks.forEach(task => {
            console.log(`  - ${task.name} (完成时间: ${task.completed_at})`);
          });
        }
      } catch (error) {
        logError(`请求失败: ${error.message}`);
      }
    }
    
    // ==================== 测试总结 ====================
    console.log('\n' + '='.repeat(60));
    log('测试完成！', 'yellow');
    console.log('='.repeat(60));
    
    logInfo('所有API测试已完成');
    logInfo('请检查上方输出确认各项功能是否正常');
    
  } catch (error) {
    logError(`测试过程出错: ${error.message}`);
    console.error(error);
  }
}

// 运行测试
runTests();

