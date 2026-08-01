const jwt = require('jsonwebtoken');
const db = require('../db');

function verifyToken(req) {
  var token = req.cookies && req.cookies.member_token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function isApproved(memberId) {
  var user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(memberId);
  return !!user && user.status === 'approved';
}

function requireMember(req, res, next) {
  if (!req.cookies || !req.cookies.member_token) {
    return res.status(401).json({ error: '尚未登录' });
  }
  var payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ error: '登录状态已失效，请重新登录' });
  }

  // 每次请求都重新查库确认账号状态，避免审核通过后又被驳回/停用的会员仍能用旧 token 访问
  if (!isApproved(payload.id)) {
    res.clearCookie('member_token');
    return res.status(403).json({ error: '账号状态异常，请重新登录或联系客服' });
  }

  req.member = payload;
  next();
}

// 解出目前登录的会员，未登录或状态异常时把 req.member 设为 null（不中断请求）。
// 用于公开接口需要「顺便判断是否为本人」的情境，例如让会员看到自己待审核的贴文。
function optionalMember(req, res, next) {
  var payload = verifyToken(req);
  req.member = (payload && isApproved(payload.id)) ? payload : null;
  next();
}

module.exports = {
  requireMember: requireMember,
  optionalMember: optionalMember
};
