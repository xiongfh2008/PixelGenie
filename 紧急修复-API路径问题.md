# 紧急修复 - API路径问题

## 问题
前端在生产环境仍然请求 `localhost:3001`，导致 500 错误

## 根本原因
`import.meta.env.PROD` 在某些情况下不可靠

## 修复方案

### 1. 简化 API_BASE_URL 逻辑
```typescript
// 之前（复杂且不可靠）
const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
    if (isLocalhost && window.location.port === '5173') {
      return 'http://localhost:3001';
    }
  }
  return '';
})();

// 现在（简单可靠）
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';
```

### 2. 修复 Vercel 配置
- 使用 `version: 2` 标准配置
- 明确定义 `functions` 运行时
- 正确的路由顺序：API → 静态文件 → SPA fallback

## 验证步骤

1. 等待 Vercel 部署完成（约2-3分钟）
2. 打开浏览器开发者工具 → Network 标签
3. 上传图片并使用功能
4. 检查请求：
   - ✅ 应该看到：`POST https://pixel-genie-iota.vercel.app/api/modify-image`
   - ❌ 不应该看到：`POST http://localhost:3001/api/modify-image`

## 如果还有问题

1. 清除浏览器缓存：
   - Chrome: Ctrl+Shift+Delete → 清除缓存
   - 或者使用无痕模式

2. 硬刷新页面：
   - Windows: Ctrl+F5
   - Mac: Cmd+Shift+R

3. 检查 Vercel Dashboard:
   - Deployments → 最新部署状态
   - Functions → 查看 `api/index.js` 日志

## 技术说明

- `import.meta.env.DEV`: Vite 内置变量，开发环境为 `true`，生产环境为 `false`
- 这比检查 `PROD` 或 `hostname` 更可靠
- 在构建时就确定了值，不依赖运行时检测

