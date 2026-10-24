# Especificação: Grade iluminada pelo cursor (cursor-grid)

## Propósito
Um fundo com uma grade invisível de células quadradas. Ao mover o ponteiro, as células ao redor dele "acendem" como contornos luminosos, com intensidade maior perto do cursor. Elas permanecem acesas por um instante e depois se apagam devagar, deixando um rastro. Um clique emite um anel de luz que se expande pela grade inteira.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai, overflow oculto. Aceita uma classe extra.
- **Superfície**: canvas em bloco, ocupando 100% × 100%, transparente. A resolução interna é escalada pelo *device pixel ratio*, limitado a **2**.
- **Treliça**:
  - células quadradas com lado configurável (padrão **70 px**);
  - número de colunas = teto(largura ÷ lado) + 1, e de linhas = teto(altura ÷ lado) + 1;
  - a treliça é **centralizada**, de modo que as células parciais das bordas sejam cortadas igualmente dos dois lados.
- **Célula acesa**:
  - quadrado com lado (lado da célula − 1 px), recuado 0,5 px, para que contornos vizinhos não se sobreponham;
  - cantos retos ou arredondados (raio configurável, padrão **0**);
  - **contorno** com espessura padrão de **1,2 px**, pintado com um **gradiente radial** centrado na célula: cor plena com a intensidade atual a partir de 5% do meio-lado, até transparente a uma distância igual ao lado inteiro;
  - efeito: o meio de cada aresta brilha a cerca de 50% da intensidade e os cantos a cerca de 30%, dando um aspecto de "luz difusa";
  - **preenchimento** opcional na mesma cor, com opacidade = intensidade × opacidade de preenchimento (padrão **0** = sem preenchimento).
- **Cor**: padrão **`#D946EF`** (magenta/fúcsia). Deve ser uma cor hexadecimal de 3 ou 6 dígitos (ver Observações).
- **Treliça estática** (opcional, padrão desligada): linhas de 1 px em todas as divisões de célula, ao longo de toda a largura e altura, na mesma cor e com opacidade configurável. As linhas são alinhadas ao pixel, para ficarem nítidas.

## Comportamento
- **Estado por célula**: intensidade (0 a 1) e instante do último "toque".
- **Movimento do ponteiro** (sobre o contêiner, em coordenadas locais): para cada célula cujo **centro** esteja a uma distância d ≤ raio (padrão **140 px**):
  - nível = curva(1 − d ÷ raio) × intensidade máxima (padrão **1**);
  - se o nível for maior que a intensidade atual, a intensidade passa a ser esse nível; se for positivo, renova o instante de toque, mesmo sem aumentar a intensidade.
- **Curvas de decaimento com a distância**:
  - **linear**: t;
  - **suave** (padrão): suavização cúbica de Hermite, t² × (3 − 2t);
  - **acentuada**: t³, que concentra a luz bem perto do cursor;
  - um nome desconhecido cai em linear.
- **Apagamento**: em cada quadro, a intensidade de uma célula cujo último toque ocorreu há mais que o **tempo de retenção** (padrão **400 ms**) diminui linearmente (Δt ÷ duração do apagamento), com duração padrão de **800 ms**. Assim, de 1 a 0 leva 800 ms. Δt é limitado a 50 ms por quadro, e a duração mínima considerada é 16 ms.
- **Pulso ao clicar** (padrão ligado):
  - ao pressionar o ponteiro, nasce um anel no ponto, com raio = idade em segundos × velocidade do pulso (padrão **600 px/s**);
  - em cada quadro, as células cujo centro está a menos de meio lado da circunferência do anel recebem a intensidade máxima e renovam o toque. Depois, apagam-se normalmente;
  - o pulso é descartado quando o raio passa da diagonal do contêiner;
  - vários pulsos podem coexistir.
- **Laço econômico**: o laço de quadros só roda enquanto houver alguma célula acesa ou algum pulso ativo. Ele "acorda" com movimento, clique, redimensionamento ou mudança de parâmetros visuais. Ao dormir sem treliça estática, a superfície é limpa.
- **Redimensionamento** (observado no contêiner): recalcula o tamanho, a treliça e a escala, e **zera** todas as intensidades.
- **Mudar o lado da célula**: reconstrói tudo, inclusive os ouvintes. Os demais parâmetros valem a partir do próximo quadro.

## Técnica de renderização em alto nível
Canvas 2D com escala pelo DPR. O estado por célula fica em arrays tipados planos, indexados por linha × colunas + coluna, fora do estado de renderização da UI. A cada quadro, a superfície é limpa e redesenhada: treliça opcional, pulsos e depois cada célula com intensidade positiva (retângulo, ou retângulo arredondado, com contorno em gradiente radial). Para eficiência, tanto o movimento quanto o pulso percorrem só as células dentro da caixa delimitadora do raio ou do anel.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lado da célula | número (px) | 70 |
| Cor | string hex | `#D946EF` |
| Raio de influência do cursor | número (px) | 140 |
| Curva de decaimento | `linear` / `suave` / `acentuada` | suave |
| Tempo de retenção antes de apagar | número (ms) | 400 |
| Duração do apagamento | número (ms) | 800 |
| Espessura do contorno | número (px) | 1,2 |
| Intensidade máxima | número 0–1 | 1 |
| Opacidade relativa do preenchimento | número 0–1 | 0 |
| Opacidade da treliça estática | número 0–1 | 0 |
| Raio dos cantos da célula | número (px) | 0 |
| Pulso ao clicar | booleano | verdadeiro |
| Velocidade do pulso | número (px/s) | 600 |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, sem padding, overflow oculto e fundo escuro do site. O componente ocupa a área inteira com os valores padrão.
- Texto centralizado por cima, **"Move Your Cursor"**: fonte entre 2rem e 3rem (proporcional à largura da viewport, ~6vw), peso 600, cor atenuada de instrução e posição absoluta no centro.
- Controles:
  - cor;
  - curva;
  - lado de 30 a 160 px (passo 5);
  - raio de 40 a 400 px (passo 10);
  - retenção de 0 a 2000 ms (passo 50);
  - apagamento de 100 a 3000 ms (passo 50);
  - espessura de 0,5 a 4 px;
  - intensidade máxima de 0,1 a 1;
  - preenchimento de 0 a 0,5;
  - treliça de 0 a 0,3;
  - cantos de 0 a 20 px;
  - velocidade do pulso de 100 a 2000 px/s;
  - pulso ao clicar (liga/desliga).

## Acessibilidade e responsividade
- Decorativo: o canvas deve ser `aria-hidden`. O componente não deve receber foco.
- **Recomendação**: com `prefers-reduced-motion`, desativar o pulso e reduzir o rastro (retenção 0 e apagamento curto), ou manter só a treliça estática.
- Toque: o movimento com o dedo acende células (eventos de ponteiro). O toque inicial dispara o pulso.
- Responsivo: a treliça se recalcula a cada mudança de tamanho do contêiner.

## Observações de fidelidade
- A cor só é interpretada corretamente em hexadecimal. Nomes de cor, `rgb()` ou `hsl()` produzem valores inválidos. Recomendação: aceitar qualquer cor CSS (por exemplo, resolvendo-a para RGB via estilo computado ou canvas).
- Na demo, o texto central fica fora do contêiner que ouve o ponteiro, então as células não acendem sob o texto. Recomendação: o texto da demo não deve capturar ponteiro.
- O redimensionamento apaga todo o rastro. Isso é aceitável e pode ser mantido.
