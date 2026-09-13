'use strict';

const { validationResult } = require('express-validator');

async function createReview(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors,isEmpty()) {
      return res.status(400).json({
        message : '리뷰 입력값을 확인해주세요.',

        errors: errors.array()
      });
    }

    return res.status(501).json({
      message : '리뷰 DB 연동을 준비 중입니다.',

      receivedData: {
        productId : req.body.productId,

        content : req.body.content
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createReview
};