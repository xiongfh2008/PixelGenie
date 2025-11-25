# 免费 API 备用方案

## 📋 推荐的免费 API 服务

根据联网搜索结果，以下是可作为 PixelGenie 备用的免费 API 服务：

---

## 🎯 优先推荐（已验证可用）

### 1. **HuggingFace Inference API** ⭐⭐⭐⭐⭐
- **状态**: 已集成 ✅
- **免费额度**: 每月 30,000 次请求
- **功能**: 图像分析、AI 检测、图像编辑
- **模型**: 
  - `Umm-maybe/AI-image-detector` (AI 检测)
  - `timbrooks/instruct-pix2pix` (图像编辑)
- **优点**: 
  - 完全免费
  - 无需信用卡
  - 支持多种模型
  - API 简单易用
- **限制**: 请求速率限制
- **官网**: https://huggingface.co/inference-api

### 2. **Google Gemini API** ⭐⭐⭐⭐⭐
- **状态**: 已集成 ✅
- **免费额度**: 
  - Gemini 2.0 Flash: 每分钟 15 次请求
  - 每天 1,500 次请求
- **功能**: 多模态分析（图像+文本）
- **优点**:
  - 强大的视觉理解能力
  - 支持中文
  - 响应速度快
- **限制**: 需要 Google 账号
- **官网**: https://ai.google.dev/

---

## 🆓 其他免费选项

### 3. **阿里云视觉智能 - 换脸鉴别 API** ⭐⭐⭐⭐
- **状态**: 未集成
- **免费额度**: 公测期免费
- **功能**: Deepfake 检测、换脸识别
- **支持格式**: JPG, PNG, BMP (最大 10MB)
- **优点**:
  - 专门针对 Deepfake 检测
  - 国内访问速度快
  - 中文文档完善
- **限制**: 
  - 需要阿里云账号
  - 可能需要实名认证
- **API 文档**: https://help.aliyun.com/zh/viapi/developer-reference/api-deepfakeface
- **接入难度**: 中等

**示例代码**:
```javascript
// 阿里云 API 调用示例
const alibabaDetectDeepfake = async (imageBase64) => {
  const response = await fetch('https://viapi.cn-shanghai.aliyuncs.com/api/v1/deepfakeface', {
    method: 'POST',
    headers: {
      'Authorization': `APPCODE ${process.env.ALIBABA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: imageBase64
    })
  });
  return await response.json();
};
```

### 4. **百度智能云 - 图像识别 API** ⭐⭐⭐⭐
- **状态**: 未集成
- **免费额度**: 每日 500 次调用
- **功能**: 
  - 通用物体识别
  - 图像分类
  - 文字识别 (OCR)
- **优点**:
  - 稳定可靠
  - 国内访问快
  - 支持多种识别场景
- **限制**: 
  - 需要百度账号
  - 每日调用限制
- **API 文档**: https://cloud.baidu.com/doc/IMAGERECOGNITION/index.html
- **接入难度**: 简单

**示例代码**:
```javascript
// 百度 API 调用示例
const baiduImageRecognition = async (imageBase64, accessToken) => {
  const response = await fetch(`https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `image=${encodeURIComponent(imageBase64)}`
  });
  return await response.json();
};
```

### 5. **Microsoft Azure Computer Vision** ⭐⭐⭐
- **状态**: 未集成
- **免费额度**: 每月 5,000 次交易
- **功能**:
  - 图像分析
  - 物体检测
  - OCR
  - 人脸识别
- **优点**:
  - 功能全面
  - 企业级稳定性
- **限制**: 
  - 需要 Azure 账号
  - 可能需要信用卡（不扣费）
- **API 文档**: https://learn.microsoft.com/azure/ai-services/computer-vision/
- **接入难度**: 中等

### 6. **Cloudflare Workers AI** ⭐⭐⭐⭐
- **状态**: 未集成
- **免费额度**: 每天 10,000 次请求
- **功能**: 
  - 图像分类
  - 物体检测
  - 文本生成
- **模型**: `@cf/microsoft/resnet-50`
- **优点**:
  - 完全免费
  - 全球 CDN 加速
  - 低延迟
- **限制**: 需要 Cloudflare 账号
- **API 文档**: https://developers.cloudflare.com/workers-ai/
- **接入难度**: 简单

**示例代码**:
```javascript
// Cloudflare Workers AI 示例
const cloudflareAI = async (imageBase64) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/microsoft/resnet-50`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: [Array.from(imageBase64)] })
    }
  );
  return await response.json();
};
```

---

## 🔄 集成优先级建议

### 第一优先级（立即可用）
1. ✅ **HuggingFace** - 已集成，完全免费
2. ✅ **Google Gemini** - 已集成，强大且免费

### 第二优先级（推荐添加）
3. 🔲 **Cloudflare Workers AI** - 简单易用，全球加速
4. 🔲 **阿里云视觉智能** - 专业 Deepfake 检测

### 第三优先级（可选）
5. 🔲 **百度智能云** - 国内稳定
6. 🔲 **Microsoft Azure** - 企业级方案

---

## 📊 功能对比表

| API 服务 | 免费额度 | 图像分析 | AI 检测 | 图像编辑 | 响应速度 | 接入难度 |
|---------|---------|---------|---------|---------|---------|---------|
| HuggingFace | 30K/月 | ✅ | ✅ | ✅ | 中 | 简单 |
| Google Gemini | 1.5K/天 | ✅ | ✅ | ❌ | 快 | 简单 |
| 阿里云视觉 | 公测免费 | ✅ | ✅ | ❌ | 快 | 中等 |
| 百度智能云 | 500/天 | ✅ | ❌ | ❌ | 快 | 简单 |
| Azure CV | 5K/月 | ✅ | ❌ | ❌ | 中 | 中等 |
| Cloudflare AI | 10K/天 | ✅ | ❌ | ❌ | 快 | 简单 |

---

## 🛠️ 快速集成指南

### 添加 Cloudflare Workers AI

1. **获取 API Token**:
   - 访问 https://dash.cloudflare.com/
   - 创建 API Token
   - 复制 Account ID 和 Token

2. **添加到 .env**:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

3. **更新 server/index.js**:
```javascript
// 在 getApiKeys() 中添加
cloudflare: process.env.CLOUDFLARE_API_TOKEN

// 在 selectApiProvider() 中添加到 backupProviders
const backupProviders = ['huggingface', 'deepseek', 'cloudflare'];
```

### 添加阿里云视觉智能

1. **获取 API Key**:
   - 访问 https://www.aliyun.com/product/viapi
   - 开通服务并获取 AppCode

2. **添加到 .env**:
```env
ALIBABA_VIAPI_KEY=your_appcode
```

3. **实现 API 调用**:
```javascript
case 'alibaba':
  url = 'https://viapi.cn-shanghai.aliyuncs.com/api/v1/deepfakeface';
  requestBody = { image: originalBase64 };
  headers['Authorization'] = `APPCODE ${apiKeys.alibaba}`;
  break;
```

---

## ⚠️ 注意事项

### 免费额度管理
- 监控每日/每月调用次数
- 实现调用计数器
- 接近限额时自动切换

### 数据安全
- 所有 API 调用使用 HTTPS
- 不在日志中记录完整图像数据
- 定期轮换 API Key

### 性能优化
- 实现请求缓存
- 使用 CDN 加速
- 批量处理请求

---

## 📝 实施计划

### 阶段 1: 立即可用（已完成）
- ✅ HuggingFace API
- ✅ Google Gemini API
- ✅ 主/备自动切换

### 阶段 2: 短期增强（建议 1 周内）
- 🔲 添加 Cloudflare Workers AI
- 🔲 实现调用计数和限额监控
- 🔲 添加性能监控面板

### 阶段 3: 长期优化（建议 1 个月内）
- 🔲 添加阿里云视觉智能 API
- 🔲 添加百度智能云 API
- 🔲 实现智能负载均衡
- 🔲 添加成本分析功能

---

## 🎯 总结

**当前状态**: 已有 2 个免费 API 提供商（HuggingFace + Google Gemini）

**推荐行动**:
1. 保持当前配置（已足够稳定）
2. 可选添加 Cloudflare Workers AI 作为第三备份
3. 监控 API 使用情况，按需扩展

**成本**: 完全免费（在免费额度内）

**可用性**: 高（多重备份保障）

---

生成时间: 2025-11-26
文档版本: v1.0

