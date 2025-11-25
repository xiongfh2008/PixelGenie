# 🆓 PixelGenie 免费API配置指南

## 📋 可用免费API列表

### 1. **百度文心一言** (推荐) <mcreference link="http://m.toutiao.com/group/7551603648339968564/" index="1">1</mcreference>
- **状态**: 永久免费 (2025年3月16日起)
- **申请地址**: https://cloud.baidu.com/product/wenxinworkshop
- **免费额度**: 无限制使用
- **特点**: 中文理解优秀，多模态能力强
- **配置变量**: `BAIDU_API_KEY`

### 2. **讯飞星火** (已配置) <mcreference link="https://blog.csdn.net/a1235824/article/details/150600981" index="1">1</mcreference>
- **状态**: 免费额度充足
- **申请地址**: https://xinghuo.xfyun.cn/
- **免费额度**: 每月200万tokens
- **特点**: 语言理解、逻辑推理能力强
- **配置变量**: `XUNFEI_API_KEY`, `XUNFEI_APP_ID`, `XUNFEI_API_SECRET`

### 3. **腾讯混元** (新增) <mcreference link="https://wap.zol.com.cn/ask/x_31106686.html" index="2">2</mcreference>
- **状态**: 免费使用
- **申请地址**: https://cloud.tencent.com/product/hunyuan
- **免费额度**: 新用户赠送额度
- **特点**: 表格处理、数据分析优秀
- **配置变量**: `TENCENT_API_KEY`

### 4. **阿里通义千问** (新增) <mcreference link="https://wap.zol.com.cn/ask/x_31106686.html" index="2">2</mcreference>
- **状态**: 免费使用
- **申请地址**: https://tongyi.aliyun.com/
- **免费额度**: 新用户赠送额度
- **特点**: 综合性能优秀
- **配置变量**: `ALIBABA_API_KEY`

### 5. **DeepSeek** (新增) <mcreference link="http://m.toutiao.com/group/7499234305601569314/" index="5">5</mcreference>
- **状态**: 免费使用
- **申请地址**: https://platform.deepseek.com/
- **免费额度**: 无限制使用
- **特点**: 深度搜索功能强大
- **配置变量**: `DEEPSEEK_API_KEY`

### 6. **Google Gemini** (已配置)
- **状态**: 免费额度有限
- **申请地址**: https://aistudio.google.com/
- **免费额度**: 每分钟15次请求限制
- **特点**: 多模态能力最强
- **配置变量**: `GOOGLE_API_KEY`

## ⚙️ 配置步骤

### 1. 复制环境变量模板
```bash
# 复制示例文件
cp server/.env.example server/.env
```

### 2. 获取API密钥
按照上述链接申请各个平台的API密钥

### 3. 配置环境变量
编辑 `server/.env` 文件，填入您的API密钥：

```env
# 百度文心一言 (推荐)
BAIDU_API_KEY=your_baidu_api_key_here

# 讯飞星火
XUNFEI_API_KEY=your_xunfei_api_key_here
XUNFEI_APP_ID=your_app_id_here
XUNFEI_API_SECRET=your_api_secret_here

# 腾讯混元
TENCENT_API_KEY=your_tencent_api_key_here

# 阿里通义千问
ALIBABA_API_KEY=your_alibaba_api_key_here

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google Gemini
GOOGLE_API_KEY=your_google_api_key_here
```

### 4. 重启服务器
```bash
# 重启后端服务器
npm run dev:server
```

## 🔄 API优先级策略

系统按照以下优先级自动选择API：
1. **Google Gemini** (性能最佳)
2. **百度文心一言** (永久免费)
3. **腾讯混元** (免费额度)
4. **阿里通义千问** (免费额度)
5. **讯飞星火** (已配置)
6. **DeepSeek** (无限制)
7. **HuggingFace** (备用)

## 💡 使用建议

### 最佳实践
1. **优先配置百度文心一言** - 永久免费，稳定性好
2. **配置2-3个备用API** - 确保服务不间断
3. **定期检查配额** - 避免额度用尽

### 故障切换
- 当主API配额用尽时自动切换到下一个可用API
- 支持实时API健康检查
- 错误重试机制

## 📊 免费额度对比

| API提供商 | 免费额度 | 特点 | 推荐指数 |
|-----------|----------|------|----------|
| 百度文心一言 | 永久免费 | 中文优秀，多模态强 | ⭐⭐⭐⭐⭐ |
| DeepSeek | 无限制 | 深度搜索功能 | ⭐⭐⭐⭐ |
| 讯飞星火 | 200万tokens/月 | 逻辑推理强 | ⭐⭐⭐⭐ |
| 腾讯混元 | 新用户赠送 | 表格处理优秀 | ⭐⭐⭐ |
| 阿里通义千问 | 新用户赠送 | 综合性能好 | ⭐⭐⭐ |
| Google Gemini | 15次/分钟 | 多模态最强 | ⭐⭐⭐⭐ |

## 🚀 快速开始

1. **立即配置百度文心一言** (5分钟完成)
2. **测试系统功能** - 确保API连接正常
3. **根据需要添加其他API** - 增加冗余备份

## ❓ 常见问题

**Q: 哪个API最稳定？**
A: 百度文心一言（永久免费）和DeepSeek（无限制）最稳定

**Q: 如何知道当前使用哪个API？**
A: 查看服务器启动日志，会显示当前激活的API提供商

**Q: API配额用尽怎么办？**
A: 系统会自动切换到下一个可用API，无需手动干预

---

**💡 提示**: 建议至少配置百度文心一言和DeepSeek两个API，确保服务高可用性。