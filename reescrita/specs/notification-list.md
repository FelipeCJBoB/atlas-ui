# Especificação: Lista de notificações empilhada (notification-list)

## Propósito

Um pequeno painel de notificações em que os cartões ficam empilhados como um baralho (só a borda dos de trás aparece embaixo do primeiro). Ao passar o ponteiro sobre o painel, a pilha se abre numa lista com os cartões lado a lado na vertical, e o rodapé troca "Notifications" por "View all ↗".

## Aparência

### Painel

- Largura **320 px**, padding de **12 px**, cantos de **24 px**, 12 px de espaço vertical entre a pilha e o rodapé.
- Fundo **`#e5e5e5`** (claro) / **`#171717`** (escuro).
- Sombra média: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.

### Cartão

- Fundo **`#f5f5f5`** (claro) / **`#262626`** (escuro), cantos de **14 px**, padding 16 px × 8 px, posicionamento relativo.
- Sombra pequena `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`; no hover do **cartão**, sombra grande `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`, com transição de 200 ms.
- Ordem de sobreposição: o primeiro cartão fica por cima (camada 3), o segundo abaixo (2), o terceiro mais abaixo (1).
- Altura resultante de cada cartão: ~52 px (8 + 20 + 16 + 8).
- **Linha 1** (itens distribuídos nas pontas, centralizados): título em 14 px peso 500, cor do texto (`#0a0a0a` / `#fafafa`); à direita, opcionalmente, um contador: ícone de "seta circular de repetir" (girando no sentido anti-horário) de 12 px + número, 12 px peso 500, 2 px entre eles, cor `#737373` (claro) / `#d4d4d4` (escuro).
- **Linha 2**: 12 px, peso 500, cor `#737373` nos dois temas: "tempo • subtítulo" (com espaços não quebráveis ao redor do ponto).

### Rodapé

- Linha com 8 px entre itens, centralizada na vertical:
  - **selo**: círculo de 20 px, fundo `#a1a1a1`, número de notificações em branco, 12 px peso 500;
  - **texto alternável**: dois textos sobrepostos na mesma célula, 14 px peso 500, cor `#525252` (claro) / `#d4d4d4` (escuro):
    - "Notifications";
    - "View all" + ícone de seta diagonal para cima-direita de 16 px, 4 px entre eles, cursor de ponteiro, não selecionável.

## Comportamento

### Estados do painel

O painel inteiro tem dois estados: **recolhido** (inicial) e **expandido** (enquanto o ponteiro está sobre o painel). O estado se propaga para cartões e rodapé.

| Elemento | Recolhido | Expandido |
|---|---|---|
| Cartão 1 | margem superior 0, largura 100% | margem superior 0, largura 100% |
| Cartão 2 | margem superior **−44 px**, escala horizontal **0,95** | margem superior **4 px**, escala horizontal 1 |
| Cartão 3 | margem superior **−44 px**, escala horizontal **0,90** | margem superior **4 px**, escala horizontal 1 |
| "Notifications" | opacidade 1, deslocamento 0 | opacidade 0, sobe 16 px, sem eventos de ponteiro |
| "View all ↗" | opacidade 0, 16 px abaixo, sem eventos de ponteiro | opacidade 1, deslocamento 0 |

- Recolhido: cada cartão de trás fica 44 px "para dentro" do anterior, deixando uma faixa de **8 px** visível abaixo dele, e é um pouco mais estreito (escala horizontal a partir do centro), formando a pilha. Altura total da pilha ≈ 68 px; expandida ≈ 164 px. O painel cresce/encolhe junto.
- **Cartões**: mola de rigidez **300**, amortecimento **26**, massa 1 (rápida, leve assentamento).
- **Textos do rodapé**: tween de **0,22 s** com aceleração e desaceleração (ease-in-out), cruzando-se verticalmente (um sobe e some enquanto o outro sobe e aparece).
- A escala horizontal também comprime horizontalmente o texto dos cartões de trás (efeito aceito).

## Técnica de renderização em alto nível

- DOM/CSS com animação por estados nomeados propagados do painel aos filhos (recolhido/expandido), molas para margem e escala horizontal, tween para os textos.
- A sobreposição vem de margem superior negativa animada + ordem de camadas explícita.
- Os dois textos do rodapé ocupam a mesma célula de uma grade (sobrepostos sem posicionamento absoluto).

## Parâmetros configuráveis

A referência não tem parâmetros (dados fixos). Recomenda-se expor:

| Significado | Tipo | Padrão |
|---|---|---|
| Lista de notificações (título, subtítulo, tempo, contador opcional) | lista | 3 itens da demo |
| Texto do rodapé e do "ver tudo" + ação | strings / função | "Notifications" / "View all" |
| Faixa visível de cada cartão empilhado (px) e redução de largura por nível | números | 8 px / 5% |

## Demo

- O painel centralizado na área de prévia, fundo do tema. Sem controles.
- Notificações:
  1. "NPM Install Complete" — "1,227 packages added!" — tempo "just now" — contador **2**;
  2. "Build Succeeded" — "Build finished in 12.34s" — tempo "1m 11s";
  3. "Lint Passed" — "No problems found" — tempo "5m".
- Selo do rodapé: **3**.
- Com o cursor parado no centro da área, o painel deve estar expandido.

## Acessibilidade e responsividade

- Recomendação: expandir também com foco dentro do painel (teclado) e com toque (alternar ao tocar), já que em telas de toque não há hover.
- Recomendação: "View all" deve ser um link ou botão focável de verdade; hoje é texto clicável sem ação.
- Recomendação: os títulos dos cartões usam o nível de cabeçalho mais alto da página; usar texto comum ou um nível adequado, e expor a lista como lista.
- Movimento reduzido: recomendação — trocar estados sem mola.
- Largura fixa de 320 px; em telas muito estreitas, limitar a 100% do pai.

## Observações de fidelidade

- **Recomendação — contador zero**: na referência, um contador 0 faria aparecer um "0" solto; mostrar o contador só quando existir.
- A escala horizontal dos cartões de trás distorce o texto deles; é o comportamento da referência e pode ser mantido.
