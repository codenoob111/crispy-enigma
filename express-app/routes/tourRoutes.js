const express = require('express');
const {protect, restrictTo} = require('../controller/authController');
const {
    getAllTours,
    createTour,
    getTourById,
    modifyTourById,
    deleteTourById,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
} = require('../controller/tourController');
const router = express.Router();
const reviewRouter = require('../routes/reviewRoutes');

router.use('/:tourId/reviews', reviewRouter);

//使用中间件
router.route('/top-5-cheap')
    .get(aliasTopTours, getAllTours);

router.route('/tour-stats')
    .get(getTourStats);

router.route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide'), getMonthlyPlan);

router.route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router.route('/:id')
    .get(protect, getTourById)
    .patch(protect, restrictTo('admin', 'lead-guide'), modifyTourById)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTourById);

module.exports = router;