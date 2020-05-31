const jwt = require("jsonwebtoken");

class JwtService {
  constructor() {}

  // SIGN TOKEN
  sign(payload) {
    if (payload != null) {
      try {
        return jwt.sign({ ...payload }, process.env.SECRET, {
          expiresIn: process.env.TOKEN_LIFE,
        });
      } catch (error) {
        throw new Error(error);
      }
    } else {
      throw new Error("Invalid token!");
    }
  }

  // VERIFY TOKEN
  verify(authHeader) {
    if (authHeader != undefined) {
      const token = authHeader.split(" ")[1];
      try {
        return jwt.verify(token, process.env.SECRET);
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error("Invalid token!");
    }
  }

  // DECODE TOKEN
  decode(authHeader) {
    if (authHeader != undefined) {
      const token = authHeader.split(" ")[1];
      try {
        return jwt.decode(token);
      } catch (error) {
        throw new Error(error);
      }
    } else {
      throw new Error("Invalid token!");
    }
  }
}

module.exports = new JwtService();
