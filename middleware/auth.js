const jwt = require('jsonwebtoken');
const db = require('../db');

function requireMember(req, res, next) {
  var token = req.cookies && req.cookies.member_token;
  if (!token) return res.status(401).json({ error: '尚未登录' });
  try {
    var payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: '登录状态已失效，请重新登录' });
  }

  // 每次请求都重新查库确认账号状态，避免审核通过后又被驳回/停用的会员仍能用旧 token 访问
  var user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(payload.id);
  if (!user || user.status !== 'approved') {
    res.clearCookie('member_token');
    return res.status(403).json({ error: '账号状态异常，请重新登录或联系客服' });
  }

  req.member = payload;
  next();
}

module.exports = { requireMember: requireMember };
