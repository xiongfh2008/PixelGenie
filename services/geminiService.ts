
import { AnalysisData, Language, TranslationData, TextBlock } from "../types";

// Backend API base URL
// Use relative path for production (Vercel), localhost for development
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  // Production: use relative path
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Server status check
let serverOnline: boolean | null = null;
let lastCheckTime = 0;

const checkServerStatus = async (): Promise<boolean> => {
  // Cache for 5 seconds
  if (serverOnline !== null && Date.now() - lastCheckTime < 5000) {
    return serverOnline;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    serverOnline = response.ok;
    lastCheckTime = Date.now();
    return serverOnline;
  } catch {
    serverOnline = false;
    lastCheckTime = Date.now();
    return false;
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
      // Check if server is actually offline
      const isOnline = await checkServerStatus();
      if (!isOnline) {
        throw new Error('服务暂时不可用，请稍后重试');
      }
    }
    // Log detailed error for debugging
    console.error('API Request Error Details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Simplify error messages for production
    const errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes('HTTP 401') || errorMessage.includes('authentication')) {
      throw new Error('API密钥未配置或无效，请在Vercel环境变量中配置GOOGLE_API_KEY');
    } else if (errorMessage.includes('HTTP 400') || errorMessage.includes('Invalid')) {
      throw new Error('图片格式不正确，请上传有效的图片文件');
    } else if (errorMessage.includes('HTTP 429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
      throw new Error('服务繁忙，请稍后重试');
    } else if (errorMessage.includes('HTTP 500') || errorMessage.includes('Internal')) {
      throw new Error('服务器处理出错，请稍后重试');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      throw new Error('处理超时，请重试或上传更小的图片');
    }
    // Return original error message for debugging
    throw new Error(errorMessage);
  }
};

/**
 * Helper to convert File to Base64 string (without data URI prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:image/xyz;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper to fetch an image from a URL and convert it to a File object
 */
export const fetchImageFromUrl = async (url: string): Promise<File> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Extract filename from URL or default
    let filename = "image_from_url.jpg";
    try {
      const urlPath = new URL(url).pathname;
      const name = urlPath.substring(urlPath.lastIndexOf('/') + 1);
      if (name) filename = name;
    } catch (e) {}

    return new File([blob], filename, { type: contentType });
  } catch (error: any) {
    // Common CORS error handling
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error("CORS Error: Unable to load image directly due to browser security. Please download the image and upload it manually.");
    }
    throw error;
  }
};

/**
 * Helper: Resize image to ensure it fits within Gemini's processing limits and optimizes speed.
 * Downscales to max 800px (was 1024px) and uses aggressive JPEG compression.
 */
const optimizeImageForApi = (base64: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64}`;
    
    img.onload = () => {
      const MAX_SIZE = 800; // Reduced from 1024 for faster upload/tokenization
      let width = img.width;
      let height = img.height;

      // If image is small enough, return original
      if (width <= MAX_SIZE && height <= MAX_SIZE) {
        resolve(base64);
        return;
      }

      // Calculate new dimensions
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round(height * (MAX_SIZE / width));
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round(width * (MAX_SIZE / height));
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
         reject(new Error("Canvas context unavailable"));
         return;
      }
      
      try {
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use JPEG 0.70 for speed. Visual artifacts from compression are acceptable 
        // as the model looks at semantic consistency mainly.
        const newDataUrl = canvas.toDataURL('image/jpeg', 0.70);
        resolve(newDataUrl.split(',')[1]);
      } catch (e) {
        reject(new Error("Failed to process image canvas"));
      }
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Local Self-Implemented AI Metadata Scanner
 * Scans the raw file header for common AI generator signatures.
 */
export const scanForAIMetadata = async (file: File): Promise<{ detected: boolean, tool?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
         // Common signatures in Exif/XMP/Text chunks
         if (result.includes("Stable Diffusion") || result.includes("sd-webui")) resolve({ detected: true, tool: "Stable Diffusion" });
         else if (result.includes("Midjourney")) resolve({ detected: true, tool: "Midjourney" });
         else if (result.includes("ComfyUI")) resolve({ detected: true, tool: "ComfyUI" });
         else if (result.includes("DALL-E")) resolve({ detected: true, tool: "DALL-E" });
         else if (result.includes("Adobe Firefly")) resolve({ detected: true, tool: "Adobe Firefly" });
         else if (result.includes("Generated by AI")) resolve({ detected: true, tool: "Generic AI" });
         else resolve({ detected: false });
      } else {
          resolve({ detected: false });
      }
    };
    // Read first 50KB. Most metadata headers are at the start.
    // Using ISO-8859-1 preserves bytes 1:1 in the string for searching.
    const blob = file.slice(0, 50 * 1024); 
    reader.readAsText(blob, 'ISO-8859-1'); 
  });
};

/**
 * Detects text blocks and translates them, returning bounding box coordinates.
 */
export const detectTextAndTranslate = async (
  base64: string,
  mimeType: string,
  targetLang: string
): Promise<TranslationData> => {
  try {
    const result = await apiRequest('/api/detect-text-translate', {
      base64,
      mimeType,
      targetLang
    });

    return result as TranslationData;
  } catch (error: any) {
    console.error("Translation service error:", error);
    throw error;
  }
};

/**
 * Analyze an image using Gemini 2.5 Flash.
 * OPTIMIZED FOR SPEED & ACCURACY.
 */
export const analyzeImage = async (
  originalBase64: string, 
  elaBase64: string,
  mfrBase64: string | null, 
  mimeType: string, 
  lang: Language
): Promise<AnalysisData> => {
  try {
    // Optimize the original image for payload size before sending to LLM
    const fastBase64 = await optimizeImageForApi(originalBase64, mimeType);

    const result = await apiRequest('/api/analyze-image', {
      originalBase64: fastBase64,
      elaBase64,
      mfrBase64,
      mimeType,
      lang
    });

    return result as AnalysisData;
  } catch (error: any) {
    console.error("Image Analysis Failed:", error);
    throw error;
  }
};

/**
 * Edit/Modify an image using Gemini 2.5 Flash Image Model
 */
export const modifyImage = async (
  base64: string | null, 
  mimeType: string | null, 
  prompt: string
): Promise<string> => {
  try {
    let optimizedBase64 = base64;
    if (base64 && mimeType) {
      optimizedBase64 = await optimizeImageForApi(base64, mimeType);
    }

    const result = await apiRequest('/api/modify-image', {
      base64: optimizedBase64,
      mimeType,
      prompt
    });

    return result.imageData;
  } catch (error: any) {
    console.error("Image Modification Failed:", error);
    throw error;
  }
};

/**
 * OCR - Extract Text from Image
 */
export const translateImageText = async (base64: string, mimeType: string, targetLang: string): Promise<TranslationData> => {
  try {
    const result = await apiRequest('/api/translate-image-text', {
      base64,
      mimeType,
      targetLang
    });

    return result as TranslationData;
  } catch (error: any) {
    console.error("Translation Failed:", error);
    throw error;
  }
};
