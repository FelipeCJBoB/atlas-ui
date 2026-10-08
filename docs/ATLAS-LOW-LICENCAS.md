# ATLAS LOW — Auditoria de licenças e viabilidade das 8 fontes

> Data da auditoria: **07/10/2026**. Método: `git clone --depth 1 -c core.autocrlf=false` de cada repositório em `C:\Users\filip\AppData\Local\Temp\atlas-low-audit\<id>` (descartável, fora do repo), leitura do arquivo `LICENSE` e do `package.json`, contagem dos arquivos de snippets por script Node, e consulta (WebFetch/WebSearch) às páginas de licença dos sites quando o repositório não era suficiente.
> Escopo: **somente pesquisa**. Nada foi alterado no repo do Atlas além deste arquivo. Sem commit, sem push.
> Este documento **não é parecer jurídico**. Onde a evidência é ambígua ou não foi possível verificar, isso está escrito explicitamente (seção 4).

---

## 1. Tabela resumo

| id sugerido | Fonte | Repositório oficial | HEAD auditado (branch) | Licença do repo (arquivo) | Snippets HTML gratuitos no repo | Perfil recomendado | Tailwind exigido | JS próprio? |
|---|---|---|---|---|---|---|---|---|
| `hyperui` | HyperUI | https://github.com/markmead/hyperui | `2b5aebbc50d2c9ac89650f51b554f53895b4803c` (main, 26/09/2026) | MIT (`LICENSE`, "Copyright (c) Mark Mead") | **306** arquivos `.html` claros (163 application + 106 marketing + 37 neobrutalism) + 240 gêmeos `-dark.html` + 12 páginas de template | **compartilhavel** (com atribuição) | **v4** (CSS pré-compilado `public/component.css`, tailwindcss 4.3.3 + `@tailwindcss/forms`) | Não (só `component.js` de 910 bytes que bloqueia navegação de links no iframe; 25 snippets de gráficos usam Chart.js via CDN) |
| `uiverse` | Uiverse (Galaxy) | https://github.com/uiverse-io/galaxy | `adbd2adde0a299a3956ea288fb444ec01891ca41` (main, 02/09/2024; repo parado há ~2 anos) | MIT (`LICENSE`, "Copyright (c) 2023 Uiverse.io") | **3.802** arquivos `.html` (HTML + `<style>` CSS puro); 220 usam classes Tailwind (estilo v3) | **compartilhavel com ressalva** (autoria individual; ver seção 3.2) | Nenhum para ~94% (CSS puro); 220 snippets pedem Tailwind **v3** | Não (0 `<script>`) |
| `daisyui` | daisyUI | https://github.com/saadeghi/daisyui | `9adbeaa259816be46b98bf497a09cd2ab127e3cf` (master, 30/09/2026; tag v5.7.47) | MIT (`LICENSE` na raiz e em `packages/daisyui/`, "Copyright (c) 2020 Pouya Saadeghi") | **~590** blocos `html` em 71 páginas de doc (61 componentes CSS) | **compartilhavel** | **v4** (plugin `@plugin "daisyui"`; daisyUI 5) | Não (CSS puro; alguns exemplos usam `<details>`/radio/checkbox nativos) |
| `flowbite` | Flowbite | https://github.com/themesberg/flowbite | `232ebdb33a9e37b31b293b9988d89b862ee121e5` (main, 27/06/2026; tag v4.0.2) | MIT (`LICENSE.md`, "Copyright (c) 2023 Bergside Inc."); `package.json`: `"license": "MIT"` | **~630 a 670** exemplos `{{< example >}}` em Markdown/Hugo (`content/`) | **compartilhavel com ressalva** (docs sob CC BY 3.0 segundo o site; marca registrada) | **v4** (tokens de tema do Flowbite 4: `text-body`, `bg-neutral-secondary-medium`…) | **Sim**: `flowbite` JS (Accordion, Modal, Dropdown, Drawer, Tabs, Tooltip, Popover, Carousel, Datepicker…), via `data-*`; precisa ser compilado (não há `dist/` no repo) |
| `materialtailwind` | Material Tailwind (HTML, v2) | https://github.com/creativetimofficial/material-tailwind | `1a343ad13d3caaa29032b653ee17b7f61c14f3a6` (main, 28/04/2026) | MIT (`LICENSE.md`, "Copyright (c) 2021-2023 Material Tailwind … by Creative Tim") | **327** blocos ```` ```html ```` em 54 páginas `documentation/html/*.mdx` | **compartilhavel com ressalva** (imagens/links apontam para demos Creative Tim e Unsplash) | **v3** (`tailwindcss ^3.2.4` no pacote HTML, 3.3.6 no repo; usa plugin `withMT`/tema próprio) | **Sim** (scripts do `@material-tailwind/html`, ripple; ~40 blocos com `<script>`, 20 com `data-ripple`) |
| `preline` | Preline UI | https://github.com/htmlstreamofficial/preline (o nome antigo `htmlstreaming/preline` NÃO resolve) | `05ca59998db345cfede649b00093032409b37f25` (main, 21/08/2026; tag v5.0.0) | **Licença dupla**: "MIT" + "Preline UI Fair Use License" (`LICENSE`); `package.json`: `"Licensed under MIT and Preline UI Fair Use License"` | **Só 5 templates** de página inteira (`templates/**/index.html`, ~103 KB cada). Os "204 blocos gratuitos" citados no README **não estão no repositório** | **só uso pessoal (full)**; fora do compartilhavel | **v4** (`variants.css`, `theme.css`) | **Sim** (`preline.js`, 435 KB; plugins HS*) |
| `twelements` | TW Elements | https://github.com/mdbootstrap/TW-Elements | `9b442c410d8de1c44fbad6728668235c36c4b712` (master, 27/03/2026; tag v2.0.0) | MIT (`LICENSE`, "Copyright (c) 2024 MDBootstrap") **mas** `package.json` diz `"SEE LICENSE IN <License.txt>"` (arquivo inexistente) e o site tem EULA que proíbe redistribuir | **0** snippets no repo (só JS/CSS da versão FREE + um `index.html` de demo). Exemplos ficam só no site | **só uso pessoal / adiar** | **v3** (Tailwind 3.3; `plugin.cjs` usa `require("tailwindcss/plugin")`) | **Sim** (`tw-elements.umd.min.js`, 114 KB; Collapse, Dropdown, Modal, Carousel, Tab, Tooltip, Popover, Ripple, Input…) |
| `tailgrids` | TailGrids | https://github.com/TailGrids/tailgrids | `b54636bac9fa6ab64cf5eff388c3de07b6adc515` (main, 04/08/2026) | MIT (`LICENSE.md`, "Copyright (c) 2025 Tailgrids") **mas** o site publica um "Tailgrids License Agreement" com "NOT ALLOWED to resell, redistribute, license, or sublicense" | **0 HTML.** O repo atual é **React/TSX** (62 componentes em `apps/docs/src/registry/core`), com `react-aria-components` | **excluir do Atlas Low** (não é HTML). Se for para o Atlas 1 (React): só uso pessoal | v4 | React 19 + react-aria (não é "HTML/CSS") |

Legenda de perfis: **compartilhavel** = pode ir no HTML redistribuível (mantendo avisos de licença); **pessoal** = só no perfil `full`; **excluir** = fora.

---

## 2. Recomendação (resumo)

**Ordem de integração**

1. **HyperUI (prova de conceito).** Confirmada como a mais simples: MIT limpo, 306 arquivos HTML autônomos, CSS Tailwind v4 já compilado e commitado (`public/component.css`), zero JS de componente, e o próprio projeto já define "o snippet" como o conteúdo do `<body>` (ver 3.1).
2. **Uiverse (Galaxy).** Também sem build (HTML + `<style>`), mas 3.802 itens com CSS global colidindo entre si (`.cta`, `.card`…): é o teste de **isolamento** em escala (Shadow DOM ou iframe por item). Tratar os 220 Tailwind v3 à parte.
3. **daisyUI.** Precisa gerar o CSS (Tailwind v4 + plugin) e extrair ~590 blocos de Markdown; sem JS.
4. **Flowbite.** Precisa de build do JS e do CSS (v4 com tokens de tema), e de um parser dos shortcodes Hugo `{{< example >}}`.
5. **Material Tailwind (v2).** Exige Tailwind **v3** + plugin + scripts do pacote HTML: obriga um segundo pipeline de CSS (v3) coexistindo com os v4.
6. **Preline** (só pessoal) e **TW Elements** (só pessoal): os repositórios **não trazem os snippets**; é preciso capturar do site, e a licença/termos para isso não está clara. Deixar por último e só se o Felipe aceitar o risco para uso estritamente pessoal.
7. **TailGrids**: fora (React, não HTML; termos do site contradizem o MIT do repo).

**Como extrair com fidelidade (sem reescrever)**: um script de `sync` por fonte, no estilo do `scripts/sync.mjs` atual, que clona em **commit fixo** (registrar em `sources.lock.json`) e copia/recorta o trecho **byte a byte** (sem prettier, sem trocar classes). Qualquer ajuste necessário (trocar CDN por arquivo local, `@import` de Google Fonts, URL de imagem) vai em `patches/<id>.json`, nunca no vendor. Detalhes por fonte na seção 3.

**Isolamento de CSS (hipótese, NÃO testada)**: como cada fonte pede um Tailwind/CSS diferente (v3 vs v4, temas do daisyUI, CSS global do Uiverse), a opção mais segura é renderizar cada snippet em **iframe `srcdoc`** (como o HyperUI faz) ou **Shadow DOM** com `adoptedStyleSheets` compartilhado por lib (evita duplicar o CSS por item). Variáveis do Tailwind v4 usam `:root, :host`, o que deveria funcionar em Shadow DOM, mas isso precisa ser validado na prova de conceito. A regra do repo "raiz da página nunca tem classe `dark`" continua valendo: o `dark` deve ir no host/iframe do palco.

---

## 3. Detalhes por fonte

### 3.1 HyperUI

- **Repo**: https://github.com/markmead/hyperui — **HEAD** `2b5aebbc50d2c9ac89650f51b554f53895b4803c`, main, commit de 2026-09-26. Sem tags de release úteis (`next15`, `pre-astro`).
- **Licença (identificador exato)**: arquivo `LICENSE` (sha256 `60e0bb845a95da07…`), texto "MIT License / Copyright (c) Mark Mead". README: "## License — [MIT](./LICENSE)". O `package.json` **não declara** campo `license` (o repo é o site de docs, `"name": "hyperui"`). O site hyperui.dev diz "Released under the MIT License" e não menciona conteúdo pago.
- **Redistribuível?** Sim, o código dos componentes. Obrigação: manter o aviso de copyright e o texto MIT (aba "Licença" do Atlas). Atribuição além disso não é exigida pelo MIT, mas o `git-metadata.json` traz `contributors` por componente, útil para créditos.
  - **Ressalva de ativos**: 143 arquivos referenciam `https://images.unsplash.com/...` (fotos não fazem parte do MIT do HyperUI) → no perfil compartilhavel usar placeholders ou aceitar a licença Unsplash conscientemente (não auditada, igual à pendência 11 do BRIEFING). 25 arquivos carregam `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/...` → `needs-network` ou embutir Chart.js (MIT, auditar).
  - `public/component.css` começa com `@import url('https://fonts.googleapis.com/…Google+Sans+Flex…')` → rede em runtime; trocar por fonte local via patch.
- **Pago/Pro?** Nenhum encontrado no repo nem no site. Existe "HyperUX" (outro produto linkado no site); **não** auditado e **fora** do repo.
- **Onde ficam os arquivos**: `public/examples/{application|marketing|neobrutalism}/<slug>/<n>.html` e `<n>-dark.html`; templates em `public/examples/templates/<slug>/…`; metadados (título, `dark: true`, `plugins`) no frontmatter de `src/content/collection/<categoria>/<slug>.mdx`.
- **Contagem**: application 163 (+132 dark), marketing 106 (+71 dark), neobrutalism 37 (+37 dark) = **306 claros + 240 dark**; mais 12 páginas de templates e 2 de blog (não componentes). O site mostra uma contagem menor por categoria (94/84/60 = 238 na home); a diferença provavelmente é forma de contar (variações vs. componentes). Usar a contagem de **arquivos**.
- **Tailwind / JS**: Tailwind **v4** (`component.css` compilado com 4.3.3, `@custom-variant dark (&:where(.dark, .dark *))`, plugin `@tailwindcss/forms`). Sem JS de componente; o `component.js` só impede cliques/submit dentro do preview.
- **Extração fiel**: cada `.html` é uma página completa que linka `/component.css` e `/component.js`. O "código" oficial do HyperUI é o **conteúdo do `<body>`** com 4 espaços de indentação removidos (função `readComponentMarkup` em `src/utils/componentMarkup.ts`). Replicar exatamente essa regra (regex `<body[^>]*>([\s\S]*?)</body>`, remover `^\s{4}` por linha, `trim()`). Preview = a própria página dentro de iframe usando o `component.css` (com patch da fonte). Variante escura = o `-dark.html` correspondente (classe `dark` no `<html>`).

### 3.2 Uiverse (Galaxy)

- **Repo**: https://github.com/uiverse-io/galaxy — **HEAD** `adbd2adde0a299a3956ea288fb444ec01891ca41`, main, commit de 2024-09-02. Sem tags. O repo declara que é um arquivo automático dos elementos do site; "Direct contributions or pull requests to this repository will be ignored".
- **Licença (identificador exato)**: `LICENSE` (sha256 `7feadcd7a611d37a…`), "MIT License / Copyright (c) 2023 Uiverse.io". README, seção "Licensing and Attribution": "All UI elements in this repository are available under the **MIT License**", com atribuição ao autor e ao Uiverse.io "not mandatory" (apreciada). Não há `package.json`.
  - O rodapé do site uiverse.io (via busca) afirma que o conteúdo é publicado sob MIT; **não consegui abrir** os Termos/Licença do site (HTTP 403 via WebFetch), então a licença **por elemento no site** não foi verificada diretamente — só o MIT do repo e o texto do README.
- **Redistribuível?** Sim sob o MIT do repo, mas com **ressalvas honestas**: (1) o direito autoral é de milhares de autores individuais (cada arquivo traz `From Uiverse.io by <autor>`); o MIT do repo está em nome do "Uiverse.io" e a validade da sublicença depende dos termos de submissão do site, que não consegui ler; (2) alguns elementos reproduzem marcas/logotipos de terceiros (ex.: Spotify, Pinterest, Telegram, Twitter/Instagram/Discord em cartões sociais; 41 arquivos têm URL externa); (3) o site também vende um produto pago separado ("Uiverse Design"/Pro), **não** presente no repo. Recomendo `compartilhavel` **mantendo o comentário de cabeçalho de cada arquivo** (já traz autor e tags) + o texto MIT, e marcar os 41 com URL externa para revisão.
- **Onde ficam os arquivos**: 11 pastas por categoria — `Buttons` (1.231), `Cards` (726), `loaders` (718), `Toggle-switches` (260), `Inputs` (226), `Forms` (180), `Checkboxes` (171), `Patterns` (103), `Radio-buttons` (102), `Tooltips` (62), `Notifications` (23) = **3.802** arquivos `<autor>_<slug>.html`. Formato: marcação + bloco `<style>` (CSS puro, com comentário `/* From Uiverse.io by … - Tags: … */`). Mediana 1,5 KB, máximo 185 KB.
- **Sem estilo `<style>`**: 433 arquivos (os Tailwind e alguns só com HTML). **220 mencionam Tailwind**, e as amostras usam sintaxe **v3** (`bg-gradient-to-r`, etc.), então precisam de CSS Tailwind compilado separado (v3, ou v4 com ressalvas de renomeações).
- **JS**: nenhum `<script>`. Interações são CSS (checkbox hack, `:hover`).
- **Extração fiel**: copiar o arquivo inteiro como "código" (é exatamente o que o site oferece em HTML/CSS). Preview: Shadow DOM ou iframe por item porque os seletores são globais e colidem (`.card`, `.button`, `.loader`…). Regras de nome como `body`/`html`/`*` dentro dos `<style>` podem vazar e precisam ser verificadas no QA (ainda não analisado).
- **Cautela**: 3.802 iframes pesam; carregar sob demanda (mesmo princípio do `loadLib()` do Atlas).

### 3.3 daisyUI

- **Repo**: https://github.com/saadeghi/daisyui — **HEAD** `9adbeaa259816be46b98bf497a09cd2ab127e3cf`, branch `master` (não `main`), commit de 2026-09-30; tag mais recente `v5.7.47` (`packages/daisyui/package.json`: `"version": "5.7.47"`).
- **Licença (identificador exato)**: `LICENSE` na raiz (sha256 `8709e3ac65c84637…`) e `packages/daisyui/LICENSE`, "MIT License / Copyright (c) 2020 Pouya Saadeghi"; `packages/daisyui/package.json`: `"license": "MIT"`. O `package.json` raiz (`daisyui-monorepo`) é `private` e não declara licença.
- **Redistribuível?** Sim (MIT), incluindo exemplos de documentação em `packages/docs`, que estão no mesmo repo/licença (o repo não traz licença separada para a pasta docs — assumo cobertura pelo MIT da raiz; é uma inferência, não uma declaração explícita). Ressalva de ativos: 298 referências a `https://img.daisyui.com/...` (fotos hospedadas pelo projeto; licença da imagem não declarada) → placeholders no compartilhavel. Há loja/"store"/temas pagos no site; **não** estão no repo.
- **Onde ficam**: CSS dos componentes em `packages/daisyui/src/components/*.css` (61 arquivos), temas em `src/themes`, utilitários em `src/utilities`. Exemplos em `packages/docs/src/routes/(routes)/components/<nome>/+page.md` (71 páginas): cada exemplo é um título `### ~Nome` seguido do **HTML renderizado** e depois de um bloco ```` ```html ```` com a mesma marcação em que as classes do daisyUI vêm prefixadas com `$$` (marcador de destaque do site). Total ~**590** blocos html.
- **Tailwind / JS**: daisyUI **5** exige Tailwind **v4** (`@plugin "daisyui"`). Sem JS próprio (CSS puro); `data-theme` para os temas.
- **Extração fiel**: usar o HTML renderizado que precede cada bloco de código (ou o bloco com `$$` removido: `$$` → ``). Atenção: o HTML do preview e o do bloco diferem em detalhes (ex.: o preview tem `autocomplete="off"` extra). Decidir qual é "o original" (sugestão: o bloco ```` ```html ```` sem `$$`, que é o que o site mostra como código; o preview só para renderizar). O CSS tem de ser gerado com Tailwind v4 CLI + o plugin do commit fixado (o repo não comita o `daisyui.css` pronto; o pacote npm sim).
- **Observação**: daisyUI é "plugin Tailwind": o item do catálogo é uma classe/componente com exemplos, não um arquivo de componente. Um passo de build é inevitável.

### 3.4 Flowbite

- **Repo**: https://github.com/themesberg/flowbite — **HEAD** `232ebdb33a9e37b31b293b9988d89b862ee121e5`, main, commit de 2026-06-27; tag `v4.0.2` (`package.json` `version` 4.0.2).
- **Licença (identificador exato)**: `LICENSE.md` (sha256 `2ef12ba4b6b1172b…`) "MIT License / Copyright (c) 2023 Bergside Inc."; `package.json`: `"license": "MIT"`. Página oficial (`content/getting-started/license.md` do próprio repo, e flowbite.com/docs/getting-started/license/):
  - "The released code is licensed under the MIT license."
  - "The docs code is licensed under the CC BY 3.0." (atribuição ao Bootstrap, de onde a documentação foi forkada)
  - "The pro version is licensed under the EULA from our website."
  - "The Flowbite name and logos are trademarks of Bergside Inc."
- **O que é Pro/pago**: Flowbite Pro e Flowbite Blocks/Illustrations/Figma, vendidos no site. **Não estão** no repo (a página de licença não detalha quais blocos são Pro; a página EULA https://flowbite.com/license/ retornou conteúdo vazio no WebFetch, então os termos exatos do EULA **não foram lidos**).
- **Redistribuível?** O código MIT sim. **Ambiguidade**: os exemplos vivem em `content/**/*.md`, que é a "documentação". A frase "docs code is CC BY 3.0" provavelmente se refere ao código do *site* (fork do Bootstrap), não aos exemplos de componente (que o próprio site chama de "released code"), mas o texto não deixa isso explícito. Postura segura: incluir MIT + crédito "Flowbite © Bergside Inc." + menção a CC BY 3.0 e a marca registrada (não usar logo/nome como marca do Atlas). Classificação: `compartilhavel com ressalva`.
  - Imagens: 88 URLs em `flowbite.s3.amazonaws.com`, fontes do Google, 55 imports de `esm.sh` (plugins de gráficos/datatables) → `needs-network`/patch.
- **Onde ficam**: `content/components/*.md` (≈43 páginas), `content/forms/*.md`, `content/typography/*.md`, `content/plugins/*.md` (charts, datatables, datepicker, wysiwyg). Exemplo = bloco `{{< example github="…" show_dark=true … >}} … HTML … {{< /example >}}` (shortcode do Hugo). Contagem: **670 aberturas** de `{{< example`; **628 pares completos** pelo meu regex (components 426, forms 106, typography 103, plugins 32 quando contados por abertura). Há ainda 567 `{{< code >}}` (código mostrado sem preview). Atributos de exemplo: `show_dark` (todos), `class`, `iframeHeight`, `bodyClass`, `disable_init_js`, `javascript`, `charts`, `datatables`…
  - Dentro do HTML há **17 exemplos com shortcodes Hugo** (`{{< param homepage >}}`, `{{< ref … >}}`) que não são HTML válido: precisam de substituição mínima e documentada via patch (ex.: `https://flowbite.com`). 13 exemplos têm links/menções a "Flowbite Pro" (só links).
- **Tailwind / JS**: Flowbite 4.0.x usa Tailwind **v4** e um **tema próprio** (`src/themes/default.css`, 9,8 KB; classes como `text-body`, `border-default`, `rounded-base`, `bg-neutral-secondary-medium`). Sem esse tema as classes não resolvem; há também temas `enterprise`, `minimal`, `mono`, `playful`. JS: pacote `flowbite` (`src/components/{accordion,carousel,clipboard,collapse,datepicker,dial,dismiss,drawer,dropdown,input-counter,modal,popover,tabs,tooltip}`), ativado por `data-*` — **o `dist/` não está no repo**, é preciso buildar (webpack) ou usar o npm do mesmo tag. 26 das ~108 páginas marcam `requires_js: true`.
- **Extração fiel**: parser dos blocos `{{< example … >}}…{{< /example >}}` pegando o HTML verbatim; guardar os atributos como metadados; só 17 itens precisam de patch de shortcode.

### 3.5 Material Tailwind

- **Repo**: https://github.com/creativetimofficial/material-tailwind — **HEAD** `1a343ad13d3caaa29032b653ee17b7f61c14f3a6`, main, commit de 2026-04-28 (merge de PR #978). Tags relevantes: `2.3.2-html`, `2.1.9-react`.
- **Versões (importante)**: `main` = **v2**: `packages/material-tailwind-html` 2.3.2 (README ainda cita 2.2.3/2.2.5), `packages/material-tailwind-react` 2.1.10, Tailwind **3.x**. Existe a branch `v3` (`ad294beed25c7517232bed291c6c16b8b534e88c`, de 2025-02-06): `@material-tailwind/html` `3.0.0-beta.1` e `@material-tailwind/react` `3.0.0-beta.24`, **estagnada e beta**. O site vivo pode estar numa v3 diferente do que está no `main` do GitHub: **não consegui confirmar** (WebFetch de material-tailwind.com/docs/html/license só mostrou "v2.3.2"). Decisão prática: auditar **v2 do `main`**.
- **Licença (identificador exato)**: `LICENSE.md` (sha256 `e737bacdd2ea78e6…`) "MIT License / Copyright (c) 2021-2023 Material Tailwind (https://www.material-tailwind.com) by Creative Tim"; `package.json`: `"license": "MIT"`; mesmo texto na página de licença do site e em `documentation/html/license.mdx`. Branch `v3`: `LICENSE` também MIT.
- **Pago**: "Material Tailwind PRO" e "Blocks" (Creative Tim) existem no site; **não estão** no repo. Algumas páginas de doc apontam para demos Pro (4 ocorrências de `material-taillwind-pro-ct-tailwind-team.vercel.app`) e 31 para `demos.creative-tim.com`.
- **Onde ficam**: `documentation/html/*.mdx` (54 páginas) com `<CodePreview … component={…}>` seguido de bloco ```` ```html ````; **327 blocos html**. Os previews renderizados vêm de `docs-content/html/<comp>/*.tsx` (React/JSX convertendo o mesmo markup; **não** é o código oficial em HTML — usar o bloco ```` ```html ```` das `.mdx`). Maiores: card (26), table (19), input (15), checkbox (12), button (11), radio-button (11).
- **Tailwind / JS**: **v3** + plugin/tema do pacote HTML (`withMT`/`tailwind.config.js`). 20 blocos usam `data-ripple…` (ripple), ~40 trazem `<script>` (accordion usa `onclick="toggleAccordion(…)"` com função inline) e 36 usam atributos `data-*` de componentes. Imagens: 76 URLs `images.unsplash.com`; 16 `unpkg.com`.
- **Redistribuível?** Código sim (MIT). Ressalvas: imagens Unsplash e de `demos.creative-tim.com`; marca "Material Tailwind"/Creative Tim. `compartilhavel com ressalva`.
- **Extração fiel**: regex dos blocos ```` ```html ```` das `.mdx`, associando o título H2 anterior. Conferir blocos que dependem de JS externo antes de aceitar no catálogo.

### 3.6 Preline UI

- **Repo**: https://github.com/htmlstreamofficial/preline — **HEAD** `05ca59998db345cfede649b00093032409b37f25`, main, commit de 2026-08-21 ("v5.0 - Preline MCP, AI Prompts, Animated Icons and more."); tag `v5.0.0` (`package.json` 5.0.0).
- **Licença (identificador exato)** — a que mais exige leitura. Cabeçalho do `LICENSE` (sha256 `ac794b9a0bbcb6f7…`):
  - "@License: Preline UI is free for both personal and commercial projects, released under dual license terms "MIT" and "Preline UI Fair Use License", and copyrighted 2026 by Preline Labs Ltd."
  - Em seguida o MIT padrão (Copyright (c) 2026 Preline Labs Ltd.) e a **"Preline UI Fair Use License"**, com, entre outros:
    - 1. "Competing Products: The Software shall not be used to create any product or service that directly competes with Preline UI. A competing product is defined as any software or service that replicates the primary functionalities of Preline UI."
    - 3. "Redistribution of the Software in its original or modified form is allowed under the MIT License, with the following additional conditions: Redistributions must include this Fair Use License in addition to the MIT License. … Must include clear attribution with a link to the original repository."
    - 4. "The author reserves the right to terminate the rights granted under this Fair Use License if the user fails to comply with the terms."
  - `package.json`: `"license": "Licensed under MIT and Preline UI Fair Use License"` (não é um identificador SPDX).
  - Página https://preline.co/docs/license.html (via WebFetch), FAQ: "Preline UI can be used under the MIT License in projects that do not compete with or derive from it." e, sobre design systems públicos, "components must not be redistributed or made available in their original form".
- **Implicação para o Atlas**: um catálogo público que mostra e redistribui o código original do Preline é plausivelmente um produto que "replica funcionalidades" ou "redistribui na forma original" → **risco real**. Mesmo para uso pessoal a cláusula 1 deveria ser lida pelo Felipe; para o perfil **compartilhavel recomendo EXCLUIR**.
- **Pago**: o README anuncia Preline **Pro** ("740 premium blocks and sections, 21 premium templates, 207 pages"). Esses **não estão no repo**. Os gratuitos: "204 free Tailwind CSS blocks", "5 free templates", "27 headless plugins" — segundo o README. **Só os 5 templates gratuitos e o JS estão no repo.**
- **Onde ficam**: `templates/{ai/ai-chat-interface, dashboards/cms-admin, ecommerce/coffee-shop, websites/digital-agency, websites/personal-portfolio}/index.html` (≈103 KB cada, páginas completas que linkam `https://preline.co/assets/css/main.css?v=4.2.0`, `cdn.jsdelivr.net/npm/preline/dist/index.js`, apexcharts, lodash, Google Fonts — ou seja, **não** são autossuficientes offline e o `main.css` não está no repo). JS em `src/` (TS) e `dist/` (156 arquivos, `preline.js` 435 KB, `.mjs`, `*-non-auto`); temas em `css/themes/*.css` (autumn, bubblegum, cashmere, harvest, moon, ocean, olive, retro, theme…); `variants.css`, `theme.css`. Pasta `skills/preline-mcp` indica que os blocos são servidos por um **servidor MCP** (blocks/components) e pelo site.
- **Como obter os ~204 blocos**: só via site/MCP — **raspagem do site não foi avaliada nem autorizada nos termos**; não fiz isso. Sem isso, a contribuição do Preline ao Atlas Low seria só 5 templates. Hipótese não verificada: o MCP do Preline retornaria HTML por bloco, mas os termos de uso desse serviço não foram lidos.
- **Tailwind / JS**: Tailwind **v4** (`@import "./node_modules/preline/variants.css"`, temas `theme.css`); JS próprio obrigatório (`preline.js` inicializa `HSStaticMethods`).
- **Perfil**: **somente pessoal (full)**, baixa prioridade.

### 3.7 TW Elements

- **Repo**: https://github.com/mdbootstrap/TW-Elements — **HEAD** `9b442c410d8de1c44fbad6728668235c36c4b712`, branch `master`, commit de 2026-03-27 ("Update README"); tag `v2.0.0`.
- **Licença (identificador exato)** — **inconsistente**:
  - Arquivo `LICENSE` (sha256 `749ae185cef1585f…`): "MIT License / Copyright (c) 2024 MDBootstrap".
  - `package.json`: `"license": "SEE LICENSE IN <License.txt>"` — aponta para `License.txt`, que **não existe** no repo.
  - Cabeçalho do CSS: "Version: FREE 2.0.0 … Copyright: Material Design for Bootstrap … Read the license: https://tw-elements.com/license/".
  - Página https://tw-elements.com/license/: "Free packages are available under the MIT License" e "open-source license that allows for personal & commercial usage"; para o Pro, EULA com "You cannot redistribute, resell, lease, license, sub-license or offer the Product" e proibição de publicar em repositórios públicos. A página lista "Documentation code examples" como item do **Premium Access (Pro)**. Não está claro se o EULA se aplica ao pacote FREE.
- **Pago**: TW Elements **Pro** (a "Standard" é a gratuita). O README diz "500+ UI components, 117+ design blocks … Free for personal & commercial use", mas o repo só tem a build FREE (`src/js/free/…`: button, carousel, collapse, dropdown, modal, offcanvas, popover, tooltip, input, ripple, scrollspy, tab). **Não há nenhum snippet HTML no repo** (apenas um `index.html` de demonstração de 3 KB que usa `cdn.tailwindcss.com/3.3.0`). Os exemplos da documentação ficam no site tw-elements.com e **não consegui determinar** quais são gratuitos vs. Pro, nem a licença desses exemplos.
- **Tailwind / JS**: Tailwind **v3.3** (plugin CJS `plugin.cjs`, `css/tw-elements.min.css` compilado com 3.3.0). JS próprio obrigatório (`js/tw-elements.umd.min.js`). Projeto com pouca atividade (último commit é só README).
- **Perfil**: **somente pessoal** e **adiar**; só entra se o Felipe aceitar capturar manualmente exemplos do site para uso estritamente pessoal. Excluir do compartilhavel.

### 3.8 TailGrids

- **Repo**: https://github.com/TailGrids/tailgrids — **HEAD** `b54636bac9fa6ab64cf5eff388c3de07b6adc515`, main, commit de 2026-08-04. Monorepo (`apps/docs`, `packages/{cli,icons,mcp,mcp-extension,…}`). O antigo "TailGrids Core" em HTML **não está neste repo** (nem como repositório do org: `tailgrids-react` e `tailgrids-vue` estão parados desde mar/2025; `play-tailwind`/`play-astro` são sites).
- **Licença (identificador exato)**: `LICENSE.md` (sha256 `2b04d5caf7e019aa…`) "MIT License / Copyright (c) 2025 Tailgrids, <hello@tailgrids.com>"; `package.json` raiz: `"license": "MIT"`; README: badge "license-MIT". **Mas** a página https://tailgrids.com/license ("Tailgrids License Agreement", atualizada 28/10/2025) diz, segundo o WebFetch, "NOT ALLOWED to resell, redistribute, license, or sublicense" e proíbe uso em "website builders or UI generators". Conflito entre o MIT do repo e o contrato do site: **não resolvido**. Em dúvida, tratar como não redistribuível.
- **Conteúdo**: "100+ free React components" + "500+ premium UI blocks" (pagos, fora do repo). Os componentes grátis são **TSX** (`apps/docs/src/registry/core`, 62 arquivos; docs em `apps/docs/content/components`, 63 páginas) com `class-variance-authority` e `react-aria-components`; **Tailwind v4**, React 19, Next 16.
- **Perfil**: **excluir do Atlas Low** (não é HTML/CSS). Como fonte React poderia caber no Atlas 1/2 principal, mas só como **uso pessoal** por causa do conflito de licenças.

---

## 4. Incertezas e o que NÃO foi verificado

1. **Uiverse**: Termos/licença do site (HTTP 403). A afirmação "MIT por elemento" vem do `LICENSE` + README do repo e de um resultado de busca sobre o rodapé do site. Autoria individual e marcas de terceiros nos elementos não foram auditadas. O repo está parado desde 09/2024; o site tem muito mais elementos hoje (não importados).
2. **Flowbite**: o EULA (flowbite.com/license/) veio vazio; não sei exatamente quais blocos são Pro. Não confirmei se a nota "docs code = CC BY 3.0" alcança os exemplos de componente.
3. **Preline**: não verifiquei o MCP/site dos 204 blocos gratuitos, nem se a raspagem é permitida. A leitura da cláusula "competing products" é interpretação minha.
4. **TW Elements**: não achei repo público com os exemplos; a relação entre EULA do site e MIT do repo ficou ambígua; `License.txt` referenciado não existe.
5. **Material Tailwind**: o site público pode já estar na v3 (React/Tailwind v4); o `main` do GitHub ainda é v2. A branch `v3` é beta antigo (fev/2025).
6. **TailGrids**: conflito MIT (repo) vs. contrato (site) sem resolução; não consegui ver a página de preços/FAQ.
7. **Imagens de terceiros** (Unsplash em HyperUI/Material Tailwind, `img.daisyui.com`, `flowbite.s3.amazonaws.com`, `demos.creative-tim.com`): licença das imagens **não auditada**; equivale à pendência 11 do BRIEFING.
8. **Contagens** são do HEAD auditado e por contagem de arquivos/blocos; os números dos sites diferem (ex.: HyperUI 238 na home vs. 306 arquivos).
9. **Não testei renderização de nenhum snippet**; as recomendações de isolamento (iframe/Shadow DOM) são hipóteses.
10. As consultas via `gh api` e algumas buscas travaram neste ambiente (timeout); por isso datas de tags e commits vêm de `git ls-remote`/`git log` dos clones, que são confiáveis, e não da API.

---

## 5. Proposta de entradas em `sources.lock.json` (rascunho, não aplicado)

| id | repo | commit fixo | licença (campo) | perfis |
|---|---|---|---|---|
| hyperui | markmead/hyperui | 2b5aebbc50d2c9ac89650f51b554f53895b4803c | MIT | full, lite, compartilhavel |
| uiverse | uiverse-io/galaxy | adbd2adde0a299a3956ea288fb444ec01891ca41 | MIT (autoria individual) | full, lite, compartilhavel (após revisão dos 41 com URL externa) |
| daisyui | saadeghi/daisyui | 9adbeaa259816be46b98bf497a09cd2ab127e3cf | MIT | full, lite, compartilhavel |
| flowbite | themesberg/flowbite | 232ebdb33a9e37b31b293b9988d89b862ee121e5 | MIT (+ docs CC BY 3.0) | full, lite, compartilhavel (com avisos) |
| materialtailwind | creativetimofficial/material-tailwind | 1a343ad13d3caaa29032b653ee17b7f61c14f3a6 | MIT | full, lite, compartilhavel (sem imagens externas) |
| preline | htmlstreamofficial/preline | 05ca59998db345cfede649b00093032409b37f25 | MIT + Preline UI Fair Use License | **somente full** |
| twelements | mdbootstrap/TW-Elements | 9b442c410d8de1c44fbad6728668235c36c4b712 | MIT (inconsistente) | **somente full**, adiado |
| tailgrids | TailGrids/tailgrids | b54636bac9fa6ab64cf5eff388c3de07b6adc515 | MIT (repo) vs. contrato restritivo (site) | **excluído** |

Os perfis **lite** (sem rede/WebGL) exigem, para cada fonte acima, descartar snippets com URL externa e embutir ou stubar o que for necessário (Chart.js do HyperUI, fontes Google, imagens).

## 6. Próximo passo sugerido

Prova de conceito com **HyperUI**: (a) `sync` clona no commit fixo; (b) adaptador lê `public/examples/**/N.html` e `N-dark.html` e o frontmatter MDX (título, categoria); (c) código = conteúdo do `<body>` com a regra do `componentMarkup.ts`; (d) preview em iframe/Shadow DOM com `component.css` (fonte Google trocada por patch); (e) aba Licença com o MIT de Mark Mead; (f) QA de erros/rede (25 Chart.js e 143 Unsplash sinalizados `needs-network`). Só depois repetir o desenho para Uiverse.
