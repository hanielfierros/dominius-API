/**
 * app.js - Dominius Web V8 Chat Logic (Flat)
 * - API: https://dominius-api.onrender.com/chat exactly
 * - Debug log for URL
 * - Timeout 28s
 * - Better error messages for 404/500
 * - Improved thinking indicator
 * - Voice maintained
 */

const API_URL = 'https://dominius-api.onrender.com/chat';

let isListening = false;
let recognition = null;

console.log(`[Dominius] Using API URL: ${API_URL}`);

document.addEventListener('DOMContentLoaded', () => {
  initChatUI();
  initVoice();

  setTimeout(() => {
    updateFMCScreen('SYSTEM', 'DOMINIUS ONLINE\nORBITAL COMMS READY\nENTER QUERY');
  }, 800);
});

function initChatUI() {
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

async function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  updateFMCScreen('USER', text);
  input.value = '';

  showThinkingIndicator();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `API error: ${res.status}`;
      if (res.status === 404) errMsg = 'Chat endpoint not found (404). Check backend deployment.';
      if (res.status === 500) errMsg = 'Backend server error (500). Grok may be temporarily unavailable.';
      throw new Error(errMsg);
    }

    const data = await res.json();
    const response = data.botResponse || 'No response from orbital systems.';

    removeThinkingIndicator();
    updateFMCScreen('DOMINIUS', response);

  } catch (err) {
    removeThinkingIndicator();
    let userMsg = 'Connection issue with the station. Please retry.';

    if (err.name === 'AbortError') {
      userMsg = 'Request timed out (28s). Try again.';
    } else if (err.message.includes('404')) {
      userMsg = 'Chat service not found. Backend may need redeploy.';
    } else if (err.message.includes('500')) {
      userMsg = 'Server error on backend. Please try again later.';
    }

    console.error(`[Dominius] Chat error for ${API_URL}:`, err.message);
    updateFMCScreen('ERROR', userMsg);
  }
}

function updateFMCScreen(label, content) {
  const screen = document.getElementById('fmc-screen');
  if (!screen) return;

  const safe = content.substring(0, 280);
  const lines = safe.split('\n').slice(0, 8);

  let html = `<div style="color:#22c55e; font-weight:bold; margin-bottom:3px; font-size:10px;">${label}</div>`;
  lines.forEach(line => {
    html += `<div style="height:13px; overflow:hidden; font-size:11px;">${line}</div>`;
  });

  screen.innerHTML = html;
}

function showThinkingIndicator() {
  const screen = document.getElementById('fmc-screen');
  if (!screen) return;

  screen.innerHTML = `
    <div style="color:#22c55e; font-weight:bold; margin-bottom:4px; font-size:10px;">DOMINIUS</div>
    <div style="color:#64748b; font-size:11px; display:flex; align-items:center; gap:6px;">
      <span>Dominius está pensando...</span>
      <span style="display:inline-block; width:6px; height:6px; background:#67f6ff; border-radius:50%; animation: pulse 1.2s infinite;"></span>
    </div>
  `;
}

function removeThinkingIndicator() {
  // overwritten by next updateFMCScreen
}

function initVoice() {
  const micBtn = document.getElementById('mic-btn');
  const indicator = document.getElementById('mic-indicator');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (micBtn) micBtn.style.opacity = '0.4';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-MX';
  recognition.continuous = false;

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
        return;
      }
      recognition.start();
      isListening = true;
      micBtn.classList.add('!bg-orange-500', '!text-white');
      if (indicator) indicator.classList.remove('hidden');
      const screen = document.getElementById('fmc-screen');
      if (screen) screen.innerHTML = `<div style="color:#f97316;">LISTENING...</div>`;
    });
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (transcript) {
      const input = document.getElementById('message-input');
      if (input) input.value = transcript;
      sendMessage();
    }
    stopVoice(micBtn, indicator);
  };

  recognition.onend = () => stopVoice(micBtn, indicator);
}

function stopVoice(micBtn, indicator) {
  isListening = false;
  if (micBtn) micBtn.classList.remove('!bg-orange-500', '!text-white');
  if (indicator) indicator.classList.add('hidden');
}

window.DominiusV8 = { sendMessage: () => { const i = document.getElementById('message-input'); if(i) sendMessage(); } };