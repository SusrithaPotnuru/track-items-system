const Holiday = require('../models/Holiday.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
const { stripTime } = require('../utils/dateUtils');

const sanitize = (data) => {
  const out = { ...data };
  if (out.description === '' || out.description === null) delete out.description;
  if (out.status === '') delete out.status;
  return out;
};

const getAll = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = { $regex: query.search, $options: 'i' };
  if (query.year) {
    const y = parseInt(query.year);
    filter.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31) };
  }

  const [data, total] = await Promise.all([
    Holiday.find(filter).sort(sort).skip(skip).limit(limit),
    Holiday.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getCalendar = async (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return Holiday.find({ date: { $gte: start, $lte: end }, status: 'active' }).sort({ date: 1 });
};

const getById = async (id) => {
  const h = await Holiday.findById(id);
  if (!h) throw Object.assign(new Error('Holiday not found'), { statusCode: 404 });
  return h;
};

const create = async (data, userId) => {
  return Holiday.create({ ...sanitize(data), createdBy: userId });
};

const update = async (id, data) => {
  const h = await Holiday.findByIdAndUpdate(id, sanitize(data), { new: true, runValidators: true });
  if (!h) throw Object.assign(new Error('Holiday not found'), { statusCode: 404 });
  return h;
};

const remove = async (id) => {
  const h = await Holiday.findByIdAndDelete(id);
  if (!h) throw Object.assign(new Error('Holiday not found'), { statusCode: 404 });
};

const isHoliday = async (date) => {
  const d = stripTime(new Date(date));
  return Holiday.findOne({ date: d, status: 'active' });
};

module.exports = { getAll, getCalendar, getById, create, update, remove, isHoliday };
