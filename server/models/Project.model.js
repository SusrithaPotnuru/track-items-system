const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
      default: 'planning',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ department: 1 });

module.exports = mongoose.model('Project', projectSchema);
