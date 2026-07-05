const mongoose = require('mongoose');

const schedulerLogSchema = new mongoose.Schema(
  {
    jobType: { type: String, enum: ['report', 'daily-reminder', 'pending-approval'], default: 'report' },
    executedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['success', 'failed', 'running', 'skipped'], default: 'running' },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
    emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailHistory', default: null },
    durationMs: { type: Number, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

schedulerLogSchema.index({ executedAt: -1 });
schedulerLogSchema.index({ status: 1 });

module.exports = mongoose.model('SchedulerLog', schedulerLogSchema);
