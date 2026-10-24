# Especificação: Navegação em cartões (card-nav)

## Propósito
Barra de navegação flutuante e compacta, com botão de menu, logotipo centralizado e botão de chamada para ação. Ao abrir o menu, a barra **cresce para baixo** e revela até **3 cartões coloridos**, cada um com um título e uma lista de links com seta diagonal. Os cartões sobem e aparecem em cascata.

## Aparência

### Contêiner externo
- Posicionamento absoluto, com topo a **2em** e centralização horizontal (meio da largura, com deslocamento de −50%).
- Largura de **90%**, máximo de **800 px** e camada alta (99).

### Barra (painel)
- Altura recolhida de **60 px**, fundo na cor base (padrão **branco `#fff`**) e borda de **0,5 px `rgba(255,255,255,0.1)`**.
- Raio de **0,75rem (12 px)** e sombra `0 4px 6px rgba(0,0,0,0.1)`.
- Overflow oculto e posicionamento relativo.

### Faixa superior
- Ocupa o topo da barra, com **60 px** de altura, posicionada de forma absoluta acima do conteúdo.
- Flex com itens centralizados na vertical e distribuídos nas extremidades.
- Padding: 0,5rem em cima, 0,45rem à direita, 0,55rem embaixo e 1,1rem à esquerda.

### Botão de menu (à esquerda)
- Altura total da faixa e duas linhas empilhadas, centralizadas, com **6 px** de espaço entre elas.
- Cada linha tem **30 × 2 px**, na cor do menu (padrão preto `#000`), sem arredondamento.
- No hover do botão, as linhas ficam com opacidade **0,75**.
- **Aberto**: a linha de cima desce 4 px e gira +45°; a de baixo sobe 4 px e gira −45°, formando um **X**.
- Transições: transformação em **0,25 s**, opacidade em **0,2 s** e margem em **0,3 s**, todas com `ease`.

### Logotipo
- Centralizado de forma absoluta no meio da faixa, nos dois eixos.
- Imagem com **28 px** de altura.

### Botão de ação (à direita)
- Texto fixo **"Get Started"**, peso 500.
- Fundo **`#111`**, texto branco, sem borda.
- Raio de **0,4rem**, ou seja, o raio da barra menos 0,35rem.
- Padding horizontal de 1rem, altura total da área útil da faixa (cerca de 43 px) e cursor de ponteiro.
- No hover, o fundo muda para **`#333`** em **0,3 s**.

### Área de conteúdo
- Posicionada de forma absoluta, de **60 px** do topo até a base da barra, com padding de **0,5rem**.
- Flex em linha, com itens alinhados à base e espaço de **12 px** entre eles.
- Fica invisível e sem captura de ponteiro enquanto fechada.

### Cartão
- No máximo **3 cartões**; itens além do terceiro são ignorados.
- Ocupa 100% da altura da área, com largura igual entre os irmãos (flex 1, podendo encolher até 0).
- Raio de **0,55rem** (raio da barra menos 0,2rem) e padding de **12 px × 16 px**.
- Coluna com espaço de **8 px** e texto não selecionável.
- Fundo e cor de texto definidos pelo próprio item.
- **Título**: **22 px**, peso 400, espaçamento entre letras de −0,5 px.
- **Links**: empurrados para a base do cartão, em coluna com **2 px** de espaço entre eles.
  - Cada link tem **16 px**, sem sublinhado, flex em linha com espaço de 6 px.
  - Há um ícone de **seta diagonal para cima e para a direita** antes do texto (desenhar em SVG próprio, em traço fino).
  - No hover, a opacidade vai para **0,75** em 0,3 s.

### Layout estreito (largura de viewport de até 768 px)
- O topo do contêiner fica a **1,2em**.
- Faixa com padding de 0,5rem × 1rem. O logotipo deixa de ser absoluto e vai para a **esquerda** (primeiro); o botão de menu vai para a **direita**.
- O botão de ação é **ocultado**.
- Os cartões ficam em **coluna**, esticados na largura, com espaço de **8 px**, altura automática e mínima de **60 px**.
- Título com **18 px** e links com **15 px**.

## Comportamento

### Abrir
1. O X do botão aparece na hora, com a transição CSS acima.
2. A área de conteúdo fica visível.
3. Uma linha do tempo pausada e pré-montada toca do início:
   - **Altura da barra**: vai de **60 px** até a altura expandida em **0,4 s**, com a curva configurada (padrão: desaceleração cúbica, 1 − (1 − t)³).
   - **Cartões**: cada um vai de **y = +50 px e opacidade 0** até **y = 0 e opacidade 1**, em **0,4 s** com a mesma curva.
     - Há cascata de **0,08 s** entre cartões.
     - O primeiro cartão começa **0,1 s antes** do fim da animação de altura, ou seja, em t = 0,3 s.

### Altura expandida
- Desktop: fixa em **260 px**.
- Estreito (até 768 px): medida dinamicamente como 60 px da faixa + altura natural do conteúdo empilhado + **16 px**.
  - Para medir, o conteúdo é tornado visível e posto em fluxo estático de forma temporária, sem que isso apareça na tela.

### Fechar
- O X volta a ser duas linhas imediatamente.
- A mesma linha do tempo é tocada **ao contrário**: os cartões descem e somem na ordem inversa e depois a altura volta a 60 px.
- Só ao fim da reversão o estado "expandido" é desligado e a área de conteúdo volta a ficar invisível.

### Redimensionamento da janela
- A linha do tempo é recriada.
- Se estiver expandida, recalcula a altura, aplica direto e posiciona a nova linha do tempo no fim, sem animar.
- Se estiver recolhida, apenas recria a linha do tempo.

### Teclado
O botão de menu é focável e alterna com **Enter** ou **Espaço**, sem rolar a página.

### Troca de curva ou de itens
Reconstrói a linha do tempo.

## Técnica de renderização em alto nível
DOM e CSS, com uma linha do tempo de *tweens* que pode ser tocada para frente e para trás: altura do painel, seguida dos cartões com cascata e sobreposição. A reimplementação pode usar uma biblioteca de *timeline* ou um animador próprio com reversão. O X do botão usa transições CSS simples. A visibilidade da área de conteúdo é controlada por classe de estado.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Logotipo (URL de imagem) | string | nenhum |
| Texto alternativo do logotipo | string | "Logo" |
| Itens: título, cor de fundo, cor de texto e lista de links (rótulo, destino, rótulo acessível) | array (até 3 usados) | vazio |
| Classe extra do contêiner | string | vazia |
| Curva de easing da abertura | nome de easing | desaceleração cúbica |
| Cor de fundo da barra | cor CSS | `#fff` |
| Cor das linhas do botão de menu | cor CSS | `#000` |
| Cor de fundo do botão de ação | cor CSS | `#111` |
| Cor do texto do botão de ação | cor CSS | branco |

## Demo
- Área de prévia com posicionamento relativo, **550 px de altura**, overflow oculto e padrão discreto de pontos. A cor de fundo depende do tema da demo.
- **Itens** (texto branco `#fff` em todos):
  1. **"About"**, fundo **`#1B1722`**, com os links "Company" e "Careers";
  2. **"Projects"**, fundo **`#2F293A`**, com os links "Featured" e "Case Studies";
  3. **"Contact"**, fundo **`#2F293A`**, com os links "Email", "Twitter" e "LinkedIn".
- **Temas da demo** (seletor "Example"):
  - **Claro**: barra `#fff`, linhas `#000`, botão `#111` com texto `#fff` e fundo da área `#f5f5f5`;
  - **Escuro**: barra `#120F17`, linhas `#fff`, botão **`#5227FF`** com texto `#fff` e fundo da área `#120F17`;
  - **Colorido**: barra **`#5227FF`**, linhas `#fff`, botão `#fff` com texto `#5227FF` e fundo da área `#120F17`.
  - O padrão "Claro" segue o tema do site: no site escuro, é renderizado o tema Escuro.
- **Logotipo**: na referência é um arquivo de marca da biblioteca, em versão preta e branca. **Não usar**: gerar um SVG próprio (símbolo geométrico mais palavra curta), branco nos temas escuro e colorido e preto no claro, com 28 px de altura.
- Seletor de curva com 4 opções:
  - desaceleração cúbica;
  - *back-out* com overshoot de 1,7;
  - elástica de saída (amplitude 1, período 0,8);
  - circular de saída.
- Qualquer mudança remonta o componente.
- Para a miniatura, **recomenda-se abrir o menu automaticamente** cerca de 600 ms após a montagem.

## Acessibilidade e responsividade
- O botão de menu tem papel de botão, é focável e informa estado expandido/recolhido. O rótulo alterna entre "Open menu" e "Close menu".
- A área de conteúdo fica oculta para tecnologias assistivas quando fechada. Ela também é invisível, então os links não recebem foco por Tab quando fechada.
- **Recomendações**:
  - usar um elemento de botão nativo em vez de um bloco com papel de botão;
  - associar o botão à região controlada;
  - fechar com **Esc**;
  - mostrar foco visível no botão de menu, nos links e no botão de ação;
  - garantir que links sem destino sejam renderizados como botões ou com destino real.
- Com `prefers-reduced-motion`, aplicar altura e cartões sem deslocamento, no máximo com *fade* curto.
- Responsivo: abaixo de 769 px, muda para o layout empilhado descrito acima, com altura calculada pelo conteúdo.

## Observações de fidelidade
- **Hover do botão de ação anulado (defeito)**: quando a cor de fundo do botão é passada como parâmetro, ela é aplicada inline e o escurecimento no hover (`#333`) deixa de funcionar. **Recomendação**: aplicar o hover como um escurecimento relativo (filtro de brilho ou sobreposição) que funcione com qualquer cor.
- A borda da barra é branca translúcida e praticamente invisível no tema claro. Manter, por fidelidade.
- O texto do botão de ação é fixo na referência. **Recomendação**: torná-lo configurável, com padrão "Get Started", e permitir uma ação ao clicar.
- No tema claro, o padrão de cor das linhas do menu não se ajusta sozinho. O consumidor deve escolher uma cor com contraste.
