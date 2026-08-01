const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', function (req, res) {
  var status = String(req.query.status || 'pending');
  var base = 'SELECT l.*, u.username AS seller_name, u.email AS seller_email FROM listings l JOIN users u ON u.id = l.user_id';
  var order = ' ORDER BY l.created_at DESC, l.id DESC';
  var rows = status === 'all'
    ? db.prepare(base + order).all()
    : db.prepare(base + ' WHERE l.status = ?' + order).all(status);

  rows.forEach(function (row) {
    row.images = db.prepare(
      'SELECT file_name FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC'
    ).all(row.id).map(function (i) { return '/uploads/listings/' + i.file_name; });
  });
  res.json({ listings: rows });
});

router.post('/:id/approve', function (req, res) {
  var result = db.prepare(
    "UPDATE listings SET status = 'active', updated_at = datetime('now') WHERE id = ? AND status IN ('pending','rejected')"
  ).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该信息，或它不在可审核的状态' });
  res.json({ ok: true });
});

router.post('/:id/reject', function (req, res) {
  var result = db.prepare(
    "UPDATE listings SET status = 'rejected', updated_at = datetime('now') WHERE id = ? AND status != 'removed'"
  ).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该信息，或它已下架' });
  res.json({ ok: true });
});

router.post('/:id/remove', function (req, res) {
  var result = db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '找不到该信息' });
  res.json({ ok: true });
});

module.exports = router;
