'use strict';
const express = require('express');

const authController = require('../controllers/auth.controller');

const loginRateLimit = require('../middleware/login-rate-limit.middleware');

const router = express.Router();


router.get(
  '/login',
  authController.showLogin
);

router.post(
  '/login',
  loginRateLimit,
  authController.login
);

router.get(
  '/signup',
  authController.showSignup
);

router.post(
  '/signup',
  authController.signup
);

router.post(
  '/logout',
  authController.logout
);

module.exports = router;
