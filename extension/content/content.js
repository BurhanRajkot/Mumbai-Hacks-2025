// content/content.js

// Helper: extract main article text (basic heuristic)
function extractMainText() {
  // Try article tag first
  let article = document.querySelector('article');
  if (article) return article.innerText.trim();

  // Fallback: select the largest <p> container
  let pNodes = Array.from(document.querySelectorAll('p'));
  if (pNodes.length === 0) return document.body.innerText.trim().slice(0, 10000);

  // Concatenate paragraphs near the top
  let text = pNodes.slice(0, 60).map(p => p.innerText).join('\n\n');
  return text.trim();
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'EXTRACT_SELECTION_OR_PAGE') {
    const selected = window.getSelection().toString().trim();
    if (selected && selected.length > 10) {
      sendResponse({ text: selected, source: 'selection' });
    } else {
      const pageText = extractMainText();
      sendResponse({ text: pageText, source: 'page' });
    }
    return true; // indicates async response allowed (not needed here)
  }

  if (msg.type === 'SHOW_VERDICT_OVERLAY') {
    insertOverlay(msg.payload);
    sendResponse({ ok: true });
    return true;
  }
});

// Overlay injection
function insertOverlay({ claimId, claim, verdict, confidence, shortReason }) {
  removeExistingOverlay();
  const container = document.createElement('div');
  container.id = 'misinfo-overlay-card';
  container.innerHTML = `
    <div class="misinfo-card">
      <div class="misinfo-badge ${verdict.toLowerCase()}">${verdict}</div>
      <div class="misinfo-claim">${escapeHtml(claim)}</div>
      <div class="misinfo-reason">${escapeHtml(shortReason || '')}</div>
      <div class="misinfo-actions">
        <button id="misinfo-view-evidence">View Evidence</button>
        <button id="misinfo-close">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // styles injected once
  if (!document.getElementById('misinfo-overlay-style')) {
    const s = document.createElement('link');
    s.rel = 'stylesheet';
    s.href = chrome.runtime.getURL('inject/overlay.css');
    s.id = 'misinfo-overlay-style';
    document.head.appendChild(s);
  }

  document.getElementById('misinfo-close').onclick = () => removeExistingOverlay();
  document.getElementById('misinfo-view-evidence').onclick = () => {
    // Send message to open evidence modal via background (open popup) or open new tab.
    chrome.runtime.sendMessage({ type: 'OPEN_EVIDENCE_TAB', payload: { claimId } });
  };
}

function removeExistingOverlay() {
  const old = document.getElementById('misinfo-overlay-card');
  if (old) old.remove();
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

// Optional: auto-detect claim-like sentences and show a small hint (skip for MVP)
