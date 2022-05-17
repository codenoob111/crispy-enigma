const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const moment = require('moment');
const multer = require('multer');
//创建存储
const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/users');
    },
    filename: (req, file, callback) => {
        const extents = file.mimetype.split('/')[1];
        callback(null, `user-${req.user.id}-${Date.now()}.${extents}`);
    }
});
//创建上传过滤器
const multerFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image')) {
        callback(null, true);
    } else {
        callback(new AppError('not a image ,please upload a image!', 200), false);
    }
};
//上传头像
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});
//上传中间件
exports.uploadAvatar = upload.single('photo');

//过滤下body
const filterObj = (obj, ...rest) => {
    const newObj = {};
    Object.keys(obj).forEach(item => {
        if (rest.includes(item)) newObj[item] = obj[item];
    });
    return newObj;
};
//积分排行
exports.scoreRank = catchAsync(async (req, res) => {
    const rank = await User.find().select('name score photo').sort('-score');
    res.status(200).json({
        status: 'success',
        results: rank.length,
        data: {
            rank
        }
    });
});
/**
 * 用户签到
 * @type {(function(*, *, *): void)|*}
 */
exports.checkIn = catchAsync(async (req, res) => {
    const currentUser = await User.findById(req.user.id);
    //防止重复签到
    if (new Date(currentUser.checkInDate).toDateString() === new Date().toDateString()) {
        res.status(200).json({
            message: '你今天已经签过到了，不能重复签到!'
        });
        return;
    }
    let continuDay;
    const lastCheckIn = moment(currentUser.checkInDate).format('YYYY-MM-DD');
    const yesterday = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD');
    //如果上次签到时间是昨天
    if (lastCheckIn === yesterday) {
        //连续签到 累加
        continuDay = currentUser.checkInContinuDay + 1;
    } else {
        //非连续签到 置1
        continuDay = 1;
    }
    const newScore = req.user.score + 5;
    const today = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            score: newScore,
            checkInDate: today,
            checkInContinuDay: continuDay
        }, {
            new: true,
            runValidators: true
        });
    res.status(200).json({
        status: 'success',
        message: '签到成功！',
        data: {
            score: user.score,
            checkInDate: user.checkInDate,
            checkInContinuDay: continuDay
        }
    });
});
//更新信息
exports.updateCurrentUser = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('this route is not for password updates!', 200));
    }
    const filterBody = filterObj(req.body, 'name', 'email');

    if (req.file) filterBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});
//注销账户
exports.deleteCurrentUser = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});
    res.status(200).json({
        status: 'success',
        data: null
    });
});
//获取当前用户id
exports.getCurrentUser = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.modifyUserById = factory.updateOne(User);

exports.deleteUserById = factory.deleteOne(User);
