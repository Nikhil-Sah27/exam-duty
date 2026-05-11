/**
 * Generate exam dates starting from startDate, skipping Sundays.
 * @param {Date|string} startDate
 * @param {number} requiredDays
 * @returns {{ dates: Date[], skippedSundays: Date[] }}
 */
function generateExamDates(startDate, requiredDays) {
  const dates = [];
  const skippedSundays = [];
  const current = new Date(startDate);

  while (dates.length < requiredDays) {
    if (current.getDay() === 0) {
      skippedSundays.push(new Date(current));
    } else {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return { dates, skippedSundays };
}

module.exports = { generateExamDates };
