const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', function (req, res) {
  var rows = db.prepare(
    'SELECT l.*, u.real_name AS seller_name, u.phone AS seller_phone FROM listings l JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC, l.id DESC'
  ).all();
  res.json({ listings: rows });
});

router.post('/:id/remove', function (req, res) {
  var result = db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该商品' });
  res.json({ ok: true });
});

module.exports = router;
