# Capability: 查询多语言

AI 在用户自然语言请求查询时加载。非 slash 命令。

## 查询接口选择

| 场景 | 用哪个 | 说明 |
|------|--------|------|
| 确认某 promptCode 是否已注册 / 分页浏览 | `getPromptList` | ⚠️ 模糊查询，`promptKey=1` 命中 `1`/`10`/`11`；`size=0` 拉全量 |
| 精确取单条记录（update/delete 前取 id/token） | `getPromptExact` | `size=0` 拉全量后按 promptKey+promptCode 精确过滤，未找到/多条抛错 |
| 检查翻译缺失 / 英文大小写（按语言批量） | `getPromptByLang` | 公开接口无需 token；返回 `{ "promptKey.promptCode": "翻译值" }` 扁平对象 |
| 查单条完整语言集 | `getPromptDetail` | 返回 `promptConfigs` 含所有语言 |

## 调用示例

```javascript
const api = require('../scripts/api');
const OPT = { project: 'hskp-console', environment: 'dev' };

// 分页/全量列表
const list = await api.getPromptList({ promptKey: 'hskp.common', size: 0, ...OPT });

// 精确取单条（update/delete 用）
const rec = await api.getPromptExact({ promptKey: 'hskp.test', promptCode: 'hello', ...OPT });

// 按语言批量（无需 token，可逗号拼多个 promptKey）
const zhCN = await api.getPromptByLang({ promptKey: 'hskp.test', lang: 'zh_CN', ...OPT });
const enUS = await api.getPromptByLang({ promptKey: ['hskp.test','hskp.common'], lang: 'en_US', ...OPT });

// 单条详情
const detail = await api.getPromptDetail({ promptKey: 'hskp.test', promptCode: 'hello', lang: 'zh_CN', ...OPT });
```

## 红线
- ⚠️ **禁止**用 `getPromptList(...).content[0]` 为 update/delete 取记录（模糊查询可能命中错误记录）
- ⚠️ **禁止**用 `getPromptList` 返回结果判断翻译是否缺失（列表只返回当前语言一行）
- 查询为只读，无需 Task & Approval 流程；结果直接展示给用户

详见 `doc/api.md`。
