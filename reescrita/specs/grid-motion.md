# Especificação: Grade em movimento (grid-motion)

## Propósito
Fundo/vitrine composto por uma grade inclinada de 4 fileiras × 7 cartões (imagens ou textos) que ultrapassa as bordas da área. Conforme o ponteiro se move horizontalmente pela janela, as fileiras deslizam lateralmente em sentidos alternados, cada uma com inércia diferente, criando um efeito de paralaxe "tecido". Uso: hero de portfólio ou galeria.

## Aparência
- **Invólucro externo**: 100% × 100% do pai, overflow oculto.
- **Seção interna**: largura 100%, **altura de 100% da viewport** (100vh), overflow oculto, posicionamento relativo, flex centralizando o conteúdo nos dois eixos. Fundo: **gradiente radial circular** da cor configurada no centro (padrão **preto**) até transparente na borda.
- **Grade**:
  - bloco de **150% da largura da viewport × 150% da altura da viewport**, que não encolhe, centralizado e **girado −15°** (sentido anti-horário) em torno do centro;
  - 4 fileiras de altura igual com espaçamento de **1rem** entre fileiras;
  - cada fileira é uma grade de **7 colunas iguais** com espaçamento de 1rem.
- **Cartão**:
  - preenche a célula; posicionamento relativo, overflow oculto, **raio de 10 px**, fundo **`#111`**;
  - conteúdo centralizado (flex), texto **branco** em **1,5rem**;
  - se o item for texto/nó: aparece centralizado com padding de 1rem, alinhado ao centro;
  - se o item for um endereço de imagem: a imagem cobre o cartão inteiro (enquadramento "cobrir", centralizada).
- **Itens**: até **28** (os excedentes são ignorados), distribuídos por fileira (itens 1–7 na primeira fileira, 8–14 na segunda etc.). Sem itens, usa-se o texto "Item 1" … "Item 28".

## Comportamento
- **Fonte do movimento**: a posição horizontal do ponteiro em **toda a janela** (não só no componente), relativa à largura da janela. Valor inicial: metade da largura (fileiras centradas).
- **Deslocamento-alvo de cada fileira**: (fração horizontal × 300 − 150) px, ou seja, de −150 px (ponteiro na borda esquerda) a +150 px (borda direita). Fileiras de índice par (1ª e 3ª) seguem o sentido do ponteiro; ímpares (2ª e 4ª) vão no sentido oposto.
- **Inércia**: a cada quadro, cada fileira recebe uma nova animação de translação horizontal em direção ao alvo, substituindo a anterior, com curva de desaceleração cúbica (*ease-out* de potência 3) e duração de **0,8 s + fator da fileira**: fatores **0,6 / 0,4 / 0,3 / 0,2** → **1,4 s / 1,2 s / 1,1 s / 1,0 s**. Na prática as fileiras perseguem o alvo suavemente, a primeira com mais atraso e a última mais rápida.
- A compensação de atraso do relógio de animação é desativada (o tempo não é "esticado" após travamentos).
- Sem efeitos de hover/clique nos cartões; não há rolagem.

## Técnica de renderização em alto nível
DOM + CSS grid com transformação 2D (rotação da grade inteira e translação horizontal por fileira). Requer uma biblioteca de interpolação/tween com *ease-out* cúbico e cancelamento automático de tweens concorrentes, ou uma implementação própria equivalente (por exemplo, a cada quadro, aproximar a posição atual do alvo com suavização exponencial calibrada para durar ≈ 1,0–1,4 s). Ouvinte de movimento do ponteiro na janela e um laço por quadro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens da grade (texto, nó ou endereço de imagem; máx. 28) | lista | vazia (usa "Item N") |
| Cor do centro do gradiente radial de fundo | cor CSS | preto |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, **cantos arredondados de 1,5rem**, overflow oculto.
- Gradiente de fundo: **preto**.
- Itens: 28 cartões com **a mesma imagem** repetida. A referência usa uma fotografia externa; **não usar arquivo nem URL externo** — gerar a imagem proceduralmente (canvas/SVG convertido em imagem), por exemplo uma composição abstrata em tons escuros com uma forma luminosa central (gradiente radial azul-violeta sobre quase preto, com leve textura), em proporção retrato. Opcionalmente variar levemente o matiz de cada cartão.
- Não há controles além da tabela de propriedades.

## Acessibilidade e responsividade
- Se os itens forem imagens de conteúdo, cada uma precisa de texto alternativo (a referência usa imagens de fundo CSS, sem alternativa). Recomendação: usar elementos de imagem com texto alternativo ou marcar a grade como decorativa (oculta de leitores de tela) quando for só fundo.
- Recomendação: com `prefers-reduced-motion`, manter as fileiras paradas na posição central.
- Toque: não há ponteiro contínuo; as fileiras ficam centradas (ou seguem o último toque).
- Responsivo: as dimensões derivam da viewport; ver observações.

## Observações de fidelidade
- Recomendação: a seção interna tem altura de 100% da viewport e a grade usa 150% da viewport, independentemente do tamanho do componente. Num contêiner menor que a janela (como a prévia de 500 px), a grade fica centralizada em relação à altura da janela, não à do contêiner, e os cartões ficam enormes. Preferir dimensionar pela caixa do componente (100% de altura do contêiner e grade com 150% do contêiner), mantendo o mesmo visual quando o componente ocupa a tela inteira.
- Recomendação: a referência cria uma nova animação por fileira a cada quadro; uma suavização contínua (mola ou interpolação exponencial por tempo) produz o mesmo efeito com menos custo.
- Recomendação: o fundo de cada cartão é definido duas vezes com o mesmo valor; basta uma vez. Há também uma camada de sobreposição de "textura" e uma camada vazia de "visão cheia" que não têm efeito visível; podem ser omitidas.
- Recomendação: a referência lê a largura da janela durante a renderização (falha em ambiente sem janela); proteger para renderização no servidor.
