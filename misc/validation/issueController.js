const Joi = require("@hapi/joi");

/**
 * Validates data from user for creating new issue
 * @param {String} title Title of the issue
 * @param {String} description Description of issue
 * @param {String} section Section of issue
 * @param {String} scope Issue scope
 */
const validateIssueData = (title, description, images, section, scope) => {
  const schema = Joi.object({
    title: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid title" })
      .required(),
    description: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid description" })
      .required(),
    images: Joi.array().max(3).required(),
    section: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid section" })
      .required(),
    scope: Joi.string()
      .regex(/^ORGANIZATION|DEPARTMENT$/i)
      .rule({ message: "Scope must be either 'ORGANIZATION' or 'DEPARTMENT'" })
      .required(),
  }).options({ abortEarly: false });

  const { error } = schema.validate({
    title,
    description,
    images,
    section,
    scope,
  });

  if (error) {
    const errors = {};
    error.details.forEach(({ path, message }) => (errors[path] = message));
    return errors;
  }

  return undefined;
};

const validateIssueUpdateData = ({ title, description }) => {
  return {
    title: title?.trim?.(),
    description: description?.trim?.(),
  };
};

module.exports = { validateIssueData, validateIssueUpdateData };
