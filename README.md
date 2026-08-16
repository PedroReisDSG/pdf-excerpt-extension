# PDF Excerpt Extractor (v1.1.0)

Extensao para Microsoft Edge e Firefox que permite visualizar PDFs (online ou locais)
com PDF.js, capturar selecoes de texto e gerar um novo PDF com os trechos destacados
para fichamento academico e revisao bibliografica.

## Novidade da v1.1.0: suporte a PDF local

Agora e possivel abrir PDFs do seu computador diretamente no visualizador da extensao:

1. Clique no icone da extensao na barra de ferramentas.
2. No popup, clique em "Escolher arquivo PDF".
3. Selecione o PDF no seu computador.
4. Uma nova aba abre com o PDF carregado no visualizador da extensao, com todas as
   funcionalidades de captura de excertos disponiveis.

### Como funciona internamente

O arquivo e lido no proprio popup via `File.arrayBuffer()`, convertido para base64 e
salvo temporariamente em `chrome.storage.local`. O viewer, ao abrir com `?source=local`,
le esses dados, decodifica de volta para `Uint8Array` e entrega ao PDF.js via
`pdfjsLib.getDocument({ data: bytes })` - sem depender de acesso a `file://`, que e
bloqueado pelo navegador para extensoes.

### Limitacao conhecida

PDFs muito grandes (acima de ~8MB) podem nao carregar devido ao limite de armazenamento
do `chrome.storage.local`. Nesse caso, use o PDF online (se disponivel) ou reduza o
tamanho do arquivo.

## Historico de versoes

- **v1.1.0**: Adiciona suporte a PDF local via popup + FileReader + chrome.storage.
- **v1.0.1**: Corrige bug em que `background.js` redirecionava PDFs locais (file://)
  para o viewer mesmo apos correcao no `content.js`. Agora ambos ignoram `file://`
  para navegacao automatica.
- **v1.0.0**: Versao inicial.

## Comportamento por tipo de PDF

| Tipo de PDF | Como abrir | Onde abre |
|---|---|---|
| Online (http/https) | Navegar até o link | Visualizador da extensao (automatico) |
| Local (arquivo no PC) | Popup > "Escolher arquivo PDF" | Visualizador da extensao (nova aba) |
| Local via URL file:// direta | Digitar file:/// na barra | Visualizador nativo do navegador (a extensao nao interfere) |

## Instalacao

1. Extraia este pacote em uma pasta.
2. Rode `python setup.py` para baixar pdf.js e pdf-lib em `libs/`.
3. Converta `icons/icon.svg` para `icons/icon-48.png` (48x48).
4. Em `edge://extensions/`, ative "Modo do desenvolvedor" e "Carregar sem compactacao".
5. Confirme que a versao mostrada e 1.1.0.

## Licenca

MIT License.
