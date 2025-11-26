/**
 * 自动应用智能API故障转移机制
 * 
 * 这个脚本会：
 * 1. 备份现有的 server/index.js
 * 2. 在适当的位置插入智能路由器代码
 * 3. 验证修改是否成功
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INDEX_FILE = path.join(__dirname, 'index.js');
const BACKUP_FILE = path.join(__dirname, 'index.js.backup');

console.log('🚀 开始应用智能API故障转移机制...\n');

// 步骤 1: 备份原文件
console.log('📋 步骤 1: 备份原文件');
try {
  if (fs.existsSync(INDEX_FILE)) {
    fs.copyFileSync(INDEX_FILE, BACKUP_FILE);
    console.log(`✅ 已备份到: ${BACKUP_FILE}\n`);
  } else {
    console.error('❌ 找不到 server/index.js 文件');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 备份失败:', error.message);
  process.exit(1);
}

// 步骤 2: 读取文件内容
console.log('📖 步骤 2: 读取文件内容');
let content;
try {
  content = fs.readFileSync(INDEX_FILE, 'utf-8');
  console.log(`✅ 文件大小: ${content.length} 字符\n`);
} catch (error) {
  console.error('❌ 读取失败:', error.message);
  process.exit(1);
}

// 步骤 3: 检查是否已经集成
console.log('🔍 步骤 3: 检查是否已经集成');
if (content.includes('createApiWrapper') || content.includes('smart-api-router')) {
  console.log('⚠️  检测到已经集成了智能路由器');
  console.log('💡 如果需要重新集成，请先删除相关代码\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('是否继续？(y/n): ', (answer) => {
    readline.close();
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ 已取消');
      process.exit(0);
    }
  });
}

// 步骤 4: 应用修改
console.log('✏️  步骤 4: 应用修改');

let modified = content;
let changesApplied = 0;

// 修改 1: 添加导入语句
if (!modified.includes('createApiWrapper')) {
  console.log('  📝 添加导入语句...');
  
  // 找到最后一个 import 语句
  const importRegex = /import\s+.*?from\s+['"].*?['"];/g;
  const imports = modified.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = modified.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    
    const newImport = "\nimport { createApiWrapper } from './smart-api-router.js';";
    modified = modified.slice(0, insertPosition) + newImport + modified.slice(insertPosition);
    
    console.log('  ✅ 已添加导入语句');
    changesApplied++;
  } else {
    console.log('  ⚠️  找不到导入语句位置');
  }
}

// 修改 2: 创建 API 包装器实例
if (!modified.includes('const apiWrapper = createApiWrapper')) {
  console.log('  📝 创建 API 包装器实例...');
  
  // 找到 getApiKeys 函数之后的位置
  const getApiKeysRegex = /const getApiKeys = [\s\S]*?return apiKeys;\s*};/;
  const match = modified.match(getApiKeysRegex);
  
  if (match) {
    const insertPosition = match.index + match[0].length;
    
    const wrapperCode = `

// 创建智能API包装器（自动故障转移）
const apiWrapper = createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
});
`;
    
    modified = modified.slice(0, insertPosition) + wrapperCode + modified.slice(insertPosition);
    
    console.log('  ✅ 已创建 API 包装器实例');
    changesApplied++;
  } else {
    console.log('  ⚠️  找不到 getApiKeys 函数');
  }
}

console.log(`\n✅ 应用了 ${changesApplied} 处修改\n`);

// 步骤 5: 保存修改
console.log('💾 步骤 5: 保存修改');
try {
  fs.writeFileSync(INDEX_FILE, modified, 'utf-8');
  console.log('✅ 已保存修改\n');
} catch (error) {
  console.error('❌ 保存失败:', error.message);
  console.log('💡 正在恢复备份...');
  fs.copyFileSync(BACKUP_FILE, INDEX_FILE);
  console.log('✅ 已恢复备份');
  process.exit(1);
}

// 步骤 6: 验证修改
console.log('🔍 步骤 6: 验证修改');
try {
  const updatedContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  
  const checks = [
    {
      name: '导入语句',
      test: updatedContent.includes("import { createApiWrapper } from './smart-api-router.js'")
    },
    {
      name: 'API包装器实例',
      test: updatedContent.includes('const apiWrapper = createApiWrapper')
    },
    {
      name: '文件大小增加',
      test: updatedContent.length > content.length
    }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name}`);
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    console.log('\n⚠️  部分检查未通过，但文件已修改');
    console.log('💡 请手动检查 server/index.js 文件');
  } else {
    console.log('\n✅ 所有检查通过！');
  }
} catch (error) {
  console.error('❌ 验证失败:', error.message);
}

// 步骤 7: 显示后续步骤
console.log('\n' + '='.repeat(60));
console.log('🎉 智能API故障转移机制已应用！');
console.log('='.repeat(60));
console.log('\n📋 后续步骤：\n');
console.log('1. 检查修改:');
console.log('   git diff server/index.js\n');
console.log('2. 测试功能:');
console.log('   npm run dev:all\n');
console.log('3. 如果出现问题，恢复备份:');
console.log('   cp server/index.js.backup server/index.js\n');
console.log('4. 查看完整文档:');
console.log('   cat QUICK_INTEGRATION_GUIDE.md\n');
console.log('='.repeat(60));
console.log('\n💡 提示: 现在您需要手动更新各个端点以使用 apiWrapper');
console.log('   参考: server/integrate-smart-router-example.js\n');

