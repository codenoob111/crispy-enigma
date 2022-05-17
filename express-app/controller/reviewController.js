const Review = require('../models/reviewModel');
const factory = require('../controller/handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    //嵌套路由
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next()
};
//获取所有评论
exports.getAllReviews = factory.getAll(Review)
//查看一条
exports.getReviewsById = factory.getOne(Review);
//新建评论
exports.createReview = factory.createOne(Review);
//删除评论
exports.deleteReviewById = factory.deleteOne(Review);
//更新评论
exports.modifyReviewById = factory.updateOne(Review);