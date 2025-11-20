import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🔍 测试修复后的上传API...\n');

async function testUploadAPIs() {
  const tests = [
    {
      name: '单题上传API',
      url: '/upload-question',
      method: 'POST',
      data: {
        question_text: '测试题目 - 修复后测试',
        correct_answer: 'A',
        level: 1,
        difficulty: 'easy',
        explanation: '这是一个测试题目'
      }
    },
    {
      name: '批量上传API',
      url: '/upload-questions-batch',
      method: 'POST',
      data: {
        questions: [
          {
            question_text: '批量测试题目1',
            correct_answer: 'B',
            level: 1,
            difficulty: 'easy'
          },
          {
            question_text: '批量测试题目2',
            correct_answer: 'C',
            level: 2,
            difficulty: 'medium'
          }
        ]
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        data: test.data,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const endTime = Date.now();
      
      console.log(`✅ 成功 (${endTime - startTime}ms) - 状态码: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      
    } catch (error) {
      console.log(`❌ 失败 - ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    console.log('');
  }
}

testUploadAPIs().catch(console.error);
