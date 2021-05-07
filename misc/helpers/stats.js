const months = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December",
};

/**
 * Returns the name of month from it's index
 * @param {Number} month Number of month
 * @returns Name of month
 */
const getMonthName = function getMonthString(month) {
  return months[month];
};

module.exports = { getMonthName };
