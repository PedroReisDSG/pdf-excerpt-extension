# PDF Excerpt Extractor (v1.0.1)

Extensao para Microsoft Edge e Firefox que permite visualizar PDFs online com PDF.js,
capturar selecoes de texto e gerar um novo PDF com os trechos destacados para
fichamento academico e revisao bibliografica.

## Historico de correcoes

### v1.0.1
Corrigido bug em que PDFs locais (file://) eram redirecionados para o viewer da
extensao mesmo apos o content.js ja ignora-los. A causa raiz era o background.js:
ele redirecionava PDFs via chrome.webNavigation.onCompleted de forma independente
do content.js, sem checar se a URL era local. Agora background.js so redireciona
URLs http/https (funcao isRemotePDFUrl).

### v1.0.0
Versao inicial.

## Comportamento esperado

- PDF **online** (http/https): abre no visualizador da extensao (PDF.js + captura de excertos).
- PDF **local** (file://): abre no visualizador nativo do proprio navegador. A extensao
  nao interfere.

## Instalacao

1. Clone ou baixe este repositorio.
2. Rode `python setup.py` para baixar pdf.js e pdf-lib em `libs/`.
3. Converta `icons/icon.svg` para `icons/icon-48.png` (48x48).
4. Em `edge://extensions/`, ative "Modo do desenvolvedor" e clique em
   "Carregar sem compactacao", selecionando esta pasta.
5. Confirme que a versao mostrada no card da extensao e 1.0.1.

## Como confirmar que a correcao esta ativa

Abra o DevTools (F12) do Service Worker da extensao (em edge://extensions/, clique
em "Inspecionar visualizacoes: service worker"). Ao abrir um PDF local, deve aparecer:

```
[PDF Excerpt] PDF local detectado (onCompleted). Mantendo visualizador nativo do navegador: file:///...
```

Se em vez disso aparecer um redirecionamento para viewer.html?pdf=file://, a extensao
ainda esta rodando uma versao antiga - recarregue-a em edge://extensions/.

## Licenca

MIT License.
