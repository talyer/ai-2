'use strict';
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function authMiddleware(req, res, next) {
  const cookieToken = req.cookies?.access_token;

  const authorization = req.get('authorization');

  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      message: '로그인이 필요합니다.'
    });
  }

  try {
    req.user = jwt.verify(
      token,
      env.jwt.secret
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: '로그인 정보가 유호하지 않습니다.'
    });
  }
}

module.exports = authMiddleware;