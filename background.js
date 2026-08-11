// background.js - Service Worker para gerenciar a extensao
// Detecta PDFs e redireciona para o visualizador proprio

const EXCLUDED_PATTERNS = [
  'chrome-extension://',
  'edge-extension://',
  'moz-extension://',
  'about:',
  'blob:'
];

// Verifica se a URL e um PDF
function isPDFUrl(url) {
  if (EXCLUDED_PATTERNS.some(pattern => url.startsWith(pattern))) {
    return false;
  }
  return url.toLowerCase().endsWith('.pdf') || 
         url.toLowerCase().includes('.pdf?') ||
         url.toLowerCase().includes('.pdf#');
}

// Obtem a URL do visualizador da extensao
function getViewerUrl(pdfUrl) {
  const extensionUrl = chrome.runtime.getURL('viewer/viewer.html');
  return `${extensionUrl}?pdf=${encodeURIComponent(pdfUrl)}`;
}

// Listener para navegacoes - detecta e redireciona PDFs
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Apenas frame principal
  
  if (isPDFUrl(details.url)) {
    console.log('[PDF Excerpt] PDF detectado:', details.url);
    
    // Armazena a URL do PDF para uso posterior
    chrome.storage.session.set({
      currentPdfUrl: details.url,
      timestamp: Date.now()
    });
  }
});

// Listener para quando a navegacao e completada
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const tab = await chrome.tabs.get(details.tabId);
  if (isPDFUrl(tab.url)) {
    console.log('[PDF Excerpt] Redirecionando para visualizador proprio');
    
    const viewerUrl = getViewerUrl(tab.url);
    await chrome.tabs.update(details.tabId, { url: viewerUrl });
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

console.log('[PDF Excerpt] Background service worker iniciado');
