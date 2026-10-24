# Especificação: Seda (silk)

## Propósito
Fundo animado que imita um tecido de seda/cetim monocromático: dobras diagonais suaves e brilhantes que ondulam lentamente, com uma leve granulação de filme por cima. Usado como pano de fundo opaco de seções e heróis.

## Aparência
- **Contêiner**: superfície que preenche 100% × 100% do pai (o pai define o tamanho). Saída **opaca** (cobre o que estiver atrás).
- **Cor**: uma única cor base (padrão do componente **`#7B7481`**, lilás acinzentado; a demo usa **`#5227FF`**, violeta). O padrão de dobras multiplica a cor por um fator entre **0,2 e 1,0**, então a imagem vai de quase preto (vales das dobras) até a cor plena (cristas). Não há realces brancos no modo normal.
- **Dobras**: faixas diagonais (inclinadas a ~45°, de baixo-esquerda para cima-direita no espaço da textura) com espessura irregular, porque a coordenada é deformada por um termo cossenoidal; sobre elas corre uma ondulação fina de alta frequência (cerca de 4× mais densa) que dá aspecto de trama/cetim.
- **Granulação**: ruído pseudoaleatório por pixel, **estático** (não muda com o tempo), subtraído da cor. Amplitude = valor aleatório em [0, 1) ÷ 15 × intensidade de ruído (padrão **1,5**, ou seja, até ~0,1 de escurecimento por canal).
- **Modo claro opcional** (desligado por padrão e não usado na demo): em vez de multiplicar a cor, interpola entre uma "sombra" (cor × 0,72) e um "corpo" (cor × 1,18, limitado a 1) conforme a dobra (transição suave entre 0,28 e 0,9 do padrão) e acrescenta brilho especular quase branco nas cristas (transição entre 0,72 e 0,98, misturando até 92% de branco). A granulação no modo claro é centrada em zero (soma de dois ruídos menos 1) com força de intensidade × 0,038, limitada a 0,16. Resultado: seda clara com reflexos.

## Comportamento
- **Tempo**: avança **0,1 unidade por segundo** real (acumulado quadro a quadro). O deslocamento de fase é velocidade × tempo; com o padrão **5**, isso dá 0,5 unidade de fase por segundo — movimento lento e contínuo.
- **Coordenadas**: as coordenadas de textura do plano (0–1 em cada eixo) são multiplicadas pela escala, giradas pelo ângulo de rotação (radianos, padrão **0**) e multiplicadas de novo pela escala. Na prática a densidade das dobras cresce com o **quadrado** da escala (padrão **1**).
- **Ondulação vertical**: a coordenada vertical recebe um desvio senoidal pequeno (amplitude 0,03, frequência 8 ao longo de x) que corre com o tempo, dando a sensação de tecido ondulando.
- **Padrão das dobras** (ideia): 0,6 + 0,4 × seno de uma soma de (a) a diagonal x+y somada a um cosseno de combinação linear de x e y (deformação de domínio), deslocada lentamente com o tempo (fator 0,02), multiplicada por 5, e (b) um seno de alta frequência (fator 20) da diagonal deslocada pelo tempo (fator 0,1). A parte (b) se move mais rápido que a (a), criando o brilho "correndo" sobre as dobras.
- **Proporção**: o plano é esticado para preencher a área; o padrão é calculado nas coordenadas de textura, portanto se **estica** com a proporção do contêiner (não é corrigido por aspecto).
- **Sem interação**: não reage a ponteiro, teclado ou rolagem. Anima o tempo todo.
- **Mudança de parâmetros**: cor, velocidade, escala, ruído, rotação e modo claro podem ser alterados ao vivo sem recriar a cena.

## Técnica de renderização em alto nível
WebGL com um único retângulo preenchendo a viewport e um shader de fragmento. Padrão procedural baseado em **ondas senoidais com deformação de domínio** (seno de uma coordenada perturbada por cosseno) e um **hash pseudoaleatório por pixel** para o grão. A referência usa uma cena 3D com câmera em perspectiva apenas para mostrar esse plano; uma reimplementação com WebGL puro e um triângulo de tela cheia é equivalente e mais leve. Densidade de pixels entre 1 e 2. Sem texturas nem assets.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Velocidade da animação | número | 5 |
| Escala do padrão (densidade cresce com o quadrado) | número | 1 |
| Cor base | string hex de 6 dígitos | `#7B7481` |
| Intensidade da granulação | número (0 desliga) | 1,5 |
| Rotação do padrão | número (radianos) | 0 |
| Modo claro (seda clara com reflexos especulares) | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto.
- Componente com velocidade 5, escala 1, cor **`#5227FF`**, ruído 1,5 e rotação 0, preenchendo a área.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro no topo com logotipo genérico (SVG próprio) e links; no centro uma pílula **"New Background"**, o título **"Silk touch is a good enhancement, Steve!"** e dois botões (sólido e vidro). Sem captura de ponteiro.
- Controles: velocidade 0,1–20 (0,1); escala 0,1–5 (0,1); ruído 0–10 (0,1); rotação 0–2π (0,01); cor (seletor). Cada mudança remonta o componente.
- O efeito anima sozinho; não precisa de animação automática extra.

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (quadro estático).
- Garantir contraste suficiente do texto sobreposto: o fundo varia de quase preto a cor plena.
- Responsivo: preenche qualquer tamanho; o padrão se estica com a proporção.

## Observações de fidelidade
- A escala é aplicada duas vezes na referência (efeito quadrático). Manter para fidelidade visual, mas documentar; alternativa recomendada: escala linear com o valor padrão reproduzindo o mesmo visual em 1.
- A granulação é estática (não depende do tempo) — reproduzir assim; um grão animado mudaria o caráter do efeito.
- O hash da granulação usa o produto de senos de coordenadas de pixel; qualquer hash por pixel com distribuição uniforme serve.
- Recomendação: pausar o laço quando o componente estiver fora da viewport ou a aba oculta (a referência renderiza sempre).
- O padrão não corrige proporção; em contêineres muito largos as dobras ficam esticadas. Fidelidade: manter; opcionalmente oferecer correção de aspecto como melhoria desligada por padrão.
