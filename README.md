# Atlas — biblioteca curada de componentes UI para IA

2.901 componentes React + Tailwind + Motion e HTML/CSS, escolhidos por serem difíceis de fazer sem referência (efeitos, animações, 3D/WebGL, componentes compostos). Cada componente tem **prévia visual**, licença e dependências. O repositório é **autocontido**: código, licenças, catálogo, prévias e imagens estão aqui; nada depende de repositórios de terceiros.

- **Para IA:** leia [`AGENTS.md`](AGENTS.md) (ou [`llms.txt`](llms.txt)). Catálogo em [`catalogo/`](catalogo/README.md), prévias em `previews/`.
- **Vitrine para humanos:** `npm install && npm run build` → `out/atlas-full.html` (um arquivo, offline, duplo clique).

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `catalogo/` | `catalog.jsonl`, páginas por função com miniaturas, folhas de prévias, `libs.md` |
| `previews/` | prévia de cada componente (estado normal \| com o cursor em cima) |
| `vendor/<lib>/` | cópia versionada (podada) do código de cada biblioteca + `LICENSE` |
| `vendor/atlas/` | 55 componentes de **autoria própria**, reescritos em sala limpa ([`reescrita/`](reescrita/CONVENCOES.md)) |
| `scripts/` | `atlas-find.mjs` (busca/ver/código), `make-index.mjs`, `curadoria.mjs`, `triagem.mjs` |
| `build/` | vitrine (`build.mjs`), QA/capturas (`qa.mjs`), prévias (`previas.mjs`) |
| `curadoria/` | por que cada componente entrou ou saiu |
| `cache/images.json` | imagens dos exemplos, embutidas (o build não usa rede) |

## Comandos
```bash
npm run build                                   # vitrine completa → out/atlas-full.html (+ out/catalog.full.json)
npm run build:lite                              # sem WebGL/3D/rede → out/atlas-lite.html
node build/qa.mjs out/atlas-full.html --shots --frames=1 --webgl   # capturas (para as prévias)
npm run previas && npm run index                # previews/ + catalogo/
node scripts/atlas-find.mjs find "fundo animado" --fn="Fundo & Efeito"
```

## Licenças
- `vendor/atlas/`: Copyright (c) 2026 Atlas — todos os direitos reservados.
- Demais bibliotecas: MIT ou Apache-2.0 (texto em `vendor/<lib>/LICENSE`; origem e commit em `sources.lock.json`). Ao copiar um componente, mantenha o aviso de copyright da biblioteca.
- React Bits e Animate UI (MIT + Commons Clause) **não** fazem parte do repositório; parte deles foi reescrita em sala limpa e o restante segue pendente ([`reescrita/lote.json`](reescrita/lote.json)).

Decisões de arquitetura: [`docs/ADR-001.md`](docs/ADR-001.md).
