'use strict';

const { env } = require('../../config/env');
const socRepository = require('../../repositories/soc.repository');
const { createSecurityEvent } = require('./event.service');
const { correlate } = require('./incident.service');
const { containIncident } = require('./response.service');
const { analyzeIncident } = require('./ai-analyst.service');

function normalizeIp(value) {
  if (!value) {
    return '0.0.0.0';
  }

  return String(value).replace(/^::ffff:/, '');
}

async function recordSocEvent(payload) {
  if (!env.soc.enabled) {
    return null;
  }

  const eventId = await createSecurityEvent({
    ...payload,
    sourceIp: normalizeIp(payload.sourceIp),
    requestId: payload.requestId || `soc-${Date.now()}`
  });

  const incident = await correlate(eventId);

  if (!incident) {
    return { eventId, incident: null, blocked: false };
  }

  const blocked = await containIncident(incident);

  if (Number(incident.risk_score) >= env.soc.incidentThreshold) {
    const existingAi = await socRepository.findLatestAiAnalysis(incident.id);
    const analyzing =
      existingAi &&
      ['PENDING', 'PROCESSING', 'COMPLETED'].includes(
        existingAi.analysis_status
      );

    if (!analyzing) {
      analyzeIncident(incident.id).catch((error) => {
        console.error('SOC AI 분석 실패:', error.message);
      });
    }
  }

  return {
    eventId,
    incident,
    blocked: Boolean(blocked)
  };
}

module.exports = {
  recordSocEvent,
  normalizeIp
};
