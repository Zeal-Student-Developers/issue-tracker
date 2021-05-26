const bcrypt = require("bcryptjs");
const { readFileSync, unlinkSync } = require("fs");
const { parse } = require("papaparse");

const { APIError } = require("../models");

const {
  UserService: { getUserById, getAllUsers, createUser, updateUser, deleteUser },
} = require("../services");

const {
  userValidations: {
    validateUserData,
    validatePasswords,
    validateUpdateUserData,
  },
} = require("../misc/validation");

/**
 * Controller to handle get own profile user
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const getOwnProfileController = async function (req, res, next) {
  const { id } = req.user;
  try {
    const user = await getUserById(id);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle add user
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const addUserController = async function (req, res, next) {
  const { userId, firstName, lastName, password, department, role } = req.body;
  try {
    const errors = validateUserData(
      userId,
      firstName,
      lastName,
      password,
      department,
      role
    );
    if (errors) throw new APIError(APIError.BAD_REQUEST, errors);

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    await createUser(
      userId,
      firstName,
      lastName,
      hashedPassword,
      department,
      role
    );

    res.status(200).json({
      code: "CREATED",
      result: "SUCCESS",
      message: "User added",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for adding users from csv file
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const addUsersFromFileController = async function (req, res, next) {
  try {
    const file = req.file;
    if (!file)
      throw new APIError(APIError.BAD_REQUEST, "Please provide a data file");

    let dataString = undefined;
    let users = [];

    try {
      dataString = readFileSync(file.path).toString();
      const { data } = parse(dataString);
      users = data.slice(1, -1);
    } catch (error) {
      throw new APIError(APIError.INTERNAL_SERVER_ERROR, error.message);
    } finally {
      unlinkSync(file.path);
    }

    // Array to store userId of users having inappropriate/insufficient data
    const erroneousUsers = [];

    users.forEach((user) => {
      const [userId, firstName, lastName, password, department, role] = user;
      const errors = validateUserData(
        userId,
        firstName,
        lastName,
        password,
        department,
        role
      );
      if (errors) erroneousUsers.push(userId);
    });

    if (erroneousUsers.length > 0) {
      throw new APIError(
        APIError.BAD_REQUEST,
        `Users with userId [${erroneousUsers.join(
          ", "
        )}] have inappropriate/insufficient data`
      );
    }

    users.forEach(async (user) => {
      const [userID, firstName, lastName, password, department, role] = user;

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      try {
        await createUser(
          userID,
          firstName,
          lastName,
          hashedPassword,
          department,
          role.toLowerCase()
        );
      } catch (error) {
        erroneousUsers.push(userId);
      }
    });

    res.status(200).json({
      code: "CREATED",
      result: "SUCCESS",
      message: "User profiles created",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle update user's own passoword
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const updateOwnPasswordController = async function (req, res, next) {
  const { id } = req.user;
  try {
    const { oldPassword: old, newPassword: _new } = req.body;

    const errors = validatePasswords(old, _new);
    if (errors) throw new APIError(APIError.BAD_REQUEST, errors);

    const oldPassword = old.trim();
    const newPassword = _new.trim();

    if (oldPassword === newPassword) {
      throw new APIError(
        APIError.BAD_REQUEST,
        "New password should be different from previous password"
      );
    }

    const user = await getUserById(id);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    const match = bcrypt.compareSync(oldPassword, user.password);
    if (!match) throw new APIError(APIError.BAD_REQUEST, "Incorrect password");

    let hashedPassword = null;
    try {
      hashedPassword = bcrypt.hashSync(newPassword, 10);
    } catch (err) {
      throw new APIError(APIError.INTERNAL_SERVER_ERROR, err.message);
    }

    await updateUser({
      id: id,
      password: hashedPassword,
    });

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Password updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle update user's profile
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const updateOwnProfileController = async function (req, res, next) {
  const { id } = req.user;
  const user = validateUpdateUserData(({ firstName, lastName } = req.body));

  try {
    if (Object.keys(req.body).length === 0 || !user) {
      throw new APIError(APIError.BAD_REQUEST, "Please provide some data");
    }
    const { firstName, lastName, department } = user;

    await updateUser({
      id,
      firstName,
      lastName,
      department,
    });

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "User updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete user's own profile
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const deleteOwnProfileController = async function (req, res, next) {
  try {
    await deleteUser(req.user.id);
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "User deleted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle get user by userId
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const getUserByIdController = async function (req, res, next) {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      user: {
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle get all users
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const getAllUsersController = async function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;

  try {
    const users = (await getAllUsers(pageNumber, pageLimit)).map((user) => ({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      role: user.role,
    }));

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      data: {
        hasNextPage: users.length > limit,
        hasPreviousPage: page > 1,
        users: users.slice(0, limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle update any user by id
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const updateAnyProfileController = async function (req, res, next) {
  try {
    if (Object.keys(req.body).length === 0) {
      throw new APIError(APIError.BAD_REQUEST, "Please provide some data");
    }

    const { firstName, lastName, department, role, password } = req.body;
    const user = validateUpdateUserData({
      firstName,
      lastName,
      department,
      role,
    });

    if (!user)
      throw new APIError(APIError.BAD_REQUEST, "Please provide required data");

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : password;
    await updateUser({
      id: req.params.id,
      password: hashedPassword,
      ...user,
    });

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "User updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete user by id
 * @param {Request} req
 * @param {Response} res
 * @param {Express.NextFunction} next Express Next Function
 */
const deleteAnyUserController = async function (req, res, next) {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) throw new APIError(APIError.BAD_REQUEST, "No user found");

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      deleted: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addUser: addUserController,
  addUsersFromFile: addUsersFromFileController,
  getOwnProfile: getOwnProfileController,
  getUserById: getUserByIdController,
  getAllUsers: getAllUsersController,
  updateAnyUserById: updateAnyProfileController,
  updateOwnPassword: updateOwnPasswordController,
  updateOwnProfile: updateOwnProfileController,
  deleteOwnProfile: deleteOwnProfileController,
  deleteAnyUserById: deleteAnyUserController,
};
