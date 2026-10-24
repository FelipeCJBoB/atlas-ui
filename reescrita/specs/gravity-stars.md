# Especificação: Estrelas com Gravidade (gravity-stars)

## Propósito

Um fundo animado de "estrelas": pequenos pontos luminosos que flutuam devagar. Quando o ponteiro se aproxima, as estrelas próximas são puxadas (ou empurradas) por ele, ficam mais opacas e brilham mais. Opcionalmente, as estrelas podem colidir entre si.

## Aparência

- **Contêiner**
  - Ocupa 100% da largura e da altura do pai.
  - Posicionamento relativo.
  - O que fica fora dele é cortado.
- **Canvas**
  - Fica dentro do contêiner, preenche-o inteiro e se comporta como bloco.
  - O fundo é transparente: o fundo visível é o do contêiner ou da página.
- **Estrelas**
  - Círculos preenchidos, com raio sorteado uniformemente entre 1 px e (1 + tamanho) px. Com o tamanho padrão 2, o raio fica entre 1 e 3 px.
  - Cor: a **cor de texto** computada do contêiner, ou seja, a cor herdada do tema. Na falta dela, branco `#ffffff`.
  - Sobre um tema escuro, as estrelas são claras. Sobre um tema claro, são escuras.
- **Brilho**
  - Cada estrela tem um halo de sombra desfocada na mesma cor.
  - Raio de desfoque = intensidade de brilho × multiplicador de brilho da estrela × 2.
  - Com a intensidade padrão 15 e o multiplicador em repouso 1, o desfoque é de 30 px.
- **Opacidade**: cada estrela é desenhada com a própria opacidade. O valor base padrão é 0,75.

## Comportamento

### Ritmo

Toda a física é avançada **uma vez por quadro de animação do navegador**, sem correção por tempo decorrido. Os valores abaixo são por quadro.

### Inicialização

- São criadas N estrelas (padrão 75) em posições aleatórias uniformes na área.
- Cada estrela tem:
  - direção aleatória (0 a 360°);
  - velocidade escalar entre 50% e 100% da velocidade de movimento (padrão 0,3 px/quadro);
  - massa aleatória entre 0,5 e 1;
  - multiplicador de brilho 1.

### A cada quadro, para cada estrela

1. **Influência do ponteiro**
   - Calcula-se a distância até a última posição conhecida do ponteiro.
   - Se ela for menor que o raio de influência (padrão 100 px) e maior que zero, define-se uma intensidade com queda linear: 1 junto ao ponteiro e 0 na borda do raio.
   - A velocidade da estrela ganha um incremento na direção do ponteiro (modo atrair) ou na direção oposta (modo repelir). O incremento é proporcional à intensidade × força da gravidade / 1000. Com a força padrão 75, o máximo é 0,075 px/quadro² junto ao ponteiro.
   - A opacidade passa a ser a opacidade base + 0,4 × intensidade, com limite 1.
   - O alvo do multiplicador de brilho passa a ser 1 + 2 × intensidade, ou seja, até 3× junto ao ponteiro.
2. **Fora da influência**
   - A opacidade cai 0,02 por quadro até um piso de 30% da opacidade base.
   - Isso vale **também no estado inicial**: logo depois de começar, as estrelas que não estão perto do ponteiro esmaecem até 0,225 em cerca de meio segundo. Esse é o visual de repouso.
   - O alvo do brilho volta a 1.
3. **Animação do brilho** até o alvo, em um de três estilos:
   - **Instantâneo**: o multiplicador assume o alvo imediatamente.
   - **Suave** (padrão): interpolação exponencial em direção ao alvo, com fator 0,15 por quadro ao acender e 0,08 por quadro ao apagar. Ao apagar, o multiplicador nunca fica abaixo de 1.
   - **Mola**: o multiplicador tem uma velocidade própria.
     - Ao acender, a velocidade recebe 0,2 × (alvo − atual) e é amortecida por 0,85 a cada quadro.
     - Ao apagar, os fatores são 0,15 e 0,9, com piso 1.
     - O resultado ultrapassa levemente o alvo e oscila antes de assentar.
4. **Interação entre estrelas** (só com a opção ligada)
   - Para cada par de estrelas, há "contato" quando a distância entre centros é menor que a soma dos raios + 5 px.
   - **Modo quicar**
     - Se as estrelas estão se aproximando ao longo da linha que as une, aplica-se uma colisão elástica com troca de impulso ponderada pelas massas. A estrela mais leve é desviada mais.
     - Depois, ambas são afastadas igualmente, metade da sobreposição cada uma, para não ficarem grudadas.
     - Se já estão se afastando, nada acontece.
   - **Modo fundir**
     - Ambas ganham brilho extra proporcional à fração de sobreposição: até +0,5 no multiplicador, por quadro de contato.
     - Ambas se atraem mutuamente com uma força proporcional ao vetor que as separa × fração de sobreposição × 0,01.
     - O efeito são estrelas que se "colam" e brilham juntas.
5. **Integração**
   - A posição avança pela velocidade.
   - A velocidade recebe um ruído aleatório minúsculo, de ±0,0005 por eixo, para nunca ficar perfeitamente reta.
   - Em seguida a velocidade é multiplicada por 0,999, um atrito muito leve.
6. **Bordas**
   - O mundo dá a volta (toroidal).
   - Quem sai pela esquerda reaparece na direita e vice-versa. O mesmo vale para cima e baixo.

### Ponteiro

- Movimentos de mouse e de toque (primeiro dedo) sobre o contêiner atualizam a posição do ponteiro em coordenadas locais.
- **A posição não é limpa quando o ponteiro sai**: a última posição continua exercendo influência.
- Antes de qualquer movimento, a posição do ponteiro é o canto superior esquerdo (0, 0). Por isso as estrelas que passam nesse canto já sofrem influência.
- Para reproduzir fielmente, mantenha esse comportamento. Como melhoria opcional, desligue a influência fora do contêiner.

### Desenho

- A cada quadro o canvas é limpo e todas as estrelas são redesenhadas.
- A cor é relida do estilo computado a cada quadro. Por isso uma troca de tema reflete imediatamente.

### Redimensionamento

- O canvas acompanha o tamanho do contêiner, observado continuamente e também na mudança de tamanho da janela.
- A resolução interna é multiplicada pela densidade de pixels da tela, limitada entre 1 e 2, para ficar nítida.
- A cada redimensionamento, se as estrelas já existem, **todas são redistribuídas** em posições aleatórias na nova área. As velocidades são mantidas.

### Mudança de parâmetros em tempo real

- Mudar a opacidade base reinicia a opacidade de todas as estrelas no novo valor.
- Mudar a velocidade de movimento reescala a velocidade de cada estrela para exatamente esse valor, mantendo a direção.
- Mudar a quantidade de estrelas não recria o conjunto na referência: as estrelas existentes são mantidas. A reimplementação pode recriar.

## Técnica de renderização em alto nível

- É um sistema de partículas num canvas 2D com laço de animação contínuo.
- Cada partícula guarda posição, velocidade, raio, opacidade atual e base, massa, multiplicador de brilho e, no modo mola, a velocidade do brilho.
- O ponteiro age como um poço (ou pico) de potencial de alcance limitado, com força de **queda linear com a distância** dentro do raio e zero fora dele.
- As colisões, quando ligadas, são verificadas entre todos os pares (custo quadrático) e resolvidas por impulso elástico com massas, ou por atração mútua de curto alcance.
- O brilho usa a sombra desfocada nativa do canvas, na cor da estrela.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Quantidade de estrelas | inteiro | 75 |
| Variação de tamanho: raio = 1 + aleatório × este valor, em px | número | 2 |
| Opacidade base das estrelas | número de 0 a 1 | 0,75 |
| Intensidade do brilho (escala o desfoque da sombra) | número | 15 |
| Estilo de transição do brilho: instantâneo, suave ou mola | enumeração | suave |
| Velocidade de deriva inicial, em px por quadro | número | 0,3 |
| Raio de influência do ponteiro, em px | número | 100 |
| Sentido da força do ponteiro: atrair ou repelir | enumeração | atrair |
| Intensidade da gravidade do ponteiro (dividida por 1000 internamente) | número | 75 |
| Ativar interação entre estrelas | booleano | falso |
| Tipo de interação: quicar ou fundir | enumeração | quicar |
| Classe, estilo e atributos extras do contêiner | — | repassados |

## Demo

- O fundo ocupa toda a área da prévia: posicionamento absoluto com recuo zero.
- Cantos arredondados de 12 px.
- Conteúdo centralizado nos dois eixos, mas sem nenhum conteúdo além das estrelas.
- Todos os parâmetros ficam no padrão.
- A cor vem do tema da prévia: estrelas claras no tema escuro e escuras no claro, sobre o fundo da própria área de prévia.
- Para ver o efeito, mova o mouse sobre a área. As estrelas se juntam em torno do cursor e brilham mais.

## Acessibilidade e responsividade

- **Leitores de tela**: é decorativo. O canvas deve ficar oculto para tecnologias assistivas e não deve receber foco.
- **Movimento reduzido**: recomenda-se, sob preferência de movimento reduzido, congelar o movimento ou reduzi-lo muito, por exemplo zerando a deriva e a influência do ponteiro. A referência não faz isso.
- **Responsividade**
  - Adapta-se a qualquer tamanho do contêiner e é nítido em telas de alta densidade (até 2×).
  - Funciona com toque (arrastar o dedo).
- **Desempenho**
  - O laço roda continuamente, mesmo sem interação.
  - Considere pausá-lo quando o componente estiver fora da tela ou a aba estiver oculta.
  - Com a interação entre estrelas ligada, o custo cresce com o quadrado da quantidade.
