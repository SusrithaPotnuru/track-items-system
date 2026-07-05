const Entry = require('../models/Entry.model');
const Employee = require('../models/Employee.model');
const Project = require('../models/Project.model');
const Settings = require('../models/Settings.model');
const Holiday = require('../models/Holiday.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
const { stripTime, isFutureDate } = require('../utils/dateUtils');

// ── Helpers ────────────────────────────────────────────────────────────────────

const validateEntryDate = async (date, employeeId, excludeId = null) => {
  const d = stripTime(new Date(date));

  if (isFutureDate(d)) {
    throw Object.assign(new Error('Cannot create entry for a future date'), { statusCode: 400 });
  }

  // Only active holidays block entry creation
  const holiday = await Holiday.findOne({ date: d, status: 'active' });
  if (holiday) {
    throw Object.assign(new Error(`${d.toDateString()} is a holiday: ${holiday.name}`), { statusCode: 400 });
  }

  const settings = await Settings.findOne();
  const weekOffDays = settings?.weekOffDays || [0, 6];
  if (weekOffDays.includes(d.getDay())) {
    throw Object.assign(new Error(`${d.toDateString()} is a week-off day`), { statusCode: 400 });
  }

  const existingQuery = { employee: employeeId, date: d };
  if (excludeId) existingQuery._id = { $ne: excludeId };
  const existing = await Entry.findOne(existingQuery);
  if (existing) {
    throw Object.assign(new Error('An entry already exists for this employee on this date'), { statusCode: 409 });
  }

  return d;
};

const validateTotalHours = (tasks) => {
  const total = tasks.reduce((sum, t) => sum + Number(t.workingHours || 0), 0);
  if (total > 24) {
    throw Object.assign(
      new Error(`Total working hours (${total.toFixed(1)}h) cannot exceed 24 hours in a day`),
      { statusCode: 400 }
    );
  }
};

const addHistory = (entry, action, fromStatus, toStatus, actor, note = null) => {
  entry.history.push({
    action,
    fromStatus,
    toStatus,
    byUser: actor?.id || null,
    byName: actor?.fullName || null,
    at: new Date(),
    note,
  });
};

// ── Service functions ──────────────────────────────────────────────────────────

const getAll = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.employee) filter.employee = query.employee;
  if (query.project) filter.project = query.project;
  if (query.department) filter.department = query.department;
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = stripTime(new Date(query.startDate));
    if (query.endDate) {
      const end = stripTime(new Date(query.endDate));
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const [data, total] = await Promise.all([
    Entry.find(filter)
      .populate('employee', 'name employeeId')
      .populate('department', 'name')
      .populate('project', 'name projectCode')
      .populate('createdBy', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Entry.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const entry = await Entry.findById(id)
    .populate('employee', 'name employeeId designation')
    .populate('department', 'name code')
    .populate('project', 'name projectCode')
    .populate('createdBy', 'fullName')
    .populate('submittedBy', 'fullName')
    .populate('approvedBy', 'fullName')
    .populate('rejectedBy', 'fullName')
    .populate('history.byUser', 'fullName');
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  return entry;
};

const checkDate = async (query) => {
  const { date, employeeId } = query;
  if (!date || !employeeId) {
    throw Object.assign(new Error('date and employeeId are required'), { statusCode: 400 });
  }

  const d = stripTime(new Date(date));
  const [holiday, settings, existing] = await Promise.all([
    Holiday.findOne({ date: d, status: 'active' }), // only active holidays
    Settings.findOne(),
    Entry.findOne({ employee: employeeId, date: d }),
  ]);

  const weekOffDays = settings?.weekOffDays || [0, 6];
  return {
    date: d,
    isHoliday: !!holiday,
    holidayName: holiday?.name || null,
    isWeekOff: weekOffDays.includes(d.getDay()),
    isFuture: isFutureDate(d),
    entryExists: !!existing,
    existingEntryId: existing?._id || null,
  };
};

const create = async (data, actor) => {
  const { date, employee: employeeId, project: projectId, tasks } = data;

  validateTotalHours(tasks);
  const cleanDate = await validateEntryDate(date, employeeId);

  const [emp, proj] = await Promise.all([
    Employee.findById(employeeId),
    Project.findById(projectId),
  ]);
  if (!emp || emp.status === 'inactive') {
    throw Object.assign(new Error('Employee not found or inactive'), { statusCode: 404 });
  }
  if (!proj || proj.status === 'cancelled') {
    throw Object.assign(new Error('Project not found or cancelled'), { statusCode: 404 });
  }

  // Fetch productivity target: employee override → settings default → 50
  const settings = await Settings.findOne();
  const dailyTargetSnapshot = emp.dailyTarget || settings?.dailyTarget || 50;

  const entry = new Entry({
    ...data,
    date: cleanDate,
    department: emp.department,
    dailyTargetSnapshot,
    createdBy: actor.id,
  });

  addHistory(entry, 'created', null, 'draft', actor);
  return entry.save();
};

const update = async (id, data, actor) => {
  const entry = await Entry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  if (!['draft', 'rejected'].includes(entry.status)) {
    throw Object.assign(
      new Error(`Cannot edit an entry with status: ${entry.status}`),
      { statusCode: 400 }
    );
  }

  const { date, tasks } = data;
  // employee and project are intentionally ignored — they cannot change after creation

  if (tasks !== undefined) {
    validateTotalHours(tasks);
    entry.tasks = tasks;
  }

  if (date) {
    const cleanDate = await validateEntryDate(date, entry.employee.toString(), id);
    entry.date = cleanDate;
  }

  addHistory(entry, 'updated', entry.status, entry.status, actor);
  return entry.save();
};

const remove = async (id) => {
  const entry = await Entry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  if (entry.status !== 'draft') {
    throw Object.assign(new Error('Only draft entries can be deleted'), { statusCode: 400 });
  }
  await entry.deleteOne();
};

const submit = async (id, actor) => {
  const entry = await Entry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  if (!['draft', 'rejected'].includes(entry.status)) {
    throw Object.assign(
      new Error('Only draft or rejected entries can be submitted'),
      { statusCode: 400 }
    );
  }
  const fromStatus = entry.status;
  entry.status = 'submitted';
  entry.submittedBy = actor.id;
  entry.submittedAt = new Date();
  entry.rejectionReason = null;
  addHistory(entry, 'submitted', fromStatus, 'submitted', actor);
  return entry.save();
};

const approve = async (id, actor) => {
  const entry = await Entry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  if (entry.status !== 'submitted') {
    throw Object.assign(new Error('Only submitted entries can be approved'), { statusCode: 400 });
  }
  entry.status = 'approved';
  entry.approvedBy = actor.id;
  entry.approvedAt = new Date();
  addHistory(entry, 'approved', 'submitted', 'approved', actor);
  return entry.save();
};

const reject = async (id, reason, actor) => {
  const entry = await Entry.findById(id);
  if (!entry) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
  if (entry.status !== 'submitted') {
    throw Object.assign(new Error('Only submitted entries can be rejected'), { statusCode: 400 });
  }
  entry.status = 'rejected';
  entry.rejectionReason = reason;
  entry.rejectedBy = actor.id;
  entry.rejectedAt = new Date();
  addHistory(entry, 'rejected', 'submitted', 'rejected', actor, reason);
  return entry.save();
};

module.exports = { getAll, getById, create, update, remove, submit, approve, reject, checkDate };
