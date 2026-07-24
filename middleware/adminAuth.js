// 简易管理员校验：MVP 阶段用单一密码 + Cookie 标记即可，
// 若日后管理员人数增加，建议改为独立 admins 表 + 各自帐号密码。

function requireAdmin(req, res, next) {
  var token = req.cookies && req.cookies.admin_token;
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '管理员未登录或密码错误' });
  }
  next();
}

module.exports = { requireAdmin: requireAdmin };
