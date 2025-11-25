# PixelGenie 多API备选方案配置指南

## 概述

为了解决Google Gemini API免费配额用尽的问题，PixelGenie现在支持多个AI API提供商作为备选方案。系统会自动按优先级选择可用的API提供商。

## 支持的API提供商

### 1. Google Gemini API (优先级最高)
- **状态**: 当前免费配额已用完
- **优势**: 图像分析质量最高
- **限制**: 免费配额有限，需要等待重置或升级付费计划

### 2. 百度文心大模型 (推荐备选)
- **状态**: 永久免费开放
- **优势**: 中文理解能力强，图像分析质量优秀
- **申请地址**: https://cloud.baidu.com/product/wenxinworkshop

### 3. 讯飞星火spark-lite
- **状态**: 永久免费
- **优势**: Tokens总量无限，QPS=2
- **申请地址**: https://xinghuo.xfyun.cn/

### 4. HuggingFace开源模型
- **状态**: 免费使用
- **优势**: 开源模型，无需申请API密钥
- **模型**: BLIP-2、CLIP等图像分析模型

## 配置步骤

### 第一步：申请API密钥

1. **百度文心大模型**
   - 访问百度智能云官网
   - 注册账号并完成实名认证
   - 进入文心大模型产品页面
   - 创建应用并获取API Key和Secret Key

2. **讯飞星火**
   - 访问讯飞开放平台
   - 注册开发者账号
   - 创建应用获取AppID、API Key和Secret

### 第二步：配置环境变量

1. 复制环境变量模板：
   ```bash
   cp server/.env.example server/.env
   ```

2. 编辑 `server/.env` 文件，填入您的API密钥：
   ```env
   # Google Gemini API Key (可选)
   GOOGLE_API_KEY=your_google_api_key_here
   
   # Baidu Wenxin API Key (推荐配置)
   BAIDU_API_KEY=your_baidu_api_key_here
   
   # Xunfei Spark API Key (可选)
   XUNFEI_API_KEY=your_xunfei_api_key_here
   
   # HuggingFace API Key (可选)
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

### 第三步：重启服务器

```bash
# 停止当前服务器
Ctrl+C

# 重新启动服务器
npm run dev:server
```

## API优先级系统

系统按以下优先级自动选择API提供商：

1. **Google Gemini** (如果配置且配额可用)
2. **百度文心** (如果配置)
3. **讯飞星火** (如果配置)
4. **HuggingFace** (默认备选)

## 功能支持矩阵

| 功能 | Google Gemini | 百度文心 | 讯飞星火 | HuggingFace |
|------|---------------|----------|----------|-------------|
| 智能鉴伪 | ✅ | ✅ | ✅ | ✅ |
| 图像修改 | ✅ | ✅ | ❌ | ❌ |
| 文本翻译 | ✅ | ✅ | ❌ | ❌ |
| 文本检测 | ✅ | ✅ | ❌ | ❌ |

## 故障排除

### 常见问题

1. **所有API都不可用**
   - 检查网络连接
   - 验证API密钥是否正确配置
   - 查看服务器日志获取详细错误信息

2. **特定API调用失败**
   - 检查该API提供商的配额状态
   - 验证API密钥是否有效
   - 查看具体的错误信息

3. **图像分析质量不佳**
   - 尝试使用不同API提供商
   - 调整图像质量或重新上传

### 日志查看

服务器启动时会显示可用的API提供商：
```
✅ Available API providers: google, baidu
🔑 Active provider: baidu
```

## 性能优化建议

1. **批量处理**: 避免频繁调用API，尽量批量处理图像
2. **缓存结果**: 对相同图像的分析结果进行缓存
3. **图像优化**: 上传前适当压缩图像大小
4. **错误重试**: 系统会自动重试失败的API调用

## 技术支持

如遇到配置问题，请：
1. 查看服务器日志获取详细错误信息
2. 检查API提供商的官方文档
3. 联系相关API提供商的技术支持

## 更新日志

- **v1.1.0**: 新增多API备选方案支持
- **v1.0.0**: 初始版本，仅支持Google Gemini API