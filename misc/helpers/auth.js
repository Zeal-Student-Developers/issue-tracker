const { APIError, roles } = require("../../models");

/**
 * Express middleware for checking if user is logged in. Stores the current
 * user from `res.locals.loggedInUser` to `req.user` for passing it further to
 * next callbacks.
 */
function allowIfLoggedIn(req, res, next) {
  try {
    const user = res.locals.loggedInUser;
    if (!user)
      throw new APIError(APIError.FORBIDDEN, "You need to be logged in");

    if (user.isDeleted)
      throw new APIError(APIError.BAD_REQUEST, "No user found");

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
function hasAccessTo(act, resource) {
  return async (req, _, next) => {
    try {
      if (req.user.isDisabled) {
        throw new APIError(
          APIError.FORBIDDEN,
          "You have been blocked by the system for repeated violations of the Code of Conduct"
        );
      }

      const perm = roles.can(req.user.role)[act](resource);
      if (!perm.granted) {
        throw new APIError(
          APIError.UNAUTHORIZED,
          "You are not authorized to perform the action"
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { allowIfLoggedIn, hasAccessTo };
