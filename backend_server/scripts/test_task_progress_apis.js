const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// 配置（从环境变量读取）
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gesp_practice_system'
};

// 测试数据
let testData = {
  teacher_id: null,
  student_id: null,
  plan_id: null,
  task_id: null,
  exam_id: null,
  problem_id: null
};

/**
 * 初始化测试数据
 */
async function initTestData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('📋 初始化测试数据...\n');
    
    // 1. 获取或创建测试用户（教师和学生）
    let [teachers] = await connection.execute(
      "SELECT id FROM users WHERE username LIKE '%teacher%' OR username LIKE '%教师%' LIMIT 1"
    );
    
    if (teachers.length === 0) {
      // 创建测试教师
      await connection.execute(
        "INSERT INTO users (username, password, real_name) VALUES ('test_teacher', 'test123', '测试教师')"
      );
      [teachers] = await connection.execute("SELECT id FROM users WHERE username = 'test_teacher'");
    }
    testData.teacher_id = teachers[0].id;
    console.log(`✓ 教师ID: ${testData.teacher_id}`);
    
    let [students] = await connection.execute(
      "SELECT id FROM users WHERE username LIKE '%student%' OR username LIKE '%学生%' LIMIT 1"
    );
    
    if (students.length === 0) {
      // 创建测试学生
      await connection.execute(
        "INSERT INTO users (username, password, real_name) VALUES ('test_student', 'test123', '测试学生')"
      );
      [students] = await connection.execute("SELECT id FROM users WHERE username = 'test_student'");
    }
    testData.student_id = students[0].id;
    console.log(`✓ 学生ID: ${testData.student_id}`);
    
    // 2. 建立师生关系
    const [relation] = await connection.execute(
      "SELECT * FROM teacher_students WHERE teacher_id = ? AND student_id = ?",
      [testData.teacher_id, testData.student_id]
    );
    
    if (relation.length === 0) {
      await connection.execute(
        "INSERT INTO teacher_students (teacher_id, student_id) VALUES (?, ?)",
        [testData.teacher_id, testData.student_id]
      );
      console.log('✓ 建立师生关系');
    }
    
    // 3. 获取或创建学习计划
    let [plans] = await connection.execute(
      "SELECT id FROM learning_plans WHERE name LIKE '%测试%' LIMIT 1"
    );
    
    if (plans.length === 0) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
      
      await connection.execute(`
        INSERT INTO learning_plans (name, description, level, start_time, end_time, is_active, created_by)
        VALUES ('测试学习计划', '用于测试的学习计划', 1, ?, ?, 1, ?)
      `, [now, endTime, testData.teacher_id]);
      
      [plans] = await connection.execute("SELECT id FROM learning_plans WHERE name = '测试学习计划'");
    }
    testData.plan_id = plans[0].id;
    console.log(`✓ 学习计划ID: ${testData.plan_id}`);
    
    // 4. 获取或创建任务
    let [tasks] = await connection.execute(
      "SELECT id FROM learning_tasks WHERE plan_id = ? LIMIT 1",
      [testData.plan_id]
    );
    
    if (tasks.length === 0) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
      
      await connection.execute(`
        INSERT INTO learning_tasks (plan_id, name, description, start_time, end_time, task_order)
        VALUES (?, '测试任务', '用于测试的任务', ?, ?, 1)
      `, [testData.plan_id, now, endTime]);
      
      [tasks] = await connection.execute(
        "SELECT id FROM learning_tasks WHERE plan_id = ? AND name = '测试任务'",
        [testData.plan_id]
      );
    }
    testData.task_id = tasks[0].id;
    console.log(`✓ 任务ID: ${testData.task_id}`);
    
    // 5. 获取或创建考试
    let [exams] = await connection.execute(
      "SELECT id FROM exams LIMIT 1"
    );
    
    if (exams.length === 0) {
      await connection.execute(`
        INSERT INTO exams (name, level, description, total_questions, type)
        VALUES ('测试考试', 1, '用于测试的考试', 5, '模拟')
      `);
      [exams] = await connection.execute("SELECT id FROM exams WHERE name = '测试考试'");
    }
    testData.exam_id = exams[0].id;
    console.log(`✓ 考试ID: ${testData.exam_id}`);
    
    // 6. 关联任务和考试
    const [taskExam] = await connection.execute(
      "SELECT * FROM task_exams WHERE task_id = ? AND exam_id = ?",
      [testData.task_id, testData.exam_id]
    );
    
    if (taskExam.length === 0) {
      await connection.execute(
        "INSERT INTO task_exams (task_id, exam_id, exam_order) VALUES (?, ?, 1)",
        [testData.task_id, testData.exam_id]
      );
      console.log('✓ 关联任务和考试');
    }
    
    // 7. 获取或创建OJ题目
    let [problems] = await connection.execute(
      "SELECT id FROM oj_problems LIMIT 1"
    );
    
    if (problems.length === 0) {
      await connection.execute(`
        INSERT INTO oj_problems (title, description, level, time_limit, memory_limit)
        VALUES ('测试OJ题', '用于测试的OJ题目', 1, 1000, 256)
      `);
      [problems] = await connection.execute("SELECT id FROM oj_problems WHERE title = '测试OJ题'");
      
      // 添加测试样例
      await connection.execute(`
        INSERT INTO oj_samples (problem_id, input, output, is_displayed, sort_order)
        VALUES (?, '1', '1', 1, 1)
      `, [problems[0].id]);
    }
    testData.problem_id = problems[0].id;
    console.log(`✓ OJ题目ID: ${testData.problem_id}`);
    
    // 8. 关联任务和OJ题
    const [taskOj] = await connection.execute(
      "SELECT * FROM task_oj_problems WHERE task_id = ? AND problem_id = ?",
      [testData.task_id, testData.problem_id]
    );
    
    if (taskOj.length === 0) {
      await connection.execute(
        "INSERT INTO task_oj_problems (task_id, problem_id, problem_order) VALUES (?, ?, 1)",
        [testData.task_id, testData.problem_id]
      );
      console.log('✓ 关联任务和OJ题');
    }
    
    // 9. 确保学生加入了计划
    const [joined] = await connection.execute(
      "SELECT * FROM user_learning_plans WHERE user_id = ? AND plan_id = ?",
      [testData.student_id, testData.plan_id]
    );
    
    if (joined.length === 0) {
      await connection.execute(
        "INSERT INTO user_learning_plans (user_id, plan_id, status) VALUES (?, ?, 'active')",
        [testData.student_id, testData.plan_id]
      );
      console.log('✓ 学生加入学习计划');
    }
    
    console.log('\n✅ 测试数据初始化完成！\n');
    console.log('测试数据摘要:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('❌ 初始化测试数据失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * 测试任务内提交客观题接口
 */
async function testSubmitExamInTask() {
  console.log('🧪 测试 1: 任务内提交客观题接口');
  console.log('='.repeat(60));
  
  try {
    // 先获取考试题目
    const connection = await mysql.createConnection(DB_CONFIG);
    const [questions] = await connection.execute(`
      SELECT q.id, q.correct_answer 
      FROM questions q
      JOIN exam_questions eq ON q.id = eq.question_id
      WHERE eq.exam_id = ?
      LIMIT 5
    `, [testData.exam_id]);
    await connection.end();
    
    if (questions.length === 0) {
      console.log('⚠️  考试中没有题目，跳过此测试');
      return;
    }
    
    const answers = questions.map(q => ({
      question_id: q.id,
      user_answer: q.correct_answer // 使用正确答案
    }));
    
    const response = await axios.post(
      `${BASE_URL}/learning-tasks/${testData.task_id}/submit-exam`,
      {
        user_id: testData.student_id,
        exam_id: testData.exam_id,
        answers: answers
      }
    );
    
    console.log('✅ 请求成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.submission_id) {
      console.log('✅ 提交成功，submission_id:', response.data.submission_id);
      console.log('✅ 得分:', response.data.score);
    } else {
      console.log('⚠️  响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * 测试任务内提交OJ接口
 */
async function testSubmitOjInTask() {
  console.log('🧪 测试 2: 任务内提交OJ接口');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(
      `${BASE_URL}/learning-tasks/${testData.task_id}/submit-oj`,
      {
        user_id: testData.student_id,
        problem_id: testData.problem_id,
        code: '#include <iostream>\nusing namespace std;\nint main() { int n; cin >> n; cout << n << endl; return 0; }',
        language: 'cpp'
      }
    );
    
    console.log('✅ 请求成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.submission_id) {
      console.log('✅ 提交成功，submission_id:', response.data.submission_id);
      console.log('✅ 判题结果:', response.data.verdict);
    } else {
      console.log('⚠️  响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * 测试获取任务完成情况接口
 */
async function testGetTaskProgress() {
  console.log('🧪 测试 3: 获取任务完成情况接口');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-tasks/${testData.task_id}/progress`,
      {
        params: {
          user_id: testData.student_id
        }
      }
    );
    
    console.log('✅ 请求成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('✅ 任务信息:', data.task?.name);
      console.log('✅ 任务完成状态:', data.task_progress?.is_completed);
      console.log('✅ 客观题进度:', `${data.exam_progress?.completed}/${data.exam_progress?.total}`);
      console.log('✅ OJ题进度:', `${data.oj_progress?.completed}/${data.oj_progress?.total}`);
    } else {
      console.log('⚠️  响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * 测试教师查看学生在计划内的完成情况接口
 */
async function testGetStudentsProgress() {
  console.log('🧪 测试 4: 教师查看学生在计划内的完成情况接口');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${testData.plan_id}/students-progress`,
      {
        params: {
          teacher_id: testData.teacher_id
        }
      }
    );
    
    console.log('✅ 请求成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const students = response.data.data.students || [];
      console.log(`✅ 找到 ${students.length} 个学生`);
      students.forEach((student, index) => {
        console.log(`\n学生 ${index + 1}:`);
        console.log(`  姓名: ${student.real_name || student.username}`);
        console.log(`  计划完成率: ${student.plan_progress?.progress_rate || 0}%`);
        console.log(`  已完成任务: ${student.plan_progress?.completed_tasks || 0}/${student.plan_progress?.total_tasks || 0}`);
      });
    } else {
      console.log('⚠️  响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * 测试教师查看单个学生的详细完成情况接口
 */
async function testGetStudentDetailProgress() {
  console.log('🧪 测试 5: 教师查看单个学生的详细完成情况接口');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(
      `${BASE_URL}/learning-plans/${testData.plan_id}/students/${testData.student_id}/progress`,
      {
        params: {
          teacher_id: testData.teacher_id
        }
      }
    );
    
    console.log('✅ 请求成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('✅ 学生信息:', data.student?.real_name || data.student?.username);
      console.log('✅ 计划完成率:', `${data.plan_progress?.progress_rate || 0}%`);
      console.log(`✅ 任务数量: ${data.tasks?.length || 0}`);
      
      if (data.tasks && data.tasks.length > 0) {
        data.tasks.forEach((task, index) => {
          console.log(`\n任务 ${index + 1}: ${task.name}`);
          console.log(`  完成状态: ${task.task_progress?.is_completed ? '已完成' : '未完成'}`);
          console.log(`  客观题: ${task.exam_progress?.completed || 0}/${task.exam_progress?.total || 0}`);
          console.log(`  OJ题: ${task.oj_progress?.completed || 0}/${task.oj_progress?.total || 0}`);
        });
      }
    } else {
      console.log('⚠️  响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试任务进度相关接口\n');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 初始化测试数据
    await initTestData();
    
    // 等待一下，确保数据已准备好
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 运行测试
    await testSubmitExamInTask();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待异步更新完成
    
    await testSubmitOjInTask();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待异步更新完成
    
    await testGetTaskProgress();
    await testGetStudentsProgress();
    await testGetStudentDetailProgress();
    
    console.log('='.repeat(60));
    console.log('✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testData };

