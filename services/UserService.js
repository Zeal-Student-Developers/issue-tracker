const User = require("../models/User");
const randomBytes = require("crypto").randomBytes;
const Error = require("../models/Error");
const { roles } = require("../models/roles");

class UserService {
  constructor() {}

  // ADD USER
  async addUser(zprn, firstName, lastName, password, department, role) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = new User({
          zprn: Number(zprn),
          role: role,
          firstName: firstName,
          lastName: lastName,
          department: department,
          password: password,
          role: role,
          isDisabled: false,
          refreshToken: randomBytes(45).toString("hex") + "." + zprn,
        });
        const newUser = await user.save();
        return resolve(newUser);
      } catch (error) {
        return reject(error);
      }
    });
  }

  // FIND ALL USERS
  async getAllUsers() {
    return new Promise(async (resolve, reject) => {
      try {
        const users = await User.find({ isDisabled: false });
        return resolve(users);
      } catch (error) {
        return reject(error);
      }
    });
  }

  // FIND USER WITH ZPRN
  async getUserByZprn(zprn) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await User.findOne({
          zprn: zprn,
          isDisabled: false,
        });
        return resolve(user);
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Get user with ID
   * @param {String} id ID of the user
   * @returns User with specified ID
   */
  async getUserById(id) {
    return await User.findById(id);
  }

  // UPDATE USER
  /*
   * 'newUser' is the object containing updated details of the user.
   * The fields that aren't to be updated should be left undefined
   */
  async updateUser(newUser) {
    return new Promise(async (resolve, reject) => {
      const { id, firstName, lastName, password, department, role } = newUser;
      try {
        const user = await User.findById(id);
        if (user == null) {
          return reject(new Error("BAD_REQUEST", "No user found"));
        } else {
          user.firstName = firstName != undefined ? firstName : user.firstName;
          user.lastName = lastName != undefined ? lastName : user.lastName;
          user.password = password != undefined ? password : user.password;
          user.department =
            department != undefined ? department : user.department;
          user.role = role != undefined ? role : user.role;
          const result = await user.save();
          return resolve(result);
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  async deleteAllUsers() {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await User.updateMany(
          {},
          {
            isDisabled: true,
          }
        );
        return resolve(result.nModified);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async deleteUser(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await User.findOneAndUpdate(
          { _id: id },
          { isDisabled: true },
          { new: true }
        );
        return resolve(user);
      } catch (error) {
        return reject(error);
      }
    });
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
