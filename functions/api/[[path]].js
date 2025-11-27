// Cloudflare Pages Function for PixelGenie Backend
export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Cloudflare Pages function is running' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get API keys from environment
    const apiKeys = {
      google: env.GOOGLE_API_KEY,
      cloudflare: env.CLOUDFLARE_API_TOKEN,
      cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
      huggingface: env.HUGGINGFACE_API_KEY,
      xunfei: env.XUNFEI_API_KEY,
      xunfeiAppId: env.XUNFEI_APP_ID,
      xunfeiSecret: env.XUNFEI_API_SECRET,
    };

    // Parse request body
    const body = await request.json();

    // Route to appropriate handler
    if (path === '/api/analyze-image') {
      return await handleAnalyzeImage(body, apiKeys, corsHeaders);
    } else if (path === '/api/modify-image') {
      return await handleModifyImage(body, apiKeys, corsHeaders);
    } else if (path === '/api/translate-image-text') {
      return await handleTranslateText(body, apiKeys, corsHeaders);
    } else if (path === '/api/detect-text-translate') {
      return await handleDetectText(body, apiKeys, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '处理失败' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleAnalyzeImage(body, apiKeys, corsHeaders) {
  const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = body;

  if (!originalBase64 || !elaBase64) {
    return new Response(
      JSON.stringify({ error: '缺少必要的图片数据' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use Google Gemini API
  if (apiKeys.google) {
    try {
      const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
        { inlineData: { mimeType: 'image/png', data: elaBase64 } }
      ];
      if (mfrBase64) {
        parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
      }

      const langMap = {
        en: 'English',
        zh: 'Simplified Chinese (zh-CN)',
        es: 'Spanish',
        ja: 'Japanese',
        fr: 'French',
        de: 'German',
        pt: 'Portuguese'
      };
      const targetLang = langMap[lang] || 'English';

      parts.push({ text: `You are a Lead Digital Forensic Analyst. Analyze these images and return ONLY a valid JSON object with keys: description, tags, objects, sentiment, colors, and integrity. The integrity object must contain: is_suspected_fake, confidence_score, reasoning, methods_analyzed, ai_generated_probability, and ai_analysis. Output in ${targetLang}.` });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKeys.google
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from model');
      }

      // Clean JSON
      text = text.trim();
      if (text.startsWith('```json')) text = text.substring(7);
      if (text.endsWith('```')) text = text.substring(0, text.length - 3);
      text = text.trim();

      const jsonData = JSON.parse(text);
      return new Response(
        JSON.stringify(jsonData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: '图片分析失败: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: '没有可用的API服务' }),
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleModifyImage(body, apiKeys, corsHeaders) {
  const { base64, prompt } = body;

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: '缺少提示词' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (apiKeys.google) {
    try {
      const parts = [];
      if (base64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
      }
      parts.push({ text: prompt });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKeys.google}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const imageData = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (!imageData) {
        throw new Error('No image generated');
      }

      return new Response(
        JSON.stringify({ imageData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: '图片编辑失败: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: '没有可用的API服务' }),
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTranslateText(body, apiKeys, corsHeaders) {
  return new Response(
    JSON.stringify({ error: '功能暂未实现' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDetectText(body, apiKeys, corsHeaders) {
  return new Response(
    JSON.stringify({ error: '功能暂未实现' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

