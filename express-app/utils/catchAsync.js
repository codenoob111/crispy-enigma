//捕获函数异常
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};