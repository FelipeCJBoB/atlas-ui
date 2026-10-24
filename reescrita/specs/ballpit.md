# Especificação: Piscina de bolinhas (ballpit)

## Propósito
Fundo 3D interativo com dezenas ou centenas de esferas brilhantes (aspecto de plástico envernizado) que caem sob gravidade, colidem entre si, quicam nas bordas e se acumulam no fundo da área, como uma piscina de bolinhas. Uma esfera especial segue o ponteiro e empurra as demais; uma luz pontual colorida viaja junto com ela.

## Aparência
- **Superfície**: elemento de desenho que ocupa 100% × 100% do pai, exibido em bloco, com **fundo transparente** (o fundo da página aparece entre as bolas). Antisserrilhamento ligado. Seleção de texto e gestos de toque nativos desativados sobre ela.
- **Esferas**: geometria de esfera lisa (raio unitário, malha de cerca de 32 × 16 segmentos), desenhada em instâncias. Raio de cada bola:
  - bola 0 (a do cursor): tamanho próprio, padrão **1**;
  - demais: sorteado uniformemente entre o mínimo (padrão **0,5**) e o máximo (padrão **1**), em unidades de mundo.
- **Material**: físico/PBR, com metalicidade **0,5**, rugosidade **0,5**, verniz (clearcoat) **1** com rugosidade do verniz **0,15**. Reflexos vêm de um **ambiente procedural de "sala" iluminada** (caixa clara com painéis de luz, gerado em código, levemente desfocado), girado −90° no eixo X. **Nenhum arquivo de textura/HDR é usado.**
- **Translucidez falsa**: além da iluminação padrão, soma-se à componente difusa um termo de "luz atravessando" (retroespalhamento): é forte quando a luz está atrás da bola em relação ao observador. Valores: distorção da normal 0,1, expoente 2, escala 10, ambiente 0, atenuação 0,1. O efeito é um brilho suave colorido nas bordas das bolas voltadas para a luz pontual.
- **Cores**: lista de cores interpolada linearmente como um gradiente ao longo dos índices das bolas (bola i recebe a cor na posição i ÷ total). Padrão da lista: **[preto, preto, preto]**, o que resulta em bolas pretas brilhantes, visíveis apenas pelos reflexos. A lista só é aplicada se tiver 2 ou mais cores.
- **Luzes**: luz ambiente branca (`#ffffff`) de intensidade **1**; luz pontual com a cor da bola 0 e intensidade **200** (decaimento físico), posicionada sempre no centro da bola 0.
- **Tonalização**: mapeamento de tons filmico (ACES) e saída em sRGB.
- **Câmera**: perspectiva com campo de visão vertical de 50°, em (0, 0, 20) olhando para a origem. Se a proporção largura/altura passar de **1,5**, o campo vertical é reduzido para que a largura visível seja a mesma que teria em 1,5 (telas muito largas não mostram mais área lateral, mostram menos altura).

## Comportamento
### Limites do "aquário"
- Metade da largura e metade da altura visíveis no plano z = 0 viram os limites X e Y (com a câmera padrão, a meia-altura é ~9,3 unidades). Profundidade: ±**2** unidades.
- No primeiro instante os limites valem ±5 em X e Y; após o primeiro ajuste de tamanho (cerca de 100 ms) passam a ser os da área visível.
### Estado inicial
- Bola 0 na origem; as demais em posições aleatórias uniformes dentro de ±limite X, ±limite Y e ±limite Z, todas com velocidade zero.
### Passo de física (a cada quadro, com Δt em segundos)
Para cada bola (exceto a 0 quando ela está sob controle do cursor):
1. velocidade vertical −= Δt × gravidade × raio da bola (gravidade padrão **0,5**; bolas maiores caem mais rápido);
2. velocidade ×= atrito (padrão **0,9975** por quadro);
3. módulo da velocidade limitado a **0,15** unidade/quadro;
4. posição += velocidade (por quadro, não escalado por Δt).

Depois, para cada par de bolas que se sobrepõe (distância < soma dos raios):
- cada uma é afastada metade da sobreposição ao longo da linha entre os centros;
- a velocidade de cada uma recebe um impulso nessa direção igual a ½ sobreposição × máx(|própria velocidade|, 1).
- A verificação é de todos contra todos (custo quadrático).

Colisão com a bola do cursor (quando controlada): a bola é empurrada para fora inteira (a sobreposição toda) e recebe impulso = sobreposição × máx(|velocidade|, 2).

Paredes:
- **X**: se a bola passa da borda, é recolocada encostada e a velocidade X é invertida e multiplicada pelo coeficiente de quique (padrão **0,95**).
- **Y**: com gravidade > 0 só existe chão (embaixo); o topo é aberto. Com gravidade = 0 existem chão e teto.
- **Z**: idem, com limite = maior entre a profundidade e o tamanho máximo.

### Bola do cursor
- Enquanto o ponteiro está sobre a superfície, a posição na tela é projetada num plano que passa pela origem, de frente para a câmera (z = 0). A bola 0 se move **10% da distância** até esse ponto a cada quadro e tem velocidade zero; ela empurra as demais.
- Quando o ponteiro sai (ou o toque termina), a bola 0 volta a obedecer à física normal (cai).
- A opção "seguir/exibir cursor" (padrão ligada) controla **só a visibilidade** da bola 0: desligada, ela fica com escala 0 (invisível), mas continua seguindo o ponteiro, empurrando as bolas e carregando a luz pontual.
- **Toque**: tocar dentro da área começa o controle; arrastar continua controlando mesmo saindo da área; soltar encerra.
- Clique não tem efeito.

### Ciclo de vida
- A animação pausa quando a superfície sai da viewport ou a aba fica oculta e retoma ao voltar (o relógio é reiniciado para não acumular um Δt enorme).
- Redimensionamento: observa o pai e a janela, com debounce de **100 ms**; a resolução usa o DPR do dispositivo.
- Mudança de parâmetros com o componente montado: a quantidade recria todas as bolas; cores e tamanhos são reaplicados sem recriar; os demais valem a partir do quadro seguinte.

## Técnica de renderização em alto nível
WebGL com motor 3D (cena, câmera perspectiva, malha instanciada de esferas e material PBR estendido com um termo extra de iluminação de translucidez). A física é um laço próprio em CPU, com arrays planos de posição, velocidade e raio, atualizados antes de cada render; as matrizes das instâncias são reescritas a cada quadro. O ambiente de reflexo é gerado proceduralmente (cena simples de sala pré-filtrada para reflexos difusos/especulares).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Quantidade de bolas | inteiro | 200 |
| Gravidade | número | 0,5 |
| Atrito (multiplicador por quadro) | número | 0,9975 |
| Coeficiente de quique nas paredes | número | 0,95 |
| Exibir a bola do cursor | booleano | verdadeiro |
| Lista de cores (gradiente por índice) | array de cores | [preto, preto, preto] |
| Cor da luz ambiente | cor | branco |
| Intensidade da luz ambiente | número | 1 |
| Intensidade da luz pontual | número | 200 |
| Raio mínimo / máximo das bolas | número | 0,5 / 1 |
| Raio da bola do cursor | número | 1 |
| Velocidade máxima (unidades/quadro) | número | 0,15 |
| Limites iniciais X / Y / Z | número | 5 / 5 / 2 |
| Parâmetros do material (metal, rugosidade, verniz, rugosidade do verniz) | objeto | 0,5 / 0,5 / 1 / 0,15 |
| Classe extra da superfície | string | vazia |

## Demo
- Área de prévia com altura fixa de **500 px**, largura total e overflow oculto, fundo escuro do site; botão de recarregar no canto, que remonta o componente.
- Valores: **100 bolas**, gravidade **0,01** (quase flutuando), atrito 0,9975, quique 0,95, bola do cursor **oculta**, cores **[`#ffffff`, `#000000`, `#5227ff`]** (gradiente branco → preto → roxo-azulado ao longo das bolas).
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula com o texto **"New Background"** e, abaixo, o título **"Balls! What's not to like about them?"**, ambos centralizados. Os estilos exatos não constam da referência; aproximação: selo pequeno com fundo branco translúcido (~10%) e borda sutil, título branco de ~2,5rem, peso 600, centralizado e com largura máxima de ~20ch. A sobreposição não deve bloquear o ponteiro.
- Controles (cada mudança remonta): chave "Display Cursor"; quantidade 50–500 (passo 10); gravidade 0–1 (0,1); atrito 0,9–1 (0,001); quique 0,5–1 (0,05).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, renderizar as bolas já assentadas e sem animação contínua (ou reduzir drasticamente a velocidade).
- Custo cresce com o quadrado da quantidade; em telas pequenas/fracas, recomenda-se reduzir a quantidade (por exemplo, para metade).
- Funciona com mouse e toque.

## Observações de fidelidade
- **Recomendação (grave)**: a referência registra os ouvintes de toque no `body` da página e cancela o comportamento padrão de **todo** toque em qualquer lugar, bloqueando a rolagem da página inteira no celular. Escutar só a própria superfície e cancelar o padrão apenas quando o toque começa dentro dela.
- **Recomendação**: com a bola do cursor oculta ela continua sendo um obstáculo invisível que segue o ponteiro; manter (é o comportamento da prévia), mas documentar. Opcionalmente, oferecer um modo sem interação.
- **Recomendação**: integrar a posição com Δt (independente da taxa de quadros); na referência, telas de 120 Hz animam duas vezes mais rápido.
- **Recomendação**: lista com uma só cor é ignorada na referência (as bolas ficam brancas); aceitar uma cor única como cor uniforme.
- **Recomendação**: limitar o DPR a 2 para evitar custo excessivo em telas de alta densidade.
