const jwt = require("jsonwebtoken");

class JwtService {
    constructor() {}

    // SIGN TOKEN
    sign(data) {
        const token = jwt.sign({ ...data }, `${process.env.SECRET}`);
        return token;
    }

    // VERIFY TOKEN
    verify(authHeader) {
        if (authHeader != undefined) {
            const token = authHeader.split(" ")[1];
            try {
                return jwt.verify(token, `${process.env.SECRET}`);
            } catch (error) {
                return null;
            }
        }
    }
}

module.exports = new JwtService();
