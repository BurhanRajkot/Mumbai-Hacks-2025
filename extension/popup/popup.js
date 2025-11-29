const chatArea = document.getElementById('chatArea')
const sendBtn = document.getElementById('sendBtn')
const input = document.getElementById('inputText')
const loading = document.getElementById('loading')

// Add message bubble
function addMessage(text, type = 'bot', verdict = null, confidence = null) {
  const msg = document.createElement('div')
  msg.classList.add('message', type === 'user' ? 'user-msg' : 'bot-msg')

  if (verdict) {
    const badge = document.createElement('span')
    badge.textContent = verdict
    badge.classList.add('inner-badge', verdict)
    msg.appendChild(badge)
    msg.appendChild(document.createElement('br'))

    if (confidence) {
      const conf = document.createElement('small')
      conf.textContent = `Confidence: ${(confidence * 100).toFixed(1)}%`
      msg.appendChild(conf)
      msg.appendChild(document.createElement('br'))
      msg.appendChild(document.createElement('br'))
    }
  }

  msg.append(text)
  chatArea.appendChild(msg)
  chatArea.scrollTop = chatArea.scrollHeight
}

sendBtn.addEventListener('click', sendMessage)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

async function sendMessage() {
  const text = input.value.trim()
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  let payload = {}

  // Decide mode
  if (text.length > 0) {
    payload = { mode: 'text', text }
    addMessage(text, 'user') // add user bubble
  } else {
    payload = { mode: 'page', url: tab.url }
    addMessage('Analyzing full page...', 'user')
  }

  input.value = ''
  loading.classList.remove('hidden')

  try {
    const res = await fetch('http://localhost:5000/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    loading.classList.add('hidden')

    // Extract final output message
    const textOut = JSON.stringify(data, null, 2)

    addMessage(
      textOut,
      'bot',
      data.verdict || 'Unverified',
      data.confidence || null
    )
  } catch (err) {
    loading.classList.add('hidden')
    addMessage('❌ Error: ' + err.message, 'bot')
  }
}
