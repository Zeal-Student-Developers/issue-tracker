const jwt = require("jsonwebtoken");
const { validateToken, validatePayload } = require("../misc/validation/jwt");

const { TOKEN_LIFE, JWT_SECRET } = require("../config");

class JwtService {
  constructor() {}

  /**
   * Create a signed JWT token.
   * @param {Object} payload The payload object for the JWT token.
   * @returns {String} Signed JWT token.
   */
  sign(payload) {
    const error = validatePayload(payload);
    if (error) {
      throw new Error(error);
    } else {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_LIFE,
      });
    }
  }

  /**
   * Verify the passed JWT token.
   * @param {String} authHeader The authorization header of the request containing the JWT token.
   * @returns Decoded payload object if the JWT token is valid, else throws an error.
   */
  verify(authHeader) {
    const error = validateToken(authHeader);
    if (error) {
      throw new Error(error);
    } else {
      const token = authHeader.split(" ")[1];
      return jwt.verify(token, JWT_SECRET);
    }
  }

  /**
   * Decode the passed JWT token.
   * @param {String} authHeader The authorization header of the request containing the JWT token.
   * @returns Decoded payload object passed at the time of creation of the token.
   */
  decode(authHeader) {
    const error = validateToken(authHeader);
    if (error) {
      throw new Error(error);
    } else {
      const token = authHeader.split(" ")[1];
      return jwt.decode(token);
    }
  }
}

module.exports = new JwtService();
