-- database/schema.sql

SET NAMES utf8mb4;

-- 1. 회원
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  login_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(80) NOT NULL,

  role ENUM(
    'CUSTOMER',
    'ADMIN',
    'SECURITY_ANALYST'
  ) NOT NULL DEFAULT 'CUSTOMER',

  status ENUM(
    'ACTIVE',
    'LOCKED',
    'WITHDRAWN'
  ) NOT NULL DEFAULT 'ACTIVE',

  failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_login_id (login_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 2. 상품 카테고리
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  slug VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 3. 상품
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  category_id BIGINT UNSIGNED NOT NULL,

  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12, 2) NOT NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_products_category_id (category_id),
  KEY idx_products_active (is_active),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_products_price
    CHECK (price >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 4. 주문
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  user_id BIGINT UNSIGNED NOT NULL,
  order_number VARCHAR(50) NOT NULL,

  status ENUM(
    'PENDING',
    'PAID',
    'SHIPPING',
    'DELIVERED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING',

  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

  ordered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_status (status),

  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_orders_total_amount
    CHECK (total_amount >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 5. 주문 상품
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,

  product_name_snapshot VARCHAR(150) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_product_id (product_id),

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_order_items_quantity
    CHECK (quantity > 0),

  CONSTRAINT chk_order_items_unit_price
    CHECK (unit_price >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 6. 리뷰
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  order_item_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,

  rating TINYINT UNSIGNED NULL,
  content TEXT NOT NULL,

  status ENUM(
    'VISIBLE',
    'HIDDEN',
    'DELETED'
  ) NOT NULL DEFAULT 'VISIBLE',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_reviews_order_item_id (order_item_id),
  KEY idx_reviews_user_id (user_id),
  KEY idx_reviews_product_id (product_id),
  KEY idx_reviews_status (status),

  CONSTRAINT fk_reviews_order_item
    FOREIGN KEY (order_item_id)
    REFERENCES order_items(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_reviews_rating
    CHECK (
      rating IS NULL OR
      rating BETWEEN 1 AND 5
    ),

  CONSTRAINT chk_reviews_content_length
    CHECK (
      CHAR_LENGTH(content)
      BETWEEN 2 AND 2000
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 7. CLOVA 리뷰 분석 결과
CREATE TABLE IF NOT EXISTS review_analysis (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id BIGINT UNSIGNED NOT NULL,

  provider VARCHAR(30) NOT NULL DEFAULT 'clova',
  model_name VARCHAR(100) NULL,

  analysis_status ENUM(
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
  ) NOT NULL DEFAULT 'PENDING',

  sentiment ENUM(
    'POSITIVE',
    'NEUTRAL',
    'NEGATIVE'
  ) NULL,

  sentiment_score DECIMAL(5, 4) NULL,
  keywords JSON NULL,
  summary TEXT NULL,
  error_message VARCHAR(1000) NULL,

  analyzed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_review_analysis_review_id (review_id),
  KEY idx_review_analysis_status (analysis_status),

  CONSTRAINT fk_review_analysis_review
    FOREIGN KEY (review_id)
    REFERENCES reviews(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_review_sentiment_score
    CHECK (
      sentiment_score IS NULL OR
      sentiment_score BETWEEN 0 AND 1
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 초기 카테고리
INSERT IGNORE INTO categories (
  slug,
  name,
  sort_order
) VALUES
  ('t-shirt', '티셔츠', 1),
  ('blouse', '블라우스', 2),
  ('hood', '후드', 3),
  ('knitwear', '니트', 4),
  ('jeans', '청바지', 5),
  ('slacks', '슬랙스', 6),
  ('coat', '코트', 7),
  ('cardigan', '가디건', 8),
  ('earring', '귀걸이', 9),
  ('necklace', '목걸이', 10),
  ('ring', '반지', 11),
  ('bracelet', '팔찌', 12);