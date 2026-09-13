const { pool } = require('../../config/database');

function maskSensitiveData(value) {
  if (value === null || value === undefined) {
    return null;
  }

  let text =
  typeof value === 'string'
    ? value
    : JSON.stringify(value);

  text = text
    .replace(
      /password["']?\s*[:=]\s*[^,\s}]+/gi,
      'password=[MASKED]'
    )
    .replace(
      /authorization["']?\s*[:=]\s*[^,\s}]+/gi,
      'authorization=[MASKED]'
    )
    .replace (
      /api[_-]?key["']?\s*[:=]\s*[^,\s}]+/gi,
      'api_key=[MASKED]'
    );

    return text.slice(0, 500);
}

async function createSecurityEvent({
  requestId,
  eventType,
  category,
  sourceIp,
  userId = null,
  username = null,
  method = null,
  path = null,
  statusCode = null,
  riskScore = 0,
  detector = 'RULE',
  summary,
  evidence = null
}) {
  const safeEvidence = maskSensitiveData(evidence);

  const [result] = await pool.execute(
    `
    INSERT INTO security_events (
      request_id,
      event_type,
      category,
      source_ip,
      user_id,
      username,
      http_method,
      request_path,
      status_code,
      risk_score,
      detector,
      summary,
      evidence_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      requestId,
      eventType,
      category,
      sourceIp,
      userId,
      username,
      method,
      path,
      statusCode,
      riskScore,
      detector,
      summary,
      safeEvidence
        ? JSON.stringify({ snippet: safeEvidence})
        : null
    ]
  );

  return result.insertId;
}

module.exports = {
  createSecurityEvent
};