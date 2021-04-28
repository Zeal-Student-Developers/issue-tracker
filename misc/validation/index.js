const jwtValidations = require("./jwt");
const authValidations = require("./authController");
const userValidations = require("./userController");
const issueValidations = require("./issueController");

module.exports = {
  jwtValidations,
  authValidations,
  userValidations,
  issueValidations,
};
