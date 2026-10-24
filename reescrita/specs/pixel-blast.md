# Especificação: Explosão de pixels (pixel-blast)

## Propósito
Fundo animado de "pixel art" monocromático: manchas orgânicas de ruído que evoluem lentamente são renderizadas como uma grade de pixels grossos com pontilhamento ordenado (dithering), de modo que as bordas das manchas se dissolvem em padrões de xadrez. Cliques disparam anéis de pixels que se expandem e somem; opcionalmente o ponteiro deixa um rastro "líquido" que distorce a imagem.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto, sem fundo próprio.
- **Superfície**: tela WebGL que ocupa 100% × 100% do contêiner; densidade de pixels = min(DPR, 2). Fundo **transparente** por padrão (opcionalmente preto opaco).
- **Pixel lógico**: quadrado de lado = tamanho de pixel configurado (padrão **3 px CSS**) × densidade. A grade é ancorada no centro da tela.
- **Cor**: uma única cor sólida (padrão **`#B497CF`**, lilás), exibida exatamente como o hex informado (sem deriva de gama). Onde o pixel está "aceso", a cor aparece com alfa 1; onde está apagado, totalmente transparente.
- **Formas de pixel** (escolha):
  - **quadrado**: preenche a célula inteira;
  - **círculo**: disco centrado na célula com raio de 25% do lado (diâmetro = metade da célula), bordas suavizadas;
  - **triângulo**: triângulo retângulo ocupando a metade inferior-esquerda da célula; células alternadas em xadrez espelham horizontalmente, formando um padrão de "dentes";
  - **losango**: losango centrado (meia-diagonal ~0,56 do lado), sem suavização.
- **Variação de tamanho** (opcional): cada pixel recebe um fator aleatório fixo 1 ± (variação/2), alterando a cobertura/opacidade de forma estável por célula.
- **Esmaecimento das bordas**: a opacidade cai suavemente a zero perto das quatro bordas; a largura da faixa é uma fração da tela (padrão **0,5**, ou seja, o esmaecimento chega até o centro).

## Comportamento

### Campo de ruído
- A tela é dividida em blocos de **8 × 8 pixels lógicos**; o ruído é avaliado uma vez por bloco (por isso as manchas têm contornos em degraus).
- Coordenadas do bloco normalizadas pela altura (preserva proporção) e multiplicadas pela escala do padrão (padrão **2**).
- **Ruído de valor 3D** (hash por seno, interpolação quíntica), soma de **5 oitavas** com lacunaridade **1,25** e ganho **1** (todas as oitavas com o mesmo peso), com o tempo × 0,05 como terceira dimensão — as manchas se deformam devagar.
- O valor é deslocado para que, na densidade neutra, uma parte minoritária da tela fique acesa; a densidade (0–2, padrão **1**) soma (densidade − 0,5) × 0,3 ao limiar: mais densidade = mais pixels acesos.

### Pontilhamento
- Matriz de **Bayer 8 × 8** (ordenada) aplicada por pixel lógico: o pixel acende se (valor + limiar de Bayer − 0,5) ≥ 0,5. Resultado binário, com transições em padrões regulares de xadrez/hachura.

### Anéis de clique
- Ao pressionar o ponteiro sobre a tela, registra posição e instante num buffer circular de **10** cliques (o 11º substitui o mais antigo).
- Cada clique gera um anel: raio = velocidade do anel (padrão **0,3** unidades de altura por unidade de tempo) × tempo decorrido; perfil gaussiano com espessura **0,1**; atenuação exponencial no tempo (taxa 1) e na distância (taxa 10); multiplicado pela intensidade (padrão **1**). O valor do anel substitui o do ruído quando maior (máximo), passando também pelo pontilhamento — o anel aparece como uma onda de pixels que esmaece.
- Pode ser desligado.

### Tempo
- Tempo = deslocamento aleatório inicial (0–1000, sorteado com gerador criptográfico quando disponível) + tempo real × velocidade (padrão **0,5**). Cada montagem começa num ponto diferente do padrão.

### Modo líquido (opcional, desligado por padrão)
- Mantém uma pequena textura 64 × 64 (invisível) com um rastro do ponteiro: a cada movimento sobre a tela, adiciona um ponto com direção normalizada do movimento e força = min(distância² × 10 000, 1) (coordenadas normalizadas).
- Cada ponto vive **64 quadros**: intensidade sobe em ease-out senoidal nos primeiros 30% e cai em ease-out quadrático no restante; o ponto desliza na direção do movimento enquanto envelhece. Raio do ponto = 10% da textura × fator de raio (padrão **1**), desenhado com desfoque.
- Pós-processamento: cada pixel da imagem final é deslocado na direção codificada × intensidade × força (padrão **0,1**) × uma oscilação 0,5 + 0,5·sen(tempo × frequência + fase pela intensidade), frequência padrão **4,5** — a imagem "ondula" como líquido atrás do cursor.

### Granulação (opcional, padrão 0)
Pós-processamento que soma ruído aleatório de luminância (amplitude configurável) numa grade de 1920 × 1080, mudando a 60 Hz.

### Outros
- Redimensionamento observado: atualiza resolução e tamanho de pixel.
- Mudanças de cor, forma, tamanho, escala, densidade, variação, anéis e esmaecimento aplicam-se sem recriar o contexto. Mudar suavização, modo líquido ou granulação recria o contexto.

## Técnica de renderização em alto nível
WebGL com um único quadrilátero de tela cheia e shader de fragmento procedural (ruído de valor fractal → limiar com matriz de Bayer → máscara de forma por célula → esmaecimento de borda). Os efeitos opcionais (líquido e granulação) são passes de pós-processamento sobre a imagem renderizada em textura; o rastro líquido é desenhado numa tela 2D minúscula usada como textura de deslocamento.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Forma do pixel | quadrado / círculo / triângulo / losango | quadrado |
| Tamanho do pixel | número (px CSS) | 3 |
| Cor | cor CSS | `#B497CF` |
| Suavização da superfície | booleano | ligado |
| Escala do padrão de ruído | número | 2 |
| Densidade do padrão | número 0–2 | 1 |
| Variação aleatória de tamanho por pixel | número 0–2 | 0 |
| Anéis de clique | booleano | ligado |
| Intensidade dos anéis | número | 1 |
| Espessura dos anéis | número | 0,1 |
| Velocidade dos anéis | número | 0,3 |
| Modo líquido | booleano | desligado |
| Força da distorção líquida | número | 0,1 |
| Raio do rastro líquido (fator) | número | 1 |
| Frequência da oscilação líquida | número | 4,5 |
| Velocidade da animação | número | 0,5 |
| Fundo transparente | booleano | ligado (senão, preto opaco) |
| Largura do esmaecimento de borda | número 0–0,5+ (fração da tela; 0 desliga) | 0,5 |
| Granulação | número | 0 |
| Pausar fora da tela | booleano | ligado |
| Classe / estilo extra | string / objeto | vazio |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores: forma **quadrado**, pixel **4 px**, cor **`#B497CF`**, escala 2, densidade 1, variação 0, anéis ligados, líquido desligado, velocidade 0,5, esmaecimento **0,25**.
- **Sobreposição de demonstração** (opcional, sem captura de ponteiro): navegação em vidro com logotipo genérico (SVG próprio), pílula **"New Background"**, título **"It's dangerous to go alone! Take this."**, botões "Get started"/"Learn more" e interruptor "Demo Content".
- Controles: cor; forma; tamanho do pixel 1–5 (1); escala 0,25–8 (0,25); densidade 0–2 (0,05); variação 0–2 (0,05); velocidade 0–3 (0,05); esmaecimento 0–0,5 (0,01); interruptores de anéis e líquido. Mudanças remontam o componente.
- Recomendação: como os anéis só aparecem com clique, disparar 1–2 anéis automáticos perto do centro logo após a montagem.

## Acessibilidade e responsividade
- Decorativo: ocultar a tela de leitores de tela (a referência dá ao contêiner um rótulo acessível descritivo; preferir ocultá-lo).
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (quadro estático) e desligar anéis/líquido.
- Responsivo: ajusta resolução continuamente; o pixel mantém tamanho físico constante em px CSS.
- Os eventos de ponteiro são capturados pela própria tela; conteúdo sobreposto deve deixar o ponteiro passar para que os cliques gerem anéis.

## Observações de fidelidade
- Recomendação: a opção "pausar fora da tela" não funciona na referência (a visibilidade nunca é observada). Implementar com observador de interseção.
- Recomendação: na referência, desmontar o componente não libera o contexto gráfico na primeira montagem (vazamento). Liberar sempre no desmontar.
- Recomendação: mudar a velocidade em tempo real causa salto do padrão (o tempo é recalculado como tempo total × velocidade). Acumular o tempo por quadro (dt × velocidade).
- Recomendação: atualizar a força do modo líquido em tempo real não tem efeito na referência; fazer a mudança refletir.
- Recomendação: cliques antigos permanecem no buffer para sempre (apenas atenuados); é aceitável descartá-los após alguns segundos.
- A forma losango não tem suavização na referência; suavizar é uma melhoria permitida.
