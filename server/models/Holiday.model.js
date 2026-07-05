const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true, unique: true },
    type: { type: String, enum: ['national', 'festival', 'company', 'emergency'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    description: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

holidaySchema.index({ type: 1 });
holidaySchema.index({ status: 1 });
holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
