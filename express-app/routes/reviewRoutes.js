const express = require('express');
const {protect, restrictTo} = require('../controller/authController');
const {
    createReview,
    getAllReviews,
    deleteReviewById,
    modifyReviewById,
    getReviewsById,
    setTourUserIds
} = require('../controller/reviewController');

const router = express.Router({mergeParams: true});

router.use(protect);

router.route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourUserIds, createReview);

router.route('/:id')
    .get(getReviewsById)
    .patch(restrictTo('user', 'admin'), modifyReviewById)
    .delete(restrictTo('user', 'admin'), deleteReviewById);

module.exports = router;