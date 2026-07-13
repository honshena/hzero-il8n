---
description: Check hzero-il8n skill for updates
---

使用 hzero-il8n skill 检查版本更新。

参数: $ARGUMENTS（可选，指定分支名，默认 master）

**本命令为强制检查：始终调用网络接口获取最新版本，不读 `cache.json`（不判断今天是否已检查过），但检查后写入 `lastCheckDate` 标记今日已检查。**（每日自动检查才会读 cache 判断今天是否检查过，见 SKILL.md「每日更新检查」。）

流程：
1. 在 skill 目录下运行 `node scripts/update.js [分支]`，返回 `{ current, latest, hasUpdate }`：
   - 失败（输出 `error`）：仅提示用户检查失败，结束
   - `hasUpdate` 为 false：提示已是最新版本，结束
   - `hasUpdate` 为 true：进入步骤 2
2. `hasUpdate` 为 true 时：
   - 向用户展示当前版本与最新版本
   - 询问用户是否更新
   - 用户确认后执行 `git pull` 与 `npm install`
   - 运行 `.\setup.ps1`（或 `setup.bat`）重新注册命令（新增/修改的命令才会生效）
   - 提示用户重启 AI 工具，使新 SKILL.md / 命令生效

本命令为 skill 自身的版本管理，不经过 i18n 操作的 taskId/data.json 流程。

示例: /hzero-il8n-update
       /hzero-il8n-update dev
