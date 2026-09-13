'use strict';
const express = require('express');

const { body } = require('express-validator');

const reviewController = require('../controllers/review.controller');

const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware,
  body('productId')
  .isInt({ min: 1})
  .withMessage('상품 번호가 올바르지 않습니다.'),

  body('productId')
  .isInt({ min : 1 })
  .withMessage('상품 번호가 올바르지 않습니다'),

  body('content')
  .trim()
  .isLength({ min : 2, max : 2000 })
  .withMessage('리뷰는 2자 이상 2000자 이하로 입력해주세요.'),

  reviewController.createReview

);

module.exports = router;