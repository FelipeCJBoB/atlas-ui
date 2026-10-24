# Especificação: Carrossel com molas (motion-carousel)

## Propósito

Um carrossel horizontal arrastável, em laço infinito, em que o slide selecionado fica centralizado e em tamanho cheio enquanto os vizinhos aparecem parcialmente nas laterais, um pouco menores. Abaixo, botões "anterior"/"próximo" e uma paginação de pontos em que o ponto ativo se alarga numa pílula com o texto "Slide N".

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Estrutura (coluna, 16 px entre blocos, largura total)

1. **Janela de rolagem**: largura total, excedente oculto.
2. **Trilho**: linha flexível com todos os slides; permite rolagem vertical da página por toque (o gesto horizontal é do carrossel).
3. **Slide** (casca): não encolhe nem cresce, largura-base **55%** da janela, margem direita de **24 px** (espaço entre slides), altura:
   - **144 px** em viewports < 640 px;
   - **208 px** a partir de 640 px;
   - **288 px** a partir de 768 px.
4. **Cartão do slide** (dentro da casca, ocupando-a toda): sem fundo, borda de **4 px** na cor de borda, cantos de **14 px**, conteúdo centralizado, texto não selecionável; o número do slide (1, 2, 3…) em **30 px** (48 px a partir de 768 px), peso 600, cor do texto.
5. **Barra de controles**: linha com itens distribuídos (esquerda, centro, direita):
   - **Botão anterior** (esquerda) e **próximo** (direita): quadrados de **36 × 36 px**, cantos de 8 px, fundo primária, ícone chevron de traço de **20 px** na cor sobre primária, sombra `0 1px 2px 0 rgb(0 0 0 / 0.05)`, hover com fundo primária a 90%; desabilitado: 50% de opacidade.
   - **Pontos** (centro): linha que pode quebrar, alinhada à direita dentro do seu espaço, 8 px entre pontos, centralizada na vertical.

### Pontos

- Pílula de cantos totalmente arredondados, fundo primária, sem borda, texto sobre primária em 14 px, cursor de ponteiro, texto não selecionável.
- **Inativo**: **12 × 12 px** (círculo), rótulo invisível.
- **Ativo**: **68 × 28 px**, com o rótulo "Slide N" centralizado (padding 12 px × 4 px, sem quebra).

## Comportamento

### Posicionamento e seleção

- Alinhamento **ao centro**: o slide selecionado fica centralizado na janela; com 55% de largura, os vizinhos aparecem cortados nas laterais (cerca de 22,5% da janela de cada lado menos o espaçamento).
- **Laço infinito**: depois do último vem o primeiro, e vice-versa; os slides são reposicionados para que sempre haja vizinhos dos dois lados. Os botões anterior/próximo, portanto, nunca ficam desabilitados.
- Há um ponto de parada por slide (6 na demo).

### Navegação

- **Arrastar** (mouse ou toque) horizontalmente move o trilho junto com o ponteiro. Ao soltar, ele desliza com inércia e assenta no ponto de parada mais próximo do destino projetado (um arrasto rápido pode pular mais de um slide). Arrastos verticais rolam a página.
- **Botões**: anterior/próximo deslizam um slide.
- **Pontos**: clicar num ponto desliza até aquele slide.
- O deslizamento programado é uma animação com desaceleração suave de cerca de **0,4–0,6 s** (física de rolagem com atrito).
- O slide selecionado é atualizado **durante** o deslizamento, assim que o ponto de parada mais próximo muda.

### Animações de estado

- **Cartão**: escala **1** quando é o selecionado e **0,9** caso contrário; mola de rigidez **240**, amortecimento **24**, massa **1** (leve balanço). Sem animação na montagem.
- **Ponto**: largura e altura animam entre 12 × 12 e 68 × 28 px com a **mesma mola**; os vizinhos se reposicionam suavemente (animação de layout).
- **Rótulo do ponto**: ativo → opacidade 1, escala 1, sem desfoque; inativo → opacidade 0, escala 0, desfoque de 4 px; mesma mola.
- **Botões anterior/próximo**: hover escala 1,05, pressionar 0,95 (mola rápida de rigidez 550, amortecimento 30).

## Técnica de renderização em alto nível

- DOM/CSS + mola. A referência usa uma biblioteca externa de carrossel (não disponível aqui): **implementar o motor próprio**:
  - trilho com translação horizontal animada;
  - arrasto por eventos de ponteiro (ou recurso de arrasto da biblioteca de animação) com cálculo de velocidade ao soltar e projeção do destino;
  - pontos de parada = posições que centralizam cada slide;
  - laço: renderizar cópias ou reposicionar slides das bordas por translação para o trilho parecer infinito, normalizando a posição a cada volta.
- Medição da janela para converter 55% e 24 px em posições; valores de reserva antes da medição.
- Escala dos cartões e tamanho dos pontos por mola; rótulo com filtro de desfoque animado.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Lista de slides (identificadores; o conteúdo mostrado é a posição + 1) | lista de números | obrigatório |
| Laço infinito | booleano | verdadeiro na demo (desligado: botões desabilitam nas pontas e os slides das pontas alinham conforme o centro) |
| Largura do slide, espaçamento e alturas por faixa de largura | CSS | 55%, 24 px, 144/208/288 px |
| Mola das animações de estado (rigidez, amortecimento, massa) | objeto | 240 / 24 / 1 |

## Demo

- Carrossel em largura total da área de prévia, centralizado na vertical, com **6 slides** (números 1 a 6) e laço ligado; fundo do tema.
- Começa no slide 1, com o 6 aparecendo cortado à esquerda e o 2 à direita.
- Sem controles extras.

## Acessibilidade e responsividade

- Recomendações (não presentes na referência):
  - região com papel de carrossel e descrição ("carrossel"), cada slide com papel de grupo e rótulo "N de 6";
  - nomes acessíveis "Slide anterior" / "Próximo slide" nos botões; pontos com o rótulo "Slide N" e estado atual (página atual);
  - setas esquerda/direita do teclado para navegar quando o carrossel tiver foco;
  - anel de foco visível (3 px, cor do anel a 50%).
- Movimento reduzido: recomendação — deslizamento instantâneo e sem escala.
- Responsivo: altura em três faixas; largura dos slides proporcional à janela.

## Observações de fidelidade

- **Recomendação — slide ativo**: a referência compara o **valor** de cada slide com o índice selecionado (só funciona se os valores forem 0, 1, 2…). Comparar pela **posição** na lista.
- Os pontos inativos têm 12 px, mas o rótulo "Slide N" inativo ainda ocupa espaço interno invisível; manter o tamanho fixo do botão para não deformar.
