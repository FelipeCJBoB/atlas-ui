# Especificação: Botão animado (button)

## Propósito

Um botão de uso geral com sete variantes visuais e seis tamanhos, no estilo "shadcn", que cresce levemente quando o ponteiro passa por cima e encolhe ao ser pressionado, com uma mola rápida. É a base visual dos demais botões da coleção.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Secundária / destaque ("accent") | `#f5f5f5` | `#262626` |
| Texto sobre secundária / destaque | `#171717` | `#fafafa` |
| Destrutiva | `#e7000b` | `#ff6467` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

Raio base do tema: 10 px. Raio "médio" = 8 px.

### Base comum

- Elemento em linha flexível, conteúdo centralizado nos dois eixos, espaço de **8 px** entre ícone e texto, sem quebra de linha, não encolhe.
- Cantos de **8 px**.
- Tipografia **14 px**, peso **500**.
- Ícones SVG internos: **16 × 16 px** quando não têm tamanho próprio; não encolhem e não capturam ponteiro.
- Sem contorno nativo.
- **Foco por teclado**: a borda assume a cor do anel e surge um anel externo de **3 px** na cor do anel com 50% de opacidade.
- **Inválido** (marcado como inválido para acessibilidade): borda destrutiva e anel destrutivo com 20% de opacidade (40% no escuro).
- **Desabilitado**: 50% de opacidade e sem eventos de ponteiro.
- Transições curtas (padrão do navegador, ~150 ms) de cor de texto, fundo, borda, contorno, sombra, preenchimento e traço.
- Sombra "extra-sutil" quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.

### Variantes

| Variante | Fundo | Texto | Borda | Sombra | Hover |
|---|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | sutil | fundo primária com 90% de opacidade |
| Destaque | destaque | texto sobre destaque | — | sutil | destaque com 90% de opacidade |
| Destrutiva | destrutiva (no escuro, destrutiva com 60% de opacidade) | branco | — | sutil | destrutiva com 90%; anel de foco destrutivo 20% (escuro 40%) |
| Contorno | fundo da página (no escuro, campo com 30% ≈ `rgba(255,255,255,0.045)`) | texto | 1 px na cor de borda (no escuro, cor de campo) | sutil | fundo destaque + texto sobre destaque (no escuro, campo com 50% ≈ `rgba(255,255,255,0.075)`) |
| Secundária | secundária | texto sobre secundária | — | sutil | secundária com 80% |
| Fantasma | transparente | herdado | — | — | fundo destaque (no escuro com 50%) + texto sobre destaque |
| Link | transparente | primária | — | — | sublinhado, com 4 px de afastamento do texto |

### Tamanhos

| Tamanho | Dimensões | Padding horizontal | Se o filho direto for um ícone SVG |
|---|---|---|---|
| Padrão | altura 36 px | 16 px (vertical 8 px) | 12 px |
| Pequeno | altura 32 px, espaço interno 6 px | 12 px | 10 px |
| Grande | altura 40 px | 24 px | 16 px |
| Ícone | 36 × 36 px | — | — |
| Ícone pequeno | 32 × 32 px | — | — |
| Ícone grande | 40 × 40 px | — | — |

## Comportamento

- **Hover**: a escala vai de 1 para **1,05**.
- **Pressionar** (ponteiro abaixado ou toque): a escala vai para **0,95**. Ao soltar, volta a 1,05 se o ponteiro ainda estiver em cima, ou a 1.
- As duas transições usam uma **mola** de rigidez **550**, amortecimento **30** e massa 1 (rápida, praticamente sem oscilação). Se o estado muda no meio, a mola parte do valor atual.
- Cores mudam com transição CSS independente da escala.
- Clique, teclado (Enter/Espaço), foco e desabilitado são os nativos de um botão.

## Técnica de renderização em alto nível

- Um único elemento de botão nativo com classes utilitárias por variante e tamanho.
- A escala de hover e de pressão é animada por mola (biblioteca de animação com molas, ou CSS com curva de leve "overshoot" como alternativa).
- Opcionalmente o componente pode "emprestar" o comportamento ao único filho (padrão "como filho"), mesclando classes, estilos e manipuladores — útil para links com aparência de botão.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Variante visual (padrão, destaque, destrutiva, contorno, secundária, fantasma, link) | enumeração | padrão |
| Tamanho (padrão, pequeno, grande, ícone, ícone pequeno, ícone grande) | enumeração | padrão |
| Escala no hover | número | 1,05 |
| Escala ao pressionar | número | 0,95 |
| Renderizar como o filho em vez de um botão próprio | booleano | falso |
| Conteúdo, classe extra, atributos e eventos nativos de botão | — | repassados |

## Demo

- Um único botão centralizado na área de prévia, sobre o fundo do tema.
- Conteúdo: o texto **"Click me"**; nos tamanhos de ícone, um ícone de sinal de mais (+) de traço fino.
- Controles: variante (as sete; padrão selecionada) e tamanho (os seis; padrão selecionado).

## Acessibilidade e responsividade

- Botão nativo: foco, Enter/Espaço e desabilitado funcionam sem código extra. O anel só aparece no foco por teclado.
- Botões só com ícone precisam de nome acessível fornecido por quem usa.
- **Movimento reduzido**: recomendação — com `prefers-reduced-motion`, desativar a escala de hover e de pressão.
- Tamanho intrínseco ao conteúdo.

## Observações de fidelidade

- A referência não respeita movimento reduzido; a recomendação acima é uma melhoria.
- Recomendação: na variante destrutiva, o anel de foco usa a cor destrutiva; manter essa exceção.
