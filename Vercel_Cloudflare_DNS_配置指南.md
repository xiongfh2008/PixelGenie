# 🚀 Vercel + Cloudflare DNS 完美配置指南

## 🎯 架构说明

**您的配置**：
- ✅ **应用部署**：Vercel（前后端）
- ✅ **DNS 托管**：Cloudflare
- ✅ **CDN + 安全**：Cloudflare

**优势**：
- ⚡ Vercel 的快速部署 + Cloudflare 的全球 CDN
- 🛡️ Cloudflare 的 DDoS 防护和 WAF
- 📊 Cloudflare 的流量分析
- 🔒 免费 SSL 证书

---

## 📋 配置步骤

### 步骤 1：在 Vercel 部署项目

1. **访问** https://vercel.com
2. **导入项目**
   - 点击 "Add New..." > "Project"
   - 选择 `PixelGenie` 仓库
   - 点击 "Import"

3. **配置环境变量**
   ```
   GOOGLE_API_KEY=您的Google API密钥
   CLOUDFLARE_ACCOUNT_ID=您的Cloudflare账号ID
   CLOUDFLARE_API_TOKEN=您的Cloudflare API令牌
   HUGGINGFACE_API_KEY=您的HuggingFace API密钥
   XUNFEI_APP_ID=您的讯飞APPID
   XUNFEI_API_SECRET=您的讯飞API密钥
   XUNFEI_API_KEY=您的讯飞API Key
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成
   - 获得 Vercel 域名：`https://pixelgenie.vercel.app`

---

### 步骤 2：在 Cloudflare 添加域名

假设您的域名是 `example.com`

1. **登录 Cloudflare**
   - 访问 https://dash.cloudflare.com/

2. **添加站点**（如果还没添加）
   - 点击 "Add a Site"
   - 输入您的域名：`example.com`
   - 选择免费计划
   - 点击 "Continue"

3. **更新域名服务器**（如果还没做）
   - Cloudflare 会显示两个 Nameserver
   - 去您的域名注册商（如阿里云、腾讯云、GoDaddy）
   - 将域名的 Nameserver 改为 Cloudflare 提供的
   - 等待 DNS 生效（通常 5-30 分钟）

---

### 步骤 3：配置 DNS 记录

在 Cloudflare Dashboard 中：

1. **进入 DNS 设置**
   - 选择您的域名
   - 点击 "DNS" 标签

2. **添加 DNS 记录**

#### 方案 A：使用主域名（推荐）

如果您想用 `example.com` 访问：

```
类型: CNAME
名称: @
目标: cname.vercel-dns.com
代理状态: 已代理（橙色云朵）✅
TTL: 自动
```

#### 方案 B：使用子域名

如果您想用 `app.example.com` 或 `pixelgenie.example.com` 访问：

```
类型: CNAME
名称: app (或 pixelgenie)
目标: cname.vercel-dns.com
代理状态: 已代理（橙色云朵）✅
TTL: 自动
```

#### 方案 C：同时支持 www 和主域名

添加两条记录：

**记录 1**：
```
类型: CNAME
名称: @
目标: cname.vercel-dns.com
代理状态: 已代理 ✅
```

**记录 2**：
```
类型: CNAME
名称: www
目标: cname.vercel-dns.com
代理状态: 已代理 ✅
```

3. **保存记录**
   - 点击 "Save"

---

### 步骤 4：在 Vercel 添加自定义域名

1. **进入项目设置**
   - Vercel Dashboard > 您的项目
   - 点击 "Settings" 标签
   - 点击 "Domains"

2. **添加域名**
   - 点击 "Add"
   - 输入您的域名：
     - `example.com` （主域名）
     - 或 `app.example.com` （子域名）
     - 或 `www.example.com` （www）

3. **验证配置**
   - Vercel 会自动检测 DNS 配置
   - 如果配置正确，会显示 ✅
   - 如果有问题，Vercel 会提示需要的 DNS 记录

4. **等待 SSL 证书**
   - Vercel 会自动配置 SSL 证书
   - 通常需要 1-5 分钟
   - 完成后会显示 "Valid Configuration"

---

### 步骤 5：配置 Cloudflare 设置（优化）

#### 5.1 SSL/TLS 设置

1. **进入 SSL/TLS 设置**
   - Cloudflare Dashboard > 您的域名
   - 点击 "SSL/TLS"

2. **选择加密模式**
   - 选择 **"Full (strict)"** ✅
   - 这样 Cloudflare 和 Vercel 之间也会加密

#### 5.2 缓存设置（可选）

1. **进入缓存设置**
   - 点击 "Caching" > "Configuration"

2. **缓存级别**
   - 选择 "Standard" 或 "Aggressive"

3. **浏览器缓存 TTL**
   - 建议设置为 "4 hours" 或 "Respect Existing Headers"

#### 5.3 页面规则（可选）

为 API 路径禁用缓存：

1. **创建页面规则**
   - 点击 "Rules" > "Page Rules"
   - 点击 "Create Page Rule"

2. **配置规则**
   ```
   URL: example.com/api/*
   设置:
   - Cache Level: Bypass
   - Disable Performance
   ```

3. **保存**

#### 5.4 防火墙规则（可选）

1. **进入安全设置**
   - 点击 "Security" > "WAF"

2. **启用 WAF**
   - 开启 "Managed Rules"
   - 选择 "OWASP Core Ruleset"

---

## 🎯 完整配置示例

### 示例 1：使用主域名

**域名**：`pixelgenie.com`

**Cloudflare DNS**：
```
类型: CNAME
名称: @
目标: cname.vercel-dns.com
代理: 已代理 ✅
```

**Vercel Domains**：
```
pixelgenie.com ✅
```

**访问**：
- https://pixelgenie.com → Vercel 应用

---

### 示例 2：使用子域名

**域名**：`app.pixelgenie.com`

**Cloudflare DNS**：
```
类型: CNAME
名称: app
目标: cname.vercel-dns.com
代理: 已代理 ✅
```

**Vercel Domains**：
```
app.pixelgenie.com ✅
```

**访问**：
- https://app.pixelgenie.com → Vercel 应用

---

### 示例 3：同时支持主域名和 www

**域名**：`pixelgenie.com` 和 `www.pixelgenie.com`

**Cloudflare DNS**：
```
记录 1:
类型: CNAME
名称: @
目标: cname.vercel-dns.com
代理: 已代理 ✅

记录 2:
类型: CNAME
名称: www
目标: cname.vercel-dns.com
代理: 已代理 ✅
```

**Vercel Domains**：
```
pixelgenie.com ✅
www.pixelgenie.com ✅
```

**Vercel 重定向设置**（可选）：
- 在 Vercel 项目根目录创建 `vercel.json`：

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.pixelgenie.com"
        }
      ],
      "destination": "https://pixelgenie.com/:path*",
      "permanent": true
    }
  ]
}
```

这样 `www.pixelgenie.com` 会自动重定向到 `pixelgenie.com`

---

## 🔍 验证配置

### 1. DNS 验证

在终端运行：

```bash
# 检查 DNS 记录
nslookup pixelgenie.com

# 或使用 dig
dig pixelgenie.com

# 应该看到 CNAME 指向 cname.vercel-dns.com
```

### 2. SSL 证书验证

访问您的域名：
```
https://pixelgenie.com
```

检查浏览器地址栏：
- ✅ 应该显示锁图标
- ✅ 证书应该由 Vercel 或 Let's Encrypt 颁发

### 3. Cloudflare 代理验证

在终端运行：

```bash
curl -I https://pixelgenie.com
```

响应头应该包含：
```
cf-ray: xxxxx
cf-cache-status: DYNAMIC
server: cloudflare
```

---

## ⚠️ 常见问题

### 问题 1：DNS 未生效

**症状**：访问域名显示 "DNS_PROBE_FINISHED_NXDOMAIN"

**解决**：
1. 等待 DNS 传播（最多 48 小时，通常 5-30 分钟）
2. 清除本地 DNS 缓存：
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### 问题 2：Vercel 显示 "Invalid Configuration"

**症状**：Vercel Domains 页面显示红色错误

**解决**：
1. 检查 Cloudflare DNS 记录是否正确
2. 确保 CNAME 目标是 `cname.vercel-dns.com`
3. 确保代理状态是"已代理"（橙色云朵）
4. 等待几分钟让 DNS 传播

### 问题 3：SSL 证书错误

**症状**：浏览器显示 "您的连接不是私密连接"

**解决**：
1. 在 Cloudflare 设置 SSL/TLS 模式为 "Full (strict)"
2. 等待 Vercel 自动配置 SSL 证书（1-5 分钟）
3. 清除浏览器缓存并重试

### 问题 4：API 请求失败

**症状**：前端可以访问，但 API 调用失败

**解决**：
1. 检查 Vercel 环境变量是否正确配置
2. 在 Cloudflare 为 `/api/*` 路径禁用缓存
3. 检查 CORS 设置

---

## 🎊 配置完成检查清单

- [ ] Vercel 项目部署成功
- [ ] Vercel 环境变量已配置
- [ ] Cloudflare DNS 记录已添加
- [ ] Vercel 自定义域名已添加
- [ ] SSL 证书已生效（绿色锁图标）
- [ ] Cloudflare SSL/TLS 设置为 "Full (strict)"
- [ ] 网站可以通过自定义域名访问
- [ ] API 请求正常工作
- [ ] Cloudflare 代理已启用（可选）

---

## 📊 架构优势

### 使用 Vercel + Cloudflare 的好处

1. **性能**
   - ✅ Vercel 的边缘网络（全球 CDN）
   - ✅ Cloudflare 的 CDN 加速
   - ✅ 双重缓存优化

2. **安全**
   - ✅ Cloudflare DDoS 防护
   - ✅ Cloudflare WAF（Web 应用防火墙）
   - ✅ 自动 SSL 证书
   - ✅ Bot 防护

3. **可靠性**
   - ✅ Vercel 99.99% 可用性
   - ✅ Cloudflare 全球 Anycast 网络
   - ✅ 自动故障转移

4. **分析**
   - ✅ Vercel Analytics
   - ✅ Cloudflare Analytics
   - ✅ 详细的流量统计

---

## 🚀 下一步

### 优化建议

1. **启用 Cloudflare Analytics**
   - 查看流量统计
   - 分析访客来源

2. **配置 Cloudflare Workers**（可选）
   - 边缘计算
   - 请求重写
   - A/B 测试

3. **启用 Cloudflare Images**（可选）
   - 自动图片优化
   - WebP 转换
   - 响应式图片

4. **配置 Vercel Analytics**
   - 实时性能监控
   - Web Vitals 追踪

---

## 📖 相关文档

- 📄 Vercel 文档：https://vercel.com/docs
- 📄 Cloudflare DNS 文档：https://developers.cloudflare.com/dns/
- 📄 Cloudflare SSL 文档：https://developers.cloudflare.com/ssl/

---

## 🎯 总结

**您的配置**：
```
用户 → Cloudflare CDN → Vercel 应用
     ↓
  DNS 解析
  DDoS 防护
  WAF 防护
  SSL 加密
```

**优势**：
- ⚡ 最快的访问速度
- 🛡️ 最强的安全防护
- 📊 详细的流量分析
- 💰 完全免费

**配置完成！** 您现在拥有一个专业级的全栈应用部署！🎉

---

**配置时间**: 2025-11-26  
**状态**: ✅ 完整配置指南  
**架构**: Vercel + Cloudflare DNS + CDN

