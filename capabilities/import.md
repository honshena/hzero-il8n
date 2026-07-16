# Capability: 从 Excel/CSV 导入多语言

AI 在用户请求从文件导入多语言时加载。非 slash 命令。**破坏性操作（会新增/修改平台数据），走 SKILL.md 的 Task & Approval 流程。**

## 流程

- **Step 1: 解析文件** -- 用 `parseExcel` / `parseCsv` 读取
- **Step 2: 分类** -- 每条记录判断是新增（平台不存在）还是修改（平台已存在），用 `getPromptByLang` 或 `getPromptExact` 判断
- **Step 3: 展示 data.json 给用户审批** -- 列出每条：promptKey / promptCode / 操作类型（新增/修改）/ 各语言值
- **Step 4: 用户确认后执行** -- 新增调 `insertPrompt`，修改调 `updatePrompt`（用 `getPromptExact` 取行记录）
- **Step 5: 查询验证**

## 文件解析

```javascript
const { parseExcel } = require('../scripts/excel');
const { parseCsv } = require('../scripts/csv');

const data = parseExcel('path/to/file.xlsx');
// 或
const data = parseCsv('path/to/file.csv');
// data => [{ promptKey, promptCode, promptConfigs: {zh_CN, en_US, ...} }, ...]
```

## 红线
- ⚠️ 修改时禁止 `getPromptList().content[0]`，用 `getPromptExact`
- `updatePrompt` 的 `promptConfigs` 必须含全部语言
- 新增前校验 promptKey 两段格式 + 确认平台不存在
- 导入需逐类审批（可合并展示但用户确认后才执行）

详见 `doc/api.md`、`scripts/excel.js` / `scripts/csv.js`、`capabilities/add.md` / `capabilities/modify.md`。
