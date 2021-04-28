const bcrypt = require("bcryptjs");
const { readFileSync, unlinkSync } = require("fs");
const { parse } = require("papaparse");

const { Error } = require("../models");

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
 */
const getOwnProfileController = async function (req, res) {
  const { id } = req.user;
  try {
    const user = await getUserById(id);
    if (!user) {
      res.status(400).json(new Error("BAD_REQUEST", "No user found"));
    } else {
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
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle add user
 * @param {Request} req
 * @param {Response} res
 */
const addUserController = async function (req, res) {
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
    if (errors) {
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
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
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller for adding users from csv file
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const addUsersFromFileController = async function (req, res) {
  const file = req.file;
  if (!file) {
    res
      .status(400)
      .send(new Error("BAD_REQUEST", "Please provide a data file"));
    return;
  }
  let dataString = undefined;
  let users = [];
  try {
    dataString = readFileSync(file.path).toString();
    const { data } = parse(dataString);
    users = data.slice(1, -1);
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
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
    return res
      .status(400)
      .send(
        new Error(
          "BAD_REQUEST",
          `Users with userId [${erroneousUsers.join(
            ", "
          )}] have inappropriate/insufficient data`
        )
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
};

/**
 * Controller to handle update user's own passoword
 * @param {Request} req
 * @param {Response} res
 */
const updateOwnPasswordController = async function (req, res) {
  const { id } = req.user;
  try {
    const { oldPassword: old, newPassword: _new } = req.body;
    const errors = validatePasswords(old, _new);
    if (errors) {
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
      const oldPassword = old.trim();
      const newPassword = _new.trim();

      if (oldPassword === newPassword) {
        res
          .status(400)
          .send(
            new Error(
              "BAD_REQUEST",
              "New password should be different from previous password"
            )
          );
        return;
      }
      try {
        const user = await getUserById(id);
        if (user) {
          const match = bcrypt.compareSync(oldPassword, user.password);
          if (match) {
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            await updateUser({
              id: id,
              password: hashedPassword,
            });

            res.status(200).json({
              code: "OK",
              result: "SUCCESS",
              message: "Password updated",
            });
          } else {
            res
              .status(400)
              .send(new Error("BAD_REQUEST", "Incorrect Password"));
          }
        } else {
          res.status(400).send(new Error("BAD_REQUEST", "No user found"));
        }
      } catch (err) {
        res.status(400).send(new Error("BAD_REQUEST", err.message));
      }
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle update user's profile
 * @param {Request} req
 * @param {Response} res
 */
const updateOwnProfileController = async function (req, res) {
  const { id } = req.user;
  try {
    if (Object.keys(req.body).length === 0) {
      res.status(400).send(new Error("BAD_REQUEST", "Insufficient data"));
    } else {
      const { firstName, lastName, department } = req.body;

      // User should not be updated if no data is provided to update
      if (!(firstName?.trim() && lastName?.trim() && department?.trim())) {
        return res
          .status(400)
          .send(new Error("BAD_REQUEST", "Please provide required data"));
      }

      await updateUser({
        id,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        department: department?.trim(),
      });

      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "User updated",
      });
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to delete user's own profile
 * @param {Request} req
 * @param {Response} res
 */
const deleteOwnProfileController = async function (req, res) {
  try {
    await deleteUser(req.user.id);
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "User deleted",
    });
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle get user by userId
 * @param {Request} req
 * @param {Response} res
 */
const getUserByIdController = async function (req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(400).send(new Error("BAD_REQUEST", "No user found"));
    } else {
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
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle get all users
 * @param {Request} req
 * @param {Response} res
 */
const getAllUsersController = async function (req, res) {
  try {
    const users = (await getAllUsers()).map((user) => ({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      role: user.role,
    }));
    res.status(200).json({ code: "OK", result: "SUCCESS", users });
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle update any user by id
 * @param {Request} req
 * @param {Response} res
 */
const updateAnyProfileController = async function (req, res) {
  try {
    if (Object.keys(req.body).length === 0) {
      res
        .status(400)
        .send(new Error("BAD_REQUEST", "Required fields not provided"));
    } else {
      const { firstName, lastName, department, role, password } = req.body;
      const user = validateUpdateUserData({
        firstName,
        lastName,
        department,
        role,
      });
      if (!user) {
        return res
          .status(400)
          .send(new Error("BAD_REQUEST", "Please provide required data"));
      }
      const hashedPassword = password
        ? bcrypt.hashSync(password, 10)
        : password;
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
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to delete user by id
 * @param {Request} req
 * @param {Response} res
 */
const deleteAnyUserController = async function (req, res) {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) {
      res.status(400).send(new Error("BAD_REQUEST", "No user found"));
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
