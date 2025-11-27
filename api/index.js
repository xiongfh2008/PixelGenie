// Vercel Serverless Function Handler
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Image modification endpoint
app.post('/api/modify-image', async (req, res) => {
  try {
    const { imageData, prompt } = req.body;
    
    if (!imageData || !prompt) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        details: '请提供图片数据和提示词' 
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({
        error: '服务配置错误',
        details: 'API密钥未配置，请联系管理员'
      });
    }

    // Clean base64 data
    const cleanedBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanedBase64
            }
          },
          {
            text: prompt
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', errorText);
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image from response
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return res.json({ imageData: part.inlineData.data });
        }
      }
    }

    throw new Error('未能生成图像');
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: '图像编辑失败',
      details: error.message
    });
  }
});

// Export for Vercel
export default app;

