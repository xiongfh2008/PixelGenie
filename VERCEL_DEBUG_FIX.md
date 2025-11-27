# Vercel部署调试修复

## 已完成的修复

### 1. API URL配置
- 生产环境自动使用相对路径（空字符串）
- 开发环境使用 localhost:3001
- 无需手动配置 VITE_API_BASE_URL

### 2. 错误信息增强
- 显示完整错误信息用于调试
- 包含后端返回的详细错误

## Vercel环境变量配置

在Vercel Dashboard添加以下环境变量：

```bash
# 必需 - 至少配置一个
GOOGLE_API_KEY=你的密钥
CLOUDFLARE_API_TOKEN=你的令牌
CLOUDFLARE_ACCOUNT_ID=你的账号ID
HUGGINGFACE_API_KEY=你的密钥
```

**重要**: 勾选 Production, Preview, Development

## 重新部署

1. 提交代码更改
2. 推送到GitHub
3. Vercel自动部署
4. 或在Vercel Dashboard点击 Redeploy

## 测试

部署后访问你的URL，尝试去水印功能，查看详细错误信息。

