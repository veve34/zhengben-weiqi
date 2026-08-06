const express = require('express');
const db = require('../db');
const { requireMember } = require('../middleware/auth');

const router = express.Router();

const LEVELS = ['零基础', '入门级位', '业余段位', '职业棋手'];
const BIO_MAX = 200;
const CONTACT_MAX = 100;

router.get('/me', requireMember, function (req, res) {
  var user = db.prepare(
    'SELECT id, username, email, level, bio, contact, member_tier, status, created_at FROM users WHERE id = ?'
  ).get(req.member.id);
  if (!user) return res.status(404).json({ error: '找不到会员信息' });
  res.json({ member: user });
});

// 会员自行维护入驻列表上公开显示的资料。
// 用户名、邮箱与实名审核状态不开放自行修改。
router.put('/me', requireMember, function (req, res) {
  var body = req.body || {};
  var bio = String(body.bio == null ? '' : body.bio).trim();
  var contact = String(body.contact == null ? '' : body.contact).trim();
  var level = String(body.level == null ? '' : body.level).trim();

  if (bio.length > BIO_MAX) return res.status(400).json({ error: '个人简介不能超过 ' + BIO_MAX + ' 字' });
  if (contact.length > CONTACT_MAX) return res.status(400).json({ error: '联系方式不能超过 ' + CONTACT_MAX + ' 字' });
  if (level && LEVELS.indexOf(level) === -1) return res.status(400).json({ error: '棋力水平选项不正确' });

  db.prepare('UPDATE users SET bio = ?, contact = ?, level = ? WHERE id = ?')
    .run(bio, contact, level, req.member.id);

  res.json({ ok: true });
});

module.exports = router;
