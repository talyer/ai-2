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
    });
  } catch (error) {
    console.error('서버 시작 실패:', error.message);
    process.exit(1);
  }
}

startServer();