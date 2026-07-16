# Capability: 修改多语言

AI 在用户请求修改、或 check 修复翻译缺失/英文大小写时加载。非 slash 命令。**破坏性操作，走 SKILL.md 的 Task & Approval 流程。**

## 修改流程

- **Step 1: 用 `getPromptExact` 取完整行记录**（promptId/objectVersionNumber/_token/lang/langDescription/tenantId）-- ⚠️ 禁止 `getPromptList().content[0]`
- **Step 2: 构造 data.json**，`promptConfigs` 必须包含该 promptCode 的**全部语言**（已有+修改），缺失语言会被补建
- **Step 3: 展示 data.json 给用户审批**（列出 promptKey 与 promptCode）
- **Step 4: 用户确认后调用 `updatePrompt`**
- **Step 5: 用 `getPromptDetail` 验证修改生效**

## updatePrompt 必填字段

`promptId` / `objectVersionNumber` / `_token` / `promptKey` / `promptCode` / `lang` / `langDescription` / `tenantId` / `promptConfigs` -- 全部从 `getPromptExact` 行记录取，缺任一会抛错。

```javascript
const api = require('../scripts/api');
const rec = await api.getPromptExact({ promptKey: 'hskp.test', promptCode: 'hello', project: 'hskp-console', environment: 'dev' });
await api.updatePrompt({
  ...rec,
  promptConfigs: { zh_CN: '你好', en_US: 'Hello' }, // 含所有语言
}, 'hskp-console', 'dev');
```

## 红线
- ⚠️ **禁止** `getPromptList(...).content[0]` 取记录（`page-list` 模糊查询，`promptKey=1` 命中 `1`/`10`/`11`）
- `promptConfigs` 必须含全部语言，否则已存在语言可能被清空
- `lang` 标识当前操作源语言行，缺失时为已有 promptCode 补新语言会触发 `error.db.duplicateKey`
- 修改后必须查询验证生效，**不需要刷新缓存**

详见 `doc/api.md` 的 getPromptExact / updatePrompt 条目。
