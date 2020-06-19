class Error {
  constructor(statusCode, message) {
    this.code = statusCode;
    this.result = "FAILURE";
    this.message = message;
  }
}

module.exports = Error;
