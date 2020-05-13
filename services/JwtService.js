const jwt = require("jsonwebtoken");

class JwtService {
    constructor() {}

    // SIGN TOKEN
    sign(data) {
        if (data != null) {
            try {
                return jwt.sign({ ...data }, process.env.SECRET);
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
                throw new Error(error);
            }
        } else {
            throw new Error("Invalid token!");
        }
    }
}

module.exports = new JwtService();
