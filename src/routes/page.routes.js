const express = require('express');
const { checkDatabase } = require('../config/database');

const router = express.Router();

// 메인 쇼핑물 화면 GET /
router.get('/', (req, res) => {
  res.render('home/index', {
    title: 'HANSEI AI 쇼핑물',
    currentUser: res.locals.currentUser || null
  });
});


// 서버와 Mysql 연결 확인 GET /health
router.get('/health', async (req, res) => {
  try {
    await checkDatabase();

    res.status(200).json({
      status : 'ok',
      server : 'connected',
      database : 'connected',
      aiProvider : process.env.AI_PROVIDER || 'mock'
    });
  } catch (error) {
    res.status(503).json({
      status : 'error',
      server : 'connected',
      database : 'disconnected'
    });
  }
});

module.exports = router;