'use strict';

const express = require('express');
const { body } = require('express-validator');

const reviewController = require('../controllers/review.controller');

const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware,
  body('orderItemId')
    .isInt({ min : 1 })
    .withMessage('주문 상품 번호가 올바르지 않습니다.').toInt(),

  body('rating')
    .isInt({min: 1, max: 5})
    .withMessage('평점은 1점부터 5점까지 선택해주세요').toInt(),
  
  body('content')
    .trim()
    .isLength({ min : 2, max : 2000 })
    .withMessage('리뷰는 2자 이상 2000자 이하로 입력해주세요.'),

  reviewController.createReview

);

module.exports = router;