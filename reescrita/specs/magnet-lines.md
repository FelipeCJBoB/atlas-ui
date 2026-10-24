# Especificação: Linhas magnéticas (magnet-lines)

## Propósito
Uma grade de pequenos traços (como limalha de ferro) que giram para acompanhar o ponteiro. Cada traço se orienta em relação à posição do cursor, formando um campo de orientação que muda instantaneamente quando o ponteiro se move.

## Aparência
- **Contêiner**:
  - grade CSS com C colunas e L linhas de mesmo tamanho (padrões **9 × 9**);
  - itens centralizados em cada célula, nos dois eixos;
  - quadrado, com lado configurável como string CSS (padrão **80vmin**);
  - aceita classe e estilo extras.
- **Traço**:
  - um retângulo em bloco, sem raio;
  - largura padrão **1vmin** e altura padrão **6vmin**, ou seja, um traço vertical fino;
  - cor sólida (padrão **`#efefef`**, cinza muito claro);
  - origem de transformação no centro;
  - girado por um ângulo em graus.
- Quantidade total: L × C traços.

## Comportamento
- **Ângulo inicial**: todos os traços recebem um ângulo base (padrão **−10°**) no primeiro render.
- **Logo após a montagem**, os traços são reorientados como se o ponteiro estivesse no **canto superior esquerdo do traço do meio**. O traço do meio é o de índice ⌊total ÷ 2⌋, em ordem de leitura. Na prática, o ângulo base só aparece num instante antes desse ajuste.
- **Movimento do ponteiro** (escuta global na janela, eventos de ponteiro): para cada traço, mede-se o centro na tela e calcula-se o ângulo do vetor que vai do centro do traço até o ponteiro. Esse ângulo é medido a partir do eixo +X, em sentido horário na tela, porque Y cresce para baixo, e vai de −180° a 180°. O traço é girado exatamente por esse ângulo.
  - Como o traço em repouso é vertical, o resultado é que **cada traço fica perpendicular à direção do ponteiro**, ou seja, tangente a círculos centrados no cursor. O conjunto forma um padrão de "redemoinho" concêntrico em volta do ponteiro.
  - A mudança é **instantânea**, sem transição nem suavização.
- Um traço exatamente sob o ponteiro (distância zero) não gera divisão por zero: a distância é tratada como 1.
- O ouvinte é recriado quando muda o número de linhas ou de colunas.

## Técnica de renderização em alto nível
DOM e CSS. A grade é um grid CSS de elementos simples. A rotação é aplicada por uma propriedade customizada de CSS lida pela transformação de cada traço. Um ouvinte global de movimento do ponteiro percorre todos os traços, mede o retângulo de cada um e atualiza a rotação diretamente no estilo, sem re-render do React. Recomenda-se agrupar as atualizações num único quadro de animação por evento, ou ler as posições uma vez e só recalcular em scroll ou resize, para evitar ler o layout a cada movimento.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Número de linhas | inteiro | 9 |
| Número de colunas | inteiro | 9 |
| Lado do contêiner | string CSS | `80vmin` |
| Cor dos traços | cor CSS | `#efefef` |
| Espessura do traço | string CSS | `1vmin` |
| Comprimento do traço | string CSS | `6vmin` |
| Ângulo inicial | número (graus) | −10 |
| Classe e estilo extras | string / objeto | vazios |

## Demo
- Área de prévia em flex, com conteúdo centralizado, overflow oculto, padding inferior de 1em e fundo escuro do site.
- Valores da demo:
  - **10 linhas × 12 colunas**;
  - contêiner de **40vmin**;
  - traço de **2 px × 30 px**;
  - ângulo base de −10°;
  - cor `#efefef` no tema escuro. No tema claro, enquanto a cor estiver no padrão, usa **`#52525b`**.
- Controles: linhas de 3 a 20; colunas de 3 a 20; ângulo base de −180 a 180 (passo 5); cor. As mudanças são aplicadas ao vivo.

## Acessibilidade e responsividade
- Decorativo: marcar o contêiner como oculto para leitores de tela.
- **Recomendação**: com `prefers-reduced-motion`, manter os traços no ângulo base e ignorar o ponteiro.
- Em telas de toque, os traços só reagem durante o toque ou arraste. Isso é aceitável.
- Unidades em vmin fazem a grade escalar com a viewport. Com unidades fixas, a grade não se adapta.

## Observações de fidelidade
- O ajuste inicial usa o canto superior esquerdo do traço do meio, não o centro dele. Por isso a orientação inicial é levemente assimétrica. **Recomendação**: usar o centro do contêiner como ponteiro virtual inicial ou, se o ângulo base for desejado, mantê-lo até o primeiro movimento real. Documentar a escolha.
- O ângulo base passado como parâmetro praticamente nunca fica visível na referência.
