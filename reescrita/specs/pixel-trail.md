# Especificação: Rastro de pixels (pixel-trail)

## Propósito
Uma camada que transforma o movimento do cursor num rastro de **quadrados de grade** (pixels grandes) acesos na cor escolhida. Os quadrados aparecem sob o ponteiro e se apagam em fração de segundo. Opcionalmente, um filtro "gosmento" funde os quadrados vizinhos numa mancha arredondada, como líquido.

## Aparência
- **Superfície**: uma superfície WebGL transparente, com posicionamento absoluto, que ocupa 100% × 100% do pai. Fica acima do conteúdo de fundo e captura o movimento do ponteiro. A densidade de pixels fica entre **1 e 1,25**, sem antisserrilhamento.
- **Grade**: N células ao longo do **maior** lado da área (padrão **40**). As células são **quadradas**, então o lado menor tem proporcionalmente menos células. A grade é centrada, e o espaço quadrado de N × N células cobre o maior lado.
- **Célula acesa**: um quadrado chapado, sem separação, com a cor configurada (padrão **`#ffffff`**) e opacidade igual à intensidade do rastro no centro daquela célula, de 0 a 1. Células apagadas são transparentes.
- **Filtro gosmento** (opcional):
  - um filtro SVG aplicado à superfície: desfoque gaussiano com desvio igual à intensidade configurada (por exemplo, 5), depois um **contraste brutal no alfa** (alfa novo = 19 × alfa − 9, ou seja, limiar em torno de 0,47);
  - a imagem original é composta "por cima" (atop) do resultado;
  - efeito: blocos vizinhos se fundem em formas com cantos arredondados e as bordas ficam nítidas;
  - o elemento SVG que define o filtro é absoluto e invisível, e precisa de um identificador único.

## Comportamento
- **Mapa de rastro**: uma textura quadrada interna de **512 × 512**, em tons de cinza, que cobre o mesmo espaço quadrado da grade.
  - Cada movimento do ponteiro sobre a superfície registra um ponto na posição correspondente.
  - Com interpolação (padrão **5**), são inseridos pontos intermediários entre a amostra anterior e a atual, para que movimentos rápidos deixem um rastro contínuo.
- **Pintura do rastro** (a cada quadro): o mapa é limpo para preto e cada ponto vivo é pintado como um **disco suave** (gradiente radial do branco para transparente), em modo de mistura "tela" (screen), que acumula sem estourar bruscamente.
  - O raio do disco é proporcional à fração configurada do lado do mapa (padrão **0,1**, cerca de 51 de 512 px, ou seja, por volta de 10% do maior lado da área) e à intensidade atual do ponto.
  - **Envelope de vida** do ponto, com duração máxima padrão de **250 ms**:
    - nos primeiros **30%** da vida, a intensidade sobe de 0 a 1;
    - nos 70% restantes, desce de 1 a 0;
    - as duas fases passam pela função de easing configurada (padrão linear);
    - a intensidade também é modulada pela força do gesto (velocidade do ponteiro, com um mínimo);
    - ao atingir a idade máxima, o ponto é descartado.
- **Amostragem**: a cor de cada célula vem do valor do mapa **no centro da célula**, com filtragem "mais próximo", o que dá o aspecto pixelado e serrilhado.
- Sem movimento, o rastro some por completo em cerca de 250 ms.
- Mudar parâmetros recria a cena.

## Técnica de renderização em alto nível
WebGL com um quadrilátero de tela cheia (pode ser feito com uma biblioteca 3D declarativa ou com WebGL puro). O shader de fragmento converte a coordenada de tela para o espaço quadrado da grade (cobrindo o maior lado), quantiza para o centro da célula, lê a intensidade do mapa de rastro e emite a cor fixa com essa intensidade como alfa.

O mapa de rastro é um **canvas 2D fora da tela**, redesenhado a cada quadro com discos radiais que envelhecem, e enviado como textura. A posição do ponteiro deve ser convertida para o mesmo espaço quadrado. O filtro gosmento é um filtro SVG aplicado por CSS à superfície.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Células ao longo do maior lado | inteiro | 40 |
| Raio do pincel (fração do lado do mapa) | número | 0,1 |
| Vida de cada ponto (ms) | número | 250 |
| Pontos intermediários entre amostras | número | 5 |
| Função de easing do envelope | função (0–1 → 0–1) | identidade |
| Filtro gosmento (identificador + intensidade do desfoque) | objeto opcional | desligado |
| Cor das células | cor CSS | `#ffffff` |
| Opções extras da superfície e do contexto gráfico | objetos | sem antisserrilhamento, alta performance, com alfa |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **400 px de altura**, sem padding, overflow oculto e fundo escuro do site. Há um botão de "recarregar".
- Atrás da superfície, centralizado, o texto **"Move Cursor."** com fonte `clamp(2rem, 6vw, 6rem)` e peso 600, na cor de texto atenuada. A superfície fica por cima do texto.
- Valores da demo:
  - **50** células;
  - pincel 0,1;
  - vida 250 ms;
  - interpolação 5;
  - cor **`#5227FF`** (violeta-azulado);
  - filtro gosmento **ligado** com intensidade **2**.
- Controles:
  - células de 10 a 100;
  - pincel de 0,05 a 0,5 (passo 0,01);
  - vida de 100 a 1000 (passo 50);
  - interpolação de 0 a 10 (passo 0,1);
  - cor;
  - chave do filtro;
  - intensidade do filtro de 1 a 20 (visível só com o filtro ligado).
  - Cada mudança remonta o componente.

## Acessibilidade e responsividade
- Decorativo: ocultar dos leitores de tela. A superfície captura o ponteiro, então **não deve** ficar sobre conteúdo clicável. **Recomendação**: ouvir o movimento no pai e deixar a superfície sem captura de ponteiro, para permitir uso sobre conteúdo interativo.
- **Recomendação**: com `prefers-reduced-motion`, desligar o rastro.
- O toque gera rastro durante o arraste.
- Responsivo: as células continuam quadradas em qualquer proporção.

## Observações de fidelidade
- A intensidade por ponto, o fator de força e a interpolação seguem o comportamento padrão de um utilitário de "textura de rastro" de terceiros. Os valores de envelope (30% / 70%) e a mistura "tela" devem ser mantidos. Os detalhes finos de força podem ser aproximados.
- Se a interpolação for 0, a referência a troca silenciosamente por 0,1. Tratar 0 como "sem interpolação".
- O SVG do filtro, sem tamanho explícito, ocupa 300 × 150 px absolutos e invisíveis. **Recomendação**: dar tamanho 0.
