'use strict';

const { env } = require('../../config/env');
const socRepository = require('../../repositories/soc.repository');

async function isBlocked(ipAddress) {
  if (!ipAddress) {
    return false;
  }

  const block = await socRepository.findActiveBlock(ipAddress);

  return Boolean(block);
}

async function containIncident(incident) {
  if (!incident || !incident.source_ip) {
    return null;
  }

  if (Number(incident.risk_score) < env.soc.incidentThreshold) {
    return null;
  }

  const existing = await socRepository.findActiveBlock(incident.source_ip);

  if (existing) {
    return existing;
  }

  const expiresAt = new Date(
    Date.now() + env.soc.ipBlockMinutes * 60 * 1000
  );

  const blockId = await socRepository.createBlockedIp({
    ipAddress: incident.source_ip,
    reason: `사건 #${incident.id} 위험도 ${incident.risk_score}로 임시 차단`,
    incidentId: incident.id,
    expiresAt
  });

  await socRepository.createResponseAction({
    incidentId: incident.id,
    actionType: 'TEMPORARY_IP_BLOCK',
    targetType: 'IP',
    targetValue: incident.source_ip,
    decisionSource: 'RULE',
    actionStatus: 'EXECUTED',
    reason: `위험도 ${incident.risk_score}가 임계치 ${env.soc.incidentThreshold} 이상`,
    executedAt: new Date()
  });

  return socRepository.findActiveBlock(incident.source_ip) || { id: blockId };
}

module.exports = {
  isBlocked,
  containIncident
};
