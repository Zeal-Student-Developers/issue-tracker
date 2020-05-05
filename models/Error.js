class Error {
    constructor(statusCode, msg) {
        this.code = statusCode;
        this.msg = msg;
    }
}

module.exports = Error;
