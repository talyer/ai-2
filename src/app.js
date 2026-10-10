'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
// 회원가입, 로그인 기능 Captcha 즉 봇 방지 시스템 추가 할 예정
// const Crypto = require('crypto');



const {
  env
} = require('./config/env');

const { attachCsrfToken, verifyCsrfToken } = require('./middleware/csrf.middleware');

const requestOriginMiddleware = require('./middleware/request-origin.middleware');


const pageRoutes =
  require('./routes/page.routes');

const authRoutes =
  require('./routes/auth.routes');

const orderRoutes = require('./routes/order.routes');

const currentUserMiddleware =
  require('./middleware/current-user.middleware');

const botRoutes = require('./routes/bot.routes');

const app = express();

app.locals.botProtectionEnabled = env.botProtection.enabled;

app.disable('x-powered-by');

app.set(
  'view engine',
  'ejs'
);

app.set(
  'views',
  path.join(__dirname, 'views')
);

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

/*
현재 index.ejs에 인라인 style과 script가 있으므로
CSP만 임시로 비활성화합니다.
그 외 Helmet 보안 헤더는 적용됩니다.
CSRF 적용으로 인해 Helmet 적용시킴
*/
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);

if (env.nodeEnv === 'development') {
  app.use(
    morgan('dev')
  );
}


app.use(
  express.urlencoded({
    extended: false,
    limit: '20kb'
  })
);

app.use(
  express.json({
    limit: '20kb'
  })
);


app.use(
  cookieParser()
);

app.use(
  express.static(
    path.join(
      __dirname,
      '..',
      'public'
    ),
    {
      index: false
    }
  )
);

// app.get(
//   '/health',
//   (req, res) => {
//     return res.status(200).json({
//       status: 'ok',
//       environment: env.nodeEnv,
//       aiProvider: env.ai.provider,
//       socEnabled: env.soc.enabled
//     });
//   }
// );

app.use('/security/bot', botRoutes);

app.use(currentUserMiddleware);

app.use(attachCsrfToken);

app.use(requestOriginMiddleware);
app.use(verifyCsrfToken);




app.use('/auth', authRoutes);

app.use('/orders', orderRoutes);

app.use('/', pageRoutes);


app.use(
  (req, res) => {
    return res.status(404).render(
      'errors/error',
      {
        title: '페이지 없음',
        message:
          '요청한 페이지를 찾을 수 없습니다.'
      }
    );
  }
);

app.use(
  (error, req, res, next) => {
    console.error(error);

    return res.status(
      error.status || 500
    ).render(
      'errors/error',
      {
        title: '서버 오류',

        message:
          env.nodeEnv === 'production'
            ? '요청 처리 중 문제가 발생했습니다.'
            : error.message
      }
    );
  }
);

module.exports = app;