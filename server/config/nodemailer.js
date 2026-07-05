const nodemailer = require('nodemailer');
const { decryptText } = require('../utils/encryption');

const createTransporter = (smtpSettings) => {
  const password = smtpSettings.smtpPassword
    ? decryptText(smtpSettings.smtpPassword)
    : '';

  return nodemailer.createTransport({
    host: smtpSettings.smtpHost,
    port: smtpSettings.smtpPort || 587,
    secure: smtpSettings.smtpPort === 465,
    auth: {
      user: smtpSettings.smtpUsername,
      pass: password,
    },
  });
};

module.exports = { createTransporter };
