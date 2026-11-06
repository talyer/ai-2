'use strict';

const { env } = require('../config/env');
const socRepository = require('../repositories/soc.repository');
const { recordSocEvent, normalizeIp } = require('../services/soc/pipeline');
const { analyzeIncident } = require('../services/soc/ai-analyst.service');

function canAccessSoc(res) {
  if (env.soc.demoMode) {
    return true;
  }

  const role = res.locals.currentUser?.role;

  return role === 'ADMIN' || role === 'SECURITY_ANALYST';
}

function deny(res) {
  return res.status(403).render('errors/error', {
    title: '접근 거부',
    message: '보안 관제 화면은 관리자 또는 분석가만 볼 수 있습니다.'
  });
}

async function showDashboard(req, res, next) {
  try {
    if (!canAccessSoc(res)) {
      return deny(res);
    }

    const [stats, incidents, events, blocks] = await Promise.all([
      Promise.all([
        socRepository.countEvents(),
        socRepository.countOpenIncidents(),
        socRepository.countActiveBlocks()
      ]),
      socRepository.listIncidents(20),
      socRepository.listRecentEvents(30),
      socRepository.listActiveBlocks(10)
    ]);

    return res.render('soc/dashboard', {
      title: 'GX CommerceSOC',
      currentUser: res.locals.currentUser,
      demoMode: env.soc.demoMode,
      stats: {
        events: stats[0],
        openIncidents: stats[1],
        blockedIps: stats[2],
        threshold: env.soc.incidentThreshold
      },
      incidents,
      events,
      blocks
    });
  } catch (error) {
    return next(error);
  }
}

async function showIncident(req, res, next) {
  try {
    if (!canAccessSoc(res)) {
      return deny(res);
    }

    const incident = await socRepository.findIncidentById(req.params.id);

    if (!incident) {
      return res.status(404).render('errors/error', {
        title: '사건 없음',
        message: '요청한 보안 사건을 찾을 수 없습니다.'
      });
    }

    const [incidentEvents, analysis] = await Promise.all([
      socRepository.listIncidentEvents(incident.id),
      socRepository.findLatestAiAnalysis(incident.id)
    ]);

    return res.render('soc/incident-detail', {
      title: `사건 #${incident.id}`,
      currentUser: res.locals.currentUser,
      demoMode: env.soc.demoMode,
      incident,
      incidentEvents,
      analysis
    });
  } catch (error) {
    return next(error);
  }
}

async function feed(req, res, next) {
  try {
    if (!canAccessSoc(res)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const [eventCount, openIncidents, blockedIps, incidents, events, blocks] =
      await Promise.all([
        socRepository.countEvents(),
        socRepository.countOpenIncidents(),
        socRepository.countActiveBlocks(),
        socRepository.listIncidents(20),
        socRepository.listRecentEvents(30),
        socRepository.listActiveBlocks(10)
      ]);

    return res.json({
      stats: { events: eventCount, openIncidents, blockedIps },
      incidents,
      events,
      blocks
    });
  } catch (error) {
    return next(error);
  }
}

const drillScenarios = {
  failed_login: {
    label: '로그인 실패',
    events: [
      { eventType: 'AUTH_LOGIN_FAILED', category: 'AUTHENTICATION', riskScore: 35, path: '/auth/login', statusCode: 401, summary: '연습: 잘못된 비밀번호 로그인 실패' }
    ]
  },
  brute_force: {
    label: '무차별 대입 연습',
    events: [
      { eventType: 'AUTH_LOGIN_FAILED', category: 'AUTHENTICATION', riskScore: 35, path: '/auth/login', statusCode: 401, summary: '연습: 로그인 실패 1회' },
      { eventType: 'AUTH_LOGIN_FAILED', category: 'AUTHENTICATION', riskScore: 38, path: '/auth/login', statusCode: 401, summary: '연습: 로그인 실패 2회' },
      { eventType: 'AUTH_LOGIN_FAILED', category: 'AUTHENTICATION', riskScore: 42, path: '/auth/login', statusCode: 401, summary: '연습: 로그인 실패 3회' },
      { eventType: 'AUTH_LOGIN_FAILED', category: 'AUTHENTICATION', riskScore: 48, path: '/auth/login', statusCode: 401, summary: '연습: 로그인 실패 4회' },
      { eventType: 'WEB_RATE_LIMIT', category: 'AUTHENTICATION', riskScore: 55, path: '/auth/login', statusCode: 429, summary: '연습: 로그인 요청 횟수 제한 초과' }
    ]
  },
  web_probe: {
    label: '웹 스캔 연습',
    events: [
      { eventType: 'WEB_SCAN', category: 'RECON', riskScore: 52, path: '/wp-admin', statusCode: 404, summary: '연습: 관리자 경로 스캔' },
      { eventType: 'WEB_PATH_PROBE', category: 'WEB_ATTACK', riskScore: 58, path: '/products', statusCode: 200, summary: '연습: 경로 탐색 패턴' }
    ]
  },
  admin_denied: {
    label: '권한 거부 연습',
    events: [
      { eventType: 'AUTH_ADMIN_DENIED', category: 'AUTHORIZATION', riskScore: 60, path: '/soc', statusCode: 403, summary: '연습: 관리자 페이지 접근 거부' },
      { eventType: 'AUTH_ADMIN_DENIED', category: 'AUTHORIZATION', riskScore: 64, path: '/soc', statusCode: 403, summary: '연습: 관리자 페이지 재시도' }
    ]
  }
};

async function runDrill(req, res, next) {
  try {
    if (!env.soc.demoMode) {
      return res.status(403).json({
        message: '연습 시나리오는 SOC_DEMO_MODE=true 일 때만 실행됩니다.'
      });
    }

    if (!canAccessSoc(res)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const scenarioName = req.body.scenario || 'brute_force';
    const scenario = drillScenarios[scenarioName];

    if (!scenario) {
      return res.status(400).json({ message: '알 수 없는 시나리오입니다.' });
    }

    const sourceIp = normalizeIp(req.body.sourceIp || '203.0.113.80');
    const results = [];

    for (const item of scenario.events) {
      const recorded = await recordSocEvent({
        requestId: req.requestId,
        eventType: item.eventType,
        category: item.category,
        sourceIp,
        username: 'drill-user',
        method: 'POST',
        path: item.path,
        statusCode: item.statusCode,
        riskScore: item.riskScore,
        detector: 'DRILL',
        summary: item.summary,
        evidence: `SOC-DRILL:${scenarioName}`
      });

      results.push(recorded);
    }

    const last = results[results.length - 1];

    return res.json({
      message: `${scenario.label} 시나리오를 기록했습니다.`,
      scenario: scenarioName,
      sourceIp,
      eventCount: results.length,
      incidentId: last?.incident?.id || null,
      riskScore: last?.incident?.risk_score || 0,
      blocked: Boolean(last?.blocked)
    });
  } catch (error) {
    return next(error);
  }
}

async function requestAnalysis(req, res, next) {
  try {
    if (!canAccessSoc(res)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const analysis = await analyzeIncident(req.params.id);

    return res.json({ analysis });
  } catch (error) {
    return next(error);
  }
}

async function resolve(req, res, next) {
  try {
    if (!canAccessSoc(res)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await socRepository.resolveIncident(
      req.params.id,
      req.body.note || '대시보드에서 종료 처리'
    );

    return res.json({ message: '사건을 종료했습니다.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  showDashboard,
  showIncident,
  feed,
  runDrill,
  requestAnalysis,
  resolve
};
