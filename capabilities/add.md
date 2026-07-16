# Capability: 新增多语言

AI 在用户请求新增 key、或 check 修复硬编码/未注册 key 时加载。非 slash 命令。**破坏性操作，走 SKILL.md 的 Task & Approval 流程。**

## 新增流程（严格按顺序）

- **Step 0: 校验 promptKey 格式** -- 必须为两段 `{xxx}.{xxx}`（如 `hsop.common`、`hskp.platform`），不符合拒绝并提示用户
- **Step 1: 查询平台确认 key 不存在** -- 用 `getPromptExact` 或 `getPromptByLang` 确认；已存在则停止，改为提示用户或走 modify
- **Step 2: 修改代码文件** -- 代码中用 `intl.get('promptKey.promptCode').d('默认值')`，默认值语言为项目 `defaultLanguage`
- **Step 3: 展示 data.json 给用户审批** -- 列出 promptKey 与 promptCode、promptConfigs 各语言值
- **Step 4: 用户确认后，调用 `insertPrompt`** 新增到平台
- **Step 5: 调用查询接口验证新增是否生效**（`getPromptDetail` 或 `getPromptByLang`）

> ⚠️ **禁止先新增平台再修改代码，必须先确认平台无此 key 再改代码再新增平台。**

## insertPrompt

```javascript
const api = require('../scripts/api');
await api.insertPrompt({
  promptKey: 'hskp.common',
  promptCode: 'create',
  promptConfigs: { zh_CN: '新建', en_US: 'Create' },
  description: '新建',
}, 'hskp-console', 'dev');
```

## promptCode 生成
```javascript
const { generatePromptCode } = require('../scripts/utils');
generatePromptCode('DataManage', 'button', 'create'); // => "dataManage.button.create"
```
规则：1-5 段，camelCase。

## promptConfigs 要求
- `zh_CN` 和 `en_US` 必填；其他语言可选
- 至少提供 `zh_CN`，`en_US` 可由 AI 翻译生成（见 `capabilities/translate.md`）
- 占位符变量：`{ "zh_CN": "你好 {user}" }`，占位符名要和 `.get()` 第二参数 key 一致

详见 `doc/api.md`、`doc/intl.md`。
