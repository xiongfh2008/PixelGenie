import express from 'express';
import cors from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ API Key loaded: ${process.env.API_KEY ? process.env.API_KEY.substring(0, 6) + '...' : 'Not found'}`);
});

export default app;