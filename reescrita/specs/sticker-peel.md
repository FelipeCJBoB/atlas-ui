# Especificação: Adesivo que descola (sticker-peel)

## Propósito
Um adesivo arrastável. Ao passar o ponteiro, a parte de cima do adesivo "descola" e dobra para baixo, mostrando o verso cinza; ao pressionar, descola ainda mais. Ao arrastar, o adesivo inclina para o lado do movimento e volta a ficar reto ao soltar. Um brilho especular acompanha o cursor sobre a superfície. Elemento lúdico/decorativo.

## Aparência
- **Elemento arrastável**: posicionamento absoluto dentro do pai (que serve de limite do arraste), cursor de "mão aberta" (agarrando, enquanto pressionado), promovido a camada própria de composição. Em telas de toque sem hover, cursor padrão.
- **Adesivo (frente)**: a imagem do adesivo com largura configurável (padrão **200 px**, altura proporcional), girada por um ângulo fixo configurável (padrão **30°**). Não é selecionável nem arrastável nativamente, e o menu de contexto é bloqueado.
  - **Sombra projetada** que segue o contorno da imagem (não um retângulo): deslocamento **2 px × 4 px**, desfoque = 3 × intensidade da sombra, preta com opacidade = intensidade da sombra (padrão **0,6**).
  - **Iluminação especular**: um realce branco brilhante, de expoente alto (100), produzido por uma luz pontual a 300 px de "altura" posicionada no cursor; o relevo vem do canal alfa da imagem levemente desfocado (1 px), de modo que o brilho aparece sobretudo nas bordas do recorte. Intensidade padrão **0,1**. O realce fica restrito à silhueta da imagem.
- **Aba (verso)**: uma segunda cópia da imagem, espelhada verticalmente, preenchida inteiramente com **cinza `rgb(179,179,179)`** dentro da silhueta (como o verso de papel do adesivo), com iluminação especular mais difusa (desfoque de 10 px) e **7×** mais intensa, com a luz espelhada verticalmente em relação ao cursor. Em repouso, a aba é invisível (recortada a zero).
- **Margem de recorte**: os recortes usam uma folga de **10 px** além das bordas da imagem para não cortar a sombra.
- **Direção do descolamento**: todo o conjunto (frente e aba) é girado pelo ângulo de direção (padrão **0°**, descola de cima para baixo), e o conteúdo interno é contra-girado pelo mesmo ângulo, para que a imagem permaneça na orientação original enquanto a linha de dobra muda de direção.

## Comportamento

### Descolar
- **Repouso**: a frente é recortada por um retângulo que cobre toda a imagem (com a folga); a aba está recortada a uma faixa de altura zero.
- **Hover** (ou toque mantido sobre o adesivo): o recorte da frente passa a começar a **30%** da altura (padrão), escondendo a faixa superior. A aba revela a faixa correspondente (de −10 px a 30%) e se desloca verticalmente para que a faixa espelhada fique logo abaixo da linha de dobra (posição superior = −100% + 2 × 30% − 1 px). Visualmente: a parte de cima dobrou para baixo sobre a própria frente, mostrando o verso cinza.
- **Pressionado**: o mesmo, mas com **40%** (padrão).
- Transições: recorte da frente em **0,6 s ease-out**; aba (recorte e posição) em **0,6 s ease-out**.
- **Toque**: ao iniciar um toque no adesivo, entra no estado de hover; ao terminar ou cancelar, sai. A área tem gesto de toque desativado (para o arraste funcionar sem rolar a página).

### Arrastar
- Arraste livre em X e Y, **limitado aos limites do elemento pai**.
- Durante o arraste, a inclinação vai para 0,4 × velocidade horizontal instantânea (deslocamento desde o último evento), saturada entre **−24° e +24°**, por interpolação de **0,15 s** com desaceleração leve.
- Ao soltar, a inclinação volta a **0°** em **0,8 s** com desaceleração quadrática.
- Não há inércia após soltar (o adesivo para onde foi solto).

### Luz
Ao mover o mouse sobre o adesivo, a luz da frente vai para a posição do cursor (coordenadas locais). A luz da aba vai para a mesma posição X e Y espelhado (altura − y). Se a direção do descolamento for exatamente 180°, a luz da aba é movida para fora (desligada).

### Posição inicial
- **Centro** (padrão): nenhuma translação aplicada; o adesivo fica na posição natural dentro do pai (no layout da demo, centralizado).
- **Objeto {x, y}**: translação inicial para esses pixels.

### Redimensionamento da janela / orientação
Recalcula os limites; se o adesivo estiver fora, desliza-o de volta para dentro em **0,3 s** com desaceleração quadrática.

## Técnica de renderização em alto nível
DOM + CSS + filtros SVG:
- Recortes por polígono (retângulos) com transição CSS para o descolamento; espelhamento vertical da aba por escala −1.
- Filtros SVG inline: iluminação especular com luz pontual (para o brilho), sombra projetada (para a sombra que segue a silhueta) e inundação de cor composta com o alfa (para o verso cinza). Os identificadores dos filtros devem ser **únicos por instância**.
- Arraste com uma biblioteca de arraste/animação (ou implementação própria com eventos de ponteiro) e interpolação temporizada para a inclinação.

**Asset**: a demo usa uma imagem PNG própria (logotipo em adesivo). **Não usar o arquivo.** Gerar o adesivo em SVG próprio: forma recortada (por exemplo, um selo arredondado ou estrela de bordas suaves) de ~200 px, com **borda branca grossa de 8–10 px** típica de adesivo recortado, preenchimento em gradiente vibrante (roxo `#7c3aed` → rosa `#ec4899`) e um símbolo ou palavra curta em branco no centro, sobre fundo transparente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem do adesivo (com transparência) | URL | obrigatória (usar SVG procedural na demo) |
| Rotação fixa da imagem | número (graus) | 30 |
| Quanto descola no hover | número (% da altura) | 30 |
| Quanto descola ao pressionar | número (% da altura) | 40 |
| Largura do adesivo | número (px) | 200 |
| Intensidade da sombra | número 0–1 | 0,6 |
| Intensidade do brilho | número 0–1 | 0,1 |
| Posição inicial | `centro` ou {x, y} em px | `centro` |
| Direção do descolamento | número (graus) | 0 |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **400 px de altura**, overflow oculto, fundo em gradiente vertical: tema escuro `#120F17 → #1B1722 → #1B1722 → #120F17`; tema claro `#ffffff → #fafafa → #fafafa → #ffffff`. Conteúdo centralizado.
- Um adesivo (imagem procedural, ver Asset) com: rotação **0°**, largura **200**, descolamento 30% / 40%, brilho **0,1**, sombra **0,5**, direção **0°**.
- Texto **"Try dragging it!"** no topo, centralizado na horizontal a 1em do topo, tamanho fluido entre 1,5rem e 3rem (4vw), peso 600, atrás do adesivo.
- Controles: direção 0–360°; rotação 0–60°; largura 100–300 px (passo 10); descolamento no hover 0–50%; ao pressionar 0–70%; brilho 0–0,5 (0,01); sombra 0–1 (0,01).

## Acessibilidade e responsividade
- **Recomendação**: dar ao adesivo um nome acessível (texto alternativo configurável) e torná-lo focável com movimento por setas (por exemplo, 10 px por toque de tecla) como alternativa ao arraste; aplicar o estado "descolado" também em foco visível.
- **Recomendação**: com `prefers-reduced-motion`, desativar a inclinação animada e encurtar as transições.
- Funciona com toque (arraste e estado de descolar no toque).
- O limite de arraste é o pai; redimensionar a janela devolve o adesivo para dentro.

## Observações de fidelidade
- **Defeito a corrigir (recomendação)**: a referência declara curvas de easing configuráveis para o descolamento, mas elas nunca são aplicadas (as transições usam sempre ease-out de 0,6 s). Ou aplicar de fato (mapeando para curvas CSS), ou não expor.
- **Defeito a corrigir (recomendação)**: os filtros SVG usam identificadores fixos e globais; com dois adesivos na página, um controla o outro. Gerar identificadores únicos.
- **Recomendação**: a referência pede inércia no arraste sem o recurso disponível, então ela não ocorre. Reproduzir sem inércia (ou implementar inércia leve como melhoria opcional).
- **Recomendação**: a documentação original lista posições como "top-left" etc. que não existem; aceitar apenas centro ou coordenadas.
- As variáveis de configuração são definidas na raiz global do documento com valores padrão; preferir escopo local ao componente.
