# Especificação: Dock com ampliação (dock)

## Propósito
Uma barra de ícones no estilo do dock do macOS, fixa na parte de baixo do contêiner. Quando o ponteiro se aproxima, os ícones próximos crescem de forma elástica, proporcionalmente à proximidade, e o ícone sob o cursor (ou com foco) mostra um rótulo flutuante acima dele.

## Aparência
- **Contêiner externo**:
  - flex, com itens centralizados verticalmente;
  - margem horizontal de 0.5rem e largura máxima de 100%;
  - barra de rolagem oculta;
  - altura animada (ver Comportamento).
  - Ele existe para reservar espaço vertical para os ícones ampliados.
- **Painel (barra)**:
  - posicionamento absoluto, ancorado a **0.5rem do fundo** do ancestral posicionado mais próximo e centralizado na horizontal (meio da largura, com deslocamento de −50%);
  - largura ajustada ao conteúdo;
  - flex em linha, com os itens **alinhados pela base**, para que cresçam para cima;
  - espaçamento de **1rem** entre itens;
  - raio de **1rem**;
  - fundo **`#120F17`** (roxo-quase-preto) e borda de **1 px `#222`**;
  - padding de 0 em cima, 0.5rem nas laterais e 0.5rem embaixo;
  - **altura fixa** igual à altura do painel (padrão **68 px**). Os itens ampliados ultrapassam o topo do painel.
- **Item**:
  - quadrado com lado animado (padrão **50 px** em repouso);
  - conteúdo centralizado;
  - raio de **10 px**;
  - fundo `#120F17` e borda de 1 px `#222`;
  - sombra suave dupla: aproximadamente `0 4px 6px -1px rgba(0,0,0,.1)` e `0 2px 4px -1px rgba(0,0,0,.06)`;
  - cursor de ponteiro;
  - sem contorno de foco nativo (ver Acessibilidade).
  - Aceita uma classe extra por item.
- **Ícone**: invólucro flex centralizado. O ícone em si vem do usuário. Na demo, são ícones de traço de 18 px na cor do texto (clara).
- **Rótulo**:
  - balão posicionado de forma absoluta acima do item (topo a −1.5rem), centralizado na horizontal;
  - largura ajustada ao texto, sem quebra;
  - raio de 0.375rem e borda de 1 px `#222`;
  - fundo `#120F17`;
  - padding de 0.125rem × 0.5rem;
  - fonte de **0.75rem** em **branco**.

## Comportamento

### Ampliação por proximidade
- Rastreia a coordenada **horizontal** do ponteiro enquanto ele se move **sobre o painel**. Quando o ponteiro sai do painel, essa coordenada passa a valer "infinito", o que leva todos os itens de volta ao tamanho base.
- Para cada item, calcula a distância horizontal com sinal entre o ponteiro e o ponto de referência do item, que é a borda esquerda medida mais metade do **tamanho base**, ou seja, aproximadamente o centro em repouso.
- O tamanho-alvo vem de uma **interpolação linear por partes, com saturação**:
  - distância −D → tamanho base;
  - distância 0 → tamanho ampliado;
  - distância +D → tamanho base;
  - fora de ±D, permanece no tamanho base.
  - Padrões: D = **200 px**, tamanho ampliado = **70 px** e tamanho base = **50 px**. O perfil resultante é um "triângulo" de ampliação.
- O tamanho real (largura = altura) persegue o alvo com uma **mola**: massa **0,1**, rigidez **150** e amortecimento **12**. É uma mola leve e rápida, com um leve overshoot.
- Como os itens crescem e o painel continua centralizado, os vizinhos se afastam naturalmente.
- Usar sempre o mesmo sistema de coordenadas para o ponteiro e para a medição do item (por exemplo, ambos relativos à viewport). A referência mistura coordenada de página com coordenada de viewport, o que desalinha o efeito quando a página está rolada. Não reproduzir esse defeito.

### Altura do contêiner externo
- Em repouso, a altura do contêiner é igual à altura do painel (68 px).
- Com o ponteiro sobre o painel, a altura vai para o **maior** valor entre a altura máxima configurada (padrão **256 px**) e 1,5 × o tamanho ampliado + 4 px.
- A transição usa a **mesma mola** dos itens. Ao sair, volta para a altura do painel.

### Rótulo
- Aparece quando o ponteiro entra no item ou quando ele recebe foco. Some quando o ponteiro sai ou o foco é perdido.
- **Entrada**: opacidade de 0 a 1 e subida de 0 a −10 px (translação vertical), em **0,2 s**.
- **Saída**: opacidade de 1 a 0 e retorno a 0 px de translação, em 0,2 s. O elemento só é removido do DOM depois que a animação de saída termina.

### Ativação
Clique no item, ou **Enter** / **Espaço** com o item focado (sem o comportamento padrão de rolar a página com Espaço), chama a ação do item.

### Foco por teclado
Cada item é focável por Tab, na ordem dos itens. O foco mostra o rótulo, mas **não amplia** o item, porque a ampliação depende só do ponteiro.

## Técnica de renderização em alto nível
Elementos DOM com tamanhos animados por **física de mola**: valores animados fora do ciclo de render do React, ligados diretamente ao estilo. Requer uma biblioteca de animação baseada em molas ou uma implementação própria de mola amortecida integrada por quadro. Também precisa de uma forma de animar a entrada e a saída do rótulo, mantendo o elemento montado até o fim do fade de saída. A cada mudança da posição do ponteiro, cada item mede o próprio retângulo para calcular a distância.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de itens, cada um com ícone (nó), rótulo (texto), ação de clique (função) e classe extra opcional | array | vazia |
| Classe extra do painel | string | vazia |
| Parâmetros da mola (massa, rigidez, amortecimento) | objeto | 0,1 / 150 / 12 |
| Tamanho máximo de um item ampliado | número (px) | 70 |
| Raio de influência horizontal do ponteiro | número (px) | 200 |
| Altura do painel | número (px) | 68 |
| Altura máxima reservada pelo contêiner quando ativo | número (px) | 256 |
| Tamanho base do item | número (px) | 50 |

## Demo
- Área de prévia com posicionamento relativo e **altura mínima de 400 px**, fundo escuro do site.
- No centro, o texto **"Try it out!"**, com 2rem, peso 600 e cor atenuada.
- O dock fica na parte de baixo da área (o painel é absoluto em relação a ela) com **4 itens**, cada um com ícone de 18 px em estilo de traço fino:
  1. casa — "Home";
  2. caixa de arquivo — "Archive";
  3. silhueta de usuário — "Profile";
  4. engrenagem — "Settings".
  - Cada item, ao ser ativado, abre um alerta do navegador com o próprio nome seguido de "!".
- Controles: altura do painel de 30 a 200 (passo 10); tamanho base de 20 a 60 (passo 10); ampliação de 50 a 100 (passo 10). Cada mudança remonta o componente.

## Acessibilidade e responsividade
- O painel tem papel de **barra de ferramentas**, com nome acessível "Application dock". Cada item tem papel de **botão**, é focável e usa o rótulo como nome acessível. O rótulo flutuante tem papel de *tooltip*.
- A referência marca cada item como abridor de popup, o que é incorreto se o item não abre menu. **Não reproduzir.**
- A referência remove o contorno de foco. **Recomendação**: fornecer um indicador visível em `:focus-visible` (por exemplo, anel de 2 px claro).
- Recomendação opcional: navegação por setas entre os itens (padrão *roving tabindex* de toolbar).
- Com `prefers-reduced-motion`, recomenda-se desativar a ampliação ou trocar a mola por mudança instantânea.
- Em telas de toque não há proximidade de ponteiro. Os itens continuam funcionando como botões no tamanho base.
- Larguras estreitas: o painel é limitado pela largura do contêiner (máximo 100%). Com muitos itens, considerar reduzir o tamanho base.
