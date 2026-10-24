# Especificação: Ondas pontilhadas retrô (dither)

## Propósito
Fundo animado de "ondas" orgânicas (turbulência fluida) renderizado com pontilhado ordenado (dithering de Bayer) e pixelização, com poucas cores, imitando gráficos de computadores antigos ou impressão de jornal. O ponteiro abre uma mancha escura suave na região próxima.

## Aparência
- **Contêiner**: superfície de desenho em posição relativa, 100% × 100% do pai, opaca. Densidade de pixels fixa em **1**.
- **Cores padrão**: ondas em cinza médio **`#808080`** (RGB 0,5 / 0,5 / 0,5) sobre fundo **preto `#000000`**. As cores são informadas como trios RGB de 0 a 1.
- **Aspecto**: veios e redemoinhos fluidos (parecidos com fumaça ou mármore) cujos tons intermediários são representados por padrões de pontos regulares. A imagem é formada por "macropixels" quadrados de **2 px** e por, no máximo, **4 níveis por canal** (padrão). O pontilhado segue a matriz de Bayer 8×8, então aparecem as tramas cruzadas típicas.
- Regiões escuras ficam ainda mais escuras por um viés: até 0,2 é subtraído em tons de luminância baixa, reduzindo a zero entre luminância 0,45 e 0,8. O fundo tende a ficar limpo, sem pontos soltos.

## Comportamento
### Campo de ondas (ideia matemática)
- Coordenadas: pixel ÷ resolução, centralizadas, com o eixo horizontal multiplicado pela proporção (largura ÷ altura).
- **Turbulência fBm**: soma de 4 oitavas do **valor absoluto de ruído de Perlin 2D**, o que gera os vincos tipo "turbulência". A cada oitava, a frequência é multiplicada pelo fator de frequência (padrão **3**) e a amplitude pelo fator de amplitude (padrão **0,3**).
- **Distorção de domínio**: valor = turbulência(p + turbulência(p − tempo × velocidade)), com o deslocamento temporal aplicado igualmente em x e y (o padrão desliza na diagonal e se retorce). Velocidade padrão **0,05**.
- Cor = mistura de fundo → cor das ondas pelo valor limitado a [0, 1].
### Ponteiro (ligado por padrão)
- Rastreia a posição sobre a superfície. Em volta do ponteiro, o valor do campo é reduzido em até 0,5, com queda suave (curva *smoothstep*) de 0 no raio configurado até o máximo no centro. O raio é medido em unidades da altura da área (padrão **1** = a altura inteira; a demo usa **0,3**).
- Efeito: um "buraco" escuro e difuso que acompanha o cursor sem atraso. A posição fica parada no último ponto quando o ponteiro sai.
### Pós-processamento retrô
1. **Pixelização**: a imagem é reamostrada em blocos de 2 × 2 px (tamanho configurável), usando a cor do canto de cada bloco.
2. **Pontilhado ordenado**: para cada bloco, pega-se o limiar da matriz de Bayer 8×8 (valores 0 a 63/64) correspondente à posição do bloco módulo 8, subtrai-se 0,25 e soma-se à cor × (1 ÷ (níveis − 1)).
3. Aplica-se o viés de escurecimento descrito em Aparência.
4. **Quantização**: cada canal é arredondado para o nível mais próximo entre "níveis de cor" (padrão **4** → valores 0, ⅓, ⅔, 1).
### Tempo
- Tempo = segundos decorridos desde a montagem. Com a animação desativada, o tempo fica congelado (e o ponteiro continua funcionando).
- Mudanças de parâmetros são aplicadas ao vivo, sem recriar a cena.

## Técnica de renderização em alto nível
WebGL em duas passadas: (1) um plano de tela cheia com shader de fragmento que calcula o campo de ondas com Perlin 2D, fBm turbulento e distorção de domínio; (2) uma passada de pós-processamento que pixeliza, aplica o pontilhado de Bayer e quantiza. A captura do ponteiro pode ser feita com um ouvinte de movimento direto no elemento (convertido para pixels físicos), em vez de um plano invisível.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Velocidade das ondas | número | 0,05 |
| Fator de frequência por oitava | número | 3 |
| Fator de amplitude por oitava | número | 0,3 |
| Cor das ondas | trio RGB 0–1 | [0,5, 0,5, 0,5] |
| Cor de fundo | trio RGB 0–1 | [0, 0, 0] |
| Níveis de cor por canal | número (≥ 2, aceita fracionário) | 4 |
| Tamanho do macropixel | número (px) | 2 |
| Desativar animação | booleano | falso |
| Interação com o ponteiro | booleano | verdadeiro |
| Raio da mancha do ponteiro | número (fração da altura) | 1 |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto.
- Valores (tema escuro): ondas `#808080`, fundo preto, raio do ponteiro **0,3**, 4 níveis, amplitude 0,3, frequência 3, velocidade 0,05, ponteiro ligado, animação ligada, macropixel 2.
- Tema claro: enquanto as cores estiverem nos padrões, as ondas viram **RGB 0,32 / 0,30 / 0,36** (≈ `#524d5c`, cinza-arroxeado escuro) e o fundo **branco**.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Retro dithered waves to enhance your UI"**, centralizados (aproximação: selo pequeno translúcido; título ~2,5rem, peso 600, branco no tema escuro). Recomenda-se que a sobreposição não bloqueie o ponteiro.
- Controles (ao vivo): cor das ondas; fundo; níveis de cor 2,5–40 (0,1); amplitude 0–1 (0,01); frequência 0–10 (0,1); chave para desativar animação; velocidade 0–0,1 (0,01, desabilitada se a animação estiver desativada); chave de interação; raio do ponteiro 0–2 (0,1, desabilitado sem interação).

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, iniciar com a animação desativada.
- Recomendação: pausar o render fora da tela ou com a aba oculta.
- Em telas de toque, a mancha segue o dedo enquanto ele arrasta; não é necessário suporte extra.
- O macropixel é medido em pixels de tela com densidade 1, então o visual retrô é igual em qualquer tela (fica levemente borrado em telas de alta densidade, de forma intencional).

## Observações de fidelidade
- **Recomendação**: com raio 0 (permitido pela demo), a queda suave degenera; tratar como "sem mancha".
- **Recomendação**: valores de níveis ≤ 1 causam divisão por zero; impor mínimo de 2.
- **Recomendação**: a referência preserva o buffer de desenho sem necessidade; não é preciso reproduzir.
