const router = require("express").Router();
const bcrypt = require("bcryptjs");
const Error = require("../models/Error");
const Joi = require("@hapi/joi");
const jwtService = require("../services/JwtService");
const userService = require("../services/UserService");

/*
 * GET USER INFO
 * [Only loggedIn user can see their info. The userID of loggedIn user is stored in the JWT token itself]
 */
router.get(
  "/",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("readOwn", "profile"),
  async (req, res) => {
    userID = req.user.zprn;
    try {
      const user = await userService.getUser(userID);
      if (user == null) {
        res.status(401).json(new Error("BAD_REQUEST", "No user found!"));
      } else {
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          user: {
            zprn: user.zprn,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department,
          },
        });
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);

router.post(
  "/add",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("createAny", "profile"),
  async (req, res) => {
    let { zprn, firstName, lastName, password, department, role } = req.body;
    try {
      const { error } = validateData(
        zprn,
        firstName,
        lastName,
        password,
        department,
        role
      );
      if (error != undefined) {
        res
          .status(401)
          .send(new Error("BAD_REQUEST", error.details[0].message));
      } else {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        await userService.addUser(
          zprn,
          firstName,
          lastName,
          hashedPassword,
          department,
          role
        );
        res.status(201).json({
          code: "CREATED",
          msg: "User added!",
          result: "SUCCESS",
        });
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);

router.patch(
  "/update/password",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateOwn", "profile"),
  async (req, res) => {
    userID = req.user.zprn;
    try {
      const { oldPassword, newPassword } = req.body;
      const { error } = validatePassword(oldPassword, newPassword);
      if (error !== undefined) {
        res
          .status(401)
          .send(new Error("BAD_REQUEST", error.details[0].message));
      } else {
        if (oldPassword === newPassword) {
          res
            .status(401)
            .send(
              new Error(
                "BAD_REQUEST",
                "New password should be different from previous password."
              )
            );
          return;
        }
        try {
          const user = await userService.getUser(userID);
          const match = bcrypt.compareSync(oldPassword, user.password);
          if (match) {
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            await userService.updateUser({
              zprn: userID,
              password: hashedPassword,
            });
            res.status(200).json({
              code: "OK",
              result: "SUCCESS",
              msg: "Password updated!",
            });
          } else {
            res
              .status(401)
              .send(new Error("BAD_REQUEST", "Incorrect Password"));
          }
        } catch (err) {
          res.status(401).send(new Error("BAD_REQUEST", err.message));
        }
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);

/*
 * USER: UPDATE PROFILE DETAILS
 * [firstName,lastName & department only]
 */
router.post(
  "/update/profile",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateOwn", "profile"),
  async (req, res) => {
    userID = req.user.zprn;
    try {
      if (JSON.stringify(req.body) === "{}") {
        res.status(401).send(new Error("BAD_REQUEST", "Insufficient data."));
      } else {
        const { firstName, lastName, department } = req.body;
        await userService.updateUser({
          zprn: userID,
          firstName: firstName,
          lastName: lastName,
          department: department,
        });
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          msg: "User updated!",
        });
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);
/*
 * AUTHORITY: UPDATE USER DETAILS [ALL]
 */
router.post(
  "/update/profile/:userID",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateAny", "profile"),
  async (req, res) => {
    try {
      if (JSON.stringify(req.body) === "{}") {
        res
          .status(401)
          .send(new Error("BAD_REQUEST", "Required fields not provided"));
      } else {
        const password = req.body.password;
        const hashedPassword =
          password != undefined ? bcrypt.hashSync(password, 10) : password;
        await userService.updateUser({
          zprn: Number(req.body.zprn),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: hashedPassword,
          department: req.body.department,
          role: req.body.role,
        });
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          msg: "User updated!",
        });
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);

/**
 * Todo : Check if user is already deleted and return an error if is already
 *        deleted.
 */
router.delete(
  "/:userID",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("deleteAny", "profile"),
  async (req, res) => {
    try {
      const user = await userService.deleteUser(Number(req.params.userID));
      if (user == null) {
        res.status(401).send(new Error("BAD_REQUEST", "No user found."));
      } else {
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          deleted: user,
        });
      }
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  }
);

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
