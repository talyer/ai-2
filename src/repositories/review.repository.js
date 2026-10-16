'use strict';

const { pool } = require('../config/database');

function createReviewError(code, message) {
  const error = new Error(message);
  error.code = code;

  return error;
}

async function createReview({userId, orderItemId, rating, content}) {
  const normalizedContent = String(content || '').trim();

  const connection = await pool.getConnection();

  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    // orderItemId만 믿지 않고, 해당 주문 상품이 사용자의 것인지 DB에 확인 하는 파트

    const [items] = await connection.execute(
      `
      SELECT
        oi.id,
        oi.product_id AS productId,
        o.status AS orderStatus
      FROM order_items AS oi
      INNER JOIN orders AS o
        ON o.id = oi.order_id
      WHERE oi.id = ?
        AND o.user_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [orderItemId, userId]
    );

    if (items.length === 0) {
      throw createReviewError('PURCHASE_NOT_FOUND', '리뷰를 작성할 수 있는 구매 내역이 없습니다.');
    }

    const item = items[0];

    if (item.orderStatus !== 'DELIVERED') {
      throw createReviewError('PURCHASE_NOT_CONFIRMED', '구매확정 후 리뷰를 작성할 수 있습니다.');
    }

    const [existingReviews] = await connection.execute(
      `
      SELECT id
      FROM reviews
      WHERE order_item_id = ?
      LIMIT 1
      `,
      [orderItemId]
    );

    if (existingReviews.length > 0) {
      throw createReviewError('REVIEW_ALREADY_EXISTS', '이미 작성한 리뷰가 있습니다.');
    }

    const [result] = await connection.execute(
      `
      INSERT INTO reviews (
        order_item_id,
        user_id,
        product_id,
        rating,
        content,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'VISIBLE')
      `,
      [orderItemId, userId, item.productId, rating, normalizedContent]
    );

    await connection.commit();
    transactionStarted = false;

    return {
      reviewId: result.insertId,
      productId: item.productId
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw createReviewError('REVIEW_ALREADY_EXISTS', '이미 작성한 리뷰가 있습니다.');
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function findVisibleByProductId(productId) {
  const [rows] = await pool.execute(
    `
    SELECT 
      r.id,
      r.rating,
      r.content,
      r.created_at,
      u.display_name AS displayName
    FROM reviews AS r
    INNER JOIN users AS u
      ON u.id = r.user_id
    WHERE r.product_id = ?
      AND r.status = 'VISIBLE'
    ORDER BY r.created_at DESC
    LIMIT 100
    `,
    [productId]
  );

  return rows;
}

module.exports = {
  createReview,
  findVisibleByProductId
};