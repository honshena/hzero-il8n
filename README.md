# hzero-front-i18n

h0 平台多语言管理 skill。支持查询、新增、修改、删除多语言条目，AI 翻译，代码多语言问题检查（含英文大小写规范），以及 Excel/CSV 导入导出。

适用于 opencode、Claude Code、Codex 等 AI 编程助手。

## 功能

- **代码多语言问题检查**（`/hzero-front-i18n-check`）：硬编码、未注册/未使用 key、翻译缺失、code 格式、英文大小写规范、intl.get 作用域、formatterCollections、.d() 默认值语言
- **查询 / 新增 / 修改 / 删除多语言条目**（同步到 h0 平台，AI 按需执行，非 slash 命令）
- **AI 翻译**未翻译条目
- **导出 / 导入 Excel、CSV**
- **skill 自管理**：版本更新检查（`/hzero-front-i18n-update`）、发布（`/hzero-front-i18n-release`）

## 前置条件

- Node.js（运行 `scripts/` 下的脚本）
- h0 平台账号 + 0 租户平台层 token（除`getPromptByLang`外其他接口都需要token；`getPromptByLang` 为公开接口，纯查询/检查无需 token）

## 安装

> 仓库地址：https://github.com/honshena/hzero-front-i18n，默认分支 `master`。

### 1. 克隆仓库并安装依赖

```powershell
git clone https://github.com/honshena/hzero-front-i18n.git <skill目录>
cd <skill目录>
npm install
```

`npm install` 安装 `xlsx` 依赖（Excel 读写必需）。

### 2. 按 AI 工具放到 skill 发现目录

`SKILL.md` 必须落在各工具的 skill 发现目录才会被自动识别：

| 工具 | 全局 skill 目录 | 项目级 skill 目录 |
|------|----------------|------------------|
| opencode | `~/.config/opencode/skills/hzero-front-i18n/` | `.opencode/skills/hzero-front-i18n/` |
| Claude Code | `~/.claude/skills/hzero-front-i18n/` | `.claude/skills/hzero-front-i18n/` |
| Codex | 无原生 skill 自动发现，见下方说明 | - |

**opencode / Claude Code**：直接 clone 到上表对应目录：

```powershell
# opencode 全局
git clone https://github.com/honshena/hzero-front-i18n.git "$env:USERPROFILE\.config\opencode\skills\hzero-front-i18n"
# Claude Code 全局
git clone https://github.com/honshena/hzero-front-i18n.git "$env:USERPROFILE\.claude\skills\hzero-front-i18n"
```

clone 后在该目录运行 `npm install`。

**Codex**：Codex 无 skill 自动发现机制。将仓库 clone 到任意固定路径，然后在 `~/.codex/AGENTS.md`（或项目 `AGENTS.md`）中引用：

```markdown
- 处理 h0 平台多语言时，加载并遵循 <clone路径>/hzero-front-i18n/SKILL.md 的指令。
```

### 3. 注册 `/hzero-front-i18n-*` 命令（可选）

`commands/*/command.md` 是 3 个斜杠命令定义（check / update / release），需复制到各工具的命令目录才生效（复制时重命名为 `hzero-front-i18n-{文件夹名}.md`）：

| 工具 | 全局命令目录 |
|------|------------|
| opencode | `~/.config/opencode/commands/` |
| Claude Code | `~/.claude/commands/` |
| Codex | 无原生斜杠命令，用自然语言触发 |

**opencode / Claude Code**：运行自带脚本（自动检测已安装的工具，遍历 `commands/*/command.md` 复制并重命名）

```powershell
cd "<skill目录>"
.\setup.ps1      # 或 setup.bat
```

若需手动复制：

```powershell
# opencode（每个命令文件夹下的 command.md 复制并重命名）
Copy-Item "<skill目录>\commands\check\command.md" "$env:USERPROFILE\.config\opencode\commands\hzero-front-i18n-check.md" -Force
Copy-Item "<skill目录>\commands\update\command.md" "$env:USERPROFILE\.config\opencode\commands\hzero-front-i18n-update.md" -Force
Copy-Item "<skill目录>\commands\release\command.md" "$env:USERPROFILE\.config\opencode\commands\hzero-front-i18n-release.md" -Force
# Claude Code 同理，目标改为 $env:USERPROFILE\.claude\commands\
```

**Codex**：不支持 `/hzero-front-i18n-*` 斜杠命令，直接用自然语言触发，例如："用 hzero-front-i18n 检查 src/ 的多语言问题"。

注册后重启对应工具即可使用 `/hzero-front-i18n-*` 命令。**更新 skill 后（`git pull`）需重新运行 `setup` 以刷新已注册的命令，否则新增/修改的命令不会生效。**

### 4. 配置 `.env.json`

编辑 skill 目录下 `.env.json`，填入项目、环境地址、token、租户 ID（也可让 AI 按 `config/workflow.md` 引导配置）：

```json
{
  "projects": {
    "hskp-console": {
      "defaultLanguage": "zh_CN",
      "environments": {
        "dev": { "host": "http://开发环境地址", "token": "bearer xxx", "tenantId": 0 }
      }
    }
  },
  "fileProjectMap": {},
  "update": {
    "httpProxy": "http://127.0.0.1:7890",
    "httpsProxy": "http://127.0.0.1:7890"
  }
}
```

Token 必须有 0 租户平台层权限（`getPromptByLang` 为公开接口，纯查询/检查可留空,其他接口均需要使用token）。`defaultLanguage` 由用户选择（zh_CN / en_US / 自定义），决定新增条目 `.d()` 默认值语言、检查主语言。**多项目共存，不设固定 `currentProject`/`currentEnvironment`**：每次操作时 AI 按当前文件路径用 `getProjectByFilePath` 确认关联项目，无文件上下文则询问用户，记录到 `fileProjectMap`。详见 `config/workflow.md`。

`update` 为可选字段（用户手动配置），用于版本更新检查（`/hzero-front-i18n-update`）的 HTTP/HTTPS 代理。执行更新检查时若该字段存在，AI 优先将其设为 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量再运行（axios 自动读取）；未配置则沿用系统已有的代理环境变量。

## 命令

| 命令 | 说明 | 关键参数 |
|------|------|----------|
| `/hzero-front-i18n-check` | 检查代码多语言问题（含英文大小写） | 文件/目录路径 |
| `/hzero-front-i18n-update` | 检查 skill 版本更新 | 分支（可选，默认 master） |
| `/hzero-front-i18n-release` | 发布新版本（变更->changelog->审批->提交->push） | 版本号（可选） |

查询 / 新增 / 修改 / 删除 / 翻译 / 导出 / 导入 不是 slash 命令，直接用自然语言让 AI 执行（如"查询 hskp.common 的多语言"、"导出 hskp.platform 到 Excel"）。Codex 用户同样用自然语言触发所有操作。

## 操作流程

每次操作严格按 6 步执行，每步完成后打勾确认（`✓ Step n 完成`）才进入下一步：

1. 创建 taskId 和目录
2. 生成 data.json（完整待执行数据）
3. 展示 data.json 完整内容给用户审批（不省略、不摘要）
4. 用户确认（question 工具）
5. 执行操作
6. 写入 result.json

详见 SKILL.md 的 Task Management 与 Constraints。

## 检查更新

提供 `/hzero-front-i18n-update` 命令与 `scripts/update.js` 脚本，通过 `package.json` 的 `version`（语义化版本）与 GitHub 远程版本对比。

**两种检查模式：**
- **手动 `/hzero-front-i18n-update` 命令：强制检查**（`node scripts/update.js`），不读 cache（始终联网），检查后写入 `lastCheckDate`，不判断今天是否已检查过
- **每日自动检查（`checkDailyUpdate`）：cache-first**，先读 `cache.json` 的 `lastCheckDate`，今日已查则不调用网络

**命令方式**（注册命令后）：
```
/hzero-front-i18n-update          # 默认强制检查（master）
/hzero-front-i18n-update dev      # 指定其他分支（同样强制）
```

**脚本方式**（skill 目录下）：
```powershell
node scripts/update.js              # 强制检查（命令默认行为，不读 cache，始终联网，写入 lastCheckDate）
node scripts/update.js --daily      # cache-first（每日自动检查用）
node scripts/update.js --skip <ver> # 跳过指定版本
```

**强制检查**（`node scripts/update.js`）返回 `{ current, latest, hasUpdate }`，`hasUpdate` 为 true 时进入更新流程。**cache-first 检查**（`--daily`）返回 `action`：`skip-already-checked`（今日已查）/ `up-to-date`（最新）/ `skip-skipped-version`（已跳过该版本）/ `update-available`（有新版）/ `check-failed`（失败，仅提示，不阻塞）。`hasUpdate` / `update-available` 时向用户确认后执行 `git pull` 与 `npm install`，再运行 `.\setup.ps1` 重新注册命令，读 `CHANGELOG.md` 新版本条目的「⚠️ 更新须知」按提示执行额外步骤，最后重启 AI 工具使新 SKILL.md / 命令生效。

脚本从 `package.json` 的 `repository.url` 推导远程地址（已配置为 honshena/hzero-front-i18n）。若 404，尝试其他分支名或检查仓库地址。

**代理配置**：访问 GitHub raw 需要代理时，在 `.env.json` 的 `update.httpProxy`/`update.httpsProxy` 填入代理地址（用户手动配置，推荐），AI 执行更新检查时**优先使用**该配置（设为 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量，axios 自动读取）；未配置则沿用系统已有的 `HTTPS_PROXY` 环境变量。

### 每日自动检查

每天首次使用 skill 时自动触发一次 cache-first 检查（`checkDailyUpdate` / `node scripts/update.js --daily`），当天不再重复，**检查失败也仅提示一次、当天不再重试**。`cache.json` 为本地文件（已加入 `.gitignore`，不提交）。

## 目录结构

```
hzero-front-i18n/
├── SKILL.md                 # 精简主文档（共享上下文 + 命令/能力索引 + 全局红线 + Task & Approval）
├── CHANGELOG.md             # 变更记录 + ⚠️ 更新须知（更新时必读）
├── README.md                # 本文档
├── AGENTS.md                # AI 协作上下文（面向修改/维护本 skill 的 AI）
├── commands/                # 3 个 slash 命令（每命令一文件夹：command.md + workflow.md）
│   ├── check/   update/   release/
├── config/                  # 环境配置流程（workflow.md，非命令）
├── capabilities/            # 7 个核心能力（query/add/modify/delete/translate/export/import，非命令）
├── scripts/                 # Node 脚本（api / csv / excel / utils / update / test 运行器）
├── test/                    # 单元测试（*.test.js）
├── doc/                     # 规范文档（api/h0/intl + 特殊项目 doc/{project}/）
├── logs/                    # 任务日志（每次破坏性操作一个子目录）
├── .env.json                # 环境配置（项目 / token / 租户）
├── cache.json               # 本地更新检查缓存（每日一次，不提交）
├── .gitignore               # 忽略
└── package.json             # 版本号（更新检查依据）
```
