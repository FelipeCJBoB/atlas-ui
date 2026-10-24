# Especificação: Fundo de colmeia (hexagon)

## Propósito
Um fundo em grade de hexágonos (colmeia) que cobre toda a área. Ao passar o cursor, a célula sob ele acende na hora, ficando cinza com contorno mais escuro. Ao sair, o contorno se apaga lentamente (1 s), deixando um rastro sutil de hexágonos que acompanha o movimento do mouse.

## Aparência
- **Contêiner**:
  - 100% × 100% do pai, com posicionamento relativo e overflow oculto;
  - fundo `#f5f5f5` no claro e `#171717` no escuro. Essa cor aparece nas **frestas** entre as células e funciona como a cor das "linhas" da colmeia.
- **Célula**:
  - hexágono de **ponta para cima**, recortado de um retângulo de **L × 1,1 L** (padrão L = **75 px**, altura 82,5 px);
  - vértices em (50%, 0), (100%, 25%), (100%, 75%), (50%, 100%), (0, 75%) e (0, 25%);
  - é composta por duas camadas hexagonais:
    1. **camada externa** (hexágono inteiro): cor de repouso branco `#ffffff` (claro) / `#0a0a0a` (escuro);
    2. **camada interna**: o mesmo hexágono recuado de **M px** (padrão M = **3 px**) por todos os lados, com cor de repouso igual à da externa.
  - Em repouso, a célula parece um hexágono liso branco (ou quase preto), separado dos vizinhos por frestas na cor do fundo.
- **Célula em hover**:
  - camada externa (aparece como um **anel de M px**) em `#e5e5e5` (claro) / `#262626` (escuro);
  - camada interna em `#f5f5f5` (claro) / `#171717` (escuro).
- **Grade**:
  - linhas horizontais de hexágonos, com espaçamento horizontal de L + M entre células vizinhas;
  - linhas alternadas deslocadas em meia célula, para encaixar como colmeia;
  - sobreposição vertical das linhas de modo que as pontas de uma linha entrem nos "vales" da anterior, deixando frestas de cerca de M px;
  - a grade começa um pouco fora da borda esquerda e superior, para não deixar margem vazia.

## Comportamento
- **Hover numa célula**: anel e miolo mudam **instantaneamente** para as cores de hover.
- **Saída da célula**:
  - o **anel** volta à cor de repouso numa transição de **1000 ms** (easing padrão "ease"), criando o rastro;
  - o **miolo** volta à cor de repouso **imediatamente**.
  - O rastro visível é, portanto, um contorno cinza que some devagar em torno de um hexágono já branco.
- **Quantidade de células**: linhas = teto(altura ÷ passo vertical) e colunas = teto(largura ÷ L) + 1, calculadas a partir do tamanho da área e recalculadas quando ela muda.
- Não há animação contínua: o único movimento vem do hover.

## Técnica de renderização em alto nível
DOM + CSS puro: cada célula é um elemento com `clip-path` poligonal hexagonal e duas camadas (pseudo-elementos ou filhos), a interna com recuo e o mesmo recorte. Transições CSS controlam o rastro: duração 0 ao entrar, 1000 ms ao sair, só na camada externa. A geometria recomendada para a colmeia, com H = 1,1 L:
- passo horizontal: L + M;
- passo vertical: ~0,75 H + M;
- deslocamento das linhas ímpares: (L + M) ÷ 2.

Posicione as células com flex por linha e margens negativas, ou com posicionamento absoluto calculado. Com áreas grandes há muitas células (ex.: 1920 × 1080 ≈ 26 × 18 ≈ 470), o que ainda é aceitável em DOM.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Largura do hexágono (L; recomendado > 50) | px | 75 |
| Fresta entre células (M) | px | 3 |
| Classe/estilo extra das células | string / estilo | — |
| Cores (fundo, célula em repouso, anel e miolo em hover; claro/escuro) | cores CSS | ver Aparência |
| Duração do rastro | ms | 1000 |
| Conteúdo sobreposto | nós | nenhum |

## Demo
- Preenche toda a área de prévia (absoluto, inset 0) com raio de 14 px, conteúdo centralizado e sem filhos.
- Com o cursor parado no centro, a célula central aparece destacada.

## Acessibilidade e responsividade
- Decorativo: a grade deve ter `aria-hidden`. O conteúdo filho deve ficar acima da grade e permanecer interativo.
- Com `prefers-reduced-motion`, manter o destaque instantâneo, mas sem o rastro de 1 s (ou com rastro curto).
- Em toque não há hover. A grade aparece estática.
- Recalcular linhas e colunas pelo tamanho do **contêiner** (via `ResizeObserver`), não da janela.

## Observações de fidelidade
- Recomendação: a referência calcula o número de linhas e colunas pela **janela** inteira, não pelo contêiner. Em áreas pequenas, cria células demais (escondidas pelo overflow); em áreas maiores que a janela, faltam células. Use o tamanho do contêiner.
- Recomendação: a referência define a fresta como variável na raiz do documento (instâncias com frestas diferentes se sobrescrevem). Escope no contêiner.
- Recomendação: a referência encaixa as linhas com uma fórmula empírica de margem negativa e depende de linhas em bloco embutido, cuja altura de linha adiciona alguns pixels imprevisíveis. Use a geometria explícita indicada acima.
- O hexágono da referência é levemente achatado (altura 1,1 × largura, contra 1,155 de um hexágono regular). Mantenha 1,1 para fidelidade visual.
