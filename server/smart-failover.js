/**
 * 智能故障转移系统
 * 当某个模型出现异常时，自动切换到其他可用模型，对用户完全透明
 */

/**
 * 执行带有自动故障转移的 API 调用
 * @param {Function} apiCallFunction - API 调用函数
 * @param {Object} params - API 调用参数
 * @param {string} requiredCapability - 所需能力 (imageModification, imageAnalysis, textTranslation)
 * @param {Function} selectApiProvider - API 提供商选择函数
 * @param {Function} updateApiHealth - 更新 API 健康状态函数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<Object>} API 响应
 */
export async function executeWithFailover(
  apiCallFunction,
  params,
  requiredCapability,
  selectApiProvider,
  updateApiHealth,
  maxRetries = 3
) {
  const attemptedProviders = new Set();
  let lastError = null;
  let attemptCount = 0;

  while (attemptCount < maxRetries) {
    attemptCount++;

    try {
      // 选择 API 提供商（自动排除已尝试失败的）
      const provider = selectApiProvider(requiredCapability);

      // 如果已经尝试过这个提供商，跳过
      if (attemptedProviders.has(provider)) {
        console.log(`⏭️  Skipping already attempted provider: ${provider}`);
        // 标记为不健康，以便选择下一个
        updateApiHealth(provider, false, 'Already attempted in this request');
        continue;
      }

      attemptedProviders.add(provider);
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
      const currentProvider = Array.from(attemptedProviders).pop();

      console.error(`❌ Provider ${currentProvider} failed:`, error.message);

      // 更新健康状态
      updateApiHealth(currentProvider, false, error.message);

      // 如果还有重试机会，继续尝试下一个提供商
      if (attemptCount < maxRetries) {
        console.log(`🔄 Switching to next available provider...`);
        // 短暂延迟，避免过快重试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // 所有提供商都失败了
  console.error(`❌ All providers failed after ${attemptCount} attempts`);
  console.error(`Attempted providers: ${Array.from(attemptedProviders).join(', ')}`);

  throw new Error(
    `All API providers failed. Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Attempted: ${Array.from(attemptedProviders).join(', ')}`
  );
}

/**
 * 为特定端点创建带故障转移的处理函数
 * @param {Function} buildRequestBody - 构建请求体的函数
 * @param {Function} parseResponse - 解析响应的函数
 * @param {string} requiredCapability - 所需能力
 * @returns {Function} 处理函数
 */
export function createFailoverHandler(
  buildRequestBody,
  parseResponse,
  requiredCapability
) {
  return async (req, res, selectApiProvider, updateApiHealth, getApiKeys) => {
    try {
      // 定义 API 调用函数
      const apiCallFunction = async (provider, params) => {
        const apiKeys = getApiKeys();
        const { url, requestBody, headers } = buildRequestBody(provider, params, apiKeys);

        // 发送请求
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return parseResponse(data, provider);
      };

      // 执行带故障转移的调用
      const result = await executeWithFailover(
        apiCallFunction,
        req.body,
        requiredCapability,
        selectApiProvider,
        updateApiHealth,
        3 // 最多尝试 3 次
      );

      // 返回成功响应（不暴露内部切换细节）
      res.json(result.data);

    } catch (error) {
      console.error('Failover handler error:', error);
      res.status(500).json({
        error: error.message || 'Request failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
}

/**
 * 智能重试策略
 * 根据错误类型决定是否重试以及延迟时间
 */
export function getRetryStrategy(error) {
  const errorMessage = error.message?.toLowerCase() || '';

  // 不应该重试的错误
  const noRetryErrors = [
    'invalid input',
    'bad request',
    'validation error',
    'missing required',
    'invalid format'
  ];

  if (noRetryErrors.some(msg => errorMessage.includes(msg))) {
    return { shouldRetry: false, delay: 0 };
  }

  // 应该重试的错误及其延迟
  if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    return { shouldRetry: true, delay: 3000 }; // 3秒
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return { shouldRetry: true, delay: 1000 }; // 1秒
  }

  if (errorMessage.includes('server error') || errorMessage.includes('503')) {
    return { shouldRetry: true, delay: 2000 }; // 2秒
  }

  // 默认：重试，短延迟
  return { shouldRetry: true, delay: 500 };
}

export default {
  executeWithFailover,
  createFailoverHandler,
  getRetryStrategy
};

