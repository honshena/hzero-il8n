# Capability: 删除多语言

AI 在用户**明确要求删除**时加载。非 slash 命令。**破坏性操作，走 SKILL.md 的 Task & Approval 流程，且必须逐条审批。**

## 删除必须满足全部条件

- 用户明确要求删除（必须包含「删除」或「delete」关键字）
- **逐条审批，每条删除单独询问用户确认**（禁止批量删除）
- 必须向用户展示被删除条目的完整信息（promptKey, promptCode, zh_CN, en_US 等）
- 用户确认后才能调用 `deletePrompt`
- **如果用户只是提到「删除」但没有明确要求执行删除操作（如讨论删除逻辑），不得调用删除接口**

## 删除流程

- **Step 1: 用 `getPromptExact` 取完整行记录**（promptId/objectVersionNumber/_token 等）-- ⚠️ 禁止 `getPromptList().content[0]`
- **Step 2: 展示完整信息给用户，逐条询问确认**（每条单独 question）
- **Step 3: 用户确认后调用 `deletePrompt`**
- **Step 4: 查询验证删除生效**

## deletePrompt 参数

```javascript
const api = require('../scripts/api');
const rec = await api.getPromptExact({ promptKey: 'hskp.test', promptCode: 'hello', project: 'hskp-console', environment: 'dev' });
await api.deletePrompt({
  promptId: rec.promptId,
  objectVersionNumber: rec.objectVersionNumber,
  _token: rec._token,
  promptKey: rec.promptKey,
  promptCode: rec.promptCode,
  lang: rec.lang,
  description: rec.description,
  tenantId: rec.tenantId,
  langDescription: rec.langDescription,
}, 'hskp-console', 'dev');
```

## 红线
- ⚠️ **禁止** `getPromptList(...).content[0]` 取记录
- **禁止批量删除**，必须一条一条审批
- 未经用户明确要求不得调用 `deletePrompt`

详见 `doc/api.md` 的 getPromptExact / deletePrompt 条目。
