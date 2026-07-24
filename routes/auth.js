const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendSmsCode } = require('../services/smsProvider');

const router = express.Router();

const PHONE_RE = /^1\d{10}$/;
const CODE_TTL_MINUTES = 5;
const RESEND_INTERVAL_SECONDS = 60;

function generateCode() {
  return String(Math.floor(100000 + (Date.now() % 900000)));
}

router.post('/send-code', async function (req, res) {
  var phone = String((req.body && req.body.phone) || '').trim();
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: '请输入正确的11位手机号码' });
  }

  var recent = db.prepare(
    "SELECT created_at FROM sms_codes WHERE phone = ? ORDER BY id DESC LIMIT 1"
  ).get(phone);
  if (recent) {
    var recentAgeSeconds = (Date.now() - new Date(recent.created_at + 'Z').getTime()) / 1000;
    if (recentAgeSeconds < RESEND_INTERVAL_SECONDS) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
  }

  var code = generateCode();
  var expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60000).toISOString();
  db.prepare(
    'INSERT INTO sms_codes (phone, code, purpose, expires_at) VALUES (?, ?, ?, ?)'
  ).run(phone, code, 'register', expiresAt);

  try {
    await sendSmsCode(phone, code);
  } catch (err) {
    console.error('短信发送失败：', err.message);
    return res.status(500).json({ error: '验证码发送失败，请稍后再试' });
  }

  res.json({ ok: true });
});

router.post('/register', function (req, res) {
  var body = req.body || {};
  var realName = String(body.realName || '').trim();
  var phone = String(body.phone || '').trim();
  var smsCode = String(body.smsCode || '').trim();
  var password = String(body.password || '');
  var level = String(body.level || '');
  var email = String(body.email || '');
  var address = String(body.address || '');

  if (!realName) return res.status(400).json({ error: '请填写真实姓名' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: '请输入正确的11位手机号码' });
  if (!/^\d{6}$/.test(smsCode)) return res.status(400).json({ error: '请输入6位数字验证码' });
  if (!password || password.length < 6) return res.status(400).json({ error: '密码长度至少6位' });

  var codeRow = db.prepare(
    "SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND purpose = 'register' AND consumed = 0 ORDER BY id DESC LIMIT 1"
  ).get(phone, smsCode);
  if (!codeRow) return res.status(400).json({ error: '验证码错误' });
  if (new Date(codeRow.expires_at + 'Z').getTime() < Date.now()) {
    return res.status(400).json({ error: '验证码已过期，请重新获取' });
  }

  var existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: '该手机号已注册，请直接登录' });

  var passwordHash = bcrypt.hashSync(password, 10);
  var result = db.prepare(
    'INSERT INTO users (real_name, phone, password_hash, level, email, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(realName, phone, passwordHash, level, email, address);

  db.prepare('UPDATE sms_codes SET consumed = 1 WHERE id = ?').run(codeRow.id);

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
