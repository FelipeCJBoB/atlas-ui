# Especificação: Véu escuro (dark-veil)

## Propósito
Fundo animado escuro com um "véu" de luz violeta que pende do alto da área, como uma cortina de seda iluminada ou uma aurora suave: dobras luminosas em forma de V e de leque, com bordas esfumadas, que respiram e se deformam devagar. O resto da área é quase preto. Sem interação.

## Aparência
- **Superfície**: elemento de desenho em bloco ocupando 100% × 100% do pai, opaco.
- **Composição (com os padrões, em densidade de pixel 1)**:
  - **Metade inferior**: praticamente preta (`#000000` a `#03000a`).
  - **Metade superior**: formas de luz violeta que descem do topo. A forma típica é um "V" ou leque: duas ou três línguas de luz que convergem para um ponto por volta de 37% da largura e 60% da altura (medidos a partir do topo), com uma aba larga à esquerda e outra à direita, além de um brilho difuso mais fraco no canto superior direito.
  - As bordas das formas são suaves (gradientes longos), com alguns vincos mais nítidos onde duas dobras se encontram, lembrando tecido dobrado.
- **Cores**:
  - pico de brilho próximo de **`#9a20f8`** (violeta elétrico);
  - corpo das formas em torno de **`#5a14c8`** a **`#3a0c8a`** (índigo-violeta);
  - transição para **`#12042a`** e preto;
  - o canal verde fica sempre muito baixo (≤ ~0,13), o que dá o tom roxo-azulado saturado.
  - Média geral da imagem é escura (luminância média ~5%).
- **Rotação de matiz** opcional (padrão **0°**): gira o matiz da imagem inteira no espaço YIQ (por exemplo, 120° leva o violeta para tons verde-azulados).
- **Linhas de varredura** opcionais (padrão **desligadas**): escurecimento senoidal por linha de pixel.
- **Grão** opcional (padrão **0**).

## Comportamento
- **Animação**: o tempo é segundos desde a montagem × velocidade (padrão **0,5**). Três "entradas latentes" oscilam com seno do tempo em frequências **0,3**, **0,69** e **0,44** rad por unidade de tempo, cada uma com amplitude **0,1**. Elas deformam continuamente o véu: as dobras se abrem, fecham e escorregam lateralmente sem repetir de forma perceptível (o período combinado é muito longo).
- **Distorção ondulada** (padrão **0**): soma às coordenadas um deslocamento senoidal (seno da coordenada vertical e cosseno da horizontal, com frequência de uma volta completa por unidade e fase andando com o tempo × 0,5), com amplitude 0,05 × quantidade. Torna as bordas onduladas.
- **Linhas de varredura**: fator = 1 − intensidade × (½ + ½·seno(linha de pixel × frequência))². Com frequência 0 (padrão), o fator é constante.
- **Grão**: ruído por pixel, que muda a cada quadro, somado com amplitude ±½ × intensidade.
- **Modo claro** (padrão desligado): converte para "tinta sobre papel". Onde a imagem é escura fica branco; onde há luz, mistura-se a cor normalizada (em versão mais escura e saturada, entre 32% e 78% do matiz conforme a energia) sobre o branco, com cobertura suave entre 8% e 82% de energia e máximo de 82%.
- **Escala de resolução** (padrão **1**): renderiza em fração da resolução para economizar GPU, mantendo o enquadramento.
- **Redimensionamento**: acompanha o tamanho do pai.

## Técnica de renderização em alto nível
WebGL com um triângulo de tela cheia e um shader de fragmento. Na referência, a imagem vem de uma **rede neural pequena e fixa do tipo CPPN** (rede de produção de padrões composicionais): uma sequência de camadas densas com ativação sigmoide que recebe por pixel a posição (x, y), a distância ao centro e três entradas latentes animadas, e devolve RGB. **Os pesos dessa rede fazem parte do código original e não devem ser copiados.** Para reimplementar, escolher uma das alternativas:
1. **CPPN própria**: rede de 3–4 camadas (largura 8–16, sigmoide ou tangente hiperbólica), com as mesmas entradas, pesos gerados por um gerador pseudoaleatório com semente fixa, e saída mapeada para a paleta violeta descrita acima. Escolher a semente/escala que produza formas grandes e suaves concentradas no alto.
2. **Ruído com distorção de domínio**: fBm de ruído suave (3–5 oitavas) com distorção de domínio animada pelas três oscilações latentes, multiplicado por uma máscara vertical (forte no topo, zero abaixo de ~60–65% da altura) e mapeado numa rampa preto → `#12042a` → `#3a0c8a` → `#9a20f8`.

Em ambos os casos, as coordenadas são centralizadas, com o eixo horizontal corrigido pela proporção (largura ÷ altura) e o eixo vertical invertido, de modo que o topo da área corresponda ao valor −1. A rotação de matiz, as linhas de varredura, o grão e o modo claro são aplicados depois, nessa ordem.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Rotação de matiz | graus | 0 |
| Intensidade do grão | número | 0 |
| Intensidade das linhas de varredura | número (0–1) | 0 |
| Velocidade | número | 0,5 |
| Frequência das linhas de varredura | número | 0 |
| Quantidade de distorção ondulada | número | 0 |
| Escala de resolução | número (0–1) | 1 |
| Modo claro | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, overflow oculto; todos os valores nos padrões (véu violeta puro, sem linhas nem grão).
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Become emboldened by the flame of ambition"**, centralizados (aproximação: selo pequeno translúcido; título branco ~2,5rem, peso 600, largura máxima ~20ch).
- Controles (cada mudança recria o efeito): velocidade 0–3 (0,1); rotação de matiz 0–360 (1); grão 0–0,2 (0,01); frequência das linhas 0,5–5 (0,1); intensidade das linhas 0–1 (0,01); distorção 0–5 (0,1).

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (véu estático) e zerar o grão.
- Recomendação: pausar o laço fora da tela ou com a aba oculta.
- A composição é ancorada pela altura (largura corrigida pela proporção): em telas largas o véu se estende para os lados; em telas estreitas, aparece só o trecho central.

## Observações de fidelidade
- **Recomendação (importante)**: a referência normaliza as coordenadas pelo tamanho em pixels CSS, mas o desenho é feito em pixels físicos; em telas com DPR 2 o enquadramento fica deslocado e "afastado" (só um quarto da imagem pretendida aparece no canto). Normalizar pelo tamanho real do buffer de desenho. O enquadramento correto é o descrito em Aparência (equivalente a DPR 1).
- **Recomendação**: a referência só reage ao redimensionamento da janela; observar o tamanho do pai.
- **Recomendação**: a referência recria o programa de shader a cada mudança de parâmetro sem liberar o anterior (vazamento). Atualizar os valores ao vivo.
- **Recomendação**: a demo nunca liga o modo claro (o valor fica indefinido); na reimplementação, ligar o modo claro no tema claro do site.
- **Recomendação**: a faixa de frequência das linhas da demo começa em 0,5, mas o padrão é 0; tudo bem, desde que a intensidade 0 desligue o efeito.
