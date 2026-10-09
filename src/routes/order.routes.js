'use strict';

const express = require('express');

const { body } = require('express-validator');

const authMiddleware = require('../middleware/auth.middleware');

const orderController = require('../controllers/order.controller');

const router = express.Router();

// 상품 구매

router.post('/', authMiddleware,
  body('productId')
    .isInt({ min: 1})
    .withMessage('상품 번호가 올바르지 않습니다.'),

  body('quantity')
    .isInt({
      min: 1,
      max: 10
    })
    .withMessage('구매 수량은 1개 이상 10개 이하로 입력해주세요.'),
  
  orderController.createOrder
);

// 내 주문 목록

router.get('/history', authMiddleware, orderController.showOrderHistory);

// 내 주문 상세

router.get('/:orderNumber', authMiddleware, orderController.showOrderDetail);

module.exports = router;