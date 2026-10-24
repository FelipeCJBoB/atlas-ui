# Especificação: Borda estelar (star-border)

## Propósito
Um botão (ou outro elemento) em forma de pílula cuja borda fina tem dois pontos de luz que deslizam continuamente: um ao longo da borda inferior, da direita para a esquerda, e outro ao longo da borda superior, da esquerda para a direita, sumindo no caminho. Dá a impressão de uma "estrela" percorrendo o contorno.

## Aparência
- **Invólucro externo** (por padrão um botão, mas o tipo de elemento é configurável):
  - bloco em linha, posicionamento relativo, **raio de 20 px**, overflow oculto (recorta os brilhos);
  - **padding vertical igual à espessura** (padrão **1 px**) e 0 na horizontal. Essa faixa de 1 px em cima e embaixo é a "borda" por onde a luz aparece;
  - aceita classe extra e demais atributos (eventos, tipo, etc.).
- **Brilho inferior**:
  - camada absoluta com **300% da largura** do invólucro e **50% da altura**, ancorada a **−12 px do fundo** e com o lado direito a **−250%** (ou seja, começa quase toda à direita, fora da caixa, com só a ponta esquerda visível);
  - fundo em **gradiente radial circular** da cor configurada (padrão **branco**) no centro até transparente a **10%** do raio, o que produz um ponto de luz pequeno e intenso no meio de uma elipse grande;
  - raio de 50% e opacidade-base de **0,7**; fica atrás do conteúdo.
- **Brilho superior**: igual, mas ancorado a **−12 px do topo** e com o lado esquerdo a **−250%**.
- **Superfície interna** (por cima dos brilhos):
  - posicionamento relativo, **borda de 1 px** na cor de borda (padrão **`#222222`**), fundo na cor de fundo (padrão **`#000000`**), texto na cor de texto (padrão **`#ffffff`**);
  - fonte de **16 px**, centralizada, padding de **16 px × 26 px**, raio de 20 px.
  - Como a superfície é opaca e cobre tudo menos a faixa de padding do invólucro, os brilhos só aparecem como uma linha luminosa em cima e embaixo, misturada à borda.

## Comportamento
- **Animação contínua**, linear, infinita e **alternada** (vai e volta), com duração configurável (padrão **6 s** por trecho):
  - **Brilho inferior**: transla de 0 a −100% da própria largura na horizontal (desliza para a esquerda, atravessando a borda inferior). Ao mesmo tempo, a opacidade da animação vai de 1 a 0.
  - **Brilho superior**: transla de 0 a +100% (desliza para a direita pela borda superior), com opacidade de 1 a 0.
  - Na volta (direção alternada) o movimento se inverte e o brilho reaparece gradualmente.
- Os dois brilhos usam a mesma duração e começam juntos, então se movem em sentidos opostos, simetricamente.
- Não há estado de hover, foco ou clique próprio (o comportamento é o do elemento nativo escolhido).

## Técnica de renderização em alto nível
Somente DOM e CSS: duas camadas absolutas com gradiente radial animadas por quadros-chave CSS (translação horizontal + opacidade), recortadas pelo overflow oculto e pelo raio do invólucro, sob uma superfície opaca com padding interno. A espessura é o padding vertical do invólucro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Tipo de elemento do invólucro | tag ou componente | botão |
| Classe extra | string | vazia |
| Cor da luz | cor CSS | `white` |
| Duração de cada trecho da animação | duração CSS (string) | `6s` |
| Espessura da faixa luminosa | número (px) | 1 |
| Cor de fundo da superfície | cor CSS | `#000000` |
| Cor do texto | cor CSS | `#ffffff` |
| Cor da borda estática | cor CSS | `#222222` |
| Conteúdo | nós React | — |
| Demais atributos (repassados ao invólucro) | — | — |

## Demo
- Área de prévia com **400 px de altura**, conteúdo centralizado, fundo do site.
- Um único componente com o texto **"Star Border"** (1em) dentro.
- Valores da demo: cor **`magenta`**, espessura **1 px**, duração **5 s**.
- Cores dependem do tema: escuro → fundo `#000000`, texto `#ffffff`, borda `#222222`; claro → fundo `#ffffff`, texto `#18181b`, borda `#e4e4e7`.
- Controles: seletor de cor (Magenta, Cyan, White); espessura 0,5–8 px (passo 0,5); duração 1–10 s (passo 0,5).

## Acessibilidade e responsividade
- Por padrão é um botão nativo: focável, ativado por Enter/Espaço. **Recomendação**: definir `type="button"` por padrão quando for botão, para não submeter formulários sem querer.
- **Recomendação**: anel de foco visível (`:focus-visible`) no invólucro, já que o overflow oculto pode recortar contornos; usar contorno com deslocamento negativo ou sombra interna.
- **Recomendação**: com `prefers-reduced-motion: reduce`, pausar a animação (deixando a borda estática).
- Largura acompanha o conteúdo; funciona em qualquer tamanho.

## Observações de fidelidade
- **Defeito a corrigir (recomendação)**: na referência, se o usuário passar um estilo próprio, ele substitui o estilo calculado e a espessura deixa de ser aplicada. Mesclar o estilo do usuário ao padding calculado.
- **Recomendação**: os brilhos são puramente decorativos; marcá-los com `aria-hidden`.
- A opacidade-base de 0,7 multiplica a opacidade animada (o pico efetivo é 0,7).
