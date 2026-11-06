'use strict';

const { pool } = require('../config/database');

async function createPending({reviewId, provider, modelName}) {
  const [result] = await pool.execute(
    `
    INSERT INTO review_analysis (
      review_id,
      provider,
      model_name, 
      analysis_status
      )
    VALUES (?, ?, ?, 'PENDING')

    ON DUPLICATE KEY UPDATE
      provider = VALUES(provider),
      model_name = VALUES(model_name),
      analysis_status = 'PENDING',
      sentiment = NULL,
      sentiment_score = NULL,
      keywords = NULL,
      summary = NULL,
      error_message = NULL,
      analyzed_at = NULL
    `,
    [reviewId, provider, modelName]
  );
  return result;

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

// 지금 분석 리뷰가 아예 안되서 임시 추가
function normalizeSentiment(value) {
  const sentimentValue = String(value || '')
    .trim()
    .toUpperCase();

  const sentimentMap = {
    POSITIVE: 'POSITIVE',
    POS: 'POSITIVE',
    '긍정': 'POSITIVE',

    NEUTRAL: 'NEUTRAL',
    MIXED: 'NEUTRAL',
    UNKNOWN: 'NEUTRAL',
    '중립': 'NEUTRAL',
    '혼합': 'NEUTRAL',

    NEGATIVE: 'NEGATIVE',
    NEG: 'NEGATIVE',
    '부정': 'NEGATIVE'

  };

  const normalized = sentimentMap[sentimentValue];

  if (!normalized) {
    console.warn(`[감정값 변환] 허용되지 않은 값 "${value}"를 NEUTRAL로 변경합니다."`);

    return 'NEUTRAL';
  }

  return normalized;
}


// 정상적으로 분석이 끝난 경우
async function markCompleted({
  reviewId,
  sentiment,
  sentimentScore,
  keywords,
  summary
}) {
  const normalizedSentimentValue = normalizeSentiment(sentiment);

  const normalizedScore = Number.isFinite(Number(sentimentScore))
    ? Number(sentimentScore)
    : null;

  console.log(`[리뷰 ${reviewId}] 감정값:`,
    JSON.stringify(sentiment), '->', normalizedSentimentValue
  );

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
      normalizedSentimentValue,
      normalizedScore,
      JSON.stringify(keywords || [] ),
      summary || null,
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
  normalizeSentiment,
  markCompleted,
  markFailed
};