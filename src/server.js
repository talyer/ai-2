'use strict';

const app = require('./app');
const { env } = require('./config/env');

const {
  checkDatabase,
  closeDatabasePool
} = require('./config/database');

let server;

async function startServer() {
  try {
    await checkDatabase();

    server = app.listen(
      env.port,
      '0.0.0.0',
      () => {
        console.log(
          `서버 실행: http://localhost:${env.port}`
        );

        console.log(`환경: ${env.nodeEnv}`);
        console.log(`AI 제공자: ${env.ai.provider}`);

        console.log(
          `CommerceSOC: ${
            env.soc.enabled
              ? '활성화'
              : '비활성화'
          }`
        );
      }
    );
  } catch (error) {
    console.error(
      '서버 시작 실패:',
      error.message
    );

    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(
    `${signal} 신호를 받아 서버를 종료합니다.`
  );

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await closeDatabasePool();
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('종료 오류:', error.message);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('종료 오류:', error.message);
    process.exit(1);
  });
});

startServer();