# Especificação: Botão que vira (flip)

## Propósito

Um botão com duas faces, "frente" e "verso", empilhadas no mesmo lugar. Quando o ponteiro passa por cima, a frente gira 90° em 3D e some, enquanto o verso gira de 90° para 0° e aparece, como uma placa que tomba. Cada face tem a própria variante visual e o próprio tamanho de botão.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Secundária / destaque | `#f5f5f5` | `#262626` |
| Texto sobre secundária / destaque | `#171717` | `#fafafa` |
| Destrutiva | `#e7000b` | `#ff6467` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Contêiner (o botão de fato)

- Grade em linha com uma única célula; os itens centralizados nos dois eixos.
- **Perspectiva de 1000 px** aplicada aos filhos (para o giro ter profundidade).
- Sem fundo, borda ou padding próprios; o tamanho é o da maior face.

### Faces

- As duas faces ocupam a mesma célula da grade (sobrepostas) e são caixas em linha flexíveis com conteúdo centralizado.
- Cada face tem a aparência completa de um botão:
  - espaço de 8 px entre ícone e texto, sem quebra, cantos de **8 px**, texto **14 px** peso **500**, ícones de 16 px;
  - sombra extra-sutil `0 1px 2px 0 rgb(0 0 0 / 0.05)` quando a variante indica.

| Variante | Fundo | Texto | Borda | Hover (da face) |
|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | primária com 90% |
| Destaque | destaque | texto sobre destaque | — | destaque com 90% |
| Destrutiva | destrutiva (escuro 60%) | branco | — | destrutiva com 90% |
| Contorno | fundo da página (escuro: `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: campo) | fundo destaque (escuro: `rgba(255,255,255,0.075)`) |
| Secundária | secundária | texto sobre secundária | — | secundária com 80% |
| Fantasma | transparente | herdado | — | fundo destaque (escuro 50%) |
| Link | transparente | primária | — | sublinhado com afastamento de 4 px |

| Tamanho | Dimensões | Padding horizontal (12/10/16 px se o filho direto for ícone) |
|---|---|---|
| Padrão | altura 36 px | 16 px |
| Pequeno | altura 32 px, espaço 6 px | 12 px |
| Grande | altura 40 px | 24 px |
| Ícone | 36 × 36 px | — |
| Ícone pequeno | 32 × 32 px | — |
| Ícone grande | 40 × 40 px | — |

- A variante e o tamanho podem ser definidos no contêiner (valem para as duas faces) e sobrescritos em cada face.

## Comportamento

### Direção do giro

Configurável: **de cima** (padrão), de baixo, da esquerda ou da direita.

- Cima/baixo: giro em torno do eixo **horizontal** (X) e deslocamento vertical.
- Esquerda/direita: giro em torno do eixo **vertical** (Y) e deslocamento horizontal.

### Estados de cada face

Considere a direção "de cima" (as demais são análogas, trocando sinais/eixo):

| Face | Repouso | Hover |
|---|---|---|
| Frente | opacidade 1, giro 0°, deslocamento 0% | opacidade 0, giro **90°**, deslocamento **+50%** da própria altura (para baixo) |
| Verso | opacidade 0, giro 90°, deslocamento **−50%** (para cima) | opacidade 1, giro 0°, deslocamento 0% |

- Direção "de cima" ou "da esquerda": a frente sai com +50% e o verso entra vindo de −50%.
- Direção "de baixo" ou "da direita": os sinais se invertem (frente sai com −50%, verso vem de +50%).
- O verso parece "cair" de cima para o lugar enquanto a frente tomba para baixo.

### Animação

- Todas as propriedades (opacidade, giro, deslocamento) de cada face usam uma **mola** de rigidez **280**, amortecimento **20**, massa 1 — com leve oscilação no fim.
- Ao sair do hover, tudo volta ao repouso com a mesma mola, partindo do estado atual.
- **Pressionar** o contêiner: escala **0,95** (mola rápida de rigidez 550, amortecimento 30). Não há escala de hover.
- No primeiro render, as faces já estão no estado de repouso (sem animação de entrada).

## Técnica de renderização em alto nível

- Um botão nativo com grade de célula única e perspectiva; dentro, dois elementos de texto em linha animados por mola com transformações 3D (rotação X ou Y + translação) e opacidade.
- Estado de hover propagado do contêiner para as faces (variantes nomeadas "repouso"/"hover").
- Um contexto compartilha direção, eixo e variante/tamanho padrão entre contêiner e faces.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Direção de onde o verso vem (cima, baixo, esquerda, direita) | enumeração | cima |
| Escala ao pressionar | número | 0,95 |
| Variante e tamanho padrão das faces (no contêiner) | enumerações | padrão / padrão |
| Variante e tamanho próprios de cada face | enumerações | herdam do contêiner |
| Mola de cada face (rigidez, amortecimento) | objeto | 280 / 20 |
| Conteúdo de cada face; classe, estilo e atributos | — | repassados |
| Renderizar como filho (contêiner ou face) em vez de elemento próprio | booleano | falso |

## Demo

- Um botão centralizado.
- **Frente**: variante **destaque**, tamanho padrão, texto **"Front Button"**.
- **Verso**: variante **padrão**, tamanho padrão, texto **"Back Button"**.
- Em tamanho de ícone, a face mostra um ícone de sinal de mais (+).
- Controles: variante e tamanho da frente (destaque/padrão selecionados) e do verso (padrão/padrão); tamanhos do verso limitados a padrão, pequeno, grande e ícone.

## Acessibilidade e responsividade

- O contêiner é o botão nativo; o nome acessível vem do texto das duas faces somado. Recomendação: esconder a face invisível das tecnologias assistivas ou dar um nome acessível explícito ao botão.
- Recomendação: acionar o giro também no foco por teclado (`:focus-visible`) e exibir anel de foco **no contêiner** (3 px na cor do anel com 50%).
- Movimento reduzido: recomendação — trocar as faces com um simples esmaecimento, sem giro.
- Tamanho intrínseco ao conteúdo.

## Observações de fidelidade

- **Recomendação — foco**: na referência, os estilos de foco estão nas faces (que não recebem foco), então o botão não mostra anel algum ao receber foco por teclado. Corrigir pondo o anel no contêiner.
- **Recomendação — desabilitado**: o visual de desabilitado também está nas faces e não se aplica quando o contêiner é desabilitado; aplicar 50% de opacidade ao contêiner nesse caso.
- Se as faces têm tamanhos diferentes, a menor fica centralizada na célula da maior; isso é esperado.
