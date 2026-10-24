# Curadoria do Atlas

Objetivo: manter só componentes difíceis de fazer sem instrução. O que é "padrão" (a IA já faz) sai do índice e da vitrine; o código original continua em `vendor/`.

| Arquivo | O que é |
|---|---|
| `proposta.json` | Decisão automática por uid: `keep`, `drop` ou `triage` (+ motivo). Gerado por `node scripts/curadoria.mjs` |
| `sugestao-claude.json` | Revisão visual do Claude para os itens `triage` |
| `triagem.html` | (removida após a triagem) Página de triagem. Para refazer: capturas `node build/qa.mjs out/atlas-full.html --shots --frames=2 --uids=<lista>` e depois `node scripts/triagem.mjs` |
| `decisoes.json` | **Sua decisão final** (exportada pela página). Vence a proposta |

## Regras automáticas
- Saem inteiras: daisyui, flowbite, hyperui, materialtailwind (HTML genérico) e itshover (ícones; fica lucide-animated).
- kibo/reui: primitivos shadcn (Button, Input, Dialog…) saem; componentes compostos vão para triagem.
- uiverse: CSS estático/hover simples sai; animação forte (≥2 keyframes com 3D/máscara/SVG, ≥4 keyframes ou ≥200 linhas com animação) fica; o resto vai para triagem.
- Bibliotecas de efeito (React Bits, Magic UI, ThreeUI…): ficam, salvo as triviais (triagem).

## Aplicar
1. Na página, clique em **Exportar decisoes.json** e salve em `atlas/curadoria/decisoes.json`.
2. Reconstrua e reindexe:
   ```bash
   npm run build && node build/build.mjs --profile=lite && npm run build:compartilhavel && node scripts/make-index.mjs
   ```
`--sem-curadoria` no build ignora a curadoria. As bibliotecas que saíram inteiras (daisyui, flowbite, hyperui, materialtailwind, itshover) tiveram o `vendor/` apagado: para tê-las de volta, `npm run sync -- <id>` antes do build.
