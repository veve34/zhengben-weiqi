// 重置示范数据：清掉旧版示范内容后，重新灌入 seed-demo.js 的最新版本。
//
//   npm run reset:demo
//
// 为什么需要这支脚本：seed-demo.js 为了避免重复写入，会在资料已存在时跳过。
// 因此当示范内容改版（例如会员由 23 位减为 6 位、联系方式改成电话），
// 只重新执行 seed 是不会生效的，必须先把旧的示范资料清掉。
//
// 安全范围：只删除下列已知的示范帐号及其发布的信息，
// 真实注册的会员与他们的资料不会被动到。
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'listings');

// 历来所有版本用过的示范帐号，全部列出以便清理干净
const DEMO_USERNAMES = [
  // 目前版本的 6 位
  '张杰', '鲁学伟', '于啸', '刘天昊', '李文俊', '王晓强',
  // 上一版同样 6 位，但用的是拼音帐号
  'jin_zhou', 'kaya_1969', 'haitao_qishe', 'yaqin_chen', 'xiaofeng_z', 'siyuan_go',
  // 旧版 23 位里多出来的 17 位
  'zhiqiang88', 'weimin_z', 'liwen_sun', 'meiling_h', 'jianhua_lin', 'zihan_xu',
  'junjie_ma', 'gao_xue', 'wenbin_luo', 'lihua_zeng', 'zhiming_xu', 'pan_min',
  'kexin_fan', 'guoqiang_d', 'shufen_yuan', 'chenxi_fu', 'yongkang_s'
];

function run() {
  var placeholders = DEMO_USERNAMES.map(function () { return '?'; }).join(',');
  var demoUsers = db.prepare(
    'SELECT id, username FROM users WHERE username IN (' + placeholders + ')'
  ).all(DEMO_USERNAMES);

  if (!demoUsers.length) {
    console.log('资料库中找不到示范帐号，无需清理。');
  } else {
    var demoIds = demoUsers.map(function (u) { return u.id; });
    var idPlaceholders = demoIds.map(function () { return '?'; }).join(',');

    // 先找出这些帐号发布的信息，连带清掉图档
    var listings = db.prepare(
      'SELECT id FROM listings WHERE user_id IN (' + idPlaceholders + ')'
    ).all(demoIds);
    var listingIds = listings.map(function (l) { return l.id; });

    var removedFiles = 0;
    if (listingIds.length) {
      var lPlaceholders = listingIds.map(function () { return '?'; }).join(',');
      db.prepare(
        'SELECT file_name FROM listing_images WHERE listing_id IN (' + lPlaceholders + ')'
      ).all(listingIds).forEach(function (img) {
        var p = path.join(UPLOAD_DIR, path.basename(img.file_name));
        if (fs.existsSync(p)) { fs.unlinkSync(p); removedFiles++; }
      });
      db.prepare('DELETE FROM listing_comments WHERE listing_id IN (' + lPlaceholders + ')').run(listingIds);
      db.prepare('DELETE FROM listing_images WHERE listing_id IN (' + lPlaceholders + ')').run(listingIds);
      db.prepare('DELETE FROM listings WHERE id IN (' + lPlaceholders + ')').run(listingIds);
    }

    // 示范帐号在「真实会员」信息底下留的留言也要一并清掉，否则删帐号会留下孤儿留言
    var orphanComments = db.prepare(
      'DELETE FROM listing_comments WHERE user_id IN (' + idPlaceholders + ')'
    ).run(demoIds).changes;

    db.prepare('DELETE FROM users WHERE id IN (' + idPlaceholders + ')').run(demoIds);

    console.log('已清除旧的示范资料：');
    console.log('  会员 ' + demoUsers.length + ' 位');
    console.log('  信息 ' + listingIds.length + ' 条、图档 ' + removedFiles + ' 个');
    console.log('  额外留言 ' + orphanComments + ' 条');
  }

  console.log('');
  console.log('重新灌入最新的示范资料：');
  require('./seed-demo.js');
}

run();
