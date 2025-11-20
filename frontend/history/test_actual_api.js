import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🔍 测试实际后端API...\n');

async function testActualAPI() {
  const results = [];
  
  // 基于实际后端代码的API测试
  const tests = [
    {
      name: '健康检查',
      url: '/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '注册API',
      url: '/register',
      method: 'POST',
      data: {
        username: 'test_user_' + Date.now(),
        password: 'test_password'
      },
      expectedStatus: 200
    },
    {
      name: '登录API',
      url: '/login',
      method: 'POST',
      data: {
        username: 'test_user',
        password: 'test_password'
      },
      expectedStatus: 401 // 预期失败，因为用户不存在
    },
    {
      name: '获取考试列表',
      url: '/exams',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '获取题目列表',
      url: '/questions',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '获取知识点列表',
      url: '/knowledge-points',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '获取考试详情',
      url: '/exam/1',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '上传题目',
      url: '/upload-question',
      method: 'POST',
      data: {
        question_text: '测试题目',
        correct_answer: 'A',
        level: 1,
        difficulty: 'easy'
      },
      expectedStatus: 200
    },
    {
      name: '批量上传题目',
      url: '/upload-questions-batch',
      method: 'POST',
      data: {
        questions: [{
          question_text: '批量测试题目',
          correct_answer: 'B',
          level: 1,
          difficulty: 'easy'
        }]
      },
      expectedStatus: 200
    },
    {
      name: '添加知识点',
      url: '/knowledge-points',
      method: 'POST',
      data: {
        name: '测试知识点',
        description: '测试描述',
        category: 'data_structure',
        level: 1
      },
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();
      
      const isSuccess = response.status === test.expectedStatus;
      const statusColor = isSuccess ? 'green' : 'yellow';
      
      console.log(`✅ 成功 (${endTime - startTime}ms) - 状态码: ${response.status}`);
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   返回数组，长度: ${response.data.length}`);
        } else {
          console.log(`   返回对象，键数: ${Object.keys(response.data).length}`);
        }
      }
      
      results.push({
        name: test.name,
        success: true,
        status: response.status,
        time: endTime - startTime,
        data: response.data
      });
      
    } catch (error) {
      const isExpectedError = error.response && error.response.status === test.expectedStatus;
      const statusColor = isExpectedError ? 'yellow' : 'red';
      
      if (isExpectedError) {
        console.log(`⚠️ 预期错误 (${test.expectedStatus}) - ${error.response.data?.message || error.message}`);
        results.push({
          name: test.name,
          success: true, // 预期错误也算成功
          status: error.response.status,
          time: 0,
          error: error.response.data?.message || error.message
        });
      } else {
        console.log(`❌ 失败 - ${error.message}`);
        if (error.response) {
          console.log(`   状态码: ${error.response.status}`);
          console.log(`   错误信息: ${error.response.data?.message || error.response.statusText}`);
        }
        results.push({
          name: test.name,
          success: false,
          status: error.response?.status || 'NETWORK_ERROR',
          time: 0,
          error: error.message
        });
      }
    }
    console.log('');
  }

  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);

  console.log('📊 测试结果统计:');
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功数: ${successCount}`);
  console.log(`失败数: ${totalCount - successCount}`);
  console.log(`成功率: ${successRate}%`);

  // 详细结果
  console.log('\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    console.log(`${status} ${result.name}: ${result.success ? '成功' : '失败'} (${result.status})`);
  });

  // 性能统计
  const successfulTests = results.filter(r => r.success && r.time > 0);
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, test) => sum + test.time, 0) / successfulTests.length;
    console.log(`\n⚡ 平均响应时间: ${avgTime.toFixed(0)}ms`);
  }

  // 建议
  console.log('\n💡 建议:');
  if (successRate >= 80) {
    console.log('✅ 大部分API工作正常，前端应该可以正常使用');
  } else if (successRate >= 60) {
    console.log('⚠️ 部分API工作正常，建议检查失败的API');
  } else {
    console.log('❌ 大部分API存在问题，建议检查服务器配置');
  }

  return {
    total: totalCount,
    success: successCount,
    failure: totalCount - successCount,
    successRate: parseFloat(successRate)
  };
}

testActualAPI().catch(console.error);
