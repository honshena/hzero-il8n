---
description: Check code for h0 i18n issues (hardcoded text, unregistered/missing keys, English casing, scope, formatterCollections, .d() language)
---

加载 hzero-front-i18n skill，按 `commands/check/workflow.md` 执行代码多语言问题检查。

**执行前必须用 question 工具询问用户检查范围**：只列「全部（推荐）」一项（description 写明含 8 个检查项），并支持用户自定义输入要查的内容。不得跳过询问直接扫描。检查后先输出摘要表，再逐条列出问题，最后询问是否修复。

参数: $ARGUMENTS（文件或目录路径，必填）

示例: /hzero-front-i18n-check D:\path\to\src
       /hzero-front-i18n-check D:\path\to\file.tsx
