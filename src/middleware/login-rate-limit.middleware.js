const { rateLimit } = require('express-rate-limit');

const {
  createSecurityEvent
} = require('../services/soc/event.service');

const loginRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,

  standardHeaders: 'draft-7',
  legacyHeaders: false,

  handler: (req, res) => {
    createSecurityEvent({
      requestId : req.requestId,
      eventType : 'WEB_RATE_LIMIT',
      category : 'AUTHENTICATION',
      sourceIp : req.ip,
      username : req.body?.username || null,
      method : req.method,
      path : req.originalUrl,
      statusCode : 429,
      riskScore : 45,
      summary : '로그인 요청 횟수 제한을 초과했습니다.' 
    }).catch((error) => {
      console.error(
        'Rate Limit 이벤트 저장 실패:',
        error.message
      );
    });

    return res.status(429).json({
      message:
      '로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

module.exports = loginRateLimit;