# Especificação: Botão Líquido (liquid-button)

## Propósito

Um botão cujo fundo se "enche" de cor quando o ponteiro passa por cima. Primeiro, uma linha fina corre pela base do botão da esquerda para a direita. Depois essa linha sobe e preenche o botão inteiro, como um líquido. O botão também aumenta levemente no hover e encolhe ao ser pressionado. Ao sair, a sequência se desfaz na ordem inversa.

## Aparência

### Base comum a todas as variantes

- **Layout**
  - Elemento em linha, flexível, com conteúdo centralizado nos dois eixos.
  - Espaço de 8 px entre ícone e texto.
  - O texto não quebra linha e o botão não encolhe.
- **Tipografia**: 14 px, peso 500 (médio).
- **Forma e sombra**
  - Cantos arredondados no raio "médio" do tema, cerca de 6 a 8 px. Num tema com raio base de 10 px, use raio base − 2 px.
  - Sombra extra-sutil, equivalente a `0 1px 2px 0 rgb(0 0 0 / 0.05)`.
- **Ícones SVG internos**
  - 16 × 16 px quando não têm tamanho próprio.
  - Não encolhem e não capturam eventos de ponteiro.
- **Contorno**: nenhum contorno nativo.
- **Foco visível pelo teclado**
  - A borda assume a cor de "anel" (ring) do tema.
  - Surge um anel externo de 3 px nessa mesma cor, com 50% de opacidade.
- **Estado inválido** (marcado como inválido para acessibilidade)
  - Borda na cor "destrutiva" do tema.
  - Anel destrutivo com 20% de opacidade no tema claro e 40% no escuro.
- **Desabilitado**: 50% de opacidade e nenhum evento de ponteiro.
- **Transições de cor**: as cores de sombra, borda, contorno, preenchimento e traço também têm transição curta, independente do efeito líquido.

### Camadas de cor

O botão tem três cores que interagem:

1. **Cor de repouso do fundo**: a cor sólida de fundo do botão.
2. **Cor do líquido**: a cor que preenche o botão.
3. **Cor do texto**: muda quando o líquido termina de subir.

### Variantes

Tokens de tema no estilo shadcn, com valores aproximados no tema neutro:

| Variante | Fundo em repouso | Cor do líquido | Texto em repouso | Texto com líquido |
|---|---|---|---|---|
| Padrão | "accent" (claro `#f5f5f5` / escuro `#262626`) | "primary" (claro `#171717` / escuro `#e5e5e5`) | "primary" | "primary-foreground" (claro `#fafafa` / escuro `#171717`) |
| Destrutivo | "accent" | "destructive" (≈ `#e7000b`) | branco | branco |
| Secundário | "accent" | "secondary" (≈ `#f5f5f5` / `#262626`) | "secondary" | "secondary-foreground" |
| Fantasma | transparente | "primary" | "primary" | "primary-foreground" |

Na variante destrutiva, o anel de foco usa a cor destrutiva com 20% de opacidade (40% no escuro).

Observação de fidelidade: na variante secundária, o texto em repouso tem a mesma cor do fundo de repouso, então fica quase invisível até o hover. É assim na referência. Não é preciso "corrigir" para reproduzir fielmente.

### Tamanhos

| Tamanho | Altura | Padding horizontal | Padding horizontal se tiver ícone como filho direto | Extras |
|---|---|---|---|---|
| Padrão | 36 px | 16 px (vertical 8 px) | 12 px | |
| Pequeno | 32 px | 12 px | 10 px | espaço interno de 6 px |
| Grande | 40 px | 24 px | 16 px | |
| Ícone | 36 × 36 px | | | quadrado |
| Ícone pequeno | 32 × 32 px | | | quadrado |
| Ícone grande | 40 × 40 px | | | quadrado |

### Estado inicial do líquido

- O líquido é uma faixa sólida de 3 px de altura, presa à base do botão.
- Fica posicionada totalmente fora da área visível, logo à esquerda do botão. Por isso não se vê nada em repouso.

## Comportamento

Sejam T a duração-base (padrão 0,3 s), E a escala de hover (padrão 1,05) e P a escala de pressão (padrão 0,95).

### Entrada do ponteiro (hover)

| Intervalo | O que acontece |
|---|---|
| 0 a T | A faixa de 3 px na base desliza da esquerda até cobrir toda a largura. A borda direita do colorido avança da esquerda para a direita. |
| T a 2T | A faixa cresce de 3 px até 100% da altura do botão e preenche tudo. Ao mesmo tempo, o texto muda para a cor "com líquido". |

- Simultaneamente, o botão escala de 1 para E com uma mola rápida, levemente sub-amortecida (rigidez ≈ 500, amortecimento ≈ 25), o que dá um pequeno "pulo".
- A curva das transições de fundo e de texto é a curva padrão do navegador ("ease").

### Saída do ponteiro

A ordem é invertida:

| Intervalo | O que acontece |
|---|---|
| 0 a T | O líquido baixa da altura total até a faixa de 3 px. |
| T a 2T | A faixa recua horizontalmente: a borda direita volta da direita para a esquerda até sair pela esquerda. |

- O texto volta à cor de repouso com atraso de T, durante T.
- A escala volta a 1 com a mesma mola.

### Pressionar (clique ou toque)

- Enquanto o botão está pressionado, a escala vai para P com a mola.
- Ao soltar, a escala volta a E (se o ponteiro ainda estiver em cima) ou a 1.

### Casos de borda

- **Interrupção no meio**: se o ponteiro entra e sai antes do fim, as transições revertem a partir do estado atual. Não há salto.
- **Efeito encadeado**: o encadeamento (primeiro deslizar, depois subir na entrada; primeiro descer, depois recuar na saída) acontece porque o atraso de cada transição depende de o botão estar ou não em hover.
  - Em hover: o deslize não tem atraso e o crescimento vertical tem atraso T.
  - Fora de hover: o crescimento vertical não tem atraso e o deslize tem atraso T.

## Técnica de renderização em alto nível

- **O líquido**
  - É feito inteiramente com CSS de fundo: uma camada de cor sólida, sem repetição, com o dobro da largura do botão e altura controlada, ancorada na base.
  - Os estados "fora" e "dentro" são duas posições horizontais dessa camada (totalmente à esquerda e cobrindo tudo) e duas alturas (a altura da faixa e 100%).
  - A cor de repouso é uma cor de fundo sólida separada, sob a camada.
  - A troca de estado é instantânea nas variáveis. Quem anima são as transições CSS de posição, de tamanho e de cor do texto, cada uma com o próprio atraso.
  - Recomenda-se usar variáveis CSS para posição, altura e atraso, e alterá-las no hover.
- **Escala**: a escala de hover e de pressão vem de uma biblioteca de animação com molas, ou de um equivalente CSS com curva de leve "overshoot".
- **Composição**: o componente pode renderizar o próprio elemento de botão ou "emprestar" o comportamento ao único filho, que passa a receber classes, estilos e manipuladores mesclados. É o padrão "como filho", útil para links que parecem botões.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Duração-base de cada fase do efeito líquido; também é o atraso entre as fases | string de tempo CSS | "0.3s" |
| Altura da faixa de líquido em repouso | string de comprimento CSS | "3px" |
| Escala no hover | número | 1,05 |
| Escala ao pressionar | número | 0,95 |
| Renderizar como o filho em vez de um botão próprio | booleano | falso |
| Variante visual (padrão, destrutivo, secundário, fantasma) | enumeração | padrão |
| Tamanho (padrão, pequeno, grande, ícone, ícone pequeno, ícone grande) | enumeração | padrão |
| Classe extra, atributos e eventos nativos de botão | — | repassados ao elemento |

## Demo

- Um único botão centralizado na área de prévia.
- O conteúdo é o texto "Hover me". No tamanho "ícone", o conteúdo é um ícone de sinal de mais (+).
- Controles da prévia:
  - variante, com as opções padrão, destrutivo e fantasma (padrão selecionado);
  - tamanho, com as opções padrão, pequeno, grande, ícone, ícone pequeno e ícone grande (padrão selecionado).

## Acessibilidade e responsividade

- **Semântica**
  - É um botão nativo, então teclado (Enter/Espaço), foco e estado desabilitado funcionam nativamente.
  - O anel de foco aparece só no foco por teclado.
  - Botões só com ícone precisam de rótulo acessível fornecido por quem usa.
- **Teclado**: o efeito líquido é acionado só por hover de ponteiro. Opcionalmente, a reimplementação pode acionar o mesmo efeito no foco visível.
- **Movimento reduzido**: recomenda-se, sob preferência de movimento reduzido, desativar a escala e encurtar ou zerar as durações do líquido. A referência não faz isso.
- **Tamanho**: o botão tem tamanho intrínseco ao conteúdo. O efeito funciona em qualquer largura porque as posições são relativas ao próprio botão.
