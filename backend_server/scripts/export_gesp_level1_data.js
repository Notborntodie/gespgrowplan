const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库连接配置（从环境变量读取）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gesp_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gesp_practice_system',
  charset: 'utf8mb4'
};

// 转义Markdown特殊字符
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*/g, '\\*')
    .replace(/#/g, '\\#')
    .replace(/\//g, '\\/')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/_/g, '\\_');
}

// 格式化题目文本（保留代码块）
function formatQuestionText(text) {
  if (!text) return '';
  // 如果包含代码块，保留原格式
  if (text.includes('```')) {
    return text;
  }
  return text;
}

async function exportGESPLevel1Data() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');
    
    // 1. 获取所有GESP 1级的客观题
    console.log('正在获取GESP 1级客观题...');
    const [objectiveQuestions] = await connection.execute(
      'SELECT * FROM questions WHERE level = 1 ORDER BY id'
    );
    console.log(`找到 ${objectiveQuestions.length} 道客观题\n`);
    
    // 为每道客观题获取选项
    for (const question of objectiveQuestions) {
      const [options] = await connection.execute(
        'SELECT * FROM options WHERE question_id = ? ORDER BY option_label',
        [question.id]
      );
      question.options = options;
    }
    
    // 2. 获取所有GESP 1级的OJ题
    console.log('正在获取GESP 1级OJ题...');
    const [ojProblems] = await connection.execute(
      'SELECT * FROM oj_problems WHERE level = 1 ORDER BY id'
    );
    console.log(`找到 ${ojProblems.length} 道OJ题\n`);
    
    // 为每道OJ题获取测试样例
    for (const problem of ojProblems) {
      const [samples] = await connection.execute(
        'SELECT * FROM oj_samples WHERE problem_id = ? ORDER BY sort_order',
        [problem.id]
      );
      problem.samples = samples;
    }
    
    // 3. 生成Markdown内容
    console.log('正在生成Markdown文件...');
    let markdown = '# GESP 1级题目数据\n\n';
    markdown += `生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
    markdown += `## 统计信息\n\n`;
    markdown += `- 客观题总数: ${objectiveQuestions.length}\n`;
    markdown += `- OJ题总数: ${ojProblems.length}\n`;
    markdown += `- 题目总数: ${objectiveQuestions.length + ojProblems.length}\n\n`;
    
    // 4. 客观题部分
    markdown += '---\n\n';
    markdown += '# 第一部分：客观题\n\n';
    
    if (objectiveQuestions.length === 0) {
      markdown += '暂无客观题数据。\n\n';
    } else {
      objectiveQuestions.forEach((question, index) => {
        markdown += `## 客观题 ${index + 1} (ID: ${question.id})\n\n`;
        
        // 题目基本信息
        if (question.question_date) {
          markdown += `**题目日期**: ${question.question_date}\n\n`;
        }
        if (question.difficulty) {
          markdown += `**难度**: ${question.difficulty}\n\n`;
        }
        
        // 题目文本
        markdown += `### 题目内容\n\n`;
        if (question.question_type === 'code' && question.question_code) {
          markdown += '```cpp\n';
          markdown += question.question_code;
          markdown += '\n```\n\n';
        }
        markdown += formatQuestionText(question.question_text);
        markdown += '\n\n';
        
        // 选项
        if (question.options && question.options.length > 0) {
          markdown += `### 选项\n\n`;
          question.options.forEach(option => {
            markdown += `- **${option.option_label}**: ${option.option_text}\n`;
          });
          markdown += '\n';
        }
        
        // 正确答案
        markdown += `### 正确答案\n\n`;
        markdown += `**${question.correct_answer}**\n\n`;
        
        // 解析
        if (question.explanation) {
          markdown += `### 解析\n\n`;
          markdown += formatQuestionText(question.explanation);
          markdown += '\n\n';
        }
        
        // 图片
        if (question.image_url) {
          markdown += `### 图片\n\n`;
          markdown += `![题目图片](${question.image_url})\n\n`;
        }
        
        markdown += '---\n\n';
      });
    }
    
    // 5. OJ题部分
    markdown += '# 第二部分：OJ题（编程题）\n\n';
    
    if (ojProblems.length === 0) {
      markdown += '暂无OJ题数据。\n\n';
    } else {
      ojProblems.forEach((problem, index) => {
        markdown += `## OJ题 ${index + 1} (ID: ${problem.id})\n\n`;
        
        // 题目标题
        markdown += `### 题目标题\n\n`;
        markdown += `**${problem.title}**\n\n`;
        
        // 题目基本信息
        if (problem.publish_date) {
          // 格式化日期
          let publishDate = problem.publish_date;
          if (publishDate instanceof Date) {
            publishDate = publishDate.toISOString().split('T')[0];
          } else if (typeof publishDate === 'string') {
            // 如果是日期字符串，尝试格式化
            const date = new Date(publishDate);
            if (!isNaN(date.getTime())) {
              publishDate = date.toISOString().split('T')[0];
            }
          }
          markdown += `**发布日期**: ${publishDate}\n\n`;
        }
        markdown += `**时间限制**: ${problem.time_limit}ms\n\n`;
        markdown += `**内存限制**: ${problem.memory_limit}MB\n\n`;
        
        // 题目描述
        markdown += `### 题目描述\n\n`;
        markdown += problem.description;
        markdown += '\n\n';
        
        // 输入格式
        if (problem.input_format) {
          markdown += `### 输入格式\n\n`;
          markdown += problem.input_format;
          markdown += '\n\n';
        }
        
        // 输出格式
        if (problem.output_format) {
          markdown += `### 输出格式\n\n`;
          markdown += problem.output_format;
          markdown += '\n\n';
        }
        
        // 数据范围
        if (problem.data_range) {
          markdown += `### 数据范围\n\n`;
          markdown += problem.data_range;
          markdown += '\n\n';
        }
        
        // 测试样例
        if (problem.samples && problem.samples.length > 0) {
          markdown += `### 测试样例\n\n`;
          problem.samples.forEach((sample, sampleIndex) => {
            if (sample.is_displayed) {
              markdown += `#### 样例 ${sampleIndex + 1}\n\n`;
              
              markdown += `**输入**:\n\n`;
              markdown += '```\n';
              markdown += sample.input;
              markdown += '\n```\n\n';
              
              markdown += `**输出**:\n\n`;
              markdown += '```\n';
              markdown += sample.output;
              markdown += '\n```\n\n';
              
              if (sample.explanation) {
                markdown += `**说明**: ${sample.explanation}\n\n`;
              }
            }
          });
        }
        
        // 统计信息
        markdown += `### 统计信息\n\n`;
        markdown += `- 总提交数: ${problem.total_submissions}\n`;
        markdown += `- 通过提交数: ${problem.accepted_submissions}\n`;
        if (problem.total_submissions > 0) {
          const passRate = ((problem.accepted_submissions / problem.total_submissions) * 100).toFixed(2);
          markdown += `- 通过率: ${passRate}%\n`;
        }
        markdown += '\n';
        
        markdown += '---\n\n';
      });
    }
    
    // 6. 保存到文件
    const outputPath = path.join(__dirname, 'GESP_1级_题目数据.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log(`\n✅ Markdown文件已生成: ${outputPath}`);
    console.log(`\n文件大小: ${(markdown.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('导出数据失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行导出
exportGESPLevel1Data()
  .then(() => {
    console.log('\n✅ 导出完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 导出失败:', error);
    process.exit(1);
  });

