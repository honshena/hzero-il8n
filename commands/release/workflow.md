# Release 工作流 - 发布新版本

发布流程：查看 git 变更 -> 更新 CHANGELOG -> 用户审批 -> 提交 -> push。

## 流程

### Step 1: 收集变更
- `git status` + `git log` 查看自上次发布以来的变更
- 汇总变更点（功能新增/修复/重构/文档等）

### Step 2: 确定版本号
- 若用户指定版本号，用用户的
- 否则按 semver 提议：
  - 有破坏性变更 / 大重构 -> 主版本（major）
  - 新功能 / 新命令 -> 次版本（minor）
  - 修复 / 小调整 -> 修订（patch）
- 用 `question` 工具向用户确认版本号（首项为 AI 提议值，支持自定义输入）

### Step 3: 更新 CHANGELOG.md
- 在文件顶部「⚠️ 更新须知」段之后、上一版本条目之前，新增条目：
  ```
  ## [x.y.z] - YYYY-MM-DD

  - 变更点1
  - 变更点2

  ### ⚠️ 更新须知（可选，有需要用户额外操作时才写）
  - 重新安装依赖：npm install
  - 重新注册命令：.\setup.ps1
  ```
- 若本次变更需要用户做额外迁移操作（重装依赖、重新注册命令、清缓存、改配置），写「⚠️ 更新须知」；标准更新流程（npm install + setup + 重启）始终执行，不重复写

### Step 4: 更新 package.json 版本号
- `version` 字段改为新版本号

### Step 5: 用户审批
- 用 `question` 工具展示本次发布摘要（版本号 + 变更列表 + CHANGELOG 新增条目），让用户选择：确认发布 / 修改 / 取消
- 用户要求修改时，由 AI 调整后再次审批

### Step 6: 提交并 push
- `git add` 相关文件（CHANGELOG.md、package.json、commands/、SKILL.md 等）
- 提交格式：`[RELEASE]{版本}-{简要描述}`，如 `[RELEASE]1.2.0-新增单元测试与axios`
- `git push`
- 提示用户：发布后若已安装本 skill，需在其他环境运行 `/hzero-front-i18n-update` 或 `git pull` + `.\setup.ps1` 更新

## 注意
- 不修改 `.env.json` / `cache.json`（含密钥/本地状态，不提交）
- 提交前检查 `git status` 确认无意外文件（特别是 `.env.json`）
- 遵循仓库既有提交信息风格
