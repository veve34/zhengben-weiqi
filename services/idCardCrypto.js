// 身份证号加密存储（AES-256-GCM，Node.js 内建 crypto 模块，无需任何外部服务）。
// 密码用单向雜湊即可，但身份证号日后可能需要合规查验时还原，因此用可逆加密而非雜湊。

const crypto = require('crypto');

function getKey() {
  var secret = process.env.ID_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('请在 .env 设置至少32字符的 ID_ENCRYPTION_KEY');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptIdCard(plainText) {
  var iv = crypto.randomBytes(12);
  var cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  var encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  var authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptIdCard(encoded) {
  var raw = Buffer.from(encoded, 'base64');
  var iv = raw.subarray(0, 12);
  var authTag = raw.subarray(12, 28);
  var encrypted = raw.subarray(28);
  var decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = { encryptIdCard: encryptIdCard, decryptIdCard: decryptIdCard };
