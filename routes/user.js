const router = require("express").Router();
const bcrypt = require("bcryptjs");
const Error = require("../models/Error");
const Joi = require("@hapi/joi");
const jwtService = require("../services/JwtService");

const userService = require("../services/UserService");

router
    .route("/")
    .post((req, res) => {
        let {
            zprn,
            firstName,
            lastName,
            password,
            department,
            role,
        } = req.body;
        const { error } = validateData(
            zprn,
            firstName,
            lastName,
            password,
            department,
            role
        );
        if (error != undefined) {
            const errors = [];
            error.details.forEach((er) => {
                errors.push(er.message);
            });
            res.status(401).send(new Error("BAD_REQUEST", errors));
        } else {
            bcrypt
                .genSalt(10)
                .then((salt) => {
                    bcrypt
                        .hash(password, salt)
                        .then((hash) => {
                            userService
                                .addUser(
                                    Number(zprn),
                                    firstName,
                                    lastName,
                                    hash,
                                    department,
                                    role
                                )
                                .then(() => {
                                    res.status(201).json({
                                        code: "CREATED",
                                        msg: "User added!",
                                        result: "SUCCESS",
                                    });
                                })
                                .catch((e) => {
                                    res.status(500).json({
                                        code: "INTERNAL_SERVER_ERROR",
                                        msg: e,
                                    });
                                });
                        })
                        .catch((er) => {
                            res.status(500).json({
                                code: "INTERNAL_SERVER_ERROR",
                                msg: er,
                            });
                        });
                })
                .catch((err) => {
                    res.status(500).json({
                        code: "INTERNAL_SERVER_ERROR",
                        msg: err,
                    });
                });
        }
    })
    .patch((req, res) => {
        const { userID } = jwtService.verify(req.headers["authorization"]);
        const { oldPassword, newPassword } = req.body;
        const { error } = validatePassword(oldPassword, newPassword);
        if (error !== undefined) {
            const errors = [];
            error.details.forEach((er) => {
                errors.push(er.message);
            });
            res.status(401).send(new Error("BAD_REQUEST", errors));
        } else {
            userService
                .getUser(userID)
                .then((user) => {
                    bcrypt
                        .compare(oldPassword, user.password)
                        .then(() => {
                            bcrypt
                                .genSalt(10)
                                .then((salt) => {
                                    bcrypt
                                        .hash(newPassword, salt)
                                        .then((hash) => {
                                            userService
                                                .updateUser(userID, hash)
                                                .then(() => {
                                                    res.status(200).json({
                                                        code: "OK",
                                                        msg:
                                                            "Password updated!",
                                                        result: "SUCCESS",
                                                    });
                                                })
                                                .catch(() => {
                                                    res.status(500).send(
                                                        new Error(
                                                            "INTERNAL_SERVER_ERROR",
                                                            "Password updation failed!"
                                                        )
                                                    );
                                                });
                                        });
                                })
                                .catch((e) => {
                                    res.status(500).send(
                                        new Error("INTERNAL_SERVER_ERROR", e)
                                    );
                                });
                        })
                        .catch(() => {
                            res.status(401).send(
                                new Error("BAD_REQUEST", "Password incorrect!")
                            );
                        });
                })
                .catch((err) => {
                    res.status(401).send(new Error("BAD_REQUEST", err));
                });
        }
    });

/*
 * VALIDATION FUNCTIONS
 */

function validateData(zprn, firstName, lastName, password, department, role) {
    const schema = Joi.object({
        zprn: Joi.string().required().length(7).regex(/^\d+$/),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().required().min(6),
        department: Joi.string().required().min(3),
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

function validatePassword(old, newPassword) {
    const schema = Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required().min(6),
    });

    return schema.validate({ oldPassword: old, newPassword: newPassword });
}

module.exports = router;
