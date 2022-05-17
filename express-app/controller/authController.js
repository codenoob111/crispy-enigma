const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const {promisify} = require('util');
//签名
const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};
//发送token
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIERSIN * 24 * 60 * 60 * 1000),
        // secure: true,    //只在https内传输cookie
        httpOnly: true  //只读，不能修改
    };
    //发送cookie到客户端cookie中
    res.cookie('token', token, cookieOptions);
    //从返回中删除password
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};
exports.signUp = catchAsync(async (req, res, next) => {
    //新建用户
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        // role: req.body.role
    });
    //创建令牌
    createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;
    //1 检查邮箱和密码是否存在
    if (!email || !password) {
        return next(new AppError('please provide email and password'), 200);
    }
    //2 检查用户是否存在，密码是否正确
    const user = await User.findOne({email}).select('+password');
    // 在userModel中定义的方法将在user控制器可用
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password!', 200));
    }
    //3 如果都存在，发送token给客户端
    createSendToken(user, 200, res);
});
//未登录处理中间件
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    //1) 获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    //2) 验证token
    if (!token) {
        return next(new AppError('you are not login,please login to get access', 200));
    }
    //3) 如果token合法 并且用户存在
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    //如果用户在token签署后被删除了
    if (!currentUser) {
        return next(new AppError('the user belong to this token does not exist'), 200);
    }
    //4) 判断用户是否更改了密码
    // if (currentUser.changePasswordAfter(decoded.iat)) {
    //     return next(new AppError('user recently changed password, please login again!', 401));
    // }
    req.user = currentUser;
    next();
});
//权限
exports.restrictTo = (...roles) => {
    // ..roles 剩余参数
    // 因为此中间件需要接受参数，所有要返回一个函数作为真正的中间件函数
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('you do not have permission to this action', 200));
        }
        next();
    };
};
//忘记密码 需要邮箱服务，先放下
// exports.forgetPassword = catchAsync(async (req, res, next) => {
//     console.log(req);
//     const user = await User.findOne({email: req.body.email});
//     if(!user){
//         return next(new AppError('there is no user with email address',404))
//     }
//     const resetToken = user.createPasswordResetToken()
//     await user.save({validateBeforeSave:false });
// });
//重置密码
exports.resetPassword = catchAsync(async (req, res, next) => {
    //在protect中间件时，已经把用户信息放在body中了，从body中取到当前用户id
    const user = await User.findById(req.user.id).select('+password');
    //判断用户密码是否正确
    if (!await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new AppError('user password is no correct,please input again!',200));
    }
    //如果正确，直接修改
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // user.findByIdAndUpdate 如果使用此方法，那在model中定义的验证方法将会失效，因为验证只针对save和create方法生效
    //修改成功后
    createSendToken(user, 200, res);
});