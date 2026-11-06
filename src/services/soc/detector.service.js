'use strict';

const { env } = require('../../config/env');
const { recordSocEvent, normalizeIp } = require('./pipeline');

const skipPrefixes = [
  '/css',
  '/js',
  '/images',
  '/health',
  '/soc'
];

const rules = [
  {
    type: 'WEB_INJECTION_ATTEMPT',
    category: 'WEB_ATTACK',
    score: 78,
    summary: '입력값에서 SQL 인젝션 패턴이 탐지되었습니다.',
    test: (text) => /(\bunion\b.+\bselect\b)|(\bor\b\s+\d+\s*=\s*\d+)/i.test(text)
  },
  {
    type: 'WEB_XSS_ATTEMPT',
    category: 'WEB_ATTACK',
    score: 72,
    summary: '입력값에서 스크립트 삽입 패턴이 탐지되었습니다.',
    test: (text) => /<\s*script\b|javascript:/i.test(text)
  },
  {
    type: 'WEB_PATH_PROBE',
    category: 'WEB_ATTACK',
    score: 58,
    summary: '경로 탈출 패턴이 탐지되었습니다.',
    test: (text) => /\.\.\//.test(text)
  },
  {
    type: 'WEB_SCAN',
    category: 'RECON',
    score: 52,
    summary: '관리자 경로 또는 알려진 스캔 경로에 접근했습니다.',
    test: (text) => /\/(wp-admin|wp-login|phpmyadmin|\.env|adminer)/i.test(text)
  }
];

function inspectText(req) {
  const body = { ...(req.body || {}) };
  delete body.password;
  delete body.passwordConfirm;

  return [
    req.originalUrl || '',
    JSON.stringify(req.query || {}),
    JSON.stringify(body)
  ].join(' ');
}

function shouldSkip(req) {
  const path = req.path || '';

  return skipPrefixes.some((prefix) => path.startsWith(prefix));
}

async function inspectRequest(req) {
  if (!env.soc.enabled || shouldSkip(req)) {
    return null;
  }

  const text = inspectText(req);
  const matched = rules.find((rule) => rule.test(text));

  if (!matched) {
    return null;
  }

  return recordSocEvent({
    requestId: req.requestId,
    eventType: matched.type,
    category: matched.category,
    sourceIp: normalizeIp(req.ip),
    userId: req.user?.id || null,
    username: req.user?.loginId || req.body?.loginId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode: matched.score >= 70 ? 403 : 200,
    riskScore: matched.score,
    detector: 'RULE',
    summary: matched.summary,
    evidence: text.slice(0, 300)
  });
}

module.exports = {
  inspectRequest,
  inspectText
};
