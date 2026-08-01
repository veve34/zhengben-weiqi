// 棋盘示意图：以 SVG 绘制小型棋形，供围棋知识页的教学内容使用。
// 文章内文里写 {{diagram:名称}}，前台会替换成对应的图。
// 坐标为 [列, 行]，皆自 0 起算，左上角为 (0,0)。

var BOARD_DIAGRAMS = {
  board19: {
    size: 19,
    caption: '标准19路棋盘，共361个交叉点，九个加粗的圆点即为星位，正中央称天元。'
  },
  liberties: {
    size: 7,
    stones: [
      { x: 3, y: 3, color: 'b' },
      { x: 0, y: 3, color: 'b' },
      { x: 6, y: 0, color: 'b' }
    ],
    marks: [
      { x: 2, y: 3, type: 'liberty' }, { x: 4, y: 3, type: 'liberty' },
      { x: 3, y: 2, type: 'liberty' }, { x: 3, y: 4, type: 'liberty' },
      { x: 0, y: 2, type: 'liberty' }, { x: 0, y: 4, type: 'liberty' },
      { x: 1, y: 3, type: 'liberty' },
      { x: 5, y: 0, type: 'liberty' }, { x: 6, y: 1, type: 'liberty' }
    ],
    caption: '绿点为各棋子的气：中央的黑子有四口气，边上的有三口气，角上的只有两口气。'
  },
  capture: {
    size: 7,
    stones: [
      { x: 3, y: 3, color: 'w' },
      { x: 2, y: 3, color: 'b' }, { x: 4, y: 3, color: 'b' }, { x: 3, y: 2, color: 'b' }
    ],
    marks: [{ x: 3, y: 4, type: 'move', label: '①' }],
    caption: '白子仅剩一口气，黑方在①处落子后，白子即被提走，该点变回空点。'
  },
  forbidden: {
    size: 7,
    stones: [
      { x: 2, y: 3, color: 'w' }, { x: 4, y: 3, color: 'w' },
      { x: 3, y: 2, color: 'w' }, { x: 3, y: 4, color: 'w' }
    ],
    marks: [{ x: 3, y: 3, type: 'x' }],
    caption: '×处四周皆为白子，黑方下在此处会立刻无气，属禁着点（但若该手能同时提子则为例外）。'
  },
  ko: {
    size: 7,
    stones: [
      { x: 1, y: 2, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 2, y: 3, color: 'b' },
      { x: 3, y: 2, color: 'b', label: '①' },
      { x: 3, y: 1, color: 'w' }, { x: 3, y: 3, color: 'w' }, { x: 4, y: 2, color: 'w' }
    ],
    marks: [{ x: 2, y: 2, type: 'x' }],
    caption: '黑方以①提掉白子后，白方不得立刻在×处提回，须先在别处下一手。'
  },
  handicap: {
    size: 19,
    stones: [
      { x: 3, y: 3, color: 'b' }, { x: 15, y: 3, color: 'b' },
      { x: 3, y: 15, color: 'b' }, { x: 15, y: 15, color: 'b' }
    ],
    caption: '让四子的摆法：开局前先在四个角的星位放上黑子，再由白方先行。'
  },
  territory: {
    size: 7,
    stones: [
      { x: 3, y: 0, color: 'b' }, { x: 3, y: 1, color: 'b' },
      { x: 3, y: 2, color: 'b' }, { x: 3, y: 3, color: 'b' },
      { x: 2, y: 3, color: 'b' }, { x: 1, y: 3, color: 'b' }, { x: 0, y: 3, color: 'b' }
    ],
    marks: [
      { x: 0, y: 0, type: 'territory' }, { x: 1, y: 0, type: 'territory' }, { x: 2, y: 0, type: 'territory' },
      { x: 0, y: 1, type: 'territory' }, { x: 1, y: 1, type: 'territory' }, { x: 2, y: 1, type: 'territory' },
      { x: 0, y: 2, type: 'territory' }, { x: 1, y: 2, type: 'territory' }, { x: 2, y: 2, type: 'territory' }
    ],
    caption: '黑棋在角上围住的九个交叉点即为黑方的地，终局时以双方的地多寡定胜负。'
  }
};

var STAR_POINTS = {
  19: [3, 9, 15],
  13: [3, 6, 9],
  9: [2, 4, 6],
  7: [3]
};

function renderBoardDiagram(name) {
  var spec = BOARD_DIAGRAMS[name];
  if (!spec) return '';

  var size = spec.size;
  var cell = size >= 19 ? 20 : 42;
  var pad = cell;
  var span = (size - 1) * cell;
  var total = span + pad * 2;
  var r = cell * 0.46;
  var svg = [];

  svg.push('<svg viewBox="0 0 ' + total + ' ' + total + '" class="go-diagram-svg" role="img" aria-label="棋盘示意图">');
  svg.push('<rect width="' + total + '" height="' + total + '" rx="6" fill="#e5c48f"/>');

  for (var i = 0; i < size; i++) {
    var p = pad + i * cell;
    svg.push('<line x1="' + pad + '" y1="' + p + '" x2="' + (pad + span) + '" y2="' + p + '" stroke="#6b4a24" stroke-width="1"/>');
    svg.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="' + (pad + span) + '" stroke="#6b4a24" stroke-width="1"/>');
  }

  var stars = STAR_POINTS[size] || [];
  stars.forEach(function (sx) {
    stars.forEach(function (sy) {
      svg.push('<circle cx="' + (pad + sx * cell) + '" cy="' + (pad + sy * cell) + '" r="' +
        (size >= 19 ? 3 : 4) + '" fill="#6b4a24"/>');
    });
  });

  (spec.marks || []).forEach(function (m) {
    var cx = pad + m.x * cell;
    var cy = pad + m.y * cell;
    if (m.type === 'liberty') {
      svg.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.4) + '" fill="#2d7a61"/>');
    } else if (m.type === 'territory') {
      svg.push('<rect x="' + (cx - r * 0.35) + '" y="' + (cy - r * 0.35) + '" width="' + (r * 0.7) +
        '" height="' + (r * 0.7) + '" fill="#1c2b26" opacity="0.55"/>');
    } else if (m.type === 'x') {
      var d = r * 0.55;
      svg.push('<line x1="' + (cx - d) + '" y1="' + (cy - d) + '" x2="' + (cx + d) + '" y2="' + (cy + d) +
        '" stroke="#a94442" stroke-width="3" stroke-linecap="round"/>');
      svg.push('<line x1="' + (cx + d) + '" y1="' + (cy - d) + '" x2="' + (cx - d) + '" y2="' + (cy + d) +
        '" stroke="#a94442" stroke-width="3" stroke-linecap="round"/>');
    } else if (m.type === 'move') {
      svg.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#a94442" stroke-width="2.5" stroke-dasharray="4 3"/>');
      if (m.label) {
        svg.push('<text x="' + cx + '" y="' + (cy + r * 0.36) + '" text-anchor="middle" font-size="' +
          (r * 1.05) + '" fill="#a94442" font-weight="700">' + m.label + '</text>');
      }
    }
  });

  (spec.stones || []).forEach(function (s) {
    var cx = pad + s.x * cell;
    var cy = pad + s.y * cell;
    var isBlack = s.color === 'b';
    svg.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' +
      (isBlack ? '#1a1a1a' : '#fdfdfd') + '" stroke="#3a2a16" stroke-width="1"/>');
    if (s.label) {
      svg.push('<text x="' + cx + '" y="' + (cy + r * 0.36) + '" text-anchor="middle" font-size="' +
        (r * 1.05) + '" fill="' + (isBlack ? '#fff' : '#1a1a1a') + '" font-weight="700">' + s.label + '</text>');
    }
  });

  svg.push('</svg>');

  var html = '<figure class="go-diagram">' + svg.join('');
  if (spec.caption) html += '<figcaption>' + spec.caption + '</figcaption>';
  html += '</figure>';
  return html;
}
