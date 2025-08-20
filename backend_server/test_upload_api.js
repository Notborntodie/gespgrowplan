const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试知识点相关API
async function testKnowledgePoints() {
  console.log('=== 测试知识点API ===');
  
  try {
    // 1. 添加知识点
    const knowledgePoint = {
      name: '链表基础',
      description: '链表的基本概念和操作',
      category: 'data_structure',
      level: 5
    };
    
    const addResponse = await axios.post(`${BASE_URL}/knowledge-points`, knowledgePoint);
    console.log('添加知识点成功:', addResponse.data);
    
    // 2. 获取知识点列表
    const listResponse = await axios.get(`${BASE_URL}/knowledge-points`);
    console.log('知识点列表:', listResponse.data);
    
  } catch (error) {
    console.error('知识点API测试失败:', error.response?.data || error.message);
  }
}

// 测试题目上传API
async function testQuestionUpload() {
  console.log('\n=== 测试题目上传API ===');
  
  try {
    const questionData = {
      exam_id: 1,
      question_text: '链表的存储空间物理上可以连续，也可以不连续。',
      question_type: 'text',
      correct_answer: 'A',
      explanation: '对。链表的节点在内存中可以连续，也可以不连续。',
      level: 5,
      difficulty: 'medium',
      knowledge_point_ids: [1], // 假设知识点ID为1
      options: [
        { label: 'A', value: 'A', text: '对' },
        { label: 'B', value: 'B', text: '错' }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/upload-question`, questionData);
    console.log('题目上传成功:', response.data);
    
  } catch (error) {
    console.error('题目上传测试失败:', error.response?.data || error.message);
  }
}

// 测试图片上传API
async function testImageUpload() {
  console.log('\n=== 测试图片上传API ===');
  
  try {
    // 这里需要实际的图片文件，暂时跳过
    console.log('图片上传测试需要实际的图片文件');
    
  } catch (error) {
    console.error('图片上传测试失败:', error.response?.data || error.message);
  }
}

// 测试获取题目详情API
async function testGetQuestion() {
  console.log('\n=== 测试获取题目详情API ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/questions/1`);
    console.log('题目详情:', response.data);
    
  } catch (error) {
    console.error('获取题目详情测试失败:', error.response?.data || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试题目上传API...\n');
  
  await testKnowledgePoints();
  await testQuestionUpload();
  await testImageUpload();
  await testGetQuestion();
  
  console.log('\n测试完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testKnowledgePoints,
  testQuestionUpload,
  testImageUpload,
  testGetQuestion
}; 