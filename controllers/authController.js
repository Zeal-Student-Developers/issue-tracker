const bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");

const Error = require("../models/Error");
const jwtService = require("../services/JwtService");
const userService = require("../services/UserService");

const loginController = async (req, res) => {
  try {
    const { zprn, password } = req.body;
    const { error } = validateCredentials(zprn, password);
    if (error !== undefined) {
      res.status(401).send(new Error("BAD_REQUEST", error.details[0].message));
    } else {
      const user = await userService.getUserByZprn(Number(zprn));
      if (user == null) {
        res.status(401).send(new Error("BAD_REQUEST", "No user found"));
      } else {
        const match = bcrypt.compareSync(password, user.password);
        if (match) {
          let token = null;
          try {
            token = jwtService.sign({
              userID: user.id,
              department: user.department,
              role: user.role,
            });
          } catch (error) {
            res.status(403).send(new Error("FORBIDDEN", error.message));
            return;
          }
          res.status(200).json({
            code: "OK",
            result: "SUCCESS",
            token: token,
            refreshToken: user.refreshToken,
          });
        } else {
          res.status(403).send(new Error("FORBIDDEN", "Password incorrect!"));
        }
      }
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

const refreshTokenController = async (req, res) => {
  let userID = null;
  try {
    userID = jwtService.decode(req.headers["authorization"]).userID;
  } catch (error) {
    res.status(403).send(new Error("FORBIDDEN", error.message));
    return;
  }
  try {
    const user = await userService.getUserById(userID);
    if (user === null) {
      res.send(401).send(new Error("BAD_REQUEST", "No user found"));
      return;
    } else {
      if (user.refreshToken === req.body.refreshToken) {
        const token = jwtService.sign({
          userID: userID,
          department: user.department,
          role: user.role,
        });
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          token: token,
        });
      } else {
        res.send(403).send(new Error("FORBIDDEN", "Invalid refresh token"));
      }
    }
  } catch (error) {
    res.send(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

function validateCredentials(zprn, password) {
  const schema = Joi.object({
    zprn: Joi.string().required().length(7).regex(/^\d+$/),
    password: Joi.string().required().min(6),
  });
  return schema.validate({ zprn: zprn, password: password });
}

module.exports = { loginController, refreshTokenController };
