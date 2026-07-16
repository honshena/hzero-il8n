# Capability: 导出多语言到 Excel/CSV

AI 在用户请求导出多语言数据时加载。非 slash 命令。**只读操作，无需 Task & Approval 流程。**

让用户自由导出多语言数据到 Excel/CSV，便于备份、批量编辑、交付。

## 流程

- **Step 1: 询问导出范围与格式**（用 question 工具规范化展示）
  - 范围：指定 promptKey（必填）
  - 格式：Excel（`.xlsx`）/ CSV（`.csv`）
- **Step 2: 用 `getPromptList({ promptKey, size: 0 })` 拉全量**
- **Step 3: 生成文件**到 task 目录或用户指定路径
- **Step 4: 告知用户文件路径**

## 文件生成

```javascript
const { generateExcel } = require('../scripts/excel');
const { generateCsv } = require('../scripts/csv');
const api = require('../scripts/api');

const list = await api.getPromptList({ promptKey: 'hskp.platform', size: 0, project: 'hskp-console', environment: 'dev' });
const rows = list.content; // [{ promptKey, promptCode, promptConfigs: {zh_CN, en_US, ...}, ... }]
generateExcel(rows, 'output.xlsx');
// 或
generateCsv(rows, 'output.csv');
```

## 红线
- 导出为只读，不修改平台数据，无需审批
- `getPromptList` 模糊查询不影响导出（导出本就是按 promptKey 范围拉全量）

详见 `doc/api.md` 的 getPromptList、`scripts/excel.js` / `scripts/csv.js`。
