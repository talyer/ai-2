'use strict';

function severityFromScore(score) {
  if (score >= 85) {
    return 'CRITICAL';
  }

  if (score >= 70) {
    return 'HIGH';
  }

  if (score >= 50) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function incidentTypeFromEvents(events) {
  const types = events.map((event) => event.event_type);

  if (
    types.includes('WEB_RATE_LIMIT') ||
    types.filter((type) => type === 'AUTH_LOGIN_FAILED').length >= 3
  ) {
    return 'BRUTE_FORCE';
  }

  if (types.some((type) => type.includes('INJECTION') || type.includes('XSS'))) {
    return 'WEB_ATTACK';
  }

  if (types.includes('AUTH_ADMIN_DENIED') || types.includes('WEB_SCAN')) {
    return 'PRIVILEGE_PROBE';
  }

  return 'SUSPICIOUS_ACTIVITY';
}

function titleFromType(incidentType, sourceIp) {
  const labels = {
    BRUTE_FORCE: '로그인 무차별 대입 의심',
    WEB_ATTACK: '웹 공격 패턴 탐지',
    PRIVILEGE_PROBE: '권한 우회 및 스캔 의심',
    SUSPICIOUS_ACTIVITY: '의심 트래픽 집계'
  };

  return `${labels[incidentType] || '보안 사건'} (${sourceIp})`;
}

function combinedRisk(events) {
  if (events.length === 0) {
    return 0;
  }

  const maxScore = Math.max(
    ...events.map((event) => Number(event.risk_score) || 0)
  );
  const bonus = Math.min(25, (events.length - 1) * 8);

  return Math.min(100, maxScore + bonus);
}

module.exports = {
  severityFromScore,
  incidentTypeFromEvents,
  titleFromType,
  combinedRisk
};
