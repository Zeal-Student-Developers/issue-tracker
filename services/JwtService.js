const jwt = require("jsonwebtoken");
const config = require("../config");

class JwtService {
    constructor() {}

    // SIGN TOKEN
    sign(data) {
        const token = jwt.sign({ data }, config.SECRET);
        return token;
    }

    // VERIFY TOKEN
    verify(authHeader) {
        if (authHeader != undefined && authHeader != null) {
            const token = authHeader.split(" ")[1];
            try {
                return jwt.verify(token, config.SECRET);
            } catch (error) {
                return null;
            }
        }
    }
}

module.exports = new JwtService();
