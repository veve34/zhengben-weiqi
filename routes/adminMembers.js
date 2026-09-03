const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { ID_CARD_DIR } = require('../middleware/uploadIdCard');

const router = express.Router();

router.use(requireAdmin);

router.get('/', function (req, res) {
  var status = String(req.query.status || 'pending');
  // contact / id_number / address 仅在管理员端点回传，前台的入驻列表不含证件资料
  var cols = 'id, username, email, level, contact, id_number, address, ' +
    'id_card_front, id_card_back, status, created_at';
  var rows = status === 'all'
    ? db.prepare('SELECT ' + cols + ' FROM users ORDER BY id DESC').all()
    : db.prepare('SELECT ' + cols + ' FROM users WHERE status = ? ORDER BY id DESC').all(status);

  rows.forEach(function (row) {
    // 只回传「有没有照片」，照片本身要另外透过下面的端点取，避免档名散落在前端
    row.has_id_card_front = !!row.id_card_front;
    row.has_id_card_back = !!row.id_card_back;
    delete row.id_card_front;
    delete row.id_card_back;
  });
  res.json({ members: rows });
});

// 身份证照片仅限管理员查看，档案存放在 public/ 之外，不能直接用网址取得
router.get('/:id/id-card/:side', function (req, res) {
  var side = req.params.side;
  if (['front', 'back'].indexOf(side) === -1) return res.status(400).json({ error: '参数不正确' });

  var user = db.prepare('SELECT id_card_front, id_card_back FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '找不到该会员' });

  var fileName = side === 'front' ? user.id_card_front : user.id_card_back;
  if (!fileName) return res.status(404).json({ error: '该会员没有上传这一面的照片' });

  // 只允许取用档名本身，防止 ../ 之类的路径穿越
  var safeName = path.basename(fileName);
  var filePath = path.join(ID_CARD_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '照片档案不存在' });

  res.set('Cache-Control', 'no-store');
  res.sendFile(filePath);
});

router.post('/:id/approve', function (req, res) {
  var result = db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该会员' });
  res.json({ ok: true });
});

router.post('/:id/reject', function (req, res) {
  var result = db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该会员' });
  res.json({ ok: true });
});

module.exports = router;
