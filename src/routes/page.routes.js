'use strict';

const express = require('express');

const {
  checkDatabase
} = require('../config/database');

const {
  env
} = require('../config/env');

const router = express.Router();

/*
상품 카테고리 허용 목록
*/
const productCategories =
  Object.freeze({
    blouse: '블라우스',
    bracelet: '팔찌',
    cardigan: '가디건',
    coat: '코트',
    earring: '귀걸이',
    hood: '후드',
    jeans: '청바지',
    knitwear: '니트',
    necklace: '목걸이',
    ring: '반지',
    slacks: '슬랙스',
    't-shirt': '티셔츠'
  });

/*
기존 index.ejs의 tshirt를
실제 카테고리 이름 t-shirt로 변환
*/
const categoryAliases =
  Object.freeze({
    tshirt: 't-shirt'
  });

function getCurrentUser(res) {
  return (
    res.locals.currentUser || null
  );
}

function normalizeCategory(value) {
  const category =
    String(value || '')
      .trim()
      .toLowerCase();

  return (
    categoryAliases[category] ||
    category
  );
}

/*
모든 상품 카테고리는
products/category.ejs 하나를 사용합니다.
*/
function renderProductCategory(
  categoryValue,
  res,
  next
) {
  const category =
    normalizeCategory(
      categoryValue
    );

  const title =
    productCategories[category];

  /*
  허용 목록에 없는 카테고리이면
  app.js의 404 처리로 보냅니다.
  */
  if (!title) {
    return next();
  }

  return res.render(
    'products/category',
    {
      title,
      category,

      currentUser:
        getCurrentUser(res),

      /*
      MySQL 상품 기능 구현 전에는
      빈 배열을 전달합니다.
      */
      products: []
    }
  );
}

/*
메인 쇼핑몰 화면

GET /
*/
router.get(
  '/',
  (req, res) => {
    return res.render(
      'home/index',
      {
        title:
          'HANSEI AI 쇼핑몰',

        currentUser:
          getCurrentUser(res)
      }
    );
  }
);

/*
서버와 MySQL 연결 확인

GET /health
*/
router.get(
  '/health',
  async (req, res) => {
    try {
      await checkDatabase();

      return res.status(200).json({
        status: 'ok',
        server: 'connected',
        database: 'connected',

        aiProvider:
          env.ai.provider,

        socEnabled:
          env.soc.enabled
      });
    } catch (error) {
      console.error(
        'Health Check DB 오류:',
        error.message
      );

      return res.status(503).json({
        status: 'error',
        server: 'connected',
        database: 'disconnected',

        aiProvider:
          env.ai.provider,

        socEnabled:
          env.soc.enabled
      });
    }
  }
);

/*
현재 index.ejs에서 사용하는 주소

GET /products
GET /products?category=blouse
GET /products?category=tshirt
*/
router.get(
  '/products',
  (req, res, next) => {
    /*
    category가 없으면 티셔츠를 기본값으로 사용합니다.
    */
    const category =
      req.query.category ||
      't-shirt';

    return renderProductCategory(
      category,
      res,
      next
    );
  }
);

/*
경로 형식도 지원합니다.

GET /products/blouse
GET /products/coat
GET /products/t-shirt
*/
router.get(
  '/products/:category',
  (req, res, next) => {
    return renderProductCategory(
      req.params.category,
      res,
      next
    );
  }
);

module.exports = router;