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

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function runTests() {
  log('\n开始测试教师查看学生提交记录API...', 'yellow');
  
  // 配置测试参数（根据数据库查询结果自动配置）
  const TEST_CONFIG = {
    teacherId: 51,        // 教师ID: xiangj
    studentId: 141,        // 学生ID: 孙钒庭
    examId: 53,          // 考试ID: 位运算专项训练
    submissionId: 142     // 提交记录ID
  };
  
  logInfo(`测试配置:`);
  logInfo(`  教师ID: ${TEST_CONFIG.teacherId}`);
  logInfo(`  学生ID: ${TEST_CONFIG.studentId}`);
  logInfo(`  考试ID: ${TEST_CONFIG.examId}`);
  logInfo(`  提交记录ID: ${TEST_CONFIG.submissionId}`);
  logWarning('提示: 如果测试失败，请检查数据库中是否存在对应的绑定关系和提交记录');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // ==================== 测试1: 获取老师绑定学生的全部提交记录 ====================
  logTest('1. 获取老师绑定学生的全部提交记录（所有学生）');
  testResults.total++;
  try {
    const url = `${BASE_URL}/teacher/${TEST_CONFIG.teacherId}/submissions-list`;
    logInfo(`请求URL: ${url}`);
    
    const response = await axios.get(url);
    
    logSuccess('API调用成功');
    logInfo(`状态码: ${response.status}`);
    
    if (Array.isArray(response.data)) {
      logSuccess(`返回数据是数组，包含 ${response.data.length} 条记录`);
      
      if (response.data.length > 0) {
        logInfo('\n前3条记录预览:');
        response.data.slice(0, 3).forEach((record, index) => {
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  ID: ${record.id}`);
          console.log(`  用户ID: ${record.user_id}`);
          console.log(`  用户名: ${record.username || '未知'}`);
          console.log(`  真实姓名: ${record.real_name || '未知'}`);
          console.log(`  考试ID: ${record.exam_id}`);
          console.log(`  考试名称: ${record.exam_name || '未知'}`);
          console.log(`  考试等级: ${record.exam_level || '未知'}`);
          console.log(`  得分: ${record.score}`);
          console.log(`  尝试次数: ${record.attempt_number}`);
          console.log(`  提交时间: ${record.submit_time}`);
        });
        
        // 保存第一条记录的ID用于后续测试
        if (response.data[0].id) {
          TEST_CONFIG.submissionId = response.data[0].id;
          TEST_CONFIG.studentId = response.data[0].user_id;
          logInfo(`\n使用第一条提交记录的ID (${TEST_CONFIG.submissionId}) 和学生ID (${TEST_CONFIG.studentId}) 进行后续测试`);
        }
      } else {
        logWarning('返回的记录列表为空');
      }
      
      testResults.passed++;
    } else {
      logError('返回数据格式不正确，期望是数组');
      testResults.failed++;
    }
  } catch (error) {
    if (error.response) {
      logError(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      logError(`错误信息: ${error.response.data?.error || error.response.data?.message || '未知错误'}`);
    } else {
      logError(`请求失败: ${error.message}`);
    }
    testResults.failed++;
  }
  
  // ==================== 测试2: 获取学生全部提交记录（带exam_id过滤） ====================
  logTest('2. 获取学生全部提交记录（带exam_id过滤）');
  testResults.total++;
  try {
    const url = `${BASE_URL}/teacher/${TEST_CONFIG.teacherId}/submissions-list?exam_id=${TEST_CONFIG.examId}`;
    logInfo(`请求URL: ${url}`);
    
    const response = await axios.get(url);
    
    logSuccess('API调用成功');
    logInfo(`状态码: ${response.status}`);
    
    if (Array.isArray(response.data)) {
      logSuccess(`返回数据是数组，包含 ${response.data.length} 条记录`);
      logInfo(`过滤条件: exam_id = ${TEST_CONFIG.examId}`);
      
      // 验证所有记录都是指定考试的
      const allMatchExam = response.data.every(record => record.exam_id === TEST_CONFIG.examId);
      if (allMatchExam) {
        logSuccess('所有记录都匹配过滤条件');
      } else {
        logWarning('部分记录不匹配过滤条件');
      }
      
      testResults.passed++;
    } else {
      logError('返回数据格式不正确，期望是数组');
      testResults.failed++;
    }
  } catch (error) {
    if (error.response) {
      logError(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      logError(`错误信息: ${error.response.data?.error || error.response.data?.message || '未知错误'}`);
    } else {
      logError(`请求失败: ${error.message}`);
    }
    testResults.failed++;
  }
  
  // ==================== 测试2.5: 获取学生全部提交记录（带student_id过滤） ====================
  logTest('2.5. 获取学生全部提交记录（带student_id过滤）');
  testResults.total++;
  try {
    if (!TEST_CONFIG.studentId) {
      logWarning('没有可用的学生ID，跳过此测试');
      testResults.total--;
      testResults.failed++;
    } else {
      const url = `${BASE_URL}/teacher/${TEST_CONFIG.teacherId}/submissions-list?student_id=${TEST_CONFIG.studentId}`;
      logInfo(`请求URL: ${url}`);
      
      const response = await axios.get(url);
      
      logSuccess('API调用成功');
      logInfo(`状态码: ${response.status}`);
      
      if (Array.isArray(response.data)) {
        logSuccess(`返回数据是数组，包含 ${response.data.length} 条记录`);
        logInfo(`过滤条件: student_id = ${TEST_CONFIG.studentId}`);
        
        // 验证所有记录都是指定学生的
        const allMatchStudent = response.data.every(record => record.user_id === TEST_CONFIG.studentId);
        if (allMatchStudent) {
          logSuccess('所有记录都匹配过滤条件');
        } else {
          logWarning('部分记录不匹配过滤条件');
        }
        
        testResults.passed++;
      } else {
        logError('返回数据格式不正确，期望是数组');
        testResults.failed++;
      }
    }
  } catch (error) {
    if (error.response) {
      logError(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      logError(`错误信息: ${error.response.data?.error || error.response.data?.message || '未知错误'}`);
    } else {
      logError(`请求失败: ${error.message}`);
    }
    testResults.failed++;
  }
  
  // ==================== 测试3: 获取单次提交的详细答案 ====================
  logTest('3. 获取单次提交的详细答案');
  testResults.total++;
  try {
    if (!TEST_CONFIG.submissionId) {
      logWarning('没有可用的提交记录ID，跳过此测试');
      testResults.total--;
      testResults.failed++;
    } else {
      const url = `${BASE_URL}/teacher/${TEST_CONFIG.teacherId}/students/${TEST_CONFIG.studentId}/submissions/${TEST_CONFIG.submissionId}`;
      logInfo(`请求URL: ${url}`);
      
      const response = await axios.get(url);
      
      logSuccess('API调用成功');
      logInfo(`状态码: ${response.status}`);
      
      if (response.data && response.data.submission && response.data.answers) {
        logSuccess('返回数据结构正确');
        
        const { submission, answers } = response.data;
        
        logInfo('\n提交基本信息:');
        console.log(`  ID: ${submission.id}`);
        console.log(`  用户ID: ${submission.user_id}`);
        console.log(`  用户名: ${submission.username || '未知'}`);
        console.log(`  考试ID: ${submission.exam_id}`);
        console.log(`  考试名称: ${submission.exam_name || '未知'}`);
        console.log(`  考试等级: ${submission.exam_level || '未知'}`);
        console.log(`  得分: ${submission.score}`);
        console.log(`  尝试次数: ${submission.attempt_number}`);
        console.log(`  提交时间: ${submission.submit_time}`);
        
        logInfo(`\n答题详情: 共 ${answers.length} 道题`);
        
        if (answers.length > 0) {
          logInfo('\n前3道题预览:');
          answers.slice(0, 3).forEach((answer, index) => {
            console.log(`\n题目 ${index + 1}:`);
            console.log(`  题目ID: ${answer.question_id}`);
            console.log(`  题目序号: ${answer.question_number}`);
            console.log(`  题目类型: ${answer.question_type || '未知'}`);
            console.log(`  难度: ${answer.difficulty || '未知'}`);
            console.log(`  等级: ${answer.level || '未知'}`);
            console.log(`  用户答案: ${answer.user_answer || '未作答'}`);
            console.log(`  正确答案: ${answer.correct_answer || '未知'}`);
            console.log(`  是否正确: ${answer.is_correct ? '✓' : '✗'}`);
            console.log(`  选项数量: ${answer.options?.length || 0}`);
            
            if (answer.options && answer.options.length > 0) {
              console.log(`  选项预览:`);
              answer.options.slice(0, 3).forEach(opt => {
                console.log(`    ${opt.label}: ${opt.text || opt.value}`);
              });
            }
          });
        }
        
        testResults.passed++;
      } else {
        logError('返回数据格式不正确，期望包含 submission 和 answers 字段');
        console.log('实际返回:', JSON.stringify(response.data, null, 2));
        testResults.failed++;
      }
    }
  } catch (error) {
    if (error.response) {
      logError(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      logError(`错误信息: ${error.response.data?.error || error.response.data?.message || '未知错误'}`);
      
      if (error.response.status === 403) {
        logWarning('返回403，可能是教师-学生绑定关系不存在');
      } else if (error.response.status === 404) {
        logWarning('返回404，可能是提交记录不存在');
      }
    } else {
      logError(`请求失败: ${error.message}`);
    }
    testResults.failed++;
  }
  
  // ==================== 测试4: 权限验证测试（无效的绑定关系） ====================
  logTest('4. 权限验证测试（使用无效的绑定关系查看详细提交记录）');
  testResults.total++;
  try {
    // 使用一个不存在的绑定关系进行测试
    const invalidTeacherId = 99999;
    const invalidStudentId = 99999;
    const invalidSubmissionId = 1;
    
    const url = `${BASE_URL}/teacher/${invalidTeacherId}/students/${invalidStudentId}/submissions/${invalidSubmissionId}`;
    logInfo(`请求URL: ${url}`);
    logInfo('预期: 应该返回403错误（没有权限）');
    
    await axios.get(url);
    
    // 如果没有抛出错误，说明权限验证失败
    logError('权限验证失败：应该返回403错误');
    testResults.failed++;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      logSuccess('权限验证正常：返回403错误');
      logInfo(`错误信息: ${error.response.data?.error || '未知错误'}`);
      testResults.passed++;
    } else if (error.response) {
      logWarning(`返回状态码: ${error.response.status}（期望是403）`);
      logInfo(`错误信息: ${error.response.data?.error || error.response.data?.message || '未知错误'}`);
      testResults.failed++;
    } else {
      logError(`请求失败: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // ==================== 测试总结 ====================
  console.log('\n' + '='.repeat(60));
  log('测试总结', 'cyan');
  console.log('='.repeat(60));
  log(`总测试数: ${testResults.total}`, 'blue');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');
  log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
      testResults.failed === 0 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查上面的错误信息', 'yellow');
  }
  
  console.log('\n');
}

// 运行测试
runTests().catch(error => {
  logError(`测试执行出错: ${error.message}`);
  console.error(error);
  process.exit(1);
});

