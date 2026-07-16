---
description: Check code for h0 i18n issues (hardcoded text, unregistered/missing keys, English casing, scope, formatterCollections, .d() language)
---

加载 hzero-front-i18n skill，按 `commands/check/workflow.md` 执行代码多语言问题检查。

默认执行全部检查项，用户可输入自定义范围缩小。检查后先输出摘要表，再逐条列出问题，最后询问是否修复。

参数: $ARGUMENTS（文件或目录路径，必填）

示例: /hzero-front-i18n-check D:\path\to\src
       /hzero-front-i18n-check D:\path\to\file.tsx
