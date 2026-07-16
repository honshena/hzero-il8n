# AGENTS - hzero-front-i18n

> AI 协作上下文。本文件面向修改/维护本 skill 的 AI 助手。使用说明见 `SKILL.md` / `README.md`。

## 项目定位

h0 平台多语言管理 skill。`scripts/` 下的 Node 脚本（CommonJS）操作 h0 平台多语言：查询/增删改/翻译/检查/导入导出/版本更新检查。

## 关键命令

```bash
node scripts/test.js   # 运行单元测试（修改脚本后必跑）
.\setup.ps1            # 注册 /hzero-front-i18n-* 命令到 opencode / Claude Code
```

## 强制规则

- **每次修改 `scripts/` 下的脚本，都必须先运行单元测试**：`node scripts/test.js`。测试失败必须修复后再继续，不得跳过。
- 新增/修改脚本行为时，同步在 `test/*.test.js` 增加/更新对应测试（TDD：先写失败测试，再改实现）。
- **禁止 `nvm use` 切换用户的默认 Node 版本。**

## Node 版本

- 测试用 `node:test` + `node:assert`，需要 **Node >= 18**。
- 用户默认 Node 可能 < 18（如 v16.16.0）。`scripts/test.js` 会自动从 nvm 安装目录（`NVM_HOME` 下 `v<版本>\node.exe`）查找一个 >= 18 的 Node 来跑测试，**不切换默认 Node**（输出会注明所用 Node 与默认 Node）。
- 找不到 >= 18 时，提示用户 `nvm install 18`（安装即可，无需 `nvm use`）。

## 测试约定

- 测试文件在 `test/*.test.js`，无第三方依赖（仅 `node:test` / `node:assert`）。
- 优先测纯函数；涉及文件/状态（`cache.json` / `.env.json`）的测试用 `before` / `after` 备份并还原。
- 涉及网络的函数（`api.js` 的 request/getPromptList、`update.js` 的 checkUpdate）不做单元测试。

## 编码规范

- CommonJS（`require` / `module.exports`），不引入新依赖（除非必要且经确认）。
- 不加无关注释，遵循既有脚本风格。
- `cache.json` 为本地状态（已 `.gitignore`）；`.env.json` 含 token 密钥，**禁止提交到仓库**。
- **`.env.json` 由用户手动维护，skill 代码只读不写**（不得用脚本/测试向其写入代理等任何字段；测试涉及 `.env.json` 时用 `before`/`after` 备份并还原，不得残留改动）。
- **`cache.json` 与 `.env.json` 同样不可由 AI 额外修改**：仅由 `update.js` 的更新检查逻辑（`checkDailyUpdate` / `skipVersion`）读写，AI 不得绕过这些函数直接操作；测试涉及 `cache.json` 时用 `before`/`after` 备份并还原，不得残留改动。
- **版本更新检查的代理通过 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量配置**（`update.js` 用 axios，axios 自动读取这两个环境变量，无需在代码或 `.env.json` 中额外配置）。需代理时由用户设置环境变量（如 `set HTTPS_PROXY=http://127.0.0.1:7890`），不要改 `update.js`。
