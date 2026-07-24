const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data', 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    real_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    level TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    member_tier TEXT NOT NULL DEFAULT 'free',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sms_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'register',
    expires_at TEXT NOT NULL,
    consumed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

var articleCount = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
if (articleCount === 0) {
  var seedArticles = [
    ['基础入门', '围棋基本规则', '了解棋盘结构、气与提子、终局计目等围棋最基础的规则概念，是入门第一步。', 1],
    ['基础入门', '布局与常见定式', '介绍开局阶段的常见占角、挂角与简单定式，帮助初学者建立全局观念。', 2],
    ['段位常识', '段位与级位体系', '解读业余与职业围棋段位、级位划分方式，以及升段规则的基本常识。', 3],
    ['文化礼仪', '对弈礼仪与文化', '围棋自古讲究礼仪，从落座、执子到复盘，礼仪贯穿对弈始终。', 4],
    ['术语解读', '常用围棋术语', '梳理"打劫""征子""做眼"等常见术语，扫清阅读棋谱的语言障碍。', 5],
    ['历史文化', '围棋起源与发展', '简述围棋从古代中国流传至今的历史脉络与文化意义。', 6]
  ];
  var insert = db.prepare('INSERT INTO articles (tag, title, summary, sort_order) VALUES (?, ?, ?, ?)');
  seedArticles.forEach(function (row) { insert.run(row[0], row[1], row[2], row[3]); });
}

module.exports = db;
