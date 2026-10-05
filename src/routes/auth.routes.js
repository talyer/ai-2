'use strict';
const express = require('express');

const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');

const loginRateLimit = require('../middleware/login-rate-limit.middleware');

const router = express.Router();

// 로그인 입력값 검증
const loginValidation = [
  body('loginId')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해 주세요.'),

  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해 주세요.')
];

// 회원가입 입력값 검증
const signupValidation = [
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('이름을 입력해 주세요.'),

  body('loginId')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해 주세요.'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('올바른 이메일을 입력해 주세요.'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 8자 이상 입력해 주세요.')
];


router.get(
  '/login',
  authController.showLogin
);

router.post(
  '/login',
  loginRateLimit,
  loginValidation,
  authController.login
);

router.get(
  '/signup',
  authController.showSignup
);

router.post(
  '/signup',
  signupValidation,
  authController.signup
);

router.post(
  '/logout',
  authController.logout
);

module.exports = router;
