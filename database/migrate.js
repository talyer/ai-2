'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

const { env } = require('../src/config/env');

const sqlFiles = [
  'schema.sql',
  'soc-schema.sql'
];

function createMigrationOptions() {
  const options = {
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,

    charset: 'utf8mb4',
    timezone: '+09:00',
    connectTimeout: 15000,

    /*
    여러 CREATE TABLE 문을 실행하기 위해
    마이그레이션에서만 true로 설정합니다.
    */
    multipleStatements: true
  };

  if (env.database.ssl) {
    options.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }

  return options;
}

async function readSqlFile(fileName) {
  const filePath = path.join(
    __dirname,
    fileName
  );

  const sql = await fs.readFile(
    filePath,
    'utf8'
  );

  const normalizedSql = sql
    .replace(/^\uFEFF/, '')
    .trim();

  if (!normalizedSql) {
    throw new Error(
      `${fileName} 파일이 비어 있습니다.`
    );
  }

  return normalizedSql;
}

async function migrate() {
  let connection;

  try {
    console.log('DB 마이그레이션을 시작합니다.');

    connection = await mysql.createConnection(
      createMigrationOptions()
    );

    console.log(
      `MySQL 연결 성공: ${env.database.host}:${env.database.port}/${env.database.name}`
    );

    for (const fileName of sqlFiles) {
      console.log(`${fileName} 실행 중...`);

      const sql = await readSqlFile(
        fileName
      );

      await connection.query(sql);

      console.log(`${fileName} 실행 완료`);
    }

    console.log('모든 마이그레이션이 완료되었습니다.');
  } catch (error) {
    console.error(
      '마이그레이션 실패:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();

      console.log(
        '마이그레이션 DB 연결을 종료했습니다.'
      );
    }
  }
}

migrate();