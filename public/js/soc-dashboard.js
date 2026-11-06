'use strict';

function csrfHeaders() {
  const token = document.querySelector('meta[name="csrf-token"]');

  return {
    'Content-Type': 'application/json',
    'x-csrf-token': token ? token.getAttribute('content') : ''
  };
}

function fillRows(body, rows, builder) {
  body.innerHTML = rows.map(builder).join('') || '';
}

function renderIncident(incident) {
  return (
    '<tr>' +
    '<td><a href="/soc/incidents/' + incident.id + '">#' + incident.id + '</a></td>' +
    '<td>' + incident.incident_type + '</td>' +
    '<td>' + (incident.source_ip || '') + '</td>' +
    '<td>' + incident.risk_score + ' / ' + incident.severity + '</td>' +
    '<td>' + incident.status + '</td>' +
    '</tr>'
  );
}

function renderEvent(event) {
  return (
    '<tr>' +
    '<td>' + event.event_type + '</td>' +
    '<td>' + (event.source_ip || '') + '</td>' +
    '<td>' + (event.summary || '') + '</td>' +
    '<td>' + event.risk_score + '</td>' +
    '</tr>'
  );
}

function renderBlock(block) {
  return (
    '<tr>' +
    '<td>' + block.ip_address + '</td>' +
    '<td>' + (block.reason || '') + '</td>' +
    '<td>' + (block.expires_at || '') + '</td>' +
    '</tr>'
  );
}

async function refreshFeed() {
  const response = await fetch('/soc/feed');

  if (!response.ok) {
    return;
  }

  const data = await response.json();

  document.getElementById('stat-events').textContent = data.stats.events;
  document.getElementById('stat-incidents').textContent = data.stats.openIncidents;
  document.getElementById('stat-blocks').textContent = data.stats.blockedIps;

  fillRows(document.getElementById('incident-body'), data.incidents, renderIncident);
  fillRows(document.getElementById('event-body'), data.events, renderEvent);
  fillRows(document.getElementById('block-body'), data.blocks, renderBlock);
}

async function runScenario(scenario) {
  const result = document.getElementById('lab-result');
  result.textContent = '시나리오 실행 중...';

  const response = await fetch('/soc/lab/simulate', {
    method: 'POST',
    headers: csrfHeaders(),
    body: JSON.stringify({ scenario })
  });

  const data = await response.json();
  result.textContent = data.message +
    (data.incidentId ? ' / 사건 #' + data.incidentId + ' 위험도 ' + data.riskScore : '');

  await refreshFeed();
}

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    runScenario(button.getAttribute('data-scenario'));
  });
});

setInterval(refreshFeed, 4000);
