# Especificação: Ímã (magnet)

## Propósito
Envolve qualquer elemento (botão, link, cartão) e faz com que ele seja "atraído" pelo cursor quando o ponteiro chega perto. O elemento se desloca na direção do ponteiro, numa fração da distância, e volta suavemente ao lugar quando o ponteiro se afasta.

## Aparência
- **Invólucro externo**: bloco em linha com posicionamento relativo. Não altera a aparência do conteúdo e aceita uma classe extra.
- **Invólucro interno**: recebe a translação 3D, tem dica de composição para transformações e também aceita uma classe extra.
- O componente não define cores, bordas nem tamanhos. Toda a aparência vem do conteúdo filho.
- Outros atributos HTML passados ao componente são repassados ao invólucro externo.

## Comportamento
- **Escuta global**: movimentos do mouse em toda a janela.
- **Zona de ativação**: o retângulo do invólucro externo, expandido por uma margem (padrão **100 px**) em todos os lados. O teste é feito eixo a eixo: o ponteiro está dentro quando a distância horizontal até o centro é menor que metade da largura + margem e a distância vertical até o centro é menor que metade da altura + margem.
- **Dentro da zona**: o deslocamento do conteúdo é (posição do ponteiro − centro do elemento) ÷ força, nos dois eixos. Força padrão: **2**, ou seja, o conteúdo anda metade da distância até o cursor. Valores maiores dão atração mais fraca.
- **Fora da zona**: deslocamento (0, 0).
- **Transições**: o deslocamento é aplicado por transição CSS de transformação:
  - dentro da zona: **0,3 s ease-out**, respondendo rápido ao movimento;
  - fora da zona: **0,5 s ease-in-out**, retornando devagar.
  - Ambas são configuráveis como string de transição CSS.
- **Desativado**: quando a opção de desativar está ligada, o deslocamento é zerado e o componente para de escutar o mouse.
- O centro é medido no invólucro externo, que não se move. Por isso a medida não sofre realimentação do próprio deslocamento.

## Técnica de renderização em alto nível
DOM e CSS. Um ouvinte de movimento do mouse na janela mede o retângulo do invólucro e calcula o deslocamento, que é aplicado como `translate3d` no invólucro interno. A suavização fica inteiramente com a transição CSS. A referência guarda a posição em estado do React, o que re-renderiza a cada movimento. Escrever o estilo diretamente por referência é aceitável e mais eficiente, desde que o resultado visual seja o mesmo.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo envolvido | nós React | — |
| Margem extra da zona de ativação | número (px) | 100 |
| Desativar o efeito | booleano | falso |
| Força (divisor do deslocamento) | número | 2 |
| Transição enquanto atraído | string de transição CSS | `transform 0.3s ease-out` |
| Transição de retorno | string de transição CSS | `transform 0.5s ease-in-out` |
| Classe extra do invólucro externo | string | vazia |
| Classe extra do invólucro interno | string | vazia |

## Demo
- Área de prévia com **altura mínima de 400 px**, conteúdo centralizado e fundo escuro do site.
- Margem efetiva da demo: **metade** do valor do controle, com arredondamento para baixo. Com o valor padrão 100 do controle, a margem é 50 px.
- Conteúdo: um link externo que abre em nova aba e contém uma caixa flex com:
  - texto "Hover This", em fonte de 1,125rem na cor primária do texto;
  - borda de 1 px na cor de borda do tema;
  - raio de **15 px**;
  - padding de 1rem;
  - itens centralizados e espaçamento de 0,5rem.
- Controles: chave "desativado"; margem de 0 a 300 (passo 10); força de 1 a 10 (passo 1). As mudanças são aplicadas ao vivo, sem remontar.

## Acessibilidade e responsividade
- O efeito é só visual e não altera foco nem semântica do conteúdo.
- **Recomendação**: com `prefers-reduced-motion`, desativar o deslocamento.
- **Recomendação**: ignorar ponteiros de toque, ou usar eventos de ponteiro filtrando por mouse, para não deixar o elemento deslocado após um toque.
- Funciona em qualquer tamanho, porque mede o elemento a cada movimento.

## Observações de fidelidade
- Se o ponteiro sai da janela enquanto está dentro da zona, nenhum evento chega e o elemento **fica deslocado**. **Recomendação**: zerar o deslocamento ao sair do documento (por exemplo, no evento de saída do ponteiro da janela).
- O conteúdo deslocado pode acabar fora da área de clique original. Isso é esperado.
