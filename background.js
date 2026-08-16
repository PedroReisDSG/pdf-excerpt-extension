// background.js - Service Worker para gerenciar a extensao
// Detecta PDFs remotos (http/https) e redireciona para o visualizador proprio
// PDFs locais (file://) NAO sao mais redirecionados, pois o PDF.js nao consegue
// ler arquivos file:// de dentro do contexto da extensao de forma confiavel.

const EXCLUDED_PATTERNS = [
  'chrome-extension://',
  'edge-extension://',
  'moz-extension://',
  'about:',
  'blob:'
];

// Verifica se a URL e um PDF remoto (http/https). PDFs file:// sao ignorados de proposito.
function isRemotePDFUrl(url) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (EXCLUDED_PATTERNS.some(pattern => lower.startsWith(pattern))) {
    return false;
  }

  // Ignora explicitamente qualquer PDF local
  if (lower.startsWith('file:')) {
    return false;
  }

  // So considera http/https
  const isHttp = lower.startsWith('http://') || lower.startsWith('https://');
  if (!isHttp) return false;

  return lower.endsWith('.pdf') ||
         lower.includes('.pdf?') ||
         lower.includes('.pdf#');
}

// Obtem a URL do visualizador da extensao
function getViewerUrl(pdfUrl) {
  const extensionUrl = chrome.runtime.getURL('viewer/viewer.html');
  return `${extensionUrl}?pdf=${encodeURIComponent(pdfUrl)}`;
}

// Listener para navegacoes - detecta e redireciona apenas PDFs remotos
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Apenas frame principal

  if (isRemotePDFUrl(details.url)) {
    console.log('[PDF Excerpt] PDF remoto detectado (onBeforeNavigate):', details.url);

    chrome.storage.session.set({
      currentPdfUrl: details.url,
      timestamp: Date.now()
    });
  } else if (details.url && details.url.toLowerCase().startsWith('file:') && details.url.toLowerCase().includes('.pdf')) {
    console.log('[PDF Excerpt] PDF local detectado (onBeforeNavigate). Nao sera redirecionado:', details.url);
  }
});

// Listener para quando a navegacao e completada - so redireciona PDFs remotos
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const tab = await chrome.tabs.get(details.tabId);

  if (!tab || !tab.url) return;

  if (isRemotePDFUrl(tab.url)) {
    console.log('[PDF Excerpt] Redirecionando PDF remoto para visualizador proprio:', tab.url);

    const viewerUrl = getViewerUrl(tab.url);
    await chrome.tabs.update(details.tabId, { url: viewerUrl });
  } else if (tab.url.toLowerCase().startsWith('file:') && tab.url.toLowerCase().includes('.pdf')) {
    console.log('[PDF Excerpt] PDF local detectado (onCompleted). Mantendo visualizador nativo do navegador:', tab.url);
  }
});

// Listener para mensagens do content script ou viewer
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPdfUrl') {
    chrome.storage.session.get(['currentPdfUrl']).then((data) => {
      sendResponse({ pdfUrl: data.currentPdfUrl });
    });
    return true;
  }

  if (message.action === 'excerptsReady') {
    console.log('[PDF Excerpt] Excertos prontos para download:', message.excerpts.length);
    sendResponse({ success: true });
  }
});

console.log('[PDF Excerpt] Background service worker iniciado (v2 - ignora PDFs locais)');
