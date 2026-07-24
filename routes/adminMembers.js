const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', function (req, res) {
  var status = String(req.query.status || 'pending');
  var rows;
  if (status === 'all') {
    rows = db.prepare(
      'SELECT id, real_name, phone, id_card_last4, level, email, address, status, created_at FROM users ORDER BY id DESC'
    ).all();
  } else {
    rows = db.prepare(
      'SELECT id, real_name, phone, id_card_last4, level, email, address, status, created_at FROM users WHERE status = ? ORDER BY id DESC'
    ).all(status);
  }
  res.json({ members: rows });
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
