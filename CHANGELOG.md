# Changelog

记录 hzero-front-i18n skill 版本变更。

> **更新须知机制**：更新 skill 后（`git pull`），AI 必须读本文件，找到从用户旧版本到新版本之间的所有版本条目，按各条「⚠️ 更新须知」执行特殊操作（如重新安装依赖、重新注册命令、清理缓存、重新配置等），并向用户说明。标准更新流程（`npm install` + `.\setup.ps1` 重新注册命令 + 重启）始终执行；「⚠️ 更新须知」用于额外的版本迁移步骤。

格式：版本号 + 日期 + 变更列表 + 「⚠️ 更新须知」（可选）。


### ⚠️ 更新须知

- **重新注册命令**：`.\setup.ps1`（命令结构改为文件夹形式，旧 `commands/hzero-front-i18n-*.md` 已删除，必须重新注册）
- **删除旧命令文件**：旧版注册到 `~/.config/opencode/commands/` 的 7 个已移除命令文件（query/add/modify/delete/translate/export/import）需手动删除，避免残留失效命令
- `defaultLanguage` 改为用户选择（不再自动探测），已有配置无需改动
- 核心 API 能力（query/add/modify/delete/translate/export/import）完整保留，只是不再作为 slash 命令，改用自然语言触发
- 无新增依赖

## [1.2.0] - 2026-07-16

- **重构项目结构**：SKILL.md 从 32KB 瘦身到 ~4KB，只保留共享上下文与索引
- **命令精简为 3 个 slash 命令**：check / update / release，每命令独立文件夹（`commands/{name}/command.md` + `workflow.md`）
- **核心能力完整保留为 capabilities/**：query / add / modify / delete / translate / export / import，AI 按需加载，自然语言触发
- **新增 config/workflow.md**：环境配置流程独立，defaultLanguage 由用户选择（zh_CN / en_US / 自定义）
- **check 流程优化**：6 阶段（范围确认 / 本地扫描 / 平台批量查询并行 / 分类 / 先摘要后明细报告 / 修复审批执行），平台查询从 2N 次降到 2 次，只读阶段不建 task 目录
- **新增全局规则**：选项规范化（question 工具统一格式）+ getPromptExact 模糊查询红线
- **setup.ps1/setup.bat 改造**：遍历 `commands/*/command.md` 注册，只注册 3 命令
- `scripts/api.js` 新增 `getPromptExact`（精确查询单条，解决 page-list 模糊查询导致 update/delete 取错记录的问题）
- csv.js / excel.js 保留（导出/导入能力继续可用）


### ⚠️ 更新须知

- **重新安装依赖**：`npm install`（新增 `axios`）
- **重新注册命令**：`.\setup.ps1`（命令文件有新增/修改）
- `.env.json` 新增可选字段 `defaultLanguage`：旧配置无需手动改，下次配置项目时 AI 自动补
- `cache.json` 为新增本地文件，自动生成，无需手动处理

## [1.1.2] - 2026-07-13

- 基线版本：查询/新增/修改/删除/翻译/检查/导入导出
- 版本更新检查（`/hzero-front-i18n-update`）、`cache.json` 每日检查、`setup` 注册命令
- 开放平台多语言说明 `doc/openplatform/`
