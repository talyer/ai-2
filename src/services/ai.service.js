'use strict';

const { env } = require('../config/env');

async function askOllama(prompt, system) {
  const { url, model, timeoutMs } = env.ai.ollama;

  const messages = [];

  if (system) {
    messages.push({ role : 'system', content : system });
  }

  messages.push({ role : 'user', content : prompt });

  const response = await fetch(`${url}/api/chat`, {
    method : 'POST',
    headers : { 'Content-Type' : 'application/json' },
    body : JSON.stringify({
      model,
      messages,
      stream : false
    }),
    signal : AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama 응답 오류 ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  return {
    provider : 'ollama',
    model,
    answer : (data.message?.content || '').trim(),
    durationMs : Math.round((data.total_duration || 0) / 1e6)
  };
}

function askMock(prompt) {
  return {
    provider : 'mock',
    model : 'mock',
    answer : `[MOCK] 질문 수신: ${prompt.slice(0, 100)}`,
    durationMs : 0
  };
}

// 질문 하나 보내고 답변 텍스트 받음
async function ask(prompt, system = null) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('질문이 비어 있습니다.');
  }

  if (!env.ai.enabled || env.ai.provider === 'mock') {
    return askMock(prompt);
  }

  if (env.ai.provider === 'ollama') {
    return askOllama(prompt, system);
  }

  throw new Error(`아직 연결되지 않은 AI_PROVIDER입니다: ${env.ai.provider}`);
}

// 서버 연결 확인용. 모델 목록 반환
async function checkAi() {
  if (env.ai.provider !== 'ollama') {
    return { provider : env.ai.provider, status : 'skipped', models : [] };
  }

  const { url, timeoutMs } = env.ai.ollama;

  const response = await fetch(`${url}/api/tags`, {
    signal : AbortSignal.timeout(Math.min(timeoutMs, 10000))
  });

  if (!response.ok) {
    throw new Error(`Ollama 연결 실패: HTTP ${response.status}`);
  }

  const data = await response.json();

  return {
    provider : 'ollama',
    status : 'connected',
    models : (data.models || []).map((item) => item.name)
  };
}

module.exports = {
  ask,
  checkAi
};
