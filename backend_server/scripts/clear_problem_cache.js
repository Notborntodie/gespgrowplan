require('dotenv').config();
const { cacheUtils } = require('../config/cache');

async function clearProblemCache(problemId) {
  try {
    console.log(`正在清除题目 ${problemId} 的缓存...`);
    
    // 清除题目缓存
    const deleted = await cacheUtils.oj.clearProblem(problemId);
    
    // 清除题目列表缓存
    await cacheUtils.oj.clearProblemList();
    
    console.log(`✓ 缓存清除完成！共清除 ${deleted} 个缓存键\n`);
    
  } catch (error) {
    console.error('清除缓存失败:', error);
    throw error;
  }
}

// 从命令行参数获取题目ID
const problemId = process.argv[2] ? parseInt(process.argv[2]) : 121;

clearProblemCache(problemId)
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

