const Settings = require('../models/Settings.model');
const { encryptText } = require('../utils/encryption');
const { buildCronExpression } = require('../utils/cronParser');
const schedulerService = require('./scheduler.service');

const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  const obj = settings.toObject();
  if (obj.smtpPassword) obj.smtpPassword = '**encrypted**';
  return obj;
};

const updateSection = async (section, data) => {
  const settings = await Settings.findOne();
  if (!settings) throw Object.assign(new Error('Settings not initialized'), { statusCode: 500 });

  if (section === 'smtp' && data.smtpPassword) {
    data.smtpPassword = encryptText(data.smtpPassword);
  }

  if (section === 'scheduler') {
    const freq = data.schedulerFrequency || settings.schedulerFrequency;
    const time = data.schedulerTime || settings.schedulerTime;
    const day = data.schedulerDay ?? settings.schedulerDay;
    data.schedulerCron = buildCronExpression(freq, time, day);
  }

  Object.assign(settings, data);
  await settings.save();

  if (section === 'scheduler') {
    if (settings.schedulerEnabled) {
      await schedulerService.startScheduler();
    } else {
      schedulerService.stopScheduler();
    }
  }

  return getSettings();
};

const testSmtp = async () => {
  const settings = await Settings.findOne();
  if (!settings?.smtpHost) throw Object.assign(new Error('SMTP not configured'), { statusCode: 400 });
  const { createTransporter } = require('../config/nodemailer');
  const transporter = createTransporter(settings);
  await transporter.verify();
  return { connected: true };
};

module.exports = { getSettings, updateSection, testSmtp };
