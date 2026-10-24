# Especificação: Neve pixelada (pixel-snow)

## Propósito
Fundo animado de neve caindo em perspectiva 3D, renderizado em baixa resolução (pixels grandes, estética retrô). Flocos próximos são maiores e brilhantes, os distantes ficam pequenos e escurecem com a profundidade, dando sensação de nevasca atravessando o espaço.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto, com contenção de layout/pintura. Sem fundo próprio.
- **Superfície**: tela WebGL em bloco, 100% × 100%, fundo transparente; densidade de pixels = min(DPR, 2). Promovida a camada própria de composição.
- **Pixelização**: a imagem é calculada em blocos quadrados; o lado do bloco = max(1, arredondar(largura ÷ resolução de pixels)). Com o padrão **200**, a largura tem ~200 "pixels" de neve.
- **Flocos**: cor única (padrão **branco `#ffffff`**), multiplicada pela intensidade; nas áreas sem floco, transparente. Três formas:
  - **quadrado** (padrão): quadrado alinhado à tela;
  - **redondo**: disco;
  - **floco de neve**: estrela de 6 braços (simetria hexagonal). Cada braço é um segmento do centro até a borda, com dois ramos laterais simétricos em ~55° em relação ao braço: um a 40% do comprimento (comprimento 40%) e outro a 70% (comprimento 25%). Espessura dos traços ≈ 20% do raio do floco. Só é legível em flocos grandes/resolução alta.
- **Tamanho**: tamanho base no espaço 3D (padrão **0,01** unidade de mundo), mas nunca menor que ~**1,25 pixel** de tela (o mínimo cresce com a distância). Quando o floco é "inflado" pelo mínimo, sua intensidade é reduzida proporcionalmente ao quadrado da razão (tamanho real ÷ tamanho inflado), para que flocos distantes não fiquem brilhantes demais.
- **Brilho**: intensidade = 2^(−distância ÷ esmaecimento de profundidade) × redução de tamanho × brilho; depois elevada à potência de **gama** (padrão **0,4545**, que clareia meios-tons). Esmaecimento padrão **8**, brilho **1**.

## Comportamento
- **Câmera**: olha na diagonal de um espaço 3D de células cúbicas unitárias (eixo de visão ao longo de (1,1,1) normalizado), com uma base ortonormal fixa para "direita" e "cima". Cada pixel lança um raio de perspectiva (campo de visão definido pela largura).
- **Movimento**: a câmera desliza continuamente: 0,4 unidade/s na direção do vento no plano da tela (ângulo configurável, padrão **125°**, medido com o eixo vertical para cima) e 0,1 unidade/s para a frente, tudo × velocidade (padrão **1,25**). Visualmente, com 125°, a neve cai para baixo e levemente para a direita, e vem ligeiramente em direção ao observador.
- **Distribuição**: cada célula cúbica contém no máximo um floco; uma célula tem floco se um hash dela for menor que a densidade (padrão **0,3** = 30% das células).
- **Balanço**: a posição do floco dentro da célula (mantida entre 10% e 90% de cada eixo) oscila suavemente no tempo por combinações de senos/cossenos com fases aleatórias por célula — cada floco tremula de forma própria.
- **Busca**: o raio percorre as células em ordem (travessia de grade 3D) até no máximo **128 passos** ou até a distância do plano distante (padrão **20**); o primeiro floco atingido define a cor do pixel. O floco é um "cartaz" plano voltado para a câmera.
- **Tempo**: segundos desde a montagem; velocidade multiplica o tempo.
- **Visibilidade**: só renderiza quando o contêiner está visível (observador de interseção); o laço continua agendado.
- **Redimensionamento**: reage ao redimensionamento da janela, com debounce de **100 ms**.
- Todos os parâmetros podem mudar em tempo real sem recriar o contexto.

## Técnica de renderização em alto nível
WebGL, quadrilátero de tela cheia com shader de fragmento que faz **ray casting por travessia de grade 3D (DDA)** em um campo de células com hash inteiro, intersectando cada raio com o plano de um "cartaz" por floco. A forma é testada por métrica (Chebyshev para quadrado, euclidiana para disco) ou por um **campo de distância** com dobra angular de 6 setores para o floco de neve. A pixelização é obtida arredondando a coordenada do fragmento para blocos. Sem assets.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor dos flocos | cor CSS | `#ffffff` |
| Tamanho do floco (mundo 3D) | número | 0,01 |
| Tamanho mínimo em pixels | número | 1,25 |
| Resolução horizontal em "pixels" | número | 200 |
| Velocidade | número | 1,25 |
| Esmaecimento por profundidade | número | 8 |
| Distância máxima visível | número | 20 |
| Brilho | número | 1 |
| Gama da intensidade | número | 0,4545 |
| Densidade (fração de células com floco) | número 0–1 | 0,3 |
| Forma | quadrado / redondo / floco de neve | quadrado |
| Direção do vento | número (graus) | 125 |
| Classe / estilo extra | string / objeto | vazio |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores: todos os padrões (branco, quadrado, resolução 200, velocidade 1,25, densidade 0,3, direção 125°).
- **Sobreposição de demonstração** (opcional, sem captura de ponteiro): navegação em vidro com logotipo genérico (SVG próprio), pílula **"New Background"**, título **"Oh, the weather outside is frightful!"**, botões "Get started"/"Learn more" e interruptor "Demo Content".
- Controles: forma; cor; resolução 50–500 (10); velocidade 0–5 (0,1); densidade 0,1–1 (0,05); tamanho do floco 0,001–0,05 (0,001); brilho 0,1–3 (0,1); esmaecimento 1–20 (0,5); distância máxima 5–50 (1); direção 0–360° (5).

## Acessibilidade e responsividade
- Decorativo: ocultar a tela de leitores de tela; sem foco nem interação.
- Recomendação: com `prefers-reduced-motion`, renderizar um quadro estático (velocidade 0).
- Recomendação: pausar o laço de animação (não apenas o desenho) quando fora da tela.

## Observações de fidelidade
- Recomendação: a referência só observa o redimensionamento da **janela**; usar observador de tamanho do **contêiner**.
- Recomendação: a referência passa a resolução em px CSS mas lê a posição do fragmento em pixels físicos; em telas com DPR > 1, o ponto de fuga se desloca para o canto inferior esquerdo e a pixelização fica errada. Usar o mesmo sistema de unidades (pixels físicos) para ambos — o resultado correto tem o ponto de fuga no centro.
- Recomendação: a referência converte a cor para espaço linear e não a reconverte, então cores diferentes de branco/preto aparecem mais escuras que o hex informado. Exibir a cor como informada.
- Recomendação: os flocos distantes são pixels opacos escurecidos (alfa 1 com cor atenuada), o que aparece como manchas escuras sobre fundos claros. Preferir codificar a intensidade no alfa (cor pré-multiplicada) para que o efeito funcione em qualquer fundo.
- Recomendação: mudar a velocidade em tempo real causa salto (tempo total × velocidade); acumular por quadro.
