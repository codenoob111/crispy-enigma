const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

//封装删除controller
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndDelete(req.params.id);
    if (!data) {
        return next(new AppError('No doc Found!', 404));
    }
    res.status(200).json({
        status: 'success',
        data: null
    });
});
//封装修改controller
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!data) {
        return next(new AppError('No doc Found!', 404));
    }
    res.status(200).json({
        status: 'success',
        data
    });
});
//封装新建controller
exports.createOne = Model => catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body);
    res.status(200).json({
        status: 'success',
        data
    });
});
exports.getOne = (Model, populateOption) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = Model.findById(req.params.id).populate(populateOption);
    const data = await query;
    if (!data) {
        return next(new AppError('No doc Found!', 404));
    }
    res.status(200).json({
        status: 'success',
        data
    });
});
exports.getAll = Model => catchAsync(async (req, res, next) => {
    //特殊处理，for tour上嵌套的reviews路由
    let filter = {};
    if (req.params.tourId) filter = {tour: req.params.tourId};
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().pagation();
    const data = await features.query;
    res.status(200).json({
        results: data.length,
        status: 'success',
        data
    });
});