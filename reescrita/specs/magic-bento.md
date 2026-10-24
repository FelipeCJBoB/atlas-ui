# Especificação: Bento mágico (magic-bento)

## Propósito
Grade "bento" de seis cartões escuros de recursos (rótulo no topo, título e descrição embaixo) com uma camada de efeitos de ponteiro: um holofote difuso que segue o cursor sobre a seção, bordas que acendem na direção do cursor conforme a proximidade, partículas cintilantes que surgem no cartão sob o ponteiro, onda de clique, atração magnética e inclinação 3D opcionais.

## Aparência

### Grade
- Grid CSS com espaçamento de **0.5em**, padding de **0.75em** e largura máxima de **54em**. O tamanho de fonte base da grade é fluido: de **1rem** a **1.5rem**, crescendo com a largura da viewport (aprox. 0.9rem + 0.5vw). Todas as medidas em "em" partem dele.
- Seleção de texto desativada na seção; posicionamento relativo.
- **Colunas responsivas** (pela largura da viewport):
  - até 599 px: 1 coluna; a grade ocupa 90% da largura, centralizada, com padding de 0.5em;
  - de 600 a 1023 px: 2 colunas iguais;
  - a partir de 1024 px: 4 colunas iguais e mosaico fixo de 3 linhas:
    - linha 1: cartão 1 | cartão 2 | cartão 3 (ocupa colunas 3–4 e linhas 1–2);
    - linha 2: cartão 4 (colunas 1–2, linhas 2–3) | cartão 3 continua;
    - linha 3: cartão 4 continua | cartão 5 (coluna 3) | cartão 6 (coluna 4).

### Cartão
- Coluna flex com conteúdo distribuído entre topo e base; posicionamento relativo; overflow oculto.
- Proporção **4:3**, altura mínima **200 px** (**180 px** abaixo de 600 px de largura). Os cartões que ocupam 2 células esticam conforme a grade.
- Padding **1.25em**, raio **20 px**, borda **1 px `#2F293A`**, fundo **`#120F17`**.
- Peso de fonte 300, texto **branco**.
- Transição genérica de 0,3 s ease em todas as propriedades.
- **Topo**: linha flex com espaçamento 0.75em, conteúdo nas pontas; contém o rótulo (16 px).
- **Base**: coluna com título (16 px, peso 400, margem inferior 0.25em) e descrição (12 px, altura de linha 1.2, opacidade 0.9).
- **Truncamento** (ligado por padrão): título limitado a **1 linha** e descrição a **2 linhas**, com reticências.
- **Conteúdo padrão** (rótulo / título / descrição):
  1. Insights / Analytics / Track user behavior
  2. Overview / Dashboard / Centralized data view
  3. Teamwork / Collaboration / Work together seamlessly
  4. Efficiency / Automation / Streamline workflows
  5. Connectivity / Integration / Connect favorite tools
  6. Protection / Security / Enterprise-grade protection

### Cor de brilho
Uma única cor de brilho, dada como componentes RGB (padrão **132, 0, 255**, violeta `#8400FF`), é usada em partículas, ondas e holofote, sempre com alfas variáveis.

## Comportamento

### Hover simples do cartão
Ao passar o ponteiro, o cartão sobe **2 px** e ganha sombra. Com o brilho de borda ligado, a sombra vira dupla: `0 4px 20px rgba(46,24,78,0.4)` + halo `0 0 30px` na cor de brilho a 20%.

### Holofote global (ligado por padrão)
- Um disco de **800 × 800 px**, fixo à viewport, centrado no cursor, sem captar eventos, em modo de mistura *screen*, acima de tudo. É um gradiente radial da cor de brilho com alfas 0,15 (centro) → 0,08 (15%) → 0,04 (25%) → 0,02 (40%) → 0,01 (65%) → transparente (70%).
- Ouve o movimento do ponteiro no documento inteiro. Se o cursor está **fora** do retângulo da seção: holofote some (opacidade 0 em 0,3 s) e todos os brilhos de borda vão a 0.
- Dentro da seção, para cada cartão: distância efetiva = distância do cursor ao centro do cartão − metade do maior lado do cartão, saturada em 0. Com raio R (padrão **300 px**): faixa de proximidade = 0,5R, faixa de fade = 0,75R.
  - Intensidade do brilho de borda do cartão: 1 se a distância ≤ 0,5R; entre 0,5R e 0,75R cai linearmente até 0; além, 0.
  - O cartão também recebe a posição do cursor relativa a ele (em porcentagem da largura/altura) e o raio R.
- A posição do holofote persegue o cursor em **0,1 s** (desaceleração quadrática). Sua opacidade-alvo usa a menor distância entre todos os cartões: **0,8** se ≤ 0,5R, rampa linear até 0 entre 0,5R e 0,75R; transição de **0,2 s** quando sobe e **0,5 s** quando vai a 0.
- Quando o ponteiro sai do documento, holofote e brilhos se apagam (0,3 s).

### Brilho de borda (ligado por padrão)
Um anel de **6 px** de espessura sobre a borda interna do cartão, com o mesmo raio, desenhado acima do conteúdo e sem captar eventos. Ele é preenchido por um gradiente radial de raio R centrado na posição relativa do cursor: cor de brilho com alfa 0,8 × intensidade no centro, 0,4 × intensidade a 30% e transparente a 60%. Só a faixa da borda aparece (o miolo é recortado por máscara). Resultado: a borda acende do lado mais próximo do cursor, mesmo com o cursor fora do cartão.

### Partículas (ligadas por padrão)
- Na primeira entrada do ponteiro num cartão, sorteiam-se N posições aleatórias dentro dele (padrão **12**), que são reutilizadas nas entradas seguintes.
- Ao entrar, as partículas aparecem em sequência, uma a cada **100 ms**. Cada uma é um ponto de **4 px**, redondo, na cor de brilho sólida, com halo `0 0 6px` a 60% e um anel externo de 2 px a 20%.
- Entrada: escala e opacidade de 0 a 1 em **0,3 s** com leve overshoot ("back-out", intensidade 1,7).
- Em seguida, duas animações infinitas em vaivém:
  - deriva até um deslocamento aleatório de até ±50 px em X e Y e rotação aleatória até 360°, com duração aleatória de 2 a 4 s, velocidade linear;
  - opacidade oscilando entre 1 e 0,3 em 1,5 s (aceleração e desaceleração quadráticas).
- Ao sair: partículas pendentes são canceladas e as visíveis encolhem e somem em **0,3 s** ("back-in" 1,7), sendo removidas depois.
- Desligando as partículas, os cartões ficam sem elas, mas ainda podem ter inclinação, magnetismo e onda.

### Inclinação 3D (desligada por padrão)
- Ao entrar: gira 5° em X e 5° em Y em 0,3 s com perspectiva de 1000 px.
- Ao mover: rotação X = −10° × (deslocamento vertical do cursor em relação ao centro / meia altura); rotação Y = +10° × (deslocamento horizontal / meia largura). Transição de 0,1 s.
- Ao sair: volta a 0° em 0,3 s.

### Magnetismo (ligado no componente por padrão; desligado na demo)
O cartão é transladado em direção ao cursor por 5% do deslocamento do cursor em relação ao centro do cartão, em 0,3 s com desaceleração quadrática. Ao sair, volta a 0 em 0,3 s.

### Onda de clique (ligada por padrão)
Ao clicar, nasce um círculo centrado no ponto clicado, com raio igual à distância até o canto mais distante do cartão. É um gradiente radial da cor de brilho com alfa 0,4 → 0,2 (30%) → transparente (70%). Escala de 0 a 1 e opacidade de 1 a 0 em **0,8 s** (desaceleração quadrática); depois é removido.

### Desativação
Uma opção global desliga todas as animações de ponteiro (holofote, partículas, inclinação, magnetismo, onda). Elas também ficam desligadas automaticamente quando a largura da janela é **≤ 768 px**, reavaliado a cada redimensionamento.

## Técnica de renderização em alto nível
DOM + CSS. Partículas, ondas e holofote são elementos absolutamente posicionados criados sob demanda e animados por uma biblioteca de *tweens* (ou Web Animations API / implementação própria com as mesmas durações e curvas). O brilho de borda usa propriedades CSS personalizadas por cartão (posição relativa, intensidade, raio) consumidas por um pseudo-elemento com gradiente radial e máscara composta, que mostra só o anel de padding. O holofote é um único elemento de posição fixa ligado ao documento; na reimplementação, pode ser renderizado por portal.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Truncar título (1 linha) e descrição (2 linhas) | booleano | sim |
| Partículas no hover | booleano | sim |
| Holofote que segue o cursor | booleano | sim |
| Brilho de borda por proximidade | booleano | sim |
| Desligar todas as animações | booleano | não |
| Raio do holofote / brilho | número (px) | 300 |
| Quantidade de partículas por cartão | inteiro | 12 |
| Inclinação 3D | booleano | não |
| Cor de brilho | componentes RGB "r, g, b" | 132, 0, 255 |
| Onda de clique | booleano | sim |
| Atração magnética | booleano | sim |

Recomendado (não presente na referência): permitir que os seis cartões venham por parâmetro (rótulo, título, descrição, cor de fundo).

## Demo
- Área de prévia com altura automática, padding vertical de 32 px, overflow oculto e fundo escuro do site; a grade fica no fluxo, ocupando até 54em de largura.
- Valores da demo: partículas ligadas, holofote ligado, raio **400**, inclinação desligada, onda ligada, **magnetismo desligado**.
- Cor de brilho: **132, 0, 255** no tema escuro e **24, 24, 27** (quase preto) no tema claro.
- Controles: raio de 50 a 800 (passo 10) e chaves para partículas, holofote, inclinação, onda, magnetismo e desligar animações.
- Como quase tudo depende do ponteiro, recomenda-se na prévia uma animação automática na montagem: um cursor virtual percorrendo lentamente a grade (por exemplo, uma trajetória em forma de 8 em ~6 s), alimentando holofote e brilho de borda, até o primeiro movimento real.

## Acessibilidade e responsividade
- Holofote, partículas e ondas são decorativos: ocultos para leitores de tela e sem captar eventos.
- Os títulos dos cartões devem ser cabeçalhos reais. Se o cartão for clicável, deve ser link ou botão focável, com indicador de foco visível.
- Com `prefers-reduced-motion`, desligar partículas, inclinação, magnetismo e onda; manter no máximo o brilho de borda estático.
- A grade é responsiva (1/2/4 colunas) e os efeitos são desligados em telas de até 768 px.

## Observações de fidelidade
- O brilho de borda e o anel das partículas na referência usam o violeta fixo, ignorando a cor configurada. **Recomendação**: usar sempre a cor de brilho configurada.
- A referência considera o retângulo de **qualquer** seção do tipo bento ao decidir se o cursor está dentro; usar apenas a seção do próprio componente.
- Sem partículas, a referência registra ouvintes de evento a cada render, acumulando duplicatas. **Não reproduzir**: registrar uma vez e limpar ao desmontar.
- A partícula usa um halo violeta fixo; ver primeira recomendação.
- O componente injeta variáveis globais no `:root` (incluindo `color-scheme`). **Recomendação**: escopar as cores ao componente.
- A detecção de "móvel" por largura (≤ 768 px) é um atalho. Preferir também detectar ponteiro grosso (`pointer: coarse`).
