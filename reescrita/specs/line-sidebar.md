# Especificação: Barra lateral de linhas (line-sidebar)

## Propósito
Menu lateral vertical, só de texto, em que cada entrada tem à esquerda um traço horizontal fino (marcador). Quando o ponteiro passa perto, as entradas próximas reagem de forma contínua e proporcional à distância: o texto desliza para a direita, a cor puxa para um tom de destaque e o marcador se alonga. Clicar numa entrada a torna ativa, e ela fica permanentemente no estado "totalmente realçado".

## Aparência
- **Contêiner (navegação)**:
  - posicionamento relativo, flex, conteúdo alinhado à esquerda;
  - quando os marcadores estão ligados, recebe um recuo à esquerda igual a comprimento do marcador + folga entre marcador e texto (padrão 60 + 0 = **60 px**), espaço onde os marcadores são desenhados;
  - sem fundo, sem borda.
- **Lista**: sem marcadores de lista nativos, margem 0, padding de **1rem** em cima e embaixo (0 nas laterais), coluna flex com espaçamento vertical entre itens configurável (padrão **20 px**).
- **Item**: posicionamento relativo, cursor de ponteiro. Tem uma área de acerto invisível ampliada: **6 px** acima e abaixo e **48 px** à esquerda e à direita além da caixa do item, para reagir um pouco antes de o cursor chegar ao texto.
- **Rótulo**: linha inline-flex, alinhamento pela linha de base, tamanho de fonte configurável (padrão **1.1rem**), altura de linha **1.2**. Fonte herdada da página.
- **Índice numérico** (opcional, ligado por padrão): número da posição, começando em 1, com dois dígitos e zero à esquerda ("01", "02"...). Fonte monoespaçada do sistema (ui-monospace / SF Mono / Menlo), **0.85em** do rótulo, espaço de **0.6rem** à direita.
- **Marcador** (opcional, ligado por padrão): linha horizontal de **1 px** de altura, centralizada verticalmente no item, começando à esquerda do item a uma distância de comprimento + folga, com largura igual ao comprimento do marcador (padrão **60 px**). Cresce a partir da ponta esquerda.
- **Tiques intermediários** (existem só quando os marcadores estão ligados): entre cada par de itens consecutivos (não depois do último), uma linha de 1 px centrada verticalmente no meio do espaço entre os dois itens, alinhada à mesma borda esquerda dos marcadores, com largura = comprimento do marcador × fração (padrão **0,5**, ou seja 30 px). Cor de marcador em repouso, **opacidade 0,5**. O tique pertence ao item de cima e reage ao realce dele.
- **Cores padrão**:
  - destaque: **`#A855F7`** (violeta);
  - texto em repouso: **`#c4c4c4`**;
  - marcador em repouso: **`#6c6c6c`**.

## Comportamento

### Grandeza de realce por item
Cada item tem um valor de realce contínuo entre 0 e 1, do qual derivam todas as propriedades visuais ao mesmo tempo:
- **Cor do rótulo**: mistura no espaço sRGB entre a cor do texto (0) e a cor de destaque (1), na proporção do realce.
- **Deslocamento do rótulo**: translação horizontal para a direita = realce × deslocamento máximo (padrão **30 px**).
- **Opacidade do índice**: 0,55 + 0,45 × realce (vai de 0,55 a 1).
- **Marcador**: cor misturada entre cor de marcador e destaque na proporção do realce; escala horizontal = 0,7 + 0,5 × realce (de 70% a 120% do comprimento), ancorada na esquerda.
- **Tique intermediário**: se a opção de escalar os tiques estiver ligada (padrão), escala horizontal = 0,7 + 0,6 × realce do item de cima (ancorada à esquerda); a cor dele não muda. Se desligada, o tique fica fixo em 100% da largura definida.

### Alvo por proximidade
- A cada movimento do ponteiro sobre a lista, mede-se a coordenada vertical do ponteiro relativa ao topo da lista e, para cada item, a distância vertical absoluta até o centro vertical do item.
- Valor bruto = 1 − distância / raio, saturado em 0 por baixo. Raio padrão: **100 px**.
- O valor bruto passa por uma curva de queda escolhida por nome:
  - **linear**: identidade;
  - **suave** (padrão): smoothstep clássico (3p² − 2p³);
  - **acentuada**: cúbica (p³).
  - Nome desconhecido: usar linear.
- Ao sair da lista, todos os alvos voltam a 0.
- O alvo efetivo do item é o **maior** entre o alvo de proximidade e 1 se ele for o item ativo (0 caso contrário). Logo, o item ativo fica sempre em 1.

### Suavização temporal
- O realce atual persegue o alvo com **suavização exponencial independente da taxa de quadros**: a cada quadro, avança a fração 1 − e^(−Δt/τ) da distância restante, onde τ é o tempo de suavização (padrão **100 ms**; valores abaixo de 1 ms são tratados como 1 ms). Δt é limitado a **50 ms** para evitar saltos após abas em segundo plano.
- Quando a diferença para o alvo fica abaixo de **0,0015**, o valor encaixa no alvo.
- O laço de animação só roda enquanto algum item ainda não se assentou; é reiniciado a cada movimento do ponteiro, ao sair da lista e quando o item ativo muda.

### Clique
Clicar num item o torna ativo (substitui o anterior), aciona o retorno de chamada externo com índice e rótulo, e o item anima até o realce total. Não há como desativar clicando de novo. Pode haver um item ativo inicial configurável (padrão: nenhum).

## Técnica de renderização em alto nível
DOM + CSS puro, sem canvas. Cada item recebe uma única propriedade personalizada CSS numérica (o realce, 0 a 1) escrita diretamente no estilo do elemento a cada quadro, fora do ciclo de render do React. Todas as aparências derivam dessa variável via `calc()` e `color-mix()`, então cor, deslocamento e escala andam juntos sem transições CSS defasadas. Marcadores e tiques podem ser pseudo-elementos ou elementos vazios decorativos. Um único laço `requestAnimationFrame` cuida de todos os itens.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Rótulos das entradas | lista de strings | 12 rótulos: Overview, Components, Animations, Backgrounds, Showcase, Playground, Templates, Changelog, Community, Resources, Documentation, Support |
| Cor de destaque | cor CSS | `#A855F7` |
| Cor do texto em repouso | cor CSS | `#c4c4c4` |
| Cor dos marcadores em repouso | cor CSS | `#6c6c6c` |
| Mostrar índice numérico | booleano | sim |
| Mostrar marcadores e tiques | booleano | sim |
| Raio vertical de influência do ponteiro | número (px) | 100 |
| Deslocamento horizontal máximo do rótulo | número (px) | 30 |
| Curva de queda | linear / suave / acentuada | suave |
| Comprimento do marcador | número (px) | 60 |
| Folga entre marcador e texto | número (px) | 0 |
| Comprimento do tique como fração do marcador | número 0–1 | 0,5 |
| Tiques crescem com a proximidade | booleano | sim |
| Espaço vertical entre itens | número (px) | 20 |
| Tamanho da fonte | número (rem) | 1.1 |
| Tempo de suavização | número (ms) | 100 |
| Item ativo inicial | índice ou nenhum | nenhum |
| Retorno ao clicar | função (índice, rótulo) | nenhuma |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, overflow oculto, fundo do tema do site; o menu fica centralizado na vertical e encostado à esquerda, com recuo esquerdo de **24 px** em telas pequenas e **48 px** a partir de telas médias, e **48 px** de padding vertical.
- Usa só **8 rótulos**: Overview, Components, Animations, Backgrounds, Showcase, Playground, Templates, Changelog.
- No tema claro, se as cores ainda estiverem no padrão, a demo troca o texto para **`#52525b`** e os marcadores para **`#a1a1aa`**.
- Controles: três cores; curva; raio de 40 a 280 (passo 5); deslocamento de 0 a 60; comprimento do marcador de 20 a 200 (passo 5); folga de 0 a 60; fração do tique de 0 a 1 (passo 0,02); espaço entre itens de 4 a 48; fonte de 0,8 a 2 rem (passo 0,05); suavização de 0 a 800 ms (passo 20); chaves para índice, marcadores e tiques escaláveis.
- Como o efeito depende do ponteiro, recomenda-se na prévia uma animação automática na montagem: simular um ponteiro virtual que desce e sobe pela lista lentamente (por exemplo, um ciclo de ~4 s) até o primeiro movimento real do usuário.

## Acessibilidade e responsividade
- Envolver em elemento de navegação. O item ativo deve ser marcado como atual (`aria-current`, de preferência com valor `page` ou `location`).
- **Recomendação**: cada entrada deve ser um botão ou link real, focável por Tab e ativável com Enter/Espaço; o foco deve levar o item ao realce total (como se o ponteiro estivesse sobre ele) e exibir um indicador visível.
- Marcadores e tiques são decorativos (ocultos para leitores de tela).
- Com `prefers-reduced-motion`, manter as mudanças de cor e eliminar ou reduzir o deslocamento horizontal.
- Em toque não há "proximidade"; o toque apenas seleciona o item ativo. O menu é estreito e funciona em qualquer largura; com textos longos, permitir quebra ou reticências.

## Observações de fidelidade
- A referência usa itens de lista clicáveis sem foco por teclado nem papel de botão. **Recomendação**: usar elementos interativos reais (ver Acessibilidade).
- A referência expõe uma variável de tempo de suavização no CSS que não é usada; ignorar.
- A área de acerto ampliada (48 px laterais) se sobrepõe ao espaço dos marcadores; isso é intencional e deve ser mantido.
- A mistura de cores depende de `color-mix()`; em navegadores sem suporte, recomenda-se interpolar a cor em JS como alternativa.
