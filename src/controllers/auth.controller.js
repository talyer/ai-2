'use strict';

// 서버가 라우터를 정상적으로 불러오는지만 확일할 임시 코드임 확인 후 삭제 할 예정

function showLogin(req, res) {
  return res.render('auth/login', {
    title : '로그인',
    errorMessage : null,
    formData: {
      loginId : ''
    },
    currentUser : res.locals.currentUser || null
  });
}

function showSignup(req, res) {
  return res.render('auth/signup', {
    title : '회원가입',
    errorMessage : null 
  });
}

function login(req, res) {
  return res.status(501).json({
    message : '로그인 DB 연동을 준비 중입니다.'
  });
}

function signup(req, res) {
  return res.status(501).json({
    message : '회원가입 DB 연동을 준비 중입니다.'
  });
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