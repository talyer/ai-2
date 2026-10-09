'use strict';

const {
  randomBytes
} = require('node:crypto');

const {
  pool
} = require('../config/database');

/*
Controller에서 구분할 수 있는
주문 오류를 생성합니다.
*/
function createOrderError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

/*
사용자에게 공개할 주문번호를 생성합니다.

예:
SHOP-20261009-A18C85E9D1134B21
*/
function createOrderNumber() {
  const date =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

  const randomValue =
    randomBytes(8)
      .toString('hex')
      .toUpperCase();

  return (
    `SHOP-${date}-${randomValue}`
  );
}

/*
주문 생성

1. 상품 행 잠금
2. 상품과 재고 확인
3. 주문 저장
4. 주문 상품 저장
5. 재고 감소
6. commit 또는 rollback
*/
async function createOrder({
  userId,
  productId,
  quantity
}) {
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1
  ) {
    throw createOrderError(
      'INVALID_USER',
      '사용자 번호가 올바르지 않습니다.'
    );
  }

  if (
    !Number.isSafeInteger(productId) ||
    productId < 1
  ) {
    throw createOrderError(
      'PRODUCT_NOT_FOUND',
      '상품 번호가 올바르지 않습니다.'
    );
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 10
  ) {
    throw createOrderError(
      'INVALID_QUANTITY',
      '구매 수량이 올바르지 않습니다.'
    );
  }

  const connection =
    await pool.getConnection();

  let transactionStarted = false;

  try {
    await connection.beginTransaction();

    transactionStarted = true;

    /*
    동시에 같은 상품을 구매할 때
    재고가 음수가 되지 않도록 상품 행을 잠급니다.
    */
    const [products] =
      await connection.execute(
        `
        SELECT
          id,
          name,
          price,
          stock_quantity,
          is_active
        FROM products
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [productId]
      );

    if (products.length === 0) {
      throw createOrderError(
        'PRODUCT_NOT_FOUND',
        '상품을 찾을 수 없습니다.'
      );
    }

    const product =
      products[0];

    if (!product.is_active) {
      throw createOrderError(
        'PRODUCT_NOT_ACTIVE',
        '현재 판매 중인 상품이 아닙니다.'
      );
    }

    if (
      Number(product.stock_quantity) <
      quantity
    ) {
      throw createOrderError(
        'OUT_OF_STOCK',
        '상품 재고가 부족합니다.'
      );
    }

    /*
    브라우저에서 가격을 받지 않고
    DB에 저장된 실제 가격을 사용합니다.
    */
    const unitPrice =
      Number(product.price);

    const totalAmount =
      (
        Math.round(
          unitPrice * 100
        ) *
        quantity /
        100
      ).toFixed(2);

    const orderNumber =
      createOrderNumber();

    /*
    실제 결제 기능은 아직 없으므로
    주문 상태를 PENDING으로 저장합니다.
    */
    const [orderResult] =
      await connection.execute(
        `
        INSERT INTO orders (
          user_id,
          order_number,
          status,
          total_amount
        )
        VALUES (?, ?, 'PENDING', ?)
        `,
        [
          userId,
          orderNumber,
          totalAmount
        ]
      );

    const orderId =
      orderResult.insertId;

    /*
    상품 이름과 가격을 주문 시점 기준으로 저장합니다.

    나중에 상품 가격이나 이름이 바뀌어도
    과거 주문 내역은 그대로 유지됩니다.
    */
    await connection.execute(
      `
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name_snapshot,
        quantity,
        unit_price
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        orderId,
        product.id,
        product.name,
        quantity,
        product.price
      ]
    );

    const [stockResult] =
      await connection.execute(
        `
        UPDATE products
        SET
          stock_quantity =
            stock_quantity - ?
        WHERE id = ?
          AND stock_quantity >= ?
        `,
        [
          quantity,
          product.id,
          quantity
        ]
      );

    if (
      stockResult.affectedRows !== 1
    ) {
      throw createOrderError(
        'OUT_OF_STOCK',
        '상품 재고가 부족합니다.'
      );
    }

    await connection.commit();

    transactionStarted = false;

    return {
      id: orderId,
      orderNumber,
      status: 'PENDING',
      totalAmount
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }
}

/*
로그인 사용자의 주문 목록을 조회합니다.
*/
async function findAllByUserId(
  userId
) {
  const [rows] =
    await pool.execute(
      `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.ordered_at,
        COUNT(oi.id) AS item_count,
        COALESCE(
          SUM(oi.quantity),
          0
        ) AS total_quantity
      FROM orders AS o
      LEFT JOIN order_items AS oi
        ON oi.order_id = o.id
      WHERE o.user_id = ?
      GROUP BY
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.ordered_at
      ORDER BY o.ordered_at DESC
      `,
      [userId]
    );

  return rows;
}

/*
주문번호와 로그인 사용자 번호를 함께 사용하여
자신의 주문만 조회합니다.
*/
async function findByOrderNumberAndUserId(
  orderNumber,
  userId
) {
  const [orders] =
    await pool.execute(
      `
      SELECT
        id,
        order_number,
        status,
        total_amount,
        ordered_at,
        updated_at
      FROM orders
      WHERE order_number = ?
        AND user_id = ?
      LIMIT 1
      `,
      [
        orderNumber,
        userId
      ]
    );

  if (orders.length === 0) {
    return null;
  }

  const order =
    orders[0];

  const [items] =
    await pool.execute(
      `
      SELECT
        oi.id,
        oi.product_id,
        oi.product_name_snapshot,
        oi.quantity,
        oi.unit_price,
        p.image_url
      FROM order_items AS oi
      LEFT JOIN products AS p
        ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
      `,
      [order.id]
    );

  return {
    ...order,
    items
  };
}

module.exports = {
  createOrder,
  findAllByUserId,
  findByOrderNumberAndUserId
};