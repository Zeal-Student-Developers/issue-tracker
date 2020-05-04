const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwtService = require("../services/JwtService");
const Error = require("../models/Error");
const Joi = require("@hapi/joi");

const userService = require("../services/UserService");

router.post("/login", (req, res) => {
    const { zprn, password } = req.body;
    const { error, value } = validateCredentials(zprn, password);
    if (error != undefined) {
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
                            const token = jwtService.sign(user.department);
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

router.post("/add", (req, res) => {
    const { zprn, firstName, lastName, password, department, role } = req.body;
    const { er, value } = validateData(
        zprn,
        firstName,
        lastName,
        password,
        department,
        role
    );
    if (er != undefined) {
        res.status(400).send(
            new Error("BAD_REQUEST", error.details[0].message)
        );
    } else {
        bcrypt.genSalt(10, (e, salt) => {
            if (!e) {
                bcrypt.hash(password, salt, (error, hash) => {
                    if (error) {
                        res.status(500).send(
                            new Error("INTERNAL_SERVER_ERROR", error)
                        );
                    } else {
                        if (!hash) {
                            res.status(500).send(
                                new Error(
                                    "INTERNAL_SERVER_ERROR",
                                    "An internal error occured!"
                                )
                            );
                        } else {
                            userService
                                .addUser(
                                    zprn,
                                    firstName,
                                    lastName,
                                    hash,
                                    department,
                                    role
                                )
                                .then(() => {
                                    res.status(20).json({
                                        code: "CREATED",
                                        msg: "User added",
                                    });
                                })
                                .catch((err) => {
                                    res.status(500).send(
                                        new Error("INTERNAL_SERVER_ERROR", err)
                                    );
                                });
                        }
                    }
                });
            }
            res.status(500).send(new Error("INTERNAL_SERVER_ERROR", e));
        });
    }
});

function validateCredentials(zprn, password) {
    const schema = Joi.object({
        zprn: Joi.string().required(),
        password: Joi.string().required(),
    });
    return schema.validate({ zprn: zprn, password: password });
}

function validateData(zprn, firstName, lastName, password, department, role) {
    const schema = Joi.object({
        zprn: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().required(),
        department: Joi.string().required(),
        role: Joi.string().required(),
    });

    return schema.validate({
        zprn: zprn,
        firstName: firstName,
        lastName: lastName,
        password: password,
        department: department,
        role: role,
    });
}

module.exports = router;
