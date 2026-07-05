const Employee = require('../models/Employee.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');

const getAll = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.department) filter.department = query.department;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { employeeId: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Employee.find(filter).populate('department', 'name code').sort(sort).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const emp = await Employee.findById(id).populate('department', 'name code');
  if (!emp) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  return emp;
};

const create = async (data) => Employee.create(data);

const update = async (id, data) => {
  const emp = await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('department', 'name code');
  if (!emp) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  return emp;
};

const remove = async (id) => {
  const emp = await Employee.findByIdAndDelete(id);
  if (!emp) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
};

const updatePhoto = async (id, photoPath) => {
  return Employee.findByIdAndUpdate(id, { photo: photoPath }, { new: true });
};

module.exports = { getAll, getById, create, update, remove, updatePhoto };
