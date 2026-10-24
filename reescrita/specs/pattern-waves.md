# Especificação: Superfície de padrão ondulante (pattern-waves)

## Propósito
Fundo animado em que uma grade regular de marcas (pontos, quadrados, cruzes, linhas de contorno ou caracteres) desenha, por meio de meio-tom, uma superfície 3D ondulante iluminada: as marcas crescem nas regiões iluminadas, encolhem nas sombras e são levemente deslocadas para cima/baixo conforme a altura da onda, dando a ilusão de tecido, mar ou lago em relevo. O ponteiro pode perturbar a superfície deixando um rastro de ondulações, e um clique solta um "respingo".

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto. Sem padding, borda ou fundo próprio (o fundo é desenhado pela superfície de desenho).
- **Superfície de desenho**: uma tela WebGL2 em bloco, 100% × 100% do contêiner, oculta de leitores de tela.
- **Densidade de pixels**: o menor entre o DPR do dispositivo, 2 e a raiz de (4,5 milhões ÷ área em px CSS) — ou seja, nunca mais que ~4,5 Mpx renderizados.
- **Grade de células**:
  - passo vertical = espaçamento configurado (limitado a 4–120 px CSS) convertido para pixels físicos e arredondado, nunca menor que 4 px físicos;
  - passo horizontal = igual ao vertical, exceto no padrão "linha", em que é ¼ do vertical (mínimo 2 px), para amostrar a curva com finura;
  - colunas = teto(largura ÷ passo horizontal) + 1; linhas = teto(altura ÷ passo vertical) + 2 (no máximo 4096 cada);
  - a grade fica centralizada na tela (sobra dividida igualmente nas bordas).
- **Marca de cada célula** (tamanho base = passo vertical × fator de tamanho de marca):
  - **ponto**: círculo cujo diâmetro = tamanho base × max(√nível, 0,14);
  - **quadrado**: quadrado do mesmo lado, cantos arredondados com raio de 30% da meia-largura;
  - **cruz (+)**: dois braços perpendiculares de comprimento total = tamanho base × interpolação de 0,3 a 1 pelo nível; espessura do traço = o maior entre 1,1 px CSS e 8% do passo; pontas arredondadas;
  - **linha**: uma linha de contorno horizontal por linha da grade, que sobe e desce acompanhando a altura da superfície (interpolada entre colunas vizinhas); espessura = o maior entre 0,9 px CSS e (passo × tamanho de marca × nível); a distância ao traço é corrigida pela inclinação local para manter a espessura aparente constante;
  - **glifo**: um caractere de uma sequência ordenada do mais leve ao mais denso (padrão `.:-=+*#%@`), escolhido pelo nível de luz (índice = piso(nível × quantidade)); renderizado em fonte monoespaçada do sistema, peso 500, ocupando ~86% de um quadrado do tamanho base.
  - Todas as bordas têm antisserrilhamento de ~1 px.
- **Deslocamento vertical**: cada marca é deslocada verticalmente por (altura × profundidade × 0,42), limitado a ±0,48 do passo, para que cristas "subam" e vales "desçam". Como a marca pode invadir a linha vizinha, cada pixel examina a própria linha e as duas adjacentes e fica com a marca de maior opacidade.
- **Cor**:
  - uma única cor de marca (padrão **branco `#ffffff`**) sobre uma cor de fundo (padrão **preto `#000000`**; pode ter transparência);
  - nas regiões de destaque, a cor da marca é misturada com um "tom de realce": **55% em direção ao branco** quando a marca é clara sobre fundo escuro, ou **35% em direção ao preto** no modo "tinta";
  - **modo tinta**: ativado automaticamente quando a cor da marca é mais escura que a do fundo (comparando luminância relativa com pesos 0,2126 / 0,7152 / 0,0722). Se o fundo for praticamente transparente (alfa ≤ 0,02), usa-se tinta quando a luminância da marca é < 0,5. Em tinta, as marcas ficam grandes nas **sombras** (como impressão); no modo normal, grandes nas **luzes**;
  - composição: marca sobre o fundo com alfa pré-multiplicado.
- **Opacidade de cada marca** = opacidade global × máscara de esmaecimento × revelação de entrada × (0,22 + 0,78 × nível). Mesmo nas sombras as marcas mantêm um mínimo visível.

## Comportamento

### Superfície (campo de altura)
- Coordenadas da superfície: posição relativa ao centro do contêiner dividida por uma "unidade de onda" de **520 px × escala** (escala limitada a 0,2–5). Direção da onda = ângulo configurado em graus (0° = para a direita; o eixo vertical da superfície cresce para cima).
- Ruído usado: **ruído de gradiente 3D** (tipo Perlin, com interpolação quíntica e hash inteiro), com o tempo como terceira dimensão para evoluir devagar.
- **Seda (silk)**: dobras de tecido. Eixo ao longo da direção e eixo perpendicular. A fase das dobras avança ~5,5 ciclos/unidade ao longo da direção, entortada por ruído de baixa frequência (amplitude ~1,7) e uma senoide lateral lenta; desliza a 0,45 rad por unidade de tempo. Perfil = senoide + 32% do 2º harmônico, mais uma ondulação fina (16% de amplitude, 2,5× a frequência). Tudo modulado por um envelope de ruído entre 0,6 e 1,0.
- **Marulho (swell)**: ondas paralelas largas ao longo da direção, ~15 rad/unidade, levemente entortadas por ruído, deslizando a 1,4 rad/tempo; senoide + 30% do 2º harmônico; envelope 0,75–1,0; amplitude 0,8.
- **Ondulação (ripple)**: anéis concêntricos vindos de um centro fora da tela (1,2 unidade atrás, contra a direção), ~9 rad/unidade, propagando a 1,8 rad/tempo, com leve distorção por ruído; amplitude decai com a distância (mistura 0,45 + 0,55 × exponencial decrescente).
- A altura final = superfície × amplitude de entrada + (perturbação do ponteiro × 0,32).

### Iluminação (por célula)
- Normal estimada por diferenças centrais da altura com passo = max(passo da grade em px CSS, 4 px); inclinação multiplicada por unidade × profundidade × 0,4 (profundidade limitada a 0–1,5).
- Luz direcional com elevação fixa (componente vertical 0,62, horizontal 0,78). Azimute = direção da onda + 180° + ângulo de luz configurado (limitado a −90°…+90°). Com luz 0, ilumina as dobras de frente; valores maiores raspam lateralmente.
- Difusa (Lambert) × fator de "fundo de vale" (0,7 a 1,0 conforme a altura) × 0,78, somada a um brilho especular Blinn-Phong muito estreito (expoente 160) × brilho configurado (0–2) × 1,15.
- Contraste aplicado em torno do pivô 0,42 (fator 0,3–3), com saturação 0–1.
- **Nível** (o que define o tamanho da marca):
  - normal: tom elevado à potência 2,2;
  - tinta: (1 − tom/0,46) saturado, elevado a 2,4, × 0,72.
- **Ênfase** (mistura para o tom de realce): normal = especular × 1,6 saturado; tinta = transição suave de 0,55 a 0,95 do nível.

### Esmaecimento (máscara)
Coordenadas normalizadas −1…1. Tamanho do esmaecimento limitado a 0,05–1 (padrão 0,5).
- **bordas** (padrão): vinheta radial; opaco no centro, some entre raio (1 − tamanho) e 1,18;
- **centro**: centro quase apagado (5%), crescendo até total a partir do raio 0,08 até 0,08 + tamanho (elipse esticada 1,35× na vertical), deixando o meio calmo para um título;
- **base**: some em direção à borda inferior, numa faixa de (tamanho × altura);
- **topo**: idem em direção à borda superior;
- **nenhum**.

### Entrada (intro)
- Relógio de entrada de 0 a 1 em **2 s**.
- **Revelação**: frente circular que parte do centro e chega aos cantos (distância normalizada pela meia diagonal), com borda suave; progresso = ease-out cúbico nos primeiros 75% do relógio (~1,5 s).
- **Elevação**: a amplitude da superfície vai de 0 a 1 com curva suave (smoothstep) entre 0,2 s e 2 s, de modo que primeiro aparece um padrão plano e depois o relevo "levanta" e a luz varre as dobras.
- Desativada (ou com movimento reduzido) = tudo pronto imediatamente.

### Interação com o ponteiro
- Escuta movimento, pressionar e soltar do ponteiro na **janela inteira**, convertendo para coordenadas locais; só conta como "dentro" se estiver no retângulo do contêiner (funciona mesmo com conteúdo sobreposto).
- **Simulação de ondas**: malha com 1 célula a cada 8 px CSS (entre 4 e 512 células por eixo), dois buffers de ponto flutuante (equação de onda discreta clássica: média dos 4 vizinhos × 2 − valor anterior), amortecimento **0,975** por passo, passo fixo a **60 Hz** (acumulador limitado a 4 passos por quadro).
- **Impulso**: gaussiana ao longo do segmento entre a posição anterior e a atual do ponteiro, com raio = tamanho do cursor (limitado a 8–400 px; padrão 50). Força ao mover = min(distância percorrida ÷ 14 px, 1) × 0,35 × intensidade. **Clique** adiciona um impulso de 1,2 × intensidade. O impulso afunda a superfície (valor negativo), gerando anéis que se propagam e refletem a luz. Intensidade 0–1, padrão 0,6.
- A simulação roda enquanto o ponteiro está dentro e até **5 s** depois da última atividade; depois é zerada.
- Ao entrar, a posição anterior é sincronizada para não gerar um traço falso. Ponteiro de toque: soltar o dedo equivale a sair. Perda de foco da janela ou saída da janela também.
- Exige suporte a alvos de renderização em ponto flutuante; sem isso, a interação simplesmente não existe.

### Laço de animação
- dt limitado entre 1/240 s e 0,05 s; tempo da superfície avança dt × velocidade (velocidade 0 congela).
- O laço só continua enquanto houver movimento, entrada em curso, simulação ativa ou mudança de configuração; caso contrário desenha um último quadro e para (fica estático sem custo).
- Pausa quando fora da viewport (observador de interseção) e retoma quando a aba volta a ficar visível.
- Mudar qualquer parâmetro aplica-se no quadro seguinte sem recriar o contexto gráfico; mudar a sequência de caracteres reconstrói o atlas de glifos.
- Redimensionamento: observado continuamente; recalcula DPR, grade e malha de ondas.

## Técnica de renderização em alto nível
WebGL2, dois passes de tela cheia por quadro:
1. **Passe de campo**: renderiza numa textura de **um texel por célula** da grade (filtragem "mais próximo"), guardando por célula: nível, opacidade, ênfase e deslocamento vertical. Aqui ficam o ruído, as ondas, o relevo, a iluminação, o esmaecimento e a revelação.
2. **Passe de marcas**: em resolução cheia, cada pixel descobre sua célula, lê o campo das 3 linhas próximas e calcula a cobertura da marca por **funções de distância com sinal** (círculo, retângulo arredondado, união de dois retângulos para a cruz, distância a uma polilinha para as linhas) ou por amostragem de um **atlas de glifos** gerado em tempo de execução numa tela 2D (128 px por glifo, branco, com mipmaps), e compõe sobre a cor de fundo.
3. Passe opcional de **simulação de ondas** (ping-pong entre dois buffers de meia precisão).

Nenhum asset externo: os glifos são texto do sistema rasterizado na hora.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Predefinição (aparência completa de partida) | `seda` / `oceano` / `lago` / `linhas` / `terminal` / `malha` | seda |
| Tipo de marca | ponto / quadrado / cruz / linha / glifo | da predefinição |
| Forma da onda | seda / marulho / ondulação | da predefinição |
| Espaçamento da grade | número (px) | da predefinição |
| Tamanho da marca (fração da célula) | número 0,05–1 | da predefinição |
| Profundidade do relevo | número 0–1,5 | da predefinição |
| Ângulo da luz | número (graus, −90 a 90) | da predefinição |
| Brilho especular | número 0–2 | da predefinição |
| Contraste | número 0,3–3 | da predefinição |
| Velocidade | número (0 = parado) | da predefinição |
| Escala da onda | número 0,2–5 | da predefinição |
| Direção da onda | número (graus) | da predefinição |
| Cor das marcas | cor CSS | `#ffffff` |
| Cor de fundo | cor CSS (aceita transparência) | `#000000` |
| Opacidade global | número 0–1 | 1 |
| Esmaecimento | bordas / centro / base / topo / nenhum | bordas |
| Tamanho do esmaecimento | número 0,05–1 | 0,5 |
| Caracteres (do mais leve ao mais denso) | string | `.:-=+*#%@` |
| Interação com ponteiro | booleano | ligado |
| Raio do rastro do cursor | número (px) | 50 |
| Intensidade do rastro | número 0–1 | 0,6 |
| Animação de entrada | booleano | ligado |
| Pausado | booleano | desligado |
| Classe / estilo extra do contêiner | string / objeto | vazio |

Cada parâmetro de padrão/onda/luz passado explicitamente sobrepõe o valor da predefinição.

**Valores das predefinições** (marca, onda, espaçamento, tamanho, profundidade, luz, brilho, contraste, velocidade, escala, direção):
- **seda**: ponto, seda, 9, 0,95, 0,95, 0, 0,8, 1,2, 0,35, 1, 20°;
- **oceano**: ponto, marulho, 10, 0,9, 0,42, 0, 1, 1,2, 0,5, 1, 100°;
- **lago**: ponto, ondulação, 10, 0,9, 0,55, 0, 1,2, 1,2, 0,5, 1, 35°;
- **linhas**: linha, seda, 12, 0,42, 0,9, 0, 0,6, 1,2, 0,3, 1, 20°;
- **terminal**: glifo, ondulação, 13, 0,95, 0,75, 0, 0,9, 1,4, 0,3, 1,1, 200°;
- **malha**: cruz, seda, 14, 0,8, 0,95, 0, 1, 1,45, 0,4, 1,1, 325°.

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto.
- Valores: predefinição **seda**, marcas brancas `#ffffff` sobre fundo **`#120f17`** (roxo quase preto), esmaecimento nas bordas 0,5, interação ligada (raio 50, intensidade 0,6), entrada ligada.
- No tema claro: marcas **`#18181b`** sobre fundo **`#ffffff`** (o modo tinta entra automaticamente).
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos, sem captura de ponteiro): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About", botão "Sign up"; pílula "NEW · Creative Components"; título **"Soft light on a moving surface."**; botões "Get started" e "Learn more"; interruptor "Demo Content".
- Botão de "recarregar" no canto que remonta o componente (para rever a entrada).
- Controles: predefinição (aplica todos os valores dela), marca, onda, caracteres (até 24, só habilitado com glifo), cor, fundo, espaçamento 5–30 px (1), tamanho de marca 0,3–1 (0,05), profundidade 0–1,5 (0,05), luz −90–90 (1), brilho 0–2 (0,05), contraste 0,5–2,5 (0,05), velocidade 0–2 (0,05), escala 0,3–3 (0,05), direção 0–360 (1), esmaecimento, tamanho do esmaecimento 0,1–1 (0,05), opacidade 0–1 (0,05), interativo, tamanho do cursor 10–200 (5), intensidade 0–1 (0,05), entrada, pausado.
- O efeito já se move sozinho; a interação é um bônus.

## Acessibilidade e responsividade
- Decorativo: a tela deve ficar oculta para tecnologias assistivas e não receber foco.
- Com `prefers-reduced-motion: reduce`: sem avanço do tempo, sem entrada e sem ondulações do ponteiro — renderiza um único quadro estático.
- Responsivo: grade e malha se refazem a cada mudança de tamanho; orçamento de pixels protege telas grandes.
- Para textos sobrepostos, o esmaecimento "centro" é a opção recomendada.

## Observações de fidelidade
- Recomendação: a referência não desenha nada (deixa o contêiner vazio) sem WebGL2. Preencher o contêiner com a cor de fundo como alternativa estática.
- Recomendação: a sobreposição usa eventos da janela inteira; garantir remoção de todos os ouvintes e liberação do contexto gráfico ao desmontar.
- Recomendação: a interação depende de texturas de ponto flutuante renderizáveis; sem elas, o componente deve degradar silenciosamente (como na referência), sem erros.
- O ângulo de direção é medido com o eixo vertical para cima (convenção matemática). Manter essa convenção para que as predefinições tenham a mesma aparência.
