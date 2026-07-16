# Capability: AI 翻译未翻译条目

AI 在用户请求翻译、或 check 修复翻译缺失 / 新增 key 需要英文时加载。非 slash 命令。

## 翻译流程

- **Step 1: 用 `getPromptByLang` 找出缺失翻译的 key**
  - 查 `zh_CN` 和目标语言（如 `en_US`），对比 key 集合：在 zh_CN 中但不在目标语言中 -> 缺失
  - `getPromptByLang` 公开接口，无需 token
- **Step 2: AI 翻译** -- 根据中文（或已有语言）翻译为目标语言，保持占位符 `{user}` 等不变
- **Step 3: 展示 data.json 给用户审批**（列出 promptKey / promptCode / 原文 / 译文）
- **Step 4: 用户确认后用 `updatePrompt` 写入** -- `promptConfigs` 必须含全部语言（已有+新译），从 `getPromptExact` 取行记录
- **Step 5: 用 `getPromptDetail` 验证**

## 翻译规范

- 占位符 `{user}` 等保持原样不变
- 英文遵循大小写规范：标题类 Title Case、描述类 Sentence Case（见 `commands/check/workflow.md`「英文大小写规范」）
- 专有名词 / 缩写（API/URL/ID）/ 品牌名保持原大写

## 调用示例

```javascript
const api = require('../scripts/api');
const OPT = { project: 'hskp-console', environment: 'dev' };
const zhCN = await api.getPromptByLang({ promptKey: 'hskp.test', lang: 'zh_CN', ...OPT });
const enUS = await api.getPromptByLang({ promptKey: 'hskp.test', lang: 'en_US', ...OPT });
// zhCN 有但 enUS 没有的 key -> 需翻译
```

写入翻译用 `updatePrompt`（见 `capabilities/modify.md`）。

详见 `doc/api.md` 的 getPromptByLang / updatePrompt 条目。
