#!/usr/bin/env node

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000';

// 颜色函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

// 测试数据
const sampleExams = [
  {
    name: 'GESP一级模拟考试',
    level: 1,
    description: 'GESP一级编程能力测试',
    total_questions: 20
  },
  {
    name: 'GESP二级模拟考试',
    level: 2,
    description: 'GESP二级编程能力测试',
    total_questions: 25
  },
  {
    name: 'GESP三级模拟考试',
    level: 3,
    description: 'GESP三级编程能力测试',
    total_questions: 30
  }
];

const sampleQuestions = [
  {
    question_text: '在Python中，以下哪个是正确的变量命名？',
    question_type: 'text',
    correct_answer: 'A',
    explanation: 'Python变量名只能包含字母、数字和下划线，且不能以数字开头',
    level: 1,
    difficulty: 'easy',
    options: [
      { label: 'A', value: 'A', text: 'my_variable' },
      { label: 'B', value: 'B', text: '1variable' },
      { label: 'C', value: 'C', text: 'my-variable' },
      { label: 'D', value: 'D', text: 'class' }
    ]
  },
  {
    question_text: '以下哪个是Python的循环语句？',
    question_type: 'text',
    correct_answer: 'B',
    explanation: 'for是Python中用于循环的关键字',
    level: 1,
    difficulty: 'easy',
    options: [
      { label: 'A', value: 'A', text: 'if' },
      { label: 'B', value: 'B', text: 'for' },
      { label: 'C', value: 'C', text: 'try' },
      { label: 'D', value: 'D', text: 'def' }
    ]
  },
  {
    question_text: '在Python中，len()函数的作用是什么？',
    question_type: 'text',
    correct_answer: 'C',
    explanation: 'len()函数用于获取序列（如字符串、列表、元组）的长度',
    level: 1,
    difficulty: 'medium',
    options: [
      { label: 'A', value: 'A', text: '计算数字的平方' },
      { label: 'B', value: 'B', text: '获取最大值' },
      { label: 'C', value: 'C', text: '获取长度' },
      { label: 'D', value: 'D', text: '获取最小值' }
    ]
  },
  {
    question_text: '以下哪个是Python的列表？',
    question_type: 'text',
    correct_answer: 'A',
    explanation: '方括号[]用于创建Python列表',
    level: 1,
    difficulty: 'easy',
    options: [
      { label: 'A', value: 'A', text: '[1, 2, 3]' },
      { label: 'B', value: 'B', text: '(1, 2, 3)' },
      { label: 'C', value: 'C', text: '{1, 2, 3}' },
      { label: 'D', value: 'D', text: '1, 2, 3' }
    ]
  },
  {
    question_text: 'Python中的print()函数默认在输出后添加什么？',
    question_type: 'text',
    correct_answer: 'B',
    explanation: 'print()函数默认在输出后添加换行符',
    level: 1,
    difficulty: 'medium',
    options: [
      { label: 'A', value: 'A', text: '空格' },
      { label: 'B', value: 'B', text: '换行符' },
      { label: 'C', value: 'C', text: '制表符' },
      { label: 'D', value: 'D', text: '什么都不添加' }
    ]
  }
];

const sampleKnowledgePoints = [
  {
    name: '变量和数据类型',
    description: '学习Python中的变量定义和基本数据类型',
    category: '基础语法',
    level: 1
  },
  {
    name: '条件语句',
    description: '学习if、elif、else条件语句的使用',
    category: '控制结构',
    level: 1
  },
  {
    name: '循环语句',
    description: '学习for和while循环的使用',
    category: '控制结构',
    level: 1
  },
  {
    name: '函数定义',
    description: '学习如何定义和调用函数',
    category: '函数',
    level: 2
  },
  {
    name: '列表操作',
    description: '学习列表的创建、访问和修改',
    category: '数据结构',
    level: 1
  }
];

async function initDatabase() {
  console.log(colors.blue('🚀 开始初始化数据库...'));
  console.log(`API地址: ${API_BASE}\n`);

  let successCount = 0;
  let totalCount = 0;

  // 1. 添加知识点
  console.log(colors.yellow('📚 添加知识点...'));
  for (const knowledgePoint of sampleKnowledgePoints) {
    try {
      const response = await axios.post(`${API_BASE}/api/knowledge-points`, knowledgePoint);
      console.log(colors.green(`✅ 添加知识点: ${knowledgePoint.name}`));
      successCount++;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.message?.includes('已存在')) {
        console.log(colors.yellow(`⚠️ 知识点已存在: ${knowledgePoint.name}`));
      } else {
        console.log(colors.red(`❌ 添加知识点失败: ${knowledgePoint.name}`));
        console.log(`   错误: ${error.message}`);
      }
    }
    totalCount++;
  }

  // 2. 上传题目
  console.log(colors.yellow('\n📝 上传题目...'));
  for (const question of sampleQuestions) {
    try {
      const response = await axios.post(`${API_BASE}/api/upload-question`, question);
      console.log(colors.green(`✅ 上传题目: ${question.question_text.substring(0, 30)}...`));
      successCount++;
    } catch (error) {
      console.log(colors.red(`❌ 上传题目失败: ${question.question_text.substring(0, 30)}...`));
      console.log(`   错误: ${error.message}`);
    }
    totalCount++;
  }

  // 3. 批量上传题目
  console.log(colors.yellow('\n📦 批量上传题目...'));
  try {
    const batchQuestions = [
      {
        question_text: 'Python中的字符串可以用什么符号包围？',
        correct_answer: 'A',
        explanation: 'Python字符串可以用单引号或双引号包围',
        level: 1,
        difficulty: 'easy'
      },
      {
        question_text: '以下哪个是Python的注释符号？',
        correct_answer: 'B',
        explanation: 'Python使用#作为单行注释符号',
        level: 1,
        difficulty: 'easy'
      },
      {
        question_text: 'Python中的True和False是什么类型？',
        correct_answer: 'C',
        explanation: 'True和False是Python的布尔类型',
        level: 1,
        difficulty: 'medium'
      }
    ];

    const response = await axios.post(`${API_BASE}/api/upload-questions-batch`, {
      questions: batchQuestions
    });
    console.log(colors.green(`✅ 批量上传成功: ${response.data.message}`));
    successCount += batchQuestions.length;
    totalCount += batchQuestions.length;
  } catch (error) {
    console.log(colors.red(`❌ 批量上传失败`));
    console.log(`   错误: ${error.message}`);
    totalCount += 3;
  }

  // 4. 测试API功能
  console.log(colors.yellow('\n🔍 测试API功能...'));
  
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(colors.green('✅ 健康检查正常'));
    successCount++;
  } catch (error) {
    console.log(colors.red('❌ 健康检查失败'));
  }
  totalCount++;

  try {
    const examsResponse = await axios.get(`${API_BASE}/api/exams`);
    console.log(colors.green(`✅ 获取考试列表: ${examsResponse.data.length} 个考试`));
    successCount++;
  } catch (error) {
    console.log(colors.red('❌ 获取考试列表失败'));
  }
  totalCount++;

  try {
    const questionsResponse = await axios.get(`${API_BASE}/api/questions`);
    console.log(colors.green(`✅ 获取题目列表: ${questionsResponse.data.length} 道题目`));
    successCount++;
  } catch (error) {
    console.log(colors.red('❌ 获取题目列表失败'));
  }
  totalCount++;

  try {
    const knowledgeResponse = await axios.get(`${API_BASE}/api/knowledge-points`);
    console.log(colors.green(`✅ 获取知识点列表: ${knowledgeResponse.data.length} 个知识点`));
    successCount++;
  } catch (error) {
    console.log(colors.red('❌ 获取知识点列表失败'));
  }
  totalCount++;

  // 总结
  console.log('\n' + '='.repeat(60));
  console.log(colors.blue('📊 数据库初始化总结'));
  console.log(`总操作数: ${totalCount}`);
  console.log(colors.green(`成功: ${successCount}`));
  console.log(colors.red(`失败: ${totalCount - successCount}`));
  console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log(colors.green('\n🎉 数据库初始化完成！所有操作成功'));
  } else {
    console.log(colors.yellow('\n⚠️ 数据库初始化部分完成，请检查失败的操作'));
  }

  console.log(colors.blue('\n📋 可用的API端点:'));
  console.log('  GET  /health                    - 健康检查');
  console.log('  GET  /api/exams                 - 获取考试列表');
  console.log('  GET  /api/questions             - 获取题目列表');
  console.log('  GET  /api/knowledge-points      - 获取知识点列表');
  console.log('  POST /api/register              - 用户注册');
  console.log('  POST /api/login                 - 用户登录');
  console.log('  POST /api/upload-question       - 上传题目');
  console.log('  POST /api/upload-questions-batch - 批量上传题目');
}

// 运行初始化
initDatabase().catch(error => {
  console.error(colors.red('初始化失败:'), error.message);
  process.exit(1);
});

