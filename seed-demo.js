// 示范数据脚本：建立已通过实名审核的会员与二手棋具信息，作为板块的初始内容。
//
//   npm run seed:demo
//
// 脚本会在 users / listings 表已有资料时自动跳过对应部分，重复执行不会产生重复数据。
// 所有日期一律不早于 2026-07-20；联系方式一律使用微信号或做过遮蔽的手机号，
// 避免公开展示可能指向真实第三方的号码。
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const DEMO_IMAGE_DIR = path.join(__dirname, 'public', 'images', 'demo');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'listings');

// name 仅用于脚本内部对应贴文，实际入库与显示的是 username
const MEMBERS = [
  // 以下 8 位有发布二手信息，注册时间安排在贴文之前
  { name: '王建国', username: 'kaya_1969', email: 'kaya1969@example.com', level: '业余段位',
    bio: '下了三十多年棋，偏爱厚实的木盘。家里棋具收得有点多，慢慢清一些给需要的棋友。',
    contact: '微信 wjg_kaya1969', joined: '2026-07-20 08:12:44' },
  { name: '吴海涛', username: 'haitao_qishe', email: 'haitao.qishe@example.com', level: '职业棋手',
    bio: '经营一间小棋社，平时教小朋友下棋。棋社换装备时会清出一些还能用的旧器材。',
    contact: '微信 wht_qishe（工作日白天在棋社）', joined: '2026-07-20 08:31:07' },
  { name: '李思远', username: 'siyuan_go', email: 'siyuan.go@example.com', level: '业余段位',
    bio: '喜欢木器，对棋罐的车工和木纹比较讲究。手上多出来的物件会挂上来找有缘人。',
    contact: '微信 lsy_go0724 / 手机 139****3271', joined: '2026-07-20 09:05:23' },
  { name: '陈雅琴', username: 'yaqin_chen', email: 'yaqin.chen@example.com', level: '入门级位',
    bio: '陪孩子学棋才接触围棋，慢慢自己也下了起来。孩子换阶段后闲置的棋具会转出。',
    contact: '微信 chenyq_1992', joined: '2026-07-20 09:41:58' },
  { name: '郑晓峰', username: 'xiaofeng_z', email: 'xiaofeng.z@example.com', level: '业余段位',
    bio: '偏好有年份感的老件，不做打磨修复，喜欢保留原来的样子。可以视频看细节。',
    contact: '微信 zxf_oldgo', joined: '2026-07-20 10:14:36' },
  { name: '刘志强', username: 'zhiqiang88', email: 'zhiqiang88@example.com', level: '零基础',
    bio: '去年报班学过一阵，后来工作太忙搁下了。整理阳台柜子清出一些当时买的东西。',
    contact: '微信 lzq1988_go', joined: '2026-07-20 10:37:12' },
  { name: '周瑾', username: 'jin_zhou', email: 'jin.zhou@example.com', level: '入门级位',
    bio: '家里常摆着棋盘，周末会跟先生下两盘。换了新盘之后旧的就想找人接手。',
    contact: '微信 zhoujin_weiqi', joined: '2026-07-20 10:52:49' },
  { name: '张伟民', username: 'weimin_z', email: 'weimin.z@example.com', level: '业余段位',
    bio: '住的地方不大，偏好收纳方便的棋具。用不上的会整理出来转让。',
    contact: '微信 zwm_1976 / 手机 137****9826', joined: '2026-07-20 11:08:25' },

  // 以下 15 位目前尚未发布信息，仅在入驻列表中显示
  { name: '孙立文', username: 'liwen_sun', email: 'liwen.sun@example.com', level: '业余段位',
    bio: '棋龄十年左右，平时在市里的棋友会活动。想找几副适合带出门的轻便棋具。',
    contact: '微信 sunlw_go', joined: '2026-07-21 15:22:03' },
  { name: '黄美玲', username: 'meiling_h', email: 'meiling.h@example.com', level: '入门级位',
    bio: '刚学半年，目前用的是入门套装。希望之后换一块手感好一点的木盘。',
    contact: '微信 hml_1995', joined: '2026-07-22 09:47:31' },
  { name: '林建华', username: 'jianhua_lin', email: 'jianhua.lin@example.com', level: '业余段位',
    bio: '退休后重新捡起围棋，每天在公园跟老棋友下几盘。对云子比较有偏好。',
    contact: '微信 ljh_park', joined: '2026-07-22 16:03:55' },
  { name: '徐子涵', username: 'zihan_xu', email: 'zihan.xu@example.com', level: '零基础',
    bio: '被朋友拉着入坑，还在学规则的阶段。想先找一副便宜耐用的练习用棋。',
    contact: '微信 xzh_newbie', joined: '2026-07-23 11:19:08' },
  { name: '马俊杰', username: 'junjie_ma', email: 'junjie.ma@example.com', level: '业余段位',
    bio: '收了几副不同材质的棋子在比较手感，偶尔会把重复的转出去。',
    contact: '微信 mjj_stones', joined: '2026-07-24 14:36:42' },
  { name: '高雪', username: 'gao_xue', email: 'gao.xue@example.com', level: '入门级位',
    bio: '在儿童围棋教室做助教，平时帮教室留意二手的教学用棋具。',
    contact: '微信 gaoxue_teach', joined: '2026-07-25 10:08:17' },
  { name: '罗文彬', username: 'wenbin_luo', email: 'wenbin.luo@example.com', level: '业余段位',
    bio: '喜欢研究棋谱，家里书比棋具多。偶尔出手一些用不到的配件。',
    contact: '微信 lwb_kifu', joined: '2026-07-26 13:54:29' },
  { name: '曾丽华', username: 'lihua_zeng', email: 'lihua.zeng@example.com', level: '入门级位',
    bio: '和先生一起学棋，家里两副棋常年摆着。想再添一副带出门用的。',
    contact: '微信 zlh_couple', joined: '2026-07-27 09:26:51' },
  { name: '许志明', username: 'zhiming_xu', email: 'zhiming.xu@example.com', level: '业余段位',
    bio: '做木工的，对棋罐棋盘的木料比较熟。可以帮棋友看看料子对不对。',
    contact: '微信 xzm_wood', joined: '2026-07-28 15:41:13' },
  { name: '潘敏', username: 'pan_min', email: 'pan.min@example.com', level: '零基础',
    bio: '刚给孩子报了围棋课，正在物色适合小朋友用的入门棋具。',
    contact: '微信 panmin_mom', joined: '2026-07-29 20:12:38' },
  { name: '范可欣', username: 'kexin_fan', email: 'kexin.fan@example.com', level: '入门级位',
    bio: '大学围棋社成员，社团有时会收二手棋具补充器材。',
    contact: '微信 fkx_club', joined: '2026-07-30 12:33:04' },
  { name: '董国强', username: 'guoqiang_d', email: 'guoqiang.d@example.com', level: '业余段位',
    bio: '棋龄二十年，家里有几副老棋盘舍不得出。偶尔来看看有没有想收的。',
    contact: '微信 dgq_oldboard', joined: '2026-07-31 17:05:46' },
  { name: '袁淑芬', username: 'shufen_yuan', email: 'shufen.yuan@example.com', level: '入门级位',
    bio: '社区活动中心的志工，帮中心添置活动用的棋具。',
    contact: '微信 ysf_center', joined: '2026-08-01 10:47:22' },
  { name: '傅晨曦', username: 'chenxi_fu', email: 'chenxi.fu@example.com', level: '业余段位',
    bio: '喜欢磁性折叠盘，出差时也带着。想找几副不同尺寸的比较看看。',
    contact: '微信 fcx_travel', joined: '2026-08-02 19:18:57' },
  { name: '石永康', username: 'yongkang_s', email: 'yongkang.s@example.com', level: '业余段位',
    bio: '常年在棋馆下棋，认识不少棋友。可以帮忙牵线找想要的棋具。',
    contact: '微信 syk_qiguan', joined: '2026-08-03 14:29:35' }
];

// 依服务商要求：所有发布与留言时间不早于 2026-07-20，且不显示价格
const LISTINGS = [
  {
    member: '王建国',
    title: '新榧木棋墩 足付盘 约三寸厚',
    category: '棋盘',
    description: '新榧（云杉）材质的足付棋墩，连脚一起大概到小腿一半的高度，盘面三寸左右。前几年托朋友从日本带回来的，一直放在书房。木色偏黄，侧面有几处淡淡的水渍色斑（照片里能看到），是早年放在窗边受潮留下的，不影响使用也没有开裂。盘面格线完整清楚，落子声音很扎实。脚是原配的。因为家里要重新装修，实在腾不出地方。只出给自己下棋用的棋友，不太想转给二道贩子。可以约在家里看盘，具体细节欢迎留言详谈。',
    contact: '微信 wjg_kaya1969（加时请说明是看棋墩）',
    images: ['kadun-kaya.jpg'],
    created_at: '2026-08-04 21:06:18',
    status: 'active'
  },
  {
    member: '吴海涛',
    title: '棋社清出计时器三台 一起打包',
    category: '计时器',
    description: '棋社去年换了新一批计时器，旧的三台一直收在柜子里。一台是黑色电子的，读秒、包干模式都正常，屏幕清楚；一台是老式红色翻盖的，按键有年头了但走时准；还有一台深蓝红键的 PS-1688，功能也没问题。三台都能用，外壳难免有磕碰划痕，介意的话不建议入。三台一起出不单卖。教棋的老师或者刚开棋室的可以考虑，欢迎当面试机。',
    contact: '微信 wht_qishe（工作日白天在棋社，可当面试机）',
    images: ['clock-digital.jpg', 'clock-vintage.jpg', 'clock-ps1688.jpg'],
    created_at: '2026-08-02 10:33:52',
    status: 'active'
  },
  {
    member: '李思远',
    title: '桑木棋罐一对 带盖 品相好',
    category: '棋罐',
    description: '一对桑木棋罐，带原配盖子，罐身车工规整，木纹一圈圈很清楚，表面是自然的油润光泽，不是刷漆的那种亮。直径大概 11.5 公分，装 361 颗普通厚度的棋子还有余。原本配一副蛤碁石的，后来棋子出给别人了，罐子一直空着放柜子里。两只木纹深浅略有差别，本来就是一对里的自然差异。罐口和盖沿都完好，没有磕缺。',
    contact: '微信 lsy_go0724 / 手机 139****3271（可先站内留言）',
    images: ['jars-pair.jpg'],
    created_at: '2026-07-31 19:47:31',
    status: 'active'
  },
  {
    member: '陈雅琴',
    title: '蛤碁石一副 附一块薄棋盘',
    category: '棋子',
    description: '蛤碁石一副，原装纸盒还在（照片里浅绿色那个盒子）。石子厚度中等，日常下棋用手感很好，不是那种薄薄的机制子。数量点过是齐的。另外附一块薄的木质棋盘，一公分左右厚，本来是配着这副子用的，一起给不另外算。棋盘正反面都是十九路，边角有很轻的磨损。孩子学棋那两年买的，现在他升学没时间下了，放着可惜。',
    contact: '微信 chenyq_1992（备注蛤碁石）',
    images: ['hamaguri-set.jpg'],
    created_at: '2026-07-29 14:12:05',
    status: 'active'
  },
  {
    member: '郑晓峰',
    title: '老棋墩配一对老棋罐 整套出',
    category: '其他',
    description: '老件，家里长辈留下来的，具体年份说不准，木色已经沉成深褐色了。棋墩是足付的，侧面能明显看到早年使用的划痕和磕碰，我没有做过任何打磨修复，就是原来的样子。配的一对棋罐也是老的，木纹很漂亮，盖子是原配。罐里的黑白子也一起给，白子有几颗有细纹。整套一起出，不拆开。喜欢老物件的应该懂这个状态，追求品相完美的就不用来了。',
    contact: '微信 zxf_oldgo（可视频看细节）',
    images: ['kadun-antique.jpg'],
    created_at: '2026-07-27 20:58:44',
    status: 'active'
  },
  {
    member: '刘志强',
    title: '竹制棋盘整套 盘+两个棋罐+棋子',
    category: '其他',
    description: '竹制棋盘一整套，含棋盘、两个带盖竹棋罐和一副棋子。去年报围棋班的时候在网上买的，用了大概三四个月，后来工作太忙就停课了，东西收在阳台柜子里。棋盘表面平整没变形，竹纹清楚；棋罐盖子开合正常；棋子数量完整，是常见的玻璃子，有正常使用的细微痕迹。适合刚入门或者给小朋友练手，不用一件件另外配。希望一次带走。',
    contact: '微信 lzq1988_go（备注围棋套装）',
    images: ['set-bamboo.jpg'],
    created_at: '2026-07-25 22:24:37',
    status: 'active'
  },
  {
    member: '周瑾',
    title: '家用整套 棋盘配两个木棋罐',
    category: '其他',
    description: '自己家里在用的一套，拍照那天刚好在下棋就顺手拍了（垫在下面的席子不含在内）。棋盘是木质薄盘，摊在桌上就能下；两个棋罐是浅色木的，带盖，盖子拿下来搁旁边的样子照片里看得到。棋子黑白都齐，白子是普通的，黑子偏墨绿。整套用了一年多，日常擦拭保养，没有明显磕伤。现在换了厚一点的卓上盘，这套就多出来了。',
    contact: '微信 zhoujin_weiqi',
    images: ['set-home.jpg'],
    created_at: '2026-07-24 11:39:16',
    status: 'active'
  },
  {
    member: '张伟民',
    title: '带抽屉收纳棋盘 棋子直接收在盘里',
    category: '棋盘',
    description: '棋盘下面左右各带一个抽屉，黑白子分开收在里面，下完直接推回去就行，不用另外找罐子装，桌面上很省事。深棕色的，材质是密度板贴皮，不是实木，这点说清楚免得误会。用了一年多，抽屉滑轨顺畅，盘面格线清楚，边角有一点使用痕迹。棋子是配套的塑料子，一起给。适合家里空间小或者带小孩下棋收拾方便的。',
    contact: '微信 zwm_1976 / 手机 137****9826',
    images: ['board-drawer.jpg'],
    created_at: '2026-07-22 09:15:29',
    status: 'active'
  },
  {
    member: '王建国',
    title: '折叠脚矮棋桌 附两个棋子托盘',
    category: '棋盘',
    description: '带折叠脚的矮棋桌，脚可以收起来平放，摊开后高度差不多是坐地上或者坐矮凳下棋的高度。桌面盘面是十九路，右上角边缘有一圈挡边，棋子不容易滚下去。另外配两个方形木托盘装黑白子，照片里放在桌面上那两个。整体是漆过的木头，颜色偏红棕。买来在客厅地毯上下棋用的，后来搬家客厅小了摆不开。脚的活动关节都正常，没有松。',
    contact: '微信 wjg_kaya1969',
    images: ['board-legs.jpg'],
    created_at: '2026-07-21 17:52:41',
    status: 'active'
  },
  {
    member: '周瑾',
    title: '折叠磁性棋盘 便携 出门下棋用',
    category: '棋盘',
    description: '磁性折叠棋盘，对折起来像个盒子，棋子磁吸不会乱跑，坐高铁或者去公园茶室下棋都很方便，风吹也不怕。摊开是十九路，合起来棋子就收在盘子里。用了半年多，折痕处平整，摊开后盘面不翘。棋子磁力都还在，数量完整。因为后来买了实木盘在家用，这个就闲置了。照片拍了摊开和收起来两个状态。',
    contact: '微信 zhoujin_weiqi',
    images: ['board-fold.jpg', 'set-fold.jpg'],
    created_at: '2026-07-20 15:28:09',
    status: 'sold'
  }
];

const COMMENTS = [
  { listingTitle: '新榧木棋墩 足付盘 约三寸厚', author: '张伟民', content: '请问侧面那几处水渍摸起来有凹凸吗？还是只是颜色的差别？', created_at: '2026-08-05 08:41:22' },
  { listingTitle: '新榧木棋墩 足付盘 约三寸厚', author: '吴海涛', content: '新榧足付三寸这个成色算不错了。方便的话周末想过去看看实物。', created_at: '2026-08-05 19:07:53' },
  { listingTitle: '棋社清出计时器三台 一起打包', author: '刘志强', content: '三台一起打包挺合适，我朋友刚开了个小棋室，帮他问下还在吗？', created_at: '2026-08-03 13:22:40' },
  { listingTitle: '桑木棋罐一对 带盖 品相好', author: '郑晓峰', content: '罐口内径量过大概多少？我手上的子偏厚，怕装不下。', created_at: '2026-08-01 16:50:14' },
  { listingTitle: '蛤碁石一副 附一块薄棋盘', author: '王建国', content: '这个盒子看着是老包装。石子厚度方便量一下大概几号吗？', created_at: '2026-07-30 21:33:07' },
  { listingTitle: '老棋墩配一对老棋罐 整套出', author: '李思远', content: '老件这个状态很有味道，不修反而好。白子有细纹是正常的老化，能接受。', created_at: '2026-07-28 10:18:35' },
  { listingTitle: '竹制棋盘整套 盘+两个棋罐+棋子', author: '陈雅琴', content: '这套给小朋友练手刚好，我周末方便过去看，时间私聊您。', created_at: '2026-07-26 09:44:58' },
  { listingTitle: '带抽屉收纳棋盘 棋子直接收在盘里', author: '周瑾', content: '带抽屉的确实省事，家里小孩下完棋从来不收。请问抽屉深度装得下厚一点的云子吗？', created_at: '2026-07-23 20:05:47' },
  { listingTitle: '折叠磁性棋盘 便携 出门下棋用', author: '孙立文', content: '一直想找一副能带出门的，请问收起来大概多大？能塞进背包侧袋吗？', created_at: '2026-07-21 12:36:19' }
];

function seedMembers() {
  var passwordHash = bcrypt.hashSync('demo123456', 10);
  var memberIds = {};
  var created = 0;

  var insert = db.prepare(
    "INSERT INTO users (username, email, password_hash, level, bio, contact, id_card_front, id_card_back, status, created_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, '', '', 'approved', ?)"
  );

  MEMBERS.forEach(function (m) {
    var existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(m.username);
    if (existingUser) {
      memberIds[m.name] = existingUser.id;
      return;
    }
    // 示范会员直接写入已审核状态，且不带身份证照片（这些不是真实注册的账号）
    var result = insert.run(m.username, m.email, passwordHash, m.level, m.bio, m.contact, m.joined);
    memberIds[m.name] = result.lastInsertRowid;
    created++;
  });

  console.log('会员：新增 ' + created + ' 位，共 ' + Object.keys(memberIds).length + ' 位可用（皆为已审核，登录密码 demo123456）');
  return memberIds;
}

function seedListings(memberIds) {
  var existing = db.prepare('SELECT COUNT(*) AS c FROM listings').get().c;
  if (existing > 0) {
    console.log('二手信息：表中已有 ' + existing + ' 条，为避免重复未写入。');
    return;
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  var listingIds = {};
  var insertListing = db.prepare(
    "INSERT INTO listings (user_id, title, category, description, price, contact_info, status, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, '', ?, ?, ?, ?)"
  );
  var insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_name, sort_order) VALUES (?, ?, ?)');

  LISTINGS.forEach(function (l) {
    var userId = memberIds[l.member];
    if (!userId) throw new Error('找不到会员：' + l.member);

    var result = insertListing.run(
      userId, l.title, l.category, l.description, l.contact, l.status, l.created_at, l.created_at
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
  console.log('二手信息：已建立 ' + LISTINGS.length + ' 条');

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
  console.log('留言：已建立 ' + commentCount + ' 条');
}

function run() {
  var memberIds = seedMembers();
  seedListings(memberIds);
}

run();
