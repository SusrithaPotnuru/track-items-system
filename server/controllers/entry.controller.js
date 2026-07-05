const entryService = require('../services/entry.service');
const { sendSuccess } = require('../utils/responseHelper');
const { logAudit, auditFromReq } = require('../utils/auditHelper');

const getAll = async (req, res) => {
  const result = await entryService.getAll(req.query);
  return sendSuccess(res, 'Entries fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const entry = await entryService.getById(req.params.id);
  return sendSuccess(res, 'Entry fetched', entry);
};

const checkDate = async (req, res) => {
  const result = await entryService.checkDate(req.query);
  return sendSuccess(res, 'Date check complete', result);
};

const create = async (req, res) => {
  const entry = await entryService.create(req.body, req.user);
  logAudit({
    ...auditFromReq(req),
    action: 'CREATE',
    module: 'entry',
    status: 'success',
    details: { entryId: entry._id, date: entry.date, employeeId: entry.employee },
  });
  return sendSuccess(res, 'Entry created', entry, 201);
};

const update = async (req, res) => {
  const entry = await entryService.update(req.params.id, req.body, req.user);
  logAudit({
    ...auditFromReq(req),
    action: 'UPDATE',
    module: 'entry',
    status: 'success',
    details: { entryId: req.params.id },
  });
  return sendSuccess(res, 'Entry updated', entry);
};

const remove = async (req, res) => {
  await entryService.remove(req.params.id);
  logAudit({
    ...auditFromReq(req),
    action: 'DELETE',
    module: 'entry',
    status: 'success',
    details: { entryId: req.params.id },
  });
  return sendSuccess(res, 'Entry deleted');
};

const submit = async (req, res) => {
  const entry = await entryService.submit(req.params.id, req.user);
  logAudit({
    ...auditFromReq(req),
    action: 'SUBMIT',
    module: 'entry',
    status: 'success',
    details: { entryId: req.params.id },
  });
  return sendSuccess(res, 'Entry submitted', entry);
};

const approve = async (req, res) => {
  const entry = await entryService.approve(req.params.id, req.user);
  logAudit({
    ...auditFromReq(req),
    action: 'APPROVE',
    module: 'entry',
    status: 'success',
    details: { entryId: req.params.id },
  });
  return sendSuccess(res, 'Entry approved', entry);
};

const reject = async (req, res) => {
  const entry = await entryService.reject(req.params.id, req.body.rejectionReason, req.user);
  logAudit({
    ...auditFromReq(req),
    action: 'REJECT',
    module: 'entry',
    status: 'success',
    details: { entryId: req.params.id, reason: req.body.rejectionReason },
  });
  return sendSuccess(res, 'Entry rejected', entry);
};

module.exports = { getAll, getById, checkDate, create, update, remove, submit, approve, reject };
