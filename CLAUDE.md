# Atlas — notas para o Claude Code
- `vendor/<lib>/` é cópia **verbatim** e podada do código de cada biblioteca (versionada; não há mais sync): nunca edite à mão; use `patches/<id>.json`. Exceção: `vendor/atlas/` (autoria própria).
- Nada de rede em runtime: imagens/fontes são embutidas; `file://` é o alvo. Teste com `node build/qa.mjs`.
- Raiz da página NÃO pode ter classe `dark` (variante `dark:` das libs); cada palco recebe `lib-<id>` + `dark|light`.
- Mudou CSS/keyframes? Veja conflitos impressos pelo build ("keyframes renomeados").
- Qualquer `pkill -f` com nome de script no mesmo comando bash se mata: use `[b]uild/qa.mjs`.
- Cada lib vira um bundle IIFE separado (build/build.mjs); `react`/`react-dom` vêm de `window.__SH`. Estado compartilhado shell↔lib (ex.: `StageThemeCtx`) tem de viver em `window` (ver `src/shell/ctx.tsx`).
- QA em paralelo: `--libs=a,b --tag=x` (relatório `out/qa/report-x.json`); só 2 CPUs: no máximo 2 shards.
