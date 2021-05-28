const User = require("../models/User");
const randomBytes = require("crypto").randomBytes;

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
  static async createUser(
    userId,
    firstName,
    lastName,
    password,
    department,
    role
  ) {
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
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of all users
   */
  static async getAllUsers(page = 0, limit = 10) {
    return await User.find({ isDisabled: false })
      .skip(page * limit)
      /* Twice the limit so as to check if more elemenst are available for
        next fetch */
      .limit(2 * limit);
  }

  /**
   * Get user with specified `userId`
   * @param {String} userId userId of the user
   * @returns {Promise<Document>} User with given userId
   */
  static async getUserByUserId(userId) {
    return await User.findOne({ userId });
  }

  /**
   * Get user with ID
   * @param {String} id Document ID of the user
   * @returns {Promise<Document>} User with specified ID
   */
  static async getUserById(id) {
    return await User.findById(id);
  }

  /**
   * Updates the specified with provided details
   * @param {Object} newUser Object containing updated user details
   * @returns {Promise<Document>} Updated user object
   */
  static async updateUser(newUser) {
    const { id, firstName, lastName, password, department, role } = newUser;
    const user = await User.findById(id);
    if (user === null) return null;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.password = password || user.password;
    user.department = department || user.department;
    user.role = role || user.role;

    return await user.save();
  }

  /**
   * Deletes all users from the database
   * @returns {Promise<Number} Number of deleted users
   */
  static async deleteAllUsers() {
    return (await User.updateMany(null, { isDisabled: true })).nModified;
  }

  /**
   * Deletes user with specified ID
   * @param {String} id ID of the user to delete
   * @returns {Promise<Document>} Deleted user object
   */
  static async deleteUser(id) {
    return await User.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }
}

module.exports = UserService;
