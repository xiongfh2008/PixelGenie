// HuggingFace API Configuration for PixelGenie
// Free tier models for various image processing tasks

const HUGGINGFACE_MODELS = {
  // 智能鉴伪/AI生成检测
  aiDetection: {
    model: 'microsoft/resnet-50',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/resnet-50',
    description: '图像分类模型，可用于检测AI生成图像特征'
  },
  
  // AI编辑室功能
  imageEditing: {
    model: 'runwayml/stable-diffusion-v1-5',
    endpoint: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    description: '图像生成和编辑模型'
  },
  
  // 智能去水印
  watermarkRemoval: {
    model: 'microsoft/BiomedCLIP-PubMedBERT_256-v2',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/BiomedCLIP-PubMedBERT_256-v2',
    description: '图像处理模型，可用于水印检测和去除'
  },
  
  // 视觉翻译
  visualTranslation: {
    model: 'microsoft/trocr-base-printed',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
    description: 'OCR模型，可用于图像文字识别和翻译'
  },
  
  // LOGO创意
  logoGeneration: {
    model: 'black-forest-labs/FLUX.1-schnell',
    endpoint: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
    description: '创意图像生成模型，适合LOGO设计'
  },
  
  // 智能压缩
  imageCompression: {
    model: 'microsoft/resnet-18',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/resnet-18',
    description: '轻量级图像处理模型，可用于图像压缩分析'
  }
};

// HuggingFace API调用函数
const callHuggingFaceAPI = async (modelKey, inputs, apiKey) => {
  const modelConfig = HUGGINGFACE_MODELS[modelKey];
  if (!modelConfig) {
    throw new Error(`HuggingFace model not found: ${modelKey}`);
  }

  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(inputs)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HuggingFace API error: ${errorData.error || response.statusText}`);
  }

  return await response.json();
};

// 智能鉴伪API
const detectAIGenerated = async (imageBase64, apiKey) => {
  const inputs = {
    inputs: {
      image: `data:image/jpeg;base64,${imageBase64}`
    }
  };
  
  return await callHuggingFaceAPI('aiDetection', inputs, apiKey);
};

// 图像编辑API
const editImage = async (imageBase64, prompt, apiKey) => {
  const inputs = {
    inputs: {
      image: `data:image/jpeg;base64,${imageBase64}`,
      prompt: prompt
    }
  };
  
  return await callHuggingFaceAPI('imageEditing', inputs, apiKey);
};

// 去水印API
const removeWatermark = async (imageBase64, apiKey) => {
  const inputs = {
    inputs: {
      image: `data:image/jpeg;base64,${imageBase64}`
    }
  };
  
  return await callHuggingFaceAPI('watermarkRemoval', inputs, apiKey);
};

// 视觉翻译API
const translateImageText = async (imageBase64, targetLang, apiKey) => {
  const inputs = {
    inputs: {
      image: `data:image/jpeg;base64,${imageBase64}`,
      question: `Extract text from this image and translate to ${targetLang}`
    }
  };
  
  return await callHuggingFaceAPI('visualTranslation', inputs, apiKey);
};

// LOGO生成API
const generateLogo = async (prompt, apiKey) => {
  const inputs = {
    inputs: prompt
  };
  
  return await callHuggingFaceAPI('logoGeneration', inputs, apiKey);
};

// 图像压缩分析API
const analyzeCompression = async (imageBase64, apiKey) => {
  const inputs = {
    inputs: {
      image: `data:image/jpeg;base64,${imageBase64}`
    }
  };
  
  return await callHuggingFaceAPI('imageCompression', inputs, apiKey);
};

export {
  HUGGINGFACE_MODELS,
  callHuggingFaceAPI,
  detectAIGenerated,
  editImage,
  removeWatermark,
  translateImageText,
  generateLogo,
  analyzeCompression
};