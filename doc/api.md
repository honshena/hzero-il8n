# h0 平台多语言 API 文档

`scripts/api.js` 封装的 hpfm/iam 平台多语言接口。所有接口需 `authorization` token（0 租户平台层权限）。

## 公共说明

- host：取自 `.env.json` 项目环境配置的 `host`
- 请求头：`authorization`（token）、`content-type: application/json`、`Accept-Language: zh-CN,zh;q=0.9`、`h-menu-id: -1`
- 租户：默认 0（0 租户平台层）
- 401：token 过期，抛 `TOKEN_EXPIRED`，需用户提供新 token

---

## 接口列表

### getUserSelf - 校验 token

| 项 | 值 |
|----|---|
| 方法 | `GET` |
| 路径 | `/iam/hzero/v1/users/self` |
| 用途 | 校验 token 有效性（返回当前用户信息） |
| 参数 | 无 |
| 返回 | `{ id, loginName, realName, email, ... }` |

### getPromptList - 分页查询多语言列表

| 项 | 值 |
|----|---|
| 方法 | `GET` |
| 路径 | `/hpfm/v1/prompts/page-list` |
| 用途 | 分页查询多语言条目；`size=0` 查全部 |
| 参数 | `page`(默认0), `size`(默认10，0=全部), `tenantId`, `promptKey`, `promptCode`, `description`, `keyword` |
| 返回 | `{ content: [...], totalElements, totalPages, number, size }` |

`content` 元素结构：
```json
{
  "promptId": 123,
  "promptKey": "hsop.common",
  "promptCode": "name",
  "description": "名称",
  "objectVersionNumber": 1,
  "_token": "xxx",
  "promptConfigs": { "zh_CN": "名称", "en_US": "Name", ... }
}
```

### getPromptDetail - 查询单条详情

| 项 | 值 |
|----|---|
| 方法 | `GET` |
| 路径 | `/hpfm/v1/prompts/detail` |
| 用途 | 按 promptKey + promptCode + lang 查询单条多语言详情 |
| 参数 | `promptKey`(必填), `promptCode`(必填), `lang`(默认 zh_CN), `tenantId` |
| 返回 | 单条多语言对象 |

### insertPrompt - 新增多语言

| 项 | 值 |
|----|---|
| 方法 | `POST` |
| 路径 | `/hpfm/v1/prompts/insert` |
| 用途 | 新增多语言条目到平台 |
| body | `{ promptKey, promptCode, promptConfigs: { zh_CN, en_US, ... }, description }` |
| 返回 | 新增后的多语言对象（含 promptId） |

### updatePrompt - 修改多语言

| 项 | 值 |
|----|---|
| 方法 | `PUT` |
| 路径 | `/hpfm/v1/prompts/update` |
| 用途 | 修改已有多语言条目 |
| body | `{ promptId, objectVersionNumber, _token, promptConfigs: { zh_CN, en_US, ... }, description }` |
| 返回 | 修改后的多语言对象 |
| 注意 | `promptId`/`objectVersionNumber`/`_token` 必须从 getPromptList 查询结果获取 |

### deletePrompt - 删除多语言

| 项 | 值 |
|----|---|
| 方法 | `DELETE` |
| 路径 | `/hpfm/v1/prompts/remove` |
| 用途 | 删除多语言条目（逐条审批） |
| body | `{ promptId, objectVersionNumber, _token, promptKey, promptCode, lang, description, tenantId, langDescription }` |
| 返回 | 204（`{ success: true }`） |
| 注意 | 必须用户明确要求删除才执行，禁止批量删除 |

### refreshCache - 刷新缓存

| 项 | 值 |
|----|---|
| 方法 | `POST` |
| 路径 | `/hpfm/v1/prompts/refresh/cache` |
| 用途 | 刷新多语言缓存 |
| body | 数组，如 `[ { promptKey, promptCode } ]` |
| 返回 | 操作结果 |

### exportPrompts - 导出多语言

| 项 | 值 |
|----|---|
| 方法 | `GET` |
| 路径 | `/hpfm/v1/prompts/prompt-export` |
| 用途 | 从平台导出某 promptKey 下的多语言 |
| 参数 | `tenantId`, `promptKey` |
| 返回 | 多语言数据 |

---

## 错误码说明

接口可能返回平台错误码（响应体 `code` 或 `message` 字段，`error.*` 开头），`api.js` 会提取为 `API_ERROR[错误码]: 原始响应` 抛出。响应体 `failed: true` 也表示错误。以下为已确认的错误码，后续遇到新错误码时补录：

| 错误码 | 含义 | AI 处理 |
|--------|------|---------|
| `error.db.duplicateKey` | 数据已存在，重复插入 | 已有同 promptKey+promptCode 数据，停止插入，改为查询已存在条目或提示用户 |
| `error.permission.accessTokenExpire` | token 过期 | 停止操作，要求用户提供新 token |
| HTTP 401 | token 过期 | 同上 |

### 处理规则

1. 收到错误码时，先判断类型，按上表处理
2. `error.db.duplicateKey`：**不要重复插入**，查询已存在条目展示给用户，提示已存在
3. `error.permission.accessTokenExpire` / HTTP 401：停止操作，要求用户提供新 token
4. 响应体 `failed: true`：视为错误，按 `code`/`message` 处理
5. 未确认的错误码：将完整错误信息展示给用户，不自动重试；确认含义后补录到本表
