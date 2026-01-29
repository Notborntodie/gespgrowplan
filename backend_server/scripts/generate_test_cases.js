const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 参考代码
const referenceCode = `#include<iostream>

using namespace std;

int main(){
    int t,p;
    cin>>t;
    while(t--){
        cin>>p;
        if(p<=10){
            cout<<"R"<<endl;
        }else if(p>10 && p<=20) {
            cout<<"L"<<endl;
        }else if(p>20){
            cout<<p<<endl;
        }
    }
}`;

// 生成9个测试用例的输入，每个测试用例 T >= 5
const testInputs = [
  { t: 5, values: [1, 10, 11, 20, 21] },        // 边界值测试
  { t: 5, values: [5, 15, 25, 50, 100] },      // 一般值测试
  { t: 6, values: [1, 2, 10, 11, 20, 21] },    // 边界值扩展
  { t: 7, values: [5, 10, 15, 20, 25, 50, 75] }, // 混合测试
  { t: 8, values: [1, 5, 10, 11, 15, 20, 21, 50] }, // 全面覆盖
  { t: 10, values: [1, 5, 10, 11, 15, 20, 21, 30, 50, 100] }, // 大测试用例
  { t: 5, values: [3, 7, 12, 18, 99] },        // 随机值
  { t: 6, values: [1, 10, 20, 21, 50, 100] },  // 关键边界
  { t: 7, values: [2, 9, 10, 11, 19, 20, 21] }  // 边界附近
];

// 创建临时目录
const tempDir = path.join(__dirname, 'temp_test');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 保存参考代码
const codePath = path.join(tempDir, 'solution.cpp');
fs.writeFileSync(codePath, referenceCode);

console.log('=========================================');
console.log('生成测试用例工作流');
console.log('=========================================\n');

// 步骤1: 编译C++代码
console.log('步骤1: 编译C++参考代码...');
try {
  execSync(`g++ -o ${path.join(tempDir, 'solution')} ${codePath}`, { stdio: 'inherit' });
  console.log('✓ 编译成功\n');
} catch (error) {
  console.error('✗ 编译失败:', error.message);
  process.exit(1);
}

// 步骤2: 生成输入并运行代码获取输出
console.log('步骤2: 生成测试输入并运行代码...\n');
const testCases = [];

for (let i = 0; i < testInputs.length; i++) {
  const testInput = testInputs[i];
  const input = `${testInput.t}\n${testInput.values.join('\n')}`;
  
  console.log(`[${i + 1}/9] 生成测试用例 ${i + 1}`);
  console.log(`  输入:\n${input}`);
  
  // 运行代码
  try {
    const output = execSync(
      `echo "${input}" | ${path.join(tempDir, 'solution')}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim();
    
    console.log(`  输出:\n${output}`);
    console.log(`  ✓ 成功生成\n`);
    
    testCases.push({
      input: input,
      output: output,
      index: i + 1,
      t: testInput.t,
      values: testInput.values
    });
  } catch (error) {
    console.error(`  ✗ 运行失败:`, error.message);
  }
}

// 步骤3: 生成测试样例JSON
console.log('步骤3: 生成测试样例JSON...\n');

// 前4个是展示的（is_displayed: true, is_hidden: false）
// 后5个是隐藏的（is_displayed: false, is_hidden: true）
const samples = testCases.map((testCase, index) => {
  const isDisplayed = index < 4;
  const isHidden = index >= 4;
  
  // 生成explanation
  let explanation = '';
  const values = testCase.values;
  const outputs = testCase.output.split('\n');
  
  for (let i = 0; i < values.length; i++) {
    const p = values[i];
    const out = outputs[i];
    if (p <= 10) {
      explanation += `$P=${p}$（满足 $P \\leq 10$）$\\to ${out}$`;
    } else if (p > 10 && p <= 20) {
      explanation += `$P=${p}$（满足 $10 < P \\leq 20$）$\\to ${out}$`;
    } else {
      explanation += `$P=${p}$（满足 $P > 20$）$\\to ${out}$`;
    }
    if (i < values.length - 1) {
      explanation += '；';
    }
  }
  explanation += '。';
  
  return {
    problem_id: 122,
    input: testCase.input,
    output: testCase.output,
    explanation: explanation,
    is_hidden: isHidden,
    is_displayed: isDisplayed,
    sort_order: index + 2  // 从2开始，因为已有1个样例
  };
});

// 保存到文件
const outputPath = path.join(__dirname, '..', 'oj_samples_additional.json');
fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2), 'utf-8');

console.log('✓ 测试样例JSON已生成:', outputPath);
console.log(`  共生成 ${samples.length} 个测试样例`);
console.log(`  - 展示样例: ${samples.filter(s => s.is_displayed).length} 个`);
console.log(`  - 隐藏样例: ${samples.filter(s => s.is_hidden).length} 个\n`);

// 清理临时文件
console.log('清理临时文件...');
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ 清理完成\n');
} catch (error) {
  console.log('⚠ 清理失败（可忽略）:', error.message);
}

console.log('=========================================');
console.log('工作流完成！');
console.log('=========================================');
