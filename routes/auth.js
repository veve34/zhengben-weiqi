const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const captcha = require('../services/captcha');
const { uploadIdCardImages, cleanupUploaded } = require('../middleware/uploadIdCard');

const router = express.Router();

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = ['零基础', '入门级位', '业余段位', '职业棋手'];

router.post('/register', function (req, res) {
  uploadIdCardImages(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });

    function fail(status, message) {
      cleanupUploaded(req.files);
      return res.status(status).json({ error: message });
    }

    var body = req.body || {};
    var username = String(body.username || '').trim();
    var email = String(body.email || '').trim();
    var password = String(body.password || '');
    var confirmPassword = String(body.confirmPassword || '');
    var level = String(body.level || '').trim();
    var captchaInput = String(body.captcha || '').trim();

    if (!USERNAME_RE.test(username)) {
      return fail(400, '用户名需为3-20位字母、数字或下划线');
    }
    if (!EMAIL_RE.test(email)) return fail(400, '请输入正确的邮箱地址');
    if (password.length < 6) return fail(400, '密码长度至少6位');
    if (password !== confirmPassword) return fail(400, '两次输入的密码不一致');
    if (level && LEVELS.indexOf(level) === -1) return fail(400, '棋力水平选项不正确');

    if (!captcha.verify(req.cookies && req.cookies[captcha.COOKIE_NAME], captchaInput)) {
      return fail(400, '验证码错误或已过期，请点击图片更换后重试');
    }

    var front = req.files && req.files.idCardFront && req.files.idCardFront[0];
    var back = req.files && req.files.idCardBack && req.files.idCardBack[0];
    if (!front) return fail(400, '请上传身份证正面照片');
    if (!back) return fail(400, '请上传身份证背面照片');

    var existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return fail(409, '该用户名已被使用，请换一个');

    var passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(
      "INSERT INTO users (username, email, password_hash, level, id_card_front, id_card_back, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
    ).run(username, email, passwordHash, level, front.filename, back.filename);

    // 验证码一次性使用，成功后立即失效
    res.clearCookie(captcha.COOKIE_NAME);
    res.json({ ok: true, status: 'pending' });
  });
});

router.post('/login', function (req, res) {
  var username = String((req.body && req.body.username) || '').trim();
  var password = String((req.body && req.body.password) || '');

  var user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status === 'pending') {
    return res.status(403).json({ error: '您的账号正在审核中，请耐心等待', status: 'pending' });
  }
  if (user.status === 'rejected') {
    return res.status(403).json({ error: '您的注册申请未通过审核，如有疑问请联系客服', status: 'rejected' });
  }

  var token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('member_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ ok: true });
});

router.post('/logout', function (req, res) {
  res.clearCookie('member_token');
  res.json({ ok: true });
});

module.exports = router;
