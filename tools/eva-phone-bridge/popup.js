const $ = (id) => document.getElementById(id);

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' }).catch(() => null);
  const state = response?.state;
  if (!state) {
    $('state').innerHTML = '<span class="bad">Bridge service is not responding.</span>';
    return;
  }
  $('baseUrl').value = state.baseUrl || $('baseUrl').value;
  $('bridgeId').value = state.bridgeId || $('bridgeId').value;
  $('autoAnswer').checked = state.autoAnswer !== false;
  $('state').innerHTML = state.paired
    ? `<div class="ok"><strong>● Paired</strong></div><div class="muted">Google Voice tab: ${state.googleVoiceOpen ? 'open' : 'will open automatically'}${state.activeJob?.id ? '<br>Eva is on a call.' : ''}</div>`
    : '<div class="bad"><strong>○ Not paired</strong></div><div class="muted">Create a pairing code in Aridon, then enter it below.</div>';
}

$('pair').addEventListener('click', async () => {
  $('pair').disabled = true;
  $('pair').textContent = 'Pairing…';
  const result = await chrome.runtime.sendMessage({
    type: 'PAIR',
    baseUrl: $('baseUrl').value.trim(),
    bridgeId: $('bridgeId').value.trim(),
    pairingCode: $('pairingCode').value.trim(),
    googleVoiceNumber: $('voiceNumber').value.trim(),
  }).catch((error) => ({ ok: false, error: String(error) }));
  if (!result?.ok) $('state').innerHTML = `<span class="bad">${result?.error || 'Pairing failed.'}</span>`;
  $('pair').disabled = false;
  $('pair').textContent = 'Pair this browser';
  await refresh();
});

$('autoAnswer').addEventListener('change', () => {
  void chrome.runtime.sendMessage({ type: 'SET_AUTO_ANSWER', enabled: $('autoAnswer').checked });
});

void refresh();
