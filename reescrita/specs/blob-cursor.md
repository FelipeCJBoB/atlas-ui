# Especificação: Cursor de bolhas líquidas (blob-cursor)

## Propósito
Uma camada que segue o ponteiro com um pequeno grupo de bolhas. A bolha líder acompanha o cursor quase instantaneamente, e as demais vêm atrás com atraso. Um filtro "gooey" funde as bolhas em uma massa líquida contínua, que se estica e se separa conforme o movimento. É um efeito decorativo de cursor para seções de destaque.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai, com camada (z-index) configurável (padrão **100**).
- **Palco das bolhas**:
  - camada absoluta de 100% × 100%, com overflow oculto e fundo transparente;
  - não captura ponteiro e não permite seleção;
  - recebe o **filtro gooey** (ver Técnica).
- **Bolhas**: N bolhas (padrão **3**), absolutas e centradas no próprio ponto, deslocadas −50% em X e em Y.
  - **Lados**: 60 px, 125 px e 75 px. A primeira é a líder.
  - **Forma**: círculo (padrão) ou quadrado, sem raio.
  - **Preenchimento**: **`#5227FF`** (violeta).
  - **Opacidade**: **0,6** em cada bolha.
  - **Sombra**: deslocamento de **10 px, 10 px**, desfoque de **5 px** e cor **`rgba(0,0,0,0.75)`**.
  - **Ponto interno**: quadrado ou círculo centralizado em cada bolha, com lados de **20, 35 e 25 px** e cor **`rgba(255,255,255,0.8)`**.
- **Resultado visual com o filtro**:
  - o desfoque forte seguido do limiar de alfa transforma as bolhas em **uma única forma orgânica** de bordas nítidas, que se une quando as bolhas estão próximas e forma "pontes" que se esticam e se rompem quando se afastam;
  - as cores internas continuam desfocadas: o miolo branco vira um **brilho suave** dentro do violeta;
  - a sombra preta vira uma **segunda massa escura** deslocada para baixo e para a direita, mesclada à violeta como um volume sombreado.
- **Sem o filtro** (opção desligada): aparecem círculos translúcidos simples sobrepostos, cada um com sua sombra e seu ponto interno.

## Comportamento
- **Posição inicial**: todas as bolhas começam no canto superior esquerdo (0, 0) do contêiner, onde só um quarto de cada uma fica visível.
- **Movimento do ponteiro** (mouse) ou do toque (primeiro dedo) **sobre o contêiner**:
  - a posição é convertida para coordenadas locais (cliente − canto do contêiner);
  - para cada bolha, inicia-se uma animação de posição até esse ponto, substituindo a anterior:
    - **líder**: duração de **0,1 s**, com easing cúbico de desaceleração (1 − (1 − t)³);
    - **seguidoras**: duração de **0,5 s**, com easing quadrático de desaceleração (1 − (1 − t)²).
  - O efeito resultante é uma cauda elástica que alcança o cursor quando ele para.
- **Saída do ponteiro**: as bolhas ficam paradas na última posição.
- **Redimensionamento da janela**: o canto do contêiner é recalculado a cada movimento, então sempre fica correto.
- Todas as seguidoras usam a mesma duração e a mesma curva, então se movem juntas, sobrepostas e concêntricas. A sensação de cauda vem da diferença entre líder e seguidoras.

## Técnica de renderização em alto nível
DOM + **filtro SVG** aplicado ao palco:
1. **desfoque gaussiano** do gráfico de origem, com desvio-padrão de **30**;
2. **matriz de cor** que mantém R, G e B e remapeia o alfa como α' = 35 × α − 10. É um **limiar de alfa**: a borda desfocada vira contorno nítido, e regiões próximas se fundem (técnica clássica de "metaballs"/gooey em CSS).

As posições são animadas por tweens com easing (biblioteca de tweens ou interpolação própria por `requestAnimationFrame`), aplicadas como translação. O filtro deve ter identificador único por instância.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Forma das bolhas | `círculo` / `quadrado` | círculo |
| Cor de preenchimento | string de cor | `#5227FF` |
| Quantidade de bolhas | inteiro | 3 |
| Lados das bolhas (por índice) | array de números (px) | [60, 125, 75] |
| Lados dos pontos internos (por índice) | array de números (px) | [20, 35, 25] |
| Cor dos pontos internos | string de cor | `rgba(255,255,255,0.8)` |
| Opacidades (por índice) | array de números | [0,6, 0,6, 0,6] |
| Cor da sombra | string de cor | `rgba(0,0,0,0.75)` |
| Desfoque da sombra | número (px) | 5 |
| Deslocamento X da sombra | número (px) | 10 |
| Deslocamento Y da sombra | número (px) | 10 |
| Identificador do filtro | string | "blob" |
| Desvio-padrão do desfoque do filtro | número | 30 |
| Matriz de cor do filtro (20 valores) | string | identidade de RGB e alfa × 35 − 10 |
| Usar filtro gooey | booleano | verdadeiro |
| Duração da líder | número (s) | 0,1 |
| Duração das seguidoras | número (s) | 0,5 |
| Easing da líder | curva | cúbica de desaceleração |
| Easing das seguidoras | curva | quadrática de desaceleração |
| Camada (z-index) | inteiro | 100 |

## Demo
- Área de prévia com **600 px de altura**, posicionamento relativo, overflow oculto e fundo do site. O componente ocupa a área inteira, sem texto.
- Controles:
  - cor de preenchimento, cor interna e cor da sombra;
  - forma;
  - quantidade de 1 a 5. Ao aumentar, os arrays herdam o último valor existente (ou 60 / 20 / 0,6);
  - lado da líder de 10 a 200;
  - ponto interno da líder de 1 a 100;
  - opacidade da líder de 0,1 a 1 (passo 0,05);
  - desfoque da sombra de 0 a 50;
  - deslocamento da sombra de −50 a 50 (em X e em Y);
  - duração da líder de 0,01 a 2 s;
  - duração das seguidoras de 0,01 a 3 s;
  - z-index de 0 a 1000 (passo 10).
- Nota exibida na demo: filtros SVG não são totalmente suportados no Safari e o desempenho pode variar.

## Acessibilidade e responsividade
- Decorativo: marcar a camada como `aria-hidden`. Ela não deve capturar foco.
- O contêiner recebe os eventos de movimento. Se ele estiver por cima de conteúdo interativo, bloqueará cliques. **Recomendação**: colocá-lo atrás do conteúdo, ou ouvir o movimento no pai e deixar a camada inteira sem captura de ponteiro.
- Com `prefers-reduced-motion`, desativar o efeito ou mostrar só a líder sem cauda.
- O filtro com desfoque de 30 em áreas grandes é caro. Considerar limitar o tamanho do palco ou reduzir o desvio em telas pequenas.

## Observações de fidelidade
- O identificador fixo do filtro faz instâncias múltiplas na mesma página compartilharem ou colidirem com o mesmo filtro. Recomendação: gerar um identificador único por instância.
- Antes do primeiro movimento, as bolhas aparecem cortadas no canto superior esquerdo. Recomendação opcional: escondê-las (opacidade 0) até o primeiro movimento, ou iniciá-las no centro.
- O tamanho das bolhas é lido do array pelo índice. Se a quantidade for maior que o tamanho dos arrays, as bolhas extras ficam sem dimensão. Recomendação: usar o último valor do array como fallback.
