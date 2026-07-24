const jwt = require('jsonwebtoken');

function requireMember(req, res, next) {
  var token = req.cookies && req.cookies.member_token;
  if (!token) return res.status(401).json({ error: '尚未登录' });
  try {
    req.member = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录状态已失效，请重新登录' });
  }
}

module.exports = { requireMember: requireMember };
