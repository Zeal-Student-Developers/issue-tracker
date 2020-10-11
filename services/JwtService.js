const jwt = require("jsonwebtoken");

class JwtService {
  constructor() {}

  /**
   * Create a signed JWT token.
   * @param payload The payload object for the JWT token.
   * @returns Signed JWT token.
   */
  sign(payload) {
    if (
      payload === null ||
      payload === undefined ||
      Object.keys(payload).length === 0
    ) {
      throw new Error(
        "Payload must be a valid object with one or more properties."
      );
    } else {
      try {
        return jwt.sign(payload, process.env.SECRET, {
          expiresIn: process.env.TOKEN_LIFE,
        });
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * Verify the passed JWT token.
   * @param authHeader The authorization header of the request containing the JWT token.
   * @returns Decoded payload object if the JWT token is valid, else throws an error.
   */
  verify(authHeader) {
    if (
      authHeader === null ||
      authHeader === undefined ||
      !RegExp("^(Bearer )[\\w\\.]{84,}$").test(authHeader)
    ) {
      throw new Error("Authorization header must contain a valid JWT token.");
    } else {
      const token = authHeader.split(" ")[1];
      try {
        return jwt.verify(token, process.env.SECRET);
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * Decode the passed JWT token.
   * @param authHeader The authorization header of the request containing the JWT token.
   * @returns Decoded payload object passed at the time of creation of the token.
   */
  decode(authHeader) {
    if (
      authHeader === null ||
      authHeader === undefined ||
      !RegExp("^(Bearer )[\\w\\.]{84,}$").test(authHeader)
    ) {
      throw new Error("Authorization header must contain a valid JWT token.");
    } else {
      const token = authHeader.split(" ")[1];
      try {
        return jwt.decode(token);
      } catch (error) {
        throw error;
      }
    }
  }
}

module.exports = new JwtService();
