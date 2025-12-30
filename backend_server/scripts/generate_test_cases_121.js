const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 参考代码
const referenceCode = `#include<iostream>
#include<cstdio>

using namespace std;

int main(){
    double V,G,M,N;
    cin>>V>>G>>M>>N;
    double ans1,ans2;
    ans1=0.5*V;
    if (G<300){
        ans2=M;
    }else{
        ans2=N;
    }
    if (ans1<ans2){
        printf("%.1lf",ans1);
    }else{
        printf("%.1lf",ans2);
    }    
}`;

// 生成测试用例的输入（V, G, M, N），确保是一位小数且小数不为0
// 设计更平衡的测试用例，覆盖各种情况
// 目标：体积更便宜和重量更便宜各占一半（各5个）
// 情况分类：
// 1. G<300, ans1<ans2 (体积更便宜): 0.5*V < M
// 2. G<300, ans1>ans2 (重量更便宜): 0.5*V > M
// 3. G>=300, ans1<ans2 (体积更便宜): 0.5*V < N
// 4. G>=300, ans1>ans2 (重量更便宜): 0.5*V > N
const testInputs = [
  { V: 100.4, G: 300.2, M: 60.6, N: 70.5 },  // 已有样例1: G>=300, ans1=50.2<ans2=70.5 (体积更便宜)
  { V: 99.8, G: 200.9, M: 60.2, N: 70.1 },   // 已有样例2: G<300, ans1=49.9<ans2=60.2 (体积更便宜)
  // 新增测试用例，确保平衡（体积更便宜3个，重量更便宜5个）
  { V: 80.2, G: 250.3, M: 50.1, N: 35.9 },   // G<300, ans1=40.1<ans2=50.1 (体积更便宜)
  { V: 100.2, G: 280.4, M: 60.1, N: 55.8 },  // G<300, ans1=50.1<ans2=60.1 (体积更便宜)
  { V: 50.6, G: 320.5, M: 50.2, N: 40.4 },   // G>=300, ans1=25.3<ans2=40.4 (体积更便宜)
  { V: 120.6, G: 150.7, M: 45.2, N: 55.8 },  // G<300, ans1=60.3>ans2=45.2 (重量更便宜)
  { V: 200.4, G: 350.4, M: 80.3, N: 95.5 },  // G>=300, ans1=100.2>ans2=95.5 (重量更便宜)
  { V: 140.8, G: 400.6, M: 60.5, N: 65.2 },  // G>=300, ans1=70.4>ans2=65.2 (重量更便宜)
  { V: 60.4, G: 180.2, M: 25.1, N: 40.7 },   // G<300, ans1=30.2>ans2=25.1 (重量更便宜)
  { V: 180.6, G: 300.1, M: 90.4, N: 85.3 }   // G>=300, ans1=90.3>ans2=85.3 (重量更便宜)
];

// 创建临时目录
const tempDir = path.join(__dirname, 'temp_test_121');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 保存参考代码
const codePath = path.join(tempDir, 'solution.cpp');
fs.writeFileSync(codePath, referenceCode);

console.log('=========================================');
console.log('生成题目121测试用例工作流');
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
  const input = `${testInput.V}\n${testInput.G}\n${testInput.M}\n${testInput.N}`;
  
  console.log(`[${i + 1}/${testInputs.length}] 生成测试用例 ${i + 1}`);
  console.log(`  输入: V=${testInput.V}, G=${testInput.G}, M=${testInput.M}, N=${testInput.N}`);
  
  // 运行代码
  try {
    const output = execSync(
      `echo "${input}" | ${path.join(tempDir, 'solution')}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim();
    
    console.log(`  输出: ${output}`);
    
    // 计算验证
    const ans1 = 0.5 * testInput.V;
    const ans2 = testInput.G < 300 ? testInput.M : testInput.N;
    const expected = ans1 < ans2 ? ans1 : ans2;
    console.log(`  验证: ans1=${ans1.toFixed(1)}, ans2=${ans2.toFixed(1)}, 结果=${expected.toFixed(1)}`);
    console.log(`  ✓ 成功生成\n`);
    
    testCases.push({
      input: input,
      output: output,
      index: i + 1,
      V: testInput.V,
      G: testInput.G,
      M: testInput.M,
      N: testInput.N
    });
  } catch (error) {
    console.error(`  ✗ 运行失败:`, error.message);
  }
}

// 步骤3: 生成测试样例JSON
console.log('步骤3: 生成测试样例JSON...\n');

// 前2个是已有的展示样例，后面8个中前3个展示，后5个隐藏
const samples = testCases.map((testCase, index) => {
  const isDisplayed = index < 5; // 前5个展示（包括已有的2个）
  const isHidden = index >= 5;  // 后5个隐藏
  
  // 生成explanation
  const ans1 = 0.5 * testCase.V;
  const ans2 = testCase.G < 300 ? testCase.M : testCase.N;
  const result = ans1 < ans2 ? ans1 : ans2;
  
  let explanation = '';
  explanation += `按体积计算：$0.5 \\times ${testCase.V} = ${ans1.toFixed(1)}$ 元；`;
  if (testCase.G < 300) {
    explanation += `按重量计算：$G=${testCase.G} < 300$，所以运费为 $M=${testCase.M}$ 元。`;
  } else {
    explanation += `按重量计算：$G=${testCase.G} \\geq 300$，所以运费为 $N=${testCase.N}$ 元。`;
  }
  explanation += `取较小值 $${result.toFixed(1)}$ 元。`;
  
  return {
    problem_id: 121,
    input: testCase.input,
    output: testCase.output,
    explanation: explanation,
    is_hidden: isHidden,
    is_displayed: isDisplayed,
    sort_order: index + 1
  };
});

// 保存到文件
const outputPath = path.join(__dirname, '..', 'oj_samples_121_additional.json');
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

