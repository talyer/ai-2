'use strict';

const { inspectRequest } = require('../services/soc/detector.service');

async function wafMiddleware(req, res, next) {
  try {
    const result = await inspectRequest(req);

    if (result && result.incident && Number(result.incident.risk_score) >= 70) {
      return res.status(403).render('errors/error', {
        title: '요청 차단',
        message: '보안 검사에서 위험한 입력 패턴이 탐지되어 요청을 차단했습니다.'
      });
    }
  } catch (error) {
    console.error('WAF 검사 실패:', error.message);
  }

  return next();
}

module.exports = wafMiddleware;
