const timelineService = require('../services/timeline.service');
const { sendSuccess } = require('../utils/responseHelper');

const getTimeline = async (req, res) => {
  const result = await timelineService.getTimeline(req.query);
  return sendSuccess(res, 'Timeline fetched', result.data, 200, result.pagination);
};

const getByEntityId = async (req, res) => {
  const result = await timelineService.getByEntityId(req.params.entityId, req.query);
  return sendSuccess(res, 'Entity timeline fetched', result.data, 200, result.pagination);
};

module.exports = { getTimeline, getByEntityId };
