'use strict';

const { pool, closeDatabasePool } = require('../src/config/database');
const { env } = require('../src/config/env');

const expectedTables = [
  'users',
  'categories',
  'products',
  'orders',
  'order_items',
  'reviews',
  'review_analysis',
  'security_events',
  'security_incidents',
  'incident_events',
  'incident_ai_analyses',
  'blocked_ips',
  'response_actions'
];

async function main() {
  const showColumns = process.argv.includes('--columns');

  console.log(
    `DB ${env.database.host}:${env.database.port}/${env.database.name}`
  );

  const [rows] = await pool.query('SHOW TABLES');
  const existing = rows.map((row) => Object.values(row)[0]);

  const missing = expectedTables.filter(
    (name) => !existing.includes(name)
  );
  const extra = existing.filter(
    (name) => !expectedTables.includes(name)
  );

  console.log(`테이블 ${existing.length}개 / 기대 ${expectedTables.length}개\n`);

  for (const name of expectedTables) {
    if (!existing.includes(name)) {
      console.log(`  [없음] ${name}`);
      continue;
    }

    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM \`${name}\``
    );

    console.log(`  [있음] ${name.padEnd(24)} ${count.cnt}행`);

    if (showColumns) {
      const [columns] = await pool.query(`SHOW COLUMNS FROM \`${name}\``);
      const names = columns.map((column) => column.Field).join(', ');
      console.log(`         ${names}`);
    }
  }

  if (extra.length > 0) {
    console.log(`\n스키마에 없는 테이블: ${extra.join(', ')}`);
  }

  if (missing.length > 0) {
    console.log(`\n누락된 테이블: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('\n테이블 생성 확인 완료');
}

main()
  .catch((error) => {
    console.error('테이블 확인 실패:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
