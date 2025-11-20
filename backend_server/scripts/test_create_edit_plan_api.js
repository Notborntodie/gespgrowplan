const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000/api';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`测试: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 测试变量
let createdPlanId = null;

async function runTests() {
  log('\n开始测试学习计划创建和编辑API...', 'yellow');
  
  try {
    // ==================== 测试1: 创建学习计划（含任务和练习） ====================
    logTest('1. 创建学习计划（含任务和练习）');
    try {
      const createData = {
        name: 'GESP二级冲刺计划',
        description: '这是一个测试学习计划，包含完整的任务和练习',
        level: '2',
        start_time: '2024-03-01 00:00:00',
        end_time: '2024-05-31 23:59:59',
        tasks: [
          {
            name: '第一周：数组基础',
            description: '学习数组的声明、初始化和基本操作',
            review_content: '数组是存储同类型数据的集合。\n1. 数组声明：int arr[10];\n2. 数组初始化：int arr[] = {1,2,3};\n3. 数组访问：arr[0]',
            review_video_url: 'https://example.com/video/array-basics.mp4',
            start_time: '2024-03-01 00:00:00',
            end_time: '2024-03-07 23:59:59',
            task_order: 1,
            exams: [
              { exam_id: 35, exam_order: 1 },  // GESP 1级真题
              { exam_id: 36, exam_order: 2 }
            ],
            oj_problems: [
              { problem_id: 4, problem_order: 1 },  // 假期阅读
              { problem_id: 5, problem_order: 2 }   // 值日
            ]
          },
          {
            name: '第二周：循环与数组',
            description: '学习使用循环遍历数组',
            review_content: '使用for循环遍历数组是最常见的操作。\nfor(int i=0; i<n; i++) { cout << arr[i]; }',
            start_time: '2024-03-08 00:00:00',
            end_time: '2024-03-14 23:59:59',
            task_order: 2,
            exams: [
              { exam_id: 39, exam_order: 1 }  // GESP 1级真题
            ],
            oj_problems: [
              { problem_id: 6, problem_order: 1 },   // 四舍五入
              { problem_id: 7, problem_order: 2 },   // 图书馆里的老鼠
              { problem_id: 8, problem_order: 3 }    // 温度转换
            ]
          },
          {
            name: '第三周：综合练习',
            description: '数组相关的综合应用题',
            start_time: '2024-03-15 00:00:00',
            end_time: '2024-03-21 23:59:59',
            task_order: 3,
            exams: [
              { exam_id: 40, exam_order: 1 }  // GESP 1级真题
            ],
            oj_problems: [
              { problem_id: 9, problem_order: 1 },   // 奇数和偶数
              { problem_id: 10, problem_order: 2 }   // 美丽数字
            ]
          }
        ]
      };
      
      logInfo('发送创建请求...');
      console.log('请求数据:', JSON.stringify(createData, null, 2));
      
      const response = await axios.post(`${BASE_URL}/learning-plans`, createData);
      
      logSuccess('学习计划创建成功！');
      createdPlanId = response.data.data.id;
      logInfo(`创建的计划ID: ${createdPlanId}`);
      logInfo(`计划名称: ${response.data.data.name}`);
      logInfo(`任务数量: ${response.data.data.tasks.length}`);
      
      console.log('\n完整响应数据:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // 显示每个任务的详细信息
      console.log('\n任务详情:');
      response.data.data.tasks.forEach((task, index) => {
        console.log(`\n任务 ${index + 1}: ${task.name}`);
        console.log(`  - 任务ID: ${task.id}`);
        const exams = task.exams ? (typeof task.exams === 'string' ? JSON.parse(task.exams) : task.exams) : [];
        const ojProblems = task.oj_problems ? (typeof task.oj_problems === 'string' ? JSON.parse(task.oj_problems) : task.oj_problems) : [];
        console.log(`  - 客观题数量: ${exams.length}`);
        console.log(`  - OJ题目数量: ${ojProblems.length}`);
      });
      
    } catch (error) {
      logError(`创建失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
      console.error(error);
    }
    
    await delay(1000);
    
    // ==================== 测试2: 只更新学习计划基本信息 ====================
    if (createdPlanId) {
      logTest('2. 只更新学习计划基本信息（不更新任务）');
      try {
        const updateBasicData = {
          name: 'GESP二级冲刺计划（已更新）',
          description: '更新后的描述：这是一个非常优秀的学习计划',
          level: '2'
        };
        
        logInfo('发送基本信息更新请求...');
        console.log('请求数据:', JSON.stringify(updateBasicData, null, 2));
        
        const response = await axios.put(`${BASE_URL}/learning-plans/${createdPlanId}`, updateBasicData);
        
        logSuccess('学习计划基本信息更新成功！');
        logInfo(`计划名称: ${response.data.data.name}`);
        logInfo(`计划描述: ${response.data.data.description}`);
        logInfo(`任务数量: ${response.data.data.tasks.length}`);
        
        console.log('\n完整响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        logError(`更新失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
      }
      
      await delay(1000);
    }
    
    // ==================== 测试3: 完整替换任务列表 ====================
    if (createdPlanId) {
      logTest('3. 完整替换任务列表');
      try {
        const updateWithTasksData = {
          name: 'GESP二级冲刺计划（第二版）',
          description: '任务已完全重构',
          tasks: [
            {
              name: '重构后的第一周：字符串基础',
              description: '学习字符串的基本操作',
              review_content: '字符串是字符的序列。C++中使用string类。',
              start_time: '2024-03-01 00:00:00',
              end_time: '2024-03-07 23:59:59',
              task_order: 1,
              exams: [
                { exam_id: 32, exam_order: 1 }  // GESP 2级真题
              ],
              oj_problems: [
                { problem_id: 11, problem_order: 1 },  // 小杨购物
                { problem_id: 12, problem_order: 2 }   // 立方数
              ]
            },
            {
              name: '重构后的第二周：字符串进阶',
              description: '字符串的高级操作和算法',
              start_time: '2024-03-08 00:00:00',
              end_time: '2024-03-14 23:59:59',
              task_order: 2,
              exams: [
                { exam_id: 33, exam_order: 1 }  // GESP 3级真题
              ],
              oj_problems: [
                { problem_id: 13, problem_order: 1 }  // 休息时间
              ]
            }
          ]
        };
        
        logInfo('发送完整替换请求...');
        console.log('请求数据:', JSON.stringify(updateWithTasksData, null, 2));
        
        const response = await axios.put(`${BASE_URL}/learning-plans/${createdPlanId}`, updateWithTasksData);
        
        logSuccess('学习计划完整更新成功！');
        logInfo(`计划名称: ${response.data.data.name}`);
        logInfo(`原有任务数: 3 个`);
        logInfo(`更新后任务数: ${response.data.data.tasks.length} 个`);
        
        console.log('\n完整响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // 显示每个任务的详细信息
        console.log('\n更新后的任务详情:');
        response.data.data.tasks.forEach((task, index) => {
          console.log(`\n任务 ${index + 1}: ${task.name}`);
          console.log(`  - 任务ID: ${task.id}`);
          const exams = task.exams ? (typeof task.exams === 'string' ? JSON.parse(task.exams) : task.exams) : [];
          const ojProblems = task.oj_problems ? (typeof task.oj_problems === 'string' ? JSON.parse(task.oj_problems) : task.oj_problems) : [];
          console.log(`  - 客观题数量: ${exams.length}`);
          console.log(`  - OJ题目数量: ${ojProblems.length}`);
        });
        
      } catch (error) {
        logError(`更新失败: ${error.message}`);
        if (error.response) {
          console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
      }
      
      await delay(1000);
    }
    
    // ==================== 测试4: 创建只有基本信息的学习计划（无任务） ====================
    logTest('4. 创建只有基本信息的学习计划（无任务）');
    try {
      const simpleCreateData = {
        name: 'GESP三级预备计划',
        description: '这是一个只有基本信息的计划，暂时没有任务',
        level: '3',
        start_time: '2024-04-01 00:00:00',
        end_time: '2024-06-30 23:59:59'
      };
      
      logInfo('发送简单创建请求...');
      console.log('请求数据:', JSON.stringify(simpleCreateData, null, 2));
      
      const response = await axios.post(`${BASE_URL}/learning-plans`, simpleCreateData);
      
      logSuccess('简单学习计划创建成功！');
      logInfo(`创建的计划ID: ${response.data.data.id}`);
      logInfo(`计划名称: ${response.data.data.name}`);
      logInfo(`任务数量: ${response.data.data.tasks.length}`);
      
      console.log('\n完整响应数据:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      logError(`创建失败: ${error.message}`);
      if (error.response) {
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    await delay(1000);
    
    // ==================== 测试5: 测试错误情况 - 缺少必需参数 ====================
    logTest('5. 测试错误情况 - 缺少必需参数');
    try {
      const invalidData = {
        description: '没有名称的计划',
        level: '1'
      };
      
      logInfo('发送无效请求（缺少name）...');
      
      const response = await axios.post(`${BASE_URL}/learning-plans`, invalidData);
      
      logError('应该返回错误，但请求成功了！');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确返回400错误');
        logInfo(`错误信息: ${error.response.data.error}`);
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      } else {
        logError(`意外的错误: ${error.message}`);
      }
    }
    
    await delay(1000);
    
    // ==================== 测试6: 测试错误情况 - 更新不存在的计划 ====================
    logTest('6. 测试错误情况 - 更新不存在的计划');
    try {
      const updateData = {
        name: '更新不存在的计划'
      };
      
      logInfo('发送更新请求（计划ID: 99999）...');
      
      const response = await axios.put(`${BASE_URL}/learning-plans/99999`, updateData);
      
      logError('应该返回错误，但请求成功了！');
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('正确返回404错误');
        logInfo(`错误信息: ${error.response.data.error}`);
        console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
      } else {
        logError(`意外的错误: ${error.message}`);
      }
    }
    
    // ==================== 测试总结 ====================
    console.log('\n' + '='.repeat(60));
    log('测试完成！', 'yellow');
    console.log('='.repeat(60));
    
    logInfo('所有API测试已完成');
    if (createdPlanId) {
      logInfo(`测试创建的学习计划ID: ${createdPlanId}`);
    }
    logInfo('请检查上方输出确认各项功能是否正常');
    
  } catch (error) {
    logError(`测试过程出错: ${error.message}`);
    console.error(error);
  }
}

// 运行测试
runTests();

