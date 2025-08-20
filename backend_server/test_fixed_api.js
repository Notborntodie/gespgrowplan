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
    
    // 返回第一个知识点的ID
    if (listResponse.data.length > 0) {
      return listResponse.data[0].id;
    }
    return 1; // 默认值
    
  } catch (error) {
    console.error('知识点API测试失败:', error.response?.data || error.message);
    return 1; // 默认值
  }
}

// 测试题目上传API（使用修复版本）
async function testQuestionUpload(knowledgePointId) {
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
      knowledge_point_ids: [knowledgePointId],
      options: [
        { label: 'A', value: 'A', text: '对' },
        { label: 'B', value: 'B', text: '错' }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/upload-question-fixed`, questionData);
    console.log('题目上传成功:', response.data);
    
    // 返回题目ID供后续测试使用
    return response.data.questionId;
    
  } catch (error) {
    console.error('题目上传测试失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试更新题目API
async function testUpdateQuestion(questionId) {
  console.log('\n=== 测试更新题目API ===');
  
  if (!questionId) {
    console.log('跳过更新测试，因为没有可用的题目ID');
    return;
  }
  
  try {
    const updateData = {
      question_text: '更新后的题目：链表的存储空间物理上可以连续，也可以不连续。',
      question_type: 'text',
      correct_answer: 'A',
      explanation: '更新后的解释：对。链表的节点在内存中可以连续，也可以不连续。',
      level: 5,
      difficulty: 'hard',
      knowledge_point_ids: [1],
      options: [
        { label: 'A', value: 'A', text: '对' },
        { label: 'B', value: 'B', text: '错' },
        { label: 'C', value: 'C', text: '不确定' }
      ]
    };
    
    const response = await axios.put(`${BASE_URL}/questions/${questionId}`, updateData);
    console.log('题目更新成功:', response.data);
    
  } catch (error) {
    console.error('题目更新测试失败:', error.response?.data || error.message);
  }
}

// 测试删除题目API
async function testDeleteQuestion(questionId) {
  console.log('\n=== 测试删除题目API ===');
  
  if (!questionId) {
    console.log('跳过删除测试，因为没有可用的题目ID');
    return;
  }
  
  try {
    const response = await axios.delete(`${BASE_URL}/questions/${questionId}`);
    console.log('题目删除成功:', response.data);
    
  } catch (error) {
    console.error('题目删除测试失败:', error.response?.data || error.message);
  }
}

// 测试获取题目详情API
async function testGetQuestion(questionId) {
  console.log('\n=== 测试获取题目详情API ===');
  
  if (!questionId) {
    console.log('跳过获取详情测试，因为没有可用的题目ID');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/questions/${questionId}`);
    console.log('题目详情:', response.data);
    
  } catch (error) {
    console.error('获取题目详情测试失败:', error.response?.data || error.message);
  }
}

// 测试批量上传题目API
async function testBatchUpload() {
  console.log('\n=== 测试批量上传题目API ===');
  
  try {
    const questionsData = {
      questions: [
        {
          exam_id: 1,
          question_text: '批量上传题目1：链表的基本操作包括哪些？',
          question_type: 'text',
          correct_answer: 'A',
          explanation: '链表的基本操作包括插入、删除、查找等。',
          level: 5,
          difficulty: 'medium',
          options: [
            { label: 'A', value: 'A', text: '插入、删除、查找' },
            { label: 'B', value: 'B', text: '只有插入和删除' },
            { label: 'C', value: 'C', text: '只有查找' }
          ]
        },
        {
          exam_id: 1,
          question_text: '批量上传题目2：双向链表的每个节点有几个指针？',
          question_type: 'text',
          correct_answer: 'B',
          explanation: '双向链表的每个节点有两个指针，分别指向前驱和后继。',
          level: 5,
          difficulty: 'easy',
          options: [
            { label: 'A', value: 'A', text: '1个' },
            { label: 'B', value: 'B', text: '2个' },
            { label: 'C', value: 'C', text: '3个' }
          ]
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/upload-questions-batch`, questionsData);
    console.log('批量上传成功:', response.data);
    
  } catch (error) {
    console.error('批量上传测试失败:', error.response?.data || error.message);
  }
}

// 测试获取上传历史API
async function testGetUploadHistory() {
  console.log('\n=== 测试获取上传历史API ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/question-uploads`);
    console.log('上传历史:', response.data);
    
  } catch (error) {
    console.error('获取上传历史测试失败:', error.response?.data || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试题目上传API...\n');
  
  // 先获取知识点ID
  const knowledgePointId = await testKnowledgePoints();
  
  // 测试单个题目上传
  const questionId = await testQuestionUpload(knowledgePointId);
  
  // 测试获取题目详情
  await testGetQuestion(questionId);
  
  // 测试更新题目
  await testUpdateQuestion(questionId);
  
  // 测试批量上传
  await testBatchUpload();
  
  // 测试获取上传历史
  await testGetUploadHistory();
  
  // 最后测试删除题目（可选，因为会删除数据）
  // await testDeleteQuestion(questionId);
  
  console.log('\n测试完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testKnowledgePoints,
  testQuestionUpload,
  testUpdateQuestion,
  testDeleteQuestion,
  testGetQuestion,
  testBatchUpload,
  testGetUploadHistory
}; 