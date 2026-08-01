const express = require('express');
const captcha = require('../services/captcha');

const router = express.Router();

router.get('/', function (req, res) {
  var result = captcha.issue();
  res.cookie(captcha.COOKIE_NAME, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: captcha.TTL_SECONDS * 1000
  });
  res.set('Cache-Control', 'no-store');
  res.type('image/svg+xml').send(result.svg);
});

module.exports = router;
