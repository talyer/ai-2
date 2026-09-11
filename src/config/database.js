'use strict'
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

  charset : 'utf8mb4',
  timezone : '+09:00'
});

async function checkDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');
    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  checkDatabase
};