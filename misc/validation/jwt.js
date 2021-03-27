const Joi = require("@hapi/joi");

/**
 * Validates the JWT token
 * @param {String} authHeader  Authorization header containing the JWT token
 * @returns {String} Error message, if any
 */
const validateToken = function validateJwtToken(authHeader) {
  return !/^(Bearer )[\w\-\.]{84,}$/.test(authHeader)
    ? "Authorization header must contain a valid JWT token"
    : undefined;
};

/**
 * Validates the payload data for creating the JWT token
 * @param {Object} payload Payload object to create the JWT token
 * @returns Error message, if any
 */
const validatePayload = function validateJwtPayload(payload) {
  return !payload || Object.keys(payload).length === 0
    ? "Payload must be a valid object with one or more properties"
    : undefined;
};

module.exports = { validateToken, validatePayload };
