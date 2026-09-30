'use strict';

// 사용: npm run ai:ask -- "질문 내용"
const { ask, checkAi } = require('../src/services/ai.service');

async function main() {
  const prompt = process.argv.slice(2).join(' ').trim();

  const health = await checkAi();
  console.log(`AI 제공자: ${health.provider} (${health.status})`);

  if (health.models.length > 0) {
    console.log(`모델 목록: ${health.models.join(', ')}`);
  }

  if (!prompt) {
    console.log('질문이 없어 연결 확인만 했습니다.');
    return;
  }

  console.log(`질문: ${prompt}`);

  const started = Date.now();
  const result = await ask(prompt, '한국어로 간결하게 답한다.');

  console.log(`\n[${result.model}] ${(Date.now() - started) / 1000}s`);
  console.log(result.answer);
}

main().catch((error) => {
  console.error('AI 테스트 실패:', error.message);
  process.exit(1);
});
