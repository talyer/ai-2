const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const pageRoutes = require('./routes/page.routes');

const app = express();

app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet({
    contentSecurityPolicy : {
      directives : {
        defaultSrc : ["'self'"],
        scriptSrc : ["'self'"],
        styleSrc :  ["'self'"],
        imgSrc : ["'self'", 'data:'],
        objectSrc : ["'none'"],
        frameAncestors : ["'none'"]
      }
    }
  })
);

app.use(morgan('dev'));

app.use(
  express.urlencoded({
    extended : false,
    limit : '20kb'
  })
);

app.use(cookieParser());

app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    index : false
  })
);

app.use(pageRoutes);

app.use((req, res) => {
  res.status(404).render('errors/error', {
    title: '페이지 없음',
    message: "요청한 페이지를 찾을 수 없습니다."
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).render('errors/error', {
    title : '서버 오류',
    message : '요청을 처리하는 중 문제가 발생했습니다.'
  });
});

module.exports = app;