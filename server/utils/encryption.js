const CryptoJS = require('crypto-js');

const SECRET = process.env.AES_SECRET_KEY || 'timesheetsecretk';

const encryptText = (plainText) => {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, SECRET).toString();
};

const decryptText = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};

module.exports = { encryptText, decryptText };
