const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data', 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    id_card_front TEXT NOT NULL DEFAULT '',
    id_card_back TEXT NOT NULL DEFAULT '',
    member_tier TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '其他',
    description TEXT NOT NULL DEFAULT '',
    price TEXT NOT NULL DEFAULT '',
    contact_info TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listing_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    file_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS listing_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 旧版资料表没有 content 栏位，启动时补上，避免既有部署升级后报错
var articleColumns = db.prepare('PRAGMA table_info(articles)').all().map(function (c) { return c.name; });
if (articleColumns.indexOf('content') === -1) {
  db.exec("ALTER TABLE articles ADD COLUMN content TEXT NOT NULL DEFAULT ''");
}

// 入驻列表所需的栏位，同样替既有资料库补上
var userColumns = db.prepare('PRAGMA table_info(users)').all().map(function (c) { return c.name; });
if (userColumns.indexOf('bio') === -1) {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''");
}
if (userColumns.indexOf('contact') === -1) {
  db.exec("ALTER TABLE users ADD COLUMN contact TEXT NOT NULL DEFAULT ''");
}

// 实名审核用的证件资料，仅供管理员在后台核对，前台任何端点都不回传。
// 注册流程目前不收集这两项，只有管理员从证件照片人工登录时才会有值。
if (userColumns.indexOf('id_number') === -1) {
  db.exec("ALTER TABLE users ADD COLUMN id_number TEXT NOT NULL DEFAULT ''");
}
if (userColumns.indexOf('address') === -1) {
  db.exec("ALTER TABLE users ADD COLUMN address TEXT NOT NULL DEFAULT ''");
}

// content 内的 {{diagram:名称}} 会被前台替换成对应的棋盘示意图（见 public/js/board-diagram.js）
var articleCount = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
if (articleCount === 0) {
  var seedArticles = [
    {
      tag: '围棋简介',
      title: '围棋是什么',
      summary: '围棋是起源于中国的两人对弈棋类，以在棋盘上围出的地域多寡决定胜负。',
      content: [
        '围棋是一种起源于中国的两人对弈棋类，至今已有数千年历史，古时与琴、书、画并称为文人四艺。它在唐宋时期传入朝鲜半岛与日本，近代逐步发展为世界性的智力竞技项目。',
        '围棋的规则很少，但变化极多。棋盘上的每一手都只是把一颗棋子放在交叉点上，双方争夺的是"谁围到的地方更大"。正因为规则简单而变化无穷，围棋常被视为兼具竞技性与思辨趣味的棋类。',
        '对初学者来说，只要掌握"气""提子""禁着点""打劫"这几个基本概念，就已经可以完整地下完一盘棋。下面几节会依次介绍这些内容。'
      ].join('\n\n'),
      sort: 1
    },
    {
      tag: '棋盘棋子',
      title: '棋盘、棋子与星位',
      summary: '标准棋盘由19条横线与19条竖线组成，共361个交叉点，棋子下在交叉点上。',
      content: [
        '标准围棋棋盘由19条横线与19条竖线交叉而成，共有361个交叉点。棋子必须下在交叉点上，而不是格子里，这一点与象棋的部分规则相近，初学者容易弄混。',
        '棋盘上有九个加粗的小圆点，称为"星"；正中央的那一个又叫"天元"。星位除了帮助辨认方位，也是让子棋摆放棋子的位置。',
        '习惯上把棋盘分成三个区域：四个角、四条边，以及中央的"中腹"。围同样大小的一块地，在角上花的棋子最少，边上次之，中腹最多，所以棋谚有"金角、银边、草肚皮"的说法，开局通常从角部开始。',
        '{{diagram:board19}}'
      ].join('\n\n'),
      sort: 2
    },
    {
      tag: '基本下法',
      title: '基本下法',
      summary: '黑先白后交替落子，每次一手，棋子落定后不可再移动。',
      content: [
        '对局由执黑一方先行，之后黑白双方交替落子，每次各下一手，不能连下两手。',
        '棋子一旦放到棋盘上，就不能再移动位置，也就是常说的"落子无悔"。棋子只会因为被对方提取而离开棋盘。',
        '轮到自己时，如果认为再下已无益处，也可以选择不下（虚手，也称"停一手"）。当双方连续虚手时，对局即告结束，进入胜负计算。'
      ].join('\n\n'),
      sort: 3
    },
    {
      tag: '核心概念',
      title: '气',
      summary: '与棋子直线相邻的空交叉点称为"气"，气是棋子在盘上存活的依据。',
      content: [
        '与一颗棋子直线相邻（上下左右，不含斜角）的空交叉点，称为这颗棋子的"气"。',
        '位置不同，气数也不同：下在中央的棋子有四口气，下在边线上的有三口气，下在角上的只有两口气。这也是角边比中腹更容易围空的原因之一。',
        '同色棋子如果直线相连，就成为一个整体，它们的气合并计算，只要整块棋还有一口气，就能留在盘上。',
        '{{diagram:liberties}}'
      ].join('\n\n'),
      sort: 4
    },
    {
      tag: '核心概念',
      title: '提子',
      summary: '一块棋的气被全部占满时即被提取离开棋盘，原位置成为空点。',
      content: [
        '当一块棋的所有气都被对方棋子占满，这块棋就"无气"了，必须立刻从棋盘上取走，这个动作称为"提子"。',
        '被提走的位置重新变回空交叉点，之后双方都可以再在这里落子。',
        '下图中白子只剩最后一口气，黑方在标示①的位置落子后，白子即被提走。',
        '{{diagram:capture}}'
      ].join('\n\n'),
      sort: 5
    },
    {
      tag: '核心概念',
      title: '禁着点',
      summary: '不能把棋子下在落子后立刻没有气的位置，但若该手能提掉对方棋子则属例外。',
      content: [
        '不允许把棋子下在"下完之后自己立刻没有气"的交叉点上，这类位置称为禁着点，俗称不能自杀。',
        '下图中标示×的位置四周都被白子占满，黑方不能在此落子。',
        '但有一个重要例外：如果这一手同时能提掉对方的棋子，提子之后自己就获得了气，那么这手棋是允许的。判断顺序是先提对方的子，再看自己有没有气。',
        '{{diagram:forbidden}}'
      ].join('\n\n'),
      sort: 6
    },
    {
      tag: '核心概念',
      title: '打劫',
      summary: '为避免双方无限互提，被提的一方不能立刻提回，必须先在别处下一手。',
      content: [
        '棋盘上会出现一种特殊形状：黑方提掉白方一子后，白方若立刻提回，棋形又会回到原样，双方可以无止境地互相提子，棋局永远下不完。',
        '为此规定：被提的一方不得立即在原处提回，必须先在棋盘的其他地方下一手，等对方应了这一手之后，才可以回来提。这条规则称为"打劫"。',
        '在别处下的那一手叫"找劫材"，对方回应的那一手叫"应劫"。对方也可以选择不应，直接把劫补掉，这时就要衡量哪边损失更小，打劫往往是全局较量的一部分。',
        '下图为黑方以①提子之后的形状，白方此时不能马上在×处提回。',
        '{{diagram:ko}}'
      ].join('\n\n'),
      sort: 7
    },
    {
      tag: '对局形式',
      title: '让子棋',
      summary: '双方水平有差距时，先由弱方在星位放置若干棋子作为补偿，再由白方先行。',
      content: [
        '当双方棋力差距较大时，通常采用让子棋，让棋局更有对抗性。',
        '做法是由较弱的一方执黑，开局前先在星位上摆好若干颗黑子，然后由白方先落子。让几子取决于双方差距，常见的是让二子到让九子。',
        '下图为让四子的摆法，黑子分别放在四个角的星位上。',
        '{{diagram:handicap}}'
      ].join('\n\n'),
      sort: 8
    },
    {
      tag: '胜负规则',
      title: '胜负计算与贴目',
      summary: '终局时比较双方围到的地域，并由黑方给白方一定补偿以平衡先行优势。',
      content: [
        '双方连续虚手后对局结束，接着清点各自围住的空点（地），地多的一方获胜。',
        '由于黑方先行占了便宜，规则上要求黑方给白方一定的补偿，称为"贴目"或"贴子"。不同规则的补偿数量不同：中国规则通常是黑方贴三又四分之三子，日韩规则通常是黑方贴六目半。补偿数带有半数，是为了避免出现和棋。',
        '下图中黑棋在角上围出的九个交叉点，就是黑方的地。',
        '{{diagram:territory}}'
      ].join('\n\n'),
      sort: 9
    }
  ];
  var insert = db.prepare('INSERT INTO articles (tag, title, summary, content, sort_order) VALUES (?, ?, ?, ?, ?)');
  seedArticles.forEach(function (a) { insert.run(a.tag, a.title, a.summary, a.content, a.sort); });
}

module.exports = db;
