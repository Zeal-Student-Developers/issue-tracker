const bcrypt = require("bcryptjs");

const { Error } = require("../models");

const {
  UserService: { getUserByUserId, getUserById },
  JwtService: { sign, decode },
} = require("../services");

const {
  authValidations: { validateCredentials },
} = require("../misc/validation");

/**
 * Controller for handling login
 * @param {Request} req
 * @param {Response} res
 */
const loginController = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const errors = validateCredentials(userId, password);
    if (errors) {
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
      const user = await getUserByUserId(userId);
      if (!user) {
        res.status(400).send(new Error("BAD_REQUEST", "No user found"));
      } else {
        if (user.isDisabled) {
          return res
            .status(403)
            .send(
              new Error(
                "FORBIDDEN",
                "You have been blocked by the system for repeated violations of the Code of Conduct"
              )
            );
        }
        const match = bcrypt.compareSync(password, user.password);
        if (match) {
          let token = null;
          try {
            token = sign({
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
          res.status(403).send(new Error("FORBIDDEN", "Password incorrect"));
        }
      }
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller for handling refresh JWT token
 * @param {Request} req
 * @param {Response} res
 */
const refreshTokenController = async (req, res) => {
  let userID = null;
  try {
    userID = decode(req.headers["authorization"]).userID;
  } catch (error) {
    res.status(403).send(new Error("FORBIDDEN", error.message));
    return;
  }
  try {
    const user = await getUserById(userID);
    if (!user) {
      res.send(401).send(new Error("BAD_REQUEST", "No user found"));
    } else {
      if (user.isDisabled) {
        return res
          .status(403)
          .send(
            new Error(
              "FORBIDDEN",
              "You have been blocked by the system for repeated violations of the Code of Conduct"
            )
          );
      }
      if (user.refreshToken === req.body.refreshToken) {
        const token = sign({
          userID: userID,
          department: user.department,
          role: user.role,
        });

        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          token,
        });
      } else {
        res.status(403).send(new Error("FORBIDDEN", "Invalid refresh token"));
      }
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

module.exports = { loginController, refreshTokenController };
