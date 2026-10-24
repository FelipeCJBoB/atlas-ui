# Especificação: Plasma (plasma)

## Propósito
Fundo animado com uma "chama" volumétrica luminosa: um funil de luz translúcida que se torce e sobe continuamente em perspectiva, com faixas de brilho suaves e iridescentes. Pode ser exibido com as cores originais (arco-íris) ou tingido por uma cor única. Ideal como fundo de herói calmo e hipnótico.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto, sem fundo.
- **Superfície**: tela WebGL2 em bloco esticada a 100% × 100% via CSS, mas com buffer interno reduzido: resolução = tamanho do contêiner × **escala de renderização** (padrão **0,55**) × min(DPR, **teto de DPR**, padrão **1,5**). O upscaling do navegador suaviza a imagem (o efeito é naturalmente difuso, então a perda de nitidez é imperceptível).
- **Fundo**: transparente onde o plasma é escuro. A opacidade de cada pixel = intensidade da cor (comprimento do vetor RGB) × opacidade global — áreas escuras deixam ver o que estiver atrás.
- **Forma visual**: vista em perspectiva (câmera 4 unidades atrás, campo de visão ~53° na vertical) de uma **casca oca** em torno de um eixo vertical cuja seção transversal é um **quadrado de cantos muito arredondados** (superelipse de grau 4), com raio que **cresce com a altura** (funil: ~1,25 + 0,25 × altura). A seção gira ao longo da altura (torção) e o conjunto ondula lateralmente com amplitude que cresce para cima. Não há superfície sólida: o que se vê é o **brilho acumulado** perto da casca — véus de luz sobrepostos, com núcleos mais intensos onde o raio de visão passa rente à casca.
- **Cores originais**: cada canal recebe uma senoide da posição com fases diferentes (deslocadas ~1 rad entre R, G e B), gerando bandas iridescentes que vão de magenta/laranja a ciano/azul. O total acumulado é comprimido por uma tangente hiperbólica (mapeamento de tons suave, sem saturar).
- **Cor personalizada**: quando informada, a imagem vira monocromática: luminância média × cor. Padrão do componente **branco `#ffffff`** (plasma em tons de cinza/branco); a demo usa **`#B497CF`** (lilás). Cor vazia = cores originais. Hex inválido cai para laranja `rgb(255,128,51)`.
- **Modo claro** (opcional): em vez de luz sobre transparente, gera tinta sobre **fundo branco opaco**: a cor é convertida em "pigmento" (mistura de 68% da croma normalizada com a cor normalizada pelo pico, × 0,72) e aplicada com cobertura = curva suave da energia (de 3,5% a 72%, expoente 0,76) × opacidade × 0,9.

## Comportamento
- **Tempo**: segundos desde a montagem × velocidade × 0,4 (velocidade padrão **1**). O tempo faz a coluna "subir" (o padrão desliza no eixo vertical) e a torção girar.
- **Direção**:
  - **para a frente** (padrão): tempo crescente;
  - **reverso**: tempo negado (o fluxo desce);
  - **vai-e-vem**: ciclos de **10 s**; em cada ciclo o tempo vai de 0 a 10 com curva suave (smoothstep) e no ciclo seguinte volta de 10 a 0, alternando — o movimento desacelera nos extremos e inverte.
- **Escala**: zoom em torno do centro (padrão **1**; maior = mais aproximado).
- **Interação com o mouse** (desligada na demo; padrão do componente ligado): a posição do mouse relativa ao centro desloca as coordenadas de cada pixel numa quantidade proporcional à distância do pixel ao centro (fator 0,0002), produzindo uma leve distorção de "lente" que puxa a imagem em direção ao lado do cursor. A posição é lida no evento de movimento e aplicada uma vez por quadro.
- **Qualidade**: número de passos de marcha do raio (padrão **60**). Com menos passos, cada passo é proporcionalmente maior (60 ÷ passos), mantendo o alcance; a imagem fica menos detalhada, não mais curta.
- **Taxa de quadros**: limitada por um alvo (padrão **60 fps**); quadros que chegam antes do intervalo são pulados.
- **Pausas**: para quando o contêiner sai da viewport, quando a aba fica oculta ou quando o contexto WebGL é perdido; retoma automaticamente quando a condição volta.
- **Movimento reduzido**: renderiza um único quadro estático (tempo 0) e não inicia o laço.
- **Redimensionamento**: observado no contêiner, agrupado em no máximo uma atualização por quadro.

## Técnica de renderização em alto nível
WebGL2 com um único triângulo de tela cheia e shader de fragmento de **marcha de raio volumétrica**: em cada passo avalia a distância a uma casca de superelipse torcida e deformada por senoides, avança pela distância (com pequeno mínimo) e acumula cor ponderada pelo inverso da distância (brilho tipo "glow"). Ao final aplica mapeamento de tons por tangente hiperbólica e descarta valores inválidos (NaN/infinito). Sem assets.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor de tingimento (vazio = cores originais) | hex | `#ffffff` |
| Velocidade | número | 1 |
| Direção | para a frente / reverso / vai-e-vem | para a frente |
| Escala (zoom) | número | 1 |
| Opacidade | número 0–1 | 1 |
| Distorção pelo mouse | booleano | ligado |
| Escala da resolução interna | número 0,2–1 | 0,55 |
| Teto de densidade de pixels | número | 1,5 |
| Taxa de quadros alvo | número | 60 |
| Passos de marcha (qualidade) | número | 60 |
| Modo claro (tinta sobre branco) | booleano | desligado |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores: cor **`#B497CF`**, velocidade 1, para a frente, escala 1, opacidade 1, mouse **desligado**, escala interna 0,55, teto de DPR 1,5, 60 fps, 60 passos.
- **Sobreposição de demonstração** (opcional, sem captura de ponteiro): navegação em vidro com logotipo genérico (SVG próprio), pílula **"New Background"**, título **"Minimal plasma waves that soothe the eyes"**, botões "Get started"/"Learn more" e interruptor "Demo Content".
- Controles: cor; direção; velocidade 0,1–3 (0,1); escala 0,5–3 (0,1); opacidade 0,1–1 (0,1); passos 10–80 (5); escala interna 0,2–1 (0,05); fps 10–60 (5); teto de DPR 0,5–3 (0,5); interruptor do mouse.

## Acessibilidade e responsividade
- Decorativo: ocultar a tela de leitores de tela; nenhuma interação obrigatória.
- Respeita `prefers-reduced-motion` com quadro estático (manter).
- Responsivo; a resolução interna reduzida e o limite de fps protegem dispositivos fracos.
- Garantir contraste de textos sobrepostos (o centro do funil é a região mais brilhante).

## Observações de fidelidade
- Recomendação: a referência recria todo o contexto WebGL a cada mudança de qualquer parâmetro e não libera o contexto anterior (vazamento; o navegador limita contextos simultâneos). Atualizar parâmetros em tempo real e liberar o contexto ao desmontar.
- Recomendação: a posição do mouse é medida em px CSS a partir do topo, enquanto o centro usa pixels do buffer reduzido com origem embaixo; a distorção fica deslocada e invertida verticalmente. Converter o mouse para o mesmo sistema do buffer.
- Recomendação: mudar a velocidade não deve provocar salto visual (acumular tempo por quadro).
