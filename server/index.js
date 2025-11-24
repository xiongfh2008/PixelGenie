import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from server/.env
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

<<<<<<< Updated upstream
// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Modify image endpoint
app.post('/api/modify-image', async (req, res) => {
  try {
    const { imageData, prompt } = req.body;
    
    if (!imageData || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required parameters: imageData and prompt' 
      });
    }

    // Convert base64 image data to file
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/png'
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    res.json({ result: text });
  } catch (error) {
    console.error('Image Modification Failed:', error);
    
    // Special handling for quota exceeded errors
    if (error.message && (error.message.includes('Quota exceeded') || 
                          error.message.includes('quota') ||
                          error.message.includes('Limit'))) {
      console.error('Quota exceeded error:', error.message);
      return res.status(429).json({ 
        error: 'You exceeded your current quota, please check your plan and billing details.',
        details: 'Visit https://ai.google.dev/gemini-api/docs/rate-limits to learn more about rate limits. Retry after some time or consider upgrading your plan.',
        quotaExceeded: true,
        quotaInfo: {
          metrics: error.message || 'Rate limit exceeded',
          retryAfter: '3.5 seconds or more'
        },
        response: { error: { message: error.message } }
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to modify image',
      details: error.message
=======
// Get API Key
const getApiKey = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('❌ API_KEY is not set in server environment variables');
    console.error('📁 Expected location: server/.env');
    console.error('💡 Please create server/.env file with: API_KEY=your_api_key_here');
    throw new Error('API_KEY is not set in server environment variables. Please check server/.env file.');
  }
  return apiKey;
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PixelGenie AI Server is running',
    endpoints: {
      health: '/api/health',
      analyzeImage: '/api/analyze-image',
      modifyImage: '/api/modify-image',
      translateImageText: '/api/translate-image-text',
      detectTextTranslate: '/api/detect-text-translate'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Analyze Image endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

    // Enhanced validation with specific error messages
    if (!originalBase64) {
      return res.status(400).json({ error: 'Missing original image data (originalBase64)' });
    }
    
    if (!elaBase64) {
      return res.status(400).json({ error: 'Missing ELA image data (elaBase64)' });
    }
    
    // Validate that the data is actually base64 encoded
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(originalBase64)) {
      return res.status(400).json({ error: 'Invalid original image data format - must be base64 encoded' });
    }
    
    if (!base64Regex.test(elaBase64)) {
      return res.status(400).json({ error: 'Invalid ELA image data format - must be base64 encoded' });
    }
    
    // Validate MFR if provided
    if (mfrBase64 && !base64Regex.test(mfrBase64)) {
      return res.status(400).json({ error: 'Invalid MFR image data format - must be base64 encoded' });
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
    const langInstruction = `The final JSON output values MUST be in ${targetLang}.`;

    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }

    parts.push({ text: `You are a Lead Digital Forensic Analyst specializing in detecting AI-generated media (Flux, Midjourney v6, Sora) and advanced Photoshop manipulation.
      
      **INPUTS**:
      1. **Original Image**
      2. **ELA Map** (Rainbow): Error Level Analysis. Shows compression discrepancies.
      3. **MFR Map** (Grayscale): Noise Analysis. Authentic photos have uniform noise. AI often has 'black voids' (no noise).

      **EXECUTION PROTOCOL**:
      
      **PHASE 1: SEMANTIC & PHYSICS CHECK (Primary Detection Method)**
      *Scan the Original Image closely.*
      - **AI Artifacts**: Look for glossy/waxy skin texture, perfect symmetry, melded fingers, nonsensical background text, floating objects, or impossible lighting.
      - **Logic**: Do shadows match the light source? Are reflections correct?
      - **Verdict Hint**: If it looks "too perfect" or has "dream-like" physics -> Likely AI.

      **PHASE 2: FORENSIC MAP CONFIRMATION**
      - **ELA (Rainbow)**:
        - **IGNORE** white/rainbow edges on high-contrast lines (text, sharp borders). This is normal JPEG behavior.
        - **FLAG** if a specific object (e.g., a face) is purple while the body is blue. This indicates SPLICING.
      - **MFR (Grayscale)**:
        - **Authentic**: Uniform grain/static across the whole image.
        - **AI Generated**: Often shows smooth black areas (voids) where texture should be, lacking camera sensor noise.

      ${langInstruction}

      **DECISION RULES**:
      1. **AI Generated**: Visually flawless but "plastic" look OR MFR shows lack of noise (black voids) + ELA is uniform.
      2. **Tampered/Spliced**: ELA shows distinct colored block on an object.
      3. **Authentic**: Natural imperfections, consistent noise, consistent ELA (except edges).

      IMPORTANT: Return ONLY a valid JSON object with these exact keys: description, tags, objects, sentiment, colors, and integrity. The integrity object must contain: is_suspected_fake, confidence_score, reasoning, methods_analyzed, ai_generated_probability, and ai_analysis. Do NOT include any text before or after the JSON.` });
  
      // Use REST API with v1 endpoint and gemini-flash-latest model
      const apiKey = getApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const requestBody = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      console.error('Request URL:', url);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(500).json({ error: 'No response from model' });
    }

    // Extract JSON from potential markdown code block
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    try {
      const jsonData = JSON.parse(jsonString);
      res.json(jsonData);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response text:', text);
      res.status(500).json({ 
        error: 'Invalid JSON response from model',
        rawText: text 
      });
    }
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Modify Image endpoint
app.post('/api/modify-image', async (req, res) => {
  try {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const parts = [];
    if (base64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64
        }
      });
    }
    parts.push({ text: prompt });

    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Special handling for quota exceeded errors
       if (response.status === 429 || 
           (errorData.error && errorData.error.message && 
            (errorData.error.message.includes('Quota exceeded') || 
             errorData.error.message.includes('quota') ||
             errorData.error.message.includes('Limit')))) {
         console.error('Quota exceeded error:', JSON.stringify(errorData, null, 2));
         return res.status(429).json({ 
           error: 'You exceeded your current quota, please check your plan and billing details.',
           details: 'Visit https://ai.google.dev/gemini-api/docs/rate-limits to learn more about rate limits. Retry after some time or consider upgrading your plan.',
           quotaExceeded: true,
           quotaInfo: {
             metrics: errorData.error?.message || 'Rate limit exceeded',
             retryAfter: '3.5 seconds or more'
           },
           response: errorData
         });
       }
      
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Enhanced validation for response structure with more detailed checks
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const firstCandidate = data.candidates[0];
      
      // Check if candidate was blocked or had safety issues
      if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
        console.error('Candidate finish reason:', firstCandidate.finishReason);
        console.error('Full response data:', JSON.stringify(data, null, 2));
        return res.status(500).json({ 
          error: `Generation stopped with reason: ${firstCandidate.finishReason}`,
          details: 'The AI model stopped generation due to content policies or other reasons.',
          response: data
        });
      }
      
      if (firstCandidate.content && firstCandidate.content.parts && Array.isArray(firstCandidate.content.parts)) {
        const responseParts = firstCandidate.content.parts;
        
        // Iterate through parts to find image data
        for (const part of responseParts) {
          if (part.inlineData && part.inlineData.data) {
            return res.json({ imageData: part.inlineData.data });
          }
        }
      }
    }

    // Log detailed error information for debugging
    console.error('No image data in response:', JSON.stringify(data, null, 2));
    res.status(500).json({ 
      error: 'No image generated in response',
      details: 'The AI model did not return any image data. This could be due to the prompt, image, or model limitations.',
      response: data
    });
  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to modify image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Translate Image Text endpoint
app.post('/api/translate-image-text', async (req, res) => {
  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Perform High-Precision OCR. Transcribe and translate to ${targetLang}. IMPORTANT: Return ONLY a valid JSON object with these exact keys: detected_language, original_text, translated_text. Do NOT include any text before or after the JSON.` }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(500).json({ error: 'No response from model' });
    }

    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Translate image text error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to translate image text',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Detect Text and Translate endpoint
app.post('/api/detect-text-translate', async (req, res) => {
  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Detect all visible text in this image. Translate each text block to ${targetLang}.
       Return the original text, translated text, and the 2D bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) for each block.
       IMPORTANT: Return ONLY a valid JSON object with these exact keys: detected_language, original_text, translated_text, and blocks. The blocks array should contain objects with original, translated, and box_2d properties. Do NOT include any text before or after the JSON.` }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(500).json({ error: 'No response from translation service' });
    }

    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Detect text translate error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to detect and translate text',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
>>>>>>> Stashed changes
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ API Key loaded: ${process.env.API_KEY ? process.env.API_KEY.substring(0, 6) + '...' : 'Not found'}`);
});

export default app;