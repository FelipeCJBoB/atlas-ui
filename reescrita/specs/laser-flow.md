# Especificação: Feixe de laser (laser-flow)

## Propósito
Fundo animado com um **feixe de luz vertical** que desce do alto e atinge uma "superfície", onde se espalha num **traço horizontal brilhante** com um clarão em leque no ponto de impacto. Pulsos de energia escorrem pelo feixe, pequenos filetes (wisps) cintilam junto à base e uma **névoa volumétrica** iluminada flutua em volta. Ideal para heros em que o feixe "pousa" na borda superior de um cartão.

## Aparência
- **Contêiner**: 100% × 100% do pai, posicionamento relativo, **não captura ponteiro**, com cor de fundo configurável (padrão **`#000000`**).
- **Superfície de desenho**: opaca (fundo preto), 100% × 100%, em bloco. Sobre fundos escuros, é combinada com o fundo do contêiner pelo modo **tela** (*screen*), de modo que o preto some e só a luz aparece. Se o fundo configurado for claro (luminância Rec. 709 > 0,72), a superfície recebe **inversão de cores + rotação de matiz de 180°** e modo normal: o fundo vira branco e o feixe aparece como traço colorido escuro, mantendo o matiz aproximado.
- **Cor do feixe**: padrão **`#FF79C6`** (rosa). Toda a luz é monocromática nessa cor, com intensidade em escala de cinza convertida por curva de gama sRGB.
- **Espaço virtual**: o desenho é feito num quadro virtual de ~205 × 205 unidades esticado para o tamanho do contêiner (largura e altura escaladas independentemente). A **origem do feixe** fica no centro deslocada por frações da largura/altura: padrão **+10% da largura** na horizontal e **0** na vertical.
- **Elementos visuais**:
  1. **Traço horizontal**: segmento luminoso na altura da origem, estendendo-se ≈ ±19% da largura (com o fator horizontal padrão **0,5**), mais forte no meio e afinando nas pontas; brilho com decaimento do inverso do quadrado da distância (halo suave).
  2. **Feixe vertical**: sobe da origem até o topo (alcance proporcional ao fator vertical padrão **2,0**), mais intenso embaixo e desvanecendo para cima (expoente 0,6, mais um desvanecimento extra a partir de 10% da altura do feixe). Mesmo tipo de halo.
  3. **Clarão de impacto**: nas primeiras ~16 unidades acima da origem, o halo do feixe vertical fica até **9× mais largo** na horizontal (curva quadrática), formando um leque luminoso onde o feixe toca o traço.
  4. **Filetes (wisps)**: 10 trilhas finíssimas de cada lado do feixe, muito próximas dele (≈ 0,7% a 1,8% da largura), que se abrem para fora acompanhando o clarão na base; cada trilha tem tracinhos de comprimento aleatório (1% a 55% de uma célula de 20 unidades) que escorrem; concentrados perto da base (ganho (1 − altura/150)^10); intensidade padrão **5**; densidade padrão **1** (0–2: abaixo de 1 reduz trilhas e tracinhos; acima de 1 adiciona uma segunda série).
  5. **Névoa**: textura de fumaça (ruído fBm de 5 oitavas com deformação de domínio, contraste 1,2), visível só onde já há luz do feixe (máscara expandida pela luminância), mais densa perto da base, atenuada lateralmente perto do traço horizontal (de 20% a 98% da meia-largura) e com desvanecimento radial a ~84 unidades da origem. Intensidade padrão **0,45** (multiplicada por 1,8), escala padrão **0,3**.
- **Bordas laterais**: a imagem escurece em direção às laterais (de 22% a 99,5% da meia-largura), exceto onde a luz é muito intensa.
- **Pontilhado anti-faixas**: ruído de ±0,5/255 somado à cor.
- A opacidade calculada (luz do feixe + 60% dos filetes) multiplica a cor, então a névoa sozinha fica mais sutil.

## Comportamento
- **Tempo**: dois relógios (fluxo e névoa) avançam com o passo de quadro limitado a 1–33 ms.
- **Pulsos de fluxo**: o feixe vertical é modulado por uma onda triangular (período 0,5 da altura normalizada, nitidez 1,5) que se desloca com velocidade padrão **0,35** — bandas mais claras **descem** pelo feixe em direção ao impacto. A profundidade da modulação é a força do fluxo (padrão **0,25**: a intensidade varia entre 75% e 100%).
- **Filetes**: os tracinhos escorrem para baixo a **15** unidades/s (velocidade configurável).
- **Névoa**: cai na direção vertical com velocidade padrão **0,6**, com ondulação senoidal perpendicular (amplitude 0,08, fase pelo tempo × 0,9). Opcionalmente a direção de queda inclina em direção à posição horizontal do ponteiro (força de inclinação padrão **0,01**, máximo 0,35), com suavização exponencial do ponteiro de constante configurável (padrão 0 = imediato).
- **Decaimento** (padrão **1,1**): controla a extensão angular do perfil dos feixes (quanto do comprimento recebe luz), em radianos.
- **Início do decaimento** (padrão **1,2**): raio do núcleo do halo; maior = feixes mais grossos e brilhantes.
- **Entrada**: na primeira montagem, a cena surge com fade linear de **1 s**.
- **Desempenho**:
  - densidade de pixels padrão = DPR do dispositivo limitada a 2 (configurável);
  - **resolução adaptativa**: a cada 750 ms mede o FPS médio; abaixo de 50 reduz a densidade em 15% (mínimo 0,6), acima de 58 aumenta 10% até a base; intervalo mínimo de 2 s entre ajustes;
  - pausa quando a aba está oculta e quando o contêiner sai da viewport;
  - trata perda e restauração do contexto gráfico.
- **Redimensionamento**: observado e aplicado no quadro seguinte.
- Todos os parâmetros visuais mudam ao vivo; mudar a densidade de pixels recria tudo.

## Técnica de renderização em alto nível
WebGL (por exemplo via three.js ou ogl) com triângulo de tela cheia e um shader de fragmento procedural: os feixes são linhas paramétricas amostradas em poucos pontos próximos da projeção do pixel, somando contribuições com decaimento inverso-quadrático (isotrópico no traço horizontal, anisotrópico no clarão); filetes por células com hash pseudoaleatório; névoa por fBm com deformação de domínio; mapeamento tonal por curva de gama sRGB. Inversão de cores por filtro CSS para fundos claros.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do feixe | cor hex | `#FF79C6` |
| Cor de fundo do contêiner | cor CSS | `#000000` |
| Deslocamento horizontal da origem (fração da largura) | número | 0,1 |
| Deslocamento vertical da origem (fração da altura) | número | 0 |
| Fator de comprimento do traço horizontal | número | 0,5 |
| Fator de comprimento do feixe vertical | número | 2,0 |
| Densidade dos filetes | 0–2 | 1 |
| Velocidade dos filetes | número | 15 |
| Intensidade dos filetes | número | 5 |
| Velocidade do fluxo | número | 0,35 |
| Força do fluxo | 0–1 | 0,25 |
| Intensidade da névoa | número | 0,45 |
| Escala da névoa | número | 0,3 |
| Velocidade de queda da névoa | número | 0,6 |
| Decaimento (extensão do perfil) | número | 1,1 |
| Início do decaimento (raio do núcleo) | número | 1,2 |
| Força de inclinação pela posição do ponteiro | número | 0,01 |
| Suavização do ponteiro | segundos | 0 |
| Densidade de pixels | número | automática (DPR, máx. 2) |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia relativa, **500 px de altura**, sem padding, overflow oculto; botão de recarregar no canto.
- Cor da demo: **`#CF9EFF`** (lilás). Fundo do componente: **`#120F17`** no tema escuro, **`#ffffff`** no claro (ativando a inversão).
- Seletor com dois exemplos:
  1. **Caixa** (padrão): origem deslocada **+10%** na horizontal e **−20%** na vertical (ou seja, a 70% da altura a partir do topo). Uma caixa absoluta com topo em **70%** da área, centralizada, **86%** de largura e **60%** de altura (ultrapassa a base e é cortada), fundo `#120F17` (escuro) / `#ffffff` (claro), raio **20 px**, borda de **2 px** na cor do feixe, decorada com grade de pontos sutil, empilhamento 6 — o feixe "pousa" exatamente na borda superior da caixa. Por trás, uma camada decorativa que se revela sob o cursor por máscara radial (opaca até 60 px, 60% em 120 px, 25% em 180 px, transparente em 240 px), mesclada com "clarear" e opacidade 0,3 no tema escuro (ou "multiplicar" e 0,12 no claro). A referência usa uma ilustração de terceiros nessa camada — **não usar**: substituir por um padrão próprio em SVG (por exemplo, uma malha de linhas finas com nós circulares na cor do feixe) cobrindo a área.
  2. **Básico**: origem centralizada na horizontal e **−50%** na vertical (no rodapé da área), sem caixa.
- Controles: exemplo; cor; fator horizontal 0,1–2 (0,01); fator vertical 0,1–5 (0,1); densidade de filetes 0–5 (0,1); velocidade de filetes 1–50 (0,5); intensidade de filetes 0–20 (0,1); velocidade do fluxo 0–2 (0,01); força do fluxo 0–1 (0,01); intensidade da névoa 0–1 (0,01); escala da névoa 0,1–1 (0,01); queda da névoa 0–2 (0,01); decaimento 0,5–3 (0,01); início do decaimento 0,5–3 (0,01).

## Acessibilidade e responsividade
- Decorativo: superfície oculta de leitores de tela; o contêiner não captura eventos.
- Recomendação: com `prefers-reduced-motion`, congelar os relógios (imagem estática) ou reduzir a velocidade.
- Responsivo: o quadro virtual estica com o contêiner (proporções relativas se mantêm; em contêineres muito largos o traço horizontal fica proporcionalmente mais largo).

## Observações de fidelidade
- Na referência, o contêiner não captura ponteiro e, como a superfície herda isso, a inclinação da névoa pelo ponteiro **nunca é ativada**. Recomendação: escutar o ponteiro no elemento pai/janela se a inclinação for desejada; o padrão visual (sem inclinação) deve permanecer igual.
- Recomendação: a curva de gama sRGB da referência tem limiar linear com uma casa decimal a mais (0,00031308); usar 0,0031308.
- Ilustração de terceiros da demo substituída por padrão SVG próprio.
