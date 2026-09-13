'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const {
  env
} = require('./config/env');

const pageRoutes =
  require('./routes/page.routes');

const app = express();

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
*/
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

if (env.nodeEnv === 'development') {
  app.use(
    morgan('dev')
  );
}

app.use(
  express.json({
    limit: '20kb'
  })
);

app.use(
  express.urlencoded({
    extended: false,
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

app.use(
  '/',
  pageRoutes
);

/*
아직 연결하지 않습니다.

const authRoutes =
  require('./routes/auth.routes');

const reviewRoutes =
  require('./routes/review.routes');

app.use('/auth', authRoutes);
app.use('/reviews', reviewRoutes);
*/

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