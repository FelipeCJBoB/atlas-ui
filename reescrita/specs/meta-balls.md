# Especificação: Metabolas (meta-balls)

## Propósito
Um fundo animado de "bolhas" orgânicas que orbitam o centro e se fundem umas nas outras como gotas de mercúrio ou de lâmpada de lava. Uma bolha extra segue o cursor, ou passeia sozinha quando o cursor está fora da área, e também se funde às demais.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai. Dentro dele há uma superfície WebGL com o mesmo tamanho em pixels CSS. A densidade de pixels é fixa em **1**.
- **Fundo**:
  - por padrão é **preto opaco**;
  - com a opção de transparência, as áreas fora das bolhas ficam transparentes e a cor fica pré-multiplicada pela cobertura.
- **Bolhas**:
  - forma lisa e contínua, com bordas nítidas e suavizadas (antisserrilhamento de cerca de 1 pixel);
  - cor sólida (padrão **`#ffffff`**);
  - a bolha do cursor tem cor própria (padrão **`#ffffff`**);
  - onde as duas se fundem, a cor é uma mistura proporcional à contribuição de cada uma no ponto.
- **Escala do mundo**: a altura do contêiner equivale a S unidades de mundo (padrão **30**), com a origem no centro. Valores maiores de S fazem tudo parecer menor.

## Comportamento
- **Campo**: cada bolha contribui com r² ÷ d² em cada ponto, onde r é o raio da bolha e d a distância do ponto ao centro dela. As contribuições são somadas. O ponto pertence à superfície quando a soma passa de **1,3**. Bolhas próximas, portanto, se unem com pescoços suaves.
- **Quantidade**: de 1 a **50** bolhas (padrão **15**), além da bolha do cursor.
- **Parâmetros por bolha**: gerados de forma **pseudoaleatória determinística** a partir do índice, com um hash fixo, de modo que o padrão é o mesmo a cada montagem. As faixas são:
  - ângulo inicial uniforme entre 0 e 2π;
  - fator de velocidade angular entre **0,1π e 0,4π** rad por unidade de tempo;
  - raio da órbita entre **5 e 10** unidades de mundo, sorteado com o **mesmo** número aleatório do fator de velocidade, de modo que órbitas maiores giram mais rápido;
  - um seletor binário (0 ou 1);
  - raio da bolha entre **0,5 e 2,0** unidades.
- **Trajetória** (no tempo t em segundos):
  - fase = t × velocidade global (padrão **0,3**) × fator da bolha;
  - x = cos(ângulo inicial + fase) × raio da órbita × fator de aglomeração;
  - y = sen(ângulo inicial + fase + fase × seletor) × raio da órbita × fator de aglomeração;
  - com seletor 0, a órbita é circular; com seletor 1, o eixo Y gira com o dobro da frequência e a bolha percorre uma curva de Lissajous em forma de "oito";
  - o fator de aglomeração (padrão **1**) aproxima (< 1) ou espalha (> 1) as órbitas.
- **Bolha do cursor**:
  - tem raio próprio (padrão **3** unidades);
  - com a interação ligada (padrão) e o ponteiro dentro do contêiner, o alvo é a posição do ponteiro;
  - caso contrário, o alvo percorre uma elipse em torno do centro, com semieixos de **15%** da largura e **15%** da altura, girando com velocidade angular igual à velocidade global (rad/s);
  - a posição real persegue o alvo com aproximação exponencial por quadro, com fator de suavização (padrão **0,05**; valores menores deixam o movimento mais "preguiçoso");
  - no primeiro quadro, ela parte do canto inferior esquerdo (origem da superfície) e desliza até o alvo.
- **Redimensionamento**: só no evento de resize da janela. A superfície acompanha o contêiner.
- **Mudança de parâmetro**: qualquer alteração recria todo o contexto de desenho.

## Técnica de renderização em alto nível
WebGL 2 com um triângulo de tela cheia e um shader de fragmento que avalia, por pixel, o **campo de metabolas** (soma de funções inversas do quadrado da distância). O resultado passa por um limiar com borda suavizada baseada na derivada de tela do campo e por uma mistura de cor ponderada pela participação da bolha do cursor no total. As posições das bolhas são calculadas na CPU a cada quadro e enviadas como lista de uniformes, com no máximo 50.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor das bolhas | cor hex | `#ffffff` |
| Velocidade global | número | 0,3 |
| Bolha do cursor segue o ponteiro | booleano | verdadeiro |
| Suavização da bolha do cursor (fração por quadro) | número | 0,05 |
| Altura da área em unidades de mundo (zoom inverso) | número | 30 |
| Quantidade de bolhas (até 50) | inteiro | 15 |
| Fator de aglomeração das órbitas | número | 1 |
| Raio da bolha do cursor | número | 3 |
| Cor da bolha do cursor | cor hex | `#ffffff` |
| Fundo transparente | booleano | falso |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **400 px de altura**, sem padding, overflow oculto e fundo escuro do site. Transparência ligada.
- Valores da demo: velocidade 0,3; tamanho 30; 15 bolhas; aglomeração 1; seguir cursor ligado; suavização **0,15**; raio do cursor **2**.
- Cores: brancas no tema escuro. No tema claro, enquanto estiverem no padrão, **`#18181b`**. O seletor de cor altera as duas ao mesmo tempo.
- Controles:
  - cor;
  - bolhas de 2 a 30;
  - velocidade de 0,1 a 1 (passo 0,1);
  - tamanho de 10 a 50;
  - aglomeração de 0,1 a 2 (passo 0,1);
  - chave de seguir o cursor;
  - suavização de 0,001 a 0,25 (passo 0,001);
  - raio do cursor de 1 a 5.

## Acessibilidade e responsividade
- Decorativo: ocultar dos leitores de tela.
- **Recomendação**: com `prefers-reduced-motion`, congelar as órbitas e a bolha do cursor.
- **Recomendação**: pausar o laço fora da viewport ou com a aba oculta.
- A escala segue a altura, então em contêineres muito largos as bolhas ocupam só a faixa central.

## Observações de fidelidade
- A referência usa o mesmo valor aleatório para a velocidade e para o raio da órbita. Manter essa correlação, porque ela define o visual.
- A suavização é aplicada por quadro, sem compensar a taxa de quadros, então fica mais rápida em telas de 120 Hz. **Recomendação**: normalizar pelo Δt.
- Observar o redimensionamento do contêiner, além da janela, é uma melhoria permitida.
- A referência descarta o contexto ao desmontar, o que deve ser mantido.
