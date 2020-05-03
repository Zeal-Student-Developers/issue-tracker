const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwtService = require("../services/JwtService");
const Error = require("../models/Error");
const Joi = require("@hapi/joi");

const userService = require("../services/UserService");

router.post("/login", (req, res) => {
    const { zprn, password } = req.body;
    const { error } = validateCredentials(zprn, password);
    if (error !== undefined) {
        res.status(400).send(
            new Error("BAD_REQUEST", error.details[0].message)
        );
    } else {
        userService
            .getUser(zprn)
            .then((user) => {
                bcrypt.compare(password, user.password, (error, match) => {
                    if (error) {
                        res.status(500).send(
                            new Error("INTERNAL_SERVER_ERROR", error)
                        );
                    } else {
                        if (match) {
                            const token = jwtService.sign({
                                userID: user.zprn, //? Should userID be added to JWT token?
                                department: user.department,
                            });

                            token != null
                                ? res.status(200).json({ token: token })
                                : res
                                      .status(500)
                                      .send(
                                          new Error(
                                              "INTERNAL_SERVER_ERROR",
                                              "Internal error occurred!"
                                          )
                                      );
                        } else {
                            res.status(401).send(
                                new Error("UNAUTHORIZED", "Password incorrect!")
                            );
                        }
                    }
                });
            })
            .catch(() => {
                res.status(400).send(
                    new Error("BAD_REQUEST", "User not found!")
                );
            });
    }
});

/*
 * VALIDATION FUNCTIONS
 */
function validateCredentials(zprn, password) {
    const schema = Joi.object({
        zprn: Joi.string().required().length(7),
        password: Joi.string().required().min(6),
    });
    return schema.validate({ zprn: zprn, password: password });
}

module.exports = router;
