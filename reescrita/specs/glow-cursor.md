# Especificação: Rastro luminoso do cursor (glow-cursor)

## Propósito
Uma área que desenha, atrás do seu conteúdo, um rastro de luz neon contínuo seguindo o ponteiro: uma linha brilhante, mais grossa e clara na cabeça, que afina e muda de cor em direção à cauda, como um cometa ou um traço de caneta de luz. Some quando o ponteiro sai ou fica parado. Decorativo.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto. Repassa classe, estilo e atributos extras.
- **Superfície de desenho**: absoluta cobrindo todo o contêiner, em bloco, sem capturar ponteiro nem seleção, oculta de leitores de tela, fundo transparente, combinada com o que está atrás pelo modo de mesclagem configurado (padrão **tela**/*screen*; opções: tela, "mais claro" (*plus-lighter*), normal). Resolução limitada a **1,5×** de densidade.
- **Conteúdo** (opcional): camada relativa por cima da superfície (empilhamento 1), 100% × 100%. Só existe se houver filhos.
- **Rastro**:
  - polilinha que liga **40** pontos (configurável 2–64);
  - **cabeça**: cor padrão **`#67E8F9`** (ciano claro); **cauda**: cor padrão **`#A78BFA`** (violeta claro), com transição linear de cor ao longo do comprimento;
  - **largura** base do núcleo **8 px** na cabeça, afinando até **25%** na cauda; a curva de afinamento depende do parâmetro de afunilamento (padrão **0,8**, de 0 a 1): o expoente vai de 0,55 (afina cedo) a 1,6 (afina tarde);
  - **vida/intensidade** ao longo do comprimento: (1 − progresso) elevado a um expoente entre 0,55 e 1,25 (interpolado pelo afunilamento), então a cauda desvanece;
  - **perfil transversal**: núcleo gaussiano (cai a ~8% à distância de uma largura) somado a um **halo** de decaimento racional (tipo Lorentziano: f²/(d² + f²)), com raio do halo = largura × (0,8 + 1,4 × espalhamento) (espalhamento padrão **1,2**) e peso 0,55 × intensidade do brilho (padrão **1,9**);
  - **ponto quente**: onde o núcleo é forte, a cor tende ao **branco** (peso **0,65**), dando um miolo incandescente;
  - **pulso**: o brilho oscila ±16% em ondas que viajam da cabeça para a cauda (fase = tempo × velocidade × 3 − progresso × 11; velocidade padrão **1,1**; a amplitude é reduzida se a velocidade for menor que 1);
  - **brilho global** padrão **1,25**, **opacidade** padrão **1**;
  - **grão de filme**: ruído por pixel que muda ~18 vezes por segundo, com interpolação suave entre quadros, modulando a luminância em até ±0,4 × (1 − e^(−2,2 × força)) (força padrão **0,035**, ou seja ≈ ±3%).
- **Composição de cor**: a cor de cada pixel é a média das cores dos segmentos ponderada pela intensidade; a opacidade é a intensidade mais forte. No modo aditivo (tela/mais claro), a luminância passa por uma curva de gama sRGB e a cor é multiplicada por ela. No modo normal, a opacidade é intensidade × brilho, e o ponto quente é mais suave (35% do peso, a partir de núcleo 0,45).

## Comportamento
- **Coordenadas**: o ponteiro é medido em px relativos ao contêiner (saturado nas bordas).
- **Inicialização**: no primeiro evento de ponteiro (entrada ou movimento), todos os pontos do rastro são colocados na posição do ponteiro e o rastro aparece. Antes disso, nada é desenhado.
- **Seguimento** (passos normalizados para 60 fps, delta limitado a 3 quadros):
  - a cabeça persegue o ponteiro com fator de aproximação por quadro = **velocidade de seguimento** (padrão **0,16**, limitado a 0,01–0,99), corrigido pelo delta de tempo;
  - cada ponto seguinte persegue o anterior com fator = 0,28 + 0,35 × velocidade de seguimento (≈ 0,336 com o padrão, limitado a 0,08–0,92). Isso forma uma corrente elástica: movimentos rápidos esticam o rastro e curvas ficam suaves.
  - a simulação mantém sempre 64 pontos; só os N primeiros são desenhados.
- **Desvanecimento por inatividade** (ligado por padrão): o rastro some se o ponteiro sair do contêiner **ou** ficar parado por mais de **700 ms**. A opacidade de desvanecimento tende ao alvo (1 visível / 0 oculto) de forma exponencial; a duração configurada (padrão **900 ms**) corresponde a uma constante de tempo de ≈ 1/7 dela (~130 ms), então a transição é rápida. Mover de novo faz reaparecer.
- **Desabilitado**: com a interação desligada, o rastro desvanece e não reaparece.
- **Atualização**: todos os parâmetros visuais e de movimento valem no quadro seguinte; mudar a densidade máxima de pixels recria o renderizador.
- **Redimensionamento**: observado continuamente.
- O laço de animação roda continuamente enquanto montado.

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia; o shader de fragmento percorre os segmentos do rastro (até 63) e, para cada pixel, calcula a distância ao segmento (projeção com saturação), o progresso ao longo do rastro, e soma núcleo + halo; mantém o máximo e a soma ponderada para cor. Pontos enviados como vetor uniforme; física de corrente simples em JavaScript.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor da cabeça | cor hex | `#67E8F9` |
| Cor da cauda | cor hex | `#A78BFA` |
| Número de pontos do rastro | inteiro 2–64 | 40 |
| Largura do núcleo na cabeça | px | 8 |
| Afunilamento | 0–1 | 0,8 |
| Velocidade de seguimento | 0,01–0,99 | 0,16 |
| Intensidade do halo | número | 1,9 |
| Espalhamento do halo | número | 1,2 |
| Ponto quente (branco no núcleo) | 0–1 | 0,65 |
| Brilho | número | 1,25 |
| Opacidade | 0–1 | 1 |
| Velocidade do pulso | número | 1,1 |
| Grão | 0–1 | 0,035 |
| Desvanecer quando inativo | booleano | verdadeiro |
| Tempo de inatividade | ms | 700 |
| Duração do desvanecimento | ms | 900 |
| Modo de mesclagem | tela / mais claro / normal | tela |
| Densidade de pixels máxima | número | 1,5 |
| Habilitado | booleano | verdadeiro |
| Conteúdo | nós React | nenhum |
| Classe, estilo e atributos extras | — | vazio |

## Demo
- Área de prévia relativa, **500 px de altura**, sem padding, overflow oculto, fundo do tema.
- O componente ocupa a área, sem filhos. Sobre ele, centralizado (absoluto, translação −50%/−50%), o texto **"Move Your Cursor"**, tamanho fluido 2rem–3rem (6% da largura da viewport), peso 600, na cor atenuada de instrução do tema, sem capturar ponteiro nem seleção.
- No tema claro, se o modo ainda for o padrão (tela), a demo usa o modo **normal** (pois "tela" é invisível sobre fundo claro).
- Controles: cor da cabeça; cor da cauda; modo de mesclagem; pontos 8–64 (1); largura 2–24 px (1); afunilamento 0–1 (0,01); seguimento 0,03–0,5 (0,01); intensidade 0–4 (0,05); espalhamento 0,1–3 (0,05); ponto quente 0–1 (0,01); brilho 0,25–2,5 (0,05); opacidade 0,1–1 (0,01); pulso 0–4 (0,1); grão 0–0,25 (0,005); inatividade 0–2000 ms (50); desvanecimento 100–2500 ms (50); densidade 0,5–2 (0,25); interruptores de desvanecer quando inativo e habilitado.
- Para a captura estática, recomenda-se que a demo inicialize o rastro no centro (por exemplo, um pequeno gesto automático em arco na montagem) para que algo apareça sem interação.

## Acessibilidade e responsividade
- A superfície já é oculta de leitores de tela e não intercepta eventos; o conteúdo filho permanece interativo.
- Recomendação: com `prefers-reduced-motion`, desativar o rastro (ou exibir só um ponto luminoso sem cauda e sem pulso).
- Em toque, o rastro segue o dedo enquanto arrasta; ao levantar, desvanece.
- Acompanha o tamanho do contêiner.

## Observações de fidelidade
- Recomendação: a curva de gama sRGB da referência tem um limiar de segmento linear com uma casa decimal a mais (0,00031308 em vez de 0,0031308); usar o valor correto.
- Recomendação: pausar o laço quando o rastro estiver totalmente desvanecido e retomar ao próximo evento de ponteiro, e quando fora da viewport.
- Recomendação: a "duração do desvanecimento" não corresponde à duração real (≈ 1/7); considerar uma transição com duração literal.
