# 正本围棋 · 会员系统后端 MVP

给工程师的交接说明。前端画面沿用既有设计，本次补上的是真实可运行的会员注册/登录/内容管理后端。

## 快速开始

```bash
npm install
cp .env.example .env
# 编辑 .env，填入 JWT_SECRET、ADMIN_PASSWORD
npm start
```

打开 `http://localhost:3000` 即为会员网站，`http://localhost:3000/admin.html` 为围棋知识内容管理后台（用 `.env` 里的 `ADMIN_PASSWORD` 登录）。

## 目录结构

- `server.js` — 入口，挂载路由、提供 `public/` 静态文件
- `db.js` — SQLite 数据库与建表（首次启动自动建立 `data/app.db`）
- `routes/auth.js` — 发送验证码 / 注册 / 登录 / 登出
- `routes/member.js` — 会员中心资料查询
- `routes/articles.js` — 围棋知识文章（公开查询 + 后台管理）
- `routes/admin.js` — 管理员登录
- `services/smsProvider.js` — 短信发送接口，**上线前必须在此接入真实短信服务商**
- `public/index.html` — 会员网站前台
- `public/admin.html` — 内容管理后台

## 上线前必须完成的事

1. **接入真实短信服务商**：`services/smsProvider.js` 目前只在控制台打印验证码，务必替换为阿里云/腾讯云短信 SDK 的真实调用，并在 `.env` 填上对应的 `SMS_PROVIDER`、`SMS_SIGN_NAME`、`SMS_TEMPLATE_CODE` 等参数。
2. **换成正式的 `.env`**：`JWT_SECRET`、`ADMIN_PASSWORD` 务必换成随机长字符串，不可沿用范例值。
3. **HTTPS**：请在正式环境的反向代理（Nginx / 云厂商负载均衡）上配置 SSL 证书，本项目本身不处理 HTTPS 终止。
4. **数据库**：目前用 SQLite（`data/app.db`），MVP 阶段够用；若后续并发量提升，可改接 MySQL/PostgreSQL，`db.js` 是唯一需要调整的文件。
5. **管理员帐号**：目前是单一密码登录（MVP 简化版），未来管理员多于一人时，建议改为独立帐号表。

## 目前刻意不包含的功能

付费会员金流、棋具电商购物车/订单——目前平台仅提供免费会员注册与围棋知识浏览，尚未开放收费功能，因此未包含支付串接。待确定金流方案后再另行开发。
