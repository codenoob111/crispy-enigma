const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true,
        maxlength: [40, 'maxlength is 40'],
        minlength: [10, 'minlength is 10']
        // validate:[validator.isAlpha,'name must be English']
    },
    slug: String,
    secretTour: {
        type: Boolean,
        default: false
    },
    duration: {
        type: Number,
        required: [true, 'duration is required']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'maxGroupSize is required']
    },
    difficulty: {
        type: String,
        required: [true, 'difficulty is required'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'must be three of \'easy\',\'medium\',\'difficult\''
        }
    },
    ratingsAverage: {
        type: Number,
        default: 3.0,
        max: [5, 'max is 45'],
        min: [1, 'min is 1']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'price is required']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //只有在新建的时候才会生效
                return val < this.price;
            },
            message: '{VALUE} valid discount!'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'summary is required']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'imageCover is required']
    },
    images: [String],
    createAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            //ref引用其他的文档
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//建立索引 1升序 2降序
// tourSchema.index({slug: 1});

// tourSchema.pre('save', async function (next) {
//     //数据库查找会返回一个promise对象，故数组是一个promise数组
//     const guidesPromise = this.guides.map(async id => await User.findById(id));
//     //此处需要使用Promise all处理promise数组
//     this.guides = await Promise.all(guidesPromise);
//     next();
// });

//populate，封装在查询中间件中
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

//虚拟填充,不持久化到数据库中
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//虚拟属性
// tourSchema.virtual('durationWeeks').get(function () {
//     return this.duration / 7;
// });

//中间件 在save和create之前执行
// tourSchema.pre('save', function (next) {
//     //此处this指当前操作的document
//     // console.log(this);
//     this.slug = slugify(this.name, {lower: true});
//     next();
// });

// tourSchema.post('save',function (doc,next){
//     console.log(doc);
//     next()
// })

// quert 中间件 在update之后执行
// 使用正则，让所有find开头的api都适用此中间件
// tourSchema.pre(/^find/, function (next) {
//     this.find({secretTour: {$ne: true}});
//     this.start = Date.now();
//     next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//     console.log(`this Query took ${Date.now() - this.start} ms`);
//     // console.log(docs);
//     next();
// });

// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
