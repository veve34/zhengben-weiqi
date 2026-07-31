const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'listings');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + crypto.randomBytes(8).toString('hex') + ext);
  }
});

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.indexOf(file.mimetype) === -1) {
    return cb(new Error('仅支持 JPG / PNG / WEBP 格式的图片'));
  }
  cb(null, true);
}

const uploadListingImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
}).array('images', MAX_FILES);

module.exports = { uploadListingImages: uploadListingImages };
