const Joi = require("@hapi/joi");

/**
 * Validates data used for creating a new user
 * @param {String} userId User's ID
 * @param {String} firstName User's first name
 * @param {String} lastName User's last name
 * @param {String} password User's password
 * @param {String} department User's department
 * @param {String} role User's role
 * @returns {Object|undefined} Errors object, if any
 */
const validateUserData = function (
  userId,
  firstName,
  lastName,
  password,
  department,
  role
) {
  const schema = Joi.object({
    userId: Joi.string()
      .required()
      .length(7)
      .regex(/^\d+$/)
      .rule({ message: "Please enter a valid userId" }),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().required().min(6),
    department: Joi.string().required().min(3),
    role: Joi.string().required(),
  }).options({ abortEarly: false });

  const { error } = schema.validate({
    userId: userId,
    firstName: firstName,
    lastName: lastName,
    password: password,
    department: department,
    role: role,
  });

  if (error) {
    const errors = {};
    error.details.forEach(({ path, message }) => (errors[path] = message));
    return errors;
  }

  return undefined;
};

/**
 * Validates the passwords of the user before password update
 * @param {String} oldPassoword Old password of the user
 * @param {String} newPassword New password of the user
 * @returns Errors object, if any
 */
const validatePasswords = function (oldPassoword, newPassword) {
  const schema = Joi.object({
    _old: Joi.string().required(),
    _new: Joi.string()
      .required()
      .min(6)
      .rule({ message: "New password must be atleast 6 characters long" }),
  }).options({ abortEarly: false });

  const { error } = schema.validate({ _old: oldPassoword, _new: newPassword });

  if (error) {
    const errors = {};
    error.details.forEach(({ path, message }) => (errors[path] = message));
    return errors;
  }

  return undefined;
};

/**
 * Filters the properties that can be updated in the user
 * @param {Object} userObject User object containing multiple fields
 * @returns Object containing valid fields
 */
const validateUpdateUserData = function ({
  firstName,
  lastName,
  password,
  department,
  role,
}) {
  const userObject = { firstName, lastName, password, department, role };
  const user = {};
  for (const key in userObject) {
    if (!!userObject[key]?.trim?.()) {
      user[key] = userObject[key];
    }
  }

  return Object.keys(user).length > 0 ? user : undefined;
};

module.exports = {
  validateUserData,
  validatePasswords,
  validateUpdateUserData,
};
