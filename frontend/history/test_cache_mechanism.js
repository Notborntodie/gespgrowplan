import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🧪 测试缓存机制...\n');

// 模拟缓存机制
class QuestionCache {
  constructor() {
    this.questions = []
    this.lastFetchTime = 0
    this.cacheExpiry = 5 * 60 * 1000 // 5分钟
    this.loading = false
  }

  isCacheValid() {
    return Date.now() - this.lastFetchTime < this.cacheExpiry
  }

  async fetchQuestions(forceRefresh = false) {
    // 如果缓存有效且不强制刷新，直接返回缓存数据
    if (!forceRefresh && this.isCacheValid() && this.questions.length > 0) {
      console.log('✅ 使用缓存数据')
      return this.questions
    }

    console.log('🔄 从服务器获取数据')
    this.loading = true
    
    try {
      const response = await axios.get(`${BASE_URL}/questions`)
      this.questions = response.data
      this.lastFetchTime = Date.now()
      return this.questions
    } catch (error) {
      console.error('获取数据失败:', error.message)
      throw error
    } finally {
      this.loading = false
    }
  }

  removeQuestion(questionId) {
    const index = this.questions.findIndex(q => q.id === questionId)
    if (index !== -1) {
      this.questions.splice(index, 1)
      console.log(`🗑️ 从缓存中删除题目 ${questionId}`)
    }
  }

  updateQuestion(questionId, updatedData) {
    const index = this.questions.findIndex(q => q.id === questionId)
    if (index !== -1) {
      this.questions[index] = { ...this.questions[index], ...updatedData }
      console.log(`✏️ 更新缓存中的题目 ${questionId}`)
    }
  }

  getCacheInfo() {
    return {
      questionCount: this.questions.length,
      lastFetchTime: new Date(this.lastFetchTime).toLocaleTimeString(),
      isCacheValid: this.isCacheValid(),
      cacheAge: Math.floor((Date.now() - this.lastFetchTime) / 1000)
    }
  }
}

async function testCacheMechanism() {
  const cache = new QuestionCache()
  
  console.log('📊 初始缓存状态:', cache.getCacheInfo())
  
  // 测试1: 首次获取数据
  console.log('\n🔍 测试1: 首次获取数据')
  const questions1 = await cache.fetchQuestions()
  console.log(`获取到 ${questions1.length} 道题目`)
  console.log('缓存状态:', cache.getCacheInfo())
  
  // 测试2: 再次获取数据（应该使用缓存）
  console.log('\n🔍 测试2: 再次获取数据（使用缓存）')
  const questions2 = await cache.fetchQuestions()
  console.log(`获取到 ${questions2.length} 道题目`)
  console.log('缓存状态:', cache.getCacheInfo())
  
  // 测试3: 强制刷新
  console.log('\n🔍 测试3: 强制刷新')
  const questions3 = await cache.fetchQuestions(true)
  console.log(`获取到 ${questions3.length} 道题目`)
  console.log('缓存状态:', cache.getCacheInfo())
  
  // 测试4: 删除题目
  if (questions3.length > 0) {
    console.log('\n🔍 测试4: 删除题目')
    const firstQuestion = questions3[0]
    console.log(`删除题目 ${firstQuestion.id}`)
    cache.removeQuestion(firstQuestion.id)
    console.log('缓存状态:', cache.getCacheInfo())
  }
  
  // 测试5: 更新题目
  if (questions3.length > 1) {
    console.log('\n🔍 测试5: 更新题目')
    const secondQuestion = questions3[1]
    console.log(`更新题目 ${secondQuestion.id}`)
    cache.updateQuestion(secondQuestion.id, { 
      question_text: '更新后的题目内容',
      updated_at: new Date().toISOString()
    })
    console.log('缓存状态:', cache.getCacheInfo())
  }
  
  console.log('\n✅ 缓存机制测试完成！')
}

testCacheMechanism().catch(console.error);
