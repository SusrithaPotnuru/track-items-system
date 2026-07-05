const Project = require('../models/Project.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');

const OPTIONAL_FIELDS = ['department', 'startDate', 'endDate', 'status', 'priority', 'description'];

const sanitize = (data) => {
  const out = { ...data };
  OPTIONAL_FIELDS.forEach((f) => { if (out[f] === '' || out[f] === null) delete out[f]; });
  return out;
};

const getAll = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.department) filter.department = query.department;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { projectCode: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Project.find(filter)
      .populate('department', 'name code')
      .populate('assignedEmployees', 'name employeeId')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const project = await Project.findById(id)
    .populate('department', 'name code')
    .populate('assignedEmployees', 'name employeeId designation');
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  return project;
};

const create = async (data) => {
  const project = await Project.create(sanitize(data));
  return project;
};

const update = async (id, data) => {
  const project = await Project.findByIdAndUpdate(id, sanitize(data), { new: true, runValidators: true })
    .populate('department', 'name code')
    .populate('assignedEmployees', 'name employeeId');
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  return project;
};

const remove = async (id) => {
  const project = await Project.findByIdAndDelete(id);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
};

module.exports = { getAll, getById, create, update, remove };
