// viewer.js - Logica principal do visualizador de PDF
// v1.2.0: suporte a PDF local via mensagem direta (chrome.tabs.sendMessage) alem de URL remota

const state = {
  pdfDoc: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.5,
  excerpts: [],
  selectMode: false,
  pdfUrl: '',
  fileName: '',
  isLocalSource: false
};

const elements = {
  canvas: document.getElementById('pdfCanvas'),
  ctx: document.getElementById('pdfCanvas').getContext('2d'),
  fileName: document.getElementById('fileName'),
  pageNumber: document.getElementById('pageNumber'),
  pageCount: document.getElementById('pageCount'),
  pageInput: document.getElementById('pageInput'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  selectMode: document.getElementById('selectMode'),
  clearSelections: document.getElementById('clearSelections'),
  exportPdf: document.getElementById('exportPdf'),
  exportTxt: document.getElementById('exportTxt'),
  excerptsList: document.getElementById('excerptsList'),
  excerptCount: document.getElementById('excerptCount'),
  confirmModal: document.getElementById('confirmModal'),
  modalMessage: document.getElementById('modalMessage'),
  modalCancel: document.getElementById('modalCancel'),
  modalConfirm: document.getElementById('modalConfirm')
};

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

// Escuta mensagem do popup com dados do PDF local
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'loadLocalPdf' && message.pdfData) {
    console.log('[Viewer] Recebendo PDF local via mensagem:', message.fileName, `(${message.pdfData.length} chars base64)`);

    state.fileName = message.fileName || 'documento-local.pdf';
    elements.fileName.textContent = state.fileName;

    const pdfBytes = base64ToUint8Array(message.pdfData);
    console.log('[Viewer] PDF local decodificado:', pdfBytes.length, 'bytes');

    loadPdfFromBytes(pdfBytes);
    sendResponse({ success: true });
    return true;
  }
});

async function loadPdfFromBytes(pdfBytes) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;

    console.log('[Viewer] PDF local carregado:', state.totalPages, 'paginas');

    elements.pageCount.textContent = state.totalPages;
    elements.pageInput.max = state.totalPages;

    await renderPage(1);
    setupEventListeners();

  } catch (error) {
    console.error('[Viewer] Erro ao carregar PDF local:', error);
    showError('Erro ao carregar PDF local: ' + (error.message || error));
  }
}

async function init() {
  console.log('[Viewer] Inicializando...');

  pdfjsLib.GlobalWorkerOptions.workerSrc = '../libs/pdf.worker.min.js';

  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');

  state.isLocalSource = source === 'local';

  if (state.isLocalSource) {
    console.log('[Viewer] Aguardando dados do PDF local via mensagem...');
    // Nao faz nada aqui - espera a mensagem do popup
    return;
  }

  // Fluxo remoto (http/https)
  state.pdfUrl = params.get('pdf');

  if (!state.pdfUrl) {
    showError('Nenhum PDF especificado');
    console.error('[Viewer] Nenhum parametro ?pdf= na URL do viewer');
    return;
  }

  if (state.pdfUrl.startsWith('file:')) {
    console.warn('[Viewer] PDF local via URL file:// detectado. Use o botao "Escolher arquivo PDF" no popup.');
    showError('PDFs locais devem ser abertos pelo botao "Escolher arquivo PDF" no popup da extensao.');
    return;
  }

  state.fileName = state.pdfUrl.split('/').pop().split('?')[0].split('#')[0];
  elements.fileName.textContent = state.fileName;

  console.log('[Viewer] Carregando PDF remoto:', state.pdfUrl);

  try {
    const loadingTask = pdfjsLib.getDocument(state.pdfUrl);
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;

    console.log('[Viewer] PDF remoto carregado:', state.totalPages, 'paginas');

    elements.pageCount.textContent = state.totalPages;
    elements.pageInput.max = state.totalPages;

    await renderPage(1);
    setupEventListeners();

  } catch (error) {
    console.error('[Viewer] Erro ao carregar PDF remoto:', error);
    showError('Erro ao carregar PDF: ' + (error.message || error));
  }
}

async function renderPage(pageNum) {
  if (!state.pdfDoc) return;

  const page = await state.pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: state.scale });

  elements.canvas.height = viewport.height;
  elements.canvas.width = viewport.width;

  const renderContext = {
    canvasContext: elements.ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  state.currentPage = pageNum;
  elements.pageNumber.textContent = pageNum;
  elements.pageInput.value = pageNum;

  console.log('[Viewer] Pagina', pageNum, 'renderizada');
}

function setupEventListeners() {
  elements.prevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      renderPage(state.currentPage - 1);
    }
  });

  elements.nextPage.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      renderPage(state.currentPage + 1);
    }
  });

  elements.pageInput.addEventListener('change', (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= state.totalPages) {
      renderPage(page);
    } else {
      e.target.value = state.currentPage;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'ArrowLeft') {
      elements.prevPage.click();
    } else if (e.key === 'ArrowRight') {
      elements.nextPage.click();
    }
  });

  elements.selectMode.addEventListener('click', toggleSelectMode);
  elements.canvas.addEventListener('mouseup', handleTextSelection);

  elements.clearSelections.addEventListener('click', () => {
    if (state.excerpts.length === 0) return;

    showModal('Tem certeza que deseja limpar todos os excertos?', () => {
      state.excerpts = [];
      updateExcerptsList();
      saveExcerpts();
    });
  });

  elements.exportPdf.addEventListener('click', () => {
    if (state.excerpts.length === 0) {
      alert('Nenhum excerto selecionado para exportar');
      return;
    }

    showModal('Exportar excertos para PDF?', exportToPdf);
  });

  elements.exportTxt.addEventListener('click', () => {
    if (state.excerpts.length === 0) {
      alert('Nenhum excerto selecionado para exportar');
      return;
    }

    exportToTxt();
  });

  elements.modalCancel.addEventListener('click', hideModal);
  elements.modalConfirm.addEventListener('click', () => {
    hideModal();
    if (state.modalCallback) {
      state.modalCallback();
    }
  });

  loadExcerpts();
}

function toggleSelectMode() {
  state.selectMode = !state.selectMode;
  elements.selectMode.classList.toggle('btn-primary', state.selectMode);
  elements.selectMode.textContent = state.selectMode ? 'Selecionando' : 'Selecionar';

  console.log('[Viewer] Modo selecao:', state.selectMode);
}

async function handleTextSelection(e) {
  if (!state.selectMode || !state.pdfDoc) return;

  try {
    const page = await state.pdfDoc.getPage(state.currentPage);
    const textContent = await page.getTextContent();

    let selectedText = '';
    textContent.items.forEach(item => {
      if (item.str && item.str.trim()) {
        selectedText += item.str + ' ';
      }
    });

    if (selectedText.trim()) {
      addExcerpt(selectedText.trim(), state.currentPage);
    }

  } catch (error) {
    console.error('[Viewer] Erro ao obter texto:', error);
  }
}

function addExcerpt(text, pageNumber) {
  const excerpt = {
    id: Date.now(),
    text: text,
    page: pageNumber,
    timestamp: new Date().toISOString()
  };

  state.excerpts.push(excerpt);
  updateExcerptsList();
  saveExcerpts();

  console.log('[Viewer] Excerto adicionado:', excerpt);
}

function updateExcerptsList() {
  elements.excerptCount.textContent = state.excerpts.length;

  if (state.excerpts.length === 0) {
    elements.excerptsList.innerHTML = `
      <div class="empty-state">
        <p>Selecione texto no PDF para adicionar excertos</p>
        <p class="hint">Use o botao "Selecionar" para ativar o modo de captura</p>
      </div>
    `;
    return;
  }

  elements.excerptsList.innerHTML = state.excerpts.map((excerpt, index) => `
    <div class="excerpt-item" data-id="${excerpt.id}">
      <div class="excerpt-header">
        <span class="excerpt-page">Pagina ${excerpt.page}</span>
        <span>#${index + 1}</span>
      </div>
      <div class="excerpt-text">${escapeHtml(excerpt.text.substring(0, 200))}${excerpt.text.length > 200 ? '...' : ''}</div>
      <div class="excerpt-actions">
        <button onclick="viewExcerpt(${excerpt.id})">Ver completo</button>
        <button onclick="removeExcerpt(${excerpt.id})">Remover</button>
      </div>
    </div>
  `).join('');
}

window.viewExcerpt = (id) => {
  const excerpt = state.excerpts.find(e => e.id === id);
  if (excerpt) {
    alert(`Pagina ${excerpt.page}\n\n${excerpt.text}`);
  }
};

window.removeExcerpt = (id) => {
  state.excerpts = state.excerpts.filter(e => e.id !== id);
  updateExcerptsList();
  saveExcerpts();
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getExcerptsStorageKey() {
  return state.isLocalSource ? `local:${state.fileName}` : state.pdfUrl;
}

async function saveExcerpts() {
  try {
    const key = getExcerptsStorageKey();

    await chrome.storage.local.set({
      excerpts: state.excerpts,
      excerptsKey: key,
      fileName: state.fileName
    });
    console.log('[Viewer] Excertos salvos');
  } catch (error) {
    console.error('[Viewer] Erro ao salvar excertos:', error);
  }
}

async function loadExcerpts() {
  try {
    const key = getExcerptsStorageKey();
    const data = await chrome.storage.local.get(['excerpts', 'excerptsKey']);

    if (data.excerpts && data.excerptsKey === key) {
      state.excerpts = data.excerpts;
      updateExcerptsList();
      console.log('[Viewer] Excertos carregados:', state.excerpts.length);
    }
  } catch (error) {
    console.error('[Viewer] Erro ao carregar excertos:', error);
  }
}

async function exportToPdf() {
  try {
    console.log('[Viewer] Criando PDF com excertos...');

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    pdfDoc.setTitle('Excertos - ' + state.fileName);
    pdfDoc.setAuthor('PDF Excerpt Extractor');
    pdfDoc.setSubject('Excertos selecionados do PDF');
    pdfDoc.setKeywords(['excertos', 'pdf', 'fichamento']);
    pdfDoc.setProducer('PDF Excerpt Extractor Extension');
    pdfDoc.setCreator('PDF Excerpt Extractor');

    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;

    let yPosition = pageHeight - margin;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawText('Excertos Selecionados', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.6)
    });
    yPosition -= 30;

    page.drawText(`Arquivo original: ${state.fileName}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 20;

    page.drawText(`Total de excertos: ${state.excerpts.length}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 20;

    page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 40;

    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: pageWidth - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    yPosition -= 30;

    state.excerpts.forEach((excerpt, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      const excerptHeader = `Excerto #${index + 1} (Pagina ${excerpt.page})`;
      page.drawText(excerptHeader, {
        x: margin,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.6)
      });
      yPosition -= 20;

      const textLines = splitTextIntoLines(excerpt.text, pageWidth - (margin * 2), 10, font);

      textLines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 15;
      });

      yPosition -= 15;

      if (index < state.excerpts.length - 1) {
        page.drawLine({
          start: { x: margin, y: yPosition },
          end: { x: pageWidth - margin, y: yPosition },
          thickness: 0.5,
          color: rgb(0.9, 0.9, 0.9)
        });
        yPosition -= 20;
      }
    });

    const pdfBytes = await pdfDoc.save();

    downloadFile(pdfBytes, `excertos-${state.fileName.replace('.pdf', '')}.pdf`, 'application/pdf');

    console.log('[Viewer] PDF exportado com sucesso');

    chrome.runtime.sendMessage({
      action: 'excerptsReady',
      excerpts: state.excerpts
    });

  } catch (error) {
    console.error('[Viewer] Erro ao exportar PDF:', error);
    alert('Erro ao exportar PDF: ' + error.message);
  }
}

function exportToTxt() {
  let content = `EXCERTOS SELECIONADOS\n`;
  content += `Arquivo original: ${state.fileName}\n`;
  content += `Total de excertos: ${state.excerpts.length}\n`;
  content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  content += `\n${'='.repeat(60)}\n\n`;

  state.excerpts.forEach((excerpt, index) => {
    content += `Excerto #${index + 1} (Pagina ${excerpt.page})\n`;
    content += `${'-'.repeat(40)}\n`;
    content += `${excerpt.text}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadFile(blob, `excertos-${state.fileName.replace('.pdf', '')}.txt`, 'text/plain');

  console.log('[Viewer] TXT exportado com sucesso');
}

function splitTextIntoLines(text, maxWidth, fontSize, font) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function downloadFile(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function showModal(message, callback) {
  elements.modalMessage.textContent = message;
  elements.confirmModal.classList.add('active');
  state.modalCallback = callback;
}

function hideModal() {
  elements.confirmModal.classList.remove('active');
  state.modalCallback = null;
}

function showError(message) {
  elements.fileName.textContent = 'Erro: ' + message;
  elements.fileName.style.color = '#e94560';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[Viewer] Script carregado (v1.2.0 - suporte a PDF local via mensagem)');
