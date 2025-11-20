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
  log('\n开始测试"获取所有学习计划"API...', 'yellow');
  
  try {
    // ==================== 测试1: 获取所有学习计划（无过滤） ====================
    logTest('1. 获取所有学习计划（无过滤条件）');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/all`);
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个学习计划`);
      
      if (response.data.data.length > 0) {
        console.log('\n前3个学习计划:');
        response.data.data.slice(0, 3).forEach((plan, index) => {
          console.log(`\n${index + 1}. ${plan.name}`);
          console.log(`   - ID: ${plan.id}`);
          console.log(`   - 等级: ${plan.level || '未设置'}`);
          console.log(`   - 状态: ${plan.is_active ? '激活' : '停用'}`);
          console.log(`   - 任务数: ${plan.total_tasks}`);
          console.log(`   - 客观题数: ${plan.total_exams}`);
          console.log(`   - OJ题目数: ${plan.total_oj_problems}`);
          console.log(`   - 创建时间: ${plan.created_at}`);
        });
      } else {
        logInfo('没有找到学习计划');
      }
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // ==================== 测试2: 按等级过滤 ====================
    logTest('2. 获取所有1级学习计划');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/all`, {
        params: { level: 1 }
      });
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个1级学习计划`);
      
      if (response.data.data.length > 0) {
        console.log('\n1级学习计划列表:');
        response.data.data.forEach((plan, index) => {
          console.log(`${index + 1}. ${plan.name} (任务数: ${plan.total_tasks}, 状态: ${plan.is_active ? '激活' : '停用'})`);
        });
      }
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // ==================== 测试3: 按状态过滤（激活的） ====================
    logTest('3. 获取所有激活的学习计划');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/all`, {
        params: { is_active: 1 }
      });
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个激活的学习计划`);
      
      if (response.data.data.length > 0) {
        console.log('\n激活的学习计划:');
        response.data.data.forEach((plan, index) => {
          console.log(`${index + 1}. ${plan.name} (等级: ${plan.level || '未设置'}, 任务数: ${plan.total_tasks})`);
        });
      }
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // ==================== 测试4: 按状态过滤（停用的） ====================
    logTest('4. 获取所有停用的学习计划');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/all`, {
        params: { is_active: 0 }
      });
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个停用的学习计划`);
      
      if (response.data.data.length > 0) {
        console.log('\n停用的学习计划:');
        response.data.data.forEach((plan, index) => {
          console.log(`${index + 1}. ${plan.name} (等级: ${plan.level || '未设置'})`);
        });
      } else {
        logInfo('没有找到停用的学习计划');
      }
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // ==================== 测试5: 多条件过滤 ====================
    logTest('5. 获取所有激活的2级学习计划');
    try {
      const response = await axios.get(`${BASE_URL}/learning-plans/all`, {
        params: { 
          level: 2,
          is_active: 1
        }
      });
      
      logSuccess('API调用成功');
      logInfo(`找到 ${response.data.data.length} 个激活的2级学习计划`);
      
      if (response.data.data.length > 0) {
        console.log('\n激活的2级学习计划:');
        response.data.data.forEach((plan, index) => {
          console.log(`${index + 1}. ${plan.name}`);
          console.log(`   - 任务数: ${plan.total_tasks}`);
          console.log(`   - 客观题数: ${plan.total_exams}`);
          console.log(`   - OJ题目数: ${plan.total_oj_problems}`);
        });
      }
      
    } catch (error) {
      logError(`请求失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
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

