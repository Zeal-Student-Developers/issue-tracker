const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwtService = require("../services/JwtService");
const Error = require("../models/Error");
const Joi = require("@hapi/joi");

const userService = require("../services/UserService");

router.post("/login", async (req, res) => {
    try {
        const { zprn, password } = req.body;
        const { error } = validateCredentials(zprn, password);
        if (error !== undefined) {
            res.status(401).send(
                new Error("BAD_REQUEST", error.details[0].message)
            );
        } else {
            const user = await userService.getUser(Number(zprn));
            if (user == null) {
                res.status(401).send(
                    new Error("BAD_REQUEST", "No user found.")
                );
            } else {
                const match = bcrypt.compareSync(password, user.password);
                if (match) {
                    let token = null;
                    try {
                        token = jwtService.sign({
                            userID: user.zprn,
                            department: user.department,
                        });
                    } catch (error) {
                        res.status(403).send(
                            new Error("FORBIDDEN", error.message)
                        );
                        return;
                    }
                    res.status(200).json({
                        code: "OK",
                        result: "SUCCESS",
                        token: token,
                    });
                } else {
                    res.status(403).send(
                        new Error("FORBIDDEN", "Password incorrect!")
                    );
                }
            }
        }
    } catch (error) {
        res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
});

/*
 * VALIDATION FUNCTIONS
 */
function validateCredentials(zprn, password) {
    const schema = Joi.object({
        zprn: Joi.string().required().length(7).regex(/^\d+$/),
        password: Joi.string().required().min(6),
    });
    return schema.validate({ zprn: zprn, password: password });
}

module.exports = router;
