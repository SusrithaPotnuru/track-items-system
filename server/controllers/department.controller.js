const deptService = require('../services/department.service');
const { sendSuccess } = require('../utils/responseHelper');

const getAll = async (req, res) => {
  const result = await deptService.getAll(req.query);
  return sendSuccess(res, 'Departments fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const dept = await deptService.getById(req.params.id);
  return sendSuccess(res, 'Department fetched', dept);
};

const create = async (req, res) => {
  const dept = await deptService.create(req.body);
  return sendSuccess(res, 'Department created', dept, 201);
};

const update = async (req, res) => {
  const dept = await deptService.update(req.params.id, req.body);
  return sendSuccess(res, 'Department updated', dept);
};

const remove = async (req, res) => {
  await deptService.remove(req.params.id);
  return sendSuccess(res, 'Department deleted');
};

module.exports = { getAll, getById, create, update, remove };
