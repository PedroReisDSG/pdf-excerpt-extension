# PDF Excerpt Extractor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Extensao para Microsoft Edge e Firefox que permite visualizar PDFs com PDF.js, capturar selecoes de texto e gerar um novo PDF com os trechos destacados para fichamento academico e revisao bibliografica.

## Funcionalidades

- Visualizador de PDF baseado em PDF.js (Mozilla)
- Captura automatica de selecoes de texto
- Armazenamento de excertos com numero da pagina
- Exportacao para PDF formatado com metadados
- Exportacao para TXT
- Interface moderna e responsiva
- Suporte para Edge e Firefox (Manifest V3)

## Estrutura do Projeto

```
pdf-excerpt-extension/
├── manifest.json          # Configuracao da extensao
├── background.js          # Service worker
├── content.js             # Content script
├── viewer/
│   ├── viewer.html       # Interface do visualizador
│   ├── viewer.css        # Estilos
│   └── viewer.js         # Logica principal
├── libs/
│   ├── pdf.min.js        # PDF.js (biblioteca Mozilla)
│   ├── pdf.worker.min.js # Worker do PDF.js
│   └── pdf-lib.min.js    # pdf-lib para geracao de PDF
└── icons/
    └── icon-48.png       # Icone da extensao
```

## Pre-requisitos

### Bibliotecas Necessarias

Voce vai precisar baixar as seguintes bibliotecas:

1. **PDF.js** - https://github.com/mozilla/pdf.js
   - Baixe a versao mais recente do repositorio
   - Extraia os arquivos `pdf.min.js` e `pdf.worker.min.js` da pasta `build/generic/build/`
   - Coloque em `libs/`

2. **pdf-lib** - https://pdf-lib.js.org/
   - Instale via npm: `npm install pdf-lib`
   - Ou baixe o arquivo minificado: https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js
   - Coloque em `libs/`

### Instalacao Automatica

```bash
python setup.py
```

## Instalacao

### Microsoft Edge

1. Abra o Edge e va para `edge://extensions/`
2. Ative o **Modo do desenvolvedor**
3. Clique em **Carregar sem compactacao**
4. Selecione a pasta `pdf-excerpt-extension`
5. A extensao sera instalada

### Firefox

1. Abra o Firefox e va para `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar temporariamente como complemento**
3. Selecione o arquivo `manifest.json` da pasta
4. A extensao sera carregada (temporariamente)

**Para instalacao permanente no Firefox:**
- Voce precisa assinar a extensao via [Firefox Add-ons Developer Hub](https://addons.mozilla.org/pt-BR/developers/)
- Ou use Firefox Developer Edition com `xpinstall.signatures.required` definido como `false`

## Como Usar

### Uso Basico

1. **Navegue ate um PDF** - A extensao detectara automaticamente e abrira no visualizador proprio

2. **Ative o modo de selecao** - Clique no botao "Selecionar" na barra de ferramentas

3. **Selecione texto** - Clique em qualquer parte do PDF para capturar o texto da pagina atual

4. **Gerencie excertos** - Os excertos apareceram na sidebar a esquerda
   - Visualize excertos completos
   - Remova excertos indesejados
   - Limpe todos os excertos

5. **Exporte** - Clique em "Exportar PDF" ou "Exportar como TXT"

### Atalhos de Teclado

- **Setas Esquerda/Direita** - Navegar entre paginas
- **Enter** (no campo de pagina) - Ir para pagina especifica

## Personalizacao para Fichamento Academico

O PDF exportado inclui:

- Cabecalho com nome do arquivo original
- Numero total de excertos
- Data e hora da geracao
- Cada excerto com:
  - Numero sequencial
  - Numero da pagina original
  - Texto completo do excerto

### Sugestoes de Melhoria

Para uso academico avancado, voce pode:

1. **Adicionar citacoes ABNT** - Modifique `exportToPdf()` para incluir autor, ano, etc.
2. **Tags e categorias** - Adicione campos para classificar excertos por tema
3. **Notas pessoais** - Permita adicionar anotacoes a cada excerto
4. **Busca em excertos** - Implemente filtro na sidebar
5. **Exportacao para Zotero/Mendeley** - Gere arquivos .bib ou .ris

## Melhorias Futuras

- Hit-testing preciso para selecao de texto especifica
- Destaque visual no PDF (highlight)
- Busca de texto no PDF
- Zoom in/out
- Rotacao de pagina
- Suporte a formularios PDF
- Sincronizacao entre dispositivos
- Exportacao para formatos adicionais (DOCX, RTF)

## Solucao de Problemas

### A extensao nao detecta PDFs

- Verifique se o content script esta carregado (F12 > Console)
- Teste com um PDF local: `file:///caminho/para/arquivo.pdf`

### Erro ao carregar bibliotecas

- Verifique se os arquivos em `libs/` existem
- Confira os caminhos no `viewer.html`
- Use o console do navegador para ver erros especificos

### PDF.js worker nao carrega

- O caminho para `pdf.worker.min.js` deve estar correto
- Verifique a configuracao em `viewer.js`: `pdfjsLib.GlobalWorkerOptions.workerSrc`

## Referencias

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [MDN Web Extensions](https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions)
- [Your First WebExtension](https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)
- [Your Second WebExtension](https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension)

## Licenca

MIT License - Use livremente para seus projetos academicos e pessoais.

## Autor

Desenvolvido para fichamento academico e revisao bibliografica.

---

**Dica para pesquisadores:** Esta extensao e ideal para organizar referencias bibliograficas durante a escrita de teses e dissertacoes. Combine com ferramentas como Zotero ou Mendeley para um fluxo de trabalho completo.
