'use strict';

// 물품 사진 추가

const fs = require('node:fs');
const path = require('node:path');
//////////////////////////////////////
const bcrypt = require('bcrypt');

const {
  pool,
  closeDatabasePool
} = require('../src/config/database');

const products = [
  {
    categorySlug: 't-shirt',
    name: '베이직 반팔 티셔츠',
    description: '편하게 착용할 수 있는 기본 티셔츠',
    price: 19900,
    stockQuantity: 30,
    imageUrl: '/images/T-shirt1.jfif'
  },
  {
    categorySlug: 'blouse',
    name: '데일리 블라우스',
    description: '일상에서 착용하기 좋은 블라우스',
    price: 32900,
    stockQuantity: 20,
    imageUrl: '/images/blouse1.png'
  },
  {
    categorySlug: 'hood',
    name: '베이직 후드',
    description: '편안한 기본 후드 상품',
    price: 39900,
    stockQuantity: 20,
    imageUrl: '/images/hood1.jfif'
  },
  {
    categorySlug: 'knitwear',
    name: '라운드 니트',
    description: '부드러운 소재의 라운드 니트',
    price: 45900,
    stockQuantity: 15,
    imageUrl: '/images/knitwear1.jfif'
  },
  {
    categorySlug: 'jeans',
    name: '스트레이트 청바지',
    description: '기본 스트레이트 핏 청바지',
    price: 49900,
    stockQuantity: 20,
    imageUrl: '/images/jeans1.jfif'
  },
  {
    categorySlug: 'slacks',
    name: '데일리 슬랙스',
    description: '깔끔한 디자인의 기본 슬랙스',
    price: 43900,
    stockQuantity: 20,
    imageUrl: '/images/slacks1.png'
  },
  {
    categorySlug: 'coat',
    name: '싱글 롱코트',
    description: '겨울용 싱글 롱코트',
    price: 109000,
    stockQuantity: 10,
    imageUrl: '/images/coat1.jfif'
  },
  {
    categorySlug: 'cardigan',
    name: '베이직 가디건',
    description: '가볍게 착용할 수 있는 가디건',
    price: 39900,
    stockQuantity: 15,
    imageUrl: '/images/cardigan1.jfif'
  },
  {
    categorySlug: 'earring',
    name: '미니 링 귀걸이',
    description: '심플한 디자인의 링 귀걸이',
    price: 12900,
    stockQuantity: 30,
    imageUrl: '/images/earring1.jfif'
  },
  {
    categorySlug: 'necklace',
    name: '실버 목걸이',
    description: '기본 디자인의 실버 목걸이',
    price: 24900,
    stockQuantity: 20,
    imageUrl: '/images/necklace1.jfif'
  },
  {
    categorySlug: 'ring',
    name: '심플 반지',
    description: '데일리로 착용할 수 있는 반지',
    price: 15900,
    stockQuantity: 25,
    imageUrl: '/images/ring1.jfif'
  },
  {
    categorySlug: 'bracelet',
    name: '체인 팔찌',
    description: '심플한 체인 형태의 팔찌',
    price: 19900,
    stockQuantity: 20,
    imageUrl: '/images/bracelet1.jfif'
  }
];

async function seedAdmin(connection) {
  const password =
    process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD는 12자 이상으로 설정해주세요.'
    );
  }

  const [existingUsers] =
    await connection.execute(
      `
      SELECT id
      FROM users
      WHERE login_id = ?
      LIMIT 1
      `,
      ['admin']
    );

  if (existingUsers.length > 0) {
    console.log(
      '관리자 계정이 이미 존재하여 건너뜁니다.'
    );

    return;
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  await connection.execute(
    `
    INSERT INTO users (
      login_id,
      email,
      password_hash,
      display_name,
      role,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      'admin',
      'admin@local.test',
      passwordHash,
      '관리자',
      'ADMIN',
      'ACTIVE'
    ]
  );

  console.log('관리자 계정 생성 완료');
}

async function seedProducts(connection) {
  for (const product of products) {
    const [categories] =
      await connection.execute(
        `
        SELECT id
        FROM categories
        WHERE slug = ?
        LIMIT 1
        `,
        [product.categorySlug]
      );

    if (categories.length === 0) {
      throw new Error(
        `카테고리가 없습니다: ${product.categorySlug}`
      );
    }

    const categoryId =
      categories[0].id;

    const [existingProducts] =
      await connection.execute(
        `
        SELECT id
        FROM products
        WHERE category_id = ?
          AND name = ?
        LIMIT 1
        `,
        [
          categoryId,
          product.name
        ]
      );

    if (existingProducts.length > 0) {
      await connection.execute(
        `
        UPDATE products
        SET
          description = ?,
          price = ?,
          stock_quantity = ?,
          image_url = ?,
          is_active = TRUE
        WHERE id = ?
        `,
        [
          product.description,
          product.price,
          product.stockQuantity,
          product.imageUrl,
          existingProducts[0].id
        ]
      );

      console.log(
        `기존 상품 수정: ${product.name}`
      );

      continue;
    }

    await connection.execute(
      `
      INSERT INTO products (
        category_id,
        name,
        description,
        price,
        stock_quantity,
        image_url,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `,
      [
        categoryId,
        product.name,
        product.description,
        product.price,
        product.stockQuantity,
        product.imageUrl
      ]
    );

    console.log(
      `새 상품 등록: ${product.name}`
    );
  }
}

async function seed() {
  let connection;

  try {
    console.log(
      '초기 데이터 등록을 시작합니다.'
    );

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    await seedAdmin(connection);
    await seedProducts(connection);

    await connection.commit();

    console.log(
      '초기 데이터 등록이 완료되었습니다.'
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      '초기 데이터 등록 실패:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await closeDatabasePool();
  }
}

seed();