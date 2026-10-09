'use strict';

const { validationResult } = require('express-validator');

const orderRepository = require('../repositories/order.repository');

// 공통 오류 화면 출력
function renderError(res, status, title, message) {
  return res.status(status).render('errors/error',
    {
      title,
      message
    }
  );
}

// 상품 구매 처리 

async function createOrder(req, res, next) {
  try {
    // order.routes.js에 있는 express-validator 결과 확인
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => error.msg)
        .join(' ');
    
      return renderError(res, 400, '구매 요청 오류', message);
    }
    // 사용자 버호 검증된 jwt에서 가져옴
    const userId = Number(req.user?.id);

    const productId = Number(req.body.productId);

    const quantity = Number(req.body.quantity);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return renderError(res, 401, '로그인 필요', '로그인 정보가 올바르지 않습니다.');
    }

    // repository에서 다음 작업을 하나의 트랜잭션으로 처리
    /* 
    1. 상품 및 재고 확인
    2. 주문 생성
    3. 주문 상품 생성
    4. 재고 감소 */

    const order = await orderRepository.createOrder({
      userId,
      productId,
      quantity
    });

    // 새로고침으로 같은 주문이 다시 생성되는 것을 
    // 줄이기 위해 Post 응답 후 Get으로 이동

    return res.redirect(303,
      `/orders/${encodeURIComponent(order.orderNumber)}`
    );
  } catch (error) {
    if(error.code === 'PRODUCT_NOT_FOUND') {
      return renderError(res, 404, '상품 없음', '구매하려는 상품을 찾을 수 없습니다.');
    }

  if (error.code === 'PRODUCT_NOT_ACTIVE') {
    return renderError(res, 409, '구매할 수 없는 상품', '현재 판매 중인 상품이 아닙니다.');
  }
  
  if (error.code === 'OUT_OF_STOCK') {
    return renderError(res, 409, '재고 부족', '요청한 수량만큼 재고가 없습니다.');
  }

  if (error.code === 'INVALID_QUANTITY') {
    return renderError(res, 400, '수량 오류', '구매 수량이 올바르지 않습니다.');
  }

  return next(error);
  }
}

// 현재 로그인 사용자의 주문 내역

async function showOrderHistory(req, res, next) {
  try{
    const userId = Number(req.user?.id);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return renderError(res, 401, '로그인 필요', '로그인 정보가 올바르지 않습니다.');
    }

    const orders = await orderRepository
      .findAllByUserId(userId);

    return res.render('orders/history', {
      title: '내 주문 내역',

      currentUser: res.locals.currentUser || null,

      orders
    });
  } catch (error) {
    return next(error);
  }
}

// 현재 로그인 사용자의 주문 상세

async function showOrderDetail(req, res, next) {
  try {
    const userId = Number(req.user?.id);

    const orderNumber = String(req.params.orderNumber || '').trim();

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return renderError(res, 401, '로그인 필요', '로그인 정보가 올바르지 않습니다.');
    }

    // 너무 길거나 허용하지 않는 문자가 포함된 주문번호 요청을 차단

    if (!/^[A-Za-z0-9-]{8,50}$/.test(orderNumber)) {
      return renderError(res, 400, '잘못된 주문번호', '주문번호 형식이 올바르지 않습니다.');
    }

    // 반드시 orderNumber와 userId 함꼐 조회
    // 다른 사용자의 주문을 보는 IDOR 취약점을 방지 부분
    const order = await orderRepository
      .findByOrderNumberAndUserId(orderNumber, userId);

    if(!order) {
      return renderError(res, 404, '주문 없음', '주문을 찾을 수 없습니다.');
    }
    
    return res.render('orders/complete', {
      title: '주문 상세',

      currentUser: res.locals.currentUser || null,

      order
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  showOrderHistory,
  showOrderDetail
};