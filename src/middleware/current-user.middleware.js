'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userRepository = require('../repositories/user.repository');

async function currentUserMiddleware(req, res, next) {
  res.locals.currentUser = null;

  const token = req.cookies?.access_token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await userRepository.findById(decoded.id);

    if (user && user.status === 'ACTIVE') {
      res.locals.currentUser = {
        id: user.id,
        loginId: user.loginId,
        displayName: user.displayName,
        role: user.role
      };
    }
  } catch (error) {
    res.locals.currentUser = null;
  }

  return next();
}

module.exports = currentUserMiddleware;