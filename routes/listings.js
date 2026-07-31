const express = require('express');
const db = require('../db');
const { requireMember } = require('../middleware/auth');
const { uploadListingImages } = require('../middleware/upload');

const router = express.Router();

const CATEGORIES = ['棋盘', '棋子', '棋钟', '棋盒', '其他'];

function attachImages(listing) {
  listing.images = db.prepare(
    'SELECT file_name FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(listing.id).map(function (row) { return '/uploads/listings/' + row.file_name; });
  return listing;
}

router.get('/', function (req, res) {
  var category = req.query.category;
  var rows;
  if (category && CATEGORIES.indexOf(category) !== -1) {
    rows = db.prepare(
      "SELECT l.*, u.real_name AS seller_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.status != 'removed' AND l.category = ? ORDER BY l.id DESC"
    ).all(category);
  } else {
    rows = db.prepare(
      "SELECT l.*, u.real_name AS seller_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.status != 'removed' ORDER BY l.id DESC"
    ).all();
  }
  rows.forEach(function (row) {
    var cover = db.prepare('SELECT file_name FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(row.id);
    row.cover_image = cover ? '/uploads/listings/' + cover.file_name : null;
  });
  res.json({ listings: rows, categories: CATEGORIES });
});

router.get('/:id', function (req, res) {
  var listing = db.prepare(
    "SELECT l.*, u.real_name AS seller_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ? AND l.status != 'removed'"
  ).get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该商品或已下架' });
  attachImages(listing);
  listing.comments = db.prepare(
    'SELECT c.id, c.content, c.created_at, u.real_name AS author_name FROM listing_comments c JOIN users u ON u.id = c.user_id WHERE c.listing_id = ? ORDER BY c.id ASC'
  ).all(listing.id);
  res.json({ listing: listing });
});

router.post('/', requireMember, function (req, res) {
  uploadListingImages(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });

    var body = req.body || {};
    var title = String(body.title || '').trim();
    var category = CATEGORIES.indexOf(body.category) !== -1 ? body.category : '其他';
    var description = String(body.description || '').trim();
    var price = String(body.price || '').trim();
    var contactInfo = String(body.contactInfo || '').trim();

    if (!title) return res.status(400).json({ error: '请填写标题' });
    if (!contactInfo) return res.status(400).json({ error: '请留下联系方式，方便买家联系您' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: '请至少上传一张商品照片' });

    var result = db.prepare(
      'INSERT INTO listings (user_id, title, category, description, price, contact_info) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.member.id, title, category, description, price, contactInfo);

    var insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_name, sort_order) VALUES (?, ?, ?)');
    req.files.forEach(function (file, index) {
      insertImage.run(result.lastInsertRowid, file.filename, index);
    });

    res.json({ ok: true, id: result.lastInsertRowid });
  });
});

router.put('/:id', requireMember, function (req, res) {
  var listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该商品' });
  if (listing.user_id !== req.member.id) return res.status(403).json({ error: '只能修改自己发布的商品' });

  var status = String((req.body && req.body.status) || '');
  if (['active', 'sold'].indexOf(status) === -1) return res.status(400).json({ error: '状态参数不正确' });

  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, listing.id);
  res.json({ ok: true });
});

router.delete('/:id', requireMember, function (req, res) {
  var listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该商品' });
  if (listing.user_id !== req.member.id) return res.status(403).json({ error: '只能删除自己发布的商品' });

  db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(listing.id);
  res.json({ ok: true });
});

router.post('/:id/comments', requireMember, function (req, res) {
  var listing = db.prepare("SELECT id FROM listings WHERE id = ? AND status != 'removed'").get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该商品或已下架' });

  var content = String((req.body && req.body.content) || '').trim();
  if (!content) return res.status(400).json({ error: '留言内容不能为空' });
  if (content.length > 500) return res.status(400).json({ error: '留言内容过长' });

  db.prepare('INSERT INTO listing_comments (listing_id, user_id, content) VALUES (?, ?, ?)').run(listing.id, req.member.id, content);
  res.json({ ok: true });
});

module.exports = router;
