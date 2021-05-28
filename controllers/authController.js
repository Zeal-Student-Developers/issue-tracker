const bcrypt = require("bcryptjs");

const { APIError } = require("../models");

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
 * @param {Express.NextFunction}
 */
const loginController = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    const errors = validateCredentials(userId, password);
    if (errors) throw new APIError(APIError.BAD_REQUEST, errors);

    const user = await getUserByUserId(userId);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    if (user.isDisabled) {
      throw new APIError(
        APIError.FORBIDDEN,
        "You have been blocked by the system for repeated violations of the Code of Conduct"
      );
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) throw new APIError(APIError.FORBIDDEN, "Password incorrect");

    let token = null;
    try {
      token = sign({
        userID: user.id,
        department: user.department,
        role: user.role,
      });
    } catch (error) {
      throw new APIError(APIError.FORBIDDEN, error.message);
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      token,
      refreshToken: user.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for handling refresh JWT token
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction}
 */
const refreshTokenController = async (req, res, next) => {
  try {
    let userID = null;

    try {
      userID = decode(req.headers["authorization"]).userID;
    } catch (error) {
      throw new APIError(APIError.FORBIDDEN, error.message);
    }

    const user = await getUserById(userID);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    if (user.isDisabled) {
      throw new APIError(
        APIError.FORBIDDEN,
        "You have been blocked by the system for repeated violations of the Code of Conduct"
      );
    }

    if (user.refreshToken !== req.body.refreshToken) {
      throw new APIError(APIError.FORBIDDEN, "Invalid refresh token");
    }

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
  } catch (error) {
    next(error);
  }
};

module.exports = { loginController, refreshTokenController };
