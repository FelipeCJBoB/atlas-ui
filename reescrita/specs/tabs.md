# Especificação: Abas animadas (tabs)

## Propósito
Um conjunto de abas em formato de "pílula segmentada": uma barra arredondada com os rótulos, onde uma cápsula clara desliza com mola até a aba ativa. O conteúdo das abas fica numa faixa horizontal que desliza até o painel escolhido, com desfoque nos painéis inativos e ajuste suave de altura.

## Aparência
- **Raiz**: coluna flex com **8 px** de espaço entre a barra de abas e o conteúdo.
- **Barra de abas**:
  - flex em linha, largura ajustada ao conteúdo, altura de **36 px**;
  - padding de **3 px** e raio de **10 px**;
  - fundo `#f5f5f5` (claro) / `#262626` (escuro), com itens centralizados.
- **Cápsula da aba ativa**:
  - cobre exatamente a área da aba ativa, atrás do texto;
  - raio de **8 px**;
  - no claro: fundo branco `#ffffff`, borda transparente de 1 px e sombra pequena (`0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`);
  - no escuro: fundo `rgba(255,255,255,0.045)` e borda de 1 px `rgba(255,255,255,0.15)`, com a mesma sombra.
- **Aba**:
  - divide igualmente a largura (cada uma cresce para ocupar a fatia);
  - altura de 100% − 1 px, padding de 4 px × 8 px e raio de 8 px;
  - texto de **14 px**, peso 500, sem quebra; ícones internos de 16 px com 6 px de espaço;
  - cor atenuada (`#737373` / `#a1a1a1`) quando inativa e cor do texto (`#0a0a0a` / `#fafafa`) quando ativa, com **transição de cor de 500 ms ease-in-out**;
  - desabilitada: opacidade de 50% e sem interação.
- **Painéis**: sem estilo próprio além de remover o contorno de foco. O conteúdo vem do usuário.

## Comportamento
- **Aba inicial**: a definida como inicial; sem ela, a primeira aba registrada. Também pode ser controlado de fora (valor + aviso de mudança).
- **Ativação**: por **clique** (não por hover).
- **Cápsula**: desliza e se redimensiona da aba anterior até a nova com **mola** de rigidez **200** e amortecimento **25**. Na primeira renderização, aparece já no lugar, sem entrada animada.
- **Faixa de conteúdo**:
  - todos os painéis ficam lado a lado, cada um com 100% da largura, separados por um respiro de 8 px (4 px de cada lado, compensados por margem negativa);
  - a faixa translada para −(índice ativo × 100%) com **mola** de rigidez **300**, amortecimento **30** e sem quique.
- **Altura**: o contêiner da faixa anima a altura para a do painel ativo com a mesma mola 300/30. A altura é remedida quando o painel ativo ou o contêiner mudam de tamanho e é arredondada para o pixel físico. Na primeira exibição, usa a medição direta (sem animar de 0).
- **Desfoque**: o painel ativo fica nítido e os inativos ficam desfocados **4 px**, com transição por mola 200/25. Os inativos são **inertes** (não focáveis nem clicáveis), mas continuam no DOM.

## Técnica de renderização em alto nível
DOM com molas (`motion`): a cápsula é um único elemento absoluto atrás dos rótulos, que se move entre as abas por animação de layout compartilhada (ou por posição/largura medidas). Os painéis ficam numa faixa flex transladada em porcentagem. A altura do contêiner externo (com overflow oculto) é animada a partir de `ResizeObserver`. Um contexto compartilha a aba ativa entre a barra, os gatilhos e os painéis.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Aba inicial (não controlado) | string | primeira aba |
| Aba ativa (controlado) + aviso de mudança | string + função | — |
| Abas (valor, rótulo/nó, desabilitada) | lista/nós | — |
| Painéis (valor + conteúdo) | lista/nós | — |
| Mola da cápsula | rigidez/amortecimento | 200 / 25 |
| Mola da faixa e da altura | rigidez/amortecimento | 300 / 30 |
| Desfoque dos painéis inativos | px | 4 |
| Classes extras da barra, abas e painéis | strings | vazias |

## Demo
- Coluna centralizada com **largura total até 384 px**.
- Abas **"Account"** e **"Password"**; inicial: Account. A barra fica logo acima de um **cartão**:
  - fundo `#ffffff` (claro) / `#171717` (escuro), borda de 1 px na cor de borda e raio de 14 px;
  - sem sombra e sem padding vertical próprio;
  - o contêiner dos painéis dentro dele tem padding vertical de 24 px.
- Cada painel é uma coluna com 24 px entre as partes e padding horizontal de 24 px:
  - **título**: 16 px, peso 600, altura de linha 1;
  - **descrição**: 14 px, cor atenuada, 6 px abaixo do título;
  - **campos**: rótulo de 14 px, peso 500, e 12 px abaixo dele um campo de 40 px de altura, raio de 10 px, borda de 1 px `#e5e5e5` (escuro `rgba(255,255,255,0.15)` com fundo `rgba(255,255,255,0.045)`), padding horizontal de 12 px, texto de 14 px e sombra mínima; no foco, anel de 3 px `#a1a1a1` a 50%;
  - **botão**: 40 px de altura, padding horizontal de 16 px, raio de 10 px, fundo `#0a0a0a` com texto `#fafafa` no claro e o inverso no escuro, 14 px, peso 500; hover com 90% de opacidade do fundo.
- Painel **Account**:
  - título "Account";
  - descrição "Make changes to your account here. Click save when you're done.";
  - campo "Name" com valor inicial "Pedro Duarte";
  - botão "Save changes".
- Painel **Password**:
  - título "Password";
  - descrição "Change your password here. After saving, you'll be logged out.";
  - campos de senha "Current password" e "New password";
  - botão "Save password".
- O painel Password é mais alto, então a troca demonstra o ajuste de altura.

## Acessibilidade e responsividade
- Barra com papel de lista de abas, abas com papel de aba, `aria-selected` e `aria-controls`, e painéis com papel de painel de abas e `aria-labelledby`.
- Recomendação: setas esquerda/direita, Home/End e foco *roving* (só a aba ativa no Tab), com indicador de foco visível (anel de 3 px `#a1a1a1` a 50% e contorno de 1 px).
- Com `prefers-reduced-motion`, mudanças instantâneas, sem desfoque.
- A barra tem largura ajustada ao conteúdo e o conteúdo ocupa a largura do pai.

## Observações de fidelidade
- Recomendação: a referência não implementa navegação por teclado entre abas além do Tab nativo. Adicione-a conforme indicado.
- Recomendação: a referência associa painéis às abas pela ordem dos filhos para calcular o deslocamento. Garanta que a ordem dos painéis acompanhe a das abas, ou indexe pelo valor.
