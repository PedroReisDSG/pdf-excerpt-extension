// popup.js - Script para o popup da extensao

console.log('[Popup] Popup carregado');

const MAX_PDF_SIZE_BYTES = 8 * 1024 * 1024; // 8MB - limite pratico para chrome.storage.local

const fileInput = document.getElementById('localPdfInput');
const openBtn = document.getElementById('openLocalPdfBtn');
const statusEl = document.getElementById('localPdfStatus');

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#c0392b' : '#2e7d32';
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

if (openBtn && fileInput) {
  openBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('Selecione um arquivo PDF valido.', true);
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setStatus(
        `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limite atual: ${MAX_PDF_SIZE_BYTES / (1024 * 1024)}MB.`,
        true
      );
      return;
    }

    setStatus('Lendo arquivo...', false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      await chrome.storage.local.set({
        localPdfData: base64Data,
        localPdfName: file.name,
        localPdfTimestamp: Date.now()
      });

      console.log('[Popup] PDF local salvo no storage:', file.name, `(${arrayBuffer.byteLength} bytes)`);

      setStatus('Abrindo visualizador...', false);

      const viewerUrl = chrome.runtime.getURL('viewer/viewer.html') + '?source=local';
      await chrome.tabs.create({ url: viewerUrl });

      window.close();

    } catch (error) {
      console.error('[Popup] Erro ao processar PDF local:', error);
      setStatus('Erro ao processar o arquivo: ' + error.message, true);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] DOM carregado');
});

console.log('[Popup] PDF Excerpt Extractor - Popup inicializado');
