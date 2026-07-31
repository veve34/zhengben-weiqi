// 示范数据脚本：建立若干已审核会员与二手棋具信息，用于本地预览与备案材料截图。
// 正式上线前请勿在生产数据库执行，或执行后手动清除这些示范数据。
//
//   node seed-demo.js
//
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { encryptIdCard } = require('./services/idCardCrypto');

const DEMO_IMAGE_DIR = path.join(__dirname, 'public', 'images', 'demo');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'listings');

const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

function buildIdCard(prefix17) {
  var sum = 0;
  for (var i = 0; i < 17; i++) sum += Number(prefix17[i]) * ID_WEIGHTS[i];
  return prefix17 + ID_CHECK_CODES[sum % 11];
}

const MEMBERS = [
  { name: '王建国', phone: '13857124093', idPrefix: '33010419690312281', level: '业余段位', city: '杭州市西湖区' },
  { name: '李思远', phone: '13906543271', idPrefix: '33010219850724159', level: '业余段位', city: '杭州市上城区' },
  { name: '陈雅琴', phone: '15857206348', idPrefix: '33018119920218204', level: '入门级位', city: '杭州市余杭区' },
  { name: '张伟民', phone: '13705719826', idPrefix: '33010319760905117', level: '业余段位', city: '杭州市拱墅区' },
  { name: '刘志强', phone: '18606514237', idPrefix: '33011019880611253', level: '零基础', city: '杭州市滨江区' },
  { name: '周瑾', phone: '13588129470', idPrefix: '33010519951130146', level: '入门级位', city: '杭州市萧山区' },
  { name: '吴海涛', phone: '13957186052', idPrefix: '33010819710426193', level: '职业棋手', city: '杭州市钱塘区' },
  { name: '郑晓峰', phone: '15168273904', idPrefix: '33018219900817225', level: '业余段位', city: '杭州市临平区' }
];

// created_at 采用固定日期，避免每次执行产生不同结果
const LISTINGS = [
  {
    member: '王建国',
    title: '日本榧木棋盘 三寸卓上盘 转让',
    category: '棋盘',
    price: '3200',
    description: '前年从棋具店购入的日本榧木卓上盘，厚度约三寸，木纹细密、色泽温润。平时都放在书房对弈用，收藏为主，实际使用大概三四十盘棋。盘面无裂无变形，边角有一处很轻微的磕碰痕迹（照片里看不太出来，当面可以仔细看）。因为最近要搬去外地，实在带不走，希望转给真正喜欢的棋友。可以到家里看盘。',
    contact: '微信 wjg_weiqi1969（加时请说明是围棋盘）',
    images: ['board-a.jpg', 'board-c.jpg'],
    created_at: '2026-07-28 20:14:03',
    status: 'active'
  },
  {
    member: '陈雅琴',
    title: '云子一副 黑白共361颗 齐全',
    category: '棋子',
    price: '260',
    description: '云南产云子，黑子照光呈墨绿色，很有味道。数量数过是齐的，黑181白180，没有缺子。孩子学棋时买的，后来他改学国际象棋了，放着也是浪费。棋子有正常使用的细微痕迹，没有崩边缺角。原装塑料盒还在，一起给。',
    contact: '电话 15857206348（工作日晚上七点后方便）',
    images: ['stones-a.jpg', 'stones-b.jpg'],
    created_at: '2026-07-26 13:47:52',
    status: 'active'
  },
  {
    member: '李思远',
    title: '桑木棋罐一对 手工车制',
    category: '棋罐',
    price: '480',
    description: '一对桑木棋罐，带盖，罐身车工规整，木纹很漂亮。买的时候是配一副蛤碁石的，后来棋子送人了，罐子留着一直没用。直径约12公分，装361颗普通厚度的棋子完全够。罐口有一点点使用的光泽，没有裂缝。两个罐子木纹不完全一样，本来就是这样，不是配错。',
    contact: '微信 lsy0724 / 电话 13906543271',
    images: ['jar-a.jpg', 'jar-b.jpg', 'jar-c.jpg'],
    created_at: '2026-07-24 09:22:31',
    status: 'active'
  },
  {
    member: '张伟民',
    title: '围棋专用计时器 读秒功能正常',
    category: '计时器',
    price: '95',
    description: '比赛用的电子计时器，双面显示，包干、读秒、加秒几种模式都能用，按键手感还行。之前在棋社帮忙记时用过一段时间，外壳有几道浅划痕，功能完全没问题。电池是新换的。棋社现在换新设备了，这台放着占地方。',
    contact: '电话 13705719826',
    images: ['clock-a.jpg', 'clock-b.jpg'],
    created_at: '2026-07-21 16:05:18',
    status: 'active'
  },
  {
    member: '刘志强',
    title: '入门整套 棋盘+棋罐+棋子 一次带走',
    category: '其他',
    price: '350',
    description: '去年报班学棋买的入门套装，竹制棋盘加一对木罐和一副玻璃棋子。上了几个月课，后来工作忙就停了，东西一直收在柜子里。棋盘正常使用痕迹，棋子数量完整。适合刚入门或者给小朋友用，不用另外一件件配。希望一次带走，不单卖。',
    contact: '微信 lzq_1988（备注围棋套装）',
    images: ['set-a.jpg', 'board-b.jpg'],
    created_at: '2026-07-18 21:33:47',
    status: 'active'
  },
  {
    member: '周瑾',
    title: '竹制折叠棋盘 便携 适合外出对弈',
    category: '棋盘',
    price: '120',
    description: '竹制的对折棋盘，合起来不占地方，出门带去公园或者茶室下棋很方便。中间折痕处平整，摊开后不会翘。用了大概半年，表面有些许使用痕迹但不影响。因为家里已经买了卓上盘，这个就闲置了。',
    contact: '微信 zhoujin_go',
    images: ['board-b.jpg'],
    created_at: '2026-07-15 11:58:22',
    status: 'sold'
  },
  {
    member: '吴海涛',
    title: '蛤碁石 雪印 32号 白子单副',
    category: '棋子',
    price: '2800',
    description: '日向产蛤碁石，雪印，32号厚度，只有白子180颗，黑子（那智黑）已经另外出掉了，所以单独出白子，价格按单副算。石纹清晰均匀，是正经的雪印级别，手感和普通玻璃子完全不是一个层次。有原盒。只推荐懂行的棋友，不太懂的建议先看过实物再决定。可以约在棋社当面验。',
    contact: '电话 13957186052（白天在棋社，可当面看）',
    images: ['stones-b.jpg', 'stones-a.jpg'],
    created_at: '2026-07-12 19:41:09',
    status: 'active'
  },
  {
    member: '郑晓峰',
    title: '单个棋罐 装黑子那只 配对用',
    category: '棋罐',
    price: '150',
    description: '原本一对，装白子那只不小心磕坏了盖子，剩下这只完好。木质，带盖，罐身有几圈自然木纹。如果你手上刚好也缺一只、木色能凑得上的话可以考虑，我拍了几个角度的照片。单只出，价格好说。',
    contact: '微信 zxf_0817',
    images: ['jar-c.jpg', 'jar-b.jpg'],
    created_at: '2026-07-09 14:26:55',
    status: 'active'
  },
  {
    member: '王建国',
    title: '棋钟 老款机械式 走时准',
    category: '计时器',
    price: '180',
    description: '老式机械棋钟，上弦的那种，两个表盘。现在基本都用电子的了，但这种老东西有它的味道，走时还是准的。外壳漆面有年份感的磨损，指针和旗子都正常。适合喜欢老物件的棋友，当摆件也好看。',
    contact: '微信 wjg_weiqi1969',
    images: ['clock-b.jpg'],
    created_at: '2026-07-05 10:12:38',
    status: 'active'
  },
  {
    member: '陈雅琴',
    title: '新榧木棋盘 一寸五 平时练棋用',
    category: '棋盘',
    price: '890',
    description: '新榧（云杉）材质的卓上盘，一寸五厚度，比三寸的轻很多，平时摆桌上练手很合适。买了一年多，盘面格线清楚，没有变形。因为后来换了厚盘，这块就多出来了。适合日常摆着随手复盘用，不太建议当收藏。',
    contact: '电话 15857206348 / 微信同号',
    images: ['board-c.jpg', 'board-a.jpg'],
    created_at: '2026-06-30 22:07:14',
    status: 'active'
  }
];

const COMMENTS = [
  { listingTitle: '云子一副 黑白共361颗 齐全', author: '刘志强', content: '请问这个还在吗？孩子刚开始学，想给他配一副。', created_at: '2026-07-27 09:15:22' },
  { listingTitle: '云子一副 黑白共361颗 齐全', author: '周瑾', content: '云子墨绿色照片上看着挺正的，是老云子还是新的？', created_at: '2026-07-28 20:48:37' },
  { listingTitle: '桑木棋罐一对 手工车制', author: '郑晓峰', content: '罐口内径大概多少？我的棋子偏厚，怕装不下。', created_at: '2026-07-25 15:30:04' },
  { listingTitle: '入门整套 棋盘+棋罐+棋子 一次带走', author: '陈雅琴', content: '滨江的话我周末可以过去看，方便的时间私聊您。', created_at: '2026-07-19 10:22:41' },
  { listingTitle: '蛤碁石 雪印 32号 白子单副', author: '王建国', content: '雪印32号这个价格算实在了。请问那智黑是出给谁了，有没有可能一起收回来配套？', created_at: '2026-07-14 18:53:16' },
  { listingTitle: '围棋专用计时器 读秒功能正常', author: '吴海涛', content: '棋社也在找几台备用的，能否多要两台？如果还有请联系我。', created_at: '2026-07-22 08:37:29' },
  { listingTitle: '日本榧木棋盘 三寸卓上盘 转让', author: '张伟民', content: '榧木三寸这个价位不多见，请问木纹是柾目还是木口？', created_at: '2026-07-29 21:04:52' }
];

function run() {
  var existing = db.prepare('SELECT COUNT(*) AS c FROM listings').get().c;
  if (existing > 0) {
    console.log('listings 表已有 ' + existing + ' 条数据，为避免重复，示范数据未写入。');
    console.log('如需重新灌入，请先清空 listings / listing_images / listing_comments 表。');
    return;
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  var passwordHash = bcrypt.hashSync('demo123456', 10);
  var memberIds = {};

  MEMBERS.forEach(function (m) {
    var existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(m.phone);
    if (existingUser) {
      memberIds[m.name] = existingUser.id;
      return;
    }
    var idCard = buildIdCard(m.idPrefix);
    var result = db.prepare(
      "INSERT INTO users (real_name, phone, id_card_encrypted, id_card_last4, password_hash, level, email, address, status) VALUES (?, ?, ?, ?, ?, ?, '', ?, 'approved')"
    ).run(m.name, m.phone, encryptIdCard(idCard), idCard.slice(-4), passwordHash, m.level, m.city);
    memberIds[m.name] = result.lastInsertRowid;
  });
  console.log('已建立 ' + Object.keys(memberIds).length + ' 位示范会员（均为已审核状态，登录密码 demo123456）');

  var listingIds = {};
  var insertListing = db.prepare(
    'INSERT INTO listings (user_id, title, category, description, price, contact_info, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  var insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_name, sort_order) VALUES (?, ?, ?)');

  LISTINGS.forEach(function (l) {
    var userId = memberIds[l.member];
    if (!userId) throw new Error('找不到会员：' + l.member);

    var result = insertListing.run(
      userId, l.title, l.category, l.description, l.price, l.contact,
      l.status, l.created_at, l.created_at
    );
    listingIds[l.title] = result.lastInsertRowid;

    l.images.forEach(function (src, index) {
      var ext = path.extname(src);
      var fileName = 'demo-' + result.lastInsertRowid + '-' + index + '-' +
        crypto.createHash('md5').update(src + result.lastInsertRowid).digest('hex').slice(0, 8) + ext;
      fs.copyFileSync(path.join(DEMO_IMAGE_DIR, src), path.join(UPLOAD_DIR, fileName));
      insertImage.run(result.lastInsertRowid, fileName, index);
    });
  });
  console.log('已建立 ' + LISTINGS.length + ' 条二手棋具信息');

  var insertComment = db.prepare(
    'INSERT INTO listing_comments (listing_id, user_id, content, created_at) VALUES (?, ?, ?, ?)'
  );
  var commentCount = 0;
  COMMENTS.forEach(function (c) {
    var listingId = listingIds[c.listingTitle];
    var userId = memberIds[c.author];
    if (!listingId || !userId) return;
    insertComment.run(listingId, userId, c.content, c.created_at);
    commentCount++;
  });
  console.log('已建立 ' + commentCount + ' 条留言');
}

run();
