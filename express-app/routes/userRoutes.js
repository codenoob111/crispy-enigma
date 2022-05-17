// const express = require('express');
// const router = express.Router();
const router = require('express').Router()
const {
    getAllUsers,
    getUserById,
    modifyUserById,
    deleteUserById,
    updateCurrentUser,
    deleteCurrentUser,
    getCurrentUser,
    checkIn,
    scoreRank,
    uploadAvatar
} = require('../controller/userController');

const {signUp, login, resetPassword, protect, restrictTo} = require('../controller/authController');

router.post('/signup', signUp); //注册

router.post('/login', login); //登录

router.patch('/resetPassword', resetPassword); //修改密码

router.get('/scoreRank', scoreRank);
//因为中间件按顺序执行，故将protect放到这里则会保护该行下的所有路由
router.use(protect);

router.post('/checkIn', checkIn); //签到

router.get('/me', getCurrentUser, getUserById);

router.patch('/updateMe', uploadAvatar, updateCurrentUser);

router.delete('/deleteMe', deleteCurrentUser);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);

router.route('/:id').get(getUserById).patch(modifyUserById).delete(deleteUserById);

module.exports = router;