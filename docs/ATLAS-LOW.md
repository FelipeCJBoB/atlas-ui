# Atlas Low — estado final (08/10/2026)

Bibliotecas HTML/CSS (sem React) integradas ao mesmo `atlas-*.html`. Base: `docs/ATLAS-LOW-LICENCAS.md` (auditoria de licenças feita em 07/10/2026).

## Integradas (5 fontes, 5.526 componentes)

| Fonte | Componentes | Commit | Como renderiza | Código mostrado |
|---|---|---|---|---|
| HyperUI | 306 | `2b5aebb` | markup do `<body>` direto no palco `.lib-hyperui` (Tailwind v4 do pipeline); variante `-dark` quando o tema do palco é dark | conteúdo do `.html` original (claro e dark) |
| Uiverse (Galaxy) | 3.802 | `adbd2ad` | **Shadow DOM** por item (CSS puro no próprio shadow root; 440 itens Tailwind v3 usam uma folha compartilhada via `adoptedStyleSheets`) | arquivo original inteiro |
| daisyUI | 588 | `9adbeaa` | plugin npm `daisyui@5.7.47` (mesma versão) em Tailwind v4; `data-theme` = tema do palco | bloco ```` ```html ```` da doc sem o marcador `$$` |
| Flowbite | 628 | `232ebdb` | tema/plugin `flowbite@4.0.2` em Tailwind v4 + `initFlowbite()` após montar | HTML verbatim dos `{{< example >}}` |
| Material Tailwind (HTML v2) | 306 | `1a343ad` | **iframe srcdoc** (Tailwind v3 + `withMT` compilado no build; script oficial empacotado em IIFE) | bloco ```` ```html ```` dos `<CodePreview>` |

Adaptadores: `adapters/{hyperui,uiverse,daisyui,flowbite,materialtailwind}.mjs` (todos `custom`; escrevem `src/gen/<id>.meta.json` e `<id>.lib.tsx`).
Trechos extraídos de Markdown/MDX ficam em `src/gen/snips/<id>/` (gerado, fora do Git); o vendor segue intocado. A aba Código aceita arquivos `@gen/…`.

### Decisões e substituições (fidelidade ao original)
- **Flowbite**: 17 exemplos traziam shortcodes Hugo (`{{< param homepage >}}`, `{{< ref … >}}`) que não são HTML; substituídos por `https://flowbite.com` / `#` (lista em `src/gen/flowbite.shortcodes.txt`). Imagens do site (`/docs/images/…`) embutidas a partir de `static/images` (`lock.rootAssets`).
- **Uiverse**: seletores `:root`/`html`/`body` dentro do `<style>` viram o contêiner `.__u` no preview (o shadow root não tem documento); o contêiner centraliza o item como o preview do site. O código exibido não é alterado.
- **daisyUI**: o repo não comita o CSS compilado; usa-se o pacote npm da mesma versão (5.7.47).
- **Material Tailwind**: só a v2 (`main`); a branch `v3` é beta parado. Fundo branco fixo (a v2 não tem tema escuro).
- Imagens remotas (Unsplash, `img.daisyui.com`, `flowbite.s3…`) são baixadas 1× e embutidas (cache de imagens). **A licença dessas fotos não foi auditada** (pendência 11 do BRIEFING, vale também no perfil `compartilhavel`).
- Componentes com `<script src=https…>` (Chart.js etc.) ficam `needs-network` (os scripts do HTML não são executados nas fontes sem iframe); vídeos locais do site ficam `needs-files`.

## Não integradas (decisão e motivo)
| Fonte | Motivo |
|---|---|
| **Preline** | Licença dupla (MIT + “Preline UI Fair Use License”, proíbe produto concorrente/redistribuição na forma original) e o repo só traz 5 templates; os blocos “gratuitos” só existem no site e raspar o site não foi autorizado/verificado. |
| **TW Elements** | `LICENSE` diz MIT mas o `package.json` aponta para um arquivo inexistente e o EULA do site restringe; o repo não traz os snippets (só o JS da versão gratuita). |
| **TailGrids** | O repo atual é React/TSX (sem HTML) e o contrato do site diz “NOT ALLOWED to resell, redistribute”, contradizendo o MIT do repo. |

Se quiser incluir Preline/TW Elements apenas no perfil pessoal, é preciso decidir como obter os snippets (captura manual dos que o site publica gratuitamente) e aceitar a ambiguidade de licença.

## Perfis
- `full` e `compartilhavel`: as 5 fontes (todas MIT; ver ressalva das imagens).
- `lite`: os componentes `needs-network`/`needs-files` caem; o resto entra.
