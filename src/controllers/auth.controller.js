'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { validationResult } = require('express-validator');
const userRepository = require('../repositories/user.repository');

// 서버가 라우터를 정상적으로 불러오는지만 확일할 임시 코드임 확인 후 삭제 할 예정

function showLogin(req, res) {
  const botCheckFailed = req.query.botCheck === 'failed';

  return res.render('auth/login', {
    title : '로그인',
    errorMessage : 
      botCheckFailed
        ? '봇 방지 검증에 실패했습니다.'
        : null,
    formData: {
      loginId : ''
    },
    currentUser : res.locals.currentUser || null
  });
}

function showSignup(req, res) {
  const botCheckFailed = req.query.botCheck === 'failed';

  return res.render('auth/signup', {
    title : '회원가입',
    errorMessage : 
      botCheckFailed
        ? '봇 방지 검증에 실패했습니다.'
        : null,
    currentUser: res.locals.currentUser || null
  });
}

async function login(req, res) {
  const errors = validationResult(req);

if (!errors.isEmpty()) {
  return res.status(400).render('auth/login', {
    title: '로그인',
    errorMessage: errors.array()[0].msg,
    formData: {
      loginId: req.body.loginId || ''
    },
    currentUser: res.locals.currentUser || null
  });
}

const { loginId, password } = req.body;

const user = await userRepository.findByLoginId(loginId?.trim());

if (!user) {
    return res.status(401).render('auth/login', {
      title: '로그인',
      errorMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
      formData: { loginId: loginId || '' }
    });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).render('auth/login', {
      title: '로그인',
      errorMessage: '로그인할 수 없는 계정입니다.',
      formData: { loginId: loginId || '' }
    });
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return res.status(423).render('auth/login', {
      title: '로그인',
      errorMessage: '계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해 주세요.',
      formData: { loginId: loginId || '' }
    });
  }

  if (user.lockedUntil) {
    await userRepository.resetLoginFailures(user.id);
  }

  const isPasswordValid = await bcrypt.compare(
    password || '',
    user.passwordHash
  );

  if (!isPasswordValid) {
    const updatedUser =
      await userRepository.incrementFailedLoginCount(user.id);

    if (updatedUser.failedLoginCount >= 5) {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      await userRepository.lockUserUntil(user.id, lockedUntil);

      return res.status(423).render('auth/login', {
        title: '로그인',
        errorMessage: '로그인 시도가 5회 실패하여 계정이 10분간 잠겼습니다.',
        formData: { loginId: loginId || '' }
      });
    }

    return res.status(401).render('auth/login', {
      title: '로그인',
      errorMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
      formData: { loginId: loginId || '' }
    });
  }

  await userRepository.resetLoginFailures(user.id);

  const token = jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      displayName: user.displayName,
      role: user.role
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    // 추가
    path: '/',
    maxAge: 2 * 60 * 60 * 1000
  });

  return res.redirect('/');
}

async function signup(req, res) {
  const { displayName, loginId, email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).render('auth/signup', {
      title: '회원가입',
      errorMessage: errors.array()[0].msg
    });
  }

  // 입력값 확인
  if (!displayName?.trim() || !loginId?.trim() ||
      !email?.trim() || !password) {
    return res.status(400).render('auth/signup', {
      title: '회원가입',
      errorMessage: '모든 항목을 입력해 주세요.'
    });
  }

  const trimmedLoginId = loginId.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedDisplayName = displayName.trim();

  // 아이디 중복 확인
  const existingUser =
    await userRepository.findByLoginId(trimmedLoginId);

  if (existingUser) {
    return res.status(409).render('auth/signup', {
      title: '회원가입',
      errorMessage: '이미 사용 중인 아이디입니다.'
    });
  }

  // 이메일 중복 확인
  const existingEmail =
    await userRepository.findByEmail(trimmedEmail);

  if (existingEmail) {
    return res.status(409).render('auth/signup', {
      title: '회원가입',
      errorMessage: '이미 등록된 이메일입니다.'
    });
  }

  // 비밀번호 암호화
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // 데이터베이스에 회원 정보 저장
    await userRepository.createUser({
      displayName: trimmedDisplayName,
      loginId: trimmedLoginId,
      email: trimmedEmail,
      passwordHash
    });

    // 회원가입 완료 후 로그인 화면으로 이동
    return res.redirect('/auth/login');

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('auth/signup', {
        title: '회원가입',
        errorMessage: '이미 사용 중인 아이디 또는 이메일입니다.'
      });
    }

    console.error('회원가입 오류:', error);

    return res.status(500).render('auth/signup', {
      title: '회원가입',
      errorMessage: '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.'
    });
  }
}

function logout(req, res) {
  res.clearCookie('access_token');

  return res.redirect('/');
}

module.exports = {
  showLogin,
  showSignup,
  login,
  signup,
  logout
};
