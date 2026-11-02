'use strict';

const { pool, closeDatabasePool } = require('../src/config/database');

const reviewAnalysisService = require('../src/services/review-analysis.service');

async function analyzeExistingReviews() {
  const [reviews] = await pool.execute(
    `
    SELECT 
      r.id AS reviewId,
      r.content,
      ra.analysis_status
        AS analysisStatus
    FROM reviews AS r
    LEFT JOIN review_analysis AS ra
      ON ra.review_id = r.id
    WHERE r.status = 'VISIBLE'
      AND (
        ra.id IS NULL
        OR ra.analysis_status IN (
          'PENDING',
          'PROCESSING',
          'FAILED'
        )
      )
    ORDER BY r.id ASC
    `
  );

  console.log(`분석할 리뷰: ${reviews.length}개`);

  for (const review of reviews) {
    try {
      console.log(`리뷰 ${review.reviewId} 분석 시작`);

      await reviewAnalysisService
        .analyzeReview({
          reviewId: review.reviewId,

          content: review.content
        });

      console.log(`리뷰 ${review.reviewId} 분석 완료`);
    } catch (error) {
      console.error(`리뷰 ${review.reviewId} 분석 실패:`, error.message);
    }
  }
}

analyzeExistingReviews().then(() => {
  console.log('기존 리뷰 분석 작업 완료');
}).catch((error) => {
  console.error('기존 리뷰 분석 작업 실패:', error);

  process.exitCode = 1;
}).finally(async () => {
  await closeDatabasePool();
});

