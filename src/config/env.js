'use strict'

require('dotenv').config(); // dotenv 안내용

const requiredVariables = [ // .env 내용 호출
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'CSRF_SECRET',
  'APP_ORIGIN'
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`필수 환경 변수가 없습니다: ${variable}`
    );
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET은 32자 이상이어야 합니다.'
  );
}

if (process.env.CSRF_SECRET.length < 32) {
  throw new Error(
    'CSRF_SECRET은 32자 이상이어야 합니다.'
  );
}

const port = Number(
  process.env.PORT || 3000
);

const databasePort = Number(
  process.env.DB_PORT || 3306
)

if (!Number.isInteger(port)) {
  throw new Error(
    'PORT는 숫자로 작성해야 합니다.'
  );
}

if (!Number.isInteger(databasePort)) {
  throw new Error(
    'DB_PORT는 숫자로 작성해야 합니다.'
  )
}

// 나중에 ai 사용할 떄 mock 말고 다른걸로
const aiProvider = 
  process.env.AI_PROVIDER || 'mock';

const allowedAiProviders = [
  'mock',
  'clova',
  'ollama'
];

if (!allowedAiProviders.includes(aiProvider)) {
  throw new Error(
    `지원하지 않는 AI_PROVIDER입니다: ${aiProvider}`
  );
}

if (aiProvider == 'clova') {
  const requiredClovaVariables = [
    'CLOVA_STUDIO_API_URL',
    'CLOVA_STUDIO_API_KEY',
    'CLOVA_STUDIO_MODEL'
  ];

  for (const variable of requiredClovaVariables) {
    if (!process.env[variable]) {
      throw new Error(
        `AI_PROVIDER=clova에 필요한 환경 변수가 없습니다: ${variable}`
      );
    }
  }
}

if (
  process.env.BOT_PROTECTION_ENABLED === 'true' && !process.env.ALTCHA_HMAC_SECRET
) {
  throw new Error(
    'ALTCHA_HMAC_SECRET 환경변수가 필요합니다.'
  );
}



const env = Object.freeze ({
  nodeEnv : process.env.NODE_ENV || 'development',
  port,

  appOrigin: process.env.APP_ORIGIN,

  database : {
    host : process.env.DB_HOST,
    port : databasePort,
    name : process.env.DB_NAME,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    ssl : process.env.DB_SSL === 'true'
  },

  jwt : {
    secret : process.env.JWT_SECRET,
    expiresIn : process.env.JWT_EXPIRES_IN || '2h'
  },

  csrf: {
    secret: process.env.CSRF_SECRET
  },

  cookieSecure : process.env.COOKIE_SECURE == 'true',

  trustProxy: process.env.TRUST_PROXY === 'true',

  ai : {
    enabled : process.env.AI_ENABLED !== 'false',

    provider : aiProvider,

    apiUrl : process.env.CLOVA_STUDIO_API_URL || '',

    apiKey : process.env.CLOVA_STUDIO_API_KEY,

    model : process.env.CLOVA_STUDIO_MODEL || '',

    timeoutMs : Number(process.env.CLOVA_TIMEOUT_MS || 15000),

    ollama : {
      url : (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
      model : process.env.OLLAMA_MODEL || 'gpt-oss:20b',
      timeoutMs : Number(process.env.OLLAMA_TIMEOUT_MS || 120000)
    }
  },

  soc: {
    enabled: process.env.SOC_ENABLED === 'true',

    aiEnabled: process.env.SOC_AI_ENABLED === 'true',

    demoMode: process.env.SOC_DEMO_MODE === 'true',

    incidentThreshold: Number(process.env.SOC_INCIDENT_THRESHOLD || 60),

    failedLoginLimit: Number(process.env.SOC_FAILED_LOGIN_LIMIT || 5),

    correlationMinutes: Number(process.env.SOC_CORRELATION_MINUTES || 5),

    ipBlockMinutes: Number(process.env.SOC_IP_BLOCK_MINUTES || 10),

    logRetentionDays: Number(process.env.SOC_LOG_RETENTION_DAYS || 30
    )
  },

  botProtection: {
    enabled: 
      process.env.BOT_PROTECTION_ENABLED === 'true',

    hmacSecret: 
      process.env.ALTCHA_HMAC_SECRET || '',

    expiresSeconds:
      Number(process.env.ALTCHA_EXPIRES_SECONDS || 120)
  }
});

module.exports = { env };