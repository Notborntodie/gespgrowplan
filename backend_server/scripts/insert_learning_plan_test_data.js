const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '106.14.143.27',
  user: 'gesp_user',
  password: 'Gesp@2025!',
  database: 'gesp_practice_system',
  charset: 'utf8mb4'
};

async function insertTestData() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    console.log('=========================================');
    console.log('开始插入学习计划测试数据');
    console.log('=========================================\n');
    
    // 1. 创建学习计划
    console.log('1. 创建学习计划...');
    const [planResult] = await connection.execute(`
      INSERT INTO learning_plans (name, description, level, start_time, end_time, is_active)
      VALUES 
      ('GESP一级编程入门', '从零开始学习C++编程基础，适合零基础学员', 1, '2025-01-01 09:00:00', '2025-03-01 23:59:59', TRUE),
      ('GESP二级进阶训练', '巩固基础，学习更多算法知识', 2, '2025-02-01 09:00:00', '2025-04-01 23:59:59', TRUE),
      ('GESP三级算法提升', '深入学习算法和数据结构', 3, '2025-03-01 09:00:00', '2025-05-01 23:59:59', TRUE)
    `);
    console.log(`✓ 成功创建 3 个学习计划\n`);
    
    const plan1Id = planResult.insertId;
    const plan2Id = planResult.insertId + 1;
    const plan3Id = planResult.insertId + 2;
    
    // 2. 为第一个计划创建学习任务
    console.log('2. 创建学习任务...');
    const [taskResult] = await connection.execute(`
      INSERT INTO learning_tasks (plan_id, name, description, review_content, review_video_url, start_time, end_time, task_order)
      VALUES 
      (?, '第一周：变量与数据类型', '学习C++基础语法，掌握变量和数据类型的使用', 
       '本周学习了C++的基础语法，包括整型、浮点型、字符型等数据类型，以及变量的定义和使用。重点掌握：\\n1. 各种数据类型的取值范围\\n2. 变量的命名规则\\n3. 类型转换', 
       'https://example.com/video/week1', 
       '2025-01-01 09:00:00', '2025-01-07 23:59:59', 1),
      (?, '第二周：运算符与表达式', '学习各种运算符的使用和表达式的计算', 
       '本周学习了算术运算符、关系运算符、逻辑运算符等。重点掌握：\\n1. 运算符的优先级\\n2. 表达式的求值顺序\\n3. 常见错误和陷阱', 
       'https://example.com/video/week2', 
       '2025-01-08 09:00:00', '2025-01-14 23:59:59', 2),
      (?, '第三周：选择结构', '学习if语句和switch语句的使用', 
       '本周学习了条件判断和分支结构。重点掌握：\\n1. if-else语句的使用\\n2. 多重if的应用\\n3. switch语句的使用场景', 
       'https://example.com/video/week3', 
       '2025-01-15 09:00:00', '2025-01-21 23:59:59', 3)
    `, [plan1Id, plan1Id, plan1Id]);
    
    const task1Id = taskResult.insertId;
    const task2Id = taskResult.insertId + 1;
    const task3Id = taskResult.insertId + 2;
    
    console.log(`✓ 成功创建 3 个学习任务\n`);
    
    // 3. 查询现有的考试和OJ题目
    console.log('3. 查询现有的考试和OJ题目...');
    const [exams] = await connection.execute('SELECT id FROM exams LIMIT 3');
    const [ojProblems] = await connection.execute('SELECT id FROM oj_problems LIMIT 5');
    
    if (exams.length === 0) {
      console.log('⚠ 警告：数据库中没有考试数据');
    } else {
      console.log(`✓ 找到 ${exams.length} 个考试`);
      
      // 4. 关联任务和考试
      console.log('4. 关联任务和考试...');
      for (let i = 0; i < Math.min(exams.length, 2); i++) {
        await connection.execute(
          'INSERT INTO task_exams (task_id, exam_id, exam_order) VALUES (?, ?, ?)',
          [task1Id, exams[i].id, i + 1]
        );
      }
      console.log(`✓ 成功关联考试\n`);
    }
    
    if (ojProblems.length === 0) {
      console.log('⚠ 警告：数据库中没有OJ题目数据');
    } else {
      console.log(`✓ 找到 ${ojProblems.length} 个OJ题目`);
      
      // 5. 关联任务和OJ题目
      console.log('5. 关联任务和OJ题目...');
      for (let i = 0; i < Math.min(ojProblems.length, 3); i++) {
        await connection.execute(
          'INSERT INTO task_oj_problems (task_id, problem_id, problem_order) VALUES (?, ?, ?)',
          [task1Id, ojProblems[i].id, i + 1]
        );
      }
      console.log(`✓ 成功关联OJ题目\n`);
    }
    
    // 6. 显示创建的数据
    console.log('=========================================');
    console.log('✅ 测试数据插入完成！');
    console.log('=========================================\n');
    
    console.log('创建的学习计划：');
    const [plans] = await connection.execute('SELECT * FROM learning_plans WHERE id >= ?', [plan1Id]);
    plans.forEach(plan => {
      console.log(`  - ID: ${plan.id}, 名称: ${plan.name}, 级别: ${plan.level}`);
    });
    
    console.log('\n创建的学习任务：');
    const [tasks] = await connection.execute('SELECT * FROM learning_tasks WHERE plan_id = ?', [plan1Id]);
    tasks.forEach(task => {
      console.log(`  - ID: ${task.id}, 名称: ${task.name}`);
    });
    
    console.log('\n测试提示：');
    console.log(`  - 学习计划ID: ${plan1Id}, ${plan2Id}, ${plan3Id}`);
    console.log(`  - 学习任务ID: ${task1Id}, ${task2Id}, ${task3Id}`);
    console.log('  - 使用任意用户ID（如：1）进行测试');
    
  } catch (error) {
    console.error('\n❌ 插入数据失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行插入
insertTestData();

