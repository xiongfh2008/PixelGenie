# Cloudflare Llama Vision 模型协议说明

## ⚠️ 重要提示

Cloudflare Workers AI 的 Llama 3.2 Vision 模型需要您先同意使用协议才能使用。

## 📝 协议内容

使用 `@cf/meta/llama-3.2-11b-vision-instruct` 模型前，您需要同意：

1. **Llama 3.2 Community License**
   - 链接：https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE

2. **Acceptable Use Policy**
   - 链接：https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md

3. **地区限制声明**
   - 您声明您不是居住在欧盟的个人，也不是主要营业地在欧盟的公司

## 🔧 如何同意协议

### 方法 1：通过 Cloudflare Dashboard（推荐）

1. 访问 https://dash.cloudflare.com/
2. 登录您的账户
3. 进入 **Workers & Pages** → **AI**
4. 找到 `llama-3.2-11b-vision-instruct` 模型
5. 点击模型并同意使用协议

### 方法 2：通过 API 调用

运行以下命令同意协议：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/fdc7b1797b3da896c482a4350af943bc/ai/run/@cf/meta/llama-3.2-11b-vision-instruct" \
  -H "Authorization: Bearer KWNH-tUIp7wv6ez2LTQr5wcoupKfoX9X0LfRcGaB" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":[{"type":"text","text":"agree"}]}]}'
```

**注意**：您需要先阅读并理解协议内容，确认同意后再执行此命令。

## 🔄 备用方案

在同意协议之前，系统会自动使用其他可用的 API 提供商：

1. Google Gemini（主用）
2. 讯飞星火（主用）
3. HuggingFace（备用）
4. DeepSeek（备用）

同意协议后，Cloudflare Workers AI 将作为高优先级的备用 API。

## ✅ 验证协议已同意

同意协议后，运行测试脚本验证：

```bash
npm run test:cloudflare
```

如果看到 "✅ 图像分析测试成功"，说明协议已成功同意。

## 📚 相关资源

- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Llama 3.2 模型信息](https://ai.meta.com/llama/)
- [Meta AI 使用政策](https://www.facebook.com/policies/other-policies/meta-ai-terms/)

