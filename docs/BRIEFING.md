# BRIEFING — Atlas 2 (para continuar no Claude Code)

> Cole este arquivo no início da sessão do Claude Code (ou salve como `docs/BRIEFING.md` no repositório) e peça: "leia o briefing e continue pelo item X da seção 9".
> Idioma de trabalho com o Felipe: **português do Brasil** (resumos e status em pt-BR; código, commits e nomes técnicos podem ficar em inglês/pt como já estão no repo).
> Estado em **07/10/2026**: Fases 0–5 concluídas e entregues; último commit `1d20fdd` (local, sem remoto).

---

## 1. Objetivo do projeto

**Atlas 2** = biblioteca pessoal e **permanente**, **100% offline**, de componentes de UI (React + Tailwind + Motion) entregue como **um único `atlas.html`** que abre com duplo clique via `file://`: sem servidor, sem CDN, sem requisições externas.

Requisitos do dono (Felipe):
- O código-fonte é **real e original** de cada biblioteca (nada reescrito), organizado e navegável; "nada pode ficar de fora".
- A página tem busca, ⌘K, favoritos, e por componente: **Preview / Código / Licença**.
- Perfis de saída:
  - **full** (= "pessoal"): tudo, inclusive React Bits e Animate UI (MIT + Commons Clause → **somente uso pessoal**).
  - **compartilhavel**: só licenças permissivas (MIT/Apache-2.0) — pode ser redistribuído.
  - **lite**: sem WebGL/3D, sem componentes que exigem rede/props/arquivos; imagens recomprimidas (400 px).
- Planejado, **não feito**: **Atlas On** (componentes que precisam de servidor/CDN/API) e **Atlas Low** (bibliotecas HTML/CSS: Preline, Flowbite, HyperUI, TW Elements, Material Tailwind, daisyUI, TailGrids, Uiverse).

---

## 2. Histórico (o que foi feito, em ordem)

| Fase | Entrega |
|---|---|
| 0 | Pipeline do Atlas 1 persistido em git (`legacy/atlas1`). |
| 1 | Esqueleto: `sources.lock.json` + `scripts/sync.mjs` (clone em commit fixo + auditoria de licença), schema, adapters, build unificado, QA em Chromium. Animata (200) + Magic UI (170). |
| 2 | Cult UI, Kokonut UI, Motion Primitives, Fancy, Animate UI, SmoothUI, React Bits (total 1.377). |
| 3 | Eldora UI, UI TripleD, Kibo UI, ReUI, Spectrum UI, lucide-animated, itshover, Motiq. |
| 4 | Perfis full/lite/compartilhavel + **carregamento por biblioteca** (bundle gzip+base64 por lib dentro do HTML, executado sob demanda; abertura ≈ 0,5 s). |
| 5 | **Systaliko UI, Bundui, ThreeUI Community** + **portais/overlays por lib** + **auto-layout do palco** + QA final completo. Entrega para Windows (zips). |

Entregas anteriores: `/home/claude/entrega3` (Fases 3+4, commit `6eb87bc`); atual: `entrega5` (Windows).

### Números finais (build de 07/10/2026)

| Perfil | Componentes | Tamanho |
|---|---|---|
| full | **5.369** (20 libs) | ≈ 95 MB |
| compartilhavel | 4.997 | ≈ 74 MB |
| lite | 5.001 (sem ThreeUI) | ≈ 46 MB |

Componentes por biblioteca (full; antes das exclusões finais): animata 200 · animateui 159 · bundui 63 · cultui 137 · eldoraui 107 · fancy 99 · itshover 185 · kibo 1.269 · kokonutui 46 · lucideanimated 467 · magicui 170 · motionprimitives 94 · motiq 145 · reactbits 213 · reui 1.174 · smoothui 259 · spectrumui 136 · systaliko 88 · threeui 167 · uitripled 192 (−1 excluído).

Flags no catálogo final: `needs-network` 122 · `needs-props` 49 (40 Spectrum UI + 9 adicionados) · `needs-files` 5.

QA final do full: **5.369 testados, 0 problemas reais** (1 aviso benigno: `threeui:sylva-living-world/living-green` pede fonte relativa que não existe no repo upstream).

---

## 3. Arquitetura (decisões que NÃO devem ser desfeitas sem pensar)

- **Repo**: `/home/claude/atlas` (no Windows: onde extrair `atlas-repo.zip` → pasta `atlas/`). `vendor/` é **verbatim** (gerado por `scripts/sync.mjs`; **nunca editar à mão**: usar `patches/<id>.json`). `vendor/`, `out/` e `cache/images.json` **não** vão para o Git.
- **Build** (`build/build.mjs`): esbuild. Um **shell** (vitrine, ≈2 MB) + **um bundle IIFE por biblioteca**. `react`/`react-dom` são compartilhados via `window.__SH` / `window.__SH_DOM(lib)` (plugin `sharedReact`). Cada lib: JS/CSS/código-fonte em **gzip+base64** dentro de `<script type="text/plain" id="z:js|css|src:<id>">`, carregados por `loadLib()` (DecompressionStream → exige navegador moderno) com `React.lazy` + Suspense por entrada. Metadados do catálogo em `src/gen/catalog.gen.json`. `window.__ATLAS_REG[id] = { uid: () => import(...) }`.
- **CSS isolado por lib** (`build/css.mjs`): 1 compile Tailwind v4 por lib (sem preflight; preflight único no shell) + PostCSS `:where(.lib-<id>)`, mapeamento de `.dark`, **renomeio de keyframes conflitantes**. `url()` relativos (fontes/imagens) viram data-URL — **agora também nos CSS extras** (`inlineUrls` aplicado a todos).
- **Palco**: classes `lib-<id>` + `dark|light` (a **raiz da página NUNCA tem classe `dark`**). `lock.wrapClass` (ex.: ReUI precisa de ancestral `style-vega`). Layouts: `centered` (padrão), `fill`, `fullscreen`, `frame` (palco 460 px, interno `h-full w-full`).
- **Auto-layout (novo, Fase 5)** em `src/shell/stage.tsx` (`StageBody`): se o wrapper colapsa para largura 0 → `fill` (com `max-w-2xl`); se altura 0 → `frame`. Verificações em 350/1200/3500 ms. `entry.noAutoFill` desliga. Recuperou ~150 demos invisíveis (Kibo progress/aspect-ratio/slider, ReUI, Fancy, parte de Magic UI/Animata).
- **Portais/overlays**: `src/shell/main.tsx` cria `[data-atlas-portal]` (fixed, z-index alto) com nós por lib `.lib-<id> dark|light` (display:contents) (+ div `wrap` quando a lib tem `wrapClass`); `react-dom` por lib é `__SH_DOM(lib)` que redireciona `createPortal`. Tema do portal = último palco interagido (`track` em pointerdown/keydown/focusin). Verificado com cliques reais em ReUI, Kibo, Cult UI, UITripled (alguns, como animated-dialog, renderizam inline no palco — ok).
- **Imagens**: URLs remotas encontradas no build são baixadas 1× → `cache/images.json` (60 MB, **fora do Git**), otimizadas com sharp; dinâmicas via `cache/learned.json` + shim `N()` + tabela esparsa `__I` por lib e `window.__RES`. **Hosts mortos** (`bundui-images.netlify.app`) → placeholders SVG determinísticos (`build/images.mjs`, regex `DEAD`).
- **Aliases de pacote por lib** (`build/plugins.mjs`): `lock.aliases` (`@/…`), `aliasFind`, `stubs`, `viteAssets`, `globals` (`@atlas/…` relativo à raiz do repo), `pkgAlias` (ex.: Kibo usa `@tanstack/react-table` v8; ReUI v9; `react-resizable-panels` v2 em 5 libs), `@faker-js/faker` → `stubs/faker.ts` (corrige `faker.date.between` com intervalo invertido), `shiki` → `stubs/shiki.ts`, Vite `?raw` (namespace `raw`), `new URL("./x", import.meta.url)` → data-URL (novo), `three128`/`three165` = aliases npm (`npm:three@0.128.0` / `0.165.0`).
- **Adapters**: genérico `adapters/demos.mjs` (dir, category por keywords|subdir|literal, depth, prefix, allowIndex, strip, wide, layout) e adaptadores próprios. **Adaptador `custom`** (`export const custom = true`) escreve ele mesmo `src/gen/<id>.meta.json` e `src/gen/<id>.lib.tsx` (usado por ThreeUI). Ajustes finos: `adapters/overrides.json` (por uid: `flags`, `exclude`, `props`, `layout`, `category`, `wide`) e `adapters/flags.auto.json` (aprendido pelo QA).
- **Flags**: `needs-network` (selo ON; offline mostra aviso), `needs-props` (placeholder: peça de biblioteca sem demo), `needs-files` (página HTML completa com arquivos próprios). **lite** descarta qualquer um desses + arquivos que casem `GL_RE` (three/ogl/@react-three/.glb/.hdr) + **ThreeUI inteiro**; libs sem nenhum componente no perfil nem entram no bundle.
- **Licenças**: aba "Licença" por componente; Apache-2.0 (Spectrum UI, itshover) mostra aviso; React Bits e Animate UI = MIT + Commons Clause → só pessoal (fora do compartilhavel). Systaliko, Bundui, ThreeUI = MIT (ThreeUI traz `ASSET-LICENSES.md`, `FONT-LICENSES.md` OFL, `THIRD_PARTY_NOTICES.md`).

---

## 4. Estrutura do repositório

```
sources.lock.json        fontes, commits fixos, licença, copy/cssSources/aliases/profile, adapter
scripts/sync.mjs         clona (commit fixo) → vendor/<id>/ + auditoria de licença   (npm run sync [-- <id>])
scripts/scan-imports.mjs lista dependências npm usadas por uma lib (para npm i)
adapters/                demos.mjs, util.mjs, <id>.mjs (próprios), threeui.mjs (custom), overrides.json, flags.auto.json
patches/<id>.json        [{file, find, replace, why}] aplicados em memória no build
stubs/                   next/*, next-themes, shiki, faker, next-auth, threeui/globals.css …
build/                   build.mjs (perfis), css.mjs, plugins.mjs, images.mjs, common.mjs, qa.mjs, montage.mjs, ui-test.mjs, portal-test.mjs
src/shell/               vitrine (main, app, catalog, stage, detail, ctx)
src/gen/                 gerado (catalog.gen.json, <id>.meta.json/.lib.tsx/.gen.tsx)
cache/                   images.json (NÃO versionado), learned.json (versionado)
docs/ADR-001.md          decisões e fases;  README.md;  CLAUDE.md (regras curtas para o Claude Code)
legacy/atlas1/           pipeline do Atlas 1
```

Fontes (ids do lock): animata, magicui, cultui, kokonutui, motionprimitives, fancy, animateui, smoothui, reactbits, eldoraui, uitripled, kibo, reui, spectrumui, lucideanimated, itshover, motiq, systaliko, bundui, threeui.

---

## 5. Como retomar (setup)

```bash
# 1) extrair atlas-repo.zip → pasta atlas/
# 2) restaurar o cache de imagens (opcional mas recomendado): juntar cache-images.json.part01..03 (JUNTAR-ATLAS.bat cria images.json.restaurado)
#    → copiar para atlas/cache/images.json
npm install --legacy-peer-deps      # os aliases three128/three165 deram ERESOLVE sem a flag (conferir no seu ambiente)
npm run sync                        # baixa vendor/<lib> nos commits fixos (precisa de internet/GitHub)
npm run build                       # → out/atlas-full.html
node build/build.mjs --profile=lite --out=out/atlas-lite.html
npm run build:compartilhavel        # → out/atlas-compartilhavel.html
```

Comandos úteis:
- Build parcial: `node build/build.mjs --libs=threeui --out=out/dev.html` (`--profile=full|lite|compartilhavel`).
- QA: `node build/qa.mjs <html> [--libs=a,b] [--only=substr] [--uids=arquivo.json] [--shots] [--learn] [--tag=nome] [--webgl]` → `out/qa/report-<tag>.json`. Chromium headless via `file://`, locale en-US, espera `__atlasPending == 0`; coleta `iw/ih` (tamanho do 1º filho — útil para achar colapsos), erros, requisições externas. `--learn` grava URLs de imagem dinâmicas e marca `needs-network`.
- Capturas: `node build/montage.mjs <prefixo> <colunas> <linhas>` → `out/qa/sheets/`.
- `node build/ui-test.mjs <html>` (smoke da interface) e `node build/portal-test.mjs <html> <uids.json> <outdir>` (clique real no primeiro gatilho; **atenção**: o teste de portais é frágil — tooltips/hover não abrem por clique e ele já travou em `kibo:dialog-stack-controlled`; o resultado "content:false" nem sempre é bug).
- **Atenção ambiente**: `build/qa.mjs`, `ui-test` e `portal-test` usam `/opt/pw-browsers/chromium_headless_shell*/…` (Linux). No Windows é preciso ajustar o caminho do Chromium (ou usar `playwright install chromium`).

### Armadilhas conhecidas (do ambiente anterior)
- Nunca rodar `pkill -f <nome-do-script>` no mesmo comando que contém o nome (mata o próprio shell); use padrão `[b]uild/qa.mjs` em chamada separada.
- `rm -rf $VAR` era bloqueado no sandbox (usar `mv`).
- Só 2 CPUs: no máximo 2 shards de QA em paralelo; **a saída do QA só aparece no fim** (≈45–90 min para as 5.369); sem `--shots` não há como estimar progresso.
- Limite de envio de arquivo no chat: 30 MiB (por isso os `.part` zipados).

---

## 6. Convenções

- Commits com trailers:
  ```
  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NUcro77DfX4DNEVH3H1qhu
  ```
  (corpo de PR: "🤖 Generated with [Claude Code](https://claude.com/claude-code)" + URL da sessão). Siga as regras do `CLAUDE.md` do repo, que prevalecem.
- Mudou CSS/keyframes? Veja os conflitos impressos pelo build ("keyframes renomeados").
- Estado compartilhado shell↔lib (ex.: `StageThemeCtx`) tem de viver em `window` (ver `src/shell/ctx.tsx`).
- Preferências do Felipe: status e resumos em pt-BR, diretos; entrega final com arquivos prontos para Windows.

---

## 7. Fase 5 — detalhes técnicos que vale lembrar

- **ThreeUI** (`adapters/threeui.mjs`, custom): catálogo = lista `READY_SHADERS` em `src/data/shaders.tsx` (renderers + variantes), sem arquivos de demo. O adaptador empacota esse arquivo em Node com stubs (react.lazy falso; `../shaders/*` como Proxy que captura o caminho do arquivo) para ler metadados; cada entrada carrega via `W(id)` = componente-função que renderiza `BY[id].component` (**não** retornar o objeto lazy direto: erro React #306). 167 entradas; as que são "Full HTML" (iframe `srcDoc` com `?raw` de HTML) são `needs-files`; as que puxam Tailwind Play/iconify/Google Fonts/three via CDN foram marcadas `needs-network` pelo `--learn` (57 no total). `sketchbook` embute `public/sketchbook/*` (copiado pelo `lock.copy`, patch em `patches/threeui.json` com mapa asset→data-URL + fontes woff2). `globals`: `stubs/threeui/globals.css`.
- **Systaliko / Bundui**: patches removem imports/@source do fumadocs em `app/globals.css`. Vídeos (Pexels) e API (jsonplaceholder) → `needs-network`.
- Overrides adicionados no fim: `needs-network` em `eldoraui:cobe-globe-demo`, `kibo:snippet-npm`, `magicui:android-demo`, `threeui:matrix-field/atmospheric-blade`, `kibo:reel-images`, `eldoraui:map-demo`; `needs-props` em 5 do Spectrum UI (`scratch-card`, `swipe-to-delete`, `tilt-card`, `skeleton-reveal`, `text-states`) e 4 do Eldora (`header-02/components/plus-grid`, `pricing-02/components/{text,container}`, `testimonal-01/components/carousel`); `exclude` em `uitripled:native/native-magnetic-shadcnui`.
- Erros resolvidos pelo caminho (úteis se reaparecerem): tanstack v8×v9 → `pkgAlias`; resizable-panels v4×API antiga → alias v2; `faker.date.between` no escopo do módulo → stub; ReUI `./__lucide__` → patch do loader de ícones + `wrapClass style-vega`; Motiq sem tokens/largura → copiar `packages/tokens/styles.css` + layout fill/frame; Kibo shiki tema/logo.dev → stub/patch.

---

## 8. Entregas geradas (para referência)

`/home/claude/entrega5` (já baixada pelo Felipe): `atlas-{full,compartilhavel,lite}.html.partNN.zip` (partes de 27 MB, cada uma num .zip), `JUNTAR-ATLAS.bat` (`copy /b` das partes), `HASHES-SHA256.txt`, `LEIA-ME.txt`, `atlas-repo.zip` (git archive com prefixo `atlas/`), `cache-images.json.part01..03.zip` (cache de imagens). Integridade verificada com `cmp`. SHA-256 (prefixo): full `dbb3c377…`, compartilhavel `83b2be1b…`, lite `776844cd…`.

---

## 9. PENDÊNCIAS (priorizadas)

### A. Escopo grande ainda não feito
1. **Atlas On** — 122 componentes `needs-network` (+5 `needs-files`) funcionam só com internet e **nunca foram renderizados com rede real** (o sandbox bloqueava CDNs). Falta: (a) validar com internet (Claude in Chrome ou Playwright com rede); (b) decidir formato (modo online no mesmo HTML vs arquivo separado); (c) opcionalmente torná-los offline: fontes (@fontsource), ícones iconify (@iconify-json/solar), `three`/`gsap` via npm são embutíveis; **Tailwind Play CDN v3** não existe no npm (opção: `@tailwindcss/browser` v4 com checagem de compatibilidade) e vídeos não cabem.
2. **Atlas Low** — não iniciado: Preline, Flowbite, HyperUI, TW Elements, Material Tailwind, daisyUI, TailGrids, Uiverse. Passos: escolher repositórios/commits, **auditar licenças** (confirmar; não assumir MIT), adaptador sem React (snippets HTML/CSS em iframe/shadow DOM com o JS próprio de Flowbite/Preline/TW Elements; daisyUI como plugin Tailwind), QA, perfis. Considerar reaproveitar o shell (aba Preview/Código/Licença).
3. **allshadcn.com / shadcnregistry.com** não foram vasculhados em busca de outras bibliotecas gratuitas (só Systaliko e Bundui foram integrados).

### B. Verificação que faltou
4. Testar em **Firefox, Safari, celular/mobile** e em **PC com GPU** (WebGL/WebGPU: ThreeUI, shaders de React Bits, Ballpit, AeroShards, ShapeWaves só validados no headless sem GPU).
5. Rodar o **`JUNTAR-ATLAS.bat` e abrir o HTML no Windows real**; validar rebuild no Windows (caminho do Chromium; `npm install` com aliases `three128/165`).
6. **Revisão visual ampla**: o QA automático só acha erro/branco/rede; só amostras de contact sheets foram vistas. Falta abrir `out/qa/sheets/za_3.jpg` (Kibo progress/slider/separator/skeleton após auto-layout) e reconferir: `animata:container/fibonacci-lines` (quase preto), `kokonutui:card-flip` (só uma linha), `magicui:dot-pattern-with-glow-effect`, `magicui:orbiting-circles-demo`, `cultui:family-button-demo`, `magicui:video-text-demo` (vídeo offline), `fancy:image-trail-*` (precisam de mouse).
7. O **auto-layout é heurístico**: pode deixar alguns componentes mais largos/alinhados à esquerda; revisar caso a caso e usar `layout`/`noAutoFill` em `overrides.json` onde preciso.
8. QA completo foi feito só no **full**; em lite/compartilhavel foi smoke (subconjunto de libs + ui-test). Se for publicar, rodar QA completo nos dois.

### C. Cobertura / catálogo
9. Readicionar como "sem demo" os excluídos: 15 UI TripleD, 1 Eldora (`logo-cloud-04` animated-logo-column), 1 ReUI (`stepper-7`), `uitripled:native/native-magnetic-shadcnui`.
10. 49 componentes `needs-props` (Spectrum UI/Eldora) são placeholders; criar exemplos mínimos com dados (via `props` em `overrides.json`) para virarem demos reais.

### D. Licenças e dados
11. **Perfil compartilhavel embute imagens de terceiros** (Unsplash etc.): licença não auditada — decidir se mantém, troca por placeholders ou documenta.
12. **OriginKit**: repositório nunca identificado (citado em pendências antigas).
13. Bundui: avatares/produtos/blog são **placeholders** (host original morto); 6 imagens falharam no build ("falhas 6" — identificar quais). ThreeUI: `living-green` sem fonte/imagens upstream (aviso benigno no QA); 182 thumbnails do threeui.com dão 403 (não são usados nos componentes).

### E. Infra / publicação
14. Commit `1d20fdd` **sem remoto**: criar repositório vazio no GitHub (ex.: `atlas-ui`) e dar push (o Felipe cria o repo; o Claude faz o push).
15. **Backup do `cache/images.json`** (60 MB, não está no Git; sem ele o rebuild depende de URLs externas que podem sumir).
16. `package.json` ganhou `three128`/`three165` (aliases npm) — conferir `package-lock.json` num install limpo.

---

## 10. Sugestão de próximos passos

1. Subir o repo para o GitHub e confirmar o rebuild limpo (sync → build → QA parcial) no ambiente do Felipe.
2. **Atlas On**: validar online os 122 flagged (Playwright com rede/Claude in Chrome), listar dependências por tipo e decidir quais viram offline.
3. **Atlas Low**: auditoria de licenças + prova de conceito com uma lib (ex.: HyperUI, a mais simples) para definir o adaptador de snippets HTML.
4. Revisão visual dirigida (item 6) + readicionar excluídos (item 9).


---

## Atualização 08/10/2026 (pós Fase 5)

- Repo no GitHub (privado): FelipeCJBoB/atlas-ui. Build no Windows funcional (sync com `core.autocrlf=false`; CLI do Tailwind v4 chamado pelo caminho porque `tailwindcss3` colide no bin; QA acha Chrome/Edge via `build/browser.mjs`).
- **Atlas On**: `docs/ATLAS-ON.md` (123 `needs-network` classificados com internet real). 51 componentes ThreeUI ficaram offline (`build/offline-html.mjs`: Tailwind v3 compilado, Iconify, GSAP/three, fontes e imagens embutidos). Seguem online: vídeo, APIs ao vivo, fontes escolhidas em runtime (React Bits), `flux-vortex`.
- **Atlas Low**: `docs/ATLAS-LOW.md` + `docs/ATLAS-LOW-LICENCAS.md`. Integradas HyperUI (306), Uiverse (3.802), daisyUI (588), Flowbite (628), Material Tailwind v2 (306). Fora: Preline, TW Elements, TailGrids (licença/snippets).
- Totais: full 10.999 · compartilhavel 10.627 · lite 10.603 componentes.
- Pendências: revisão visual ampla das fontes novas; licença das fotos de terceiros embutidas; Chart.js/scripts em HTML (flag needs-network); Uiverse/MT sem tema escuro.
