const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testExamAPI() {
  console.log('🚀 开始测试考试管理API...\n');
  
  try {
    // 1. 获取可用题目
    console.log('1. 获取可用题目...');
    const questions = await axios.get(`${BASE_URL}/available-questions?level=5`);
    console.log(`   找到 ${questions.data.length} 个5级题目`);
    
    if (questions.data.length === 0) {
      console.log('❌ 没有可用题目，无法继续测试');
      return;
    }
    
    // 2. 获取现有考试
    console.log('\n2. 获取现有考试...');
    const exams = await axios.get(`${BASE_URL}/exams`);
    console.log(`   现有 ${exams.data.length} 个考试`);
    
    // 3. 创建新考试
    console.log('\n3. 创建新考试...');
    const questionIds = questions.data.slice(0, 2).map(q => q.id);
    const newExam = {
      name: 'API测试考试',
      level: 5,
      description: '用于测试API的考试',
      question_ids: questionIds.map((id, index) => ({
        id: id,
        question_number: index + 1
      }))
    };
    
    const createResult = await axios.post(`${BASE_URL}/exams`, newExam);
    const examId = createResult.data.examId;
    console.log(`   创建成功，考试ID: ${examId}`);
    
    // 4. 获取考试详情
    console.log('\n4. 获取考试详情...');
    const examDetail = await axios.get(`${BASE_URL}/exams/${examId}`);
    console.log(`   考试名称: ${examDetail.data.exam.name}`);
    console.log(`   题目数量: ${examDetail.data.questions.length}`);
    
    // 5. 更新考试
    console.log('\n5. 更新考试...');
    const updateData = {
      name: 'API测试考试（已更新）',
      description: '更新后的测试考试'
    };
    
    await axios.put(`${BASE_URL}/exams/${examId}`, updateData);
    console.log('   更新成功');
    
    // 6. 删除考试
    console.log('\n6. 删除考试...');
    await axios.delete(`${BASE_URL}/exams/${examId}`);
    console.log('   删除成功');
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testExamAPI();
