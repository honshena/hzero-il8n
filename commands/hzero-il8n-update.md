---
description: Check hzero-il8n skill for updates
---

使用 hzero-il8n skill 检查版本更新。

参数: $ARGUMENTS（可选，指定分支名，默认 master）

流程：
1. 在 skill 目录下运行 `node scripts/update.js [分支]`，获取 `{ current, latest, hasUpdate, remoteUrl, branch }`
2. 若 `hasUpdate` 为 true：
   - 向用户展示当前版本与最新版本
   - 询问用户是否更新
   - 用户确认后执行 `git pull` 与 `npm install`
   - 运行 `.\setup.ps1`（或 `setup.bat`）重新注册命令（新增/修改的命令才会生效）
   - 提示用户重启 AI 工具，使新 SKILL.md / 命令生效
3. 若 `hasUpdate` 为 false：提示已是最新版本
4. 若报错（如 404）：检查 `package.json` 的 `repository.url` 是否正确；可尝试其他分支名重试

本命令为 skill 自身的版本管理，不经过 i18n 操作的 taskId/data.json 流程。

示例: /hzero-il8n-update master
