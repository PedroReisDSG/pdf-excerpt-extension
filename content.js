// content.js - Content Script para interceptar PDFs
// Detecta se a pagina atual e um PDF e previne o carregamento padrao

(function() {
  'use strict';
  
  // Verifica se estamos em uma URL de PDF
  const isPDF = window.location.href.toLowerCase().endsWith('.pdf') ||
                window.location.href.toLowerCase().includes('.pdf?') ||
                window.location.href.toLowerCase().includes('.pdf#');
  
  if (isPDF) {
    console.log('[PDF Excerpt] PDF detectado pelo content script');
    
    // Cria uma pagina em branco para evitar o visualizador nativo
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
    
    // Redireciona para o visualizador da extensao
    setTimeout(() => {
      const viewerUrl = chrome.runtime.getURL('viewer/viewer.html') + 
                       '?pdf=' + encodeURIComponent(window.location.href);
      window.location.href = viewerUrl;
    }, 500);
  }
  
  console.log('[PDF Excerpt] Content script carregado');
})();
