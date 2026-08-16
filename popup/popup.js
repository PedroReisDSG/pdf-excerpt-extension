// popup.js - Script para o popup da extensao
// v1.2.0: usa mensagem direta para passar PDF local ao viewer, sem depender de chrome.storage

console.log('[Popup] Popup carregado');

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

    setStatus('Lendo arquivo...', false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      console.log('[Popup] PDF local lido:', file.name, `(${arrayBuffer.byteLength} bytes)`);

      setStatus('Abrindo visualizador...', false);

      // Abre a aba do viewer primeiro
      const viewerUrl = chrome.runtime.getURL('viewer/viewer.html') + '?source=local';
      const tab = await chrome.tabs.create({ url: viewerUrl });

      // Espera a aba carregar e depois envia os dados via mensagem
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'loadLocalPdf',
            pdfData: base64Data,
            fileName: file.name
          });
          console.log('[Popup] Dados do PDF enviados para a aba do viewer');
        } catch (msgError) {
          console.error('[Popup] Erro ao enviar mensagem para viewer:', msgError);
          // Fallback: tenta storage como ultimo recurso
          try {
            await chrome.storage.local.set({
              localPdfData: base64Data,
              localPdfName: file.name
            });
            console.log('[Popup] Fallback: dados salvos no storage');
          } catch (storageError) {
            console.error('[Popup] Fallback tambem falhou:', storageError);
          }
        }
      }, 1000);

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

console.log('[Popup] PDF Excerpt Extractor - Popup inicializado (v1.2.0)');
