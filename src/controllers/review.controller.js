'use strict';

const { validationResult } = require('express-validator');

const reviewRepository = require('../repositories/review.repository');

function renderError(res,status,title,message) {
  return res.status(status).render('errors/error',
    {
      title,
      message
    }
  );
}


async function createReview(req, res, next) {
  try {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => error.msg)
        .join(' ');

      return renderError(res, 400, '리뷰 입력 오류', message);
    }

    const userId = Number(req.user?.id);

    const orderItemId = Number(req.body.orderItemId);

    const rating = Number(req.body.rating);

    const content = String(req.body.content || '').trim();

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return renderError(res, 401, '로그인 필요', '로그인 정보가 올바르지 않습니다.');
    }

    const result = await reviewRepository.createReview({userId, orderItemId, rating, content});

    return res.redirect(303, `/products/detail/${result.productId}?review=created`);
  } catch (error) {
    if (error.code === 'PURCHASE_NOT_FOUND') {
      return renderError(res, 404, '구매 내역 없음', error.message);
    }

    if(error.code === 'PURCHASE_NOT_CONFIRMED') {
      return renderError(res, 409, '구매확정 필요', error.message);
    }

    if (error.code === 'REVIEW_ALREADY_EXISTS') {
      return renderError(res, 409, '중복 리뷰', error.message);
    }

    return next(error);
  }
}

module.exports = {
  createReview
};