# Update 工作流 - skill 版本更新检查

通过 `package.json` 的 `version`（语义化版本）与 GitHub 远程版本对比。脚本从 `package.json` 的 `repository.url` 推导远程地址（已配置为 honshena/hzero-front-i18n）。

## 两种检查模式

- **手动 `/hzero-front-i18n-update` 命令：强制检查**（`node scripts/update.js`），不读 cache（始终联网），检查后写入 `lastCheckDate`，不判断今天是否已检查过
- **每日自动检查（`checkDailyUpdate`）：cache-first**，先读 `cache.json` 的 `lastCheckDate`，今日已查则不调用网络

## 脚本调用

```powershell
node scripts/update.js              # 强制检查（命令默认行为，不读 cache，始终联网，写入 lastCheckDate）
node scripts/update.js --daily      # cache-first（每日自动检查用）
node scripts/update.js --skip <ver> # 跳过指定版本
```

或代码调用：
```javascript
const { checkDailyUpdate } = require('../../scripts/update');
const r = await checkDailyUpdate(); // 默认 master 分支，cache-first
```

## 代理配置

访问 GitHub raw 需要代理时，在 `.env.json` 的 `update.httpProxy`/`update.httpsProxy` 填入代理地址（用户手动配置）。执行更新检查前，若该字段存在，AI **优先**将其设为 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量（覆盖系统已有值）再运行（`update.js` 用 axios 自动读取这两个环境变量）；未配置则沿用系统已有的 `HTTPS_PROXY` 环境变量。

## 返回值与 AI 行为

**强制检查**（`node scripts/update.js`）返回 `{ current, latest, hasUpdate }`。

**cache-first 检查**（`--daily` / `checkDailyUpdate`）返回 `action`：

| action | 含义 | AI 行为 |
|--------|------|---------|
| `skip-already-checked` | 今日已检查过 | 不提示，直接继续用户任务 |
| `up-to-date` | 已是最新 | 不提示，直接继续 |
| `skip-skipped-version` | 有更新但用户已跳过该版本 | 不提示，直接继续 |
| `update-available` | 发现新版本 | 用 `question` 工具提示用户选择 |
| `check-failed` | 检查失败（网络等） | 仅提示用户检查失败，不阻塞，直接继续用户任务（今日不再检查） |

`checkDailyUpdate` 在执行当天首次检查时即写入 `lastCheckDate`，**无论成功或失败当天都不再重复检查**。`cache.json` 为本地文件（已 `.gitignore`），不提交。

## update-available 时的选项（用 question 工具规范化展示）

- **立即更新**（推荐）：执行 `git pull` 与 `npm install`，再运行 `.\setup.ps1`（或 `setup.bat`）重新注册命令；读 `CHANGELOG.md` 新版本条目的「⚠️ 更新须知」并按提示执行额外步骤（清理缓存/重新配置等）；提示用户重启 AI 工具
- **跳过此版本**：运行 `node scripts/update.js --skip <latest>` 记录跳过，本次不再提示（直到出现更新的版本）
- **稍后再说**：本次不更新，明天首次使用时再次提示

## 每日自动检查

每天首次使用 skill 时自动触发一次 cache-first 检查，当天不再重复，**检查失败也仅提示一次、当天不再重试**。

## 用户明确要求重新检查时

（如「重新检查更新」「强制检查」）：运行 `node scripts/update.js [分支]`（强制检查，不读写 cache，始终联网）。

## 注意

- 404 时尝试其他分支名或检查仓库地址
- 更新 skill 后（`git pull`）需重新运行 `setup` 以刷新已注册命令，否则新增/修改的命令不生效
