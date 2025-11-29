document.getElementById('analyze').addEventListener('click', async () => {
  const output = document.getElementById('output')
  const verdictBadge = document.getElementById('verdictBadge')
  const confidenceText = document.getElementById('confidence')
  const resultBox = document.getElementById('resultBox')
  const loading = document.getElementById('loading')

  const textareaValue = document.getElementById('inputText').value

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const pageURL = tab.url

  const textToSend = textareaValue.trim() || pageURL

  // Reset UI
  resultBox.classList.add('hidden')
  output.textContent = ''
  loading.classList.remove('hidden')

  try {
    const res = await fetch('http://localhost:5000/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToSend }),
    })

    const data = await res.json()

    loading.classList.add('hidden')
    resultBox.classList.remove('hidden')

    output.textContent = JSON.stringify(data, null, 2)

    // Badge style
    verdictBadge.textContent = data.verdict || 'Unknown'
    verdictBadge.className = 'badge ' + (data.verdict || '')

    // Confidence
    if (data.confidence)
      confidenceText.textContent = `Confidence: ${(
        data.confidence * 100
      ).toFixed(1)}%`
    else confidenceText.textContent = ''
  } catch (err) {
    loading.classList.add('hidden')
    resultBox.classList.remove('hidden')
    output.textContent = 'Error: ' + err
  }
})
