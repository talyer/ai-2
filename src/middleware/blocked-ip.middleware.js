'use strict';

const { env } = require('../config/env');
const { isBlocked } = require('../services/soc/response.service');
const { normalizeIp } = require('../services/soc/pipeline');

async function blockedIpMiddleware(req, res, next) {
  if (!env.soc.enabled) {
    return next();
  }

  const path = req.path || '';

  if (path.startsWith('/soc') || path.startsWith('/css') || path.startsWith('/js')) {
    return next();
  }

  try {
    const blocked = await isBlocked(normalizeIp(req.ip));

    if (blocked) {
      return res.status(403).render('errors/error', {
        title: '접근 차단',
        message: '보안 정책에 따라 이 주소의 접근이 일시적으로 차단되었습니다.'
      });
    }
  } catch (error) {
    console.error('차단 IP 확인 실패:', error.message);
  }

  return next();
}

module.exports = blockedIpMiddleware;
