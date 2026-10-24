# Especificação: Carrossel flexível com lente invisível (flex-carousel)

## Propósito
Um carrossel horizontal infinito de imagens que se arrasta, rola com a roda do mouse e encaixa no item mais próximo do centro. A fileira passa por uma "lente de vidro invisível" centrada no palco: dentro da lente, a fileira fica reta; nas bordas da lente, ela se curva para cima e/ou para baixo como se fosse refratada, com uma leve dispersão cromática (arco-íris) na zona de dobra. Ao clicar no item central, ele abre em "foco": os vizinhos se afastam e somem, a dobra derrete e o item cresce. Há legenda com título e contador animado.

## Aparência
- **Palco**: ocupa 100% × 100% do pai, overflow oculto e fundo transparente (aparece o fundo da página). Cursor "agarrar" em repouso, "mão fechada" enquanto arrasta, "lupa +" sobre um cartão clicável e "lupa −" quando há um item em foco. Seleção de texto desativada, sem destaque de toque e gesto de toque restrito à rolagem vertical da página. Anel de foco por teclado: **sombra interna de 2 px `rgba(128,128,140,0.55)`**.
- **Fileira de cartões**: centrada verticalmente no palco.
  - **Altura de cada cartão** = fração da altura do palco (padrão **0,5**), com mínimo de 24 px.
  - **Largura**: depende do modo de enquadramento:
    - natural: proporção da própria imagem (0,8 enquanto não carregou);
    - retrato: 3:4;
    - quadrado: 1:1;
    - paisagem: 4:3.
  - Espaçamento de **12 px** entre cartões.
  - Raio de canto padrão **0 px** (cantos vivos), configurável, com borda suavizada por antisserrilhamento analítico.
- **Imagem dentro do cartão**: recorte tipo "cover", com **zoom extra de 8%**. A sobra do recorte é usada numa paralaxe horizontal: o enquadramento desliza conforme a posição do cartão em relação ao centro (−1 a +1 ao longo de ±75% da largura do palco).
- **Placeholder**: antes de carregar, o cartão é preenchido pela **cor média** da imagem (ou cinza médio 50%). Depois de carregar, há um crossfade de placeholder para imagem em **0,45 s**.
- **Legenda** (opcional, ligada por padrão): bloco centralizado logo abaixo da fileira, cujo topo fica a 50% da altura + metade da altura do cartão × fator de crescimento do foco + 22 px. Coluna centralizada com espaçamento de 6 px e padding lateral de 16 px, sem capturar ponteiro. A cor do texto é herdada (clara na demo escura).
  - **Título**: 15 px, peso 500 e entrelinha 1,35. O subtítulo opcional fica abaixo, com peso 400 e opacidade 0,6.
  - **Contador** no formato "03 / 12": 12 px, algarismos tabulares e opacidade 0,5. A barra tem opacidade 0,6 e o total é preenchido com zero à esquerda.
    - Cada dígito do número atual é um "rolo" vertical de 0 a 9, recortado na altura de 1em, que gira até o dígito certo.
- **Imagens (assets)**: o original usa 12 fotografias editoriais externas (esculturas cromadas e de gesso, formas abstratas, retratos de moda em preto e branco). **Não usar arquivos nem serviços externos**: gerar 12 imagens procedurais (canvas/SVG) com proporções variadas — maioria retrato, algumas quadradas e paisagem —, com paleta monocromática/acinzentada e acentos metálicos ou iridescentes (gradientes radiais, formas orgânicas em degradê sobre fundo escuro ou cinza). Títulos sugeridos: Iridescence, White Room, Liquid Metal, Clay Study, Low Tops, Brim, Three Forms, Automaton, Obsidian, Poise, Fins, Plaster.

## Comportamento

### Layout e laço infinito
- Os centros dos cartões são acumulados da esquerda para a direita, cada um separado por meia largura + espaço + meia largura. O comprimento do laço = soma das larguras + n × espaçamento.
- A posição do carrossel é um escalar contínuo. Cada cartão é desenhado na posição relativa (centro − posição), reduzida ao intervalo [−laço/2, laço/2), e também em réplicas deslocadas de ±1, ±2 e ±3 laços. Só se desenha o que estiver a até 40 px fora do palco.
- Os cartões mais distantes do centro são desenhados primeiro: o mais central fica por cima.
- O **item ativo** é sempre o de centro mais próximo da posição atual. Cada mudança dispara a notificação de troca e o anúncio acessível.
- Ao redimensionar, a posição é remapeada proporcionalmente para manter o mesmo cartão e o mesmo deslocamento relativo no centro. Trocar a lista de itens reinicia o estado e encaixa no primeiro item.
- Por precisão numérica, quando a posição passa de 8 laços ela é recentralizada sem salto visual.

### Física de posição
- Mola **criticamente amortecida** (amortecimento = 2√rigidez) entre a posição atual e o alvo, integrada em subpassos de 1/240 s. O dt por quadro é limitado a 50 ms.
- Rigidez **55** no normal, **80** durante rolagem por roda e **9** durante a entrada "giro".
- Considera-se assentada quando a distância ao alvo é menor que 0,05 px e a velocidade menor que 0,5 px/s.

### Arraste (mouse, caneta, toque)
- Só reage ao botão principal. Pressionar durante uma inércia forte (> 40 px/s) congela o movimento.
- **Limiar para iniciar o arraste**: 5 px no mouse e 10 px no toque.
  - No toque, se o movimento vertical vencer o horizontal antes do limiar, o gesto é liberado para a rolagem da página.
  - Ao iniciar, o ponteiro é capturado e o foco aberto é fechado.
- Durante o arraste, a posição acompanha o dedo 1:1 (arrastar para a esquerda avança).
- **Soltura**: a velocidade é estimada pelas amostras dos últimos 100 ms e zerada se a última amostra tiver mais de 70 ms. O alvo é o encaixe mais próximo de (posição + velocidade × 0,32 s), e a mola parte com essa velocidade. Se o lançamento passar de 400 px/s mas o encaixe calculado cair no próprio item, avança-se um item na direção do lançamento.
- Cancelamento do ponteiro: encaixa no mais próximo.

### Roda do mouse
- **Roda horizontal** (ou vertical com Shift): sempre rola o carrossel. **Roda vertical**: rola o carrossel apenas se a captura estiver ligada (padrão ligada), impedindo a rolagem da página. Com Ctrl (zoom), não reage.
- Cada evento soma ao alvo o delta (limitado a ±120 px; linhas ×16, páginas × altura do palco) × **1,25**.
- **150 ms** após o último evento, o alvo encaixa no item mais próximo.
- Rolar a roda fecha o foco aberto e consome esse evento.

### Teclado (palco focável)
- **→ ou ↓**: próximo item. **← ou ↑**: anterior. A distância somada é exata entre os centros.
- **Home**: primeiro item. **End**: último item. Os dois usam o caminho mais curto no laço.
- **Esc**: fecha o foco.
- **Enter ou Espaço**: fecha o foco, se aberto. Caso contrário, dispara a seleção do item ativo e abre o foco.

### Clique e modo foco
- Um clique (soltar sem ter arrastado) com o foco aberto apenas fecha o foco.
- Clique no cartão ativo já assentado (a menos de 2 px do alvo): dispara a seleção e abre o foco, se habilitado.
- Clique em outro cartão: centraliza esse cartão. O foco fica pendente e abre automaticamente quando a posição assenta (a menos de 1,5 px do alvo e abaixo de 30 px/s), desde que esse cartão seja o ativo.
- **Animação do foco**: mola criticamente amortecida de rigidez **64** num valor de 0 a 1, depois passado por um ease-in-out cúbico.
  - **Cartão em foco**: escala até um fator de crescimento = mínimo entre (84% da altura do palco ÷ altura do cartão) e (92% da largura do palco ÷ largura do cartão), limitado ao intervalo **[1; 1,3]**.
  - **Demais cartões**: cada um usa uma fase própria = progresso × 1,25 − atraso. O atraso é de até 0,25, proporcional à distância ao centro. Eles se deslocam para fora, até **70% da largura do palco** (para a esquerda os da esquerda e para a direita os da direita), e perdem opacidade até 0.
  - A intensidade da dobra da lente vai a zero junto com o foco. O contador some (opacidade 0 em 400 ms) e a legenda desce acompanhando o crescimento.
- **O foco fecha** com: novo clique, início de arraste, roda, Esc ou setas.

### Compressão por velocidade
- Mede-se a velocidade de deslocamento da fileira. Uma "energia" persegue mín(velocidade ÷ 2600, 1), com suavização exponencial de constante **0,07 s** ao subir e **0,35 s** ao descer.
- Todos os cartões são escalados por 1 − compressão × energia, com compressão padrão **0,2**. A fileira "encolhe" levemente quando corre.

### Lente "líquida" (opcional, padrão 0)
Uma segunda mola, subamortecida (rigidez 120 e amortecimento de 32% do crítico), segue a velocidade normalizada da fileira, mín(máx(v ÷ 2200, −1), 1). O desvio dessa mola, multiplicado pela intensidade líquida:
- alarga a lente até +16% e a achata até −8%;
- desloca o centro da lente em até 14 px contra o movimento;
- aumenta a dispersão até +120%.
O efeito é uma lente que balança como gelatina depois de movimentos rápidos.

### Lente que segue o cursor (opcional, desligada)
O centro da lente persegue o ponteiro com uma mola de rigidez **110** e 80% do amortecimento crítico. Isso só vale com mouse sobre o palco, sem arraste e sem foco aberto. Nos outros casos, a lente volta ao centro do palco.

### Reprodução automática (opcional, desligada)
Avança um item a cada intervalo (padrão **4 s**) quando todas as condições abaixo valem:
- a entrada terminou;
- não há foco aberto;
- o ponteiro não está sobre o palco nem pressionado;
- o palco não tem foco de teclado;
- a posição está assentada;
- passaram 3 s desde a última interação.
Fica desativada com movimento reduzido.

### Animação de entrada
Começa quando todas as imagens carregaram ou falharam, ou após **3,5 s**. Antes disso, nada é visível. Qualquer pressão, roda ou seta pula direto para o fim. "Atraso por distância" = mín(|posição relativa| ÷ (0,6 × largura do palco), 1).
- **Subida** (padrão, 2,1 s):
  - cada cartão tem atraso de até 0,34 do tempo total, proporcional à distância ao centro;
  - progresso local = (t − atraso) ÷ 0,6;
  - opacidade = 4 × progresso local, com teto 1;
  - o cartão parte de 62% da altura do palco abaixo e chega com ease-out quíntico;
  - a escala vai de 0,5 a 1 com ease-in-out, a partir de 18% do progresso local;
  - a dobra da lente surge com ease-in-out entre 30% e 95% do tempo.
- **Florescer** (1,6 s): opacidade de 0 a 1 e escala de 0,92 a 1, com ease-out cúbico e atraso de até 0,25. A dobra surge entre 20% e 100%.
- **Giro** (2,2 s): a fileira parte deslocada de 1,6 laço + uma largura de palco e é lançada com velocidade igual a −3 × essa distância, numa mola frouxa (rigidez 9), "chicoteando" até o item inicial. A cena aparece em 25% do tempo e a dobra surge entre 55% e 100%.
- **Distribuir** (1,5 s): todos os cartões começam empilhados no centro e se espalham para as posições finais com ease-out. O atraso é de até 0,3 por distância, com início em 0,12. A dobra surge entre 45% e 95%.
- **Nenhuma**: aparece imediatamente.
- Com movimento reduzido, qualquer entrada vira um **esmaecimento de 0,35 s**.
- **Legenda**: aparece só ao fim da entrada, com fade de 900 ms. A cada troca de item, o título entra com opacidade 0→1 e subida de 8 px, em 520 ms, curva (0,22; 1; 0,36; 1). Os rolos de dígitos transicionam em 600 ms com a mesma curva.

## Técnica de renderização em alto nível
WebGL2 em duas passagens:
1. **Cena**: cada cartão é desenhado como um retângulo numa textura fora da tela, do tamanho do palco × DPR. O DPR é o menor entre o do dispositivo, 2 e √(4,5 milhões ÷ área do palco). O recorte arredondado usa um **campo de distância de retângulo arredondado** com antisserrilhamento de 1 pixel físico, e o alfa é pré-multiplicado. A textura da cena gera mipmaps.
2. **Lente**: um triângulo de tela cheia amostra a cena com um deslocamento por pixel.
   - **Forma da lente**: superelipse. O expoente é 2 (elipse) com arredondamento 1 e cresce até 12 (quase retângulo) com arredondamento 0, pela fórmula 2 + (1 − arredondamento)^1,5 × 10.
   - **Dimensões**: semieixos = largura da lente × largura do palco ÷ 2 e altura da lente × **largura** do palco ÷ 2. As duas medidas são frações da largura, para manter a forma em qualquer tamanho. A lente é girada pelo ângulo de inclinação.
   - **Distância à borda**: para cada pixel, estima-se a distância com sinal à borda da superelipse, dividindo o valor implícito menos 1 pelo módulo do seu gradiente. Também se obtêm a normal e a tangente da borda.
   - **Faixa de transição**: vai de −"alcance interno" (dentro) a +1,6 × alcance interno (fora), com alcance interno = alcance × média dos semieixos (mínimo 4 px). O progresso nessa faixa passa por uma rampa suave quíntica. Daí sai também uma "inclinação" em forma de sino, 16·t²·(1−t)², com pico no meio da faixa.
   - **Lado**: suavização entre 2% e 30% da meia largura do palco, a partir do centro da lente, multiplicada pelo sentido da curvatura:
     - torção (padrão): sinal horizontal, ou seja, a esquerda desce e a direita sobe;
     - subir: +1 dos dois lados;
     - descer: −1 dos dois lados.
   - **Deslocamento**: o amostrador é deslocado verticalmente por rampa × lado × fluxo × intensidade, com fluxo = dobra × soma dos semieixos × 0,45 px. Dentro da lente, o deslocamento é zero e a fileira fica reta. Fora, a fileira inteira fica deslocada. Na faixa, ela se curva. Soma-se um pequeno redemoinho ao longo da tangente, proporcional à inclinação (35%).
   - **Dispersão cromática**: só na zona de inclinação, ao longo do eixo vertical. São 12 amostras ao longo de um segmento cujo comprimento é inclinação × fluxo × dispersão × 0,12, com pesos triangulares centrados em 15% (vermelho), 50% (verde) e 85% (azul). O resultado é misturado à cor base de forma suave, conforme o comprimento em pixels.
   - **Anti-moiré**: os gradientes de amostragem são limitados a 3 texels.

Renderização sob demanda: o laço só roda enquanto há animação, arraste, entrada, reprodução automática ou mudança. Ele pausa quando o palco sai da tela (observador de interseção) e retoma quando a aba volta a ficar visível. A legenda, o contador e a região viva são DOM sobre o canvas. O canvas fica oculto para tecnologias assistivas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens (imagem, texto alternativo, título, subtítulo opcionais) | array | 12 imagens procedurais |
| Predefinição da lente | líquido / fita / vórtice / arco | líquido |
| Animação de entrada | subida / florescer / giro / distribuir / nenhuma | subida |
| Enquadramento dos cartões | natural / retrato / quadrado / paisagem | natural |
| Altura do cartão (fração da altura do palco) | número | 0,5 |
| Espaço entre cartões | px | 12 |
| Raio dos cantos | px | 0 |
| Largura da lente (fração da largura do palco) | número | da predefinição |
| Altura da lente (fração da largura do palco) | número | da predefinição |
| Inclinação da lente | graus | da predefinição |
| Arredondamento da lente (0 = retângulo, 1 = elipse) | 0–1 | da predefinição |
| Intensidade da dobra | número | da predefinição |
| Largura da faixa de curvatura | número | da predefinição |
| Sentido da curvatura | torção / subir / descer | da predefinição |
| Dispersão cromática | número | da predefinição |
| Balanço líquido | 0–1 | da predefinição (0) |
| Lente segue o cursor | booleano | da predefinição (falso) |
| Compressão por velocidade | 0–0,4 | 0,2 |
| Abrir em foco ao clicar | booleano | verdadeiro |
| Reprodução automática / intervalo | booleano / s | falso / 4 |
| Mostrar legenda | booleano | verdadeiro |
| Roda vertical rola o carrossel | booleano | verdadeiro |
| Ao trocar o item ativo (índice, item) | função | — |
| Ao selecionar um item (índice, item) | função | — |
| Classe e estilo extras | string / objeto | vazios |

**Predefinições** (largura, altura, inclinação, arredondamento, dobra, alcance, curvatura, dispersão):
| Nome | Largura | Altura | Inclinação | Arredondamento | Dobra | Alcance | Curvatura | Dispersão |
|---|---|---|---|---|---|---|---|---|
| líquido | 0,74 | 1,18 | 62° | 1 | 0,34 | 0,38 | torção | 0,45 |
| fita | 0,8 | 0,8 | 0° | 1 | 0,34 | 0,34 | torção | 0,4 |
| vórtice | 0,7 | 0,95 | 30° | 1 | 0,46 | 0,30 | torção | 0,5 |
| arco | 0,8 | 0,8 | 0° | 1 | 0,30 | 0,36 | subir | 0,4 |

Em todas as predefinições, o balanço líquido é 0 e a lente não segue o cursor. Qualquer parâmetro de lente passado explicitamente substitui o valor da predefinição.

## Demo
- Área de **540 px de altura**, largura total, sem padding, overflow oculto e fundo escuro do site (texto claro).
- Carrossel com os 12 itens procedurais e os padrões, incluindo a entrada "subida".
- Botão discreto de "recarregar" no canto, que remonta o componente para repetir a entrada.
- O efeito aparece sem ponteiro, graças à entrada automática e à dobra estática. Para a prévia, recomenda-se ligar uma reprodução automática lenta (por exemplo, a cada 3 s) para mostrar a dobra e a dispersão em movimento.
- Controles:
  - predefinição (aplica todos os valores da lente);
  - entrada (remonta);
  - enquadramento;
  - altura do cartão de 0,3 a 0,8;
  - espaço de 0 a 64;
  - raio de 0 a 48;
  - largura e altura da lente de 0,2 a 2;
  - inclinação de −180 a 180;
  - arredondamento de 0 a 1;
  - dobra de 0 a 1,2;
  - alcance de 0,1 a 0,9;
  - curvatura;
  - dispersão de 0 a 2;
  - líquido de 0 a 1;
  - seguir o cursor;
  - compressão de 0 a 0,4;
  - foco ao clicar;
  - reprodução automática;
  - intervalo de 1,5 a 10 s (passo 0,5), habilitado só com reprodução automática;
  - legenda;
  - captura da roda.

## Acessibilidade e responsividade
- O palco é uma **região** com descrição de papel "carrossel" e rótulo "Image carousel". É focável (tabindex 0) e operável por teclado (ver Comportamento).
- Região viva educada e visualmente oculta que anuncia "Título, i de n" a cada troca. A legenda visual fica oculta para leitores de tela, para não duplicar.
- Respeita `prefers-reduced-motion`:
  - entrada vira esmaecimento;
  - sem paralaxe interna;
  - sem energia/compressão;
  - sem balanço líquido;
  - sem reprodução automática;
  - sem animações de legenda e rolos.
- **Responsivo**: as dimensões derivam do palco (altura do cartão relativa à altura; lente relativa à largura). O redimensionamento preserva o item centralizado.
- Toque: o arraste horizontal move o carrossel e o vertical rola a página.

## Observações de fidelidade
- **Recomendação**: a referência exige WebGL2 e, sem ele, não mostra nada. Implementar uma alternativa simples (fileira DOM sem dobra, com o mesmo arraste e encaixe) quando WebGL2 não estiver disponível.
- **Recomendação**: a altura da legenda usa a fração bruta da altura do cartão, sem considerar o mínimo de 24 px. Em palcos muito baixos, isso pode desalinhar. Calcular a posição a partir da altura real.
- A dobra nunca é desenhada como contorno: a lente é invisível e só se percebe pela deformação da fileira. Não adicionar borda nem reflexo.
