import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🚀 开始快速API连接测试...');
console.log(`📍 目标服务器: ${BASE_URL}\n`);

async function quickTest() {
  const tests = [
    {
      name: '获取考试列表',
      url: '/exams',
      method: 'GET'
    },
    {
      name: '获取题目列表',
      url: '/questions',
      method: 'GET'
    },
    {
      name: '获取知识点列表',
      url: '/knowledge-points',
      method: 'GET'
    },
    {
      name: '获取可用题目',
      url: '/available-questions',
      method: 'GET'
    },
    {
      name: '获取提交记录',
      url: '/submissions',
      method: 'GET'
    }
  ];

  let successCount = 0;
  let totalCount = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 5000
      });
      const endTime = Date.now();
      
      console.log(`✅ 成功 (${endTime - startTime}ms) - 状态码: ${response.status}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`   返回 ${response.data.length} 条记录`);
      } else if (response.data && typeof response.data === 'object') {
        console.log(`   返回对象，包含 ${Object.keys(response.data).length} 个字段`);
      }
      
      successCount++;
    } catch (error) {
      console.log(`❌ 失败 - ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
      }
    }
    console.log('');
  }

  console.log('📊 测试结果:');
  console.log(`成功: ${successCount}/${totalCount}`);
  console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有API测试通过！');
  } else if (successCount > 0) {
    console.log('⚠️ 部分API测试通过，请检查失败的API');
  } else {
    console.log('💥 所有API测试失败，请检查服务器连接');
  }
}

quickTest().catch(console.error);
