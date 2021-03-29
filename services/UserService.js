const User = require("../models/User");
const randomBytes = require("crypto").randomBytes;
const Error = require("../models/Error");
const { roles } = require("../models/roles");

/**
 * Class for handling CRUD operations on `users`
 */
class UserService {
  constructor() {}

  /**
   * Creates new user with the provided data
   * @param {String} userId userId of the user
   * @param {String} firstName First name of the user
   * @param {String} lastName Last name of the user
   * @param {String} password Password of the user
   * @param {String} department Department of the user
   * @param {String} role User's role
   * @returns {Promise<Document>} Newly created user
   */
  async createUser(userId, firstName, lastName, password, department, role) {
    return await User.create({
      userId,
      role,
      firstName,
      lastName,
      department,
      password,
      role,
      isDisabled: false,
      refreshToken: randomBytes(45).toString("hex") + "." + userId,
    });
  }

  /**
   * Gets all the users in database
   * @returns {Promise<Document[]>} List of all users
   */
  async getAllUsers() {
    return await User.find({ isDisabled: false });
  }

  /**
   * Get user with specified `userId`
   * @param {String} userId userId of the user
   * @returns {Promise<Document>} User with given userId
   */
  async getUserByUserId(userId) {
    return await User.findOne({ userId });
  }

  /**
   * Get user with ID
   * @param {String} id Document ID of the user
   * @returns {Promise<Document>} User with specified ID
   */
  async getUserById(id) {
    return await User.findById(id);
  }

  /**
   * Updates the specified with provided details
   * @param {Object} newUser Object containing updated user details
   * @returns {Promise<Document>} Updated user object
   */
  async updateUser(newUser) {
    const { id, firstName, lastName, password, department, role } = newUser;
    const user = await User.findById(id);
    if (user === null) {
      throw new Error("BAD_REQUEST", "No user found");
    } else {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.password = password || user.password;
      user.department = department || user.department;
      user.role = role || user.role;
    }

    return await user.save();
  }

  /**
   * Deletes all users from the database
   * @returns {Promise<Number} Number of deleted users
   */
  async deleteAllUsers() {
    return (await User.updateMany(null, { isDisabled: true })).nModified;
  }

  /**
   * Deletes user with specified ID
   * @param {String} id ID of the user to delete
   * @returns {Promise<Document>} Deleted user object
   */
  async deleteUser(id) {
    return await User.findByIdAndUpdate(
      id,
      { isDisabled: true },
      { new: true }
    );
  }

  /**
   * Express middleware for checking if user is logged in. Stores the current
   * user from `res.locals.loggedInUser` to `req.user` for passing it further to
   * next callbacks.
   */
  async allowIfLoggedIn(req, res, next) {
    try {
      const user = res.locals.loggedInUser;
      if (!user) {
        return res
          .status(401)
          .json(new Error("BAD_REQUEST", "You need to be logged in"));
      }
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Express middleware to check if `req.user` has enough permissions to
   * perform an action. Always needs the `allowIfLoggedIn` middleware to be
   * passed prior to using this
   */
  hasAccessTo = (act, resource) => {
    return async (req, res, next) => {
      try {
        if (req.user.isDisabled) {
          return res
            .status(403)
            .send(
              new Error(
                "FORBIDDEN",
                "You have been blocked by the system for repeated violations of the Code of Conduct"
              )
            );
        }

        const perm = roles.can(req.user.role)[act](resource);
        if (!perm.granted) {
          return res
            .status(403)
            .json(
              new Error(
                "FORBIDDEN",
                "You are not authorized to perform the action"
              )
            );
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

module.exports = new UserService();
