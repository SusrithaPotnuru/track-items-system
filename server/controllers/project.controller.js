const projectService = require('../services/project.service');
const { sendSuccess } = require('../utils/responseHelper');

const getAll = async (req, res) => {
  const result = await projectService.getAll(req.query);
  return sendSuccess(res, 'Projects fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const project = await projectService.getById(req.params.id);
  return sendSuccess(res, 'Project fetched', project);
};

const create = async (req, res) => {
  const project = await projectService.create(req.body);
  return sendSuccess(res, 'Project created', project, 201);
};

const update = async (req, res) => {
  const project = await projectService.update(req.params.id, req.body);
  return sendSuccess(res, 'Project updated', project);
};

const remove = async (req, res) => {
  await projectService.remove(req.params.id);
  return sendSuccess(res, 'Project deleted');
};

module.exports = { getAll, getById, create, update, remove };
