const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', function (req, res) {
  var articles = db.prepare('SELECT * FROM articles ORDER BY sort_order ASC, id ASC').all();
  res.json({ articles: articles });
});

router.post('/', requireAdmin, function (req, res) {
  var body = req.body || {};
  var tag = String(body.tag || '').trim();
  var title = String(body.title || '').trim();
  var summary = String(body.summary || '').trim();
  var content = String(body.content || '').trim();
  var sortOrder = Number(body.sortOrder) || 0;
  if (!tag || !title || !summary) return res.status(400).json({ error: '分类、标题、摘要皆为必填' });

  var result = db.prepare(
    'INSERT INTO articles (tag, title, summary, content, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(tag, title, summary, content, sortOrder);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAdmin, function (req, res) {
  var body = req.body || {};
  var tag = String(body.tag || '').trim();
  var title = String(body.title || '').trim();
  var summary = String(body.summary || '').trim();
  var content = String(body.content || '').trim();
  var sortOrder = Number(body.sortOrder) || 0;
  if (!tag || !title || !summary) return res.status(400).json({ error: '分类、标题、摘要皆为必填' });

  db.prepare(
    "UPDATE articles SET tag = ?, title = ?, summary = ?, content = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(tag, title, summary, content, sortOrder, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, function (req, res) {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
