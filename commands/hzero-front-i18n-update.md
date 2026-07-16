---
description: Check hzero-front-i18n skill for updates
---

加载 hzero-front-i18n skill，按 SKILL.md「每日更新检查」章节执行强制检查（始终联网、不读 cache、写入 lastCheckDate）。发现新版时 git pull + npm install + setup + 读 CHANGELOG 更新须知。

参数: $ARGUMENTS（可选，分支名，默认 master）

示例: /hzero-front-i18n-update
       /hzero-front-i18n-update dev
