---
name: hzero-front-i18n
description: Use when working with hzero platform i18n - checking code issues, querying/adding/modifying/deleting/translating entries, exporting/importing Excel/CSV
---

# hzero-front-i18n

h0 平台多语言管理 skill。**所有回复默认中文。**

## 命令（slash 命令，3 个）

| 命令 | 说明 | 详情 |
|------|------|------|
| `/hzero-front-i18n-check` | 检查代码多语言问题 | `commands/check/workflow.md` |
| `/hzero-front-i18n-update` | 检查 skill 版本更新 | `commands/update/workflow.md` |
| `/hzero-front-i18n-release` | 发布新版本 | `commands/release/workflow.md` |

## 能力（AI 按需加载，非 slash 命令，核心功能完整保留）

| 能力 | 触发 | 详情 |
|------|------|------|
| 查询 | 用户查询 / 检查内部 | `capabilities/query.md` |
| 新增 | 用户新增 / 检查修复硬编码、未注册 key | `capabilities/add.md` |
| 修改 | 用户修改 / 检查修复翻译缺失、大小写 | `capabilities/modify.md` |
| 删除 | 用户明确要求删除（逐条审批） | `capabilities/delete.md` |
| 翻译 | 用户翻译 / 检查修复 / 新增补英文 | `capabilities/translate.md` |
| 导出 | 用户导出 Excel/CSV | `capabilities/export.md` |
| 导入 | 用户从 Excel/CSV 导入 | `capabilities/import.md` |

## 选项规范（全局）

**所有需要用户选择的地方，必须用 `question` 工具规范化展示：**
- 首项为推荐默认（标注「推荐」）
- 选项标签简洁清晰（1-5 词）
- 每项有 description 说明
- 始终支持自定义输入（用户可 type answer）
- 多选用 `multiple: true`

## 全局红线

- ⚠️ **`page-list` 是模糊查询**（`promptKey=1` 命中 `1`/`10`/`11`）。**禁止**用 `getPromptList(...).content[0]` 为 update/delete 取目标记录，必须用 `getPromptExact`（精确过滤，未找到/多条抛错）。
- ⚠️ **禁止**用 `getPromptList` 返回结果判断翻译是否缺失（列表只返回当前语言一行）。翻译缺失检查必须用 `getPromptByLang`。
- `getPromptByLang` 为公开接口，无需 token；其他接口都需要 token（0 租户平台层权限）。

## 环境配置

首次使用 / `.env.json` 的 `projects` 为空 / 用户要求配置 / token 失效时，按 `config/workflow.md` 引导配置 `.env.json`（项目、环境、host、token、tenantId、**defaultLanguage 用户选择 zh_CN/en_US/自定义**）。**多项目共存，不设固定 `currentProject`/`currentEnvironment`**：每次操作时 AI 按当前文件路径用 `api.getProjectByFilePath(filePath)` 确认关联项目（`fileProjectMap` 按路径最长匹配），无文件上下文则询问用户后记录到 `fileProjectMap`，再显式传 `project`/`environment` 给 API 函数。操作文件前必须先确认关联项目，防止项目混淆。

## Token 校验

每次操作前校验 token 有效性（`api.getUserSelf`）。过期（401 / `error.permission.accessTokenExpire`）时停止操作，要求用户提供新 token，更新 `.env.json` 后继续。

## Task & Approval（破坏性操作核心流程）

**query / export 为只读，无需此流程。add / modify / delete / import / check 修复阶段 必须严格按 6 步执行：**

1. 创建 taskId 和目录（`generateTaskId` + `createTaskDir`），在 `{taskId}/task.md` 写任务信息与流程清单（全 `[ ]`）
2. 生成 `data.json`（完整待执行数据，非摘要）
3. 展示 data.json 完整内容给用户审批（列表/表格逐条，**每条必列 promptKey 与 promptCode**，不省略不摘要）
4. 用 `question` 工具让用户选择（确认执行 / 跳过 / 要求 AI 修改）。要求修改时由 AI 改 data.json 后重新审批，用户不直接编辑
5. 执行操作 -- 按 data.json 每条在 task.md Step 5 展开子项，逐条**实际**改代码 + 调 API，每条打勾 `[✓]`，不得只打勾不执行
6. 写 `result.json`，task.md 填执行结果摘要，Step 6 打勾

- taskId 格式：`task-{名称}-{年}-{月}-{日}-{时}-{分}-{秒}`，**禁止冒号 `:`**（Windows 不允许）
- 新增/修改后必须调查询接口验证生效，**不需要刷新缓存**
- 新增 key 流程：先校验 promptKey 两段格式 -> 查平台确认不存在 -> 改代码 -> 审批 -> insertPrompt -> 验证。**禁止先新增平台再改代码**
- 删除必须用户明确要求 + 逐条审批，禁止批量

### Red Flags（必须立即停止）
未建 taskId 就操作 / 未生成 data.json 就执行 / 未展示 data.json 就询问确认 / data.json 被省略或摘要 / 用户未确认就增删改 / 完成后未写 result.json / taskId 用冒号 / 未查 fileProjectMap 就操作文件 / 增改后未验证生效 / 未经明确要求就删除 / 批量删除 / 先新增平台再改代码 / 展示 data.json 未列 promptKey 与 promptCode / 用 `getPromptList` 判断翻译缺失 / 用 `getPromptList().content[0]` 取记录。

## 每日更新检查

每天首次使用 skill 时自动触发一次 cache-first 检查（`checkDailyUpdate` / `node scripts/update.js --daily`），当天不再重复，失败也仅提示一次。详见 `commands/update/workflow.md`。

## API 速查

```javascript
const api = require('./scripts/api');
const OPT = { project: 'hskp-console', environment: 'dev' };
api.getPromptList({ promptKey, size: 0, ...OPT });        // 模糊列表，size=0 全量
api.getPromptExact({ promptKey, promptCode, ...OPT });     // 精确单条（update/delete 取记录首选）
api.getPromptByLang({ promptKey, lang, ...OPT });          // 按语言批量（公开，无需 token）
api.getPromptDetail({ promptKey, promptCode, lang, ...OPT });// 单条完整语言集
api.insertPrompt({ promptKey, promptCode, promptConfigs }, ...);    // 新增
api.updatePrompt({ ...record, promptConfigs }, ...);       // 修改（record 来自 getPromptExact）
api.deletePrompt({ ...record }, ...);                      // 删除（逐条审批）
api.getProjectByFilePath('D:\\path');                      // 按文件路径取关联项目
```

函数签名、参数、返回、错误码详见 `doc/api.md`。

## 特殊项目文档

部分项目前端不基于 h0 但后端基于 h0，多语言机制不同。专属说明在 `doc/{project}/`：`doc/openplatform/README.md`（开放平台）。**操作某项目前（根据 fileProjectMap 确定项目），若 `doc/{project}/` 存在，必须先读其说明并以其为准**，通用 `doc/intl.md` 仅作补充。

## File Reference

- `scripts/api.js` - API 调用封装（接口文档 `doc/api.md`）
- `scripts/utils.js` - 工具函数（`parseIntlGetCalls` / `generatePromptCode` / `generateTaskId` / `createTaskDir` 等）
- `scripts/excel.js` / `scripts/csv.js` - Excel/CSV 生成与解析
- `scripts/update.js` - 版本更新检查
- `scripts/test.js` - 测试运行器
- `doc/api.md` - 接口文档（路径/参数/返回/错误码）
- `doc/h0.md` / `doc/intl.md` - h0 平台与多语言规范
- `doc/openplatform/README.md` - 开放平台多语言说明
- `commands/*/workflow.md` - 各命令详细流程
- `config/workflow.md` - 环境配置流程
- `capabilities/*.md` - 各能力详细流程
