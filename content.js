// content.js - Content Script para interceptar PDFs
// Ajustado para nao quebrar PDFs locais (file://)

(function() {
  'use strict';

  const url = window.location.href.toLowerCase();

  const isPDF =
    url.endsWith('.pdf') ||
    url.includes('.pdf?') ||
    url.includes('.pdf#');

  if (!isPDF) {
    console.log('[PDF Excerpt] Nao e PDF, content.js finaliza. URL:', url);
    return;
  }

  const isLocalFile = url.startsWith('file:');

  if (isLocalFile) {
    console.log('[PDF Excerpt] PDF local detectado. Nao vou substituir o visualizador nativo. Use o popup da extensao para abrir PDFs locais no viewer proprio. URL:', url);
    return;
  }

  console.log('[PDF Excerpt] PDF remoto detectado pelo content script. Preparando redirecionamento para o viewer... URL:', url);

  document.documentElement.innerHTML = '';
  document.body.style.backgroundColor = '#f5f5f5';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  document.body.style.height = '100vh';
  document.body.style.margin = '0';

  const loadingDiv = document.createElement('div');
  loadingDiv.style.textAlign = 'center';
  loadingDiv.style.fontFamily = 'Arial, sans-serif';
  loadingDiv.innerHTML = `
    <h2 style="color: #333;">Carregando visualizador de PDF...</h2>
    <p style="color: #666;">Aguarde enquanto preparamos o visualizador com PDF.js</p>
    <div style="margin-top: 20px;">
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(loadingDiv);

  setTimeout(() => {
    const viewerUrl = chrome.runtime.getURL('viewer/viewer.html') +
                     '?pdf=' + encodeURIComponent(window.location.href);
    console.log('[PDF Excerpt] Redirecionando para viewer:', viewerUrl);
    window.location.href = viewerUrl;
  }, 500);
})();
