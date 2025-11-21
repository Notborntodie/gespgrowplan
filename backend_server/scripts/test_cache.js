#!/usr/bin/env node

/**
 * 测试Redis缓存是否正常工作
 */

const { redis, cacheUtils } = require('../config/cache');

async function testCache() {
  console.log('🔍 测试Redis缓存功能...\n');
  
  // 1. 测试Redis连接
  console.log('1. 测试Redis连接...');
  try {
    const pong = await redis.ping();
    console.log(`   ✅ Redis连接正常: ${pong}\n`);
  } catch (error) {
    console.error(`   ❌ Redis连接失败: ${error.message}\n`);
    process.exit(1);
  }
  
  // 2. 测试基本缓存操作
  console.log('2. 测试基本缓存操作...');
  try {
    const testKey = 'cache:test:123';
    const testValue = { name: '测试', value: 123 };
    
    // 设置缓存
    await cacheUtils.set(testKey, testValue, 60);
    console.log(`   ✅ 设置缓存: ${testKey}`);
    
    // 获取缓存
    const cached = await cacheUtils.get(testKey);
    if (cached && cached.name === testValue.name) {
      console.log(`   ✅ 获取缓存成功: ${JSON.stringify(cached)}`);
    } else {
      console.log(`   ❌ 获取缓存失败或数据不匹配`);
    }
    
    // 删除缓存
    await cacheUtils.del(testKey);
    const deleted = await cacheUtils.get(testKey);
    if (!deleted) {
      console.log(`   ✅ 删除缓存成功\n`);
    } else {
      console.log(`   ❌ 删除缓存失败\n`);
    }
  } catch (error) {
    console.error(`   ❌ 缓存操作失败: ${error.message}\n`);
  }
  
  // 3. 测试exam缓存工具函数
  console.log('3. 测试exam缓存工具函数...');
  try {
    const { pool } = require('../config/database');
    const examId = 57; // 使用一个存在的考试ID
    
    console.log(`   测试获取考试详情 (ID: ${examId})...`);
    const start1 = Date.now();
    const examDetail1 = await cacheUtils.exam.getExamDetail(examId, pool);
    const time1 = Date.now() - start1;
    
    if (examDetail1) {
      console.log(`   ✅ 首次获取成功 (${time1}ms)`);
      console.log(`      考试名称: ${examDetail1.exam.name}`);
      console.log(`      题目数量: ${examDetail1.questions.length}`);
      
      // 第二次获取（应该从缓存）
      const start2 = Date.now();
      const examDetail2 = await cacheUtils.exam.getExamDetail(examId, pool);
      const time2 = Date.now() - start2;
      
      console.log(`   ✅ 第二次获取成功 (${time2}ms)`);
      console.log(`      缓存效果: ${time1 > time2 ? '✅ 缓存生效' : '❌ 缓存未生效'}`);
      console.log(`      性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    } else {
      console.log(`   ❌ 获取考试详情失败`);
    }
  } catch (error) {
    console.error(`   ❌ 测试失败: ${error.message}`);
    console.error(error.stack);
  }
  
  // 4. 检查Redis中的缓存键
  console.log('\n4. 检查Redis中的缓存键...');
  try {
    const keys = await redis.keys('cache:*');
    console.log(`   找到 ${keys.length} 个缓存键`);
    if (keys.length > 0) {
      console.log(`   前10个缓存键:`);
      keys.slice(0, 10).forEach(key => {
        console.log(`     - ${key}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ 检查缓存键失败: ${error.message}`);
  }
  
  // 5. 测试HTTP缓存中间件
  console.log('\n5. 测试HTTP缓存中间件...');
  try {
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3000/api';
    
    console.log('   第一次请求（无缓存）...');
    const start1 = Date.now();
    const res1 = await axios.get(`${BASE_URL}/exams`);
    const time1 = Date.now() - start1;
    console.log(`   ✅ 响应时间: ${time1}ms, 状态: ${res1.status}`);
    
    // 检查是否有缓存键生成
    await new Promise(resolve => setTimeout(resolve, 500));
    const cacheKeys = await redis.keys('exams:*');
    console.log(`   生成的缓存键数量: ${cacheKeys.length}`);
    if (cacheKeys.length > 0) {
      console.log(`   缓存键示例: ${cacheKeys[0]}`);
    }
    
    console.log('   第二次请求（应该有缓存）...');
    const start2 = Date.now();
    const res2 = await axios.get(`${BASE_URL}/exams`);
    const time2 = Date.now() - start2;
    console.log(`   ✅ 响应时间: ${time2}ms, 状态: ${res2.status}`);
    
    if (time2 < time1) {
      console.log(`   ✅ HTTP缓存生效，性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    } else {
      console.log(`   ⚠️  HTTP缓存可能未生效`);
    }
  } catch (error) {
    console.error(`   ❌ HTTP缓存测试失败: ${error.message}`);
  }
  
  console.log('\n✅ 测试完成');
  process.exit(0);
}

testCache().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});

