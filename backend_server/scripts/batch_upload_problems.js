const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * 批量上传题目到数据库
 */
class ProblemUploader {
  constructor(apiBaseUrl = 'http://localhost:3000') {
    this.apiBaseUrl = apiBaseUrl;
    this.uploadedCount = 0;
    this.failedCount = 0;
    this.failedProblems = [];
  }

  /**
   * 上传单个题目
   */
  async uploadProblem(problem, index, total) {
    try {
      console.log(`[${index}/${total}] 上传题目: ${problem.title}`);
      
      const response = await axios.post(
        `${this.apiBaseUrl}/api/oj/upload`,
        problem,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );
      
      if (response.data.success) {
        this.uploadedCount++;
        console.log(`  ✓ 成功上传，题目ID: ${response.data.data.problem_id}`);
        return { success: true, problemId: response.data.data.problem_id };
      } else {
        this.failedCount++;
        console.error(`  ✗ 上传失败: ${response.data.error}`);
        this.failedProblems.push({ title: problem.title, error: response.data.error });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      this.failedCount++;
      const errorMsg = error.response?.data?.error || error.message;
      console.error(`  ✗ 上传失败: ${errorMsg}`);
      this.failedProblems.push({ title: problem.title, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 批量上传题目列表
   */
  async uploadProblems(problems, delay = 100) {
    console.log(`\n开始批量上传 ${problems.length} 道题目...\n`);
    
    for (let i = 0; i < problems.length; i++) {
      await this.uploadProblem(problems[i], i + 1, problems.length);
      
      // 延迟一下，避免请求过快
      if (i < problems.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      total: problems.length,
      uploaded: this.uploadedCount,
      failed: this.failedCount,
      failedProblems: this.failedProblems
    };
  }

  /**
   * 从目录加载所有题目
   */
  loadProblemsFromDirectory(directory) {
    const allProblemsFile = path.join(directory, 'all_problems.json');
    
    if (!fs.existsSync(allProblemsFile)) {
      throw new Error(`文件不存在: ${allProblemsFile}`);
    }
    
    const content = fs.readFileSync(allProblemsFile, 'utf-8');
    const problems = JSON.parse(content);
    
    console.log(`从 ${directory} 加载了 ${problems.length} 道题目`);
    return problems;
  }

  /**
   * 打印上传结果统计
   */
  printSummary(result) {
    console.log('\n' + '='.repeat(60));
    console.log('上传结果统计');
    console.log('='.repeat(60));
    console.log(`总题目数: ${result.total}`);
    console.log(`成功上传: ${result.uploaded} ✓`);
    console.log(`上传失败: ${result.failed} ✗`);
    console.log('='.repeat(60));
    
    if (result.failedProblems.length > 0) {
      console.log('\n失败的题目：');
      result.failedProblems.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.title}`);
        console.log(`     错误: ${p.error}`);
      });
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node batch_upload_problems.js <题目目录路径> [API地址]');
    console.log('');
    console.log('示例:');
    console.log('  # 上传单个级别');
    console.log('  node batch_upload_problems.js scripts/converted_problems/level_1');
    console.log('');
    console.log('  # 上传所有级别');
    console.log('  node batch_upload_problems.js scripts/converted_problems/level_*');
    console.log('');
    console.log('  # 指定API地址');
    console.log('  node batch_upload_problems.js scripts/converted_problems/level_1 http://localhost:3000');
    process.exit(1);
  }
  
  const directory = args[0];
  const apiBaseUrl = args[1] || 'http://localhost:3000';
  
  const uploader = new ProblemUploader(apiBaseUrl);
  
  try {
    // 检查是否是通配符
    if (directory.includes('*')) {
      console.log('检测到通配符，将批量处理多个目录...\n');
      const baseDir = path.dirname(directory);
      const pattern = path.basename(directory);
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      
      const dirs = fs.readdirSync(baseDir)
        .filter(name => {
          const fullPath = path.join(baseDir, name);
          return fs.statSync(fullPath).isDirectory() && regex.test(name);
        })
        .sort();
      
      console.log(`找到 ${dirs.length} 个目录: ${dirs.join(', ')}\n`);
      
      let totalResult = {
        total: 0,
        uploaded: 0,
        failed: 0,
        failedProblems: []
      };
      
      for (const dir of dirs) {
        const fullDir = path.join(baseDir, dir);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`处理目录: ${dir}`);
        console.log('='.repeat(60));
        
        const problems = uploader.loadProblemsFromDirectory(fullDir);
        const result = await uploader.uploadProblems(problems, 100);
        
        totalResult.total += result.total;
        totalResult.uploaded += result.uploaded;
        totalResult.failed += result.failed;
        totalResult.failedProblems.push(...result.failedProblems);
      }
      
      console.log('\n\n' + '='.repeat(60));
      console.log('总体上传结果统计');
      console.log('='.repeat(60));
      uploader.printSummary(totalResult);
      
    } else {
      // 单个目录
      const problems = uploader.loadProblemsFromDirectory(directory);
      const result = await uploader.uploadProblems(problems, 100);
      uploader.printSummary(result);
    }
    
    if (uploader.failedCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('批量上传失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('程序异常:', error);
    process.exit(1);
  });
}

module.exports = { ProblemUploader };

