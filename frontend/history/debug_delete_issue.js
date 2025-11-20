import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🔍 调试删除问题...\n');

async function debugDeleteIssue() {
  try {
    // 1. 获取初始题目列表
    console.log('📊 步骤1: 获取初始题目列表');
    const initialResponse = await axios.get(`${BASE_URL}/questions`);
    const initialQuestions = initialResponse.data;
    console.log(`初始题目数量: ${initialQuestions.length}`);
    
    if (initialQuestions.length === 0) {
      console.log('❌ 没有题目可以删除，测试结束');
      return;
    }
    
    // 2. 选择第一个题目进行删除测试
    const testQuestion = initialQuestions[0];
    console.log(`\n📝 步骤2: 准备删除题目 ID: ${testQuestion.id}`);
    console.log(`题目内容: ${testQuestion.question_text?.substring(0, 50)}...`);
    
    // 3. 执行删除操作
    console.log('\n🗑️ 步骤3: 执行删除操作');
    const deleteResponse = await axios.delete(`${BASE_URL}/questions/${testQuestion.id}`);
    console.log(`删除响应:`, deleteResponse.data);
    
    // 4. 等待一秒后重新获取列表
    console.log('\n⏳ 步骤4: 等待1秒后重新获取列表');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterDeleteResponse = await axios.get(`${BASE_URL}/questions`);
    const afterDeleteQuestions = afterDeleteResponse.data;
    console.log(`删除后题目数量: ${afterDeleteQuestions.length}`);
    
    // 5. 检查删除是否成功
    const deletedQuestionExists = afterDeleteQuestions.find(q => q.id === testQuestion.id);
    if (deletedQuestionExists) {
      console.log('❌ 删除失败: 题目仍然存在');
      console.log('可能的原因:');
      console.log('1. 后端删除逻辑有问题');
      console.log('2. 数据库事务没有提交');
      console.log('3. 删除权限不足');
    } else {
      console.log('✅ 删除成功: 题目已从列表中移除');
    }
    
    // 6. 计算数量变化
    const countDifference = initialQuestions.length - afterDeleteQuestions.length;
    console.log(`\n📈 数量变化: ${initialQuestions.length} -> ${afterDeleteQuestions.length} (变化: ${countDifference})`);
    
    if (countDifference === 1) {
      console.log('✅ 数量变化正确');
    } else if (countDifference === 0) {
      console.log('❌ 数量没有变化，删除可能失败');
    } else {
      console.log(`⚠️ 数量变化异常: ${countDifference}`);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

debugDeleteIssue().catch(console.error);
