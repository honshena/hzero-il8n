---
description: Check code for i18n issues
---

使用 hzero-il8n skill 检查代码中的多语言问题。

参数: $ARGUMENTS

检查内容包括：
- 硬编码字符串
- 未注册的 key（平台上不存在）
- 翻译缺失（promptConfigs 缺少某些语言）
- code 格式违规
- 英文大小写规范（标题类 Title Case / 描述类 Sentence Case）
- **intl.get 作用域**（不能在组件外直接调用，建议改为函数/getter）

**检查开始前**，用 `question` 工具（`multiple: true`）列出检查项（首个为「全部」，其余为硬编码字符串、未注册 key、翻译缺失、code 格式、英文大小写规范、intl.get 作用域）让用户多选要执行哪些；选「全部」则执行所有，否则仅对选中项检查。完成后将问题写入 data.json 并展示。

示例: /hzero-il8n-check D:\path\to\file.tsx
