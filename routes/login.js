const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const jwtService = require("../services/JwtService");

const userService = require("../services/UserService");

router.get("/", (req, res) => {
    userService
        .getAllUsers()
        .then((users) => {
            res.json({ users: users });
        })
        .catch(() => {
            res.json({ msg: "no user" });
        });
});

router.get("/verify", (req, res) => {
    const user = jwtService.verify(req.headers["authorization"]);
    user != undefined
        ? res.status(200).json({ msg: "verified" })
        : res.status(401).json({ msg: "unauthorized" });
});

router.post("/login", (req, res) => {
    const { zprn, password } = req.body;
    if (zprn === undefined || password === undefined) {
        res.status(401).json({ msg: "unauthorized" });
    } else {
        userService
            .getUser(zprn)
            .then((user) => {
                if (user != undefined) {
                    bcrypt.compare(password, user.password, (error, match) => {
                        if (error) {
                            res.status(500).json({ msg: "Error occured" });
                        } else {
                            if (match) {
                                const token = jwtService.sign(user.department);
                                token != null
                                    ? res.status(200).json({ token: token })
                                    : res.status(500).json({ msg: "Error!" });
                            } else {
                                res.status(401).json({
                                    msg: "Password doesn't match!",
                                });
                            }
                        }
                    });
                } else {
                    res.status(200).json({ msg: "Not Found!" });
                }
            })
            .catch(() => {
                res.status(401).json({ msg: "User not found!" });
            });
    }
});

router.post("/add", (req, res) => {
    const { zprn, firstName, lastName, password, department, role } = req.body;
    bcrypt.genSalt(10, (e, salt) => {
        if (!e) {
            bcrypt.hash(password, salt, (error, hash) => {
                if (error) {
                    res.status(500).json({ msg: error });
                } else {
                    if (!hash) {
                        res.status(500).json({ msg: "error" });
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
                            .then((user) => {
                                res.status(200).json({
                                    msg: "User added",
                                    user: user,
                                });
                            })
                            .catch((err) => {
                                res.status(200).json({ msg: err });
                            });
                    }
                }
            });
        }
        res.status(500).json({ msg: e });
    });
});

module.exports = router;
