# 开放平台（hsop-front-app-openplatform）多语言说明

> 特殊项目多语言文档。本文件描述开放平台应用端子应用的多语言机制，与通用 h0 前端规范（见 `doc/h0.md`、`doc/intl.md`）有所不同。操作本项目时**以本文件为准**。

## 项目定位

- 开放平台应用端**微前端子应用**（基于 qiankun），技术栈 umi 3.5 + dva + antd 3.26 + React 16.8
- **前端不基于 h0**，但**后端基于 h0**，多语言文案存储在 h0 平台多语言（hpfm 服务）
- 底层使用 `react-intl-universal`，上层封装出与 h0 一致的 `intl.get(key).d(default)` API

## intl 模块位置

多语言工具封装在子模块 kingnew 中：

```
src/kingnew/src/utils/intl/
├── index.js                # 统一出口：intl / formatterCollections / useGetLang / isEnglish / getCurrentLang
├── intl.js                 # re-export react-intl-universal 的 intl + IntlCache / IntlPromiseCache
├── formatterCollections.js # HOC：按 promptKey 从 h0 平台加载多语言
├── service.js              # 调用 hpfm 平台多语言接口
└── hooks.js                # useGetLang：读取当前语言
```

代码中通过 `@bit/open.open.utils/intl` 引用，经 `config/config.js` 的 `babel-plugin-import-rename`（`extraBabelPlugins`）重映射到 `@/kingnew/src/utils/intl`。

## 引用方式

```javascript
// 页面/组件中（统一写法）
import { intl } from '@bit/open.open.utils/intl';
// 需要语言信息时
import { intl, useGetLang, isEnglish, getCurrentLang } from '@bit/open.open.utils/intl';
```

## 加载机制（formatterCollections）

`formatterCollections` 是高阶组件，接收 `{ code, loadingComponent }`：
- `code`：promptKey 或 promptKey 数组（如 `'hsop.openplatform'`、`['hsop.openplatform', 'hsop.common']`）
- 加载中显示 `loadingComponent`，未传则返回 `null`

它通过 `queryPromptLocale` 调用 h0 平台接口拉取对应 promptKey 的多语言，再 `intl.load()` 注入：

```
GET /hpfm/v1/{organizationId}/prompt/{language}?promptKey={promptKey}   # 已登录
GET /hpfm/v1/prompt/{language}?promptKey={promptKey}                    # 未登录
```

### 关键行为
- 缓存键 `${language}::${promptKey}::${tenantId}`，存于 `window.intlCache`，已加载的 promptKey 不重复请求
- **`hsop.common` 每次都会重新拉取**（特殊处理，保证通用文案最新）
- `window._intlPromiseCache` 对并发请求去重
- 语言取自 `sessionStorage.getItem('language')`，默认 `zh_CN`

## 布局层加载（关键）

**多语言在全局布局 `src/layouts/index.js` 中一次性加载，普通页面无需再使用 `formatterCollections`：**

```javascript
// src/layouts/index.js
import { formatterCollections } from '@bit/open.open.utils/intl';

const IntlComponent = formatterCollections({
  code: ['hsop.openplatform', 'hsop.common'],
})(({ component }) => component);
```

布局用 `IntlComponent` 包裹页面 children，`hsop.openplatform` 与 `hsop.common` 两个 promptKey 对所有页面全局可用。布局同时依据 `sessionStorage.language` 设置 antd `ConfigProvider` 的 locale（zh_CN / en_US / ja_JP）。

## 页面使用

普通页面**不需要** `formatterCollections`，直接用 `intl.get().d()`：

```javascript
import { intl } from '@bit/open.open.utils/intl';

// 基本使用
intl.get('hsop.openplatform.dashboard.pick.title').d('精选模块')
intl.get('hsop.common.operate').d('操作')

// 带变量（变量对象作为 get() 第二参，.d() 用模板字符串兜底）
intl.get('hsop.common.total.of.total.items', { total }).d(`共 ${total} 条`)
```

- `get()` 内为 `{promptKey}.{promptCode}`，与 h0 规范一致
- `.d()` 为默认值（fallback），key 未加载时显示它，可中文可英文
- promptKey 限定为布局已加载的 `hsop.openplatform` 与 `hsop.common`

### 何时页面需要再加 formatterCollections

仅当页面使用了**布局未加载的额外 promptKey** 时，才在页面级追加 `formatterCollections({ code: ['xxx'] })`。绝大多数页面只用 `hsop.openplatform` / `hsop.common`，无需追加。

## 语言切换

- 当前语言存于 `sessionStorage.language`（`zh_CN` / `en_US` / `ja_JP`）
- 读取：`useGetLang()` 或 `getCurrentLang()`
- antd 组件语言随 `ConfigProvider` 自动切换
- 切换语言：写入 `sessionStorage.language` 后刷新，`formatterCollections` 按新语言重新加载

## 与标准 h0 前端的差异

| 项 | 标准 h0 前端（doc/intl.md） | 开放平台 |
|----|--------------------------|---------|
| intl 来源 | hzero 自带 `utils/intl` | kingnew 封装 `@bit/open.open.utils/intl`（基于 react-intl-universal） |
| 引用 | `import intl from 'utils/intl'` | `import { intl } from '@bit/open.open.utils/intl'` |
| 加载接口 | hzero 平台多语言 | hpfm 平台多语言（`/hpfm/v1/.../prompt/...`） |
| 路由页加载 | 每个路由页用 `formatterCollections` + Loading | **仅布局层加载一次**，页面无需 |
| 自动加载 key | `hzero.common` | 布局加载 `hsop.openplatform` + `hsop.common` |
| Loading 组件 | 必须 | 可选（`loadingComponent`，默认 null） |

## 新增 / 修改多语言条目

使用 hzero-front-i18n skill 时：
- promptKey 为 `hsop.openplatform`（业务文案）或 `hsop.common`（通用文案）
- promptCode 遵循 camelCase、1-5 段规则（见 `doc/intl.md`）
- 新增/修改后：`hsop.common` 会自动重拉；`hsop.openplatform` 需刷新页面触发重新加载（受 `intlCache` 缓存影响）
- 同步修改代码中的 `intl.get('...').d('...')` 调用

## 本地 locales 文件（说明）

`src/locales/en-US.js`、`src/locales/zh-CN.js` 是 react-intl-universal 的静态 locales，但当前 intl 工具初始化时 `locales: {}` 为空，**实际文案以 h0 平台多语言为准**。这两个文件近乎为空（仅 `'index.start'`），属遗留/兜底。新增文案**不应**写入此处，应录入 h0 平台。

> 注：项目 `AGENTS.md` 中「新增文案同步 `src/locales/en-US.js` 与 `zh-CN.js`」的说法已过时，以本文件为准。

## 相关文件索引

- `src/layouts/index.js`：布局层 `formatterCollections` 加载
- `src/kingnew/src/utils/intl/`：intl 工具实现（`index.js` / `intl.js` / `formatterCollections.js` / `service.js` / `hooks.js`）
- `config/config.js`：`@bit/open.open.utils` -> `@/kingnew/src/utils` 别名重映射（`extraBabelPlugins`）
- `src/locales/`：本地静态 locales（遗留）
