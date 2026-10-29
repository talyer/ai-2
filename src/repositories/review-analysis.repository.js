'use strict';

const { pool } = require('../config/database');

async function createPending({reviewId, provider, modelName}) {
  await pool.execute(
    `
    INSERT INTO review_analysis (
      review_id,
      provider,
      model_name, 
      analysis_status
      )
    VALUES (?, ?, ?, 'PENDING)

    ON DUPLICATE KEY UPDATE
      provider = VALUES(provider),
      model_name = VALUES(model_name),
      analysis_status = 'PENDING',
      sentiment = NULL,
      summary = NULL,
      error_message = NULL,
      analyzed_at = NULL
    `,
    [reviewId, provider, modelName]
  );
}

// 분석 실행 중 상태로 변경 함수

async function markProcessing(reviewId) {
  await pool.execute(
    `
    UPDATE review_analysis
    SET analysis_status = 'PROCESSING'
    WHERE review_id = ?
    `,
    [reviewId]
  );
}

// 정상적으로 분석이 끝난 경우
async function markCompleted({
  reviewId,
  sentiment,
  sentimentScore,
  keywords,
  summary
}) {
  await pool.execute(
    `
    UPDATE review_analysis
    SET
      analysis_status = 'COMPLETED',
      sentiment = ?,
      sentiment_score = ?,
      keywords = ?,
      summary = ?,
      error_message = NULL,
      analyzed_at = CURRENT_TIMESTAMP
    WHERE review_id = ?
    `,
    [
      sentiment,
      sentimentScore,
      JSON.stringify(keywords),
      summary,
      reviewId
    ]
  );
}

// ai 호출, 결과 처리 실패 경우 함수
async function markFailed({
  reviewId,
  errorMessage
}) {
  await pool.execute(
    `
    UPDATE review_analysis
    SET
      analysis_status = 'FAILED',
      error_message = ?,
      analyzed_at = CURRENT_TIMESTAMP
    WHERE review_id = ?
    `,
    [
      String(errorMessage || '알수 없는 분석 오류').slice(0, 1000),
      reviewId
    ]
  );
}


module.exports = {
  createPending,
  markProcessing,
  markCompleted,
  markFailed
}