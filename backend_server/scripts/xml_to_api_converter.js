const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

/**
 * 清理 CDATA 中的 HTML 标签，保留纯文本
 */
function cleanHTML(htmlString) {
  if (!htmlString) return '';
  
  // 如果是数组，取第一个元素
  if (Array.isArray(htmlString)) {
    htmlString = htmlString[0];
  }
  
  // 如果是对象，尝试获取文本内容
  if (typeof htmlString === 'object') {
    htmlString = htmlString._ || htmlString.toString();
  }
  
  // 确保是字符串
  if (typeof htmlString !== 'string') {
    return '';
  }
  
  // 移除 <span class="md auto_select"> 等包装标签
  let text = htmlString.replace(/<span[^>]*>/gi, '');
  text = text.replace(/<\/span>/gi, '');
  
  // 保留段落结构，将 <p> 转换为换行
  text = text.replace(/<p>/gi, '\n');
  text = text.replace(/<\/p>/gi, '');
  
  // 保留换行
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // 移除其他 HTML 标签
  text = text.replace(/<[^>]+>/g, '');
  
  // 解码 HTML 实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#44;/g, ',')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // 清理多余的空白
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // 多个空行变为两个
  text = text.trim();
  
  return text;
}

/**
 * 从标题中提取日期
 * 例如: "[GESP202506 一级] 假期阅读" -> "2025-06"
 */
function extractDate(title) {
  // 如果是数组，取第一个元素
  if (Array.isArray(title)) {
    title = title[0];
  }
  
  // 如果是对象，尝试获取文本内容
  if (typeof title === 'object') {
    title = title._ || title.toString();
  }
  
  // 确保是字符串
  if (typeof title !== 'string') {
    return new Date().toISOString().split('T')[0];
  }
  
  const match = title.match(/\[GESP(\d{6})/);
  if (match) {
    const dateStr = match[1]; // 例如 "202506"
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    return `${year}-${month}-01`;
  }
  return new Date().toISOString().split('T')[0]; // 默认当前日期
}

/**
 * 从 source 中提取级别
 * 例如: "GESP一级" -> 1, "GESP二级" -> 2
 */
function extractLevel(source) {
  if (!source) return 1;
  
  // 如果是数组，取第一个元素
  if (Array.isArray(source)) {
    source = source[0];
  }
  
  // 如果是对象，尝试获取文本内容
  if (typeof source === 'object') {
    source = source._ || source.toString();
  }
  
  // 确保是字符串
  if (typeof source !== 'string') {
    return 1;
  }
  
  const levelMap = {
    '一级': 1,
    '二级': 2,
    '三级': 3,
    '四级': 4,
    '五级': 5,
    '六级': 6
  };
  
  for (const [key, value] of Object.entries(levelMap)) {
    if (source.includes(key)) {
      return value;
    }
  }
  
  return 1; // 默认一级
}

/**
 * 辅助函数：获取字符串值
 */
function getString(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value === 'object') {
    value = value._ || '';
  }
  return (value || '').toString().trim();
}

/**
 * 转换单个题目
 */
function convertProblem(item) {
  // 提取基本信息
  const title = item.title?.[0] || '';
  const description = cleanHTML(item.description?.[0] || '');
  const inputFormat = cleanHTML(item.input?.[0] || '');
  const outputFormat = cleanHTML(item.output?.[0] || '');
  const dataRange = cleanHTML(item.hint?.[0] || '');
  
  // 时间和内存限制
  const timeLimit = parseInt(item.time_limit?.[0]?._ || item.time_limit?.[0] || '1') * 1000; // 转换为毫秒
  const memoryLimit = parseInt(item.memory_limit?.[0]?._ || item.memory_limit?.[0] || '128');
  
  // 级别和日期
  const source = item.source?.[0] || '';
  const level = extractLevel(source);
  const publishDate = extractDate(title);
  
  // 处理样例
  const samples = [];
  let sortOrder = 1;
  
  // 添加主样例（sample_input/sample_output）
  if (item.sample_input && item.sample_output) {
    samples.push({
      input: getString(item.sample_input[0]),
      output: getString(item.sample_output[0]),
      explanation: '样例',
      is_hidden: false,          // 提交后可显示详细信息
      is_displayed: true,         // 查看题目时展示
      sort_order: sortOrder++
    });
  }
  
  // 添加测试样例（test_input/test_output）
  if (item.test_input && item.test_output) {
    for (let i = 0; i < item.test_input.length; i++) {
      const testInput = item.test_input[i];
      const testOutput = item.test_output[i];
      
      // 获取测试用例名称
      const testName = testInput.$ && testInput.$.name ? testInput.$.name : `test${i}`;
      
      samples.push({
        input: getString(testInput),
        output: getString(testOutput),
        explanation: testName,
        is_hidden: true,          // 提交后不显示详细信息（隐藏测试点）
        is_displayed: false,       // 查看题目时不展示
        sort_order: sortOrder++
      });
    }
  }
  
  return {
    title: cleanHTML(title),
    description,
    input_format: inputFormat,
    output_format: outputFormat,
    data_range: dataRange,
    time_limit: timeLimit,
    memory_limit: memoryLimit,
    level,
    publish_date: publishDate,
    samples
  };
}

/**
 * 解析 XML 文件并转换为 API 格式
 */
async function convertXMLToAPI(xmlFilePath, outputDir = null) {
  try {
    // 读取 XML 文件
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
    
    // 解析 XML
    const parser = new xml2js.Parser({
      explicitArray: true,
      preserveChildrenOrder: true,
      explicitCharkey: true
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    
    // 提取所有题目
    const items = result.fps?.item || [];
    console.log(`找到 ${items.length} 道题目`);
    
    // 转换每个题目
    const problems = items.map((item, index) => {
      console.log(`转换题目 ${index + 1}/${items.length}: ${item.title?.[0]}`);
      return convertProblem(item);
    });
    
    // 保存结果
    if (outputDir) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 保存为单个 JSON 文件
      const allProblemsPath = path.join(outputDir, 'all_problems.json');
      fs.writeFileSync(allProblemsPath, JSON.stringify(problems, null, 2), 'utf-8');
      console.log(`\n所有题目已保存到: ${allProblemsPath}`);
      
      // 保存为独立的题目文件
      problems.forEach((problem, index) => {
        const filename = `problem_${index + 1}_${problem.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_').substring(0, 30)}.json`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(problem, null, 2), 'utf-8');
      });
      
      console.log(`独立题目文件已保存到: ${outputDir}/`);
    }
    
    return problems;
  } catch (error) {
    console.error('转换失败:', error);
    throw error;
  }
}

// 命令行调用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node xml_to_api_converter.js <xml文件路径> [输出目录]');
    console.log('示例: node xml_to_api_converter.js ../oj_data/gesp/GESP_1_Level_2023-2025.09.xml ./converted_problems');
    process.exit(1);
  }
  
  const xmlFilePath = args[0];
  const outputDir = args[1] || './converted_problems';
  
  convertXMLToAPI(xmlFilePath, outputDir)
    .then(problems => {
      console.log(`\n✅ 成功转换 ${problems.length} 道题目！`);
    })
    .catch(error => {
      console.error('❌ 转换失败:', error.message);
      process.exit(1);
    });
}

module.exports = { convertXMLToAPI, convertProblem, cleanHTML, extractLevel, extractDate };

