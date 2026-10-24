# Especificação: Seletor com destaque deslizante (glide-select)

## Propósito
Um seletor compacto (substituto de `<select>`) formado por um "chip" clicável que abre um menu flutuante de opções. O diferencial é uma pílula de destaque única que **desliza** verticalmente entre as linhas enquanto o ponteiro ou o teclado percorre a lista, em vez de cada linha acender sozinha. Também aceita o gesto de "pressionar, arrastar e soltar" sobre a lista para escolher em um movimento só.

## Aparência

### Tamanhos (três presets)
| Preset | Altura do chip | Altura da linha | Fonte |
|---|---|---|---|
| pequeno | 28 px | 26 px | 12 px |
| **médio (padrão)** | **32 px** | **30 px** | **13 px** |
| grande (pensado para toque) | 44 px | 40 px | 14 px |

### Cores padrão (tema escuro)
- Superfície (chip e menu): **`#27272a`**.
- Destaque (pílula): **`#3f3f46`**.
- Texto: **`#f5f5f5`**.
- Acento (ícone de confirmação da opção selecionada): **`#f5f5f5`**.
- Cores derivadas: o chip em hover/aberto usa uma mistura de 60% do destaque com 40% da superfície; a linha selecionada em repouso usa o destaque a 60% de opacidade; a seta do chip e as etiquetas secundárias usam o texto a 55% de opacidade.

### Raios
- Raio do menu configurável (padrão **10 px**).
- Chip, linhas e pílula usam o raio do menu **menos 4 px** (mínimo 3 px), para ficarem concêntricos com o menu.

### Contêiner raiz
Bloco em linha com posicionamento relativo (âncora do menu). Quando desabilitado, fica com opacidade 0,5.

### Chip (gatilho)
- Botão em linha flex, itens centralizados, espaçamento de 6 px.
- Padding de 0 × 8 px à direita × 10 px à esquerda, sem borda.
- Fonte herdada, peso 500, entrelinha 1.
- Seleção de texto desligada e sem realce de toque.
- Conteúdo: o rótulo da opção selecionada (ou o texto de placeholder, padrão **"Select…"**, a 60% de opacidade) seguido de uma pequena **seta para baixo** em traço de 12 px com espessura 2,5.
- Desenhe a seta como SVG próprio (um "V" aberto).

### Menu
- Posição absoluta, camada acima do conteúdo (z ≈ 20).
- Separado do chip por **6 px**, abaixo ou acima dele.
- Largura configurável (padrão **176 px**), mas nunca menor que a largura do chip.
- Padding de **4 px**, fundo da superfície e sombra **`0 4px 16px rgba(0,0,0,.22)`**.
- Alinhado à borda esquerda ou à direita do chip.

### Lista
- Grade de uma coluna com **1 px** de espaço entre as linhas.
- Uma pílula absoluta, com a altura de uma linha, a largura total e o fundo de destaque, fica atrás das linhas.

### Linha (opção)
- Flex, com espaçamento de 8 px e padding de 0 × 8 px à direita × 10 px à esquerda.
- Altura igual à da linha do preset, raio interno e cursor de mão.
- Contém três partes:
  1. o nome, que ocupa o espaço restante em peso 500, numa linha só, com reticências;
  2. uma etiqueta opcional à direita, com fonte 2 px menor e cor de texto a 55%;
  3. um ícone de **visto** de 13 px com traço 2,5 na cor de acento. O visto ocupa espaço sempre, mas só fica visível na linha selecionada. Desenhe-o em SVG próprio.

## Comportamento

### Abertura e fechamento
- O chip abre e fecha no **pressionar** do botão principal (pointerdown), não no clique, e recebe foco sem rolar a página.
- **Animação de abertura**: o menu nasce com opacidade 0 e escala 0,95 e vai para opacidade 1 e escala 1.
  - Duração: **180 ms** (configurável).
  - Curva: **cubic-bezier(0.23, 1, 0.32, 1)**, um ease-out forte.
  - A origem da transformação é o canto do menu encostado no chip. Por exemplo, com o menu abaixo e alinhado à esquerda, a origem é o canto superior esquerdo.
- **Animação de saída** (pop de fechamento): faz o caminho inverso em **2/3 da duração de abertura**, arredondado (120 ms no padrão). Durante a saída, o menu não recebe ponteiro e só é desmontado ~20 ms depois do fim da transição.
- A **seta** do chip gira 180° quando o menu está aberto, em 200 ms com a mesma curva.
- Com o menu aberto, o chip usa o fundo de hover.
- Ao ser pressionado, o chip encolhe para escala 0,97 em 160 ms.
- O hover do chip só existe em dispositivos com ponteiro fino e suporte a hover. A troca de fundo leva 100 ms.

### Inversão automática de lado
Ao abrir, mede-se a altura do menu mais 6 px de folga:
- se a posição preferida é embaixo e o menu ultrapassaria a parte de baixo da janela, ele abre em cima;
- se a preferida é em cima e ultrapassaria o topo, ele abre embaixo.

### Pílula deslizante
- Existe um índice de "linha ativa", que pode ser nulo.
- A pílula é posicionada por translação vertical igual ao índice × (altura da linha + 1 px).
- Entre linhas, a pílula **desliza** em **220 ms** (configurável; 0 equivale a um hover comum) com a curva ease-out forte. A opacidade muda em 150 ms.
- **Saltos instantâneos (sem deslizar)**:
  - quando a pílula estava invisível e aparece;
  - ao abrir o menu;
  - em navegação por teclado;
  - no início de um arraste.
  - Nesses casos, a translação é aplicada sem transição e só a opacidade anima.
- Quando o índice ativo é nulo, a pílula fica invisível. A linha selecionada mostra então o próprio fundo (destaque a 60%), com transição de 150 ms.
- Enquanto há linha ativa, a linha selecionada perde o fundo próprio para não competir com a pílula.
- Ao abrir, o índice ativo começa na opção selecionada. Se não houver seleção, começa nulo quando a abertura é por ponteiro ou na primeira linha quando é por teclado.

### Ponteiro na lista
- **Hover** (só para mouse e caneta, não para toque): passar sobre uma linha torna-a ativa.
- **Ao sair da lista**:
  - se "lembrar posição" estiver ligado (padrão), a pílula fica onde estava, e uma nova entrada desliza a partir dali;
  - se estiver desligado, o índice ativo volta a nulo.
- **Pressionar e arrastar**:
  - Ao pressionar na lista, o ponteiro é capturado e a linha sob ele vira ativa.
  - Movendo com o botão pressionado, a linha ativa acompanha a posição vertical (índice = parte inteira da distância ao topo da lista ÷ passo da linha).
  - Ao soltar sobre uma linha válida, ela é escolhida.
  - Soltar fora das linhas, cancelar o gesto ou perder a captura não escolhe nada. Nesse caso, sem "lembrar posição", o índice ativo volta a nulo.
  - Só um ponteiro é rastreado por vez.
- Um clique simples (pressionar e soltar na mesma linha) é só um caso particular desse gesto.

### Escolha
- Se o valor muda, notifica o novo valor e a opção completa e atualiza o estado interno quando o componente não é controlado.
- O menu fecha **instantaneamente** (sem animação de saída) e o foco volta ao chip.
- Quando a escolha muda o valor **por ponteiro**, o rótulo do chip faz uma breve transição de troca de 160 ms (ease): parte de opacidade 0,6 com desfoque de 2 px e chega a nítido e opaco. Escolhas por teclado ou mudanças externas do valor controlado não animam.

### Teclado (foco no chip)
- **Fechado**: Enter, Espaço, Seta para baixo e Seta para cima abrem o menu.
- **Aberto**:
  - Seta para baixo e Seta para cima movem a linha ativa uma posição, com limite nas pontas e sem dar a volta. Se não havia linha ativa, a primeira tecla apenas ativa a linha selecionada (ou a primeira).
  - Home vai para a primeira linha e End para a última.
  - Enter e Espaço escolhem a linha ativa (ou a selecionada).
  - Escape fecha instantaneamente.
  - Tab fecha instantaneamente e deixa o foco seguir.
  - **Busca por digitação**: um caractere imprimível, sem modificadores, salta para a próxima linha cujo texto começa com essa letra (sem diferenciar maiúsculas), procurando a partir da linha atual e dando a volta. Se nada casar, fica onde está.

### Outros casos
- **Clique fora**: pressionar fora do componente (detectado na fase de captura) fecha com a animação de saída.
- **Desabilitado**: ignora toda interação. Se for desabilitado com o menu aberto, fecha na hora.
- **Opções**: podem ser textos simples (valor = rótulo) ou objetos com valor, rótulo e etiqueta opcional.
- **Sem opções informadas**: usa "One", "Two" e "Three".

## Técnica de renderização em alto nível
DOM e CSS puros, com transições CSS:
- cores, tamanhos e durações passados como variáveis CSS no elemento raiz;
- estado de abertura em três fases: fechado (desmontado), aberto e fechando;
- para disparar a transição de entrada logo após montar, aplica-se o estado inicial, força-se um reflow e então troca-se para o estado aberto;
- a pílula é manipulada diretamente por estilo (translação e opacidade). Desligar a transição momentaneamente produz os saltos instantâneos;
- a medição de lado usa o retângulo do contêiner e a altura da janela.

Não há canvas nem biblioteca de animação.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de opções (texto, ou objeto com valor, rótulo e etiqueta) | array | "One", "Two", "Three" |
| Valor controlado | string | indefinido |
| Valor inicial (não controlado) | string | vazio |
| Callback de mudança (valor, opção) | função | nenhum |
| Texto de placeholder | string | "Select…" |
| Mostrar etiquetas | booleano | sim |
| Cor de acento (visto) | cor | `#f5f5f5` |
| Cor de superfície | cor | `#27272a` |
| Cor de destaque (pílula) | cor | `#3f3f46` |
| Cor do texto | cor | `#f5f5f5` |
| Tamanho | pequeno / médio / grande | médio |
| Raio do menu | número (px) | 10 |
| Largura do menu | número (px) | 176 |
| Lado preferido | embaixo / em cima | embaixo |
| Alinhamento | esquerda / direita | esquerda |
| Duração da abertura | número (ms) | 180 |
| Duração do deslize da pílula | número (ms) | 220 |
| Lembrar posição da pílula ao sair | booleano | sim |
| Desabilitado | booleano | não |
| Nome acessível | string | "Select" |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia com **480 px de altura**, overflow visível e o seletor centralizado nos dois eixos. O fundo é o do tema do site.
- Opções de exemplo (conjunto "formatos"), cada uma com rótulo e etiqueta:
  - PNG — "Lossless";
  - JPG — "Smallest";
  - WebP — "Modern";
  - SVG — "Vector";
  - PDF — "Print".
  - Valor inicial: PNG.
  - Nome acessível: "Export format".
  - A demo controla o valor externamente.
- Conjuntos alternativos da demo:
  - "regiões": US East — Virginia, US West — Oregon, EU — Frankfurt, Asia — Singapore;
  - "tamanhos": XS, S, M, L, XL, 2XL, 3XL e 4XL, só texto.
- No **tema claro**, enquanto as cores estão no padrão, a demo usa:
  - acento **`#18181b`**;
  - superfície **`#f6f6f6`**;
  - destaque **`#e4e4e7`**;
  - texto **`#18181b`**.
- Controles: conjunto de opções, tamanho, as quatro cores, raio de 6 a 20, largura do menu de 140 a 280 (passo 4), lado, alinhamento, abertura de 0 a 400 ms, deslize de 0 a 400 ms, lembrar posição, mostrar etiquetas e desabilitado.

## Acessibilidade e responsividade
- O chip é um botão com papel de **combobox**: indica que abre uma *listbox*, expõe o estado expandido e referencia a lista. Ele aponta a linha ativa como descendente ativo, e o foco permanece no chip durante a navegação.
- A lista tem papel *listbox* com o mesmo nome acessível. Cada linha tem papel *option* e marca se está selecionada. Seta e visto são decorativos.
- A referência remove o contorno de foco do chip. **Recomendação**: dar um indicador em `:focus-visible` (anel de 2 px na cor do texto ou do acento).
- Com `prefers-reduced-motion`:
  - o menu só faz fade, sem escala;
  - a pílula não desliza (só a opacidade muda);
  - a seta gira sem transição;
  - o chip não encolhe ao ser pressionado;
  - o rótulo não faz a animação de troca.
- Em toque: o hover não ativa linhas, mas o gesto de pressionar e arrastar funciona. A lista desabilita gestos de rolagem nativos sobre si. O preset grande é o indicado para toque.

## Observações de fidelidade
- **Recomendação**: no cálculo de linha sob o ponteiro, a referência mede a partir do topo da própria lista e ainda subtrai o padding do menu (4 px). Isso desloca o mapeamento em 4 px, e os 4 px superiores da primeira linha não respondem. Meça a partir do topo real da primeira linha.
- **Recomendação**: quando o menu está fechado (desmontado), o chip referencia uma lista que não existe. Só declare a referência à lista enquanto ela estiver montada.
- **Recomendação**: a abertura no *pointerdown* é intencional e deve ser mantida. Garanta, porém, que o clique sintético seguinte não feche o menu de novo.
