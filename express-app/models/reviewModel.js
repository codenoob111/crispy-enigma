const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'review can not be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'review must belong to a user']
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// reviewSchema.index({tour: 1, user: 1}, {unique: true});

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    //计算平均值
    const stats = await this.aggregate([
        {$match: {tour: tourId}},
        {
            $group: {
                _id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ]);
    //持久化到数据库中
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating || 0,
        ratingsAverage: stats[0].avgRating || 3
    });
};
//从pre中间件里取出id，并存在当前实例上
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.result = await this.findOne();
    next();
});

//然后用post中间件取出之前存好的id
reviewSchema.post(/^findOneAnd/, async function () {
    await this.result.constructor.calcAverageRatings(this.result.tour);
});

//post中间件无法访问next函数，他本身就是在保存之后的中间件
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
