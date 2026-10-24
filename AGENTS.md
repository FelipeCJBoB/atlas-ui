# Atlas — instruções para agentes de IA

O Atlas é uma biblioteca **curada** de componentes de UI (React + Tailwind + Motion, e HTML/CSS) mantida para que uma IA escolha componentes para um cliente. Só está aqui o que é difícil de fazer sem referência: efeitos, animações, 3D/WebGL, componentes compostos (gantt, kanban, data grid, editor…). Botões, inputs e diálogos comuns **não** estão aqui de propósito: faça-os direto.

Tudo é autocontido neste repositório: código (`vendor/<lib>/`), licenças, catálogo e prévias. Não há dependência de repositórios de terceiros.

## Como escolher componentes (siga a ordem)
1. **Liste as necessidades** do pedido do cliente (seções, efeitos, interações, dados).
2. **Busque** no catálogo:
   - `node scripts/atlas-find.mjs survey "fundo animado; card com hover; contador"` — procura cada necessidade em todos os tipos de aplicação.
   - `node scripts/atlas-find.mjs find "<termos>" [--fn="Fundo & Efeito"] [--app="Landing & Marketing"] [--profile=compartilhavel]`
   - Sem Node: leia `catalogo/catalog.jsonl` (1 componente por linha) ou `catalogo/por-funcao/<função>.md`.
3. **Veja antes de escolher.** Abra as imagens:
   - `catalogo/folhas/<função>-NN.webp` — 24 componentes numerados por imagem; o `.md` ao lado liga número → uid. Ótimo para comparar.
   - `previews/<lib>/<id>.webp` — um componente: à esquerda o estado normal, à direita com o cursor em cima.
   Compare pelo menos 3 candidatos de bibliotecas diferentes antes de decidir.
4. **Leia o código** do escolhido: `node scripts/atlas-find.mjs code <uid>` (metadados, licença, prévia, dependências npm e código), ou os caminhos em `files`.
5. **Confira a licença** (campos `own`, `share`, `license`):
   - `own: true` → autoria própria do Atlas, sem aviso de terceiros.
   - MIT/Apache (`share: true`) → pode ir para cliente; mantenha o aviso de copyright da biblioteca no topo do arquivo copiado.
   - MIT + Commons Clause (React Bits, Animate UI) → pode modificar e usar dentro do projeto do cliente, mantendo o aviso de licença; **não** pode vender os componentes como produto (biblioteca, template, kit de UI).
   - `share: false` (“pessoal”) → **não use em entrega para cliente**.
6. **Adapte**, não reescreva: copie os arquivos de `files`, instale `deps`, troque cores/tokens/textos e substitua imagens de exemplo (licença não auditada) por imagens do projeto.

## Avisos
- `flags`: `needs-network` (vídeo/CDN/API), `needs-files` (arquivos próprios), `needs-props` (sem demo pronta). Evite em projetos offline.
- `stack: html` (Uiverse) = HTML + CSS puro com seletores globais: coloque um namespace ao colar.
- Tailwind: as bibliotecas React usam v4; alguns itens do Uiverse usam v3.

## Mapa do repositório
| Caminho | Conteúdo |
|---|---|
| `catalogo/` | catálogo (`catalog.jsonl`), páginas por função com miniaturas, folhas de prévias, `libs.md` |
| `previews/` | prévia de cada componente (normal \| com cursor em cima) |
| `vendor/<lib>/` | código-fonte versionado de cada biblioteca + `LICENSE` |
| `vendor/atlas/` | componentes de autoria própria (reescritos em sala limpa; ver `reescrita/`) |
| `scripts/atlas-find.mjs` | busca e leitura de código |
| `build/`, `adapters/`, `patches/` | geração da vitrine HTML (`npm run build`) |
| `curadoria/` | por que cada componente entrou ou saiu |
