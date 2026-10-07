# Atlas 2 — biblioteca pessoal de componentes UI (offline)

Um único `atlas.html` (duplo clique, `file://`, sem servidor, sem CDN) com os componentes **reais** de várias
bibliotecas React + Tailwind + Motion: busca, ⌘K, favoritos, Preview / Código / Licença.

Decisões de arquitetura: [`docs/ADR-001.md`](docs/ADR-001.md).

## Uso

> `vendor/` e `cache/images.json` não vão para o Git: são regenerados (`npm run sync` baixa o código original no commit fixo; o `build` baixa/embute as imagens).

```bash
npm install
npm run sync                 # clona (commit fixo) → vendor/<lib>/ + auditoria de licença
npm run build                # → out/atlas-full.html          (tudo, uso pessoal)
node build/build.mjs --profile=lite            # → out/atlas-lite.html  (sem WebGL/3D/rede, imagens menores)
npm run build:compartilhavel # → out/atlas-compartilhavel.html (só licenças permissivas)
npm run qa                   # Chromium headless via file://: erros, requisições externas, capturas
node build/qa.mjs --learn    # + aprende URLs de imagem dinâmicas e marca componentes `needs-network`
```

## Como funciona

| Peça | Arquivo |
|---|---|
| Fontes e commits fixos | `sources.lock.json` |
| Sync + licença | `scripts/sync.mjs` → `vendor/<id>/` (verbatim, intocado) |
| Correções (find/replace) | `patches/<id>.json` — aplicadas em memória no build |
| Catálogo por lib | `adapters/<id>.mjs` → `src/gen/<id>.gen.tsx` (+ `meta.json`) |
| CSS isolado por lib | `build/css.mjs`: 1 compile Tailwind/lib (sem preflight) + PostCSS `.lib-<id>` + keyframes conflitantes renomeados |
| `@/` por lib | `build/plugins.mjs` (resolve pela pasta do importador) |
| Imagens | remotas baixadas 1x → `cache/images.json`; dinâmicas via `cache/learned.json` + shim |
| Stubs Next | `stubs/` (`next/image`, `next/link`, `next/font`, `next-themes`, `shiki`…) |
| Vitrine | `src/shell/` |
| Carregamento sob demanda | `build/build.mjs`: shell (≈2 MB) + 1 bundle JS/CSS/código **gzip+base64 por biblioteca** em `<script type="text/plain" id="z:js:<lib>">`; executa só quando um componente da lib aparece. React é compartilhado via `window.__SH`. |

## Adicionar uma biblioteca
1. Entrada em `sources.lock.json` (repo, commit, licença, `copy`, `cssSources`, `profile`).
2. `npm run sync -- <id>`; `node scripts/scan-imports.mjs <id>` → `npm i` das dependências.
3. `adapters/<id>.mjs` (`generate()` escreve `src/gen/<id>.{gen.tsx,meta.json}`).
4. `npm run build`; ajustar com `patches/<id>.json` / `adapters/overrides.json`; `npm run qa -- --libs=<id> --learn`.

## Licenças
Cada biblioteca mantém sua licença em `vendor/<id>/LICENSE` e aparece na aba **Licença** de cada componente.
Perfil `compartilhavel` inclui só bibliotecas marcadas `"compartilhavel"` em `sources.lock.json` (MIT puro).
React Bits e Animate UI (MIT + Commons Clause) são **somente uso pessoal**.

## Estado
- Fase 1: Animata (200) + Magic UI (170) ✔
- Fase 2: Cult UI, Kokonut UI, Motion Primitives, Fancy, Animate UI, SmoothUI, React Bits ✔
- Fase 3: Eldora UI (108), UI TripleD (211), Kibo UI (1269), ReUI (1175), Spectrum UI (136), lucide-animated (467), itshover (185), Motiq (145) ✔ (Apache-2.0: Spectrum UI e itshover — aviso na aba Licença)
- Fase 4: perfis **full** (5369 componentes · 20 bibliotecas), **lite** (5001; sem ThreeUI, sem WebGL/3D/rede, imagens 400 px) e **compartilhavel** (4997, sem React Bits/Animate UI); abertura ≈0,5 s graças ao carregamento por biblioteca
- Pacotes com versões diferentes por lib: `lock.pkgAlias` (Kibo usa `@tanstack/react-table` v8; ReUI v9; `react-resizable-panels` v2 nas libs com API antiga); `stubs/faker.ts` corrige `faker.date.between` com intervalo invertido
- Fase 5: **Systaliko UI** (88), **Bundui** (63, imagens do host morto `bundui-images.netlify.app` viram placeholders SVG) e **ThreeUI Community** (167: renderers WebGL/Three + páginas HTML em iframe; `three128`/`three165` via alias npm, `new URL(…, import.meta.url)` e `/public/sketchbook` embutidos; adaptador `custom` em `adapters/threeui.mjs`) ✔ — todos MIT (perfil compartilhavel inclui; fontes OFL do ThreeUI em `FONT-LICENSES.md`)
- Palco com **auto-layout**: se o componente colapsa para largura 0 (filhos `w-full`/`absolute`) o palco passa a `fill`; se a altura colapsa (`h-full`), a `frame` — recuperou ~150 demos que ficavam invisíveis (Kibo, ReUI, Fancy…)
- Overlays/portais (Dialog, Popover, Select, Tooltip, Sheet…): raiz `[data-atlas-portal]` com tema/escopo `lib-<id>` do último palco interagido; testado com cliques reais (`build/portal-test.mjs`)
- Componentes com `needs-network` (vídeo, CDN de fontes/decoders, APIs) ficam sinalizados → **Atlas On**
- Shaders WebGPU (AeroShards, ShapeWaves) e `Ballpit` só foram verificados até onde o GPU simulado do QA permite
- Próximas: Atlas On, Atlas Low
