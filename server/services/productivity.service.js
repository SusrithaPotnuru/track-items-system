const Settings = require('../models/Settings.model');
const Employee = require('../models/Employee.model');

const LEVELS = [
  { min: 90, label: 'Excellent', color: '#22c55e' },
  { min: 75, label: 'Very Good', color: '#84cc16' },
  { min: 60, label: 'Good', color: '#eab308' },
  { min: 40, label: 'Average', color: '#f97316' },
  { min: 0,  label: 'Needs Improvement', color: '#ef4444' },
];

const getLevel = (score) => LEVELS.find((l) => score >= l.min);

const calculateScore = (completedItems, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((completedItems / target) * 100));
};

const getEmployeeTargets = async (employeeId) => {
  const [emp, settings] = await Promise.all([
    Employee.findById(employeeId),
    Settings.findOne(),
  ]);
  return {
    daily: emp?.dailyTarget || settings?.dailyTarget || 50,
    weekly: emp?.weeklyTarget || settings?.weeklyTarget || 250,
    monthly: emp?.monthlyTarget || settings?.monthlyTarget || 1000,
  };
};

const computeProductivityScore = async (employeeId, totalItems, period = 'daily') => {
  const targets = await getEmployeeTargets(employeeId);
  const target = targets[period];
  const score = calculateScore(totalItems, target);
  return { score, level: getLevel(score), target };
};

module.exports = { calculateScore, getLevel, getEmployeeTargets, computeProductivityScore };
