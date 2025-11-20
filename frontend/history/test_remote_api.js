import axios from 'axios';

// 远程API基础URL
const BASE_URL = 'http://106.14.143.27:3000/api';

// 测试配置
const testConfig = {
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
};

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试函数
async function testAPI(endpoint, method = 'GET', data = null, description = '') {
  try {
    log(`\n🔍 测试: ${description || `${method} ${endpoint}`}`, 'blue');
    
    const config = {
      ...testConfig,
      method,
      url: `${BASE_URL}${endpoint}`
    };
    
    if (data) {
      config.data = data;
    }
    
    const startTime = Date.now();
    const response = await axios(config);
    const endTime = Date.now();
    
    log(`✅ 成功 (${endTime - startTime}ms)`, 'green');
    log(`   状态码: ${response.status}`, 'green');
    log(`   响应大小: ${JSON.stringify(response.data).length} 字符`, 'green');
    
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data)) {
        log(`   返回数组长度: ${response.data.length}`, 'green');
      } else {
        log(`   返回对象键数: ${Object.keys(response.data).length}`, 'green');
      }
    }
    
    return { success: true, data: response.data, time: endTime - startTime };
  } catch (error) {
    log(`❌ 失败`, 'red');
    if (error.response) {
      log(`   状态码: ${error.response.status}`, 'red');
      log(`   错误信息: ${error.response.data?.message || error.response.statusText}`, 'red');
    } else if (error.request) {
      log(`   网络错误: ${error.message}`, 'red');
    } else {
      log(`   其他错误: ${error.message}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始测试远程API连接', 'yellow');
  log(`📍 目标服务器: ${BASE_URL}`, 'yellow');
  log(`⏰ 开始时间: ${new Date().toLocaleString()}`, 'yellow');
  
  const results = [];
  
  // 1. 测试服务器连接
  log('\n📡 测试1: 服务器连接测试', 'yellow');
  results.push(await testAPI('/health', 'GET', null, '健康检查'));
  
  // 2. 测试用户相关API
  log('\n👤 测试2: 用户相关API', 'yellow');
  results.push(await testAPI('/login', 'POST', {
    username: 'test_user',
    password: 'test_password'
  }, '登录API'));
  
  results.push(await testAPI('/register', 'POST', {
    username: 'test_user',
    password: 'test_password',
    email: 'test@example.com'
  }, '注册API'));
  
  // 3. 测试考试相关API
  log('\n📝 测试3: 考试相关API', 'yellow');
  results.push(await testAPI('/exams', 'GET', null, '获取考试列表'));
  results.push(await testAPI('/exams?level=5', 'GET', null, '获取5级考试'));
  results.push(await testAPI('/available-questions', 'GET', null, '获取可用题目'));
  results.push(await testAPI('/available-questions?level=5', 'GET', null, '获取5级可用题目'));
  
  // 4. 测试题目相关API
  log('\n❓ 测试4: 题目相关API', 'yellow');
  results.push(await testAPI('/questions', 'GET', null, '获取题目列表'));
  results.push(await testAPI('/knowledge-points', 'GET', null, '获取知识点列表'));
  
  // 5. 测试提交相关API
  log('\n📊 测试5: 提交相关API', 'yellow');
  results.push(await testAPI('/submissions', 'GET', null, '获取提交记录'));
  
  // 6. 测试图片上传API
  log('\n🖼️ 测试6: 图片上传API', 'yellow');
  results.push(await testAPI('/upload-image', 'POST', {
    // 模拟图片数据
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }, '图片上传API'));
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  log('\n📊 测试结果统计', 'yellow');
  log(`总测试数: ${totalCount}`, 'blue');
  log(`成功数: ${successCount}`, 'green');
  log(`失败数: ${totalCount - successCount}`, 'red');
  log(`成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  // 详细结果
  log('\n📋 详细结果:', 'yellow');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} 测试${index + 1}: ${result.success ? '成功' : '失败'}`, color);
  });
  
  // 性能统计
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, test) => sum + test.time, 0) / successfulTests.length;
    log(`\n⚡ 平均响应时间: ${avgTime.toFixed(0)}ms`, 'blue');
  }
  
  log(`\n⏰ 结束时间: ${new Date().toLocaleString()}`, 'yellow');
  
  return {
    total: totalCount,
    success: successCount,
    failure: totalCount - successCount,
    successRate: parseFloat(successRate)
  };
}

// 运行测试
runTests()
  .then(results => {
    if (results.successRate >= 80) {
      log('\n🎉 API测试完成！大部分API工作正常', 'green');
      process.exit(0);
    } else {
      log('\n⚠️ API测试完成，但存在一些问题', 'yellow');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  });

export { runTests, testAPI };
