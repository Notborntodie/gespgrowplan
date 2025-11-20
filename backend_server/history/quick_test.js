#!/usr/bin/env node

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000';

// 颜色函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

async function testAPI() {
  console.log(colors.blue('🚀 GESP API 快速测试'));
  console.log(`API地址: ${API_BASE}\n`);

  const tests = [
    {
      name: '健康检查',
      method: 'GET',
      url: '/health',
      data: null
    },
    {
      name: '获取考试列表',
      method: 'GET',
      url: '/api/exams',
      data: null
    },
    {
      name: '获取题目列表',
      method: 'GET',
      url: '/api/questions',
      data: null
    },
    {
      name: '获取知识点列表',
      method: 'GET',
      url: '/api/knowledge-points',
      data: null
    },
    {
      name: '用户注册',
      method: 'POST',
      url: '/api/register',
      data: {
        username: `testuser_${Date.now()}`,
        password: 'testpass123'
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(colors.blue(`测试: ${test.name}`));
      
      const config = {
        method: test.method,
        url: `${API_BASE}${test.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      console.log(colors.green(`✅ 成功`));
      console.log(`   状态码: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      passed++;
      
    } catch (error) {
      console.log(colors.red(`❌ 失败`));
      console.log(`   错误: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      failed++;
    }
    console.log('');
  }

  // 测试远程访问
  console.log(colors.yellow('🌐 测试远程访问...'));
  try {
    const remoteResponse = await axios.get(`${API_BASE}/health`);
    console.log(colors.green('✅ 远程访问正常'));
    console.log(`   响应: ${JSON.stringify(remoteResponse.data, null, 2)}`);
  } catch (error) {
    console.log(colors.red('❌ 远程访问失败'));
    console.log(`   错误: ${error.message}`);
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log(colors.blue('📊 测试总结'));
  console.log(`总测试数: ${tests.length}`);
  console.log(colors.green(`通过: ${passed}`));
  console.log(colors.red(`失败: ${failed}`));
  console.log(`成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log(colors.green('\n🎉 所有测试通过！API运行正常'));
  } else {
    console.log(colors.yellow('\n⚠️ 部分测试失败，请检查API配置'));
  }
}

// 运行测试
testAPI().catch(error => {
  console.error(colors.red('测试执行失败:'), error.message);
  process.exit(1);
});

