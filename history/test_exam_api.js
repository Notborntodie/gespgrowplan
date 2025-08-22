const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testExamAPI() {
  console.log('🚀 开始测试考试API...\n');
  
  try {
    // 1. 测试获取考试列表
    console.log('1. 测试获取考试列表...');
    const examsResponse = await axios.get(`${BASE_URL}/exams`);
    console.log(`   找到 ${examsResponse.data.length} 个考试`);
    console.log('   考试列表:', examsResponse.data.map(exam => ({
      id: exam.id,
      name: exam.name,
      level: exam.level,
      question_count: exam.question_count
    })));
    
    if (examsResponse.data.length === 0) {
      console.log('⚠️ 没有考试数据，跳过详情测试');
      return;
    }
    
    // 2. 测试获取第一个考试的详情
    const firstExam = examsResponse.data[0];
    console.log(`\n2. 测试获取考试详情 (ID: ${firstExam.id})...`);
    const examDetailResponse = await axios.get(`${BASE_URL}/exams/${firstExam.id}`);
    console.log(`   考试名称: ${examDetailResponse.data.exam.name}`);
    console.log(`   题目数量: ${examDetailResponse.data.questions.length}`);
    console.log(`   题目详情:`, examDetailResponse.data.questions.map(q => ({
      id: q.id,
      question_number: q.question_number,
      question_text: q.question_text?.substring(0, 50) + '...'
    })));
    
    console.log('\n✅ 考试API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请确保后端服务器正在运行 (node index.js)');
    }
  }
}

testExamAPI();

