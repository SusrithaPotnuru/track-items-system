const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['created', 'updated', 'submitted', 'approved', 'rejected'], required: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    byUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, default: null },
    at: { type: Date, default: Date.now },
    note: { type: String, default: null },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true, trim: true },
  description: { type: String, default: null },
  completedItems: { type: Number, required: true, min: 0 },
  workingHours: { type: Number, required: true, min: 0, max: 24 },
  remarks: { type: String, default: null },
});

const getPerformanceLevel = (score) => {
  if (score >= 100) return 'Excellent';
  if (score >= 90) return 'Very Good';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  return 'Needs Improvement';
};

const entrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    tasks: {
      type: [taskSchema],
      required: true,
      validate: { validator: (v) => v.length > 0, message: 'At least one task is required' },
    },
    totalItems: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    avgItemsPerHour: { type: Number, default: 0 },
    avgHoursPerTask: { type: Number, default: 0 },
    dailyTargetSnapshot: { type: Number, default: 50 },
    productivityScore: { type: Number, default: 0 },
    performanceLevel: { type: String, default: 'Needs Improvement' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    rejectionReason: { type: String, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

entrySchema.index({ employee: 1, date: 1 }, { unique: true });
entrySchema.index({ date: 1 });
entrySchema.index({ status: 1 });
entrySchema.index({ project: 1 });
entrySchema.index({ department: 1 });

entrySchema.pre('save', async function () {
  this.totalItems = this.tasks.reduce((sum, t) => sum + t.completedItems, 0);
  this.totalHours = this.tasks.reduce((sum, t) => sum + t.workingHours, 0);
  this.avgItemsPerHour = this.totalHours > 0 ? +(this.totalItems / this.totalHours).toFixed(2) : 0;
  this.avgHoursPerTask = this.tasks.length > 0 ? +(this.totalHours / this.tasks.length).toFixed(2) : 0;
  const target = this.dailyTargetSnapshot > 0 ? this.dailyTargetSnapshot : 50;
  this.productivityScore = +((this.totalItems / target) * 100).toFixed(2);
  this.performanceLevel = getPerformanceLevel(this.productivityScore);
});

module.exports = mongoose.model('Entry', entrySchema);
