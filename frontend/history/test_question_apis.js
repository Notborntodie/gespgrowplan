import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🔍 测试题目相关API...\n');

async function testQuestionAPIs() {
  const tests = [
    {
      name: '获取题目列表',
      url: '/questions',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '获取单个题目详情',
      url: '/questions/1',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '更新题目',
      url: '/questions/1',
      method: 'PUT',
      data: {
        question_text: '更新后的测试题目',
        correct_answer: 'A',
        level: 1,
        difficulty: 'easy'
      },
      expectedStatus: 200
    },
    {
      name: '删除题目',
      url: '/questions/999', // 使用一个可能不存在的ID
      method: 'DELETE',
      expectedStatus: 404 // 预期失败，因为ID可能不存在
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
      
      console.log(`✅ 成功 (${endTime - startTime}ms) - 状态码: ${response.status}`);
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   返回数组，长度: ${response.data.length}`);
        } else {
          console.log(`   返回对象，键数: ${Object.keys(response.data).length}`);
        }
      }
      
    } catch (error) {
      const isExpectedError = error.response && error.response.status === test.expectedStatus;
      
      if (isExpectedError) {
        console.log(`⚠️ 预期错误 (${test.expectedStatus}) - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`❌ 失败 - ${error.message}`);
        if (error.response) {
          console.log(`   状态码: ${error.response.status}`);
          console.log(`   错误信息: ${error.response.data?.message || error.response.statusText}`);
        }
      }
    }
    console.log('');
  }
}

testQuestionAPIs().catch(console.error);
