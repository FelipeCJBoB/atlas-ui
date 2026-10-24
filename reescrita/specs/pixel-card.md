# Especificação: Cartão de Pixels (pixel-card)

## Propósito

Um cartão que reage à passagem do ponteiro (ou ao foco do teclado) com uma onda de pequenos quadrados coloridos. Os quadrados surgem do centro para as bordas e depois ficam "cintilando". Quando o ponteiro sai, os quadrados encolhem até sumir.

## Aparência

- **Caixa do cartão**
  - Retângulo de 300 px de largura por 400 px de altura.
  - Cantos com raio de 25 px.
  - Borda sólida de 1 px na cor `#27272a`. A cor pode ser trocada por uma variável CSS de tema.
  - Fundo transparente. O fundo também pode ser trocado por variável CSS.
  - O conteúdo que estiver fora da caixa fica cortado.
  - O cartão cria o próprio contexto de empilhamento (isolado), para que as camadas internas não se misturem com a página.
  - O texto dentro do cartão não pode ser selecionado.
  - Os filhos ficam centralizados nos dois eixos, numa grade de uma célula.
- **Camada de superfície (canvas)**: ocupa 100% da largura e da altura do cartão e fica atrás do conteúdo. É nela que os quadrados são desenhados.
- **Halo radial de fundo**
  - Camada decorativa que ocupa a área inteira do cartão, abaixo do canvas.
  - É um quadrado centralizado com lado igual à largura do cartão, ou seja, 300 × 300 centralizado na vertical.
  - Contém um gradiente radial circular que vai de `#09090b` no centro até transparente aos 85% do raio.
  - A cor do halo pode ser trocada por variável CSS de tema.
  - Opacidade inicial 0.
- **Quadrados ("pixels")**
  - São quadrados preenchidos, sem borda e sem arredondamento.
  - Ficam numa grade regular com passo de N px nos dois eixos. N é o espaçamento, e a grade começa no canto superior esquerdo (0, 0).
  - Cada quadrado ocupa uma "célula" virtual de 2 × 2 px e é desenhado centralizado nela. Por isso o lado varia de 0 a 2 px, sempre a partir do centro da célula.
  - A cor de cada quadrado é sorteada uma única vez, de forma uniforme, entre as cores da paleta.
- **Variantes prontas** (espaçamento em px, velocidade de 0 a 100, paleta e cor de destaque):

| Variante | Espaçamento | Velocidade | Paleta | Destaque | Reage a foco? |
|---|---|---|---|---|---|
| Padrão | 5 | 35 | `#f8fafc`, `#f1f5f9`, `#cbd5e1` | nenhum | sim |
| Azul | 10 | 25 | `#e0f2fe`, `#7dd3fc`, `#0ea5e9` | `#e0f2fe` | sim |
| Amarelo | 3 | 20 | `#fef08a`, `#fde047`, `#eab308` | `#fef08a` | sim |
| Rosa | 6 | 80 | `#fecdd3`, `#fda4af`, `#e11d48` | `#fecdd3` | não |

Observação de fidelidade: na referência, a "cor de destaque" de cada variante faz parte da configuração, mas não é aplicada a nada. O halo continua sempre `#09090b`, a não ser que a variável CSS seja sobrescrita por fora. A reimplementação pode, opcionalmente, usar a cor de destaque no halo. Para reproduzir o visual exato, mantenha o halo em `#09090b`.

## Comportamento

### Estados do cartão

1. **Repouso**: canvas vazio e halo invisível.
2. **Aparecendo**: começa quando o ponteiro entra no cartão ou quando o foco entra nele vindo de fora.
3. **Cintilando**: cada quadrado que atingiu o tamanho máximo passa a oscilar.
4. **Sumindo**: começa quando o ponteiro sai ou quando o foco sai para fora do cartão. Mover o foco entre elementos internos não conta.
5. Quando todos os quadrados chegam a tamanho zero, o laço de animação para por completo. Não fica nenhum quadro rodando à toa.

Uma nova entrada ou saída cancela o laço em curso e começa outro. Cada quadrado guarda o próprio tamanho atual, então a animação continua a partir de onde estava, sem salto.

### Halo

O halo vai para opacidade 1 quando o cartão está sob o ponteiro ou tem foco interno, e volta a 0 quando deixa de estar. A transição dura 800 ms, com curva cúbica de Bézier (0.5, 1, 0.89, 1), que é uma desaceleração rápida, do tipo "ease-out" acentuado.

A borda tem uma transição de cor de 200 ms com a mesma curva. Na referência, porém, nenhuma regra muda a cor da borda no hover, então visualmente nada acontece.

### Ritmo

- O laço roda no ritmo de quadros do navegador, limitado a cerca de 60 atualizações por segundo. Em telas de 120 Hz, os quadros excedentes são pulados.
- Todos os incrementos abaixo são **por atualização**, não por segundo.

### Cada quadrado ao aparecer

- **Atraso em onda**
  - Cada quadrado tem um atraso igual à sua distância euclidiana, em pixels, até o centro do cartão.
  - Um contador interno do quadrado avança a cada atualização. O passo do contador é um valor aleatório entre 0 e 4, somado a 1% da soma largura + altura do cartão. No cartão de 300 × 400, o passo fica entre 7 e 11.
  - O quadrado só começa a crescer quando o contador ultrapassa o atraso.
  - O efeito é uma frente circular que se expande do centro e chega aos cantos em cerca de meio segundo. Como o passo é aleatório por quadrado, a borda da frente fica levemente irregular.
- **Crescimento**: o lado cresce a cada atualização por um passo próprio, sorteado entre 0 e 0,4 px. Alguns quadrados crescem muito devagar, o que é desejável porque dá textura. O crescimento vai até um tamanho máximo próprio, sorteado entre 0,5 e 2 px.
- **Cintilação**
  - Depois de atingir o máximo, o quadrado oscila entre 0,5 px e o seu máximo: encolhe até 0,5 px e cresce até o máximo, indefinidamente.
  - A velocidade da oscilação é a velocidade da variante dividida por 1000 e multiplicada por um fator aleatório entre 0,1 e 0,9. Exemplo: com velocidade 35, a variação fica entre 0,0035 e 0,0315 px por atualização.
  - Velocidades acima de 100 são tratadas como 100. Velocidades menores ou iguais a 0 resultam em zero, e o quadrado fica parado.

### Cada quadrado ao sumir

- Não há atraso em onda: todos começam a encolher ao mesmo tempo.
- O lado diminui 0,1 px por atualização até chegar a zero ou menos. Daí o quadrado fica ocioso e deixa de ser desenhado.
- O contador de atraso é zerado, então a próxima entrada repete a onda desde o centro.

### Redimensionamento

- Toda vez que o tamanho do cartão muda (observado continuamente), ou que algum parâmetro muda, a grade inteira é reconstruída. Os novos quadrados começam com tamanho zero.
- O canvas é dimensionado em pixels CSS inteiros: largura e altura arredondadas para baixo. Não há compensação de densidade de tela, por isso os quadrados podem ficar levemente borrados em telas de alta densidade. Isso faz parte do visual de referência.

### Movimento reduzido

Se o usuário prefere movimento reduzido, nenhum quadrado tem atraso (todos crescem juntos) e a velocidade de cintilação é zero. Os quadrados crescem até o tamanho máximo e ficam estáticos.

## Técnica de renderização em alto nível

- **Desenho**
  - Usa um canvas 2D posicionado sob o conteúdo.
  - Cada quadrado é um pequeno objeto de estado com: posição na grade, cor, tamanho atual, tamanho máximo, passo de crescimento, velocidade de oscilação, atraso, contador e sentido da oscilação.
  - A cada atualização do laço de animação, o canvas inteiro é limpo e cada quadrado avança um passo da fase atual (aparecer ou sumir). Em seguida, o quadrado se desenha como retângulo preenchido.
  - O laço termina sozinho quando todos os quadrados estão ociosos.
- **Halo**: é feito só com CSS, numa camada decorativa com gradiente radial e transição de opacidade, ativada por hover ou por foco interno.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Variante pronta (padrão, azul, amarelo, rosa) que define os demais valores | enumeração | padrão |
| Espaçamento da grade de quadrados, em px | número inteiro | depende da variante (5 no padrão) |
| Velocidade da cintilação, de 0 a 100 (menor é mais lento) | número | depende da variante (35 no padrão) |
| Paleta de cores dos quadrados (lista de cores CSS) | lista de strings | depende da variante |
| Desativar a reação ao foco do teclado (o cartão também deixa de ser focável) | booleano | falso (verdadeiro na variante rosa) |
| Classe CSS extra no contêiner | string | vazio |
| Estilo inline do contêiner | objeto | vazio |
| Conteúdo interno | nó React | nenhum |

Quando um valor explícito é passado, ele tem prioridade sobre o da variante.

## Demo

- **Área de prévia**: 500 px de altura, conteúdo cortado nas bordas e cartão centralizado.
- **Conteúdo do cartão**
  - Texto "Hover Me.", centralizado nos dois eixos por uma camada absoluta que ocupa o cartão todo.
  - Tamanho de fonte 48 px (3rem), peso 600, texto não selecionável.
  - Cor do texto: `#18181b` no tema claro e `#f4f4f5` no tema escuro.
- **Paletas por tema**: o demo passa paletas explícitas de acordo com o tema.
  - Tema escuro: usa as paletas da tabela acima.
  - Tema claro, em tons escuros:
    - padrão: `#18181b`, `#52525b`, `#a1a1aa`
    - azul: `#0c4a6e`, `#0369a1`, `#0284c7`
    - amarelo: `#713f12`, `#a16207`, `#ca8a04`
    - rosa: `#831843`, `#be123c`, `#e11d48`
- **Controle**: um seletor de variante com as opções Default, Yellow, Blue e Pink, com 150 px de largura.

## Acessibilidade e responsividade

- **Foco**
  - Por padrão o cartão é focável pelo teclado (entra na ordem de tabulação). O foco dispara a mesma animação do hover.
  - Com a reação ao foco desativada, o cartão sai da ordem de tabulação. O halo ainda aparece se um elemento interno focável receber foco, porque essa parte é só CSS.
  - Não há anel de foco próprio. Se for adicionado, recomenda-se aparecer só na navegação por teclado.
- **Movimento reduzido**: deve ser respeitado (ver Comportamento).
- **Canvas**: é puramente decorativo e deve ficar oculto para tecnologias assistivas.
- **Tamanho**
  - O tamanho fixo de 300 × 400 pode ser sobrescrito por classe ou estilo.
  - A grade se adapta a qualquer tamanho por causa da observação de redimensionamento.
  - O número de quadrados cresce com a área dividida pelo quadrado do espaçamento. Com espaçamento 3 num cartão grande, o custo pode ser alto. Considere esse limite.
