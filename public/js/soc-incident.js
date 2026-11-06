'use strict';

function csrfHeaders() {
  const token = document.querySelector('meta[name="csrf-token"]');

  return {
    'Content-Type': 'application/json',
    'x-csrf-token': token ? token.getAttribute('content') : ''
  };
}

const incidentId = document.body.getAttribute('data-incident-id');
const result = document.getElementById('detail-result');

document.getElementById('btn-analyze').addEventListener('click', async () => {
  result.textContent = '분석 중...';

  const response = await fetch('/soc/incidents/' + incidentId + '/analyze', {
    method: 'POST',
    headers: csrfHeaders(),
    body: '{}'
  });

  const data = await response.json().catch(() => ({}));
  result.textContent = data.analysis
    ? (data.analysis.summary || data.analysis.analysis_status)
    : (data.message || '완료');

  if (response.ok) {
    window.location.reload();
  }
});

document.getElementById('btn-resolve').addEventListener('click', async () => {
  const response = await fetch('/soc/incidents/' + incidentId + '/resolve', {
    method: 'POST',
    headers: csrfHeaders(),
    body: JSON.stringify({ note: '대시보드에서 종료' })
  });

  const data = await response.json().catch(() => ({}));
  result.textContent = data.message || '처리됨';

  if (response.ok) {
    window.location.href = '/soc';
  }
});
