const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // General
    companyName: { type: String, default: 'My Company' },
    companyLogo: { type: String, default: null },
    companyAddress: { type: String, default: null },
    companyPhone: { type: String, default: null },
    companyEmail: { type: String, default: null },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    language: { type: String, default: 'en' },
    // Productivity
    defaultWorkingHours: { type: Number, default: 8 },
    weekOffDays: { type: [Number], default: [0, 6] }, // 0=Sun, 6=Sat
    defaultReportFormat: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
    dailyTarget: { type: Number, default: 50 },
    weeklyTarget: { type: Number, default: 250 },
    monthlyTarget: { type: Number, default: 1000 },
    managerEmails: { type: [String], default: [] },
    // SMTP
    smtpHost: { type: String, default: null },
    smtpPort: { type: Number, default: 587 },
    smtpUsername: { type: String, default: null },
    smtpPassword: { type: String, default: null }, // AES encrypted
    senderEmail: { type: String, default: null },
    senderName: { type: String, default: null },
    // Security
    sessionTimeout: { type: Number, default: 30 },
    passwordMinLength: { type: Number, default: 8 },
    maxLoginAttempts: { type: Number, default: 5 },
    jwtExpiry: { type: String, default: '15m' },
    refreshTokenExpiry: { type: String, default: '7d' },
    // Scheduler
    schedulerEnabled: { type: Boolean, default: false },
    schedulerFrequency: { type: String, enum: ['weekly', 'monthly', 'custom'], default: 'weekly' },
    schedulerDay: { type: Number, default: 1 },
    schedulerTime: { type: String, default: '08:00' },
    schedulerCron: { type: String, default: null },
    // Daily reminder
    dailyReminderEnabled: { type: Boolean, default: false },
    dailyReminderTime: { type: String, default: '09:00' },
    // Pending approval reminder
    pendingApprovalEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
