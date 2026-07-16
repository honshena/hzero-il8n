---
description: Release hzero-front-i18n - summarize git changes into changelog, approve, commit and push
---

加载 hzero-front-i18n skill，按 `commands/release/workflow.md` 执行发布：查看 git 变更 -> 更新 CHANGELOG -> 用户审批 -> 提交 -> push。

参数: $ARGUMENTS（可选，版本号；不指定则 AI 按 semver 提议）

提交格式：`[RELEASE]{版本}-{简要描述}`，如 `[RELEASE]1.2.0-新增单元测试与axios`

示例: /hzero-front-i18n-release
       /hzero-front-i18n-release 1.3.0
