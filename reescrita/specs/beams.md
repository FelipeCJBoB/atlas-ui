# Especificação: Feixes ondulados (beams)

## Propósito
Fundo 3D com uma fileira de faixas verticais longas (como fitas ou lâminas de tecido) lado a lado, que se ondulam suavemente em profundidade. Uma luz direcional produz realces brilhantes nas dobras, gerando "feixes de luz" que deslizam devagar pela tela. Um grão fino de ruído dá textura de filme. Sem interação.

## Aparência
- **Contêiner**: superfície de desenho em posição relativa ocupando 100% × 100% do pai.
- **Fundo**: cor sólida de cena, padrão **`#000000`**.
- **Faixas**: N retângulos verticais (padrão **12**), cada um com largura **2** e altura **15** unidades de mundo, colocados lado a lado **sem espaçamento** e centralizados horizontalmente (largura total = N × largura). Cada faixa tem 100 subdivisões na altura (para poder ondular).
- **Câmera**: perspectiva, campo de visão vertical de **30°**, em (0, 0, 20), olhando para a origem. A altura visível no plano z = 0 é ≈ **10,7 unidades**, então faixas de altura 15 ultrapassam o topo e a base (as pontas nunca aparecem).
- **Rotação do conjunto**: as faixas e a luz direcional formam um grupo girado no plano da tela (eixo Z) pelo ângulo configurado (padrão **0°**; a demo usa 30°, deixando os feixes inclinados).
- **Material das faixas**: PBR padrão com cor base = cor do feixe (padrão **`#000000`**), rugosidade **0,3**, metalicidade **0,3**. Com cor base preta, as faixas são escuras e só aparecem pelos **realces especulares** da luz — listras brilhantes que acompanham as cristas das ondulações.
- **Luzes**: luz ambiente de intensidade **1**; luz direcional na cor configurada (padrão **`#ffffff`**), intensidade **1**, posicionada em (0, 3, 10) dentro do grupo girado.
- **Grão**: cada pixel é escurecido por um valor pseudoaleatório fixo (por posição de pixel, sem animar) de até 1/15 × intensidade do ruído (padrão **1,75**, isto é, até ~0,12 de escurecimento). O resultado é um grão estático e fino.
- **Saída**: mapeamento de tons fílmico e sRGB; densidade de pixels entre 1 e 2.

## Comportamento
- **Ondulação**: cada vértice da faixa é deslocado em profundidade (eixo Z) por um **ruído de Perlin 3D** (amplitude máxima ~±2 unidades) cuja entrada é:
  - a posição vertical do vértice combinada com um deslocamento aleatório por faixa (sorteado na criação, 0–300), para que cada faixa ondule de forma independente;
  - **não** depende da posição horizontal: a faixa inteira se dobra como uma fita, uniforme na largura;
  - um terceiro eixo que avança com o tempo;
  - tudo multiplicado pela escala do ruído (padrão **0,2**; menor = ondas mais longas e suaves).
- **Normais** recalculadas por diferenças finitas sobre a superfície deslocada, para que a luz siga as dobras.
- **Tempo**: um relógio interno cresce **0,1 × Δt** por quadro; a coordenada temporal do ruído é esse relógio × velocidade (padrão **2**) × 3 × escala. Com os padrões, o ruído avança ~0,12 unidade por segundo: movimento lento e contínuo, sem loop.
- **Modo claro** (desligado por padrão): após a iluminação, a cor de cada pixel é convertida em "tinta sobre papel": o brilho máximo do pixel define quanto da cor (normalizada e levemente saturada) é misturada sobre branco, com cobertura máxima de 94%. Regiões escuras viram branco; realces viram cor. O fundo da cena **não** é alterado pelo modo — use um fundo claro junto.
- **Troca de parâmetros**: cor do feixe, velocidade, intensidade e escala do ruído e modo claro recriam o material; quantidade, largura e altura recriam a geometria (com novos deslocamentos aleatórios); cor da luz, fundo e rotação são aplicados direto.

## Técnica de renderização em alto nível
WebGL com motor 3D declarativo. Uma única malha contém todas as faixas (geometria construída em código: pares de vértices por linha, triângulos entre linhas). O material é o PBR padrão do motor, estendido com: deslocamento de vértice por ruído de Perlin 3D, recálculo de normal por diferenças finitas e um pós-processamento no fragmento (grão de ruído de valor e conversão opcional para modo claro). O tempo é um valor compartilhado atualizado a cada quadro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Largura de cada faixa | número (unidades de mundo) | 2 |
| Altura de cada faixa | número (unidades de mundo) | 15 |
| Quantidade de faixas | inteiro | 12 |
| Cor da luz direcional | hex | `#ffffff` |
| Cor base das faixas | hex | `#000000` |
| Cor de fundo | hex | `#000000` |
| Velocidade da ondulação | número | 2 |
| Intensidade do grão | número | 1,75 |
| Escala do ruído | número | 0,2 |
| Rotação do conjunto no plano da tela | graus | 0 |
| Modo claro | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto.
- Valores (tema escuro): largura **3**, altura **30**, **20** faixas, luz `#ffffff`, feixe `#000000`, fundo `#000000`, velocidade 2, grão 1,75, escala 0,2, **rotação 30°**.
- Tema claro: enquanto os valores estiverem nos padrões da demo, troca para luz **`#a855f7`**, feixe **`#7c3aed`**, fundo **`#ffffff`** e grão **0,35**, com o modo claro ligado (ver Observações).
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Radiant beams for creative user interfaces"**, centralizados. Estilos exatos não constam da referência; aproximação: selo pequeno translúcido com borda sutil; título ~2,5rem, peso 600, branco (escuro no tema claro), largura máxima ~20ch.
- Controles (aplicados ao vivo): cor da luz; cor do feixe; fundo; largura 0,1–10 (0,1); altura 1–25 (1); quantidade 1–50 (1); velocidade 0,1–10 (0,1); intensidade do ruído 0–5 (0,05); escala do ruído 0,01–1 (0,01); rotação 0–360 (1).

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo.
- Recomendação: pausar o render quando fora da tela ou com a aba oculta.
- A cena é dimensionada pela altura visível (campo de visão vertical fixo): em telas largas aparecem mais faixas nas laterais; em telas estreitas, menos. Com 12 faixas de largura 2 (24 unidades) e altura visível ~10,7, a largura total cobre até proporções de ~2,2:1; acima disso aparecem bordas de fundo nas laterais.

## Observações de fidelidade
- **Recomendação**: na referência, a demo define as cores do tema claro mas a chave de modo claro nunca chega a ser ligada (o valor fica indefinido); na reimplementação, ligar o modo claro no tema claro.
- **Recomendação**: a referência recria a geometria (com novos sorteios) ao mudar quantidade/largura/altura, o que faz o padrão "pular"; aceitável, mas pode-se manter uma semente estável.
- **Recomendação**: a referência deixa configurada uma sombra na luz que nunca é usada; omitir.
