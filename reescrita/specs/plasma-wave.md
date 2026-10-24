# Especificação: Onda de plasma (plasma-wave)

## Propósito
Fundo animado com dois "tubos" de luz néon que se enrolam em hélice e atravessam a tela horizontalmente, vistos em perspectiva, com brilho em faixas concêntricas. Cada tubo tem sua cor (padrão roxo e ciano) e, onde se aproximam, as cores se misturam. O resto da tela fica transparente.

## Aparência
- **Contêiner**: bloco 100% × 100% do pai, sem fundo nem bordas.
- **Superfície**: tela WebGL do tamanho do contêiner; densidade de pixels = min(DPR, **1,5**); antisserrilhamento ligado; fundo transparente.
- **Geometria visual** (espaço 3D, câmera a 7 unidades atrás do plano, olhando para a frente; distância focal padrão **0,8**, o que dá um campo de visão bem aberto):
  - dois tubos de raio **0,3** que correm ao longo do eixo horizontal, de muito longe à esquerda até um fim arredondado/cortado fora da tela à direita (ou seja, cobrem toda a largura);
  - o centro de cada tubo descreve uma **hélice** em torno do eixo horizontal: no plano vertical/profundidade, o centro gira num círculo cujo raio é a "curvatura" do tubo (padrão **1** para o primeiro, **0,5** para o segundo), avançando de fase conforme a posição horizontal (1 rad por unidade);
  - a curvatura de cada tubo oscila ±0,1 ao longo do comprimento e do tempo (frequências levemente diferentes para cada tubo), dando um aspecto vivo.
- **Brilho**: a imagem é formada por apenas **14 passos** de marcha do raio; a cor resulta de uma função cosseno da distância percorrida menos o erro residual, o que gera **faixas/anéis concêntricos** de luz ao redor dos tubos (aspecto de plasma contornado, não de superfície sólida). Os canais são misturados entre si e elevados ao quadrado para realçar o núcleo; a luminância resultante × **3,5** multiplica a cor base.
- **Cor base**: média ponderada das duas cores pela proximidade a cada tubo (peso decai linearmente até zero a 0,5 unidade da superfície do tubo). Padrões: **`#A855F7`** (roxo) e **`#06B6D4`** (ciano).
- **Transparência**: pixels com campo de brilho abaixo de **0,15** são descartados (transparentes); os demais são opacos.
- **Modo claro** (opcional): fundo **branco opaco**; os tubos aparecem em versões mais vívidas das cores (saturação aumentada 1,35×, curva de gama 0,64, ×1,14), com presença calculada por três máscaras suaves (contorno externo, halo e núcleo) e um leve clareamento no núcleo mais brilhante.

## Comportamento
- **Tempo**: segundos desde a montagem × π.
- **Rotação das hélices**: a fase do primeiro tubo avança com tempo × velocidade 1 (padrão **0,05**); a do segundo com tempo × velocidade 2 (padrão **0,05**) × sentido do segundo (padrão **1**; −1 inverte o giro, 0 congela). Em velocidade padrão, o giro é lento (≈ 0,16 rad/s).
- **Oscilação da curvatura**: independente das velocidades, a 0,7π e 0,9π rad/s.
- **Transformações de tela**: deslocamento em px (horizontal/vertical) e rotação da imagem inteira em torno do centro (graus).
- Todos os parâmetros são lidos a cada quadro (mudanças valem imediatamente, sem recriar o contexto).
- **Redimensionamento**: observado no contêiner.
- Animação contínua (sem pausa fora da tela).

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia e shader de fragmento de **marcha de raio com campo de distância** (união de dois cilindros helicoidais semi-infinitos), com contagem de passos propositalmente baixa — o "erro" da marcha vira o padrão estético em faixas. Coloração por mistura de canais, luminância e pesos de proximidade. Sem assets.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Deslocamento horizontal da imagem | número (px) | 0 |
| Deslocamento vertical da imagem | número (px) | 0 |
| Rotação da imagem | número (graus) | 0 |
| Distância focal (menor = mais grande-angular) | número | 0,8 |
| Velocidade de giro do tubo 1 | número | 0,05 |
| Velocidade de giro do tubo 2 | número | 0,05 |
| Sentido do tubo 2 | número −1 a 1 | 1 |
| Raio da hélice do tubo 1 | número | 1 |
| Raio da hélice do tubo 2 | número | 0,5 |
| Duas cores (tubo 1, tubo 2) | par de hex | `#A855F7`, `#06B6D4` |
| Modo claro | booleano | desligado |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores: todos os padrões.
- **Sobreposição de demonstração** (opcional, sem captura de ponteiro): navegação em vidro com logotipo genérico (SVG próprio), pílula **"New Background"**, título **"Raymarched plasma waves powered by OGL"** (pode ser adaptado para não citar biblioteca), botões "Get started"/"Learn more" e interruptor "Demo Content".
- Controles: cor 1, cor 2, velocidade 1 e 2 (0–0,2, passo 0,005), distância focal 0,1–2 (0,05), curvatura 1 e 2 (0–3, 0,1), sentido 2 (−1 a 1, 0,1), rotação 0–360 (1). Na referência cada mudança remonta o componente; na reimplementação basta atualizar em tempo real.

## Acessibilidade e responsividade
- Decorativo: ocultar a tela de leitores de tela.
- Recomendação: com `prefers-reduced-motion`, renderizar quadro estático.
- Recomendação: pausar quando fora da viewport ou com a aba oculta.
- Responsivo: o campo de visão é normalizado pela altura, então telas mais largas mostram mais comprimento dos tubos.

## Observações de fidelidade
- Recomendação: a referência só aceita hex de 6 dígitos com `#`; aceitar qualquer cor CSS (ou ao menos hex curto) com fallback.
- Recomendação: o contêiner não define posição relativa nem overflow oculto; definir ambos para que a tela não vaze.
- A aparência em faixas depende da contagem baixa de passos (14) e do critério de parada; aumentar os passos muda o visual — manter 14.
