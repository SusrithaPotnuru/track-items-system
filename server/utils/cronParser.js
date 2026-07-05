/**
 * Builds a cron expression from scheduler settings.
 * schedulerTime format: "HH:MM"
 * schedulerDay: 0-6 for weekly (0=Sun), 1-31 for monthly
 */
const buildCronExpression = (frequency, time, day) => {
  const [hour, minute] = (time || '08:00').split(':');
  switch (frequency) {
    case 'weekly':
      return `${minute} ${hour} * * ${day ?? 1}`; // default Monday
    case 'monthly':
      return `${minute} ${hour} ${day ?? 1} * *`; // default 1st of month
    default:
      return null;
  }
};

module.exports = { buildCronExpression };
