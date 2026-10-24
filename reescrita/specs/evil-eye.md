# Especificação: Olho flamejante (evil-eye)

## Propósito
Fundo com um grande olho místico e brilhante no centro da área, formado por chamas: uma íris em anel de fogo, um halo amendoado ao redor e uma pupila vertical em fenda (como olho de gato ou dragão) que acompanha o cursor. As chamas escorrem continuamente para fora. Decorativo, com leve interação.

## Aparência
- **Contêiner**: bloco com 100% × 100% do pai. A superfície de desenho é inserida dentro dele.
- **Cores padrão**: olho **`#FF6F37`** (laranja-fogo) sobre fundo **`#000000`**. A cor do olho é somada ao fundo (mistura aditiva), então em fundo escuro o brilho satura para amarelo-claro/branco nos pontos mais intensos.
- **Sistema de coordenadas**: centralizado; 1 unidade = meia altura da área ÷ escala (padrão **0,8**, ou seja, o olho fica um pouco maior que a área normalizada). O olho é circular na métrica da altura (não estica com a largura).
- **Elementos** (r = distância ao centro em unidades):
  - **Anel interno (íris)**: banda de fogo que começa em r ≈ 0,3 e se estende para fora; a largura da íris (padrão **0,25**) controla quão rápido a banda cresce. As bordas são irregulares, recortadas por ruído.
  - **Anel externo**: segunda banda mais fraca a partir de r ≈ 0,5, também com borda ruidosa.
  - **Interior do olho**: dentro de r ≈ 0,8 há um preenchimento de chamas modulado por ruído (mais forte perto do centro).
  - **Pupila**: elipse **vertical** estreita (proporção ~1 : 4; semieixo horizontal ≈ 0,11 e vertical ≈ 0,43 unidades), escura, recortada da luz. O tamanho da pupila (padrão **0,6**) controla quão escura e larga ela fica.
  - **Halo externo**: brilho em forma de **amêndoa horizontal** (elipse esticada ~3× na horizontal) que envolve o olho, mais forte nas bordas externas do que no centro, com intensidade padrão **0,35**. Há também um brilho de fundo bem fraco (~15%) que preenche a área ao redor.
- **Intensidade global**: multiplicador padrão **1,5**.

## Comportamento
- **Textura de ruído (gerada em código, sem arquivo)**: imagem cinza de **256 × 256** que se repete sem emenda, criada na montagem:
  - fBm de ruído de valor com interpolação bilinear;
  - **8 oitavas**, frequência base de 32 células, dobrando a cada oitava;
  - amplitude inicial 0,4, multiplicada por 0,65 a cada oitava;
  - normalizada, com contraste aumentado 2,2× em torno de 0,5 e limitada a [0, 1];
  - filtragem linear, repetição nos dois eixos.
- **Chamas**: a textura é amostrada em **coordenadas polares** (raio, ângulo) em três camadas com escalas diferentes (alongadas no eixo do ângulo, o que gera "línguas" radiais) e rolando no eixo do raio com o tempo. As chamas parecem **escorrer do centro para fora**. Velocidades relativas das camadas: 0,1 / 0,2 / 0,1 × tempo × velocidade das chamas (padrão **1**).
- A escala do ruído (padrão **1**) multiplica as coordenadas de amostragem (maior = chamas mais finas e numerosas).
- **Composição**: energia = cor do olho × intensidade × limite[0, 3] de (máximo entre "anéis + interior" e "halo + brilho de fundo") − pupila. Cor final = energia + fundo.
- **Pupila segue o cursor**: a posição do ponteiro sobre o contêiner é normalizada em [−1, 1] (y para cima). A pupila se desloca ponteiro × seguimento (padrão **1**) × 0,12 unidades. O valor efetivo anda **5%** por quadro em direção ao alvo, num movimento lento e "orgânico". Ao sair do contêiner, o alvo volta ao centro.
- **Tempo**: segundos desde o carregamento da página.
- **Modo claro** (padrão desligado): a energia passa por um mapeamento exponencial (1 − e^(−1,3 × energia)), é convertida em matiz normalizado (levemente saturado) e misturada sobre a cor de fundo pela cobertura suave da energia (de 2% a 82%, máximo de 96%). Serve para fundos claros.
- **Redimensionamento**: acompanha o tamanho do contêiner ao redimensionar a janela.

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia e shader de fragmento. As formas vêm de campos de distância radiais simples (círculos e elipses em torno do centro) combinados com amostras de uma textura de ruído fBm gerada proceduralmente em CPU, lida em coordenadas polares e rolada no tempo. Superfície com canal alfa (limpa em transparente), mas o resultado final é opaco por pixel.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do olho | hex | `#FF6F37` |
| Intensidade | número | 1,5 |
| Tamanho da pupila | número | 0,6 |
| Largura da íris | número | 0,25 |
| Intensidade do halo | número | 0,35 |
| Escala do olho | número | 0,8 |
| Escala do ruído | número | 1,0 |
| Quanto a pupila segue o cursor | número | 1,0 |
| Velocidade das chamas | número | 1,0 |
| Cor de fundo | hex | `#000000` |
| Modo claro | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto. Sem texto sobreposto.
- Valores: padrões, com fundo **`#120F17`** (o escuro do site).
- Controles (cada mudança recria o efeito): cor do olho; fundo; intensidade 0,5–5 (0,1); tamanho da pupila 0,1–2 (0,05); largura da íris 0,1–0,8 (0,05); halo 0–1,5 (0,05); escala 0,2–3 (0,1); escala do ruído 0,1–3 (0,1); seguimento da pupila 0–2 (0,1); velocidade das chamas 0,1–5 (0,1).

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar as chamas e manter a pupila centrada.
- Recomendação: pausar o laço fora da tela ou com a aba oculta.
- O olho escala pela altura; em áreas muito estreitas (retrato), o halo horizontal pode ser cortado nas laterais — aceitável; opcionalmente, usar o menor lado como referência.

## Observações de fidelidade
- **Recomendação**: o ângulo polar é mapeado para uma faixa da textura que não é periódica, criando uma **costura visível** logo abaixo do centro (onde o ângulo dá a volta). Escolher a escala angular de forma que uma volta completa corresponda a um número inteiro de repetições da textura.
- **Recomendação**: observar o tamanho do contêiner (a referência só reage à janela) e limitar o DPR a 2.
- **Recomendação**: atualizar parâmetros ao vivo em vez de recriar o contexto e regenerar a textura a cada mudança.
- **Recomendação**: a demo nunca liga o modo claro; ligá-lo no tema claro (fundo claro) na reimplementação.
