document.getElementById('scanPage').addEventListener('click', async () => {
  setStatus('Extracting page text...');
  const text = await extractTextFromTab();
  if (!text) { setStatus('No text found on this page. Try selecting text.'); return; }
  setStatus('Sending to verification...');
  const resp = await checkText(text);
  showResult(resp);
});

document.getElementById('checkSelection').addEventListener('click', async () => {
  setStatus('Getting current selection...');
  const text = await extractTextFromTab(true);
  if (!text) { setStatus('No selection found. Please select text on the page and try again.'); return; }
  setStatus('Sending to verification...');
  const resp = await checkText(text);
  showResult(resp);
});

function setStatus(t) { document.getElementById('status').innerText = t; }
function showResult(resp) {
  if (!resp || !resp.resp) { setStatus('Error or no response'); return; }
  const payload = resp.resp;
  const verify = payload.verify;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `<div><strong>Claim:</strong> ${escapeHtml(payload.claimText.slice(0,250))}</div>
    <div><strong>Verdict:</strong> ${verify.verdict} (${(verify.confidence||0).toFixed(2)})</div>
    <div><button id="viewEvidence">View Evidence</button></div>`;
  resultsDiv.appendChild(item);
  setStatus('Done.');

  document.getElementById('viewEvidence').addEventListener('click', () => {
    if (payload.claimId) {
      chrome.runtime.sendMessage({ type: 'OPEN_EVIDENCE_TAB', payload: { claimId: payload.claimId } });
    } else {
      alert('No claimId available for evidence.');
    }
  });

  // Also show overlay in page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    // send message to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_VERDICT_OVERLAY',
      payload: {
        claimId: payload.claimId,
        claim: payload.claimText,
        verdict: verify.verdict,
        confidence: verify.confidence,
        shortReason: (verify.explanation && verify.explanation.slice(0,140)) || ''
      }
    });
  });
}

async function extractTextFromTab(onlySelection = false) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_SELECTION_OR_PAGE' }, (response) => {
        if (!response) return resolve(null);
        if (onlySelection && response.source !== 'selection') return resolve('');
        resolve(response.text);
      });
    });
  });
}

async function checkText(text) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CHECK_TEXT', payload: { text, url: window.location && window.location.href } }, (response) => {
      resolve(response);
    });
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"'`=\/]/g, function (c) {
    return {
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
    }[c];
  });
}
