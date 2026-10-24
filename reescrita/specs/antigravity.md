# Especificação: Anel magnético de partículas (antigravity)

## Propósito
Um fundo 3D interativo: centenas de pequenas partículas alongadas, como cápsulas, espalhadas pela área. As que estão perto do cursor são atraídas e formam um **anel ondulante** em volta dele, todas orientadas radialmente, como limalha de ferro em torno de um ímã. As partículas distantes ficam paradas e encolhem até sumir conforme se afastam. Sem interação, o "ímã" pode passear sozinho num traçado em forma de oito.

## Aparência
- **Superfície**: ocupa 100% × 100% do contêiner, com **fundo transparente** (o fundo vem da página).
- **Câmera**: perspectiva com campo de visão vertical de **35°**, posicionada a **50 unidades** do plano central e olhando para ele.
  - Nesse plano, a altura visível é de ≈ **31,5 unidades** (2 × 50 × tan 17,5°), e a largura é a altura × a proporção do contêiner.
  - Numa prévia de 500 px de altura, 1 unidade ≈ 16 px.
- **Partículas**: geometrias 3D simples, sem iluminação, numa **cor chapada única** (sem sombreamento, sem brilho).
  - Cor padrão do componente: **`#FF9FFC`** (rosa); na demo, **`#5227FF`** (violeta).
  - Formas disponíveis, com dimensões na escala 1:
    - **cápsula** (padrão): raio de 0,1 e corpo de 0,4, ou seja, comprimento total de 0,6;
    - **esfera**: raio de 0,2;
    - **cubo**: aresta de 0,3;
    - **tetraedro**: raio de 0,3.
- **Distribuição inicial**: N partículas (padrão **300**) com posições aleatórias uniformes cobrindo toda a largura e altura visíveis do plano central, e profundidade aleatória entre **−10 e +10** unidades.
- **Orientação**: cada partícula aponta o eixo longo **em direção ao centro do ímã**, no plano da tela, o que gera um padrão radial.

## Comportamento
### Alvo do ímã
- A posição do ponteiro é convertida de coordenadas normalizadas (−1 a 1) para unidades do plano central (× metade da largura e da altura visíveis).
- **Movimento automático** (opcional, desligado no componente e ligado na demo): se o ponteiro não se move há mais de **2 s**, o alvo passa a seguir uma curva de Lissajous: X = seno(0,5 × tempo) × ¼ da largura e Y = cosseno(1,0 × tempo) × ¼ da altura. O resultado é um traçado em forma de oito.
- O alvo efetivo ("ímã virtual") persegue o destino com suavização exponencial de **5% por quadro**.
- **Rotação global**: um ângulo extra = tempo decorrido × velocidade de rotação (padrão **0** rad/s) é somado ao ângulo de cada partícula no anel, fazendo o anel girar.

### Por partícula, a cada quadro
- Cada partícula tem: posição de repouso; posição atual; fase própria que avança devagar (incremento aleatório de ~0,005 a ~0,0075 por quadro, partindo de um valor aleatório); e deslocamento aleatório de raio entre −1 e 1.
- **Correção de paralaxe**: o ímã é projetado para a profundidade atual da partícula, multiplicando suas coordenadas por (1 − profundidade ÷ 50), para que o anel pareça centrado no cursor em qualquer profundidade.
- Se a distância, no plano, entre a **posição de repouso** e o ímã projetado for menor que o **raio do campo** (padrão do componente **10**; demo **6**), a partícula é capturada:
  - ângulo = direção do ímã até a partícula + rotação global;
  - **onda**: seno(fase × velocidade da onda + ângulo) × 0,5 × amplitude da onda. A velocidade padrão é **0,4** e a amplitude **1**; amplitude 0 gera um círculo perfeito;
  - **desvio**: deslocamento aleatório × 5 ÷ (intensidade do campo + 0,1). A intensidade padrão é **10**: valores maiores deixam o anel mais fino e coeso;
  - **raio local** = raio do anel (padrão do componente **10**; demo **7**) + onda + desvio;
  - posição-alvo = ímã + raio local na direção do ângulo;
  - profundidade-alvo = profundidade de repouso × fator de profundidade + seno(fase) × amplitude × fator de profundidade (fator padrão **1**).
- Caso contrário, o alvo é a posição de repouso, com profundidade multiplicada pelo fator de profundidade.
- **Movimento**: a posição atual se aproxima do alvo por interpolação linear com fator fixo por quadro, a "velocidade de atração" (padrão do componente **0,1**; demo **0,05**). Isso gera chegada suave e saída igualmente suave quando o ímã se afasta.
- **Escala**:
  - fator de visibilidade = 1 − |distância atual ao ímã − raio do anel| ÷ 10, limitado entre 0 e 1;
  - escala final = fator de visibilidade × (0,8 + seno(fase × velocidade de pulsação) × 0,2 × variação) × tamanho da partícula;
  - padrões: velocidade de pulsação **3**, variação **1**, tamanho **2** no componente e **1,5** na demo.
  - Consequência importante: só aparecem as partículas a até ~10 unidades da linha do anel. As que estão sobre o anel ficam no tamanho máximo e pulsam levemente; as mais afastadas encolhem até desaparecer. O resultado é um anel denso de cápsulas radiais cercado por um halo esparso que se dissolve com a distância.

### Outros
- Antes do primeiro movimento do ponteiro, o ímã está no centro.
- Se o tamanho do contêiner muda, as partículas são redistribuídas.
- O laço roda continuamente, sincronizado com a taxa de quadros.

## Técnica de renderização em alto nível
WebGL com uma cena 3D: câmera em perspectiva e uma **malha instanciada**, ou seja, uma única geometria desenhada N vezes com matrizes de transformação por instância (posição, orientação e escala). O material é básico, sem luz. As matrizes são recalculadas na CPU a cada quadro. A orientação pode ser obtida apontando o eixo da partícula para o ímã projetado na mesma profundidade e rotacionando 90° para alinhar o eixo longo da cápsula. Pode-se usar uma biblioteca 3D (ex.: Three.js) ou WebGL puro com instancing. As formas devem ser geradas proceduralmente (não há modelos externos).

## Parâmetros configuráveis
| Significado | Tipo | Padrão (componente) | Demo |
|---|---|---|---|
| Quantidade de partículas | inteiro | 300 | 300 |
| Raio de captura do ímã | número (unidades) | 10 | 6 |
| Raio do anel | número (unidades) | 10 | 7 |
| Velocidade da onda do anel | número | 0,4 | 0,4 |
| Amplitude da onda (0 = círculo perfeito) | número | 1 | 1 |
| Tamanho das partículas (multiplicador) | número | 2 | 1,5 |
| Velocidade de atração (fração por quadro) | número | 0,1 | 0,05 |
| Cor | string hex | `#FF9FFC` | `#5227FF` |
| Movimento automático quando ocioso | booleano | falso | verdadeiro |
| Variação de tamanho na pulsação (0–1) | número | 1 | 1 |
| Velocidade de rotação do anel | número (rad/s) | 0 | 0 |
| Fator de profundidade | número | 1 | 1 |
| Velocidade da pulsação de tamanho | número | 3 | 3 |
| Forma | `cápsula` / `esfera` / `cubo` / `tetraedro` | cápsula | cápsula |
| Intensidade do campo (coesão do anel) | número | 10 | 10 |

## Demo
- Área de prévia com **500 px de altura**, sem padding, com overflow oculto e fundo escuro do site. O componente ocupa a área inteira.
- Usa os valores da coluna "Demo".
- Controles (cada mudança remonta):
  - cor;
  - forma;
  - raio de captura de 5 a 50;
  - raio do anel de 5 a 25;
  - velocidade da onda de 0 a 5;
  - amplitude de 0 a 5;
  - tamanho de 0,1 a 2;
  - variação de 0 a 1;
  - atração de 0,01 a 0,2;
  - quantidade de 100 a 5000 (passo 100);
  - rotação de 0 a 5;
  - profundidade de 0 a 5;
  - pulsação de 0 a 10;
  - intensidade de 0,1 a 20;
  - movimento automático.

## Acessibilidade e responsividade
- Efeito decorativo: a superfície deve ser `aria-hidden` e não focável.
- **Recomendação**: com `prefers-reduced-motion`, desligar o movimento automático, a onda e a pulsação, ou renderizar um único quadro estático.
- Pausar o laço quando o componente estiver fora da tela ou a aba estiver oculta.
- Toque: o ímã segue o último toque. Com o movimento automático ligado, o efeito continua vivo sem interação.
- Limitar o *device pixel ratio* (ex.: até 2) para preservar o desempenho com muitas partículas.

## Observações de fidelidade
- Suavizações, avanço de fase e atração são definidos **por quadro**, então a velocidade varia com a taxa de atualização (60 Hz × 120 Hz). Recomendação: normalizar pelo tempo decorrido (ex.: fator efetivo = 1 − (1 − f)^(Δt × 60)).
- Quando o ponteiro sai da área, o ímã fica parado na última posição. Comportamento aceitável; opcionalmente, voltar ao centro ou ativar o movimento automático.
- As matrizes são recalculadas na CPU para todas as partículas a cada quadro. Para quantidades altas (5000), considerar mover o cálculo para o shader de vértice.
