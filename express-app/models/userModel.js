const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required!'],
        minlength: [2, 'name must be more than 2!'],
        maxlength: [30, 'name must be less than 30!']
    },
    email: {
        type: String,
        required: [true, 'email is required!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email!']
    },
    photo: {
        type: String,
        default:'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guide', 'lead-guide'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'password is required!'],
        minlength: [8, 'password must be more than 8!'],
        maxlength: [14, 'password must be less than 14!'],
        select: false
    },
    score: {
        type: Number,
        default: 0
    },
    checkInDate: {
        type: String
    },
    checkInContinuDay: {
        type: Number,
        default: 0
    },
    passwordConfirm: {
        type: String,
        required: [true, 'passwordConfirm is required!'],
        minlength: [8, 'passwordConfirm must be more than 8!'],
        maxlength: [14, 'passwordConfirm must be less than 14!'],
        //验证密码是否相同，只在save和create时生效，update和其他动作不生效
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: 'password are not the same!'
        }
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    // review:[
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref:'Review'
    //     }
    // ]
});

// userSchema.pre(/^find/,function (next){
//     this.populate({
//         path:'review',
//         select:'review'
//     })
//     next()
// })
//不想展示已经注销的用户，使用query中间件，匹配所有find开头的方法
userSchema.pre(/^find/, function (next) {
    this.find({active: {$ne: false}});
    next();
});

//保存和存储之间的中间件，加密密码
userSchema.pre('save', async function (next) {
    //如果密码字段没更新，直接下一步
    if (!this.isModified('password')) return next();
    //使用bcrypt加密,hash方法为异步方法，返回一个promise对象
    this.password = await bcrypt.hash(this.password, 12);
    //此处确认密码只需要在validator中验证，不需要在此验证
    this.passwordConfirm = undefined;
    next();
});

//验证用户的登录密码，简单返回布尔值
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

//用户在获取到token后是否更改过密码
userSchema.methods.changePasswordAfter = async function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        // console.log(changeTimestamp, JWTTimestamp);
        return JWTTimestamp < changeTimestamp;
    }
    //false表示没改密码
    return false;
};

// userSchema.methods.createPasswordResetToken = function () {
//     //创建重置令牌
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     //加密重置令牌,并存储到数据库中
//     this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//     this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
//     console.log({resetToken},this.passwordResetToken);
//     return resetToken;
// };

const User = mongoose.model('User', userSchema);

module.exports = User;