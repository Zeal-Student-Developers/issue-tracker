const Joi = require("@hapi/joi");

/**
 * Validates user's login credentials
 * @param {String} userId User's ID
 * @param {String} password User Password
 * @returns Errors object, if any
 */
const validateCredentials = function (userId, password) {
  const schema = Joi.object({
    userId: Joi.string()
      .required()
      .length(7)
      .regex(/^\d+$/)
      .rule({ message: "Please provide a valid userId" }),
    password: Joi.string()
      .required()
      .min(6)
      .rule({ message: "Password must be atleast 6 characters long" }),
  });

  const { error } = schema.validate({ userId, password });

  if (error) {
    const errors = {};
    error.details.forEach(({ path, message }) => (errors[path] = message));
    return errors;
  }

  return undefined;
};

module.exports = { validateCredentials };
