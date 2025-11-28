// background/background.js

const API_BASE = 'https://your-team-api.example.com'; // teammate provides
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 min

// Simple in-memory cache (service workers may be restarted, also persist in chrome.storage)
const verdictCache = {}; // { claimHash: { verdict, ts, payload } }

async function callApi(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' /* add API key header if given */ },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

// Handle messages from popup/content
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CHECK_TEXT') {
    handleCheckText(msg.payload).then(resp => sendResponse({ ok: true, resp })).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'OPEN_EVIDENCE_TAB') {
    const claimId = msg.payload.claimId;
    const url = `${API_BASE}/ui/evidence/${claimId}`; // teammate can provide a web URL for full explanation
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
    return true;
  }
});

// Main flow: extract claim -> verify -> cache -> return
async function handleCheckText({ text, url }) {
  // Lightweight hash for caching
  const claimHash = simpleHash(text);
  const cached = verdictCache[claimHash];
  if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    return cached.payload;
  }

  // 1) Extract claim (teammate A)
  const extractResp = await callApi('/api/extract-claim', { text });
  // expect { claim: "...", claim_id: "..." } OR { claim: "...", claim_hash: "..." }
  const claimId = extractResp.claim_id || extractResp.claim_hash || simpleHash(extractResp.claim || text);
  const claimText = extractResp.claim || text;

  // 2) Verify (teammate B) - accept claim_id or raw claim
  const verifyResp = await callApi('/api/verify', { claim_id: claimId, claim: claimText, url });

  // 3) cache and return
  const payload = { claimId, claimText, verify: verifyResp };
  verdictCache[claimHash] = { ts: Date.now(), payload };
  // Also persist to chrome.storage local for longer life
  chrome.storage.local.set({ ['verdict_' + claimHash]: { ts: Date.now(), payload } });
  return payload;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return 'h' + (h >>> 0).toString(36);
}
