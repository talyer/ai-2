'use strict'

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function currentUserMiddleware(req, res, next) {
  res.locals.currentUser = null;

  const token = req.cookies.access_token;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(
      token,
      env.jwt.secret
    );

    res.locals.currentUser = {
      id: Number(payload.sub),
      loginId: payload.loginId,
      displayName: payload.displayName,
      role: payload.role
    };
  } catch (error) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      path: '/'
    });
  }

  return next();
}

module.exports = currentUserMiddleware;