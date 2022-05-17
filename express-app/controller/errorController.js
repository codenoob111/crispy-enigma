const AppError = require('../utils/appError');

//捕获来自数据库的错误，转化成用户能看懂的
//非法值
handleCastErrorDB = err => {
    const message = `Invalid is ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};
//重复值
handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value} , Please use another value`;
    return new AppError(message, 400);
};
//校验错误
handleVaildatorErrorDB = err => {
    const errors = Object.values(err.errors).map(item => item.message);
    const message = `Invalid input data:${errors.join('. ')}`;
    return new AppError(message, 400);
};
//token验证错误
handleJWTError = () => {
    return new AppError('Invalid token, please login again!', 401);
};
//token过期错误
handleJWTExpiredError = () => {
    return new AppError('Token has expired, please login again!', 401);
};
//开发环境
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};
//生产环境
const sendErrorProd = (err, res) => {
    // console.log('err.isOperational', err.isOperational);
    //如果是操作错误
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        console.error('ERROR', err);
        //通用错误处理
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = err;
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleVaildatorErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
        sendErrorProd(error, res);
    }
};