const SOURCE = 'aridon-eva-ui';
let callActive = false;
let incomingVisible = false;
let lastInboundSignature = '';

function postToMain(type, detail = {}) {
  window.postMessage({ source: 'aridon-eva-extension', type, ...detail }, '*');
}

function send(type, detail = {}) {
  chrome.runtime.sendMessage({ source: SOURCE, type, ...detail }).catch(() => {});
}

function textOf(el) {
  return `${el.getAttribute?.('aria-label') || ''} ${el.textContent || ''}`.trim();
}

function visible(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function findClickable(patterns) {
  const nodes = [...document.querySelectorAll('button,[role="button"],a')].filter(visible);
  return nodes.find((el) => patterns.some((pattern) => pattern.test(textOf(el))));
}

function setReactInput(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dialNumber(phone) {
  const number = String(phone || '').trim();
  if (!number) throw new Error('No number supplied.');
  const input = [...document.querySelectorAll('input')].find((el) => {
    const label = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`;
    return /name or number|phone number|search/i.test(label) && visible(el);
  });
  if (!input) throw new Error('Google Voice dial field was not found. Keep the Calls page open.');
  input.focus();
  setReactInput(input, number);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));

  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    const exactNumber = number.replace(/\D/g, '');
    const callButton = [...document.querySelectorAll('button,[role="button"],a')].filter(visible).find((el) => {
      const text = textOf(el);
      const digits = text.replace(/\D/g, '');
      return /call/i.test(text) && (!exactNumber || digits.includes(exactNumber.slice(-7)) || /call$/i.test(text));
    });
    if (callButton) {
      callButton.click();
      send('DIAL_CLICKED', { phone: number });
      return;
    }
  }
  throw new Error('Google Voice call button was not found after entering the number.');
}

function answerIncoming() {
  const answer = findClickable([/^answer$/i, /answer call/i, /accept call/i]);
  if (!answer) throw new Error('Incoming Google Voice answer button is no longer visible.');
  answer.click();
  send('ANSWER_CLICKED');
}

function hangUp() {
  const button = findClickable([/hang up/i, /end call/i]);
  button?.click();
}

function inspectCallUi() {
  const answer = findClickable([/^answer$/i, /answer call/i, /accept call/i]);
  const hangup = findClickable([/hang up/i, /end call/i]);

  if (answer && !incomingVisible) {
    incomingVisible = true;
    const bodyText = document.body?.innerText || '';
    const numberMatch = bodyText.match(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/);
    const caller = numberMatch?.[0] || 'Incoming caller';
    const signature = `${caller}:${Date.now() >> 12}`;
    if (signature !== lastInboundSignature) {
      lastInboundSignature = signature;
      send('INCOMING_CALL', { caller });
    }
  } else if (!answer) {
    incomingVisible = false;
  }

  if (hangup && !callActive) {
    callActive = true;
    send('CALL_CONNECTED');
  } else if (!hangup && callActive) {
    callActive = false;
    send('CALL_ENDED');
  }
}

const observer = new MutationObserver(inspectCallUi);
function startObserver() {
  if (!document.documentElement) return setTimeout(startObserver, 50);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  inspectCallUi();
}
startObserver();

// Manifest V3 background workers may sleep. A live Google Voice tab wakes the
// bridge every few seconds so queued calls are picked up promptly and the
// online heartbeat stays current.
setInterval(() => send('POLL'), 3000);
send('POLL');

window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.source !== 'aridon-eva-main') return;
  send(event.data.type, event.data);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'DIAL') {
    postToMain('ARM', { jobId: message.jobId });
    void dialNumber(message.phone)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  }
  if (message?.type === 'ANSWER') {
    postToMain('ARM', { jobId: message.jobId });
    try { answerIncoming(); sendResponse({ ok: true }); } catch (error) { sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }); }
    return false;
  }
  if (message?.type === 'START_REALTIME') {
    postToMain('START_REALTIME', message);
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === 'STOP') {
    postToMain('STOP');
    if (message.hangup) hangUp();
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === 'PING') {
    sendResponse({ ok: true, url: location.href, callActive, incomingVisible });
    return false;
  }
  return false;
});
