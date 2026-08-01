const express = require('express');
const db = require('../db');
const { requireMember } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireMember, function (req, res) {
  var user = db.prepare(
    'SELECT id, username, email, level, member_tier, status, created_at FROM users WHERE id = ?'
  ).get(req.member.id);
  if (!user) return res.status(404).json({ error: '找不到会员信息' });
  res.json({ member: user });
});

module.exports = router;
