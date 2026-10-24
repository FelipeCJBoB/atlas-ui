# Especificação: Varredura em grade (grid-scan)

## Propósito
Fundo "sci-fi" que mostra o interior de um corredor retangular infinito revestido por uma grade de linhas finas, visto em perspectiva a partir do centro. Uma faixa luminosa de "escaneamento" percorre o corredor em profundidade, indo e voltando. O ponto de fuga se desloca suavemente com o ponteiro (e, opcionalmente, com a inclinação do aparelho ou com o rastreamento do rosto pela webcam). Leve aberração cromática e ruído completam o visual de monitor. Uso: hero tecnológico.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto. Superfície de desenho **transparente** onde não há linhas nem varredura (o fundo da página aparece).
- **Geometria da cena** (unidades da cena): câmera na origem olhando para a frente (profundidade positiva), com distância focal 2 (campo de visão estreito, ≈ 53° na vertical). O corredor tem **piso e teto** em altura −0,2 e +0,2 e **paredes** laterais em −0,5 e +0,5, estendendo-se infinitamente em profundidade. Cada pixel mostra a superfície mais próxima atingida pelo seu raio.
- **Grade**: linhas a cada **0,1** unidade (escala da grade) nas duas direções de cada superfície. Espessura constante **em pixels de tela** (padrão **1 px**), com antisserrilhado de 1 px, independentemente da profundidade.
  - Estilos: **contínuo** (padrão); **tracejado** (4 traços por célula, 50% preenchidos); **pontilhado** (6 pontos por célula, cada um ocupando ≈ 36% do intervalo, com borda suave).
  - Uma segunda grade idêntica, com oscilação própria, aparece apenas perto das quatro **arestas** do corredor (até ≈ 2 células de distância da quina, desvanecendo a partir de meia célula), reforçando visualmente as quinas.
- **Cor das linhas**: **`#2F293A`** (cinza-arroxeado escuro). A intensidade das linhas decai exponencialmente com a distância (fator e^(−2·distância)), de modo que o fundo do corredor some no escuro.
- **Varredura**: faixa na cor **`#FF9FFC`** (rosa-lilás) que cobre todas as superfícies numa dada profundidade:
  - perfil gaussiano em profundidade com desvio de 0,18 × brilho (padrão **0,5**) × suavidade (padrão **2**) = **0,18** unidade;
  - uma "aura" com o dobro da largura e 25% da intensidade;
  - opacidade da varredura **0,4**.
- **Ruído**: granulação por pixel renovada a cada quadro, ±metade da intensidade (padrão **0,01**).
- **Transparência**: a opacidade do pixel é o maior entre a máscara da linha e a intensidade da faixa de varredura. Opcionalmente, um "halo" mais grosso das linhas (o dobro da espessura, atenuado pela distância) pode ser somado à opacidade, proporcional à intensidade do brilho (bloom; padrão **0**, desligado).
- **Pós-processamento** (padrão ligado):
  - **brilho difuso** (bloom) com limiar de luminância e suavização configuráveis (padrão 0 e 0) e opacidade de mistura = intensidade do bloom (padrão **0**, ou seja, inativo);
  - **aberração cromática** radial: separação dos canais de cor com deslocamento **0,002** (fração da tela), mais forte nas bordas e nula no centro.
- **Modo claro** (opcional): fundo branco; linhas e varredura viram tinta (cromaticidade normalizada com contraste reforçado por expoente ≈ 1,2), com cobertura derivada da opacidade e da energia, até ≈ 85%.
- **Painel de pré-visualização da webcam** (opcional): caixa de **220 × 132 px** no canto inferior direito (12 px das bordas), raio de 8 px, borda de 1 px branca a 25%, sombra `0 4px 16px rgba(0,0,0,0.4)`, fundo preto, vídeo espelhado horizontalmente em enquadramento "cobrir", sem captura de ponteiro. No canto superior esquerdo, um selo (padding 2 × 6 px, fundo preto 50%, raio 6 px, desfoque de 4 px, texto branco 12 px em fonte do sistema) com o estado: "Webcam disabled", "Loading models", "Face: searching" ou "Face: tracking".

## Comportamento
- **Ciclo da varredura** (profundidade da faixa = fase × **2** unidades, de 0 a 2):
  - **para a frente**: em cada ciclo de duração (padrão **2 s**) + espera (padrão **2 s**), a faixa fica parada na origem durante a espera e então avança de 0 a 1 em fase ao longo da duração;
  - **para trás**: o mesmo, em sentido inverso;
  - **vaivém** (padrão): após a espera inicial, a fase oscila continuamente 0→1→0 numa onda triangular de período 2 × duração, sem novas esperas.
  - **Atenuação nas pontas**: a intensidade da faixa é multiplicada por uma janela que sobe suavemente (curva *smootherstep* de 5ª ordem) no início da fase e desce no fim; largura de cada rampa = parâmetro de afunilamento limitado a **0,49** (padrão 0,9 → 0,49). Com o padrão, a faixa nasce invisível, atinge o máximo no meio do trajeto e some no fim.
- **Varredura por clique** (opcional, desligada por padrão): cada clique dispara uma varredura extra a partir daquele instante (até **8** simultâneas; a mais antiga é descartada), com a mesma duração, direção e atenuação, somada à varredura automática.
- **Oscilação das linhas** (padrão **0,1**, faixa 0–1): as coordenadas da grade ondulam com senoides lentas (amplitude 0,15 × valor em células, frequências ≈ 2,3–2,7 por célula, velocidades ≈ 1,4–1,8 rad/s), fazendo as linhas "respirarem".
- **Olhar pelo ponteiro**:
  - a posição do ponteiro sobre o componente vira um alvo normalizado de −1 a 1 (Y para cima);
  - esse alvo é perseguido por um **amortecimento crítico suave** (tipo "smooth damp": mola criticamente amortecida com tempo de suavização ajustável), passo de tempo limitado a 0,1 s;
  - a posição suavizada gera um **cisalhamento** dos raios de visão: horizontal = x × escala, vertical = −y × escala × reforço vertical, cada componente limitado a ±0,7; superfícies mais distantes recebem um deslocamento extra de até 15% do cisalhamento (progressivo até profundidade 3). Visualmente, o ponto de fuga do corredor desliza — ponteiro à direita desloca o fundo para a esquerda; ponteiro para cima desloca o fundo para cima.
  - **Sensibilidade** (padrão **0,55**, 0–1) define, por interpolação linear entre os extremos: escala do cisalhamento 0,06→0,20 (≈ 0,137 no padrão); reforço vertical 1,2→1,6 (≈ 1,42); escala de rolagem 0,12→0,30 (≈ 0,22); escala de guinada 0,10→0,28 (≈ 0,20; guinada final limitada a ±0,6 rad); resposta à profundidade do rosto 0,25→0,45; e tempo de suavização **0,45 s → 0,12 s** (≈ 0,27 s no padrão; mais sensível = mais rápido).
  - Ao sair do componente, depois de um atraso (padrão **250 ms**; cancelado se o ponteiro voltar), olhar, rolagem e guinada voltam a zero suavemente.
- **Giroscópio** (opcional, desligado): a orientação do aparelho alimenta o olhar (inclinação lateral ÷ 45°, inclinação frontal ÷ 30°, ambos limitados a ±1) e a rolagem (inclinação lateral × 0,4). Em plataformas que exigem permissão, ela é solicitada num clique.
- **Rastreamento de rosto** (opcional, desligado): com a webcam frontal (ideal 1280 × 720, sem áudio), um detector de rosto com pontos de referência roda a ≈ 30 Hz. O centro do rosto (normalizado −1 a 1, suavizado pela mediana das últimas 5 leituras e comprimido por tangente hiperbólica) vira o alvo do olhar, multiplicado por um fator de proximidade (1 + resposta × (tamanho do rosto − 0,25)); o ângulo da linha dos olhos vira a rolagem; a assimetria entre nariz e bochechas (normalizada pela distância entre os olhos × 1,6) vira a guinada. Enquanto um rosto está sendo rastreado, o ponteiro é ignorado. Ao desmontar ou desligar, a câmera é liberada.
- **Tempo**: relógio absoluto em segundos, contínuo.
- **Redimensionamento**: ao redimensionar a janela; densidade de pixels limitada a **2**.
- **Mudança de parâmetros**: cores, espessura, estilo, oscilação, varredura, ruído, bloom e aberração atualizam ao vivo; sensibilidade, pós-processamento e alguns outros recriam a cena.

## Técnica de renderização em alto nível
WebGL com quadrado de tela cheia e shader de fragmento que faz **interseção analítica raio–plano** com os quatro planos do corredor (pega o mais próximo), gera a grade por parte fracionária das coordenadas da superfície com largura de linha via **derivadas de tela** (espessura constante em pixels), máscaras de tracejado/pontilhado, névoa exponencial por distância, faixa de varredura **gaussiana em profundidade** com janela *smootherstep*, e ruído por hash. Em seguida, uma cadeia de pós-processamento com **bloom** e **aberração cromática radial**. O olhar usa um integrador de amortecimento crítico em JavaScript. O rastreamento facial (opcional) exige uma biblioteca de detecção de rosto com modelo de pontos faciais.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Usar webcam para rastrear o rosto | booleano | não |
| Mostrar painel da webcam | booleano | não |
| Local dos modelos de detecção facial | string | (ver observações) |
| Sensibilidade do olhar | 0–1 | 0,55 |
| Espessura das linhas | px | 1 |
| Cor das linhas | cor | `#2F293A` |
| Cor da varredura | cor | `#FF9FFC` |
| Opacidade da varredura | 0–1 | 0,4 |
| Tamanho da célula da grade | unidades | 0,1 |
| Estilo das linhas | contínuo / tracejado / pontilhado | contínuo |
| Oscilação das linhas | 0–1 | 0,1 |
| Direção da varredura | frente / trás / vaivém | vaivém |
| Pós-processamento ligado | booleano | sim |
| Intensidade do bloom | número | 0 |
| Limiar do bloom | número | 0 |
| Suavização do bloom | número | 0 |
| Aberração cromática | número | 0,002 |
| Intensidade do ruído | número | 0,01 |
| Largura/brilho da varredura | número | 0,5 |
| Suavidade da varredura | número | 2 |
| Afunilamento nas pontas (máx. efetivo 0,49) | número | 0,9 |
| Duração de uma passada | s | 2 |
| Espera entre passadas | s | 2 |
| Usar giroscópio | booleano | não |
| Varredura extra a cada clique | booleano | não |
| Atraso para recentralizar ao sair | ms | 250 |
| Modo claro | booleano | não |
| Classe e estilo extras do contêiner | — | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores da demo: os padrões (espessura 1, célula 0,1, oscilação 0,1, linhas `#2F293A`, varredura `#FF9FFC`, pós-processamento ligado, aberração 0,002, ruído 0,01, brilho 0,5, suavidade 2, webcam e painel desligados).
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Hold on, scanning for Angular users."** (peso 600, 1,6–2,4 rem, branco); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro.
- Controles: duas cores; espessura 1–4 (0,1); célula 0,02–0,5 (0,01); oscilação 0–1 (0,01); brilho da varredura 0,1–3 (0,1); suavidade 0,1–4 (0,1); pós-processamento (interruptor); aberração 0–0,01 (0,0005); ruído 0–0,1 (0,005); webcam (interruptor); painel da webcam (interruptor).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Webcam e giroscópio só com ação explícita do usuário; indicar claramente quando a câmera está ativa (o painel com selo cumpre esse papel) e liberar a câmera ao desligar.
- Recomendação: com `prefers-reduced-motion`, parar a varredura automática e a oscilação e desligar o olhar.
- Responsivo: o campo de visão é vertical; telas mais largas mostram mais das paredes.

## Observações de fidelidade
- Recomendação: a referência carrega os modelos de detecção facial de uma CDN **sempre**, mesmo com a webcam desligada. Carregar apenas quando a webcam for ativada e permitir apontar para modelos locais; num ambiente sem rede, o recurso deve simplesmente ficar indisponível sem quebrar o resto.
- Recomendação: o pedido de permissão do giroscópio só é registrado quando a varredura por clique está ligada; registrar o clique de permissão sempre que o giroscópio estiver ativo.
- Recomendação: redimensionar observando o contêiner, não só a janela.
- Recomendação: na referência, as cores são convertidas para espaço linear e o resultado final pode sair mais escuro que o hex dependendo do pós-processamento; garantir que a cor percebida das linhas e da varredura corresponda aos valores indicados.
- Recomendação: a máscara de opacidade das linhas não acompanha a névoa de distância (linhas distantes ficam opacas porém escuras); considerar multiplicar a opacidade pela névoa para que o fundo do corredor desapareça em transparência, especialmente sobre fundos claros.
- A demo não ativa o modo claro no tema claro do site; recomenda-se ativá-lo nesse caso.
