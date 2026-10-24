# Especificação: Troca pixelada (pixel-swap)

## Propósito
Um contêiner com dois estados de conteúdo, A e B. Ao ativar (hover, clique ou controle externo), o conteúdo novo **surge por cima do antigo em uma grade de "pixels" quadrados**. Cada janela cresce de pequena para o tamanho total, opcionalmente girando e desbotando, numa ordem definida por um padrão (aleatório, do centro, das bordas, varredura, diagonal, espiral). O conteúdo revelado fica perfeitamente imóvel enquanto as janelas crescem.

## Aparência
- **Contêiner**:
  - posicionamento relativo, largura de 100% e overflow oculto;
  - isolamento de empilhamento próprio e sem contorno de foco nativo;
  - proporção padrão **16 / 10**, configurável;
  - aceita classe e estilo extras.
- **Camadas**: duas camadas absolutas, cada uma cobrindo 100%, uma com o conteúdo A e outra com o B. A visível fica por cima; a outra fica com visibilidade oculta.
- **Grade de transição** (só existe durante a transição): uma camada absoluta acima das duas, sem capturar ponteiro. Contém as células da grade.
- **Célula**:
  - quadrado de lado s (padrão **64 px**, mínimo 8);
  - separação entre células g (padrão **0 px**);
  - raio de 0 a 50% (padrão **0**; 50% é círculo);
  - overflow oculto e opacidade inicial 0.
  - Dentro de cada célula há uma **cópia do conteúdo de destino**, deslocada pela posição da célula para ficar alinhada com o contêiner. Assim, cada célula é uma "janela" para o mesmo conteúdo.

## Comportamento
### Construção da grade (no início de cada transição, congelada até o fim)
- Colunas = ⌈(largura + g) ÷ (s + g)⌉ e linhas = ⌈(altura + g) ÷ (s + g)⌉, com no mínimo 1.
- Se colunas × linhas passar de **220**, s é multiplicado por √(total ÷ 220), arredondado para cima, e a grade é recalculada.
- A grade fica **centralizada**, excedendo as bordas por igual, para que as células da borda continuem quadradas (o excesso é cortado).
- Cada célula tem uma posição normalizada (x, y) de 0 a 1: coluna ÷ (colunas − 1) e linha ÷ (linhas − 1), ou 0,5 se houver só uma. A partir dela, recebe uma **ordem** de 0 a 1 conforme o padrão:
  - **aleatório**: valor pseudoaleatório fixo por índice (hash senoidal), então a "aleatoriedade" se repete igual a cada vez;
  - **centro**: distância ao centro ÷ √½. O centro vem primeiro e os cantos por último;
  - **bordas**: 2 × menor distância a qualquer borda. As bordas vêm primeiro e o centro por último;
  - **esquerda→direita** (x), **direita→esquerda** (1 − x), **cima→baixo** (y), **baixo→cima** (1 − y);
  - **diagonal**: (x + y) ÷ 2, do canto superior esquerdo ao inferior direito;
  - **espiral**: (ângulo polar em torno do centro, normalizado de 0 a 1 + distância normalizada ao centro), em módulo 1.
  - **Aleatoriedade** r (de 0 a 1, padrão **0**): ordem final = ordem do padrão × (1 − r) + aleatório × r. Não vale para o padrão aleatório.

### Temporização
- Duração total T = máx(200, duração) ms (padrão **1400**).
- Duração por célula: entre 60 ms e T (padrão **450 ms**).
- Espalhamento = T − duração por célula. Cada célula começa com atraso = ordem × espalhamento.
- Ao fim de T, a grade some e o conteúdo de destino passa a ser a camada visível. Depois, é chamado o retorno de "transição concluída" com o novo estado.

### Animação de cada célula
- **Escala final**: fator de cobertura = ((s + g) ÷ s) × máx(1, fator de canto). O fator de canto, para raio p (fração de 0 a 0,5), é √½ ÷ (√2 × (0,5 − p) + p). Vale 1 com cantos retos e √2 em círculos. Isso garante que, no fim, as janelas cubram completamente as separações e os cantos arredondados. A sobreposição não aparece porque todas mostram o mesmo conteúdo alinhado.
- **Escala inicial** = escala final × clamp(escala inicial relativa, 0,05, 1) (padrão relativo **0,35**).
- **Curva**: aplicada pela amostragem da curva de easing em **15 pontos** (14 intervalos), com interpolação linear entre eles. O padrão é `cubic-bezier(0.22, 1, 0.36, 1)`, um ease-out forte. Aceita os nomes linear, ease, ease-in, ease-out e ease-in-out, ou uma string `cubic-bezier(...)`. Valores inválidos viram *ease*.
- Para cada amostra com valor suavizado e:
  - escala = início + (fim − início) × e;
  - rotação = giro × (1 − e) graus (padrão **0°**). A célula chega girada e termina reta;
  - opacidade = mín(1, e × 1,6) se o desbotamento estiver ligado (padrão), ou 1 se estiver desligado.
- O conteúdo dentro da janela recebe a **transformação inversa exata** (escala 1/s e rotação oposta) em torno do centro da célula, para que o conteúdo revelado não se mova, não gire e não mude de tamanho.
- O preenchimento temporal mantém o primeiro quadro-chave durante o atraso. Com o desbotamento desligado, isso faz **todas** as células aparecerem pequenas logo no início e crescerem na sua vez.

### Ativação
- **hover** (padrão): ativa ao entrar com o mouse ou ao receber foco, e desativa ao sair ou perder o foco. O contêiner fica focável.
- **clique**: alterna a cada clique ou ao pressionar Enter ou Espaço (sem a ação padrão). Tem papel de botão e é focável.
- **manual**: sem interação própria.
- **Controlado**: um valor externo de "ativo" tem prioridade. O componente avisa as mudanças pedidas por um retorno. Há também um estado inicial para o modo não controlado.
- **Durante uma transição**: novas mudanças de estado ficam pendentes. Ao terminar, se o estado desejado for diferente do mostrado, começa uma nova transição no sentido inverso.
- **Movimento reduzido**: com `prefers-reduced-motion: reduce`, a troca é instantânea, com o retorno de conclusão.
- **Medida**: o tamanho é observado continuamente (área interna do contêiner).
- O estado mostrado e o fato de estar em transição são expostos como atributos de dados no contêiner, para estilização externa.

## Técnica de renderização em alto nível
DOM com Web Animations API. Cada célula recebe duas animações por quadros-chave: a da janela e a inversa do conteúdo, com duração e atraso próprios e easing linear entre as amostras pré-calculadas. O conteúdo de destino é **clonado do DOM já renderizado** para dentro de cada célula, em vez de ser renderizado N vezes pelo React. No fim, tudo é cancelado e as células são esvaziadas. Um temporizador de T ms conclui a transição.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo A (inativo) | nós React | — |
| Conteúdo B (ativo) | nós React | — |
| Lado da célula (px) | número | 64 |
| Separação entre células (px) | número | 0 |
| Raio da célula (%) | 0–50 | 0 |
| Giro inicial da célula (graus) | número | 0 |
| Escala inicial relativa | 0,05–1 | 0,35 |
| Desbotar ao entrar | booleano | verdadeiro |
| Duração total (ms) | número | 1400 |
| Duração por célula (ms) | número | 450 |
| Padrão de ordem | aleatório / centro / bordas / esquerda→direita / direita→esquerda / cima→baixo / baixo→cima / diagonal / espiral | aleatório |
| Aleatoriedade misturada ao padrão | 0–1 | 0 |
| Curva de easing | nome ou cubic-bezier | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Gatilho | hover / clique / manual | hover |
| Estado inicial | booleano | falso |
| Estado controlado | booleano | indefinido |
| Retorno ao pedir mudança | função | — |
| Retorno ao concluir | função | — |
| Proporção | string CSS | `16 / 10` |
| Classe e estilo extras | string / objeto | — |

## Demo
- Área de prévia com **altura mínima de 500 px**, padding de 16 px (32 px em telas médias ou maiores), cartão centralizado e fundo escuro do site.
- **Cartão**:
  - largura máxima de **780 px**;
  - borda de 1 px na cor de borda do tema;
  - raio grande (cerca de 16 px);
  - fundo na cor de fundo da página;
  - sombra `0 28px 80px rgba(0,0,0,0.32)`;
  - cursor de mão e seleção desativada;
  - no foco visível, um anel de 2 px na cor primária, somado à mesma sombra.
- **Painéis** (A e B): flex em coluna, centralizados, com espaçamento de 12 px, padding de 24 px e texto centralizado.
  - **Sobretítulo**: fonte `clamp(0.65rem, 1.4vw, 0.75rem)`, peso 500, espaçamento entre letras de 0,18em, em maiúsculas.
  - **Título**: fonte `clamp(1.4rem, 4vw, 2.6rem)`, peso 600, espaçamento de −0,02em, altura de linha 1,1, sem margem.
  - **A**: fundo da página e texto primário. Sobretítulo "Hover the card" (ou "Click the card" no modo clique), em cor atenuada, e título "Use React Bits".
  - **B**: gradiente de 135° de **`#ffffff`** a **`#e4d9f7`** (lilás claro) e texto **`#120f17`**. Sobretítulo "Now go and", em `rgba(18,15,23,0.55)`, e título "Build anything".
- Valores da demo: os padrões da tabela.
- Controles:
  - padrão (9 opções);
  - gatilho (hover/clique; trocar remonta o componente);
  - lado de 24 a 120 (passo 4);
  - separação de 0 a 16;
  - raio de 0 a 50%;
  - escala inicial de 0,05 a 1 (passo 0,05);
  - giro de 0 a 180° (passo 5);
  - duração de 400 a 4000 (passo 100);
  - duração por célula de 100 a 1200 (passo 50);
  - aleatoriedade de 0 a 1 (passo 0,05; desabilitada no padrão aleatório);
  - chave de desbotamento.

## Acessibilidade e responsividade
- A camada inativa fica oculta da árvore de acessibilidade, e a grade de transição também. As cópias dentro das células não devem ser anunciadas.
- O modo clique expõe papel de botão. **Recomendação**: informar também o estado pressionado.
- A referência remove o contorno nativo. **Recomendação**: garantir um indicador de foco visível (a demo faz isso com o anel).
- **Movimento reduzido**: troca instantânea, já prevista.
- Responsivo: a grade se recalcula pelo tamanho, e o limite de 220 células mantém o custo controlado em áreas grandes.

## Observações de fidelidade
- A clonagem de DOM não copia estado interno de elementos interativos nem o quadro atual de vídeo ou canvas. Para conteúdo dinâmico, documentar essa limitação.
- O "aleatório" é determinístico pelo índice, então é a mesma ordem em toda transição. Manter, ou opcionalmente variar por transição, documentando a escolha.
