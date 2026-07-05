const Department = require('../models/Department.model');
const Employee = require('../models/Employee.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');

const getAll = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = { $regex: query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Department.find(filter).sort(sort).skip(skip).limit(limit),
    Department.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const dept = await Department.findById(id);
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  return dept;
};

const create = async (data) => {
  const dept = await Department.create(data);
  return dept;
};

const update = async (id, data) => {
  const dept = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  return dept;
};

const remove = async (id) => {
  const inUse = await Employee.exists({ department: id });
  if (inUse) throw Object.assign(new Error('Cannot delete: employees are assigned to this department'), { statusCode: 409 });
  const dept = await Department.findByIdAndDelete(id);
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
};

module.exports = { getAll, getById, create, update, remove };
