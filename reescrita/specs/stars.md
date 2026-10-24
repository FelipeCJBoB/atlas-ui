# Especificação: Fundo de estrelas (stars)

## Propósito

Um fundo de "céu estrelado" para preencher uma área: três camadas de pontinhos de tamanhos diferentes sobem devagar e sem fim, cada uma numa velocidade (efeito de profundidade). Quando o ponteiro se move sobre a área, o céu inteiro desliza levemente no sentido oposto ao ponteiro, com atraso elástico (efeito de paralaxe). Pode receber conteúdo filho, que fica por cima das estrelas.

## Aparência

- **Contêiner**
  - Bloco com posicionamento relativo, 100% da largura e 100% da altura do pai.
  - Corta tudo o que passa das bordas.
  - Fundo padrão: gradiente radial em elipse, com o centro na **base** da área: `#262626` no centro (0%) até `#000000` na borda (100%). Visual: um brilho cinza-escuro subindo do rodapé até o preto no topo e nos cantos.
  - O fundo pode ser trocado por quem usa (classe ou estilo extra).
- **Estrelas**
  - Pontos quadrados de cantos totalmente arredondados (círculos), sem brilho nem desfoque, numa cor única (padrão **branco `#fff`**).
  - Três camadas:

| Camada | Diâmetro | Quantidade de estrelas | Duração de uma volta (com a velocidade padrão 50) |
|---|---|---|---|
| 1 (fundo, mais lenta em px/s) | 1 px | 1000 | 50 s |
| 2 | 2 px | 400 | 100 s |
| 3 | 3 px | 200 | 150 s |

  - Cada camada distribui as estrelas de forma aleatória uniforme (posições inteiras em px) dentro de um quadrado virtual de **4000 × 4000 px**, centrado no canto superior esquerdo da área (de −2000 a +2000 px nos dois eixos). Na prática só aparece a parte que cai dentro da área visível. Isso dá, por camada, uma densidade visível de aproximadamente:
    - camada 1: uma estrela a cada ~8.000 px² (numa área de 800 × 400 px, cerca de 40 pontinhos);
    - camada 2: uma a cada ~20.000 px² (~16 pontos);
    - camada 3: uma a cada ~40.000 px² (~8 pontos).
  - O padrão de cada camada é sorteado na montagem e sorteado de novo se a cor ou a quantidade mudarem. Não é determinístico.
- **Conteúdo filho**: renderizado depois das camadas, no fluxo normal, por cima delas.

## Comportamento

### Deriva contínua (subida)

- Cada camada é uma faixa de 2000 px de altura que se desloca verticalmente de 0 a −2000 px (para cima) em velocidade **linear constante**, repetindo para sempre. A duração de uma volta é a velocidade-base (padrão 50 s) multiplicada por 1, 2 e 3 para as camadas 1, 2 e 3.
- Em px/s: camada 1 sobe 40 px/s, camada 2 sobe 20 px/s e camada 3 sobe ~13,3 px/s com os padrões. Ou seja, as estrelas pequenas sobem mais rápido que as grandes.
- Para o laço parecer contínuo, o mesmo padrão de estrelas é desenhado duas vezes, a segunda cópia deslocada 2000 px para baixo, e a faixa volta a 0 ao completar a volta.
- A animação começa na montagem e não para (inclusive quando a área está fora da tela).

### Paralaxe pelo ponteiro

- Enquanto o ponteiro se move sobre o contêiner, calcula-se um deslocamento-alvo para o grupo das três camadas:
  - horizontal = −(x do ponteiro − metade da largura da **janela**) × fator;
  - vertical = −(y do ponteiro − metade da altura da **janela**) × fator;
  - x e y são coordenadas de viewport; fator padrão **0,05**.
  - Exemplo: com o ponteiro 400 px à direita do centro da janela, o céu vai 20 px para a esquerda.
- O deslocamento real persegue o alvo com uma **mola**: rigidez **50**, amortecimento **20**, massa 1. É lenta e macia, quase sem oscilação.
- O deslocamento inicial é de 1 px em cada eixo.
- Quando o ponteiro sai da área, o céu **permanece** onde estava (não volta ao centro).
- As três camadas recebem o mesmo deslocamento (a profundidade vem só da diferença de velocidade de subida).

### Eventos de ponteiro

- Por padrão, a camada das estrelas aceita eventos de ponteiro. Uma opção desliga isso (a camada passa a ignorar o ponteiro), útil quando há conteúdo interativo por cima.
- O rastreio de movimento está no contêiner, então continua funcionando com essa opção desligada.

## Técnica de renderização em alto nível

- DOM e CSS puros, sem canvas.
- Cada camada é um elemento posicionado de forma absoluta (topo-esquerda, largura total, 2000 px de altura) animado por translação vertical linear e infinita.
- Dentro de cada camada há um único elemento minúsculo do tamanho da estrela, transparente, que "carimba" todas as estrelas por meio de **sombras múltiplas** (uma sombra sem desfoque por estrela, cada uma num deslocamento x/y sorteado, na cor da estrela). Uma segunda cópia idêntica fica 2000 px abaixo.
- Um invólucro comum às três camadas recebe a translação x/y animada por mola.
- Alternativa aceitável na reimplementação: desenhar as estrelas num canvas 2D, desde que a aparência (círculos sólidos de 1/2/3 px, densidades e velocidades) e a paralaxe por mola sejam iguais.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Fator de paralaxe (quanto o céu se move em relação ao ponteiro) | número | 0,05 |
| Duração-base de uma volta da camada 1, em segundos (camadas 2 e 3 usam 2× e 3×) | número | 50 |
| Mola da paralaxe (rigidez, amortecimento) | objeto | 50 / 20 |
| Cor das estrelas | string de cor CSS | `#fff` |
| Camada das estrelas aceita eventos de ponteiro | booleano | verdadeiro |
| Conteúdo filho | nós React | nenhum |
| Classe e atributos extras do contêiner | — | repassados |

## Demo

- O fundo ocupa a área de prévia inteira (posição absoluta, 0 nas quatro bordas), com cantos arredondados de **14 px**, conteúdo centralizado (sem filhos na demo).
- **Tema escuro**: gradiente padrão (`#262626` na base até `#000000`), estrelas brancas `#FFF`.
- **Tema claro**: gradiente radial em elipse a partir da base, de `#f5f5f5` até `#ffffff`, e estrelas pretas `#000`.
- Sem controles.

## Acessibilidade e responsividade

- Decorativo: as camadas de estrelas devem ficar ocultas para tecnologias assistivas.
- Não recebe foco.
- **Movimento reduzido**: recomendação (não presente na referência) — com `prefers-reduced-motion`, parar a subida e desligar a paralaxe, mantendo as estrelas estáticas.
- Responsivo: ocupa qualquer tamanho do pai. Áreas maiores que ~2000 px de largura ou altura ficam com faixas sem estrelas (ver observações).

## Observações de fidelidade

- **Recomendação — laço sem "pulo"**: na referência, o padrão ocupa de −2000 a +2000 px na vertical e a segunda cópia fica a +2000 px. As duas cópias se sobrepõem entre 0 e 2000 px, então a densidade visível muda ao longo da volta e, no reinício, algumas estrelas surgem do nada. Para um laço perfeito, sortear as posições verticais num intervalo de exatamente 2000 px (por exemplo, de 0 a 2000) e repetir esse bloco a cada 2000 px, mantendo a densidade visível citada acima.
- **Recomendação — desperdício horizontal**: metade das estrelas cai em x negativo e nunca aparece. Pode-se sortear x entre 0 e a largura útil (até 2000 px) com metade da quantidade, mantendo a mesma densidade.
- **Recomendação — centro da paralaxe**: a referência usa o centro da janela, não o do contêiner. Num contêiner fora do centro da página, o céu fica permanentemente deslocado. Usar o centro do próprio contêiner é a correção recomendada.
- **Recomendação — áreas grandes**: em contêineres com mais de 2000 px num dos eixos, ampliar o quadrado virtual ou repetir o padrão para não haver faixas vazias.
