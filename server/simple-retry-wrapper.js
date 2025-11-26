/**
 * 简化版智能重试包装器
 * 可以直接在现有代码中使用，最小改动
 */

/**
 * 执行带智能重试的 API 调用
 * @param {Function} apiCallFn - API 调用函数，接收 provider 参数
 * @param {Function} selectApiProvider - 选择 API 提供商函数
 * @param {Function} updateApiHealth - 更新健康状态函数
 * @param {Object} apiHealthStatus - 健康状态对象
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<Object>} { success, data, provider, attempts }
 */
export async function executeWithSmartRetry(
  apiCallFn,
  selectApiProvider,
  updateApiHealth,
  apiHealthStatus,
  maxRetries = 3
) {
  const triedProviders = new Set();
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let currentProvider = null;
    
    try {
      // 选择 API 提供商
      currentProvider = selectApiProvider();
      
      // 如果已经尝试过这个提供商，临时标记为不健康以选择下一个
      if (triedProviders.has(currentProvider)) {
        const originalHealthy = apiHealthStatus[currentProvider]?.healthy;
        
        if (apiHealthStatus[currentProvider]) {
          apiHealthStatus[currentProvider].healthy = false;
        }
        
        try {
          currentProvider = selectApiProvider();
        } catch (e) {
          // 恢复健康状态
          if (apiHealthStatus[currentProvider]) {
            apiHealthStatus[currentProvider].healthy = originalHealthy;
          }
          throw e;
        }
        
        // 恢复健康状态
        if (apiHealthStatus[currentProvider]) {
          apiHealthStatus[currentProvider].healthy = originalHealthy;
        }
      }
      
      triedProviders.add(currentProvider);
      
      // 日志输出
      if (attempt > 1) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} with provider: ${currentProvider}`);
      } else {
        console.log(`🚀 Processing request with provider: ${currentProvider}`);
      }
      
      // 执行 API 调用
      const result = await apiCallFn(currentProvider);
      
      // 成功！更新健康状态
      updateApiHealth(currentProvider, true);
      
      if (attempt > 1) {
        console.log(`✅ Request succeeded after ${attempt} attempts using ${currentProvider}`);
      } else {
        console.log(`✅ Request succeeded with ${currentProvider}`);
      }
      
      return {
        success: true,
        data: result,
        provider: currentProvider,
        attempts: attempt,
        triedProviders: Array.from(triedProviders)
      };
      
    } catch (error) {
      lastError = error;
      
      if (currentProvider) {
        console.error(`❌ Provider ${currentProvider} failed:`, error.message);
        updateApiHealth(currentProvider, false, error.message);
      }
      
      // 如果还有重试机会，继续
      if (attempt < maxRetries) {
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }
  }
  
  // 所有尝试都失败了
  console.error(`❌ All ${maxRetries} attempts failed`);
  console.error(`   Tried providers: ${Array.from(triedProviders).join(', ')}`);
  console.error(`   Last error: ${lastError?.message}`);
  
  throw new Error(
    `All API providers failed after ${maxRetries} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 使用示例：
 * 
 * // 在现有端点中使用
 * app.post('/api/analyze-image', async (req, res) => {
 *   try {
 *     const result = await executeWithSmartRetry(
 *       async (provider) => {
 *         // 原有的 API 调用逻辑
 *         const url = buildUrl(provider);
 *         const response = await fetch(url, options);
 *         const data = await response.json();
 *         return data;
 *       },
 *       selectApiProvider,
 *       updateApiHealth,
 *       apiHealthStatus,
 *       3 // 最多尝试 3 次
 *     );
 *     
 *     // 返回结果
 *     res.json(result.data);
 *     res.set('X-API-Provider', result.provider);
 *     
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 */

export default executeWithSmartRetry;

