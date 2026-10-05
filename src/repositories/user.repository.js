'use strict';

const { pool } = require('../config/database');

// 사용자 공통 정보 조회
async function findByLoginId(loginId) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      login_id AS loginId,
      email,
      password_hash AS passwordHash,
      display_name AS displayName,
      role,
      status,
      failed_login_count AS failedLoginCount,
      locked_until AS lockedUntil
    FROM users
    WHERE login_id = ?
    LIMIT 1`,
    [loginId]
  );

  return rows[0] || null;
}

// 이메일로 사용자 조회
async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      login_id AS loginId,
      email,
      password_hash AS passwordHash,
      display_name AS displayName,
      role,
      status,
      failed_login_count AS failedLoginCount,
      locked_until AS lockedUntil
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

// 사용자 번호로 조회
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      login_id AS loginId,
      email,
      display_name AS displayName,
      role,
      status,
      failed_login_count AS failedLoginCount,
      locked_until AS lockedUntil
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

// 신규 사용자 저장
async function createUser({
  loginId,
  email,
  passwordHash,
  displayName
}) {
  const [result] = await pool.execute(
    `INSERT INTO users (
      login_id,
      email,
      password_hash,
      display_name
    ) VALUES (?, ?, ?, ?)`,
    [loginId, email, passwordHash, displayName]
  );

  return result.insertId;
}

// 로그인 실패 횟수 증가
async function incrementFailedLoginCount(id) {
  await pool.execute(
    `UPDATE users
     SET failed_login_count = failed_login_count + 1
     WHERE id = ?`,
    [id]
  );

  return findById(id);
}

// 로그인 실패 횟수 및 잠금 초기화
async function resetLoginFailures(id) {
  await pool.execute(
    `UPDATE users
     SET failed_login_count = 0,
         locked_until = NULL
     WHERE id = ?`,
    [id]
  );
}

// 계정 임시 잠금 시간 설정
async function lockUserUntil(id, lockedUntil) {
  await pool.execute(
    `UPDATE users
     SET locked_until = ?
     WHERE id = ?`,
    [lockedUntil, id]
  );
}

module.exports = {
  findByLoginId,
  findByEmail,
  findById,
  createUser,
  incrementFailedLoginCount,
  resetLoginFailures,
  lockUserUntil
};