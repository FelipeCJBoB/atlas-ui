# Especificação: Menu de bolhas (bubble-menu)

## Propósito
Cabeçalho de navegação minimalista formado por duas "bolhas" flutuantes: à esquerda, uma pílula com o logotipo; à direita, um botão circular de menu (duas linhas que viram um X). Ao abrir, aparece sobre a área uma sobreposição com os links de navegação em forma de **pílulas grandes**, levemente inclinadas, que surgem uma a uma com um "estalo" elástico de escala. No hover, cada pílula troca para uma cor de destaque própria.

## Aparência

### Barra superior
- Faixa posicionada de forma absoluta (ou fixa à viewport, conforme opção) com bordas esquerda e direita em 0 e topo a **2em**.
- Layout flex em linha, itens centralizados na vertical e distribuídos nas extremidades (espaço entre), com espaçamento de **16 px** e padding horizontal de **2em**.
- A faixa em si não captura ponteiro; só as bolhas capturam. Camada de empilhamento alta (99).
- **Bolha (base comum)**:
  - tamanho de **48 px** (de **56 px** a partir de 768 px de largura de viewport);
  - fundo na cor do menu (padrão **branco `#fff`**);
  - sombra `0 4px 16px rgba(0,0,0,0.12)`;
  - conteúdo centralizado.
- **Bolha do logotipo**: pílula com a mesma altura da bolha, largura automática, padding horizontal de **16 px** e raio igual à metade da altura. Dentro, uma área de **120 px** de largura e altura total, com o logotipo centralizado, limitado a **60% da altura** e 100% da largura, preservando a proporção.
- **Bolha do menu (botão)**: círculo perfeito do tamanho da bolha, sem borda, cursor de ponteiro, contendo duas linhas horizontais empilhadas:
  - cada linha com **26 × 2 px**, raio de 2 px, na cor de conteúdo (padrão **`#111`**);
  - **6 px** de espaço entre as linhas;
  - quando aberto: a linha de cima desce 4 px e gira +45°, e a de baixo sobe 4 px e gira −45°, formando um **X**. A transição de transformação e opacidade dura **0,3 s** com easing padrão (`ease`).

### Sobreposição com os links
- Camada que cobre todo o contêiner (ou a viewport, no modo fixo), logo abaixo da barra (camada 98), com a lista centralizada na horizontal e na vertical. A camada em si não captura ponteiro; a lista sim.
- **Lista**: sem marcadores, padding horizontal de **24 px**, largura de 100% com máximo de **1600 px**, centralizada, quebra de linha habilitada e espaço vertical entre linhas de **4 px**.
- **Colunas**: cada item ocupa exatamente **1/3** da largura da lista e centraliza sua pílula. Regras de centralização da última linha:
  - com **5 itens**, o 4º item recebe recuo à esquerda de **1/6** da largura, para que os 2 últimos fiquem centralizados sob os 3 de cima;
  - com **4 itens**, o 4º recebe recuo de **1/3**, ficando sozinho no centro.
- **Pílula (link)**:
  - largura de 100% da coluna e altura mínima de **160 px**;
  - padding vertical fluido entre **1,5rem** e **8rem** (cerca de 3% da largura da viewport);
  - fonte fluida entre **1,5rem** e **4rem** (cerca de 4vw), peso 400;
  - raio totalmente arredondado (999 px);
  - fundo na cor do menu e texto na cor de conteúdo, sem sublinhado;
  - sombra `0 4px 14px rgba(0,0,0,0.1)`;
  - texto em linha única, conteúdo centralizado e overflow oculto;
  - o rótulo interno é um bloco em linha com altura de 1,2em e altura de linha de 1,2.
- **Inclinação**: em viewports a partir de **900 px**, cada pílula é girada pelo ângulo do próprio item (padrões: −8°, +8°, +8°, +8°, −8°). Abaixo disso, não há rotação.
- **Itens padrão** (rótulo em minúsculas → cor de hover, com texto branco no hover):
  1. "home" → azul `#3b82f6`;
  2. "about" → verde `#10b981`;
  3. "projects" → âmbar `#f59e0b`;
  4. "blog" → vermelho `#ef4444`;
  5. "contact" → violeta `#8b5cf6`.
  - Todos apontam para "#". Sem cor de hover definida, o hover usa cinza-claro `#f3f4f6` com a cor de conteúdo.

### Layout estreito (viewport abaixo de 900 px)
- A sobreposição alinha a lista ao **topo**, com padding superior de **120 px**, abaixo da barra.
- Cada coluna ocupa **100%** da largura, sem recuos especiais. O espaço vertical entre linhas é de **16 px**.
- Pílulas com fonte fluida entre **1,2rem** e **4rem** (~3vw), padding vertical entre **1rem** e **2rem** e altura mínima de **80 px**.

## Comportamento

### Abrir/fechar
- O clique no botão alterna o estado aberto/fechado e notifica o consumidor com o novo estado (booleano). O X do botão reage na hora, via transição CSS.
- **Abertura**:
  1. A sobreposição é montada e exibida.
  2. Todas as pílulas começam em **escala 0**, a partir do centro. Os rótulos começam deslocados **24 px para baixo** e invisíveis (opacidade 0 e visibilidade oculta).
  3. Cada pílula *i* (a partir de 0) inicia após um atraso de **i × 0,12 s**, somado a uma variação aleatória uniforme de **±0,05 s**, o que dá uma cascata levemente irregular.
  4. A escala vai de 0 a 1 em **0,5 s**, com easing de recuo com overshoot (*back-out*, intensidade **1,5**): passa um pouco de 1 e assenta.
  5. O rótulo da pílula começa a animar **0,05 s** depois do início da escala dela, ou seja, sobrepondo 90% da duração. Ele sobe de 24 px até 0 e vai de opacidade 0 a 1 em **0,5 s**, com desaceleração cúbica (1 − (1 − t)³).
- **Fechamento**:
  1. Animações em curso são interrompidas.
  2. Todos os rótulos descem até 24 px e somem; todas as pílulas encolhem até a escala 0, ao mesmo tempo e sem cascata. Ambas as animações duram **0,2 s**, com aceleração cúbica (t³).
  3. Ao terminar, a sobreposição é ocultada e desmontada.
- Se o menu reabrir no meio do fechamento, as animações em curso são canceladas e a sequência de abertura recomeça do zero.

### Hover e clique nas pílulas
- No hover, o fundo e o texto mudam para as cores de destaque do item, com transição de **0,3 s** (`ease`).
- **Intenção do design**: no hover, a pílula também cresce para **1,06×** e, ao ser pressionada, encolhe para **0,94×**, mantendo a rotação própria.
  - Ver Observações: na referência, essa escala é anulada pela transformação inline da animação.

### Redimensionamento
Com o menu aberto, ao redimensionar a janela, a rotação de cada pílula é reaplicada: usa o ângulo do item quando a viewport tem **900 px ou mais** e 0° quando é menor.

## Técnica de renderização em alto nível
DOM e CSS puros, com uma biblioteca de *timeline/tween* (ou implementação própria baseada em quadros) para as escalas e os deslocamentos com atrasos e sobreposições. As curvas usadas são:
- *back-out* com overshoot de 1,5;
- potência cúbica de saída (abertura dos rótulos);
- potência cúbica de entrada (fechamento).

O estado aberto/fechado fica no estado do componente. A sobreposição só existe no DOM enquanto está aberta ou animando o fechamento. A rotação de cada pílula e as cores de hover são passadas por variáveis CSS por item.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Logotipo: URL de imagem ou nó React | string ou nó | nenhum |
| Função chamada a cada alternância, recebendo o novo estado | função (booleano) | nenhuma |
| Classe e estilo extras da barra | string / objeto de estilo | nenhum |
| Rótulo acessível do botão de menu | string | "Toggle menu" |
| Cor de fundo das bolhas e das pílulas | cor CSS | `#fff` |
| Cor das linhas do botão e do texto das pílulas | cor CSS | `#111` |
| Posicionamento fixo à viewport em vez de absoluto ao contêiner | booleano | falso |
| Lista de itens: rótulo, destino, rótulo acessível opcional, rotação opcional (graus) e cores de hover opcionais (fundo e texto) | array | 5 itens padrão (acima) |
| Curva de entrada das pílulas (nome de easing) | string | *back-out* com overshoot 1,5 |
| Duração da animação de entrada de cada pílula e rótulo | número (s) | 0,5 |
| Atraso base da cascata entre pílulas | número (s) | 0,12 |

Curvas oferecidas na demo, para suportar por nome:
- *back-out* (1,5);
- potência cúbica de saída;
- potência quadrática de saída;
- elástica de saída (amplitude 1, período 0,5);
- "quique" de saída (*bounce-out* clássico).

## Demo
- Área de prévia com posicionamento relativo, **800 px de altura**, overflow oculto e fundo do tema com padrão discreto de pontos.
- O componente usa o modo absoluto, então a barra fica no topo da área e a sobreposição cobre a área inteira.
- **Logotipo**: na referência é um arquivo de logotipo próprio em preto (marca da biblioteca). **Não usar o arquivo**: gerar um SVG próprio simples, como um pequeno símbolo geométrico mais uma palavra curta, em preto `#111`, e respeitar o limite de 60% da altura da bolha.
- Valores da demo: fundo `#ffffff`, conteúdo `#111111`, curva *back-out* (1,5), duração 0,5 s, cascata 0,12 s, com os 5 itens padrão.
- Controles:
  - seletor de curva (5 opções acima);
  - cor de fundo do menu;
  - cor do conteúdo;
  - duração de 0,1 a 2 (passo 0,05);
  - cascata de 0 a 0,5 (passo 0,01).
- O efeito depende de clique. Para a miniatura, **recomenda-se abrir o menu automaticamente** cerca de 600 ms após a montagem, para que a cascata de pílulas apareça sem interação.

## Acessibilidade e responsividade
- A barra é um elemento de navegação com nome "Main navigation". O botão tem rótulo acessível configurável.
- A referência usa estado de "pressionado" no botão e papéis de menu/item de menu na lista. **Recomendação**: usar estado de **expandido** (associado à região dos links) em vez de "pressionado". Para links de navegação simples, usar uma lista comum de links em vez do padrão de menu da aplicação.
- **Recomendações não presentes na referência**:
  - fechar com **Esc**;
  - mover o foco para o primeiro link ao abrir e devolvê-lo ao botão ao fechar;
  - manter o foco preso na sobreposição enquanto aberta, ou fechar ao perder o foco;
  - mostrar um indicador visível de foco (`:focus-visible`) nas pílulas e nas bolhas.
- A sobreposição é marcada como oculta para leitores de tela quando fechada.
- Com `prefers-reduced-motion`, trocar as escalas e deslocamentos por um *fade* curto (≤150 ms) sem overshoot.
- Responsivo:
  - bolhas de 48/56 px (corte em 768 px);
  - grade de 3 colunas com inclinação a partir de 900 px;
  - coluna única, sem inclinação e alinhada ao topo abaixo disso.

## Observações de fidelidade
- **Escala no hover anulada (defeito)**: a animação grava a transformação inline nas pílulas e isso sobrepõe a escala de hover/pressionado declarada no CSS. Na referência, só as cores mudam no hover. **Recomendação**: aplicar a escala de hover/pressionado num elemento interno, ou compor as escalas para que 1,06× e 0,94× funcionem de fato.
- **Altura fixa conflitante**: a pílula declara uma altura fixa minúscula (10 px) que é dominada pela altura mínima. Ignorar e usar só a altura mínima.
- **Rótulo acessível divergente**: no 3º item padrão, o rótulo visível é "projects", mas o nome acessível é "Documentation". **Recomendação**: usar "Projects".
- A variação aleatória da cascata faz a ordem visual oscilar levemente a cada abertura. Manter, porque faz parte do charme, mas limitada a ±0,05 s.
