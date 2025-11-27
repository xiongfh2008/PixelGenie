// Vercel Serverless Function Handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  }

  // Image modification
  if (pathname === '/api/modify-image' && req.method === 'POST') {
    try {
      const { imageData, prompt } = req.body;

      console.log('Request received:', {
        hasImageData: !!imageData,
        hasPrompt: !!prompt,
        imageDataLength: imageData?.length,
        prompt: prompt
      });

      if (!imageData || !prompt) {
        return res.status(400).json({
          error: '缺少必要参数',
          details: '请提供图片数据和提示词',
          received: { hasImageData: !!imageData, hasPrompt: !!prompt }
        });
      }

      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return res.status(503).json({
          error: '服务配置错误',
          details: 'API密钥未配置'
        });
      }

      // Clean base64
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

      // Extract image
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            return res.status(200).json({ imageData: part.inlineData.data });
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
  }

  // 404
  return res.status(404).json({ error: 'Not Found' });
}

