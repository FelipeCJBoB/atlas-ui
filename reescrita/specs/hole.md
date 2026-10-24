# Especificação: Fundo de buraco/túnel (hole)

## Propósito
Um fundo atmosférico que sugere um **poço ou funil visto em perspectiva**: elipses concêntricas descem continuamente para um ponto de fuga na parte de baixo, guias radiais desenham as "paredes" do funil e pequenas partículas sobem e se espalham, como faíscas escapando do buraco. Por cima, um feixe de luz colorido e desfocado desce do topo com as cores percorrendo-o, junto com uma vinheta e um brilho violeta. O conjunto é sutil (desenho em baixa opacidade) e serve de pano de fundo para um título.

## Aparência
Camadas, de baixo para cima:
1. **Vinheta**:
   - elemento de **140% × 140%** do contêiner, centralizado;
   - degradê radial elíptico centrado em (50%, 55%): transparente até 10% e opaco a partir de 50%;
   - cor opaca: **branco** no claro e **preto** no escuro.
   - Funciona como fundo: centro "aberto" e bordas na cor do tema.
2. **Conteúdo filho** (opcional).
3. **Superfície de desenho do túnel** (2D), cobrindo tudo, com **opacidade 0,1** no claro e **0,2** no escuro. Traços cinza **`#737373`** de **2 px**.
4. **Feixe de luz** (camada 3):
   - retângulo de **30%** da largura por **140%** da altura, centralizado na horizontal, com o topo em **−71,5%** (a maior parte acima da área; só a ponta inferior arredondada aparece);
   - base totalmente arredondada (semicírculo), **desfoque de 64 px** e opacidade **0,75**;
   - mistura "mais escuro" (*plus-darker*) no claro e "mais claro" (*plus-lighter*) no escuro;
   - fundo: degradê linear a **20°** com paradas: ciano `#00f8f1` (0%) → âmbar `#ffbd1e` translúcido (16,5%) → coral `#fe848f` (33%) → coral translúcido (49,5%) → ciano (66%) → ciano semitransparente (85,5%) → âmbar (100%);
   - transparências no claro: 25% nas paradas translúcidas e 50% no ciano semitransparente; no escuro: 12,5% e 37,5%;
   - o degradê ocupa **100% × 200%** do elemento.
5. **Brilho violeta** (camada 5): 100% × 100%, centralizado, com degradê radial elíptico centrado em (50%, 75%): **`#a900ff`** até 20% e transparente a 75%, em mistura **overlay**.
6. **Linhas de varredura** (camada 7, **só no tema escuro**): listras horizontais repetidas com período de 2 px (1 px transparente, 1 px branco), em mistura overlay e opacidade **0,5**, como textura de monitor CRT.

**Desenho do túnel**, com W × H como tamanho da área:
- **Elipse de abertura** (fixa): centro (0,5 W; 0,45 H), raios (0,75 W; 0,7 H). É maior que a área na horizontal, então só os arcos aparecem.
- **Elipse de fuga**: centro (0,5 W; 0,95 H), raio 0.
- **50 elipses intermediárias**, cada uma num parâmetro p ∈ [0, 1):
  - centro x e raios interpolados **linearmente** entre a abertura e a fuga;
  - centro y interpolado com easing **exponencial de entrada** (2^(10(p−1))). A elipse fica perto do centro da abertura enquanto encolhe e só no fim mergulha até o ponto de fuga.
  - Desenham-se apenas **1 a cada 5** (10 elipses visíveis), além da abertura.
- **Borda do poço (máscara)**: entre as elipses iniciais, a borda é a última cuja base (centro y + raio vertical) ainda está subindo em relação à anterior, ou seja, a elipse com a base mais alta. A máscara é a união dessa elipse com o retângulo que vai do topo da área até o centro dela, na largura do diâmetro. Elipses menores que essa borda (com 5 px de folga), as guias depois que entram no poço e as partículas só aparecem dentro da máscara. Isso dá a impressão de que o fundo do funil fica escondido atrás da borda.
- **Guias radiais**: **50** polilinhas, uma para cada ângulo igualmente espaçado na volta. Cada uma liga, elipse por elipse, o ponto da elipse naquele ângulo. São calculadas uma vez (posições iniciais) e ficam estáticas.
- **Partículas**: **100** quadradinhos de lado entre **0,5 e 4,5 px**, brancos (cor configurável) com opacidade aleatória entre 0 e 1:
  - nascem numa faixa estreita centralizada na base (largura = 0,5 × raio horizontal da borda, a 0,85 H);
  - sobem até o topo;
  - na horizontal, interpolam linearmente até um ponto sorteado numa faixa larga centralizada (largura = 2 × raio horizontal da borda), na proporção da altura percorrida, abrindo-se como um leque.

## Comportamento
- **Fluxo do túnel**: a cada quadro, o parâmetro p de cada elipse avança **0,001** (com volta a 0 ao passar de 1) e a elipse é recalculada. A 60 qps, cada elipse leva **~16,7 s** da abertura até a fuga. O efeito é de anéis caindo continuamente para dentro do poço.
- **Partículas**: sobem **0,5 a 1,5 px por quadro** (sorteado por partícula). Ao passar do topo, renascem na base com novos sorteios. No início, já são distribuídas em alturas aleatórias, para não começarem todas embaixo.
- **Feixe**: a posição do degradê desliza verticalmente de 100% para 300% em **5 s**, linear e infinito, fazendo as cores escorrerem ao longo do feixe.
- **Redimensionamento**: recalcula o tamanho, as elipses, as guias, a máscara e as partículas.

## Técnica de renderização em alto nível
Camadas DOM com degradês, `filter: blur`, modos de mistura e animação de `background-position` (CSS ou `motion`) para a vinheta, o feixe, o brilho e as varreduras. O túnel usa **Canvas 2D** com laço por quadro, escalado pelo *device pixel ratio*:
- as elipses usam o desenho de elipse nativo;
- a máscara é um caminho reutilizável (elipse + retângulo) aplicado como recorte;
- as guias estáticas são pré-renderizadas numa superfície fora da tela e copiadas a cada quadro;
- as partículas são retângulos preenchidos dentro do recorte.

Matemática envolvida: interpolação linear, easing exponencial e parametrização polar da elipse (cosseno e seno do ângulo × raios).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor dos traços (elipses e guias) | cor CSS | `#737373` |
| Quantidade de guias radiais | inteiro | 50 |
| Quantidade de elipses do túnel | inteiro | 50 |
| Cor das partículas | tripla RGB | (255, 255, 255) |
| Quantidade de partículas | inteiro | 100 |
| Velocidade do fluxo (incremento de p por quadro) | número | 0,001 |
| Conteúdo sobreposto | nós | nenhum |

## Demo
- Preenche toda a área de prévia (absoluto, inset 0) com raio de 14 px, conteúdo centralizado e sem filhos.
- O visual muda com o tema:
  - escuro: vinheta preta, túnel a 20%, feixe aditivo e varreduras;
  - claro: vinheta branca, túnel a 10%, feixe subtrativo e sem varreduras.

## Acessibilidade e responsividade
- Decorativo: superfície e camadas com `aria-hidden` e sem captura de ponteiro. O conteúdo filho deve ficar acessível e acima do que precisar ser lido (as varreduras ficam acima do conteúdo na referência; recomenda-se manter o texto legível ou elevar o conteúdo acima delas).
- Com `prefers-reduced-motion`, congelar o túnel e as partículas num quadro estático e parar o deslizamento do feixe.
- Pausar o laço fora da viewport ou com a aba oculta (melhoria).
- Proporções relativas a W × H: o desenho se adapta a qualquer tamanho. Observe o **contêiner** (`ResizeObserver`), não a janela.

## Observações de fidelidade
- Recomendação: a referência redimensiona apenas no evento de redimensionamento da **janela**. Use a observação do contêiner.
- Recomendação: a superfície fora da tela das guias é criada sem levar em conta o *device pixel ratio*, o que as deixa borradas em telas densas. Gere-a na resolução física.
- Recomendação: na referência, as guias são estáticas enquanto as elipses se movem. Mantenha esse comportamento, pois é parte do visual.
- Recomendação: a referência chama o recorte repetidamente dentro do laço de cada guia (recortes acumulados). Aplique o recorte uma única vez a partir do ponto em que a guia entra no poço.
