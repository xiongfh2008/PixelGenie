/**
 * 重置 Google API 健康状态
 * 在更新 API 密钥后运行此脚本
 */

import fetch from 'node-fetch';

const PORT = process.env.PORT || 3001;

async function resetGoogleHealth() {
  console.log('\n🔄 重置 Google API 健康状态\n');
  console.log('='.repeat(60));
  console.log('\n⚠️  注意: 请确保您已经更新了 server/.env 中的 GOOGLE_API_KEY\n');
  
  try {
    const response = await fetch(`http://localhost:${PORT}/api/reset-health-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'google'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Google API 健康状态已重置');
      console.log('📊 新状态:', JSON.stringify(data.status, null, 2));
      console.log('\n💡 下一步:');
      console.log('   1. 确认 server/.env 中的 GOOGLE_API_KEY 已更新');
      console.log('   2. 重启服务器: npm run dev:all');
      console.log('   3. 系统会在下次健康检查时重新测试 Google API\n');
    } else {
      console.log('❌ 重置失败:', data.error);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.error('\n💡 请确保服务器正在运行: npm run dev:all\n');
  }
  
  console.log('='.repeat(60) + '\n');
}

resetGoogleHealth();

