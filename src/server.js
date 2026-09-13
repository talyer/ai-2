'use strict';
const app = require('./app');
const { env } = require('./config/env');
const { checkDatabase } = require('./config/database');

async function startServer() {
  try {
    await checkDatabase();
    console.log("MySQL 연결 성공");

    app.listen(env.port, '0.0.0.0' , () => {
      console.log(`서버 실행: http://localhost:${env.port}`);
      console.log(`환경: ${env.nodeEnv}`);
      console.log(`AI 제공자 : ${env.ai.provider}`);
      console.log(`CommerceSOC: ${env.soc.enabled
        ? '활성화'
        : '비활성화'
      }`);
    });
    async function shutdown(signal) {
      console.log(
        `${signal} 신호를 받아 서버를 종료합니다.`
      );

      server.close(async () => {
        try {
          await closeDatabase();

          console.log(
            'MySQL 연결 종료 완료'
          );

          prcoess.exit(0);
        } catch (error) {
          console.error(
            '종료 중 오류:',
            error.message
          );

          process.exit(1);
        }
      });
    }

    process.on('SIGINT', () => {
      shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
      shutdown('SIGTERM');
    });
  } catch (error) {
    console.error('서버 시작 실패:', error.message);
    process.exit(1);
  }
}

startServer();