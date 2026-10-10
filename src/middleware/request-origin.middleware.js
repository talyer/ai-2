'use strict';

const { env } = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const allowedOrigin = new URL(env.appOrigin).origin;

function rejectRequest(res) {
  return res.status(403).render('errors/error',{
    title: '요청 거부',
    message: '허용되지 않은 사이트에서 전송된 요청입니다.'
  });
}

function requestOriginMiddleware(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }
  // 브라우저가 알려주는 요청 출처 정보
  const fetchSite = req.get('sec-fetch-site');

  if(fetchSite === 'cross-site') {
    return rejectRequest(res);
  }

  const origin = req.get('origin');

  if (origin) {
    try {
      if (new URL(origin).orign !== allowedOrigin) {
        return rejectRequest(res);
      }
    } catch (error) {
      return rejectRequest(res);
    }
  }

  const referer = req.get('referer');

  if (!origin && referer) {
    try {
      if(new URL(referer).origin !== allowedOrigin) {
        return rejectRequest(res);
      }
    } catch (error) {
      return rejectRequest(res);
    }
  }

  return next();
}

module.exports = requestOriginMiddleware;