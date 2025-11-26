# ✅ Pre-commit 钩子已更新

## 问题
钩子检测到 `.env` 文件就报错，即使是删除操作也被阻止。

## 解决方案
✅ 已更新钩子脚本，现在：
- ✅ **允许**删除 `.env` 文件（这是好的，我们要从 Git 中移除它）
- ❌ **阻止**添加或修改 `.env` 文件（防止密钥泄露）

## 更新内容

钩子现在使用 `--diff-filter=AM` 只检查**添加**或**修改**的文件：

```bash
# 只检查添加或修改的 .env 文件（阻止）
git diff --cached --name-only --diff-filter=AM | grep -E "\.env$"

# 允许删除的 .env 文件
git diff --cached --name-only --diff-filter=D | grep -E "\.env$"
```

## 现在可以提交了

```bash
git commit -m "feat: 更新 Gemini 模型为 gemini-2.5-flash-image"
```

这次提交会：
- ✅ 允许删除 `server/.env`（从 Git 跟踪中移除）
- ✅ 提交其他所有更改
- ✅ 保护未来不会意外添加 `.env` 文件

---

**状态**: ✅ 已修复  
**可以提交**: 是

