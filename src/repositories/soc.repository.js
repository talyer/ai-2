'use strict';

const { pool } = require('../config/database');

async function findEventById(id) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM security_events
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findRecentEventsByIp(sourceIp, minutes) {
  const windowMinutes = Math.max(1, Number(minutes) || 5);
  const [rows] = await pool.execute(
    `SELECT *
     FROM security_events
     WHERE source_ip = ?
       AND occurred_at >= DATE_SUB(NOW(3), INTERVAL ${windowMinutes} MINUTE)
     ORDER BY occurred_at ASC`,
    [sourceIp]
  );

  return rows;
}

async function listRecentEvents(limit) {
  const size = Math.max(1, Math.min(200, Number(limit) || 50));
  const [rows] = await pool.query(
    `SELECT *
     FROM security_events
     ORDER BY occurred_at DESC
     LIMIT ${size}`
  );

  return rows;
}

async function countEvents() {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM security_events'
  );

  return Number(row.cnt);
}

async function findOpenIncidentByKey(incidentKey) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM security_incidents
     WHERE incident_key = ?
       AND status IN ('OPEN', 'INVESTIGATING')
     LIMIT 1`,
    [incidentKey]
  );

  return rows[0] || null;
}

async function createIncident(data) {
  const [result] = await pool.execute(
    `INSERT INTO security_incidents (
      incident_key,
      incident_type,
      title,
      description,
      source_ip,
      user_id,
      severity,
      status,
      risk_score,
      event_count,
      first_seen_at,
      last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)`,
    [
      data.incidentKey,
      data.incidentType,
      data.title,
      data.description,
      data.sourceIp,
      data.userId,
      data.severity,
      data.riskScore,
      data.eventCount,
      data.firstSeenAt,
      data.lastSeenAt
    ]
  );

  return result.insertId;
}

async function updateIncident(id, data) {
  await pool.execute(
    `UPDATE security_incidents
     SET incident_type = ?,
         title = ?,
         description = ?,
         severity = ?,
         risk_score = ?,
         event_count = ?,
         last_seen_at = ?,
         status = 'INVESTIGATING'
     WHERE id = ?`,
    [
      data.incidentType,
      data.title,
      data.description,
      data.severity,
      data.riskScore,
      data.eventCount,
      data.lastSeenAt,
      id
    ]
  );
}

async function linkIncidentEvent(incidentId, eventId) {
  await pool.execute(
    `INSERT IGNORE INTO incident_events (incident_id, event_id)
     VALUES (?, ?)`,
    [incidentId, eventId]
  );
}

async function findIncidentById(id) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM security_incidents
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listIncidents(limit) {
  const size = Math.max(1, Math.min(100, Number(limit) || 30));
  const [rows] = await pool.query(
    `SELECT *
     FROM security_incidents
     ORDER BY last_seen_at DESC
     LIMIT ${size}`
  );

  return rows;
}

async function listIncidentEvents(incidentId) {
  const [rows] = await pool.execute(
    `SELECT e.*
     FROM incident_events ie
     JOIN security_events e ON e.id = ie.event_id
     WHERE ie.incident_id = ?
     ORDER BY e.occurred_at ASC`,
    [incidentId]
  );

  return rows;
}

async function countOpenIncidents() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM security_incidents
     WHERE status IN ('OPEN', 'INVESTIGATING')`
  );

  return Number(row.cnt);
}

async function resolveIncident(id, note) {
  await pool.execute(
    `UPDATE security_incidents
     SET status = 'RESOLVED',
         resolved_at = NOW(),
         resolution_note = ?
     WHERE id = ?`,
    [note, id]
  );
}

async function createAiAnalysis(data) {
  const [result] = await pool.execute(
    `INSERT INTO incident_ai_analyses (
      incident_id,
      provider,
      model_name,
      analysis_status,
      incident_type,
      summary,
      evidence_json,
      recommended_actions_json,
      confidence,
      error_message,
      analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.incidentId,
      data.provider,
      data.modelName,
      data.analysisStatus,
      data.incidentType,
      data.summary,
      data.evidenceJson,
      data.recommendedActionsJson,
      data.confidence,
      data.errorMessage,
      data.analyzedAt
    ]
  );

  return result.insertId;
}

async function updateAiAnalysis(id, data) {
  await pool.execute(
    `UPDATE incident_ai_analyses
     SET analysis_status = ?,
         incident_type = ?,
         summary = ?,
         evidence_json = ?,
         recommended_actions_json = ?,
         confidence = ?,
         error_message = ?,
         analyzed_at = ?
     WHERE id = ?`,
    [
      data.analysisStatus,
      data.incidentType,
      data.summary,
      data.evidenceJson,
      data.recommendedActionsJson,
      data.confidence,
      data.errorMessage,
      data.analyzedAt,
      id
    ]
  );
}

async function findLatestAiAnalysis(incidentId) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM incident_ai_analyses
     WHERE incident_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [incidentId]
  );

  return rows[0] || null;
}

async function findActiveBlock(ipAddress) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM blocked_ips
     WHERE ip_address = ?
       AND released_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY id DESC
     LIMIT 1`,
    [ipAddress]
  );

  return rows[0] || null;
}

async function createBlockedIp(data) {
  const [result] = await pool.execute(
    `INSERT INTO blocked_ips (
      ip_address,
      block_type,
      reason,
      incident_id,
      expires_at
    ) VALUES (?, 'TEMPORARY', ?, ?, ?)`,
    [data.ipAddress, data.reason, data.incidentId, data.expiresAt]
  );

  return result.insertId;
}

async function countActiveBlocks() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM blocked_ips
     WHERE released_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())`
  );

  return Number(row.cnt);
}

async function listActiveBlocks(limit) {
  const size = Math.max(1, Math.min(100, Number(limit) || 20));
  const [rows] = await pool.query(
    `SELECT *
     FROM blocked_ips
     WHERE released_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY blocked_at DESC
     LIMIT ${size}`
  );

  return rows;
}

async function createResponseAction(data) {
  const [result] = await pool.execute(
    `INSERT INTO response_actions (
      incident_id,
      action_type,
      target_type,
      target_value,
      decision_source,
      action_status,
      reason,
      executed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.incidentId,
      data.actionType,
      data.targetType,
      data.targetValue,
      data.decisionSource,
      data.actionStatus,
      data.reason,
      data.executedAt
    ]
  );

  return result.insertId;
}

module.exports = {
  findEventById,
  findRecentEventsByIp,
  listRecentEvents,
  countEvents,
  findOpenIncidentByKey,
  createIncident,
  updateIncident,
  linkIncidentEvent,
  findIncidentById,
  listIncidents,
  listIncidentEvents,
  countOpenIncidents,
  resolveIncident,
  createAiAnalysis,
  updateAiAnalysis,
  findLatestAiAnalysis,
  findActiveBlock,
  createBlockedIp,
  countActiveBlocks,
  listActiveBlocks,
  createResponseAction
};
