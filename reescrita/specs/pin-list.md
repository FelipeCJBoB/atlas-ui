# Especificação: Lista com fixação animada (pin-list)

## Propósito
Uma lista de cartões dividida em duas seções: itens **fixados** (no topo) e **todos os itens** (abaixo, com um rótulo de seção). Clicar em um cartão o move para a outra seção, e ele desliza fisicamente até a nova posição com uma mola, enquanto os demais cartões se reacomodam. Serve para listas de favoritos, atalhos e locais "pinados".

## Aparência
- **Contêiner raiz**: bloco que ocupa a largura do pai, com **40 px** de espaço vertical entre a seção de fixados e a seção de todos os itens.
- **Seção** (cada uma): coluna de cartões com **12 px** de espaço vertical entre eles, posicionamento relativo e camada (z-index) própria (ver Comportamento).
- **Rótulo da seção "todos"**: parágrafo com padding horizontal de **12 px**, margem inferior de **8 px**, fonte de **14 px**, peso 500. Cor `#737373` no tema claro e `#d4d4d4` no tema escuro. Texto padrão: **"All Items"**. A seção de fixados **não** exibe rótulo na referência (ver Observações).
- **Cartão**:
  - linha flex com itens centralizados verticalmente e conteúdo distribuído entre as pontas (esquerda: ícone + textos; direita: botão de alfinete), com **20 px** de espaço mínimo entre os dois blocos;
  - padding de **8 px**;
  - raio de **16 px**;
  - fundo `#e5e5e5` no tema claro e `#262626` no tema escuro;
  - sem borda e sem sombra; cursor padrão (recomendado: ponteiro, ver Observações).
- **Bloco esquerdo**: linha com **8 px** de espaço entre a "pastilha" do ícone e os textos.
  - **Pastilha do ícone**: quadrado com padding de 8 px, raio de **8 px** e fundo igual ao fundo da página (branco no claro, quase preto ~`#0a0a0a` no escuro). Dentro, um ícone de traço de **20 px** na cor `#737373` (claro) ou `#a3a3a3` (escuro).
  - **Título**: 14 px, peso 600, cor do texto principal.
  - **Linha de informação**: 12 px, peso 500, cor `#737373` (claro) ou `#a3a3a3` (escuro).
- **Botão de alfinete (lado direito)**: círculo de **32 px**, conteúdo centralizado, fundo `#a3a3a3` (claro) ou `#525252` (escuro). Dentro, um ícone de alfinete de **16 px** em branco.
  - Em itens **fixados**, o alfinete é **preenchido** de branco e está sempre visível.
  - Em itens **não fixados**, o alfinete é só contorno branco e o círculo inteiro fica com **opacidade 0**, aparecendo (opacidade 1) quando o ponteiro está sobre o cartão, com transição de opacidade de **250 ms**.

## Comportamento
- **Estado**: a lista é copiada para um estado interno na montagem. A partir daí, a ordem e o status de cada item são controlados internamente (mudanças posteriores na lista recebida não são refletidas — ver Observações).
- **Partição**: a seção de fixados mostra, na ordem do estado, os itens marcados como fixados; a seção "todos" mostra os demais.
- **Clique em um cartão** (o cartão inteiro é a área de clique) alterna o status do item:
  - um item **fixado** que é desafixado vai para o **início** da seção "todos";
  - um item **não fixado** que é fixado vai para o **final** da seção de fixados.
- **Animação de troca**: cada cartão tem uma identidade visual estável compartilhada entre as duas seções. Quando ele muda de seção ou de posição, a nova posição é medida e o cartão desliza da posição antiga até a nova (técnica de animação de layout, estilo FLIP), com **mola**: rigidez **320**, amortecimento **20** e massa **0,8** (mola rápida, com um pequeno overshoot). Os outros cartões que mudam de lugar também deslizam com a mesma mola.
- **Camadas durante a troca**: no instante do clique, a seção de **origem** do cartão recebe camada mais baixa (z = 5) e a outra fica em z = 10. Assim, o cartão em trânsito, que já pertence à seção de destino, passa **por cima** dos cartões da seção de origem. Após **500 ms** (configurável), ambas as seções voltam a z = 10. Esse tempo deve ser compatível com a duração da mola.
- **Rótulo "todos"**: existe só quando há ao menos um item não fixado.
  - Entra com opacidade de 0 a 1 e sai de 1 a 0, em **0,22 s** com easing ease-in-out.
  - O elemento permanece montado até o fim do fade de saída.
  - Também participa da animação de layout, deslizando quando a seção de cima muda de altura.
- **Seções vazias**: se não houver fixados, a seção de fixados não é renderizada (o espaço de 40 px entre seções continua existindo entre os blocos-pai). Se não houver não fixados, a seção "todos" e o rótulo somem.
- **Cliques rápidos**: cada clique agenda a própria restauração de camadas; não há bloqueio durante a animação.

## Técnica de renderização em alto nível
DOM puro com animação de layout compartilhado: cada cartão é identificado por um identificador estável (derivado do id do item) e, ao ser re-renderizado em outra posição ou outra seção, é animado da caixa anterior para a nova por transformações (translação e escala) dirigidas por mola. Precisa de uma biblioteca de animação com suporte a animação de layout entre listas irmãs (grupo de layout compartilhado) e a presença de saída (manter montado até o fim do fade), ou de uma implementação própria de FLIP com mola amortecida.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens: id numérico, título, linha de informação, componente de ícone, flag de fixado | array | obrigatório |
| Textos dos rótulos de seção (fixados / todos) | objeto de strings | "Pinned Items" / "All Items" |
| Mola da troca de posição | objeto de transição | rigidez 320, amortecimento 20, massa 0,8 |
| Animação do rótulo de seção (entrada, saída, duração, easing) | objeto | opacidade 0→1→0, 0,22 s, ease-in-out |
| Classe extra do contêiner raiz | string | vazia |
| Classe extra do rótulo | string | vazia |
| Classe extra da seção de fixados | string | vazia |
| Classe extra da seção "todos" | string | vazia |
| Tempo até restaurar as camadas das seções | número (ms) | 500 |
| Demais atributos repassados ao contêiner raiz | — | — |

## Demo
- Componente centralizado na área de prévia do site (fundo do tema), com largura sugerida de **~340–380 px**.
- **5 itens**, os dois primeiros fixados:
  1. "Commit Zone" — "Code updates · Closes 9:00 PM" — ícone de commit (círculo atravessado por uma linha horizontal) — fixado;
  2. "404 Room" — "Fixing errors · Open 24 hours" — ícone de triângulo de alerta — fixado;
  3. "NPM Stop" — "Install stuff · Closes 8:00 PM" — ícone de caixa/cubo;
  4. "Token Lock" — "Login stuff · Open 24 hours" — ícone de chave;
  5. "Regex Zone" — "Find words · Closes 9:00 PM" — ícone de expressão regular (asterisco com ponto).
- Ícones de traço fino (estilo linha, 2 px). Desenhar com SVG próprio. Não depender de um pacote de ícones específico.

## Acessibilidade e responsividade
- A referência usa `div`s clicáveis, sem papel de botão, sem foco por teclado e sem indicação de estado. **Recomendação**: renderizar cada cartão como botão (ou dar a ele papel de botão e torná-lo focável), ativável por Enter/Espaço, com `aria-pressed` refletindo "fixado" e nome acessível do tipo "Fixar Commit Zone" / "Desafixar Commit Zone".
- O alfinete de itens não fixados só aparece no hover. **Recomendação**: também mostrá-lo em `:focus-visible` e, em telas de toque (sem hover), mantê-lo visível com opacidade reduzida.
- Usar listas semânticas (`ul`/`li`) por seção e títulos de seção legíveis por leitor de tela.
- Com `prefers-reduced-motion`, trocar a mola por mudança instantânea ou por um fade curto.
- Responsivo: os cartões ocupam a largura do contêiner. Textos longos devem truncar com reticências em vez de empurrar o alfinete.

## Observações de fidelidade
- O texto do rótulo de fixados é configurável, mas **nunca é exibido** na referência. Recomendação: exibir o rótulo também acima da seção de fixados (mesmo estilo do rótulo "todos"), ou remover essa opção.
- A lista recebida só é lida na montagem. Recomendação: sincronizar com mudanças externas (ou oferecer um modo controlado com callback de alteração).
- Não há callback avisando que um item foi fixado ou desafixado. Recomendação: expor um evento de mudança.
- O cursor não muda sobre o cartão. Recomendação: cursor de ponteiro.
