const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema(
  {
    to: { type: [String], required: true },
    cc: { type: [String], default: [] },
    bcc: { type: [String], default: [] },
    subject: { type: String, required: true },
    message: { type: String, default: null },
    attachmentPath: { type: String, default: null },
    attachmentName: { type: String, default: null },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    failureReason: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emailHistorySchema.index({ status: 1 });
emailHistorySchema.index({ sentAt: -1 });

module.exports = mongoose.model('EmailHistory', emailHistorySchema);
