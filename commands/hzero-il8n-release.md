---
description: Release hzero-il8n - summarize git changes into changelog, approve, commit and push
---

使用 hzero-il8n skill 发布新版本。

参数: $ARGUMENTS（可选，指定版本号；不指定则由 AI 按 semver 提议）

流程：
1. **查看 git 变更**：运行 `git status`、`git diff`（已暂存+未暂存）、`git log --oneline -15`，汇总自上次 release 以来的全部变更。
2. **确定版本号**：按 semver 提议下一版本（破坏性变更 major / 新功能 minor / 修复 patch），更新 `package.json` 的 `version`。用户在参数中指定版本号时以其为准。
3. **更新 `CHANGELOG.md`**：把顶部 `[Unreleased]` 段改为新版本号 + 今日日期，填入变更摘要与「⚠️ 更新须知」（依赖/命令/配置等迁移步骤）；在顶部新建空的 `[Unreleased]` 段供下次使用。
4. **审批**：将变更摘要、新版本号、CHANGELOG 更新内容、提交信息 `[RELEASE]{版本}-{简要描述}` 严格列表展示，用 `question` 工具让用户确认。
5. **用户同意后执行**：
   - `git add -A`
   - `git commit -m "[RELEASE]{版本}-{简要描述}"`
   - `git push`
6. 推送后提示：其它环境可通过 `/hzero-il8n-update` 拉取本次更新（会读 CHANGELOG 的更新须知）。

本命令为 skill 发布管理，不经过 i18n 操作的 taskId/data.json 流程。用户未确认不得提交或推送。

提交信息格式：`[RELEASE]{版本}-{简要描述}`，例如 `[RELEASE]1.2.0-新增单元测试与axios`

示例: /hzero-il8n-release
       /hzero-il8n-release 1.3.0
