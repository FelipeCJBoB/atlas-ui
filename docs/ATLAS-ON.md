# Atlas On — dependências de rede (123 componentes `needs-network`)

Gerado por `build/online-report.mjs` a partir do QA com internet real (Edge, 2026-10-07).

## Resumo por tipo

| Tipo | Componentes | Caminho para offline |
|---|---|---|
| tailwind-play-cdn | 47 | embutível com @tailwindcss/browser v4 (checar compatibilidade v3→v4) |
| iconify-api | 35 | embutível: @iconify-json/<set> (solar etc.) offline |
| fonte | 30 | embutível: @fontsource/* |
| api-viva | 29 | dado ao vivo: precisa de internet (ou mock) |
| video | 22 | não embutível (tamanho) |
| outro | 6 | revisar |
| script-cdn | 5 | embutível via npm (three, gsap…) |
| imagem-remota | 1 | embutível (cache de imagens) |

Sem nenhuma requisição externa neste teste (flag provavelmente desnecessária ou depende de interação): **24**

`magicui:android-demo`, `magicui:bento-demo-vertical`, `magicui:safari-demo-4`, `cultui:illustration-card-grid-demo`, `fancy:blocks/media-between-text-vertical-demo`, `fancy:filter/gooey-svg-filter-demo`, `fancy:image/image-trail-various-elements-demo`, `smoothui:tweet-card-top`, `reactbits:Components/LanyardDemo`, `reactbits:TextAnimations/MaskedHeadingDemo`, `uitripled:components/account-switcher/multiple-accounts`, `uitripled:sections/glassmorphism-logo-showcase-block`, `kibo:reel-images`, `kibo:reel-minimal`, `kibo:snippet-npm`, `kibo:video-player`, `systaliko:scroll-animations/scroll-animation-inset-x`, `systaliko:scroll-animations/scroll-animation-inset-y`, `threeui:liquid-metal-button/play-circle`, `threeui:liquid-metal-button/circle`, `threeui:warp-field/streaks`, `threeui:woven-cloth/atelier`, `threeui:woven-cloth/washi`, `threeui:matrix-field/atmospheric-blade`

## Falhas mesmo com internet

- `cultui:hover-video-player-demo` — HTTP 401 https://player.vimeo.com/video/1037289858?autopause=0&controls=0&loop=1&app_id=122963
- `smoothui:github-stars-animation` — HTTP 401 https://api.github.com/repos/educlopez/smoothui/stargazers?per_page=5 · HTTP 401 https://api.github.com/repos/educlopez/smoothui/stargazers?per_page=3
- `reactbits:TextAnimations/MaskedHeadingDemo` — Failed to load resource: net::ERR_FILE_NOT_FOUND
- `kibo:glimpse-custom` — Access to fetch at 'https://github.com/haydenbleasel/ultracite' from origin 'file://' has been blocked by CORS · Failed to load resource: net::ERR_FAILED
- `kibo:glimpse` — Access to fetch at 'https://github.com/haydenbleasel/ultracite' from origin 'file://' has been blocked by CORS · Failed to load resource: net::ERR_FAILED
- `kibo:hero` — Access to fetch at 'https://github.com/haydenbleasel/ultracite' from origin 'file://' has been blocked by CORS · Failed to load resource: net::ERR_FAILED

## Por componente

| Componente | Dependências |
|---|---|
| `magicui:android-demo-3` | video |
| `magicui:android-demo` | — |
| `magicui:backlight-video-demo` | api-viva, fonte, video |
| `magicui:bento-demo-vertical` | — |
| `magicui:iphone-demo-3` | video |
| `magicui:safari-demo-3` | video |
| `magicui:safari-demo-4` | — |
| `magicui:tweet-card-demo` | api-viva, imagem-remota, video |
| `magicui:tweet-card-images` | api-viva, video |
| `magicui:tweet-card-meta-preview` | api-viva |
| `magicui:video-text-demo` | video |
| `cultui:bg-media-demo` | video |
| `cultui:hover-video-player-demo` | outro, video |
| `cultui:illustration-card-grid-demo` | — |
| `fancy:blocks/media-between-text-scroll-demo` | video |
| `fancy:blocks/media-between-text-vertical-demo` | — |
| `fancy:carousel/box-carousel-video-demo` | video |
| `fancy:filter/gooey-svg-filter-demo` | — |
| `fancy:filter/pixelate-svg-filter-demo` | video |
| `fancy:image/image-trail-various-elements-demo` | — |
| `animateui:components/animate/github-stars-wheel` | api-viva |
| `animateui:components/base/preview-link-card` | outro |
| `animateui:components/buttons/github-stars` | api-viva |
| `animateui:primitives/animate/github-stars` | api-viva |
| `smoothui:github-stars-animation` | api-viva |
| `smoothui:tweet-card-avatars` | api-viva |
| `smoothui:tweet-card-top` | — |
| `smoothui:video-ambient` | video |
| `reactbits:Backgrounds/GridScanDemo` | script-cdn |
| `reactbits:Components/CircularGalleryDemo` | fonte |
| `reactbits:Components/FluidGlassDemo` | api-viva, script-cdn |
| `reactbits:Components/LanyardDemo` | — |
| `reactbits:Components/ModelViewerDemo` | outro |
| `reactbits:Micro/ShredderDemo` | outro |
| `reactbits:TextAnimations/ASCIITextDemo` | fonte |
| `reactbits:TextAnimations/MaskedHeadingDemo` | — |
| `reactbits:TextAnimations/TextPressureDemo` | fonte |
| `eldoraui:animated-shiny-button-demo` | fonte |
| `eldoraui:cobe-globe-demo-4` | api-viva |
| `eldoraui:cobe-globe-demo-5` | api-viva |
| `eldoraui:cobe-globe-demo` | api-viva |
| `eldoraui:map-demo` | api-viva |
| `uitripled:components/account-switcher/multiple-accounts` | — |
| `uitripled:sections/glassmorphism-listen-app-block` | outro |
| `uitripled:sections/glassmorphism-logo-showcase-block` | — |
| `kibo:glimpse-custom` | api-viva |
| `kibo:glimpse` | api-viva |
| `kibo:hero` | api-viva, video |
| `kibo:reel-custom` | video |
| `kibo:reel-images` | — |
| `kibo:reel-minimal` | — |
| `kibo:reel` | video |
| `kibo:sandbox-no-file-explorer` | api-viva |
| `kibo:sandbox` | api-viva |
| `kibo:snippet-npm` | — |
| `kibo:stories` | video |
| `kibo:video-player` | — |
| `systaliko:components/reveal-mask` | video |
| `systaliko:ecommerce/infinite-scroll` | outro |
| `systaliko:ecommerce/product-carousel-2` | video |
| `systaliko:scroll-animations/scroll-animation-inset` | video |
| `systaliko:scroll-animations/scroll-animation-inset-x` | — |
| `systaliko:scroll-animations/scroll-animation-inset-y` | — |
| `systaliko:scroll-animations/scroll-animation-rotate-y` | video |
| `systaliko:scroll-animations/video-section` | video |
| `threeui:star-portal/star-portal` | tailwind-play-cdn |
| `threeui:star-portal/ignition-button` | fonte, tailwind-play-cdn |
| `threeui:star-portal/induction-button` | iconify-api, tailwind-play-cdn |
| `threeui:star-portal/plasma-button` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:star-portal/tactile-button` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:star-portal/thinking-button` | fonte |
| `threeui:rectangle-buttons/launch-button` | tailwind-play-cdn |
| `threeui:rectangle-buttons/dot-border-button` | tailwind-play-cdn |
| `threeui:rectangle-buttons/floating-dots-cta` | tailwind-play-cdn |
| `threeui:rectangle-buttons/sliding-text-cta` | tailwind-play-cdn |
| `threeui:rectangle-buttons/gradient-beam-cta` | tailwind-play-cdn |
| `threeui:rectangle-buttons/gradient-pill-button` | tailwind-play-cdn |
| `threeui:rectangle-buttons/generate-button` | tailwind-play-cdn |
| `threeui:rectangle-buttons/glassmorphism-cta` | tailwind-play-cdn |
| `threeui:rectangle-buttons/spinning-border-button` | tailwind-play-cdn |
| `threeui:rectangle-buttons/gradient-cta` | tailwind-play-cdn |
| `threeui:liquid-metal-button/play-circle` | — |
| `threeui:liquid-metal-button/pill` | fonte |
| `threeui:liquid-metal-button/circle` | — |
| `threeui:structure-flow/expanse-field` | iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/logic-core` | fonte, iconify-api, script-cdn, tailwind-play-cdn |
| `threeui:structure-flow/dimensional-field` | fonte, iconify-api, script-cdn, tailwind-play-cdn |
| `threeui:structure-flow/data-field` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/topology-field` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/nebula` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/fluid-field` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/ember-storm` | api-viva, fonte, iconify-api, tailwind-play-cdn |
| `threeui:structure-flow/flux-vortex` | api-viva, fonte, iconify-api, script-cdn, tailwind-play-cdn |
| `threeui:warp-field/streaks` | — |
| `threeui:engraved-certificate` | fonte |
| `threeui:woven-cloth/woven-cloth` | api-viva, iconify-api, tailwind-play-cdn |
| `threeui:woven-cloth/iridescent` | api-viva, iconify-api |
| `threeui:woven-cloth/atelier` | — |
| `threeui:woven-cloth/washi` | — |
| `threeui:performance-gauges/tachometer` | iconify-api, tailwind-play-cdn |
| `threeui:performance-gauges/speedometer` | iconify-api, tailwind-play-cdn |
| `threeui:performance-gauges/boost` | iconify-api, tailwind-play-cdn |
| `threeui:performance-gauges/power` | iconify-api, tailwind-play-cdn |
| `threeui:uplink-loader` | fonte |
| `threeui:constellation-field/constellation-field` | iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/particle-drift` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/particle-network` | api-viva, fonte, iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/gateway-flow` | fonte, tailwind-play-cdn |
| `threeui:constellation-field/connectivity-graph` | iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/interface-lines` | iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/defense-lines` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:constellation-field/topo-field` | iconify-api, tailwind-play-cdn |
| `threeui:portal-field/portal-field` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:portal-field/cloud-field` | api-viva, fonte, iconify-api, tailwind-play-cdn |
| `threeui:diagnostics-panel/layers` | api-viva, iconify-api, tailwind-play-cdn |
| `threeui:diagnostics-panel/nodes` | api-viva, iconify-api, tailwind-play-cdn |
| `threeui:diagnostics-panel/flow` | api-viva, iconify-api, tailwind-play-cdn |
| `threeui:skeuomorphic-toggle/skeuomorphic-toggle` | iconify-api, tailwind-play-cdn |
| `threeui:matrix-field/matrix-field` | api-viva, fonte, iconify-api, tailwind-play-cdn |
| `threeui:matrix-field/atmospheric-blade` | — |
| `threeui:wireframe-forms/cube` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:wireframe-forms/cylinders` | fonte, iconify-api, tailwind-play-cdn |
| `threeui:wireframe-forms/sphere` | fonte, iconify-api, tailwind-play-cdn |
