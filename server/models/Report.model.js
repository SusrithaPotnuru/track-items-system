const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportName: { type: String, required: true, trim: true },
    reportType: { type: String, enum: ['weekly', 'monthly', 'custom'], required: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    week: { type: Number, default: null },
    month: { type: Number, default: null },
    year: { type: Number, default: null },
    format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    generatedAt: { type: Date, default: Date.now },
    filePath: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ reportType: 1 });
reportSchema.index({ year: 1, month: 1 });
reportSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
