#!/usr/bin/env node

/**
 * 批量替换 Vue 文件中硬编码的 API 地址
 * 根据 MIGRATION_GUIDE.md 的规则自动替换
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 递归查找所有 Vue 文件
function findVueFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (file !== 'node_modules' && file !== 'dist') {
        findVueFiles(filePath, fileList);
      }
    } else if (file.endsWith('.vue')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 需要替换的模式
const REPLACEMENTS = [
  // 完整 API URL (带 /api)
  {
    pattern: /['"`]http:\/\/106\.14\.143\.27:3000\/api([^'"`]*?)['"`]/g,
    replacement: (match, path) => {
      // 如果是在模板字符串中，使用 ${BASE_URL}
      const quote = match[0];
      if (quote === '`') {
        return `\`\${BASE_URL}${path}\``;
      }
      return `\`\${BASE_URL}${path}\``;
    },
    needsImport: 'BASE_URL',
    description: 'API URL with /api'
  },
  // API URL 在字符串中（不带引号，用于模板字符串）
  {
    pattern: /http:\/\/106\.14\.143\.27:3000\/api([^'"`\s]*)/g,
    replacement: (match, path) => `\${BASE_URL}${path}`,
    needsImport: 'BASE_URL',
    description: 'API URL in template string'
  },
  // 服务器基础 URL (不带 /api，用于图片等)
  {
    pattern: /['"`]http:\/\/106\.14\.143\.27:3000([^'"`]*?)['"`]/g,
    replacement: (match, path) => {
      const quote = match[0];
      if (quote === '`') {
        return `\`\${API_SERVER_BASE}${path}\``;
      }
      return `\`\${API_SERVER_BASE}${path}\``;
    },
    needsImport: 'API_SERVER_BASE',
    description: 'Server base URL'
  },
  // 服务器基础 URL 在字符串中
  {
    pattern: /http:\/\/106\.14\.143\.27:3000([^'"`\s]*)/g,
    replacement: (match, path) => {
      // 如果路径以 /api 开头，使用 BASE_URL
      if (path.startsWith('/api')) {
        return `\${BASE_URL}${path.substring(4)}`;
      }
      return `\${API_SERVER_BASE}${path}`;
    },
    needsImport: 'API_SERVER_BASE',
    description: 'Server base URL in template string'
  },
  // replace 方法中的替换
  {
    pattern: /\.replace\([^,]+,\s*['"]http:\/\/106\.14\.143\.27:3000['"]\)/g,
    replacement: (match) => {
      // 检查是否已经有 API_SERVER_BASE 导入
      return match.replace(/['"]http:\/\/106\.14\.143\.27:3000['"]/, 'API_SERVER_BASE');
    },
    needsImport: 'API_SERVER_BASE',
    description: 'Replace method with hardcoded URL'
  },
  // 在 data() 中定义的 BASE_URL (需要特殊处理)
  {
    pattern: /BASE_URL:\s*['"]http:\/\/106\.14\.143\.27:3000\/api['"]/g,
    replacement: () => {
      // 在 Options API 中，我们需要导入 BASE_URL 并在 data() 中使用
      // 替换为 BASE_URL: BASE_URL（引用导入的常量）
      return "BASE_URL: BASE_URL";
    },
    needsImport: 'BASE_URL',
    needsDataFix: true,
    description: 'BASE_URL in data()'
  },
];

// AI API URL (8000端口)
const AI_REPLACEMENTS = [
  {
    pattern: /['"`]http:\/\/106\.14\.143\.27:8000\/api([^'"`]*?)['"`]/g,
    replacement: (match, path) => {
      const quote = match[0];
      if (quote === '`') {
        return `\`\${AI_API_BASE_URL}${path}\``;
      }
      return `\`\${AI_API_BASE_URL}${path}\``;
    },
    needsImport: 'AI_API_BASE_URL',
    description: 'AI API URL'
  },
  {
    pattern: /http:\/\/106\.14\.143\.27:8000\/api([^'"`\s]*)/g,
    replacement: (match, path) => `\${AI_API_BASE_URL}${path}`,
    needsImport: 'AI_API_BASE_URL',
    description: 'AI API URL in template string'
  },
];

// 检查文件是否已经导入了所需的模块
function hasImport(content, importName) {
  const importPattern = new RegExp(`import\\s*\\{[^}]*\\b${importName}\\b[^}]*\\}\\s*from\\s*['"]@/config/api['"]`, 'g');
  return importPattern.test(content);
}

// 添加 import 语句
function addImport(content, imports) {
  if (imports.length === 0) return content;

  // 检查是否已有 @/config/api 的导入
  const existingImportPattern = /import\s*\{([^}]+)\}\s*from\s*['"]@\/config\/api['"]/;
  const existingMatch = content.match(existingImportPattern);

  if (existingMatch) {
    // 合并到现有导入
    const existingImports = existingMatch[1]
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);
    
    const allImports = [...new Set([...existingImports, ...imports])].sort();
    const newImport = `import { ${allImports.join(', ')} } from '@/config/api'`;
    
    return content.replace(existingImportPattern, newImport);
  }

  // 查找 script 标签的位置
  const scriptMatch = content.match(/<script[^>]*>/);
  if (!scriptMatch) {
    log(`警告: 未找到 <script> 标签`, 'yellow');
    return content;
  }

  // 在 script 标签后添加 import
  const scriptEnd = scriptMatch.index + scriptMatch[0].length;
  const beforeScript = content.substring(0, scriptEnd);
  const afterScript = content.substring(scriptEnd);
  
  // 查找第一个 import 或 const/let/var 的位置
  const firstCodeMatch = afterScript.match(/^\s*(import|const|let|var|function|export|interface|type)/m);
  let insertPosition = scriptEnd;
  
  if (firstCodeMatch) {
    insertPosition = scriptEnd + firstCodeMatch.index;
  } else {
    // 如果没有找到代码，在 script 标签后直接插入
    insertPosition = scriptEnd;
  }

  const importStatement = `import { ${imports.join(', ')} } from '@/config/api'\n`;
  
  return content.substring(0, insertPosition) + importStatement + content.substring(insertPosition);
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const neededImports = new Set();

  // 处理所有替换规则
  for (const rule of REPLACEMENTS) {
    const matches = [...content.matchAll(rule.pattern)];
    if (matches.length > 0) {
      log(`  ${rule.description}: ${matches.length} 处`, 'blue');
      
      content = content.replace(rule.pattern, (match, ...args) => {
        modified = true;
        neededImports.add(rule.needsImport);
        return rule.replacement(match, ...args);
      });
    }
  }

  // 处理 AI API 替换
  for (const rule of AI_REPLACEMENTS) {
    const matches = [...content.matchAll(rule.pattern)];
    if (matches.length > 0) {
      log(`  ${rule.description}: ${matches.length} 处`, 'blue');
      
      content = content.replace(rule.pattern, (match, ...args) => {
        modified = true;
        neededImports.add(rule.needsImport);
        return rule.replacement(match, ...args);
      });
    }
  }

  // 添加必要的 import
  if (modified && neededImports.size > 0) {
    const importsToAdd = Array.from(neededImports).filter(imp => !hasImport(content, imp));
    if (importsToAdd.length > 0) {
      content = addImport(content, importsToAdd);
      log(`  添加导入: ${importsToAdd.join(', ')}`, 'green');
    }
  }

  // 特殊处理：如果文件中有 data() 方法且使用了 BASE_URL
  if (content.includes('data()') && neededImports.has('BASE_URL')) {
    // 确保在 data() 之前有导入
    if (!hasImport(content, 'BASE_URL')) {
      content = addImport(content, ['BASE_URL']);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// 主函数
function main() {
  log('开始替换硬编码的 API 地址...\n', 'blue');

  // 查找所有 Vue 文件
  const srcDir = path.join(__dirname, 'src');
  const vueFiles = findVueFiles(srcDir);

  log(`找到 ${vueFiles.length} 个 Vue 文件\n`, 'blue');

  let processedCount = 0;
  let modifiedCount = 0;

  for (const file of vueFiles) {
    // 跳过配置文件
    if (file.includes('config/api.ts')) {
      continue;
    }

    log(`处理: ${file}`, 'yellow');
    const modified = processFile(file);
    
    if (modified) {
      modifiedCount++;
      log(`  ✓ 已修改\n`, 'green');
    } else {
      log(`  - 无需修改\n`, 'reset');
    }
    
    processedCount++;
  }

  log('\n' + '='.repeat(50), 'blue');
  log(`处理完成！`, 'green');
  log(`  总文件数: ${processedCount}`, 'blue');
  log(`  修改文件数: ${modifiedCount}`, 'green');
  log(`  未修改文件数: ${processedCount - modifiedCount}`, 'reset');
  log('\n提示: 请检查修改后的文件，确保替换正确。', 'yellow');
  log('运行 "grep -r \\"http://106.14.143.27:3000\\" src/" 验证是否还有遗漏。\n', 'yellow');
}

// 运行脚本
try {
  main();
} catch (error) {
  log(`错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

