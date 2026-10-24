# Especificação: Ruído de filme (noise)

## Propósito
Uma sobreposição de granulação de filme analógico, com chuvisco cinza animado e bem sutil, colocada por cima de uma seção para dar textura "suja" e cinematográfica.

## Aparência
- **Superfície**: uma única superfície de desenho 2D com posicionamento absoluto, ancorada no canto superior esquerdo do ancestral posicionado mais próximo. Ela mede **100vw × 100vh** (tamanho da viewport, não do contêiner) e não captura eventos de ponteiro.
- **Resolução interna**: fixa em **1024 × 1024** pixels, esticada para o tamanho da viewport com reamostragem **sem suavização** (pixelada). Cada grão vira um pequeno bloco retangular de cerca de 1–2 px CSS.
- **Grão**: cada pixel recebe um cinza aleatório uniforme entre 0 e 255 (o mesmo valor em R, G e B) e uma opacidade fixa de **15/255** (cerca de 6%). O resultado é uma névoa de pontos claros e escuros quase imperceptível, que clareia o preto e escurece o branco levemente.

## Comportamento
- **Animação**: um laço por quadro gera uma nova imagem de ruído a cada **2 quadros**, cerca de 30 trocas por segundo em telas de 60 Hz. O grão "ferve" continuamente.
- **Redimensionamento**: no resize da janela, a resolução interna é reaplicada (sempre 1024²) e o tamanho de exibição continua 100vw × 100vh.
- Não há interação.
- Trocar qualquer parâmetro reinicia o laço.

## Técnica de renderização em alto nível
Canvas 2D: a cada atualização, preenche-se um buffer de pixels com valores aleatórios e ele é copiado para a superfície. Uma alternativa permitida e mais leve: pré-gerar de 4 a 8 quadros de ruído e alterná-los, com aparência equivalente. Outra é usar um shader de ruído por hash em WebGL.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Tamanho do padrão (px) | número | 250 (sem efeito na referência) |
| Escala horizontal do padrão | número | 1 (sem efeito na referência) |
| Escala vertical do padrão | número | 1 (sem efeito na referência) |
| Intervalo de atualização (em quadros) | inteiro | 2 |
| Opacidade do grão (0–255) | inteiro | 15 |

## Demo
- Área de prévia com **altura mínima de 400 px**, overflow oculto, conteúdo centralizado e fundo escuro do site.
- Texto centralizado **"Ooh, edgy!"**, com **6rem** e peso 600, na cor do texto do tema.
- A sobreposição de ruído cobre toda a área, recortada pelo overflow. Há um botão de "recarregar" no canto.
- Valores da demo: tamanho 250, escalas **2** e **2**, opacidade 15.
- Controles: tamanho de 50 a 500 (passo 10); escala X e escala Y de 0,1 a 5 (passo 0,1); opacidade de 0 a 25 (passo 5). Cada mudança remonta o componente, mas só a opacidade altera visivelmente o resultado.

## Acessibilidade e responsividade
- Decorativo: ocultar dos leitores de tela e não capturar o ponteiro.
- **Recomendação**: com `prefers-reduced-motion`, mostrar um único quadro estático de ruído.
- **Recomendação**: pausar o laço quando a superfície não estiver visível ou a aba estiver oculta.

## Observações de fidelidade
- Tamanho e escalas do padrão **não têm efeito** na referência. **Recomendação**: implementá-los de fato. O tamanho define o lado do ladrilho de ruído em px CSS, repetido em mosaico, e as escalas esticam o grão em cada eixo. Ou então removê-los da interface. Manter os padrões de forma que o visual padrão continue igual ao de um grão fino de cerca de 1–2 px.
- A superfície usa o tamanho da **viewport** mesmo dentro de um contêiner pequeno, o que depende do overflow do pai para não vazar. **Recomendação**: dimensionar pelo contêiner (100% × 100%).
- Gerar 1 milhão de valores aleatórios a cada 2 quadros é caro. Ver a alternativa na seção de técnica.
