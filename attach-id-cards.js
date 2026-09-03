// 把身份证照片与证件资料挂到指定会员上（管理员人工登录用）。
//
//   node attach-id-cards.js
//
// 证件资料本身不写在这支脚本里，而是读取同目录下的 id-cards.local.json，
// 该档已列入 .gitignore，不会进版本库 —— 身份证号与住址属于敏感个资，
// 而这个 repo 是公开的，写死在程式码里等于公开在网路上。
//
// id-cards.local.json 格式：
//   {
//     "sourceDir": "照片所在目录的绝对路径",
//     "targets": [
//       { "username": "会员用户名", "front": "正面档名", "back": "反面档名",
//         "id_number": "身份证号", "address": "住址" }
//     ]
//   }
//
// 照片会复制到 data/id-cards/（在 public/ 之外，不能用网址直接取得），
// 只有带管理员 cookie 的请求才读得到。data/id-cards/ 同样不进版本库，
// 所以正式机的照片要另外用安全管道传上去，不要经过 git。
//
// 注意：证件号码与住址目前是明文存放在 users 表。正式营运若要长期保存，
// 应先加上加密，或改为只保留末四码。
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { ID_CARD_DIR } = require('./middleware/uploadIdCard');

const CONFIG_PATH = path.join(__dirname, 'id-cards.local.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('找不到设定档：' + CONFIG_PATH);
    console.error('请依脚本开头的说明建立该档案后再执行。');
    process.exit(1);
  }
  var config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!config.sourceDir || !Array.isArray(config.targets) || !config.targets.length) {
    console.error('设定档格式不正确：需要 sourceDir 与至少一笔 targets。');
    process.exit(1);
  }
  return config;
}

function copyCard(sourceDir, srcName, side) {
  var src = path.join(sourceDir, srcName);
  if (!fs.existsSync(src)) throw new Error('找不到照片档案：' + src);

  var ext = path.extname(srcName).toLowerCase();
  var fileName = 'idcard-' + side + '-' + crypto.randomBytes(6).toString('hex') + ext;

  if (!fs.existsSync(ID_CARD_DIR)) fs.mkdirSync(ID_CARD_DIR, { recursive: true });
  fs.copyFileSync(src, path.join(ID_CARD_DIR, fileName));
  return fileName;
}

function run() {
  var config = loadConfig();

  config.targets.forEach(function (t) {
    var user = db.prepare('SELECT id, id_card_front, id_card_back FROM users WHERE username = ?').get(t.username);
    if (!user) {
      console.log('略过：资料库里找不到会员「' + t.username + '」');
      return;
    }

    // 同一个会员重复执行时，先删掉上一次复制进来的旧档，避免目录里越积越多
    [user.id_card_front, user.id_card_back].forEach(function (old) {
      if (!old) return;
      var p = path.join(ID_CARD_DIR, path.basename(old));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    var front = copyCard(config.sourceDir, t.front, 'front');
    var back = copyCard(config.sourceDir, t.back, 'back');

    db.prepare(
      "UPDATE users SET id_card_front = ?, id_card_back = ?, id_number = ?, address = ?, status = 'approved' WHERE id = ?"
    ).run(front, back, t.id_number || '', t.address || '', user.id);

    console.log('已更新「' + t.username + '」：证件照片 2 张、身份证号、住址，状态设为已通过');
  });

  console.log('');
  console.log('照片存放目录：' + ID_CARD_DIR);
}

run();
