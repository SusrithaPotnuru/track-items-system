const holidayService = require('../services/holiday.service');
const { sendSuccess } = require('../utils/responseHelper');

const getAll = async (req, res) => {
  const result = await holidayService.getAll(req.query);
  return sendSuccess(res, 'Holidays fetched', result.data, 200, result.pagination);
};

const getCalendar = async (req, res) => {
  const { year, month } = req.params;
  const data = await holidayService.getCalendar(parseInt(year), parseInt(month));
  return sendSuccess(res, 'Calendar fetched', data);
};

const getById = async (req, res) => {
  const h = await holidayService.getById(req.params.id);
  return sendSuccess(res, 'Holiday fetched', h);
};

const create = async (req, res) => {
  const h = await holidayService.create(req.body, req.user.id);
  return sendSuccess(res, 'Holiday created', h, 201);
};

const update = async (req, res) => {
  const h = await holidayService.update(req.params.id, req.body);
  return sendSuccess(res, 'Holiday updated', h);
};

const remove = async (req, res) => {
  await holidayService.remove(req.params.id);
  return sendSuccess(res, 'Holiday deleted');
};

module.exports = { getAll, getCalendar, getById, create, update, remove };
