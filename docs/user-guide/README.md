# 静心 · 读者使用手册

**静心（jingxin）** 是现代化佛经阅读与理解平台：无需注册即可搜索、阅读、查辞典、使用 AI 辅助理解。本手册按任务组织，帮助你在 30 秒内找到经文并开始阅读。

---

## 功能总表

| 路由 | 功能 | 说明 | 详见 |
|------|------|------|------|
| `/` | 首页门户 | 搜索、热词、统计、六宫格入口 | [01 快速入门](./01-getting-started.md) |
| `/search` | 统一搜索 | 经目 / 段落 / 辞典 / 人物 | [03 搜索与经藏](./03-search-and-canon.md) |
| `/canon` | 经藏浏览 | 按部类浏览已导入经典 | [03 搜索与经藏](./03-search-and-canon.md) |
| `/sutra/[slug]` | 经文阅读 | 沉浸阅读 + 工具栏 + AI 侧栏 | [02 经文阅读](./02-reading.md) |
| `/sutra/[slug]/copybook` | 抄经字帖 | 生成字帖并导出 PNG/PDF | [07 抄经对读分享](./07-copybook-parallel-share.md) |
| `/parallel/[slug]` | 平行对读 | 左右栏对比不同版本 | [07 抄经对读分享](./07-copybook-parallel-share.md) |
| `/dictionary` | 佛学辞典 | 多源辞典检索 | [04 佛学辞典](./04-dictionary.md) |
| `/chat` | AI 对话 | 基于经文的智能问答 | [05 AI 对话](./05-ai-chat.md) |
| `/kg` | 知识图谱 | 人物、经典与关系可视化 | [06 图谱与地理](./06-kg-and-places.md) |
| `/person/[id]` | 人物详情 | 译者与佛教人物条目 | [06 图谱与地理](./06-kg-and-places.md) |
| `/places` | 佛教地理 | 圣地与寺院地图 | [06 图谱与地理](./06-kg-and-places.md) |
| `/bookmarks` | 我的收藏 | 阅读中收藏的经目 | [08 收藏专题经句](./08-bookmarks-topics-verse.md) |
| `/login` | 微信登录 | PC 扫码 / 微信内授权（可选） | [09 账号与登录](./09-account-login.md) |
| `/account` | 个人中心 | 昵称、绑定状态、登出 | [09 账号与登录](./09-account-login.md) |
| `/topic/[slug]` | 专题阅读 | 主题导读与推荐经目 | [08 收藏专题经句](./08-bookmarks-topics-verse.md) |
| `/verse/today` | 今日经句 | 每日一句，可分享 | [08 收藏专题经句](./08-bookmarks-topics-verse.md) |
| `/calendar` | 佛历 | 农历、节日、六斋十斋 | [10 佛历](./10-buddhist-calendar.md) |
| `/share/[id]` | 分享页 | 经文片段分享卡片 | [07 抄经对读分享](./07-copybook-parallel-share.md) |
| `/about` | 关于 | 平台说明、版权与免责 | [08 收藏专题经句](./08-bookmarks-topics-verse.md) |

---

## 推荐阅读顺序

1. **[快速入门](./01-getting-started.md)** — 认识导航与首页
2. **[经文阅读](./02-reading.md)** — 核心体验（工具栏、划选、AI）
3. **[搜索与经藏](./03-search-and-canon.md)** — 如何找到一部经
4. **[佛学辞典](./04-dictionary.md)** — 查词释义
5. **[AI 对话](./05-ai-chat.md)** — 深入问答
6. 按需阅读：图谱、抄经、收藏等章节

---

## 桌面与移动差异

| 功能 | 桌面（宽屏） | 移动 / 窄屏 |
|------|--------------|-------------|
| 搜索筛选 | 左侧 facet 侧栏 | 仅 Tab 切换，无侧栏 |
| 阅读器目录 / AI | 左右侧栏常驻（xl） | 工具栏图标打开抽屉 |
| AI 对话历史 | 左侧固定栏 | 全屏抽屉 + 浮动按钮 |
| 顶栏导航 | 横向 icon + 文字 | 汉堡菜单抽屉 |

---

## 自托管站点管理员

若你部署或维护静心实例，请参阅 **[管理员手册](../admin-guide/README.md)**（语料导入、辞典/图谱数据、部署运维）。
