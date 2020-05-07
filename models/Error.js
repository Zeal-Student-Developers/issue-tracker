class Error {
    constructor(statusCode, msg) {
        this.code = statusCode;
        this.msg = msg;
        this.result = "FAILURE";
    }
}

module.exports = Error;
