const Employee = require('../models/Employee.model');
const Project = require('../models/Project.model');
const Department = require('../models/Department.model');
const Report = require('../models/Report.model');
const Holiday = require('../models/Holiday.model');
const { sendSuccess } = require('../utils/responseHelper');

const search = async (req, res) => {
  const { q, type } = req.query;
  if (!q || q.trim().length < 2) {
    return sendSuccess(res, 'Search results', []);
  }

  const regex = { $regex: q.trim(), $options: 'i' };
  const results = [];

  const runSearch = async (model, filter, labelField, entity) => {
    const docs = await model.find(filter).limit(5).lean();
    docs.forEach((d) => results.push({ entity, id: d._id, label: d[labelField], raw: d }));
  };

  if (!type || type === 'employee') await runSearch(Employee, { $or: [{ name: regex }, { employeeId: regex }] }, 'name', 'employee');
  if (!type || type === 'project') await runSearch(Project, { $or: [{ name: regex }, { projectCode: regex }] }, 'name', 'project');
  if (!type || type === 'department') await runSearch(Department, { name: regex }, 'name', 'department');
  if (!type || type === 'report') await runSearch(Report, { reportName: regex }, 'reportName', 'report');
  if (!type || type === 'holiday') await runSearch(Holiday, { name: regex }, 'name', 'holiday');

  return sendSuccess(res, 'Search results', results);
};

module.exports = { search };
