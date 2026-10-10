'use strict';

const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

const { env } = require('../config/env');

const CSRF_COOKIE_NAME = 'csrf_session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const SESSION_PATTERN = /^[a-f0-9]{64}$/;

const TOKEN_PATTERN = /^[a-f0-9]{64}\.[a-f0-9]{64}$/;

function createCsrfSession() {
  return randomBytes(32).toString('hex');
}

function getOrCreateCsrfSession(req, res) {
  let csrfSession = String(
    req.cookies?.[CSRF_COOKIE_NAME] || ''
  );

  if (!SESSION_PATTERN.test(csrfSession)) {
    csrfSession = createCsrfSession();

    res.cookie(CSRF_COOKIE_NAME, csrfSession, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 60 * 60 * 1000
    });
  }

  return csrfSession;
}

// 로그인 전에 anonymous로, 후에는 access_token으로 묶음

function createSessionBinding(req, csrfSession) {
  const accessToken = String(
    req.cookies?.access_token || 'anonymous'
  );

  return (
    `${csrfSession.length}!` + `${csrfSession}!` + `${accessToken.length}!` + accessToken
  );
}

function createSignature(sessionBinding, randomValue) {
  const message = `${sessionBinding.length}!` + `${sessionBinding}!` + `${randomValue.length}!` + randomValue;

  return createHmac('sha256', env.csrf.secret)
    .update(message)
    .digest('hex');
}

function createCsrfToken(sessionBinding) {
  const randomValue = randomBytes(32).toString('hex');

  const signature = createSignature(sessionBinding, randomValue);

  return `${signature}.${randomValue}`;
}

function attachCsrfToken(req, res, next) {
  const csrfSession = getOrCreateCsrfSession(req, res);

  const sessionBinding = createSessionBinding(req, csrfSession);

  req.csrfSessionBinding = sessionBinding;

  res.locals.csrfToken = createCsrfToken(sessionBinding);

  return next();
}

function rejectCsrfRequest(req, res) {
  console.warn('[CSRF 차단]',
    req.method,
    req.originalUrl,
    req.ip
  );

  return res.status(403).render('errors/error', {
    title: '요청 거부',
    message: '보안 토큰이 없거나 올바르지 않습니다.'
  });
}

function verifyCsrfToken(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const token = String(
    req.body?._csrf || req.get('x-csrf-token') || ''
  ).trim();

  if (!TOKEN_PATTERN.test(token)) {
    return rejectCsrfRequest(req, res);
  }

  const [providedSignature, randomValue ] =  token.split('.');

  const expectedSignature = createSignature(
    req.csrfSessionBinding, randomValue
  );
  
  const providedBuffer = Buffer.from(providedSignature, 'hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return rejectCsrfRequest(req, res);
  }

  return next();
}

module.exports = {
  attachCsrfToken,
  verifyCsrfToken
}