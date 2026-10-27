'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

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

const reviewRoutes = require('./routes/review.routes');

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
CSP만 임시로 비활성화합니다. (적용시키고 style와 script 수정할 예정)
그 외 Helmet 보안 헤더는 적용됩니다.
CSRF 적용으로 인해 Helmet 적용시킴
*/
const httpsEnabled = env.cookieSecure === true;

app.use(
  helmet({
    constSecurityPolicy: false,

    strictTransportSecurity:
      httpsEnabled
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false
        }
        : false,

      crossOriginOpenerPolicy: {
        policy: "same-origin"
      },
      
      crossOriginResourcePolicy: {
        policy: "same-site"
      },

      referrerPolicy: {
        policy: "no-referrer"
      }
  })
);

// helmet 전 버전
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         /*
//         ALTCHA 기본 번들 내부 스타일 때문에
//         현재 단계에서는 스타일만 예외 처리합니다.
//         */
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         /*
//         ALTCHA 계산용 Web Worker를 허용합니다.
//         */
//         workerSrc: ["'self'", 'blob:'],
//         childSrc: ["'self'", 'blob:'],
//         imgSrc: ["'self'", 'data:'],
//         connectSrc: ["'self'"],
//         fontSrc: ["'self'"],
//         objectSrc: ["'none'"],
//         baseUri: ["'self'"],
//         formAction: ["'self'"],
//         frameAncestors: ["'none'"]
//       }
//     }
//   })
// );

const csp = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  scriptSrc: ["'self'"],
  // onclick, onerror 같은 HTML 속성 안의 JavaScript 실행 차단
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'"],
  styleSrcElem: ["'self'"],
  // style="color: red" 와 같은 인라인 차단
  styleSrcAttr: ["'none'"],
  imgSrc: ["'self'", 'data:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: ["'self'"],
  mediaSrc: ["'self'"],
  manifestSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  childSrc: ["'self'", 'blob:'],
};




if (env.nodeEnv === 'development') {
  app.use(
    morgan('dev')
  );
}

if (httpsEnabled) {
  csp.upgradeInsecureRequests = [];
}


app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: csp
  })
);

// 요청 로그
app.use(morgan('dev'));


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


app.use('/', pageRoutes);

app.use('/auth', authRoutes);

app.use('/orders', orderRoutes);

app.use('/reviews', reviewRoutes);


// bot 라우터
app.use('/security/bot', botRoutes);


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