'use strict';

const { env } = require('../../config/env');
const { ask } = require('../ai.service');
const socRepository = require('../../repositories/soc.repository');

function mockAnalysis(incident, events) {
  return {
    incident_type: incident.incident_type,
    summary:
      `${incident.source_ip}에서 ${events.length}건의 이벤트가 짧은 시간에 발생했습니다. ` +
      `위험도 ${incident.risk_score}로 ${incident.severity} 등급입니다.`,
    recommended_actions: [
      '임시 IP 차단 유지',
      '동일 계정 로그인 실패 이력 확인',
      '차단 해제 전 관리자 승인'
    ],
    confidence: 0.8
  };
}

function parseModelAnswer(answer) {
  const match = answer.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

async function analyzeIncident(incidentId) {
  const incident = await socRepository.findIncidentById(incidentId);

  if (!incident) {
    throw new Error('사건을 찾을 수 없습니다.');
  }

  const events = await socRepository.listIncidentEvents(incidentId);
  const provider = env.soc.aiEnabled ? env.ai.socProvider : 'mock';
  const modelName = env.ai.ollama.model;

  const pendingId = await socRepository.createAiAnalysis({
    incidentId,
    provider,
    modelName,
    analysisStatus: 'PROCESSING',
    incidentType: incident.incident_type,
    summary: null,
    evidenceJson: null,
    recommendedActionsJson: null,
    confidence: null,
    errorMessage: null,
    analyzedAt: null
  });

  try {
    let result;

    if (!env.soc.aiEnabled || env.ai.socProvider === 'mock') {
      result = mockAnalysis(incident, events);
    } else {
      const eventLines = events.map((event) =>
        `- ${event.event_type} score=${event.risk_score} path=${event.request_path || '-'} ${event.summary}`
      ).join('\n');

      const answer = await ask(
        [
          `사건유형: ${incident.incident_type}`,
          `출발지IP: ${incident.source_ip}`,
          `위험도: ${incident.risk_score}`,
          `이벤트:`,
          eventLines,
          'JSON만 출력: {"incident_type":"","summary":"","recommended_actions":[""],"confidence":0.0}'
        ].join('\n'),
        '한국어 SOC 분석가다. JSON만 짧게 답한다. 생각 과정은 쓰지 않는다.'
      );

      result = parseModelAnswer(answer.answer) || {
        incident_type: incident.incident_type,
        summary: answer.answer.slice(0, 800),
        recommended_actions: ['관리자 확인'],
        confidence: 0.5
      };
    }

    const actions = Array.isArray(result.recommended_actions)
      ? result.recommended_actions
      : ['관리자 확인'];

    await socRepository.updateAiAnalysis(pendingId, {
      analysisStatus: 'COMPLETED',
      incidentType: result.incident_type || incident.incident_type,
      summary: result.summary || '',
      evidenceJson: JSON.stringify({ eventCount: events.length }),
      recommendedActionsJson: JSON.stringify(actions),
      confidence: Number(result.confidence) || 0.5,
      errorMessage: null,
      analyzedAt: new Date()
    });
  } catch (error) {
    await socRepository.updateAiAnalysis(pendingId, {
      analysisStatus: 'FAILED',
      incidentType: incident.incident_type,
      summary: null,
      evidenceJson: null,
      recommendedActionsJson: null,
      confidence: null,
      errorMessage: error.message.slice(0, 1000),
      analyzedAt: new Date()
    });
  }

  return socRepository.findLatestAiAnalysis(incidentId);
}

module.exports = {
  analyzeIncident,
  mockAnalysis
};
