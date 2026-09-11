'use strict'

require('dotenv').config(); // dotenv 안내용

const requiredVariables = [ // .env 내용 호출
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`필수 환경 변수가 없습니다: ${variable}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET은 32자 이상이어야 합니다.');
}

const env = {
  nodeEnv : process.env.NODE_ENV || 'development',
  port : Number(process.env.PORT || 3000),

  database : {
    host : process.env.DB_HOST,
    port : Number(process.env.DB_PORT || 3306),
    name : process.env.DB_NAME,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD
  },

  jwt : {
    secret : process.env.JWT_SECRET,
    expiresIn : process.env.JWT_EXPIRES_IN || '2h'
  },

  cookieSecure : process.env.COOKIE_SECURE == 'ture',

  ai : {
    provider : process.env.AI_PROVIDER || 'mock',
    apiUrl : process.env.CLOVA_STUDIO_API_URL || '',
    apiKey : process.env.CLOVA_STUTIO_API_KEY || '',
    model : process.env.CLOVA_STUDIO_MODEL || ''
  }

};

module.exports = { env };