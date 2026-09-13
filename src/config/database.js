'use strict';
const mysql = require('mysql2/promise');
const { env } = require('./env');

const pool = mysql.createPool({
  host : env.database.host,
  port : env.database.port,
  user : env.database.user,
  password : env.database.password,
  database : env.database.name,

  waitForConnections : true,
  connectionLimit : 10,
  queueLimit : 0,

  enableKeepAlive : true,
  keepAliveInitialDelay : 0,

  charset : 'utf8mb4',
  timezone : '+09:00'
});

async function checkDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');

    console.log(
      `MySQL 연결 성공: ${ env.database.host }:${ env.database.port }/${ env.database.name }`
    );
    
  } catch (error) {
    console.error(
      'MySQL 연결 실패:',
      error.message
    );
    throw error;
  } finally {
    connection.release();
  }
}

async function closeDatabasePool() {
  await pool.end();
  console.log('MySQL 연결 풀이 종료되었습니다.');
}

module.exports = {
  pool,
  checkDatabase,
  closeDatabasePool
};