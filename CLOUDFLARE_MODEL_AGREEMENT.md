# Cloudflare Llama 3.2 Vision 模型协议同意指南

## ⚠️ 重要提示

在使用 Cloudflare 的 Llama 3.2 Vision 模型之前，您需要先同意模型的使用协议。

## 📋 需要同意的协议

1. **Llama 3.2 Community License**
   - https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE

2. **Acceptable Use Policy**
   - https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md

3. **地区限制声明**
   - 您声明您不是居住在欧盟的个人
   - 您不是主要营业地在欧盟的公司

---

## 🚀 如何同意协议

### 方法 1: 通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com/
   - 使用您的账户登录

2. **进入 Workers AI 页面**
   - 在左侧菜单中找到 **Workers & Pages**
   - 点击 **AI** 或 **Workers AI**

3. **访问模型目录**
   - 找到 **Models** 或 **Model Catalog**
   - 搜索 `llama-3.2-11b-vision-instruct`

4. **同意协议**
   - 点击模型进入详情页
   - 阅读协议内容
   - 点击 **Accept** 或 **Agree** 按钮
   - 确认同意

5. **验证**
   - 协议同意后，模型状态应显示为 "Available" 或 "Ready"

### 方法 2: 通过 Playground（推荐）

1. **访问 Workers AI Playground**
   - 在 Cloudflare Dashboard 中找到 **Workers AI**
   - 点击 **Playground** 或 **Try it out**

2. **选择模型**
   - 在模型列表中选择 `@cf/meta/llama-3.2-11b-vision-instruct`

3. **首次使用提示**
   - 系统会显示协议同意对话框
   - 阅读协议内容
   - 点击 **I Agree** 或 **Accept**

4. **测试模型**
   - 在 Playground 中输入测试提示
   - 如果模型能够响应，说明协议已成功同意

### 方法 3: 通过 API（需要特殊格式）

如果上述方法不可用，可以尝试通过 API 同意：

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "agree"
  }'
```

**注意**: 某些模型可能需要不同的 API 格式，请参考 Cloudflare 官方文档。

---

## 🔄 替代方案：使用其他视觉模型

如果无法同意 Llama 3.2 协议，可以考虑使用其他 Cloudflare 支持的视觉模型：

### 1. LLaVA 1.5 7B
```
@cf/llava-hf/llava-1.5-7b-hf
```
- **优点**: 开源，无需额外协议
- **缺点**: 性能可能不如 Llama 3.2
- **状态**: 可能需要不同的 API 格式

### 2. Uform Gen2 QWen 500M
```
@cf/unum/uform-gen2-qwen-500m
```
- **优点**: 轻量级，快速
- **缺点**: 能力有限

---

## 🧪 验证协议是否已同意

运行测试脚本验证：

```bash
cd server
node test-cloudflare.js
```

**成功标志**:
```
✅ 文本生成测试成功
✅ 图像分析测试成功
```

**失败标志**（需要同意协议）:
```
❌ AiError: Model Agreement: Prior to using this model, you must submit the prompt 'agree'...
```

---

## 📝 当前状态检查

### ✅ 已完成的配置

1. **环境变量配置**
   - ✅ `CLOUDFLARE_ACCOUNT_ID` 已设置
   - ✅ `CLOUDFLARE_API_TOKEN` 已设置
   - ✅ API Token 验证成功

2. **代码集成**
   - ✅ 服务器代码已更新使用 Llama 3.2 模型
   - ✅ 健康检查已配置
   - ✅ 自动故障转移已实现

### ⚠️ 待完成的步骤

1. **模型协议同意**
   - ⚠️ 需要通过 Cloudflare Dashboard 同意 Llama 3.2 协议
   - 💡 请按照上述"方法 1"或"方法 2"操作

---

## 🆘 故障排除

### 问题 1: 找不到 Workers AI 页面

**解决方案**:
- 确保您的 Cloudflare 账户已启用 Workers AI
- 某些账户类型可能需要先激活此功能
- 访问: https://dash.cloudflare.com/ 并在搜索框中搜索 "Workers AI"

### 问题 2: 模型列表中没有 Llama 3.2

**可能原因**:
- 您的账户地区不支持此模型
- 模型可能暂时不可用

**解决方案**:
- 联系 Cloudflare 支持
- 或使用替代模型（见上文）

### 问题 3: 协议同意后仍然报错

**解决方案**:
1. 等待几分钟让设置生效
2. 清除浏览器缓存
3. 重新生成 API Token
4. 重启服务器

---

## 📞 获取帮助

如果遇到问题，可以：

1. **查看 Cloudflare 文档**
   - https://developers.cloudflare.com/workers-ai/

2. **联系 Cloudflare 支持**
   - 通过 Dashboard 提交支持工单

3. **社区论坛**
   - https://community.cloudflare.com/

---

## ✅ 下一步

完成协议同意后：

1. **重新运行测试**
   ```bash
   cd server
   node test-cloudflare.js
   ```

2. **启动服务器**
   ```bash
   npm run dev:all
   ```

3. **测试功能**
   - 上传图片使用智能鉴伪功能
   - 查看控制台确认 Cloudflare API 正常工作

---

**祝您配置顺利！** 🎉
