const express = require('express');
const router = express.Router();

router.post('/login', function (req, res) {
  var password = String((req.body && req.body.password) || '');
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }
  res.cookie('admin_token', password, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 3600 * 1000 });
  res.json({ ok: true });
});

router.post('/logout', function (req, res) {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

module.exports = router;
