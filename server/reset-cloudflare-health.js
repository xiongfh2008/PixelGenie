/**
 * 重置 Cloudflare API 健康状态
 */

import fetch from 'node-fetch';

const PORT = process.env.PORT || 3001;

async function resetHealth() {
  console.log('\n🔄 重置 Cloudflare API 健康状态\n');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`http://localhost:${PORT}/api/reset-health-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'cloudflare'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('\n✅ Cloudflare 健康状态已重置');
      console.log('📊 新状态:', JSON.stringify(data.status, null, 2));
      console.log('\n💡 现在 Cloudflare API 将在下次健康检查时重新测试');
      console.log('⏱️  下次健康检查将在 5 分钟内自动进行\n');
    } else {
      console.log('\n❌ 重置失败:', data.error);
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    console.error('\n💡 请确保服务器正在运行: npm run dev:all\n');
  }
  
  console.log('='.repeat(60) + '\n');
}

resetHealth();

