/**
 * 智能 API 重试和自动切换机制
 * 当某个模型出现异常时，自动切换到其他可用模型，对用户无感知
 */

/**
 * 执行 API 请求，带有自动重试和切换机制
 * @param {Function} apiCallFunction - API 调用函数
 * @param {Object} params - API 调用参数
 * @param {string} requiredCapability - 所需能力（如 'imageModification', 'imageAnalysis'）
 * @param {Function} selectApiProvider - API 提供商选择函数
 * @param {Function} updateApiHealth - 更新 API 健康状态函数
 * @param {Object} apiHealthStatus - API 健康状态对象
 * @param {number} maxRetries - 最大重试次数（默认 3）
 * @returns {Promise<Object>} API 响应
 */
export async function executeWithSmartRetry(
  apiCallFunction,
  params,
  requiredCapability,
  selectApiProvider,
  updateApiHealth,
  apiHealthStatus,
  maxRetries = 3
) {
  const triedProviders = new Set(); // 记录已尝试的提供商
  let lastError = null;
  let attemptCount = 0;

  while (attemptCount < maxRetries) {
    attemptCount++;
    
    try {
      // 选择 API 提供商（自动排除已失败的）
      const provider = selectApiProvider(requiredCapability);
      
      // 如果这个提供商已经尝试过且失败了，跳过
      if (triedProviders.has(provider)) {
        console.log(`⏭️  Skipping already tried provider: ${provider}`);
        // 临时标记为不健康，以便选择下一个
        if (apiHealthStatus[provider]) {
          apiHealthStatus[provider].healthy = false;
        }
        continue;
      }
      
      triedProviders.add(provider);
      console.log(`🔄 Attempt ${attemptCount}/${maxRetries} using provider: ${provider}`);
      
      // 执行 API 调用
      const result = await apiCallFunction(provider, params);
      
      // 成功！更新健康状态并返回结果
      updateApiHealth(provider, true);
      console.log(`✅ Request succeeded with provider: ${provider}`);
      
      return {
        success: true,
        data: result,
        provider: provider,
        attempts: attemptCount
      };
      
    } catch (error) {
      lastError = error;
      const currentProvider = Array.from(triedProviders).pop();
      
      console.error(`❌ Provider ${currentProvider} failed:`, error.message);
      
      // 更新健康状态
      if (currentProvider) {
        updateApiHealth(currentProvider, false, error.message);
      }
      
      // 如果还有重试机会，继续尝试下一个提供商
      if (attemptCount < maxRetries) {
        console.log(`🔄 Switching to next available provider...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟
        continue;
      }
    }
  }
  
  // 所有尝试都失败了
  console.error(`❌ All ${attemptCount} attempts failed`);
  console.error(`   Tried providers: ${Array.from(triedProviders).join(', ')}`);
  
  throw new Error(
    `All API providers failed after ${attemptCount} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 为特定端点创建智能重试包装器
 * @param {Function} selectApiProvider - API 提供商选择函数
 * @param {Function} updateApiHealth - 更新健康状态函数
 * @param {Object} apiHealthStatus - 健康状态对象
 * @returns {Function} 包装后的执行函数
 */
export function createSmartRetryWrapper(selectApiProvider, updateApiHealth, apiHealthStatus) {
  return async function(apiCallFunction, params, requiredCapability, maxRetries = 3) {
    return executeWithSmartRetry(
      apiCallFunction,
      params,
      requiredCapability,
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      maxRetries
    );
  };
}

/**
 * 检查错误是否可重试
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function isRetryableError(error) {
  const retryablePatterns = [
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'network',
    'fetch failed',
    '429', // Rate limit
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase()) || 
    errorCode.includes(pattern.toLowerCase())
  );
}

/**
 * 检查错误是否是致命错误（不应重试）
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否是致命错误
 */
export function isFatalError(error) {
  const fatalPatterns = [
    'API key was reported as leaked',
    'invalid authentication',
    'unauthorized',
    '401',
    '403', // Forbidden
    'quota exceeded',
    'billing'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  
  return fatalPatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

export default {
  executeWithSmartRetry,
  createSmartRetryWrapper,
  isRetryableError,
  isFatalError
};

