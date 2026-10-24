# Especificação: Monitor CRT com plasma (crtwarp)

## Propósito
Fundo animado que imita a tela abaulada de um monitor de tubo (CRT) exibindo um "plasma" clássico de demoscene: ondas de cor fosforescente, posterizadas em poucos níveis e quantizadas numa grade de 80 × 24 células (como um terminal de texto), com linhas de varredura, brilho difuso (bloom), separação de canais RGB e grão. O ponteiro deforma a curvatura da tela.

## Aparência
- **Contêiner**: bloco em posição relativa, 100% × 100% do pai, overflow oculto. Contém uma superfície de desenho opaca, em bloco, que ocupa 100% × 100%.
- **Cores padrão**:
  - fósforo (cor das ondas): **`#c755f7`** (violeta/magenta);
  - fundo: **`#05010a`** (quase preto arroxeado).
- **Aspecto**:
  - manchas e faixas curvas do plasma em 3 níveis de intensidade (apagado, ~⅓, ~⅔), com degraus bem visíveis porque a imagem é amostrada numa grade de **80 colunas × 24 linhas** (células retangulares que esticam com o tamanho da tela);
  - linhas de varredura horizontais finas sobrepostas;
  - halo suave ao redor das áreas acesas;
  - franjas avermelhadas e azuladas nas bordas laterais das formas (aberração cromática);
  - grão cintilante por pixel;
  - a imagem inteira parece "estufada" no centro, como vidro curvo.
- **Mistura final**: a cor do fósforo é misturada sobre a cor de fundo na proporção da intensidade do sinal; onde o sinal é zero, aparece o fundo puro (mais o grão).

## Comportamento
### Campo de plasma (ideia matemática)
- As coordenadas são primeiro escaladas em torno do centro pela densidade de ondas ÷ 2,2 (padrão **2,5**; maior = mais ondas na tela).
- Linhas de varredura: fator em cosseno elevado ao longo do eixo vertical com frequência configurável (padrão **200**, ou seja, cerca de 100 linhas escuras na altura), misturado com 1 pela força das linhas (padrão **0,25**).
- As coordenadas são arredondadas para a grade de 80 × 24 células.
- Soma de senoides clássica de plasma: duas ondas planas (uma horizontal e uma vertical mais forte), uma onda planar cuja direção gira com o tempo, três ondas **radiais** em torno de um centro que percorre uma órbita de Lissajous lenta e uma onda diagonal extra.
- O seno da soma (multiplicada pela quantidade de ondas ÷ 0,28; padrão **0,3**) é levado a [0, 1] e **posterizado em 3 níveis** (0, ⅓, ⅔); depois é multiplicado pelo fator das linhas de varredura.
### Pós-efeitos
- **Bloom**: média ponderada de 8 amostras vizinhas do plasma (4 em cruz com peso 0,12, 4 diagonais com peso 0,08, mais o centro com 0,2), a uma distância de 0,01 × raio do bloom (padrão **1**) em coordenadas normalizadas. Cor = fósforo × (0,3 + 0,7 × sinal + brilho × intensidade do bloom × 0,65); intensidade padrão **1,5**.
- **RGB shift**: o canal vermelho é amostrado deslocado para a direita e o azul para a esquerda pelo valor configurado (padrão **0,015** da largura); a diferença em relação ao sinal central é somada (× 0,42) à cor.
- **Máscara**: opacidade das ondas = sinal × 0,82 + brilho × 0,52, limitada a [0, 1] e multiplicada pela vinheta.
- **Vinheta** (padrão **0**, desligada): escurece as bordas com uma queda suave em função da distância ao centro.
- **Brilho**: multiplicador da cor das ondas (padrão **1,25**).
- **Grão**: ruído pseudoaleatório por pixel, ressorteado a cada quadro, centrado em zero, com amplitude configurável (padrão **0,1**).
- **Pixelização** opcional (padrão **1** = desligada): com valor > 1, a imagem é amostrada em blocos com esse lado em pixels.
### Curvatura CRT
- Mapeamento de "abaulamento": a coordenada centralizada é dividida pela raiz de (R² − r²) e renormalizada para que os cantos continuem nos cantos. O centro aparece ampliado e as bordas comprimidas. Não há moldura preta: o conteúdo continua até as bordas.
- R = 1,1 + 0,42 ÷ curvatura (padrão **0,25**, o que dá R ≈ 2,78), com R mínimo de ~1,415. Curvatura maior = abaulamento mais forte.
### Ponteiro (ligado por padrão)
- A posição do ponteiro sobre o contêiner é normalizada em [−1, 1] (y positivo para cima) e suavizada: a cada quadro renderizado, o valor atual anda **8%** até o alvo. Ao sair, o alvo volta a (0, 0).
- **Eixo vertical**: R é multiplicado por e^(−y × força × 0,4). Ponteiro no alto → R menor → abaulamento mais forte; embaixo → mais plano.
- **Eixo horizontal**: a imagem é deslocada horizontalmente em −x × força × 0,035.
- Força padrão **0,5**.
### Tempo e taxa de quadros
- O tempo do plasma avança Δt × velocidade (padrão **0,5**), com Δt limitado a 0,1 s.
- A renderização é limitada à taxa configurada (padrão **30 fps**), descartando quadros intermediários sem acumular atraso.
- Pausa: o tempo para de avançar, mas o ponteiro continua sendo animado e a imagem é redesenhada.
- Fora da viewport ou com a aba oculta, nada é desenhado.
- Densidade de pixels = mínimo entre o DPR do dispositivo e a qualidade configurada (padrão **1**).
- Todos os parâmetros são aplicados ao vivo, sem recriar a superfície. O tamanho acompanha o contêiner por observação de tamanho.

## Técnica de renderização em alto nível
WebGL com quad de tela cheia e câmera ortográfica; todo o efeito está num shader de fragmento. O plasma é uma função pura de (coordenada, tempo) avaliada 11 vezes por pixel (centro, 8 vizinhos do bloom e 2 do RGB shift). Recomenda-se um contexto sem antisserrilhamento e de baixo consumo.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do fósforo | cor CSS | `#c755f7` |
| Cor de fundo | cor CSS | `#05010a` |
| Velocidade | número | 0,5 |
| Curvatura da tela | número (0–1) | 0,25 |
| Força das linhas de varredura | número (0–1) | 0,25 |
| Densidade das linhas de varredura | número | 200 |
| Quantidade/amplitude das ondas | número (0–1) | 0,3 |
| Densidade das ondas | número | 2,5 |
| Intensidade do bloom | número | 1,5 |
| Raio do bloom | número | 1 |
| Grão | número | 0,1 |
| Vinheta | número (0–1) | 0 |
| Brilho | número | 1,25 |
| Tamanho do pixel (1 = suave) | número (px) | 1 |
| Separação RGB | número (fração da largura) | 0,015 |
| Reação ao ponteiro | booleano | verdadeiro |
| Força do ponteiro | número | 0,5 |
| Qualidade (teto de DPR) | número | 1 |
| Teto de quadros por segundo | número | 30 |
| Pausado | booleano | falso |
| Classe e estilo extras do contêiner | string / objeto | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto; todos os valores nos padrões.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Make every pixel pulse"**, centralizados (aproximação: selo pequeno translúcido; título branco ~2,5rem, peso 600). Recomenda-se que a sobreposição não bloqueie o ponteiro.
- Controles (ao vivo): cor do fósforo; fundo; velocidade 0–2 (0,05); curvatura 0–1 (0,01); quantidade de ondas 0–1 (0,01); densidade das ondas 0,5–6 (0,1); força das linhas 0–1 (0,01); densidade das linhas 40–500 (5); bloom 0–3 (0,05); raio do bloom 0,1–3 (0,05); grão 0–0,25 (0,005); vinheta 0–1 (0,01); brilho 0,25–2,5 (0,05); RGB shift 0–0,03 (0,001); seletor de tamanho do pixel (Smooth = 1, 2, 4, 8 px); seletor de qualidade (Performance 0,75, Balanced 1, Sharp 1,5); seletor de fps (24, 30, 45, 60); chave do ponteiro; força do ponteiro 0–1,5 (0,01, desabilitada se o ponteiro estiver desligado); chave de pausa.

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, iniciar pausado (quadro estático) e zerar o grão animado.
- O teto de fps e de DPR já protege dispositivos fracos; manter.
- A grade de 80 × 24 é relativa ao tamanho, então as células ficam retangulares e esticadas conforme a proporção da área (comportamento esperado).

## Observações de fidelidade
- **Recomendação**: ao retomar depois de ficar fora da tela, a referência pode aplicar um Δt grande (limitado a 0,1 s); manter o limite.
- **Recomendação**: o grão e a pixelização são calculados em pixels físicos; com qualidade diferente de 1 o tamanho aparente muda — aceitável, mas documentar.
