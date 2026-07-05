const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/responseHelper');
const { logAudit, auditFromReq } = require('../utils/auditHelper');

const getAll = async (req, res) => {
  const result = await employeeService.getAll(req.query);
  return sendSuccess(res, 'Employees fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const emp = await employeeService.getById(req.params.id);
  return sendSuccess(res, 'Employee fetched', emp);
};

const create = async (req, res) => {
  const emp = await employeeService.create(req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'CREATE',
    module: 'employee',
    status: 'success',
    details: { employeeId: emp.employeeId, name: emp.name },
  });
  return sendSuccess(res, 'Employee created', emp, 201);
};

const update = async (req, res) => {
  const emp = await employeeService.update(req.params.id, req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'UPDATE',
    module: 'employee',
    status: 'success',
    details: { id: req.params.id, fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'Employee updated', emp);
};

const remove = async (req, res) => {
  await employeeService.remove(req.params.id);
  logAudit({
    ...auditFromReq(req),
    action: 'DELETE',
    module: 'employee',
    status: 'success',
    details: { id: req.params.id },
  });
  return sendSuccess(res, 'Employee deleted');
};

const uploadPhoto = async (req, res) => {
  if (!req.file) {
    const err = new Error('No file uploaded'); err.statusCode = 400; throw err;
  }
  const photoPath = `/uploads/employees/${req.file.filename}`;
  const emp = await employeeService.updatePhoto(req.params.id, photoPath);
  return sendSuccess(res, 'Photo uploaded', { photo: emp.photo });
};

module.exports = { getAll, getById, create, update, remove, uploadPhoto };
