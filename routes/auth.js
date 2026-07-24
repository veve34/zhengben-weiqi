const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateIdCard } = require('../services/idCardValidator');
const { encryptIdCard } = require('../services/idCardCrypto');

const router = express.Router();

const PHONE_RE = /^1\d{10}$/;

router.post('/register', function (req, res) {
  var body = req.body || {};
  var realName = String(body.realName || '').trim();
  var phone = String(body.phone || '').trim();
  var idCard = String(body.idCard || '').trim().toUpperCase();
  var password = String(body.password || '');
  var level = String(body.level || '');
  var email = String(body.email || '');
  var address = String(body.address || '');

  if (!realName) return res.status(400).json({ error: '请填写真实姓名' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: '请输入正确的11位手机号码' });
  if (!password || password.length < 6) return res.status(400).json({ error: '密码长度至少6位' });

  var idCardCheck = validateIdCard(idCard);
  if (!idCardCheck.valid) return res.status(400).json({ error: idCardCheck.reason });

  var existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: '该手机号已注册，请直接登录' });

  var passwordHash = bcrypt.hashSync(password, 10);
  var idCardEncrypted = encryptIdCard(idCard);
  var idCardLast4 = idCard.slice(-4);

  var result = db.prepare(
    'INSERT INTO users (real_name, phone, id_card_encrypted, id_card_last4, password_hash, level, email, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(realName, phone, idCardEncrypted, idCardLast4, passwordHash, level, email, address);

  var token = jwt.sign({ id: result.lastInsertRowid, phone: phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('member_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ ok: true });
});

router.post('/login', function (req, res) {
  var phone = String((req.body && req.body.phone) || '').trim();
  var password = String((req.body && req.body.password) || '');

  var user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  var token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('member_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ ok: true });
});

router.post('/logout', function (req, res) {
  res.clearCookie('member_token');
  res.json({ ok: true });
});

module.exports = router;
