# Especificação: Pintura metálica líquida (metallic-paint)

## Propósito
Transforma a silhueta de um logo ou imagem em uma peça de **cromo líquido** animado. O formato é preenchido por faixas de reflexo claro e escuro, como horizontes refletidos num metal polido. As faixas escorrem continuamente e se deformam com ondulações orgânicas, e há franjas de aberração cromática (bordas avermelhadas e azuladas) e um leve tingimento colorido. O volume aparente segue a forma: as bordas da silhueta parecem arredondadas, como um objeto inflado.

## Aparência
- **Superfície**: uma superfície WebGL exibida em bloco, com 100% × 100% do contêiner e ajuste "contain". A resolução interna é sempre **quadrada**, com **1000 × densidade de pixels** de lado. Assim, o desenho é um quadrado centralizado na área (com faixas vazias se o contêiner não for quadrado).
- **Fora da silhueta**: totalmente transparente. A saída é pré-multiplicada (cor × máscara, alfa = máscara).
- **Dentro da silhueta**:
  - faixas metálicas que alternam entre a cor clara (padrão **`#ffffff`**, multiplicada pelo brilho) e a cor escura (padrão **`#000000`**, multiplicada por 2 − brilho);
  - brilho padrão: **2**, o que leva as luzes a branco estourado e as sombras a preto;
  - contraste em torno do cinza médio (padrão **0,5**, ou seja, contraste reduzido e aspecto acetinado);
  - tingimento final por uma cor (padrão **`#feb3ff`**, rosa claro), num modo parecido com "subexposição de cor" (divide a inversa da cor pela cor de tinta). A força do tingimento é proporcional à distância da tinta até o branco, em cerca de 15% com o padrão;
  - um leve acréscimo de azul (+0,08) nas sombras do quadrante inferior direito do quadro.
- **Perfil de cada período de faixa** (rampa periódica de "cromo", indexada por uma fase de 0 a 1):
  - começa escuro e sobe rápido para claro;
  - tem uma faixa escura estreita, uma clara, outra escura mais fina e volta ao claro;
  - termina com um gradiente longo do claro para o escuro até o fim do período.
  - As posições dessas transições encolhem com a escala do padrão (padrão **4**). A nitidez das transições vem do parâmetro de nitidez (padrão **1**; maior = mais nítido) e do desfoque (padrão **0,015**; maior = mais suave).
  - Perto do centro do quadro, as faixas finas ficam um pouco mais estreitas.

## Comportamento
### Pré-processamento da imagem (uma vez por fonte)
1. A imagem é carregada com CORS anônimo e redimensionada para que o maior lado fique entre **500 e 1000 px**. Ela só é reescalada se estiver fora dessa faixa.
2. **Máscara**: um pixel é fundo se for quase branco opaco (todos os canais > 250) ou quase transparente (alfa < 5). Nos demais pixels, o alfa original é mantido. A forma binária considera alfa > 0,1.
3. **Mapa de "inflagem"**: resolve-se dentro da forma uma **equação de Poisson** com fonte constante e valor zero na borda, por relaxação iterativa (sobre-relaxação sucessiva, **200 iterações**, fator **1,85**). O resultado é uma altura em forma de domo: zero nas bordas e máxima no "miolo" das partes grossas.
4. A altura é normalizada pelo máximo e guardada como tom de cinza igual a 1 − altura². As bordas ficam claras e o interior escuro. Junto vai a máscara alfa, numa textura RGBA com filtragem linear.

### Animação
- **Relógio**: acumula milissegundos × velocidade (padrão **0,3**). A fase das faixas avança continuamente, e por isso elas "escorrem" na diagonal.
- **Modo mouse** (opcional): em vez do relógio, o tempo vira uma função da posição do ponteiro sobre a superfície, igual a x × 3000 + y × 1500, com x e y normalizados de 0 a 1 e suavizados por quadro com fator **0,08**. Mover o mouse "rola" o metal; parado, o metal congela.
- **Fase de cada pixel**: combina várias parcelas:
  - uma coordenada diagonal do quadro, girada pelo ângulo configurado (padrão **0°**);
  - uma curvatura radial em domo centrada no quadro, que dá aspecto de superfície convexa e vinheta;
  - a altura do mapa de inflagem, cuja influência é ajustada pela intensidade do contorno (padrão **0,2**);
  - uma **ondulação líquida** feita de ruído pseudoaleatório periódico e suave, animado no tempo, com amplitude de onda (padrão **1**), escala do ruído (padrão **0,5**) e uma semente (padrão **42**) que muda o desenho do ruído;
  - um termo de "liquidez" (padrão **0,75**) que mistura essa ondulação à altura;
  - uma distorção extra (padrão **1**) concentrada nas regiões de meia-altura, perto das bordas;
  - o resultado é multiplicado pela escala e deslocado pelo tempo.
- **Aberração cromática**: os canais vermelho e azul usam a rampa com fases deslocadas, para frente e para trás, por quantidades proporcionais a refração × dispersão cromática (padrões **0,01** e **2**). Os deslocamentos são maiores em faixas específicas do domo. Isso produz franjas coloridas nas transições.
- **Fresnel**: parâmetro de reforço de borda (padrão **1**). Na prática, só aumenta levemente a opacidade, que já está saturada.
- **Mudança de parâmetros**: cores, escalas e intensidades são atualizadas ao vivo sem reprocessar a imagem. Trocar a fonte reprocessa a imagem e recarrega a textura.
- Enquanto a textura não fica pronta, nada é desenhado (superfície transparente).

## Técnica de renderização em alto nível
WebGL 2 com um quadrilátero de tela cheia. O shader de fragmento lê a textura pré-processada (altura e máscara) e calcula por pixel:
- um **ruído de valor periódico barato**, com hash de células e interpolação cúbica, combinado em camadas para formar o fluxo líquido;
- uma **rampa de faixas metálicas** com transições suavizadas (smoothstep);
- deslocamentos de fase por canal (aberração cromática);
- ajustes de contraste e tingimento.

O mapa de inflagem é calculado na CPU com um canvas 2D auxiliar e o solucionador iterativo de Poisson descrito acima. Essa etapa pode levar algumas centenas de milissegundos para imagens grandes, e é aceitável movê-la para um *worker*. A densidade de pixels é a do dispositivo.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Fonte da imagem/silhueta | URL | obrigatório |
| Semente do ruído | número | 42 |
| Escala das faixas | número | 4 |
| Refração (deslocamento cromático base) | número | 0,01 |
| Desfoque das transições | número | 0,015 |
| Liquidez | 0–1 | 0,75 |
| Velocidade | número | 0,3 |
| Brilho | número | 2 |
| Contraste | número | 0,5 |
| Ângulo do padrão (graus) | número | 0 |
| Fresnel | número | 1 |
| Cor clara | cor hex | `#ffffff` |
| Cor escura | cor hex | `#000000` |
| Nitidez das faixas | número | 1 |
| Amplitude das ondas | número | 1 |
| Escala do ruído | número | 0,5 |
| Dispersão cromática | número | 2 |
| Animação guiada pelo mouse | booleano | falso |
| Distorção | número | 1 |
| Intensidade do contorno | número | 0,2 |
| Cor de tingimento | cor hex | `#feb3ff` |

## Demo
- Área de prévia com **400 px de altura**, overflow oculto e fundo escuro do site. A superfície quadrada fica centralizada (com 400 px de lado, limitada pela altura).
- **Asset**: a referência usa um arquivo de logo próprio, um símbolo preto sólido sobre fundo transparente, em formato de **átomo**: três órbitas elípticas entrelaçadas com traço grosso e cantos arredondados, proporção de cerca de 66 × 61. **Não usar o arquivo.** Gerar um SVG próprio (por exemplo, três elipses de traço grosso giradas 0°, 60° e 120° em volta de um ponto central sólido), rasterizado como imagem preta sobre transparente, e passá-lo como fonte (data URL).
- Valores da demo: todos os padrões da tabela.
- Controles:
  - cores de tingimento, escura e clara;
  - semente de 0 a 200 (passo 0,01);
  - escala de 0,5 a 5 (passo 0,1);
  - refração de 0 a 0,1 (passo 0,001);
  - desfoque de 0 a 0,1 (passo 0,001);
  - velocidade de 0 a 1 (passo 0,01);
  - brilho de 0,5 a 2 (passo 0,05);
  - contraste de 0,5 a 2 (passo 0,05);
  - ângulo de −180 a 180;
  - fresnel de 0 a 3 (passo 0,1);
  - nitidez de 0,1 a 2 (passo 0,1);
  - ondas de 0 a 3 (passo 0,1);
  - liquidez de 0 a 1 (passo 0,01);
  - ruído de 0,1 a 3 (passo 0,1);
  - dispersão de 0 a 3 (passo 0,1);
  - distorção de 0 a 1 (passo 0,05);
  - contorno de 0 a 1 (passo 0,05);
  - chave do modo mouse.
  - Cada mudança remonta o componente.

## Acessibilidade e responsividade
- A superfície é uma imagem decorativa. Se o logo tiver significado, fornecer um rótulo acessível de imagem no contêiner; caso contrário, ocultar.
- **Recomendação**: com `prefers-reduced-motion`, congelar o relógio, deixando um quadro estático.
- **Recomendação**: pausar o laço fora da viewport ou com a aba oculta.
- Responsivo por "contain": o quadro quadrado cabe em qualquer proporção.

## Observações de fidelidade
- A resolução interna fixa de 1000 × densidade de pixels gera, em telas 3×, uma superfície de 3000 × 3000. **Recomendação**: limitar a densidade a 2 ou dimensionar pela área visível.
- A referência não libera o programa nem o contexto de GPU ao desmontar, só a textura. **Recomendação**: liberar tudo.
- Fundo branco opaco na imagem de entrada é tratado como transparente. Logos brancos sobre transparente funcionam, mas logos brancos sobre branco desaparecem. Documentar isso.
