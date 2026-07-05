const ActivityTimeline = require('../models/ActivityTimeline.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');

const recordEvent = async ({ actionType, entity, entityId, user, previousValue = null, newValue = null, remarks = null }) => {
  return ActivityTimeline.create({
    actionType,
    entity,
    entityId,
    userId: user?.id || null,
    userName: user?.fullName || null,
    userRole: user?.role || null,
    previousValue,
    newValue,
    remarks,
  });
};

const getTimeline = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.entity) filter.entity = query.entity;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.actionType) filter.actionType = query.actionType;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const [data, total] = await Promise.all([
    ActivityTimeline.find(filter).sort(sort).skip(skip).limit(limit),
    ActivityTimeline.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getByEntityId = async (entityId, query) => {
  return getTimeline({ ...query, entityId });
};

module.exports = { recordEvent, getTimeline, getByEntityId };
