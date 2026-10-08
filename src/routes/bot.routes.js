'use strict';

const express = require('express');

const { rateLimit } = require('express-rate-limit');

const { challengeHandler } = require('../services/security/altcha.service');

const router = express.Router();

const challengeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,

  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    message: '보안 확인 요청이 너무 많습니다.'
  }
});

router.get('/challenge', challengeRateLimit, challengeHandler);

module.exports = router;

