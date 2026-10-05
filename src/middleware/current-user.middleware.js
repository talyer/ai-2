<<<<<<< HEAD
'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userRepository = require('../repositories/user.repository');

async function currentUserMiddleware(req, res, next) {
  res.locals.currentUser = null;

  const token = req.cookies?.access_token;
=======
'use strict'

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function currentUserMiddleware(req, res, next) {
  res.locals.currentUser = null;

  const token = req.cookies.access_token;
>>>>>>> 5fc38b26d8b0bc7c876649e1a746703353dfd87b

  if (!token) {
    return next();
  }

  try {
<<<<<<< HEAD
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
=======
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
>>>>>>> 5fc38b26d8b0bc7c876649e1a746703353dfd87b
  }

  return next();
}

module.exports = currentUserMiddleware;