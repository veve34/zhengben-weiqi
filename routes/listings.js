const express = require('express');
const db = require('../db');
const { requireMember, optionalMember } = require('../middleware/auth');
const { uploadListingImages } = require('../middleware/upload');

const router = express.Router();

const CATEGORIES = ['棋盘', '棋罐', '棋子', '计时器', '其他'];

// 公开可见的状态：审核通过（在售）与已售出。
// pending（待审核）/ rejected（未通过）只有发布人本人看得到，removed（已下架）任何人都看不到。
const PUBLIC_STATUSES = ['active', 'sold'];
const OWNER_ONLY_STATUSES = ['pending', 'rejected'];

function attachImages(listing) {
  listing.images = db.prepare(
    'SELECT file_name FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(listing.id).map(function (row) { return '/uploads/listings/' + row.file_name; });
  return listing;
}

router.get('/', optionalMember, function (req, res) {
  var category = req.query.category;
  var params = [];
  var where = "(l.status IN ('active','sold')";
  if (req.member) {
    where += " OR (l.user_id = ? AND l.status IN ('pending','rejected'))";
    params.push(req.member.id);
  }
  where += ')';

  if (category && CATEGORIES.indexOf(category) !== -1) {
    where += ' AND l.category = ?';
    params.push(category);
  }

  var rows = db.prepare(
    'SELECT l.*, u.username AS seller_name FROM listings l JOIN users u ON u.id = l.user_id WHERE ' +
    where + ' ORDER BY l.created_at DESC, l.id DESC'
  ).all(params);

  rows.forEach(function (row) {
    var cover = db.prepare('SELECT file_name FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(row.id);
    row.cover_image = cover ? '/uploads/listings/' + cover.file_name : null;
    row.is_own = !!(req.member && req.member.id === row.user_id);
  });
  res.json({ listings: rows, categories: CATEGORIES });
});

router.get('/:id', optionalMember, function (req, res) {
  var listing = db.prepare(
    'SELECT l.*, u.username AS seller_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?'
  ).get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该信息' });

  var isOwn = !!(req.member && req.member.id === listing.user_id);
  var viewable = PUBLIC_STATUSES.indexOf(listing.status) !== -1 ||
    (isOwn && OWNER_ONLY_STATUSES.indexOf(listing.status) !== -1);
  if (!viewable) return res.status(404).json({ error: '找不到该信息或已下架' });

  listing.is_own = isOwn;
  attachImages(listing);
  listing.comments = db.prepare(
    'SELECT c.id, c.content, c.created_at, u.username AS author_name FROM listing_comments c JOIN users u ON u.id = c.user_id WHERE c.listing_id = ? ORDER BY c.id ASC'
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
    var contactInfo = String(body.contactInfo || '').trim();

    if (!title) return res.status(400).json({ error: '请填写标题' });
    if (!contactInfo) return res.status(400).json({ error: '请留下联系方式，方便买家联系您' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: '请至少上传一张物品照片' });

    // 发布后进入待审核状态，需管理员审核通过才会对外公开
    // 平台定位为信息发布，不收集价格；listings.price 栏位保留但不再写入
    var result = db.prepare(
      "INSERT INTO listings (user_id, title, category, description, price, contact_info, status) VALUES (?, ?, ?, ?, '', ?, 'pending')"
    ).run(req.member.id, title, category, description, contactInfo);

    var insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_name, sort_order) VALUES (?, ?, ?)');
    req.files.forEach(function (file, index) {
      insertImage.run(result.lastInsertRowid, file.filename, index);
    });

    res.json({ ok: true, id: result.lastInsertRowid, status: 'pending' });
  });
});

router.put('/:id', requireMember, function (req, res) {
  var listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该信息' });
  if (listing.user_id !== req.member.id) return res.status(403).json({ error: '只能修改自己发布的信息' });

  var status = String((req.body && req.body.status) || '');
  if (['active', 'sold'].indexOf(status) === -1) return res.status(400).json({ error: '状态参数不正确' });
  // 待审核 / 未通过的信息尚未公开，不能由发布人自行改成在售或已售出
  if (PUBLIC_STATUSES.indexOf(listing.status) === -1) {
    return res.status(400).json({ error: '该信息尚未通过审核，暂时无法变更状态' });
  }

  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, listing.id);
  res.json({ ok: true });
});

router.delete('/:id', requireMember, function (req, res) {
  var listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: '找不到该信息' });
  if (listing.user_id !== req.member.id) return res.status(403).json({ error: '只能删除自己发布的信息' });

  db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(listing.id);
  res.json({ ok: true });
});

router.post('/:id/comments', requireMember, function (req, res) {
  var listing = db.prepare('SELECT id, status FROM listings WHERE id = ?').get(req.params.id);
  if (!listing || PUBLIC_STATUSES.indexOf(listing.status) === -1) {
    return res.status(404).json({ error: '找不到该信息或尚未公开' });
  }

  var content = String((req.body && req.body.content) || '').trim();
  if (!content) return res.status(400).json({ error: '留言内容不能为空' });
  if (content.length > 500) return res.status(400).json({ error: '留言内容过长' });

  db.prepare('INSERT INTO listing_comments (listing_id, user_id, content) VALUES (?, ?, ?)').run(listing.id, req.member.id, content);
  res.json({ ok: true });
});

module.exports = router;
