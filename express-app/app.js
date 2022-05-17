const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

//允许跨域
app.use(cors());
//设置安全http的headrs
app.use(helmet());
//解析静态文件
app.use(express.static(path.join(__dirname, 'public')));
//api调用日志
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json({limit: '10kb'}));
//防止sql注入攻击
app.use(mongoSanitize());
//防止xss攻击
app.use(xss());
//防止参数污染
app.use(hpp({
    //设置参数白名单
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'maxGroupSize', 'price']
}));
//限制器，限制同一ip在同一时间请求的流量:1小时300次请求
const limiter = rateLimit({
    max: 300,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP,please try again in 1 hour'
});
if (process.env.NODE_ENV === 'production') {
    app.use('/api', limiter);
}
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
//404路由
app.all('*', (req, res, next) => {
    next(new AppError(`404 Not Found! check your url:${req.originalUrl}`, 404));
});
//全局错误处理
app.use(globalErrorHandler);

module.exports = app;
