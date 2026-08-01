// 图形验证码：本地产生，不依赖任何外部服务。
// 验证码本身以签章 cookie（JWT）保存，服务端不需要维护 session。

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 去掉容易混淆的 0/O/1/I/l
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;
const TTL_SECONDS = 10 * 60;
const COOKIE_NAME = 'captcha_token';

function randomInt(max) {
  return crypto.randomInt(0, max);
}

function generateCode() {
  var code = '';
  for (var i = 0; i < CODE_LENGTH; i++) code += CHARS[randomInt(CHARS.length)];
  return code;
}

function renderSvg(code) {
  var w = 132;
  var h = 44;
  var parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">');
  parts.push('<rect width="' + w + '" height="' + h + '" fill="#f4f9f7"/>');

  // 干扰线
  for (var i = 0; i < 5; i++) {
    parts.push('<line x1="' + randomInt(w) + '" y1="' + randomInt(h) + '" x2="' + randomInt(w) + '" y2="' + randomInt(h) +
      '" stroke="hsl(' + (140 + randomInt(40)) + ',35%,' + (55 + randomInt(20)) + '%)" stroke-width="1"/>');
  }
  // 干扰点
  for (var j = 0; j < 26; j++) {
    parts.push('<circle cx="' + randomInt(w) + '" cy="' + randomInt(h) + '" r="1" fill="#9fbdb0"/>');
  }

  var step = Math.floor((w - 24) / CODE_LENGTH);
  for (var k = 0; k < code.length; k++) {
    var x = 16 + k * step + randomInt(6);
    var y = 30 + randomInt(6);
    var rotate = randomInt(40) - 20;
    parts.push('<text x="' + x + '" y="' + y + '" font-size="' + (24 + randomInt(4)) +
      '" font-family="Georgia,serif" font-weight="700" fill="hsl(' + (150 + randomInt(30)) + ',45%,' + (25 + randomInt(15)) +
      '%)" transform="rotate(' + rotate + ' ' + x + ' ' + y + ')">' + code[k] + '</text>');
  }

  parts.push('</svg>');
  return parts.join('');
}

function issue() {
  var code = generateCode();
  var token = jwt.sign({ code: code.toUpperCase() }, process.env.JWT_SECRET, { expiresIn: TTL_SECONDS });
  return { svg: renderSvg(code), token: token };
}

function verify(token, input) {
  if (!token || !input) return false;
  try {
    var payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.code === String(input).trim().toUpperCase();
  } catch (err) {
    return false;
  }
}

module.exports = {
  issue: issue,
  verify: verify,
  COOKIE_NAME: COOKIE_NAME,
  TTL_SECONDS: TTL_SECONDS
};
