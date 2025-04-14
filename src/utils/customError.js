class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.status = statusCode;
        this.success = false;

        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = CustomError;