---
description: Release hzero-il8n - summarize git changes into changelog, approve, commit and push
---

加载 hzero-il8n skill，按 SKILL.md 发布流程执行：查看 git 变更 -> 更新 CHANGELOG -> 用户审批 -> 提交 -> push。

参数: $ARGUMENTS（可选，版本号；不指定则 AI 按 semver 提议）

提交格式：`[RELEASE]{版本}-{简要描述}`，如 `[RELEASE]1.2.0-新增单元测试与axios`

示例: /hzero-il8n-release
       /hzero-il8n-release 1.3.0
