const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const storage = (dest) =>
  multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads', dest),
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(8).toString('hex');
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

const uploadLogo = multer({ storage: storage('logos'), fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadEmployeePhoto = multer({ storage: storage('employees'), fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadProfilePhoto = multer({ storage: storage('profiles'), fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadLogo, uploadEmployeePhoto, uploadProfilePhoto };
