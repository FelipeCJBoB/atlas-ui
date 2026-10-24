# Especificação: Logo elétrico (electric-logo)

## Propósito
Transforma a silhueta de qualquer imagem (um logotipo em SVG/PNG) em um contorno feito de filamentos de eletricidade: vários fios luminosos finos percorrem a borda da forma, serpenteando e crepitando, com brilho difuso em volta e arcos voltaicos ocasionais que saltam entre dois pontos da borda. O ponteiro "carrega" a eletricidade perto dele; o clique envia uma onda de choque e uma rajada de arcos. Uso decorativo em heros.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto. Superfície de desenho em bloco cobrindo tudo, **fundo transparente** (alfa pré-multiplicado). A forma original nunca é desenhada — só a eletricidade.
- **Forma padrão**: um **raio estilizado** (relâmpago) desenhado como polígono preenchido branco num quadro 64 × 64: começa numa ponta no alto à direita do centro, desce em diagonal para a esquerda até pouco abaixo do meio, faz um degrau horizontal para a direita, desce em diagonal até uma ponta embaixo à esquerda do centro, sobe em diagonal para a direita até pouco acima do meio, faz um degrau horizontal para a esquerda e volta à ponta superior. Deve ser gerado como SVG próprio embutido.
- **Enquadramento**: a caixa delimitadora da forma é ajustada (mantendo proporção) para ocupar **70%** da largura ou da altura do contêiner, o que for limitante, e centralizada. Define-se uma unidade de escala = (maior lado da forma na tela) / 100, usada por todas as amplitudes de ondulação.
- **Cores padrão** (tema escuro): fio principal **`#ecc7ff`** (lilás muito claro, quase branco) e brilho **`#ad6dff`** (violeta).
- **Fios**: 4 fios (configurável 1–6) seguindo o contorno. O fio principal é mais espesso (padrão **1,5 px** de núcleo) e mais nítido; os satélites têm metade da espessura e aparecem/somem em trechos (visibilidade de 30% a 75% variando ao longo do contorno e no tempo). Cada fio engrossa e afina ao longo do caminho (0,5× a 1,5×). Perfil luminoso de cada fio: núcleo gaussiano na cor principal + halo exponencial próximo + névoa exponencial mais larga na cor de brilho.
- **Aura**: luz difusa na cor de brilho em volta da forma inteira (duas escalas de desfoque: estreita ≈ 3,5% e larga ≈ 13% do tamanho da forma), mais intensa onde há mais borda.
- **Arcos**: segmentos curvos e serrilhados que ligam dois pontos da borda separados por **8% a 30%** do tamanho da forma, arqueando **para fora** da forma (curvatura de 20% a 50% do comprimento), afinando nas pontas (perfil senoidal) e compostos de dois fios (um principal e um secundário mais fraco).
- **Preenchimento** (padrão **0**): opcionalmente tinge o interior da forma com a cor de brilho, mais forte perto da borda.
- **Mapeamento tonal**: a energia luminosa acumulada é convertida em cor e opacidade de forma exponencial (1 − e^(−energia × ganho)), o que satura suavemente para branco nos núcleos sobrepostos. Um ruído de quantização de ±0,5/255 (gradiente intercalado) evita faixas no degradê.
- **Tema claro** ("tinta"): em vez de luz emitida, os fios viram traços de tinta colorida nítida com o miolo do fio principal quase branco ("incandescente"), aura e névoa reduzidas (~65–70% menos) e preenchimento mais fraco. A troca de tema é uma transição suave (constante de **250 ms**).

## Comportamento

### Preparação da forma (uma vez por imagem)
1. Rasteriza a imagem com o maior lado em **560 px**.
2. **Cobertura**: se mais de 1% dos pixels tem alguma transparência, usa o canal alfa. Senão (imagem opaca), calcula a cor média da moldura de borda e considera "forma" o que difere dela (diferença máxima por canal: 0 abaixo de 24/255, 1 acima de 72/255, linear entre).
3. Recorta pela caixa delimitadora e adiciona margem de 25% do maior lado.
4. Calcula um **campo de distância assinada** exato (transformada de distância euclidiana em duas passadas separáveis, por envelope inferior de parábolas), negativo dentro, positivo fora, com correção subpixel na borda antisserrilhada.
5. Extrai os **pontos de borda** (pixels internos vizinhos de pixels externos, projetados sobre o contorno zero), reduzidos a no máximo ~3000.
6. Gera duas texturas de **aura** em células de 4 px: soma de e^(−|distância|/1,5) suavizada por três passadas de desfoque em caixa (aproximando gaussiana), com raios de 3,5% e 13% do tamanho da forma, normalizadas.
Se o carregamento falhar ou a forma for vazia, mantém a forma anterior.

### Fios ao longo do contorno
- Cada fio é a **isolinha zero do campo de distância visto através de um espaço deformado** (domain warping): a posição do pixel é deslocada por uma soma de ruídos de gradiente (tipo Perlin, com interpolação quíntica) em quatro escalas:
  - curvatura ampla: frequência baixa (≈0,028 por unidade), amplitude 8 × curvatura unidades (curvatura padrão **0,6**);
  - ondulação média: ≈0,085 por unidade, amplitude 3,2 × curvatura;
  - crepitação fina: períodos de ~9 px e ~4 px, amplitude 1,5 × crepitação px (crepitação padrão **1,5**);
  - todas as camadas se movem no tempo com velocidades diferentes, e cada fio tem semente e velocidade próprias (+19% por índice).
- A distância até a isolinha é corrigida pelo gradiente do campo e pela derivada da deformação, para que a espessura aparente seja constante mesmo com distorção forte.
- O fio principal fica mais próximo do contorno real (deformação reduzida); os satélites se afastam mais.
- Só é calculado numa faixa ao redor da borda (alcance proporcional à curvatura, crepitação e espessura), com desvanecimento suave na extremidade da faixa.

### Tempo e intensidade global
- Relógio de animação avança em segundos × **velocidade** (padrão **2,5**). Passo de quadro limitado a 50 ms.
- **Respiração**: brilho global multiplicado por 1 ± 0,6 × cintilação × ruído lento (cintilação padrão **0,6**); além disso cada fio pisca levemente em alta frequência (até −30% × cintilação).
- **Intensidade** global padrão **1**; **brilho** (peso da aura e névoa) padrão **1**.

### Entrada
Quando a forma fica pronta, a "presença" sobe de 0 a 1 em **1,4 s** com *smoothstep*: a aura cresce com o quadrado da presença e os fios começam colados ao contorno (15% da deformação) e se soltam até 100%.

### Arcos voltaicos
- Até **5** simultâneos. Vida de **0,35 a 0,8 s** (em tempo de animação); intensidade = seno(π × fração da vida) × presença.
- Surgem aleatoriamente (só com presença > 0,8 e sem transição de forma) a uma taxa ≈ 2,2 × velocidade × fator de arcos por segundo (fator padrão **1**; 0 desliga). O arco escolhe um ponto de borda ao acaso, procura (até 24 tentativas) um segundo ponto à distância certa e arqueia para o lado de fora da forma.
- Cada arco é serrilhado por 3 oitavas de ruído ao longo do comprimento, animadas no tempo.

### Ponteiro (se interativo, padrão sim)
- **Pairar**: um ponto de "calor" segue o ponteiro com uma mola (rigidez 120, amortecimento 19 por segundo; ao entrar, salta direto ao ponteiro). A força do calor sobe com constante de **300 ms** ao entrar e cai com **550 ms** ao sair.
- O calor local = força × intensidade do cursor (padrão **0,75**) × gaussiana da distância com raio do cursor (padrão **100 px**). Onde há calor: até +2,5 fios extras (máximo total 6), deformação até +90%, aura até +120%, brilho +45%, e os satélites ficam totalmente visíveis.
- Arcos extras surgem perto do cursor a uma taxa ≈ 6 × velocidade × fator de arcos × força × intensidade do cursor por segundo, escolhendo pontos de borda dentro do raio do cursor.
- **Clique** (pressionar): emite uma **onda de choque** (máximo 3, vida 2 s) que se propaga a partir do ponto a **150 unidades/s**, com frente de largura 10 unidades: desloca radialmente o espaço (oscilação em cosseno, amplitude 7,5 unidades) e aquece o que atravessa, decaindo com e^(−1,7 × idade). Também dá um **clarão** global (+30% × e^(−7 × idade)) e dispara até 3 arcos imediatos perto do clique.

### Troca de imagem (transição)
Ao trocar a forma, o campo antigo e o novo são misturados durante **1,6 s** (0,3 s se já houver outra troca pendente), com limiar de mistura perturbado por ruído (a nova forma "se espalha" de modo irregular) e aquecimento extra de 0,5 × seno(π × progresso) no meio da transição. Os arcos ativos são descartados.

### Cores
Mudanças de cor fazem transição suave exponencial (constante **350 ms**); a primeira cor é aplicada sem transição.

### Desempenho
- Requer WebGL2; sem ele, não desenha nada (falha silenciosa).
- DPR limitado a 2 e também de modo que o total de pixels não passe de ~4 milhões.
- Pausa quando fora da viewport.
- Opcionalmente chama um retorno a cada quadro com a superfície renderizada (para efeitos como reflexo).

### Movimento reduzido
Relógio a 20% da velocidade, sem arcos aleatórios, sem cintilação e sem ondas de clique.

## Técnica de renderização em alto nível
Pré-processamento na CPU (rasterização, cobertura, transformada de distância, pontos de borda, texturas de aura com desfoque em caixa) e um único shader de fragmento WebGL2 em triângulo de tela cheia que: lê o campo de distância (textura de ponto flutuante de meia precisão) com bilinear e extrapolação fora da caixa; aplica deformação de domínio por ruído de gradiente com derivadas analíticas; soma a luz de cada fio e arco; aplica ondas de choque radiais; e faz o mapeamento tonal exponencial com saída pré-multiplicada. Os parâmetros dos arcos e ondas são passados como pequenos vetores uniformes.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem cuja silhueta será eletrificada | URL/data URI | raio estilizado (SVG próprio) |
| Cor do fio | cor hex | `#ecc7ff` |
| Cor do brilho | cor hex | `#ad6dff` |
| Fração do contêiner ocupada pela forma | 0–1 | 0,7 |
| Intensidade global | número | 1 |
| Peso da aura/névoa | número | 1 |
| Espessura do fio principal | px | 1,5 |
| Número de fios | inteiro 1–6 | 4 |
| Curvatura (ondulação ampla) | número | 0,6 |
| Crepitação (detalhe fino) | número | 1,5 |
| Frequência de arcos | número (0 desliga) | 1 |
| Cintilação | 0–1 | 0,6 |
| Preenchimento interno | 0–1 | 0 |
| Velocidade | número | 2,5 |
| Interativo | booleano | verdadeiro |
| Intensidade do cursor | número | 0,75 |
| Raio do cursor | px | 100 |
| Tema do fundo | escuro / claro | escuro |
| Retorno chamado após cada quadro (recebe a superfície) | função | nenhum |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia com **500 px de altura**, sem padding, overflow oculto, fundo do tema; botão de recarregar no canto.
- **Formas**: a referência oferece o logotipo da própria biblioteca e logotipos de marcas famosas — **não usar** (são assets de terceiros/marcas registradas). Em vez disso, oferecer formas próprias geradas em SVG, cada uma com sua paleta:
  1. **Raio** (padrão) — escuro: fio `#ecc7ff`, brilho `#ad6dff`; claro: fio `#a953ff`, brilho `#c79bff`.
  2. **Estrela de 5 pontas** — escuro: `#cadcff` / `#528aff`; claro: `#3377ff` / `#99b8ff`.
  3. **Coração** — escuro: `#ffcdd2` / `#ff5260`; claro: `#ef3848` / `#ffa3ab`.
  4. **Anel/hexágono** — escuro: `#c2fff1` / `#1fd8b6`; claro: `#0ea88f` / `#7fe6d5`.
  Escolher uma forma aplica sua paleta.
- Opcional: botão "Upload" que aceita um arquivo local SVG/PNG/WebP/JPEG (lido localmente, sem rede) e o usa como forma.
- O tema do componente acompanha o tema do site (claro → modo tinta). No tema claro, as cores padrão são trocadas pelas versões "claras" da paleta e a curvatura padrão passa a **0,5**.
- Controles: forma; cor; brilho; escala 0,2–1 (0,05); intensidade 0,2–2 (0,05); aura 0–2 (0,05); preenchimento 0–1 (0,05); espessura 0,5–3 px (0,1); fios 1–6 (1); curvatura 0–2 (0,05); crepitação 0–2 (0,05); arcos 0–2 (0,05); cintilação 0–1 (0,05); velocidade 0–3 (0,05); interativo; intensidade do cursor 0–2 (0,05) e raio do cursor 40–300 px (5), ambos desabilitados quando não interativo.

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; se o logotipo identifica a marca, fornecer nome acessível no contêiner (recomendação: papel de imagem com rótulo).
- Respeita `prefers-reduced-motion` (ver acima).
- Acompanha qualquer tamanho do contêiner (a forma reencaixa na proporção).

## Observações de fidelidade
- Recomendação: sem WebGL2 a referência não mostra nada; oferecer um fallback (por exemplo, a silhueta estática com sombra colorida via CSS).
- Recomendação: liberar texturas explicitamente ao desmontar.
- Recomendação: a preferência de movimento reduzido é lida só na montagem; reagir a mudanças em tempo real.
- Assets de terceiros (logos) da demo substituídos por formas SVG próprias.
