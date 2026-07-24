// 中国大陆第二代居民身份证号码格式与校验码验证（GB 11643-1999 标准公开算法）。
// 仅验证号码格式与校验位是否自洽，不核实号码是否对应真实存在的人
// （该项核实需对接公安部人口信息库，属于有牌照的商业服务，不在本项目范围内）。

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

function isValidDate(year, month, day) {
  var d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function validateIdCard(idCard) {
  var value = String(idCard || '').trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(value)) {
    return { valid: false, reason: '身份证号格式不正确，应为18位（末位可为数字或X）' };
  }

  var year = Number(value.slice(6, 10));
  var month = Number(value.slice(10, 12));
  var day = Number(value.slice(12, 14));
  var currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear || !isValidDate(year, month, day)) {
    return { valid: false, reason: '身份证号中的出生日期不正确' };
  }

  var sum = 0;
  for (var i = 0; i < 17; i++) {
    sum += Number(value[i]) * WEIGHTS[i];
  }
  var expectedCheckCode = CHECK_CODES[sum % 11];
  if (value[17] !== expectedCheckCode) {
    return { valid: false, reason: '身份证号校验码不正确' };
  }

  return { valid: true };
}

module.exports = { validateIdCard: validateIdCard };
