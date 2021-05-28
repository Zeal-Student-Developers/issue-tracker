const statusText = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  500: "INTERNAL_SERVER_ERROR",
};

/**
 * Class for representing any error occuring in the API
 */
class APIError extends Error {
  constructor(statusCode = 500, message = "Something went wrong.") {
    super();
    super.message = message;
    this.statusCode = statusCode;
    this.code = statusText[statusCode];
  }

  static get BAD_REQUEST() {
    return 400;
  }

  static get UNAUTHORIZED() {
    return 401;
  }

  static get FORBIDDEN() {
    return 403;
  }

  static get NOT_FOUND() {
    return 404;
  }

  static get INTERNAL_SERVER_ERROR() {
    return 500;
  }
}

module.exports = APIError;
