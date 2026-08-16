# PDF Excerpt Extractor (v1.3.0)

Extensao para Microsoft Edge e Firefox que permite visualizar PDFs (online ou locais)
com PDF.js, capturar selecoes de texto e gerar um novo PDF com os trechos destacados
para fichamento academico e revisao bibliografica.

## Novidade da v1.3.0: PDF local via runtime.sendMessage

Agora e possivel abrir PDFs do seu computador diretamente no visualizador da extensao,
sem limitacao de tamanho de armazenamento:

1. Clique no icone da extensao na barra de ferramentas.
2. No popup, clique em "Escolher arquivo PDF".
3. Selecione o PDF no seu computador.
4. Uma nova aba abre com o PDF carregado no visualizador da extensao.

### Como funciona internamente

O arquivo e lido no popup via `File.arrayBuffer()`, convertido para base64 e enviado
diretamente para a aba do viewer via `chrome.runtime.sendMessage()`. O viewer decodifica
de volta para `Uint8Array` e entrega ao PDF.js via `pdfjsLib.getDocument({ data: bytes })`.
Isso elimina o problema de quota do `chrome.storage.local` e e mais rapido.

## Historico de versoes

- **v1.3.0**: PDF local via runtime.sendMessage (corrige v1.2.0 que usava tabs.sendMessage,
  que nao funciona para paginas de extensao).
- **v1.2.0**: PDF local via tabs.sendMessage (nao funcionava para viewer.html).
- **v1.1.0**: Suporte a PDF local via chrome.storage (limitado a ~8MB).
- **v1.0.1**: Corrige bug em que `background.js` redirecionava PDFs locais (file://).
- **v1.0.0**: Versao inicial.

## Comportamento por tipo de PDF

| Tipo de PDF | Como abrir | Onde abre |
|---|---|---|
| Online (http/https) | Navegar ate o link | Visualizador da extensao (automatico) |
| Local (arquivo no PC) | Popup > "Escolher arquivo PDF" | Visualizador da extensao (nova aba) |
| Local via URL file:// direta | Digitar file:/// na barra | Visualizador nativo do navegador (a extensao nao interfere) |

## Instalacao

1. Extraia este pacote em uma pasta.
2. Rode `python setup.py` para baixar pdf.js e pdf-lib em `libs/`.
3. Converta `icons/icon.svg` para `icons/icon-48.png` (48x48).
4. Em `edge://extensions/`, ative "Modo do desenvolvedor" e "Carregar sem compactacao".
5. Confirme que a versao mostrada e 1.3.0.

## Licenca

MIT License.
