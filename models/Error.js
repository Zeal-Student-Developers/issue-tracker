class Error {
    constructor(statusCode, msg) {
        this.code = statusCode;
        this.result = "FAILURE";
        this.msg = msg;
    }
}

module.exports = Error;
