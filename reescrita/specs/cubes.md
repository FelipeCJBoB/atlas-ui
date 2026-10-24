# Especificação: Grade de cubos inclináveis (cubes)

## Propósito
Uma grade quadrada de cubos 3D vistos de frente. Os cubos perto do ponteiro inclinam-se em X e Y, com intensidade maior no centro e decrescente com a distância, formando uma "onda" de rotação que segue o cursor. Clicar dispara uma onda de cor que se espalha em anéis a partir do cubo clicado. Sem interação, um ponto invisível passeia sozinho pela grade.

## Aparência
- **Invólucro**: posicionamento relativo, **50% da largura** do pai (**90%** abaixo de 768 px), proporção 1:1 e altura automática. Se um lado fixo de cubo for informado, o invólucro mede exatamente N × lado em largura e altura.
- **Cena**: grade de N × N células (padrão do componente **10**; demo **8**), ocupando 100% do invólucro.
  - Colunas e linhas em frações iguais, ou com o lado fixo em px.
  - Espaçamento entre células de **5%** em cada eixo, ou em px, se informado (um valor único ou separado por coluna e linha).
  - **Perspectiva praticamente infinita**: o efeito é de projeção quase ortográfica, em que as faces laterais aparecem como paralelogramos sem convergência.
- **Cubo**: preenche a célula, com proporção 1:1 e preservação do espaço 3D para os filhos. Uma área invisível estende a zona sensível ao ponteiro **36 px** além de cada lado do cubo.
- **Faces** (6 por cubo):
  - cada face é um quadrado do tamanho da célula, com fundo na cor da face (padrão **`#120F17`**), borda configurável (padrão **1 px sólida `#fff`**) e opacidade 1;
  - posição: a face superior é deslocada meia aresta para cima e girada 90° no eixo X; a inferior, meia aresta para baixo e −90° em X; a esquerda, meia aresta para a esquerda e −90° no eixo Y; a direita, meia aresta para a direita e +90° em Y; a frontal, meia aresta para a frente no eixo Z. O resultado é um cubo com profundidade igual à aresta;
  - **sombra das faces** (opcional): `0 0 6px rgba(0,0,0,.5)` quando ativada, ou um valor de sombra CSS livre (ver Observações).
- Em repouso, vê-se só a face frontal: uma grade plana de quadrados com borda.

## Comportamento
### Inclinação por proximidade
- O ponteiro, convertido para **unidades de célula**, gera coluna = X local ÷ (largura ÷ N) e linha = Y local ÷ (altura ÷ N), em valores contínuos.
- Para cada cubo de índices inteiros (linha, coluna), calcula-se a distância euclidiana até o ponto contínuo do ponteiro.
  - **Dentro do raio** (padrão **3** células): intensidade = 1 − distância ÷ raio; ângulo = intensidade × ângulo máximo (padrão **45°**). O cubo anima até rotação X = **−ângulo** e rotação Y = **+ângulo**. Ou seja, inclina a face frontal para cima e para a direita, mostrando as faces inferior e esquerda. A animação dura **0,3 s**, com easing cúbico de desaceleração por padrão, e substitui qualquer animação em curso do cubo.
  - **Fora do raio**: volta a rotação 0/0 em **0,6 s**, com easing cúbico de desaceleração, também substituindo a animação em curso.
- Os cálculos são agrupados em no máximo um por quadro.
- **Saída do ponteiro**: todos os cubos voltam a 0/0 em 0,6 s.

### Ociosidade e movimento automático (ligado por padrão)
- Cada movimento do ponteiro marca o usuário como "ativo" e reinicia um temporizador de **3 s**. Quando ele expira, o usuário volta a "inativo".
- Enquanto inativo, um ponto simulado (em unidades de célula) persegue um alvo aleatório dentro da grade, aproximando-se **2% da distância por quadro**. A cada quadro, aplica a inclinação nesse ponto. Quando chega a menos de **0,1 célula** do alvo, sorteia um novo alvo.
- Isso cria uma ondulação que passeia sem parar pela grade.

### Onda de cor ao clicar (ligada por padrão)
- O clique identifica a célula atingida, com coluna e linha inteiras (arredondadas para baixo).
- Os cubos são agrupados em **anéis** pela distância euclidiana até essa célula, arredondada ao inteiro mais próximo.
- Com a velocidade da onda v (padrão **2**):
  - atraso por anel = 0,15 ÷ v s (**75 ms**);
  - duração da transição de cor = 0,3 ÷ v s (**150 ms**);
  - tempo de permanência = 0,6 ÷ v s (**300 ms**).
- O anel k começa após k × atraso: todas as faces dos seus cubos mudam para a cor da onda (padrão **`#fff`**) com easing cúbico de desaceleração. Depois do atraso + duração + permanência, voltam à cor da face com a mesma duração.
- O efeito é um anel de cor que se expande a partir do clique e se apaga atrás de si.

### Toque
- Arrastar o dedo funciona como o movimento do ponteiro e **bloqueia a rolagem da página** sobre a grade.
- Ao soltar, todos os cubos voltam a 0/0.

## Técnica de renderização em alto nível
DOM + **CSS 3D transforms**: cada cubo é um elemento com preservação de 3D e seis faces posicionadas por translações e rotações. As rotações X/Y de cada cubo são animadas por tweens com easing (biblioteca de tweens ou Web Animations com cancelamento e substituição). A cor das faces é animada por transição de cor de fundo com atrasos escalonados por anel. Um laço de `requestAnimationFrame` cuida do movimento automático.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Número de células por lado | inteiro | 10 |
| Lado fixo de cada cubo (opcional) | número (px) | automático |
| Ângulo máximo de inclinação | número (graus) | 45 |
| Raio de influência | número (células) | 3 |
| Easing da inclinação | curva | cúbica de desaceleração |
| Durações de entrada e de retorno | objeto (s) | 0,3 / 0,6 |
| Espaçamento entre células | número (px) ou {coluna, linha} | 5% |
| Borda das faces | string de borda CSS | `1px solid #fff` |
| Cor das faces | string de cor | `#120F17` |
| Sombra das faces | booleano ou string de sombra CSS | desligada |
| Movimento automático quando ocioso | booleano | verdadeiro |
| Onda de cor ao clicar | booleano | verdadeiro |
| Cor da onda | string de cor | `#fff` |
| Velocidade da onda | número | 2 |

## Demo
- Área de prévia com **650 px de altura**, overflow oculto e fundo do tema. A grade fica centralizada (50% da largura da prévia, quadrada).
- Valores da demo:
  - 8 células por lado;
  - ângulo máximo de 45° e raio de 3;
  - movimento automático e onda de cor ligados;
  - borda **`2px dashed #B497CF`** (lilás tracejado) no tema escuro e `2px dashed #a1a1aa` no claro;
  - cor das faces `#120F17` no escuro e `#ffffff` no claro;
  - cor da onda `#ffffff` no escuro e `#52525b` no claro.
- Controles:
  - estilo de borda, com as opções pontilhada branca de 2 px, tracejada lilás de 2 px e sólida branca de 3 px;
  - células de 6 a 12;
  - ângulo máximo de 15° a 180° (passo 5);
  - raio de 1 a 5;
  - movimento automático (liga/desliga);
  - onda de cor (liga/desliga).

## Acessibilidade e responsividade
- Decorativo: marcar a grade como `aria-hidden`. A interação de clique não deve ser a única forma de acessar alguma função.
- **Recomendação**: com `prefers-reduced-motion`, desligar o movimento automático e reduzir ou remover a inclinação.
- Pausar o laço automático quando a grade estiver fora da tela ou a aba estiver oculta.
- O bloqueio de rolagem no toque pode prender o usuário em telas pequenas. **Recomendação**: só bloquear quando o gesto for predominantemente horizontal, ou desativar a inclinação por toque.
- O número de elementos é 6 × N². Com N = 12 são 864 faces. Para grades maiores, considerar renderizar só as faces visíveis (frontal + as duas laterais que aparecem com a rotação usada).

## Observações de fidelidade
- A face **traseira** recebe a mesma transformação da frontal e fica sobreposta a ela, de modo que não há face traseira real. Com rotações pequenas isso não aparece; com ângulos altos (até 180°), o cubo parece "oco". Recomendação: posicionar a face traseira meia aresta para trás no eixo Z.
- A opção de **sombra** não tem efeito na referência: o valor é calculado, mas não é aplicado às faces. Recomendação: aplicar o valor como sombra das faces.
- A distância usa os índices inteiros dos cubos contra a posição contínua do ponteiro. Com isso, o centro da onda fica deslocado meia célula para cima e para a esquerda do cursor. Recomendação: medir a partir do centro da célula (índice + 0,5).
- A conversão do ponteiro em células divide o tamanho total por N, ignorando os espaçamentos. Aceitável. Manter ou compensar.
