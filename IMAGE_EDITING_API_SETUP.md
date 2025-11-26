# 图像编辑 API 集成指南

## 概述

PixelGenie 现在支持多个专业的图像编辑 API，用于实现**智能去水印**功能。这些 API 都提供免费额度或试用期。

## 支持的 API 提供商

### 1. **ClipDrop API** ⭐ 推荐
- **功能**：专业的对象移除、去水印、背景移除
- **免费额度**：每月 100 次请求
- **注册地址**：https://clipdrop.co/apis
- **优点**：
  - 专门针对对象移除优化
  - API 简单易用
  - 效果出色
  - 响应速度快

**获取 API Key：**
1. 访问 https://clipdrop.co/apis
2. 注册账号（可使用 Google 账号）
3. 进入 Dashboard
4. 复制 API Key

**环境变量：**
```env
CLIPDROP_API_KEY=your_clipdrop_api_key_here
```

---

### 2. **Remove.bg API** ⭐ 推荐
- **功能**：专业的背景移除和对象移除
- **免费额度**：每月 50 次请求
- **注册地址**：https://www.remove.bg/api
- **优点**：
  - 业界领先的背景移除技术
  - 可用于去水印
  - API 稳定可靠

**获取 API Key：**
1. 访问 https://www.remove.bg/users/sign_up
2. 注册账号
3. 进入 API Dashboard
4. 复制 API Key

**环境变量：**
```env
REMOVEBG_API_KEY=your_removebg_api_key_here
```

---

### 3. **Replicate API**
- **功能**：支持多种 AI 模型（LaMa、Stable Diffusion Inpainting）
- **免费额度**：每月 $5 免费额度
- **注册地址**：https://replicate.com
- **优点**：
  - 支持多种模型
  - 灵活性高
  - 社区活跃

**获取 API Key：**
1. 访问 https://replicate.com/signin
2. 注册账号（可使用 GitHub 账号）
3. 进入 Account Settings
4. 复制 API Token

**环境变量：**
```env
REPLICATE_API_KEY=your_replicate_api_key_here
```

---

### 4. **Stability AI**
- **功能**：Stable Diffusion Inpainting（图像修复）
- **免费试用**：25 积分
- **注册地址**：https://platform.stability.ai
- **优点**：
  - 高质量的图像生成
  - 支持精确的 mask 控制

**获取 API Key：**
1. 访问 https://platform.stability.ai/account/keys
2. 注册账号
3. 创建 API Key
4. 复制 API Key

**环境变量：**
```env
STABILITY_API_KEY=your_stability_api_key_here
```

---

### 5. **HuggingFace Inference API**
- **功能**：Stable Diffusion Inpainting 模型
- **免费额度**：有限制但可用
- **注册地址**：https://huggingface.co
- **优点**：
  - 完全免费（有速率限制）
  - 支持多种开源模型

**获取 API Key：**
1. 访问 https://huggingface.co/settings/tokens
2. 注册账号
3. 创建 Access Token
4. 复制 Token

**环境变量：**
```env
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

---

## 快速配置

### 步骤 1：选择至少一个 API 提供商

**推荐配置（按优先级）：**
1. **ClipDrop**（最佳效果，专门针对对象移除）
2. **Remove.bg**（背景移除专家，也可用于去水印）
3. **Replicate**（灵活性高，支持多种模型）

### 步骤 2：更新 `.env` 文件

编辑 `server/.env` 文件，添加您获取的 API Key：

```env
# 图像编辑 API（至少配置一个）
CLIPDROP_API_KEY=your_clipdrop_api_key_here
REMOVEBG_API_KEY=your_removebg_api_key_here
REPLICATE_API_KEY=your_replicate_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

### 步骤 3：重启服务器

```bash
cd server
npm run dev
```

---

## API 选择策略

系统会自动按以下优先级选择可用的 API：

1. **ClipDrop** - 最佳对象移除效果
2. **Remove.bg** - 专业背景移除
3. **Replicate** - 灵活的 AI 模型
4. **Stability AI** - 高质量图像生成
5. **HuggingFace** - 免费开源模型

如果首选 API 失败，系统会自动切换到下一个可用的 API。

---

## 测试 API 集成

创建测试脚本 `server/test-image-editing.js`：

```javascript
import { editImageWithBestApi } from './image-editing-apis.js';
import fs from 'fs';

const testImageEditing = async () => {
  // 读取测试图像
  const imageBuffer = fs.readFileSync('test-image.jpg');
  const imageBase64 = imageBuffer.toString('base64');

  const apiKeys = {
    clipdrop: process.env.CLIPDROP_API_KEY,
    removebg: process.env.REMOVEBG_API_KEY,
    replicate: process.env.REPLICATE_API_KEY,
    stability: process.env.STABILITY_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY
  };

  try {
    const result = await editImageWithBestApi(
      imageBase64,
      'Remove watermark from this image',
      apiKeys
    );

    console.log('✅ Image editing successful!');
    console.log('Provider:', result.provider);
    
    // 保存结果
    if (result.imageData) {
      fs.writeFileSync('result.jpg', Buffer.from(result.imageData, 'base64'));
      console.log('✅ Result saved to result.jpg');
    }
  } catch (error) {
    console.error('❌ Image editing failed:', error.message);
  }
};

testImageEditing();
```

运行测试：
```bash
node server/test-image-editing.js
```

---

## 成本估算

### 免费额度对比

| API 提供商 | 免费额度 | 适用场景 |
|-----------|---------|---------|
| ClipDrop | 100 次/月 | 日常使用 |
| Remove.bg | 50 次/月 | 日常使用 |
| Replicate | $5/月 | 中等使用 |
| Stability AI | 25 积分 | 测试使用 |
| HuggingFace | 无限制（有速率限制） | 开发测试 |

### 推荐配置

**个人开发者：**
- ClipDrop + HuggingFace
- 每月约 100+ 次免费请求

**小型项目：**
- ClipDrop + Remove.bg + Replicate
- 每月约 150+ 次免费请求

**生产环境：**
- 所有 API 都配置（自动故障转移）
- 根据实际使用量付费

---

## 常见问题

### Q1: 哪个 API 效果最好？
**A:** ClipDrop 和 Remove.bg 的效果最好，专门针对对象移除和背景移除优化。

### Q2: 如果所有 API 都失败怎么办？
**A:** 系统会返回详细的错误信息。建议至少配置 2-3 个 API 作为备份。

### Q3: 可以只配置一个 API 吗？
**A:** 可以，但建议配置至少 2 个 API 以提高可用性。

### Q4: API Key 泄露了怎么办？
**A:** 立即在对应平台撤销旧的 API Key，生成新的 API Key，并更新 `.env` 文件。

### Q5: 免费额度用完了怎么办？
**A:** 
1. 系统会自动切换到其他可用的 API
2. 可以升级到付费计划
3. 等待下个月免费额度重置

---

## 下一步

1. ✅ 选择并注册至少一个 API 提供商
2. ✅ 获取 API Key
3. ✅ 更新 `server/.env` 文件
4. ✅ 重启服务器
5. ✅ 测试去水印功能

---

## 技术支持

如有问题，请参考：
- ClipDrop 文档：https://clipdrop.co/apis/docs
- Remove.bg 文档：https://www.remove.bg/api
- Replicate 文档：https://replicate.com/docs
- Stability AI 文档：https://platform.stability.ai/docs
- HuggingFace 文档：https://huggingface.co/docs/api-inference

---

**更新日期：** 2025-11-26
**版本：** 1.0.0

