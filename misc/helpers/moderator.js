/**
 * Combines all strings from given array
 * @param {...String} strings array of Strings to combine strings from given
 * array
 * @returns {String} A single string combining all strings from array
 */
const combineStrings = function combineStringsFromArray(...strings) {
  console.log(strings);
  return strings.reduce((result, current) => {
    if (typeof current === "string") {
      result += current[current.length - 1] === "." ? current : current + ".";
    }

    return result;
  }, "");
};

module.exports = { combineStrings };
