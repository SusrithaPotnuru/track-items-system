const mongoose = require('mongoose');

const activityTimelineSchema = new mongoose.Schema({
  actionType: { type: String, required: true },
  entity: {
    type: String,
    enum: ['entry', 'report', 'employee', 'project', 'holiday', 'email', 'scheduler', 'department', 'user', 'settings'],
    required: true,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: null },
  userRole: { type: String, default: null },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  remarks: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

activityTimelineSchema.index({ entityId: 1 });
activityTimelineSchema.index({ entity: 1 });
activityTimelineSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityTimeline', activityTimelineSchema);
