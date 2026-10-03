-- database/soc-schema.sql

SET NAMES utf8mb4;

-- 1. 개별 보안 이벤트
CREATE TABLE IF NOT EXISTS security_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  request_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  category VARCHAR(80) NOT NULL,
  source_ip VARCHAR(45) NOT NULL,

  user_id BIGINT UNSIGNED NULL,
  username VARCHAR(100) NULL,

  http_method VARCHAR(10) NULL,
  request_path VARCHAR(500) NULL,
  status_code SMALLINT UNSIGNED NULL,

  risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  detector VARCHAR(30) NOT NULL DEFAULT 'RULE',

  summary VARCHAR(500) NOT NULL,
  evidence_json JSON NULL,

  occurred_at DATETIME(3) NOT NULL
    DEFAULT CURRENT_TIMESTAMP(3),

  created_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_security_events_request_id (request_id),
  KEY idx_security_events_event_type (event_type),
  KEY idx_security_events_category (category),
  KEY idx_security_events_source_ip (source_ip),
  KEY idx_security_events_user_id (user_id),
  KEY idx_security_events_risk_score (risk_score),
  KEY idx_security_events_occurred_at (occurred_at),

  CONSTRAINT fk_security_events_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_security_events_risk_score
    CHECK (risk_score BETWEEN 0 AND 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 2. 여러 이벤트를 묶은 보안 사건
CREATE TABLE IF NOT EXISTS security_incidents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  incident_key VARCHAR(128) NULL,
  incident_type VARCHAR(80) NOT NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT NULL,

  source_ip VARCHAR(45) NULL,
  user_id BIGINT UNSIGNED NULL,

  severity ENUM(
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  ) NOT NULL DEFAULT 'LOW',

  status ENUM(
    'OPEN',
    'INVESTIGATING',
    'CONTAINED',
    'RESOLVED',
    'FALSE_POSITIVE'
  ) NOT NULL DEFAULT 'OPEN',

  risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  event_count INT UNSIGNED NOT NULL DEFAULT 1,

  assigned_user_id BIGINT UNSIGNED NULL,

  first_seen_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,

  resolved_at DATETIME NULL,
  resolution_note TEXT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_incidents_incident_key (incident_key),
  KEY idx_incidents_status (status),
  KEY idx_incidents_severity (severity),
  KEY idx_incidents_source_ip (source_ip),
  KEY idx_incidents_last_seen_at (last_seen_at),

  CONSTRAINT fk_incidents_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_incidents_assigned_user
    FOREIGN KEY (assigned_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_incidents_risk_score
    CHECK (risk_score BETWEEN 0 AND 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 3. 사건과 이벤트 연결
CREATE TABLE IF NOT EXISTS incident_events (
  incident_id BIGINT UNSIGNED NOT NULL,
  event_id BIGINT UNSIGNED NOT NULL,

  linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (incident_id, event_id),
  KEY idx_incident_events_event_id (event_id),

  CONSTRAINT fk_incident_events_incident
    FOREIGN KEY (incident_id)
    REFERENCES security_incidents(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_incident_events_event
    FOREIGN KEY (event_id)
    REFERENCES security_events(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 4. Ollama gpt-oss:20b의 SOC 분석 결과
CREATE TABLE IF NOT EXISTS incident_ai_analyses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_id BIGINT UNSIGNED NOT NULL,

  provider VARCHAR(30) NOT NULL DEFAULT 'ollama',
  model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-oss:20b',

  analysis_status ENUM(
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
  ) NOT NULL DEFAULT 'PENDING',

  incident_type VARCHAR(80) NULL,
  summary TEXT NULL,

  evidence_json JSON NULL,
  recommended_actions_json JSON NULL,

  confidence DECIMAL(5, 4) NULL,
  error_message VARCHAR(1000) NULL,

  analyzed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_ai_analyses_incident_id (incident_id),
  KEY idx_ai_analyses_status (analysis_status),

  CONSTRAINT fk_ai_analyses_incident
    FOREIGN KEY (incident_id)
    REFERENCES security_incidents(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_ai_analyses_confidence
    CHECK (
      confidence IS NULL OR
      confidence BETWEEN 0 AND 1
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 5. 임시 차단 IP
CREATE TABLE IF NOT EXISTS blocked_ips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  ip_address VARCHAR(45) NOT NULL,

  block_type ENUM(
    'TEMPORARY',
    'MANUAL',
    'PERMANENT'
  ) NOT NULL DEFAULT 'TEMPORARY',

  reason VARCHAR(500) NOT NULL,

  incident_id BIGINT UNSIGNED NULL,
  blocked_by_user_id BIGINT UNSIGNED NULL,

  blocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  released_at DATETIME NULL,

  PRIMARY KEY (id),

  KEY idx_blocked_ips_lookup (
    ip_address,
    expires_at,
    released_at
  ),

  CONSTRAINT fk_blocked_ips_incident
    FOREIGN KEY (incident_id)
    REFERENCES security_incidents(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_blocked_ips_user
    FOREIGN KEY (blocked_by_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- 6. 대응 조치와 관리자 승인 이력
CREATE TABLE IF NOT EXISTS response_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  incident_id BIGINT UNSIGNED NOT NULL,

  action_type VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_value VARCHAR(255) NULL,

  decision_source ENUM(
    'RULE',
    'AI_RECOMMENDATION',
    'ADMIN'
  ) NOT NULL,

  action_status ENUM(
    'PENDING_APPROVAL',
    'APPROVED',
    'EXECUTED',
    'REJECTED',
    'FAILED'
  ) NOT NULL DEFAULT 'PENDING_APPROVAL',

  reason TEXT NULL,
  result_json JSON NULL,

  approved_by_user_id BIGINT UNSIGNED NULL,

  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  executed_at DATETIME NULL,

  PRIMARY KEY (id),

  KEY idx_response_actions_incident_id (incident_id),
  KEY idx_response_actions_status (action_status),

  CONSTRAINT fk_response_actions_incident
    FOREIGN KEY (incident_id)
    REFERENCES security_incidents(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_response_actions_approver
    FOREIGN KEY (approved_by_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;