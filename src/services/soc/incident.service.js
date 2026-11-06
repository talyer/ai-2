'use strict';

const { env } = require('../../config/env');
const socRepository = require('../../repositories/soc.repository');
const {
  severityFromScore,
  incidentTypeFromEvents,
  titleFromType,
  combinedRisk
} = require('./risk.service');

function incidentKeyFor(sourceIp) {
  const windowMs = env.soc.correlationMinutes * 60 * 1000;
  const bucket = Math.floor(Date.now() / windowMs);

  return `${sourceIp}:${bucket}`;
}

async function correlate(eventId) {
  const event = await socRepository.findEventById(eventId);

  if (!event) {
    return null;
  }

  const related = await socRepository.findRecentEventsByIp(
    event.source_ip,
    env.soc.correlationMinutes
  );

  const incidentType = incidentTypeFromEvents(related);
  const riskScore = combinedRisk(related);
  const severity = severityFromScore(riskScore);
  const title = titleFromType(incidentType, event.source_ip);
  const firstSeenAt = related[0].occurred_at;
  const lastSeenAt = related[related.length - 1].occurred_at;
  const incidentKey = incidentKeyFor(event.source_ip);

  let incident = await socRepository.findOpenIncidentByKey(incidentKey);

  const payload = {
    incidentKey,
    incidentType,
    title,
    description: `${related.length}건의 보안 이벤트가 ${env.soc.correlationMinutes}분 창에서 묶였습니다.`,
    sourceIp: event.source_ip,
    userId: event.user_id,
    severity,
    riskScore,
    eventCount: related.length,
    firstSeenAt,
    lastSeenAt
  };

  if (incident) {
    await socRepository.updateIncident(incident.id, payload);
  } else {
    const createdId = await socRepository.createIncident(payload);
    incident = await socRepository.findIncidentById(createdId);
  }

  for (const relatedEvent of related) {
    await socRepository.linkIncidentEvent(incident.id, relatedEvent.id);
  }

  return socRepository.findIncidentById(incident.id);
}

module.exports = {
  correlate,
  incidentKeyFor
};
