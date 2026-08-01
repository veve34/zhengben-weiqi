// 身份证照片上传。
// 注意：这些档案属于敏感个人信息，刻意存放在 public/ 之外的 data/id-cards/，
// 不会被静态服务直接对外提供，只能透过管理员身分的 API 取得。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const ID_CARD_DIR = path.join(__dirname, '..', 'data', 'id-cards');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

if (!fs.existsSync(ID_CARD_DIR)) fs.mkdirSync(ID_CARD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, ID_CARD_DIR); },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(10).toString('hex') + ext);
  }
});

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.indexOf(file.mimetype) === -1) {
    return cb(new Error('身份证照片仅支持 JPG / PNG / WEBP 格式'));
  }
  cb(null, true);
}

const uploadIdCardImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 2 }
}).fields([
  { name: 'idCardFront', maxCount: 1 },
  { name: 'idCardBack', maxCount: 1 }
]);

// 注册流程中途失败时，清掉已经落地的档案，避免留下无主的身份证照片
function cleanupUploaded(files) {
  if (!files) return;
  Object.keys(files).forEach(function (field) {
    files[field].forEach(function (f) {
      fs.unlink(f.path, function () {});
    });
  });
}

module.exports = {
  uploadIdCardImages: uploadIdCardImages,
  cleanupUploaded: cleanupUploaded,
  ID_CARD_DIR: ID_CARD_DIR
};
