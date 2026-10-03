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

module.exports = {
  findActiveByCategorySlug
};