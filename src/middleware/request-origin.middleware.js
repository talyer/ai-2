'use strict';

const { env } = require('../config/env');

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS'
]);

const allowedUrl =
  new URL(env.appOrigin);

const allowedOrigin =
  allowedUrl.origin;

const allowedHost =
  allowedUrl.host.toLowerCase();

function rejectRequest(
  req,
  res,
  reason
) {
  console.warn('[Origin 차단]', {
    reason,
    method: req.method,
    path: req.originalUrl,
    allowedOrigin,
    requestOrigin:
      req.get('origin') || null,
    requestHost:
      req.get('host') || null,
    referer:
      req.get('referer') || null,
    fetchSite:
      req.get('sec-fetch-site') || null
  });

  return res.status(403).render(
    'errors/error',
    {
      title: '요청 거부',
      message:
        '허용되지 않은 사이트에서 전송된 요청입니다.'
    }
  );
}

function requestOriginMiddleware(
  req,
  res,
  next
) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const fetchSite =
    req.get('sec-fetch-site');

  const requestHost =
    String(req.get('host') || '')
      .toLowerCase();

  /*
  다른 사이트에서 전달된 요청은 차단합니다.
  */
  if (fetchSite === 'cross-site') {
    return rejectRequest(
      req,
      res,
      'cross-site 요청'
    );
  }

  const origin = req.get('origin');

  /*
  일부 브라우저나 개인정보 보호 설정에서는
  Origin을 문자열 "null"로 전송할 수 있습니다.

  이 경우 브라우저의 same-origin 정보와
  Host 값이 모두 일치할 때만 허용합니다.
  */
  if (origin === 'null') {
    const isSameOrigin =
      fetchSite === 'same-origin';

    const isSameHost =
      requestHost === allowedHost;

    if (!isSameOrigin || !isSameHost) {
      return rejectRequest(
        req,
        res,
        'null Origin 검증 실패'
      );
    }

    return next();
  }

  /*
  일반적인 Origin 주소 검사
  */
  if (origin) {
    try {
      const requestOrigin =
        new URL(origin).origin;

      if (requestOrigin !== allowedOrigin) {
        return rejectRequest(
          req,
          res,
          'Origin 불일치'
        );
      }
    } catch (error) {
      return rejectRequest(
        req,
        res,
        '잘못된 Origin 형식'
      );
    }

    return next();
  }

  /*
  Origin이 없다면 Referer를 확인합니다.
  */
  const referer = req.get('referer');

  if (referer) {
    try {
      const refererOrigin =
        new URL(referer).origin;

      if (refererOrigin !== allowedOrigin) {
        return rejectRequest(
          req,
          res,
          'Referer 불일치'
        );
      }
    } catch (error) {
      return rejectRequest(
        req,
        res,
        '잘못된 Referer 형식'
      );
    }
  }

  return next();
}

module.exports =
  requestOriginMiddleware;