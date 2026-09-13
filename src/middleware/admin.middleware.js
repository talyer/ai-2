'use strict';
const { createSecurityEvent } = require('../services/soc/event.service');

async function adminMiddleware(req, res, next) {
  if (req.user?.role === 'admin') {
    return next();
  }

  try {
    await createSecurityEvent({
      requestId: req.requestId,
      eventType : 'AUTH_ADMIN_DENIED',
      category : 'AUTHORIZATION',
      sourceIp : req.ip,
      userId : req.user?.userId || null,
      username : req.user?.username || null,
      method : req.method,
      path : req.originalUrl,
      statusCode : 403,
      riskScore : 60,
      summary : '관리자 페이지 접근이 거부되었습니다.'
    });
  } catch (error) {
    console.error(
      '관리자 접근 거부 이벤트 저장 실패:',
      error.message
    );
  }

  return res.status(403).json({
    message: '관리자 권한이 필요합니다.'
  });
}


module.exports = adminMiddleware;