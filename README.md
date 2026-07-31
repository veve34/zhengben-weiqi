# 正本围棋 · 会员系统后端 MVP

给工程师的交接说明。前端画面沿用既有设计，本次补上的是真实可运行的会员注册/登录/内容管理后端。

## 快速开始

```bash
npm install
cp .env.example .env
# 编辑 .env，填入 JWT_SECRET、ADMIN_PASSWORD、ID_ENCRYPTION_KEY
npm start
```

打开 `http://localhost:3000` 即为会员网站，`http://localhost:3000/admin.html` 为围棋知识内容管理后台（用 `.env` 里的 `ADMIN_PASSWORD` 登录）。

## 目录结构

- `server.js` — 入口，挂载路由、提供 `public/` 静态文件
- `db.js` — SQLite 数据库与建表（首次启动自动建立 `data/app.db`）
- `routes/auth.js` — 注册 / 登录 / 登出
- `routes/member.js` — 会员中心资料查询
- `routes/articles.js` — 围棋知识文章（公开查询 + 后台管理）
- `routes/admin.js` — 管理员登录
- `routes/adminMembers.js` — 会员审核（查询/通过/驳回）
- `routes/listings.js` — 二手棋具信息发布（发布/查询/留言/标记售出/下架）
- `routes/adminListings.js` — 二手棋具管理（后台强制下架）
- `services/idCardValidator.js` — 身份证号格式与校验码验证（GB 11643 公开算法，纯本地计算，不依赖任何外部服务）
- `services/idCardCrypto.js` — 身份证号加密存储（Node.js 内建 crypto 模块，AES-256-GCM）
- `middleware/upload.js` — 图片上传处理（multer，存储于本机 `public/uploads/listings/`，不依赖任何云存储服务）
- `public/*.html` — 会员网站前台，多页式结构（见下）
- `public/admin.html` — 内容管理后台
- `public/css/style.css`、`public/js/common.js` — 前台各页共用的样式与脚本（会话检查、导览、弹窗逻辑）

## 前台页面结构

前台是多页式站点，每个功能各自一个 HTML 文件，导览栏直接链接对应页面（不是锚点跳转）：

- `index.html` — 首页（含棋具介绍区块，未单独设页）
- `knowledge.html` — 围棋知识
- `marketplace.html` — 二手棋具交易
- `membership.html` — 会员方案
- `register.html` — 会员注册
- `login.html` — 会员登录
- `member-center.html` — 会员中心
- `contact.html` — 关于我们

各页面的 header/footer 各自维护一份静态标记（没有用模板引擎做共享），若要调整导览项或页脚内容，需要在每个页面文件里同步修改。共用的 CSS 在 `css/style.css`，共用的会话检查/弹窗逻辑在 `js/common.js`，两者改一次即可对所有页面生效。

首页棋具介绍区块的图片目前是占位图（`public/images/equipment/goban.jpg`、`stones.jpg`、`box.jpg`、`clock.jpg`），拿到实际商品照片后直接用相同档名覆盖即可，不需要改 HTML。

## 二手棋具交易

仅提供信息发布与留言联系功能，**不涉及任何金流/支付**，交易由买卖双方自行线下完成，平台不参与、不担保交易过程。会员发布商品需上传1-5张照片（本机存储，未接入任何云存储），填写标题、分类、使用状况、价格、联系方式，其他会员可留言联系。发布者可将自己的商品标记为已售出或下架，管理员可在后台强制下架违规商品。

## 关于实名信息

会员注册收集真实姓名 + 身份证号 + 手机号，身份证号仅做格式与校验码验证（确认号码本身格式合法），**不核实号码是否对应真实存在的人**——这项核实需对接公安部人口信息库，只能通过有牌照的商业服务（阿里云/腾讯云实名认证等）取得，无开源替代方案。目前项目按需求不接入任何此类第三方服务。

身份证号在数据库中以 AES-256-GCM 加密存储（`id_card_encrypted` 字段），仅保留末4位明文（`id_card_last4`）用于前台展示，密钥为 `.env` 中的 `ID_ENCRYPTION_KEY`。

## 会员审核机制

会员注册后状态为 `pending`（待审核），**不会立即登录**，需管理员在 `admin.html` 的「会员审核」列表中手动通过后，状态才会变成 `approved`，此时才能用手机号+密码登录。管理员也可以将会员驳回（`rejected`）或事后改判。已登录会话每次请求都会重新检查数据库中的账号状态，管理员事后驳回已通过的会员，其登录状态会立即失效。

## 上线前必须完成的事

1. **换成正式的 `.env`**：`JWT_SECRET`、`ADMIN_PASSWORD`、`ID_ENCRYPTION_KEY` 务必换成随机长字符串，不可沿用范例值，`ID_ENCRYPTION_KEY` 遗失将导致已存储的身份证号无法解密。
2. **HTTPS**：请在正式环境的反向代理（Nginx / 云厂商负载均衡）上配置 SSL 证书，本项目本身不处理 HTTPS 终止。
3. **数据库**：目前用 SQLite（`data/app.db`），MVP 阶段够用；若后续并发量提升，可改接 MySQL/PostgreSQL，`db.js` 是唯一需要调整的文件。
4. **管理员帐号**：目前是单一密码登录（MVP 简化版），未来管理员多于一人时，建议改为独立帐号表。

## 目前刻意不包含的功能

付费会员金流、棋具电商购物车/订单——目前平台仅提供免费会员注册与围棋知识浏览，尚未开放收费功能，因此未包含支付串接。待确定金流方案后再另行开发。
