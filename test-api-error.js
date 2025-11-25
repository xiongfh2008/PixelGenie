import express from 'express';

const app = express();
app.use(express.json());

// 测试路由来模拟API密钥泄露错误 - 使用安全的测试方式
app.post('/test-leaked-key', async (req, res) => {
  try {
    // 模拟API密钥泄露错误，但不实际调用Google API
    // 这样可以避免在测试中暴露API密钥
    const mockError = {
      message: "API key leaked in URL parameters detected",
      details: {
        status: 401,
        error: "API_KEY_INVALID",
        message: "The provided API key is invalid or has been leaked in URL parameters."
      },
      stack: "Error: API key security violation detected"
    };
    
    // 返回模拟的错误响应
    res.status(401).json({ 
      error: mockError.message,
      details: mockError.details,
      security_issue: "API key should be passed in Authorization header, not URL parameters"
    });
  } catch (error) {
    console.error('Test Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});