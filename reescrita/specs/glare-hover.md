# Especificação: Reflexo ao passar o mouse (glare-hover)

## Propósito
Um painel/cartão que, ao receber o ponteiro, é atravessado por uma faixa diagonal de brilho, como o reflexo de luz deslizando sobre vidro ou metal polido. Ao sair, o reflexo volta (ou, no modo "uma vez", some instantaneamente). Puramente visual, com CSS.

## Aparência
- **Painel**: largura padrão **500 px**, altura padrão **500 px** (aceitam qualquer medida CSS); fundo padrão **`#000`**; borda de **1 px** sólida na cor padrão **`#333`**; raio padrão **10 px**; overflow oculto; posicionamento relativo; layout em grade com o conteúdo **centralizado** nos dois eixos. Cursor de ponteiro quando o mouse está sobre ele.
- **Camada de reflexo**: pseudo-camada absoluta cobrindo todo o painel, por cima do fundo (e do conteúdo, por vir antes na pilha mas posicionada — ver Observações), sem capturar eventos. É preenchida por um **gradiente linear** com ângulo padrão **−45°** (direção para o canto superior esquerdo), com paradas:
  - transparente de 0% até **60%**;
  - cor do reflexo em **70%** (padrão **branco** com opacidade **0,5**, ou seja `rgba(255,255,255,0.5)`);
  - transparente novamente em **85%** (ponto médio implícito entre 70% e 100%);
  - transparente até 100%.
  Resultado: uma faixa luminosa estreita, perpendicular à direção do gradiente (inclinada como "/"), com borda de entrada mais curta (60→70%) e de saída mais longa (70→85%).
- **Tamanho do gradiente**: a imagem de gradiente tem **250%** da largura e da altura do painel (configurável), sem repetição.
- A cor do reflexo aceita hex de 3 ou 6 dígitos (convertida para rgba com a opacidade configurada); qualquer outro formato é usado como está, ignorando a opacidade.

## Comportamento
- **Repouso**: a imagem de gradiente fica posicionada em −100% / −100%, o que a coloca inteiramente fora do painel (deslocada para baixo e para a direita); nada é visível.
- **Hover (entrada)**: a posição transiciona para **100% / 100%** (a imagem fica alinhada pelo canto inferior direito e se estende para cima/esquerda). Durante a transição, a faixa de brilho atravessa o painel na diagonal, entrando pelo canto **inferior direito** e saindo pelo **superior esquerdo**, terminando fora da vista. Duração padrão **650 ms**, curva `ease` padrão do CSS (cubic-bezier 0,25; 0,1; 0,25; 1).
- **Saída (modo normal)**: a transição se inverte com a mesma duração e curva — a faixa varre de volta no sentido contrário.
- **Modo "uma vez"** (padrão desligado): só a entrada é animada; ao sair, a posição volta instantaneamente ao repouso (sem varredura de retorno), de modo que cada novo hover mostra uma única passada.
- Interromper no meio da transição reverte a partir da posição atual (comportamento natural de transições CSS).
- Sem eventos de JavaScript: tudo por estado de hover do CSS.

## Técnica de renderização em alto nível
DOM + CSS puro: variáveis CSS para as medidas e cores, pseudo-elemento com `linear-gradient`, `background-size` maior que o elemento e transição de `background-position` acionada por `:hover`.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Largura do painel | medida CSS | `500px` |
| Altura do painel | medida CSS | `500px` |
| Fundo do painel | cor/fundo CSS | `#000` |
| Raio dos cantos | medida CSS | `10px` |
| Cor da borda | cor CSS | `#333` |
| Cor do reflexo | hex (3 ou 6 dígitos) | `#ffffff` |
| Opacidade do reflexo | 0–1 | 0,5 |
| Ângulo do gradiente | graus | −45 |
| Tamanho do gradiente em relação ao painel | % | 250 |
| Duração da transição | ms | 650 |
| Animar só na entrada | booleano | falso |
| Conteúdo | nós React | nenhum |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia relativa, **400 px de altura**, overflow oculto, painel centralizado, fundo do tema.
- Painel de **400 × 300 px**, raio **20 px**, fundo = cor de cartão do tema, borda = cor de borda sutil do tema.
- Conteúdo: texto **"Hover Me"** centralizado, **3rem**, peso 600, sem margem, na cor atenuada de instrução do tema.
- Valores da demo: opacidade **0,3**, tamanho **300%**, duração **800 ms**, modo uma vez desligado. Cor do reflexo: **branco** no tema escuro; no tema claro, quando ainda no padrão, **`#18181b`** (reflexo escuro sobre cartão claro).
- Controles: cor do reflexo; opacidade 0–1 (0,1); tamanho 100–500% (25); duração 200–2000 ms (50); interruptor "uma vez".
- Para captura estática com o cursor parado no centro, o hover deve resultar no estado final (faixa já fora da vista) — aceitável; opcionalmente, a demo pode iniciar uma passada automática na montagem para que o reflexo seja visto.

## Acessibilidade e responsividade
- O painel em si não é interativo; se o conteúdo for clicável, a semântica vem do conteúdo. Recomendação: aplicar o mesmo efeito em `:focus-within` para usuários de teclado.
- Recomendação: com `prefers-reduced-motion`, desativar a transição (ou reduzir a um brilho estático suave).
- Dimensões aceitam unidades relativas (%, rem), permitindo uso responsivo.

## Observações de fidelidade
- Na referência, a camada de reflexo é posicionada e por isso fica **acima** do conteúdo não posicionado (o brilho passa por cima do texto). Manter esse empilhamento.
- Recomendação: o cursor de ponteiro no hover sugere clicabilidade mesmo sem ação; torná-lo opcional.
- Valores de tamanho/posição de uma segunda camada de fundo inexistente aparecem na referência e não têm efeito; não reproduzir.
