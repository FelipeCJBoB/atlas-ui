# Especificação: Aurora suave (soft-aurora)

## Propósito
Fundo animado com uma faixa horizontal de luz difusa, como uma aurora boreal vista de longe: um véu luminoso que ondula lentamente no meio da área, com cores que deslizam ao longo do eixo horizontal. O cursor desloca levemente a faixa, dando uma sensação de paralaxe.

## Aparência
- **Contêiner**: bloco de 100% × 100% do pai; a superfície de desenho é anexada dentro dele. **Transparente** onde não há brilho: o fundo da página aparece por trás.
- **Faixa**: brilho máximo numa linha horizontal na **altura de 50%** (padrão), com perfil exponencial suave para cima e para baixo. A espessura visível é de aproximadamente ±20% da altura em torno do centro. A linha central não é reta: ondula conforme um ruído (ver Comportamento), com desvios de até ~7% da altura.
- **Pico de brilho**: cerca de 0,8 (antes das cores), caindo para ~0,27 a uma "unidade" de distância e para quase zero a três unidades (cada unidade ≈ 10% da altura).
- **Cores**: duas camadas de brilho somadas, cada uma colorida por uma **paleta cossenoidal** que varia com a posição horizontal e com o tempo, multiplicada por uma cor de tingimento:
  - camada 1: paleta arco-íris suave (média 0,5, amplitude 0,5, frequência 1 em todos os canais, fases 0,3 / 0,2 / 0,2), tingida por **`#f7f7f7`** (quase branco), portanto exibe a própria paleta — alterna entre tons salmão/laranja, verde-água e azul ao longo da largura;
  - camada 2: paleta com frequências diferentes por canal (2 / 1 / 0) e fases 0,5 / 0,2 / 0,25 (o canal azul fica fixo em 0,5), tingida por **`#e100ff`** (magenta/violeta), resultando em tons rosados e púrpura;
  - cada camada é multiplicada por 0,99 e depois pelo brilho global (padrão **1**).
- **Transparência**: alfa = comprimento do vetor de cor (limitado a 1). Regiões escuras ficam transparentes, o centro da faixa fica quase opaco.
- **Modo claro opcional** (desligado por padrão, não usado na demo): saída opaca sobre **branco**. A cor é a média das duas tintas ponderada pelos brilhos (com peso pelo luminância da paleta e expoente 1,35), com o componente neutro reduzido em 78%, normalizada pelo canal mais forte (expoente 1,08) e aplicada sobre branco com força = (soma dos pesos × brilho × 1,55), limitada a **0,82**. Resultado: aurora em tinta colorida sobre papel branco.

## Comportamento
- **Tempo**: segundos desde o carregamento. O tempo do ruído = velocidade (padrão **0,6**) × 0,4 × segundos. As paletas deslizam horizontalmente: a camada 1 a velocidade × 0,2 × velocidade de cor (padrão **1**) por segundo, a camada 2 à metade disso.
- **Forma da faixa**: para cada pixel, em coordenadas normalizadas pela **altura** (proporção preservada), multiplicadas pela escala (padrão **1,5**), calcula-se um **ruído de Perlin 3D** (gradientes pseudoaleatórios, interpolação quíntica), com o terceiro eixo sendo o tempo, somando **3 oitavas**: frequência inicial **2,5**, dobrando a cada oitava; amplitude inicial **1,0**, multiplicada pelo decaimento (padrão **0,1**) a cada oitava — ou seja, quase só a primeira oitava importa, o que dá a forma lisa e "suave".
  - O brilho é 0,3 × exponencial(espalhamento × (1 − 1,1 × |ruído + 10 × (y − altura da faixa)|)). O espalhamento (padrão **1**) controla quão abrupta é a queda: valores maiores deixam o núcleo mais intenso e as bordas mais nítidas.
- **Duas camadas**: a segunda usa o mesmo ruído com o tempo adiantado por um deslocamento (padrão **0**: com 0 as duas camadas têm exatamente a mesma forma e só diferem na cor; valores até 1 separam as formas).
- **Cursor** (ligado por padrão):
  - O ponteiro sobre a superfície define um alvo normalizado (0–1, y para cima). Ao sair, o alvo volta para o centro (0,5; 0,5).
  - A posição efetiva persegue o alvo com suavização de **5% por quadro**.
  - O padrão inteiro é deslocado por (posição − 0,5) × influência (padrão **0,25**), em unidades de altura. O sentido é inverso: o ponto amostrado anda com o cursor, então a faixa visualmente se move **no sentido contrário** ao cursor (cursor para cima → faixa desce um pouco). Deslocamento máximo ≈ 12,5% da altura.
  - Desligado, a posição fica fixa no centro (sem deslocamento).
- **Redimensionamento**: a referência acompanha o redimensionamento da janela, usando o tamanho do contêiner em pixels CSS, com densidade de pixels **1** (não escala para telas de alta densidade — aceitável por ser um efeito difuso).
- **Laço**: anima continuamente desde a montagem.

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia e shader de fragmento. Ideias: **ruído de Perlin 3D com oitavas (fBm)** em que a terceira dimensão é o tempo; uma **função de faixa exponencial** em torno de uma linha horizontal deslocada pelo ruído; **paletas cossenoidais** (cor = a + b·cos(2π(c·t + d))) para o colorido que desliza; alfa derivado da magnitude da cor (sem pré-multiplicação). Sem texturas nem assets.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Velocidade geral | número | 0,6 |
| Escala do ruído (maior = ondulações mais densas) | número | 1,5 |
| Brilho global | número | 1,0 |
| Tinta da camada 1 | string hex de 6 dígitos | `#f7f7f7` |
| Tinta da camada 2 | string hex de 6 dígitos | `#e100ff` |
| Frequência base do ruído | número | 2,5 |
| Amplitude base do ruído (maior = faixa mais sinuosa) | número | 1,0 |
| Altura vertical da faixa (0 = base, 1 = topo) | número 0–1 | 0,5 |
| Espalhamento/nitidez do brilho | número | 1,0 |
| Decaimento de amplitude por oitava | número | 0,1 |
| Defasagem temporal entre as camadas | número | 0 |
| Velocidade de deslizamento das cores | número | 1,0 |
| Interação com o cursor | booleano | verdadeiro |
| Intensidade do deslocamento pelo cursor | número | 0,25 |
| Modo claro | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Componente com os valores padrão.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro, pílula **"New Background"**, título **"A gentle glow to light your way!"** e dois botões. Sem captura de ponteiro.
- Controles: duas cores; velocidade 0,1–5 (0,1); escala 0,1–3 (0,1); brilho 0,1–3 (0,1); frequência 0,5–10 (0,5); amplitude 0,5–10 (0,5); altura da faixa 0–1 (0,05); espalhamento 0,1–3 (0,1); decaimento 0,01–0,5 (0,01); defasagem 0–1 (0,05); velocidade de cor 0,1–5 (0,1); interruptor de interação; influência 0,1–1 (0,05), visível só com a interação ligada.
- A aurora anima sozinha; a paralaxe do cursor é sutil e não exige animação automática.

## Acessibilidade e responsividade
- Decorativo: superfície oculta de leitores de tela, não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo e desligar a paralaxe.
- Em toque, sem hover: a faixa fica centrada.
- Responsivo: o ruído usa a altura como escala, então em telas largas a faixa só se estende; a altura da faixa é relativa.

## Observações de fidelidade
- Recomendação: a referência recria o contexto WebGL a cada mudança de parâmetro; prefira atualizar valores ao vivo.
- Recomendação: observar o tamanho do contêiner (não só a janela) e pausar o laço fora da viewport ou com a aba oculta.
- Recomendação: suavização do cursor baseada em tempo, não em quadros (equivalente a 5% por quadro a 60 fps).
- A referência escuta o ponteiro só na própria superfície; com conteúdo sobreposto capturando eventos a paralaxe some. Recomendação: escutar no contêiner/janela.
- Com o padrão de defasagem 0, as duas camadas coincidem em forma; isso é intencional (a mistura de cores vem só das paletas).
