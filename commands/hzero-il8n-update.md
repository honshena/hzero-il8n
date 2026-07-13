---
description: Check hzero-il8n skill for updates
---

使用 hzero-il8n skill 检查版本更新。

参数: $ARGUMENTS（可选，指定分支名，默认 master）

**检查默认 cache-first：先读 `cache.json` 的 `lastCheckDate`，若今日已检查过则不调用网络接口，直接返回 `skip-already-checked`。仅当今日未检查过、或用户明确要求重新检查时才调用接口。**

流程：
1. 在 skill 目录下运行 `node scripts/update.js [分支]`（cache-first），返回 `action`：
   - `skip-already-checked`：今日已检查过，提示用户「今日已检查，无需重复」，结束
   - `up-to-date`：已是最新版本，提示用户，结束
   - `skip-skipped-version`：有新版但已跳过该版本，提示用户当前情况，结束
   - `check-failed`：检查失败，仅提示用户，不阻塞，结束
   - `update-available`：进入步骤 2
2. `update-available` 时：
   - 向用户展示当前版本与最新版本
   - 询问用户是否更新
   - 用户确认后执行 `git pull` 与 `npm install`
   - 运行 `.\setup.ps1`（或 `setup.bat`）重新注册命令（新增/修改的命令才会生效）
   - 提示用户重启 AI 工具，使新 SKILL.md / 命令生效
3. 若用户明确要求重新检查（如「重新检查更新」「强制检查」）：运行 `node scripts/update.js --force [分支]`，绕过缓存强制调用接口

本命令为 skill 自身的版本管理，不经过 i18n 操作的 taskId/data.json 流程。

示例: /hzero-il8n-update
       /hzero-il8n-update dev
       /hzero-il8n-update 重新检查      # AI 识别后改用 --force
