# Especificação: Rastro de imagens (image-trail)

## Propósito
Uma área em que mover o mouse "carimba" uma sequência de imagens (cartões fotográficos) ao longo do caminho do cursor: a cada certa distância percorrida, a próxima imagem da lista surge sob o cursor, desliza até ele e some com um efeito que depende da variante escolhida (8 estilos). Efeito decorativo para portfólios e heros.

## Aparência
- **Contêiner**: 100% × 100% do pai, posicionamento relativo, empilhamento **100** (fica acima de outros elementos da área), raio 8 px, fundo transparente, overflow **visível** (imagens podem ultrapassar as bordas; o pai da demo corta).
- **Cartão de imagem** (um por item da lista, todos pré-criados e invisíveis):
  - largura **190 px**, proporção **1,1 : 1** (altura ≈ 173 px);
  - raio **15 px**, overflow oculto;
  - posicionado de forma absoluta no canto superior esquerdo e movido por transformação (translação X/Y);
  - opacidade inicial 0;
  - dica de desempenho para transformação e filtro.
- **Miolo do cartão**: camada com a imagem como fundo, centralizada e em modo "cobrir", **20 px maior** que o cartão (10 px de sobra em cada lado), para permitir animar escala/brilho do miolo sem mostrar bordas.

## Comportamento

### Mecânica comum a todas as variantes
- Escuta movimento de **mouse** e de **toque** sobre o contêiner; posição relativa ao contêiner.
- O laço de animação só começa no primeiro movimento.
- Mantém três posições: a do ponteiro, a da última imagem disparada, e uma posição "atrasada" que persegue o ponteiro por interpolação linear por quadro (fator **0,1** nas variantes 1–5 e 8; **0,3** nas variantes 6 e 7).
- Quando a distância entre o ponteiro e a posição da última imagem disparada passa de **80 px**, dispara a próxima imagem e atualiza essa posição. (A posição inicial de referência é o canto (0, 0), então a primeira imagem costuma surgir logo no primeiro movimento.)
- As imagens são usadas em ciclo (a primeira exibida é a segunda da lista, depois a terceira…, voltando ao início).
- Cada nova imagem fica acima das anteriores (camada de empilhamento crescente). Quando nenhuma imagem está animando, o contador de camadas volta a 1.
- Disparar uma imagem que ainda está animando interrompe a animação anterior dela.
- Em todas as variantes, a imagem nasce centrada na posição atrasada e anima até ficar centrada no ponteiro atual (o que dá a sensação de "chegar" ao cursor).
- Redimensionar a janela reposiciona todas as imagens no estado inicial (invisíveis, escala 1).
- Nomenclatura de curvas abaixo: "saída quadrática/cúbica/quártica/quíntica" = curvas de desaceleração de potência 2/3/4/5; "saída exponencial" = desaceleração exponencial.

### Variante 1 — deslizar e encolher (padrão)
- 0–0,4 s: opacidade 1, escala 1, desliza até o cursor (saída quadrática).
- 0,4–0,8 s: some (opacidade 0) e encolhe até 0,2 (saída quártica).

### Variante 2 — surgir com clarão
- 0–0,4 s: escala do cartão 0 → 1 e desliza (saída quadrática); o miolo vai de escala 2,8 e brilho 250% para escala 1 e brilho 100%.
- 0,45–0,85 s: some e encolhe até 0,2 (saída cúbica).

### Variante 3 — subir flutuando
- 0–0,4 s: escala 0 → 1 e desliza (saída quadrática); miolo 1,2 → 1.
- 0,6–1,2 s: some, encolhe até 0,2, sobe o equivalente a **2× a própria altura** e se desloca na horizontal por um valor aleatório entre −30% e +30% da largura (saída cúbica).

### Variante 4 — inércia na direção do movimento
- Calcula a direção e a intensidade do movimento (vetor entre posição atrasada e ponteiro; intensidade = comprimento / 100).
- 0–0,4 s: escala 0 → 1, desliza; miolo de escala 2 → 1 com brilho e contraste iniciais = max(4 × comprimento %, 100%) → 100% (movimentos rápidos dão clarão).
- 0,4–0,8 s: opacidade → 0 (saída quártica).
- 0,05–1,55 s: continua deslizando na direção do movimento por direção × intensidade × 110 px (saída quíntica).

### Variante 5 — girar alinhado ao movimento
- Ângulo do movimento em graus (0–360); se entre 90° e 270°, soma 180° (para a imagem nunca ficar de cabeça para baixo). Compara com o ângulo anterior para saber o sentido de giro e começa rotacionada 10° atrás (−10° se horário, +10° se anti-horário).
- 0–1 s: escala 0,1 → 1, brilho 80% → 100%, rotação até o ângulo do movimento, e posição até o cursor + direção × (comprimento/150) × 70 px (saída cúbica).
- 0,5–0,9 s: opacidade → 0 (saída exponencial).
- 0,05–1,55 s: deriva extra de direção × (comprimento/150) × 120 px (saída quíntica).

### Variante 6 — tamanho e nitidez conforme a velocidade
- Velocidade = distância entre posição atrasada (fator 0,3) e ponteiro, mapeada linearmente com saturação:
  - escala final: 0,3 (parado) a 2 (velocidade ≥ 200);
  - brilho: 0% a 130% (velocidade ≥ 70);
  - desfoque: 20 px a 0 px (velocidade ≥ 90);
  - escala de cinza: totalmente cinza a 0% (velocidade ≥ 90; valores acima de 100% são saturados).
- 0–0,8 s: escala 0 → escala final, filtro até os valores calculados, desliza (saída quártica); miolo 2 → 1.
- 0,45–0,85 s: some e encolhe até 0,2 (entrada quártica — acelera).
- Resultado: mover devagar gera miniaturas escuras, borradas e cinzentas; rápido gera imagens grandes, nítidas e coloridas.

### Variante 7 — pilha persistente
- Cada imagem nasce com escala aleatória final entre 0,5 e 1,6 (começando 0,2–0,6 menor) e rotação inicial 0 → aleatória entre −3° e +3°, deslizando em 0,4 s (saída quártica). **Não some sozinha**.
- Mantém visíveis no máximo min(9, número de imagens − 1) imagens; ao ultrapassar, a mais antiga (a que está esse número de posições atrás no ciclo) some e cresce até escala 1,3 em 0,4 s (saída quíntica).
- Parar o mouse deixa a pilha de imagens na tela.

### Variante 8 — profundidade 3D
- O contêiner recebe perspectiva de **1000 px**.
- Pela posição do cursor relativa ao centro: rotação X = −(deslocamento vertical / meia altura) × 30°, rotação Y = (deslocamento horizontal / meia largura) × 30°.
- Proporção p = distância ao centro / distância do centro ao canto; profundidade = p × 1200 − 600; escala = 1 + profundidade/1000 (0,4 no centro, 1,6 nos cantos); brilho = 0,2 + p × 2,3 (escuro no centro, muito claro nos cantos).
- 0–1 s: desliza até o cursor com essas rotações e escala (saída exponencial).
- 0,3–0,7 s: opacidade → 0 e afasta para 800 px de profundidade (saída cúbica).

## Técnica de renderização em alto nível
DOM com transformações CSS (translação, escala, rotação 2D/3D, profundidade) e filtros CSS (brilho, contraste, desfoque, escala de cinza), animados por uma biblioteca de linha do tempo (tweens encadeados com deslocamentos de início) ou pela API de animações do navegador. Um laço por quadro acompanha a distância percorrida e a posição atrasada.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de imagens (URLs ou data URIs) | lista de strings | vazia |
| Variante de animação | inteiro 1–8 | 1 |

(Valores fixos que podem ser expostos como opcionais na reimplementação: distância de disparo 80 px, tamanho do cartão 190 px, proporção 1,1, raio 15 px.)

## Demo
- Área de prévia relativa, **400 px de altura**, overflow oculto, conteúdo centralizado, fundo do tema.
- **Imagens**: a referência usa 8 fotos 300 × 300 de banco — **não usar**. Gerar **8 imagens próprias** procedurais (SVG ou gradiente em data URI), quadradas, visualmente distintas, por exemplo: pôr do sol em degradê laranja-rosa; oceano azul com ondas; floresta verde com triângulos; deserto com dunas ocre; aurora verde-violeta; cidade noturna com retângulos iluminados; montanha nevada; campo de flores com círculos coloridos.
- Atrás do rastro (o rastro tem empilhamento 100), centralizado: texto **"Hover Me."** (tamanho fluido 2rem–6rem, 6% da viewport, peso 600, cor atenuada de instrução do tema) e abaixo **"Variant N"** (18 px, peso 600, `#a6a6a6`).
- Controle: seletor de variante 1–8 (remonta o componente).
- Para captura estática: recomenda-se que a demo simule um pequeno trajeto automático do cursor na montagem para exibir algumas imagens, já que o efeito só reage a movimento.

## Acessibilidade e responsividade
- Decorativo: as imagens do rastro devem ser ocultas de leitores de tela.
- Recomendação: com `prefers-reduced-motion`, desativar o rastro.
- Em toque, arrastar o dedo gera o rastro.
- O tamanho do cartão é fixo em px; em telas pequenas considerar reduzi-lo.

## Observações de fidelidade
- Recomendação: a referência pré-mede o tamanho de cada cartão só na montagem e no redimensionamento da janela; usar o tamanho conhecido do cartão.
- Recomendação: o laço de animação continua rodando mesmo parado; pausar quando ocioso.
- Recomendação: na variante 7, o "estado ocioso" não é restabelecido corretamente (o contador de camadas pode crescer indefinidamente); limitar.
- Recomendação: reagir também a eventos de ponteiro (caneta) e não só mouse/toque.
- Fotos remotas da referência substituídas por imagens procedurais próprias.
