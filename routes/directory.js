const express = require('express');
const db = require('../db');

const router = express.Router();

// 入驻列表：公开显示已通过实名审核的会员。
// 只回传会员自愿公开的资料（用户名、简介、联系方式），不包含邮箱与身份证相关栏位。
router.get('/', function (req, res) {
  var rows = db.prepare(
    "SELECT u.id, u.username, u.bio, u.contact, u.level, u.created_at, " +
    "(SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status = 'active') AS listing_count " +
    "FROM users u WHERE u.status = 'approved' ORDER BY u.created_at ASC, u.id ASC"
  ).all();

  var now = Date.now();
  rows.forEach(function (row) {
    // 入驻天数：以注册日起算，当天入驻显示 1 天
    var joined = new Date(row.created_at.replace(' ', 'T') + 'Z').getTime();
    row.joined_days = Math.max(1, Math.floor((now - joined) / 86400000) + 1);
  });

  res.json({ members: rows, total: rows.length });
});

module.exports = router;
