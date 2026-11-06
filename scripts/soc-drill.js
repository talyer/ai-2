'use strict';

const scenario = process.argv[2] || 'brute_force';
const origin = process.env.APP_ORIGIN || 'http://localhost:3000';

async function main() {
  const pageResponse = await fetch(`${origin}/soc`);
  const html = await pageResponse.text();
  const tokenMatch = html.match(/csrf-token" content="([^"]+)"/);
  const token = tokenMatch ? tokenMatch[1] : '';
  const cookie = (pageResponse.headers.getSetCookie?.() || [])
    .map((value) => value.split(';')[0])
    .join('; ');

  const response = await fetch(`${origin}/soc/lab/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
      Origin: origin,
      Referer: `${origin}/soc`,
      Cookie: cookie
    },
    body: JSON.stringify({ scenario })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('시뮬레이터 실패:', error.message);
  console.error('먼저 npm run dev 로 서버를 켜세요.');
  process.exit(1);
});
