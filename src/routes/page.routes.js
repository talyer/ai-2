'use strict';

const express = require('express');

const {
  checkDatabase
} = require('../config/database');


const {
  env
} = require('../config/env');

const router = express.Router();

const productRepository = require('../repositories/product.repository');


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
async function renderProductCategory(
  categoryValue,
  res,
  next
) {
  try {
    const category =
      normalizeCategory(
        categoryValue
      );

    const title =
      productCategories[category];

    if (!title) {
      return next();
    }
    //  적용 만약에 없는 카테고리면 304오류
    const products =
      await productRepository
        .findActiveByCategorySlug(
          category
        );

    return res.render(
      'products/category',
      {
        title,
        category,

        currentUser:
          getCurrentUser(res),

        products
      }
    );
  } catch (error) {
    return next(error);
  }
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



// 상품 상세 화면
router.get('/products/detail/:productId',
  async (req, res, next) => {
    try {
      const productId = Number(req.params.productId);

      // 상품 번호가 양의 정수가 아니면 잘못된 요청으로 처리 
      if (!Number.isSafeInteger(productId) || productId < 1) {
        return res.status(400).render('errors/error',
          {
            title: '잘못된 상품 번호',
            message: '상품 번호가 올바르지 않습니다.'
          }
        );
      }

      const product = await productRepository
        .findActiveById(productId);

      // DB에 해당 상품이 없거나 비활성 상품이면 404 반환
      if (!product) {
        return res.status(404).render('errors/error',
          {
            tittle: '상품 없음',
            message: '요청한 상품을 찾을 수 없습니다.'
          }
        );
      }

      return res.render('products/detail',
        {
          title: product.name,
          product,

          currentUser: getCurrentUser(res)
        }
      );
    } catch (error) {
      return next(error);
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