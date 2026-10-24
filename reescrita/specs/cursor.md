# Especificação: Cursor personalizado com etiqueta (cursor)

## Propósito
Substitui o cursor do sistema, dentro de uma área (ou na página inteira), por uma seta desenhada e, opcionalmente, por uma etiqueta que segue o ponteiro com um pequeno atraso elástico, como o cursor nomeado de um colaborador em ferramentas de design ("Designer").

## Aparência
- **Seta**:
  - forma de seta de ponteiro clássica, com a ponta no canto superior esquerdo, inclinada, cantos arredondados e base côncava (a parte de trás tem um recorte suave em curva, como os cursores de apps de design);
  - preenchimento sólido na cor do texto do tema: `#0a0a0a` no claro e `#fafafa` no escuro;
  - caixa de **24 × 24 px**. Desenhe a seta em **SVG próprio** numa grade de 40 unidades: ponta perto de (2, 4), lateral longa descendo até perto de (8, 37), recorte côncavo central por volta de (15, 31)–(22, 27) e asa direita terminando perto de (31, 22), com todos os vértices arredondados.
- **Etiqueta**:
  - caixa com fundo na cor do texto do tema (`#0a0a0a` / `#fafafa`) e texto na cor do fundo (`#ffffff` / `#0a0a0a`);
  - raio de **8 px**, padding de **4 px × 8 px**, fonte de **14 px**;
  - largura ajustada ao conteúdo, sem quebra.
- A seta fica acima de tudo (z-index 9999) e a etiqueta logo abaixo dela (9998). Nenhuma das duas captura eventos de ponteiro.

## Comportamento
- **Escopo**:
  - **local** (padrão): a área é o **elemento pai** do componente. Se o pai estiver com posicionamento estático, ele passa a ser relativo, e as coordenadas são relativas ao canto superior esquerdo do pai;
  - **global**: a área é a janela inteira e o posicionamento é fixo, em coordenadas da viewport.
- **Ativação**: o primeiro movimento de ponteiro dentro da área ativa o cursor. Enquanto ativo, o cursor nativo é escondido na área e em todos os descendentes, com prioridade sobre outros estilos.
- **Desativação**:
  - modo local: quando o ponteiro sai do pai para um elemento fora dele (ou para fora da janela);
  - modo global: quando o ponteiro sai da janela ou a aba fica oculta.
  - Ao desativar, o cursor nativo volta.
- **Seta**: o canto superior esquerdo da caixa acompanha a posição do ponteiro **sem atraso**, de modo que a ponta desenhada coincide com o ponto real.
- **Etiqueta**: o alvo é calculado a partir do ponteiro, do tamanho da etiqueta e da metade do tamanho da seta (12 px; se a seta não estiver presente, 10 px). Ela persegue o alvo com **mola** de rigidez **500** e amortecimento **50**, sem quique, o que dá um atraso curto e firme.
  - Posição padrão: **abaixo e à direita**, com o canto superior esquerdo da etiqueta em (ponteiro.x + 5 + 12, ponteiro.y + 15 + 12).
  - Regras gerais, com d = distância lateral (padrão **15 px**), a = deslocamento de alinhamento (padrão **5 px**), L × A = tamanho da etiqueta e todas as posições referidas ao canto superior esquerdo da etiqueta:
    - lado **abaixo**: topo = y + d + 12;
    - lado **acima**: topo = y − A − d + 12;
    - nesses dois lados, alinhamento **fim**: esquerda = x + a + 12; **centro**: esquerda = x − L/2 + 12; **início**: esquerda = x − L − a + 12;
    - lado **direita**: esquerda = x + d + 12;
    - lado **esquerda**: esquerda = x − L − d + 12;
    - nesses dois lados, alinhamento **fim**: topo = y + a + 12; **centro**: topo = y − A/2 + 12; **início**: topo = y − A − a + 12.
- **Entrada/saída** de ambos: escala de 0 a 1 e opacidade de 0 a 1 ao ativar, e o inverso ao desativar. A escala usa uma mola viva (rigidez ~500, amortecimento ~25) e a opacidade, uma transição de ~0,3 s. Os elementos saem do DOM só depois da animação de saída.
- Seta e etiqueta podem ser usadas independentemente (só seta, só etiqueta ou ambas).

## Técnica de renderização em alto nível
DOM + posicionamento absoluto (local) ou fixo (global), com valores animados fora do ciclo de render (movimento do ponteiro → valor de posição; etiqueta → mola sobre esse valor). Ouvintes de `pointermove`/`pointerout` no pai ou na janela. Para esconder o cursor nativo, adicione uma classe ao elemento-alvo que aplique `cursor: none` a ele e aos descendentes (uma única regra de estilo injetada, compartilhada entre instâncias). Um contexto liga o provedor, a seta e a etiqueta.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Escopo global (janela inteira) em vez do pai | booleano | falso |
| Mostrar seta | booleano | verdadeiro |
| Conteúdo da etiqueta (vazio = sem etiqueta) | nó | — |
| Lado da etiqueta | cima/baixo/esquerda/direita | baixo |
| Distância lateral da etiqueta | px | 15 |
| Alinhamento da etiqueta | início/centro/fim | fim |
| Deslocamento de alinhamento | px | 5 |
| Mola da etiqueta | rigidez/amortecimento | 500 / 50 |
| Cor da seta e cores da etiqueta | cores CSS | tema (ver Aparência) |

## Demo
- Painel de **até 400 px de largura × 400 px de altura**, raio de 10 px, fundo `#f5f5f5` (claro) / `#262626` (escuro), centralizado no palco.
- No centro, o texto **"Move your mouse over the div"**, peso 500, itálico, cor atenuada (`#737373` / `#a1a1a1`).
- Componente em modo local dentro desse painel, com seta e etiqueta **"Designer"** (abaixo, fim, 15 px, 5 px).
- Para a captura com o cursor parado no centro, a seta e a etiqueta devem aparecer ali assim que houver qualquer movimento. Opcionalmente, ative-as já na montagem, no centro do painel, para que apareçam sem movimento.

## Acessibilidade e responsividade
- Elementos puramente decorativos: `aria-hidden` e nunca focáveis.
- Com `prefers-reduced-motion`, a etiqueta deve seguir sem mola (posição direta) e sem animação de escala.
- Em dispositivos sem ponteiro fino (`pointer: coarse`), não esconda o cursor nativo nem mostre o efeito.
- Não interfere em cliques nem em seleção de texto, porque não captura ponteiro.

## Observações de fidelidade
- A referência declara a intenção de centralizar seta e etiqueta no ponto (translação de −50%), mas o resultado visível é **ancorado no canto superior esquerdo**, porque a animação de escala sobrescreve essa translação. Reproduza o resultado visível descrito acima: ponta da seta no ponteiro e etiqueta abaixo à direita.
- Recomendação: a referência altera o estilo de posicionamento do pai sem restaurá-lo ao desmontar. Restaure o valor original na limpeza.
- Recomendação: a referência recalcula a posição com estado React a cada movimento (re-render por evento). Prefira valores animados fora do render.
