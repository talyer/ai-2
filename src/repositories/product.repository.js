'use strict';

const {
  pool
} = require('../config/database');

async function findActiveByCategorySlug(
  categorySlug
) {
  const [rows] = await pool.execute(
    `
    SELECT
      p.id,
      p.name,
      p.description,
      p.price,
      p.stock_quantity,
      p.image_url,
      c.slug AS category_slug,
      c.name AS category_name
    FROM products AS p
    INNER JOIN categories AS c
      ON c.id = p.category_id
    WHERE c.slug = ?
      AND c.is_active = TRUE
      AND p.is_active = TRUE
    ORDER BY p.id ASC
    `,
    [categorySlug]
  );

  return rows;
}

// 상품 번호를 이용해 상품 하나를 조회.
async function findActiveById(productId) {
  const [rows] = await pool.execute(
    `
    SELECT
      p.id,
      p.name,
      p.description,
      p.price,
      p.stock_quantity,
      p.image_url,
      p.created_at,
      p.updated_at,
      c.slug AS category_slug,
      c.name AS category_name
    FROM products AS p
    INNER JOIN categories AS c
      ON c.id = p.category_id
    WHERE p.id = ?
      AND p.is_active = TRUE
      AND c.is_active = TRUE
    LIMIT 1
    `,
    [productId]
  );

  return rows[0] || null;
} 




module.exports = {
  findActiveByCategorySlug,
  findActiveById
};