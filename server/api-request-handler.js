/**
 * 统一的 API 请求处理器
 * 实现智能重试和自动切换机制
 */

/**
 * 执行 API 请求，带有智能重试和自动切换
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} API 响应
 */
export async function executeApiRequest(options) {
  const {
    requestData,           // 请求数据（parts, prompt 等）
    requiredCapability,    // 所需能力
    selectApiProvider,     // 提供商选择函数
    updateApiHealth,       // 健康状态更新函数
    apiHealthStatus,       // 健康状态对象
    getApiKeys,           // 获取 API 密钥函数
    buildRequestConfig,    // 构建请求配置函数
    parseResponse,         // 解析响应函数
    maxRetries = 3        // 最大重试次数
  } = options;

  const triedProviders = new Set();
  let attemptCount = 0;
  let lastError = null;

  while (attemptCount < maxRetries) {
    attemptCount++;
    let currentProvider = null;

    try {
      // 选择 API 提供商
      currentProvider = selectApiProvider(requiredCapability);
      
      // 检查是否已经尝试过
      if (triedProviders.has(currentProvider)) {
        // 临时标记为不健康，强制选择下一个
        if (apiHealthStatus[currentProvider]) {
          const originalHealthy = apiHealthStatus[currentProvider].healthy;
          apiHealthStatus[currentProvider].healthy = false;
          
          // 尝试选择新的提供商
          try {
            currentProvider = selectApiProvider(requiredCapability);
          } catch (e) {
            // 恢复健康状态
            apiHealthStatus[currentProvider].healthy = originalHealthy;
            throw e;
          }
        }
      }
      
      triedProviders.add(currentProvider);
      
      if (attemptCount > 1) {
        console.log(`🔄 Retry attempt ${attemptCount}/${maxRetries} with provider: ${currentProvider}`);
      } else {
        console.log(`🚀 Processing request with provider: ${currentProvider}`);
      }
      
      // 获取 API 密钥
      const apiKeys = getApiKeys();
      
      // 构建请求配置
      const { url, requestBody, headers } = buildRequestConfig(
        currentProvider,
        requestData,
        apiKeys
      );
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30秒超时
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        
        // 更新健康状态
        updateApiHealth(currentProvider, false, errorMessage);
        
        // 检查是否是致命错误
        if (isFatalError(errorMessage)) {
          console.error(`💀 Fatal error from ${currentProvider}, will not retry with this provider`);
          // 继续尝试下一个提供商
          if (attemptCount < maxRetries) {
            continue;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // 解析响应
      const data = await response.json();
      const result = parseResponse(currentProvider, data);
      
      // 成功！更新健康状态
      updateApiHealth(currentProvider, true);
      
      // 记录成功信息
      if (attemptCount > 1) {
        console.log(`✅ Request succeeded after ${attemptCount} attempts using ${currentProvider}`);
      } else {
        console.log(`✅ Request succeeded with ${currentProvider}`);
      }
      
      return {
        success: true,
        data: result,
        provider: currentProvider,
        attempts: attemptCount,
        triedProviders: Array.from(triedProviders)
      };
      
    } catch (error) {
      lastError = error;
      
      if (currentProvider) {
        console.error(`❌ Provider ${currentProvider} failed:`, error.message);
        updateApiHealth(currentProvider, false, error.message);
      }
      
      // 检查是否应该重试
      if (attemptCount < maxRetries) {
        const shouldRetry = isRetryableError(error);
        
        if (shouldRetry) {
          console.log(`🔄 Error is retryable, switching to next provider...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        } else {
          console.error(`💀 Error is not retryable: ${error.message}`);
          // 但仍然尝试其他提供商
          if (triedProviders.size < maxRetries) {
            continue;
          }
        }
      }
      
      // 没有更多重试机会
      break;
    }
  }
  
  // 所有尝试都失败
  console.error(`❌ All attempts exhausted (${attemptCount} attempts)`);
  console.error(`   Tried providers: ${Array.from(triedProviders).join(', ')}`);
  console.error(`   Last error: ${lastError?.message}`);
  
  throw new Error(
    `Request failed after ${attemptCount} attempts with ${triedProviders.size} providers. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 检查错误是否可重试
 */
function isRetryableError(error) {
  const retryablePatterns = [
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENETUNREACH',
    'network',
    'fetch failed',
    'socket hang up',
    '429', // Rate limit
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ];
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = (error.code || '').toLowerCase();
  
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase()) || 
    errorCode.includes(pattern.toLowerCase())
  );
}

/**
 * 检查是否是致命错误
 */
function isFatalError(errorMessage) {
  const fatalPatterns = [
    'API key was reported as leaked',
    'key has been leaked',
    'invalid authentication',
    'unauthorized',
    'forbidden',
    'quota exceeded',
    'billing',
    'payment required',
    'Model Agreement'
  ];
  
  const message = (errorMessage || '').toLowerCase();
  
  return fatalPatterns.some(pattern => 
    message.includes(pattern.toLowerCase())
  );
}

export default {
  executeApiRequest,
  isRetryableError,
  isFatalError
};

