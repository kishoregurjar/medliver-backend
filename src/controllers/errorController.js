const CustomError = require("../utils/customError");


const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        stakeTrace: error.stack,
        error: error,
    });
}

const castErrorHandler = (err) => {
    const msg = `Invalid Vaule for field ${err.path}: ${err.value}.`
    return new CustomError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {

    const field = Object.keys(err?.errorResponse?.keyPattern || {})[0];
    const value = err?.errorResponse?.keyValue?.[field];

    const msg = `Duplicate value for field '${field}': '${value}'`;

    return new CustomError(msg, 400);
};

const mongooseValidationErrorHandler = (err) => {
    const firstErrorKey = Object.keys(err.errors)[0];
    const firstErrorMessage = err.errors[firstErrorKey].message;

    return new CustomError(firstErrorMessage, 400);
}

const tokenExpiredErrorHandler = (err) => {
    return new CustomError('Token Expired, Please Login Again', 401)
}

const invalidTokenErrorHandler = (err) => {
    return new CustomError('Invalid Token, Please Login Again', 401)
}

const prodErrors = (res, error) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! Please try again later',
        });
    }
}

module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error'
    if (process.env.NODE_ENV === 'development') {
        devErrors(res, error);
    } else if (process.env.NODE_ENV === 'production') {
        if (error.name === 'CastError') error = castErrorHandler(error);
        if (error?.errorResponse?.code === 11000) error = duplicateKeyErrorHandler(error);
        if (error?.name === 'ValidationError') error = mongooseValidationErrorHandler(error);
        if (error?.name === 'TokenExpiredError') error = tokenExpiredErrorHandler(error);
        if (error?.name === 'JsonWebTokenError') error = invalidTokenErrorHandler(error);
        prodErrors(res, error);
    }
}