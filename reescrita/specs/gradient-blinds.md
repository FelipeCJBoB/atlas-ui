# Especificação: Persianas de gradiente (gradient-blinds)

## Propósito
Fundo em gradiente colorido cortado em "lâminas" verticais, como uma persiana: cada lâmina tem um degradê de claro para escuro que lhe dá volume, há uma granulação animada tipo estática de TV e um holofote suave que segue o ponteiro, clareando a região sob ele e escurecendo o resto. Uso: fundo de hero.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto. Superfície de desenho em bloco, 100% × 100%.
- **Mesclagem**: por padrão o contêiner usa modo de mesclagem **lighten** sobre o que está atrás (em modo claro, mesclagem normal).
- **Gradiente base**: lista de 2 a 8 cores (padrão **`#FF9FFC`** rosa-lilás → **`#5227FF`** violeta-elétrico), interpolada linearmente em segmentos iguais ao longo do eixo do gradiente. Com uma cor só, ela é duplicada (gradiente chapado). Opcionalmente **espelhado**: vai da primeira à última cor e volta (padrão triangular).
- **Eixo**: no ângulo 0 o gradiente corre da esquerda (primeira cor) para a direita (última cor) e as lâminas são faixas verticais. Um ângulo (em graus, padrão **0**) gira todo o padrão no plano, com correção de proporção para que a rotação não distorça.
- **Lâminas**: N faixas iguais ao longo do eixo (padrão **16**). Dentro de cada faixa é subtraída uma rampa linear de 0 a 1: a borda de partida da lâmina fica com a cor do gradiente cheia, a borda oposta fica até 1 unidade mais escura (frequentemente preta). Isso cria o aspecto de persiana iluminada de lado. A direção da luz pode ser "esquerda" (padrão; o lado claro de cada lâmina é o esquerdo) ou "direita" (rampa invertida).
- **Antisserrilhado das bordas das lâminas**: perto de cada junção, a rampa converge suavemente para 0,5 numa largura proporcional a (N × 1,25 ÷ menor dimensão em pixels), limitada entre 0,001 e 0,12 da largura da lâmina, para evitar serrilhado.
- **Holofote**: valor somado a todos os canais = (1 − 2 × (d ÷ raio)^suavidade) × opacidade, onde d é a distância do pixel até o ponteiro em coordenadas normalizadas 0–1 da largura e da altura (o holofote é, portanto, elíptico, acompanhando a proporção do contêiner). Raio padrão **0,5**, suavidade **1** (queda linear), opacidade **1**. Perto do ponteiro clareia até +1 (branco); a partir de metade do raio passa a escurecer, chegando a −1 ou menos longe dele. O resultado é uma área clara e "brilhante" ao redor do cursor e bordas escuras.
- **Granulação**: ruído aleatório por pixel, renovado a cada quadro, somado com amplitude ±metade da intensidade (padrão **0,3**).
- **Saída**: opaca (cor = holofote + gradiente − rampa + ruído).
- **Modo claro** (opcional): o fundo vira branco e o efeito vira "pigmento": a cor do gradiente é normalizada, tem ≈ 72% da parte neutra removida (fica mais pura), recebe um leve reforço de contraste e é multiplicada por 0,72; a cobertura sobre o branco é o maior canal do sinal (holofote + gradiente − rampa, limitado a 0–1). A granulação só escurece, com intensidade 12–18% do ruído conforme a cobertura.

## Comportamento
- **Ponteiro**: o alvo do holofote é a posição do ponteiro enquanto ele se move sobre a superfície. A posição efetiva persegue o alvo com **suavização exponencial baseada em tempo**, constante de tempo padrão **0,15 s** (fator por quadro = 1 − e^(−dt/τ)). Com suavização 0, segue instantaneamente. Ao montar, o holofote começa no **centro**. Ao sair do componente, fica parado na última posição.
- **Distorção** (padrão **0**): as coordenadas do gradiente/lâminas são onduladas por senoides cruzadas (frequência 6 por largura/altura) com amplitude 0,01 × valor; valores altos (até 100) deixam as lâminas sinuosas.
- **Largura mínima da lâmina** (padrão **60 px**): o número efetivo de lâminas é o menor entre o pedido e ⌊largura ÷ mínimo⌋ (no mínimo 1). Recalculado a cada redimensionamento.
- **Tempo**: só influencia a granulação (o gradiente em si não se move).
- **Pausa**: com pausa ligada não desenha novos quadros (a imagem congela), embora o laço continue.
- **Redimensionamento**: observado no contêiner; a resolução segue o tamanho × densidade de pixels (padrão: a do dispositivo, ou um valor fixo informado).
- **Mudança de parâmetros**: recria a cena.

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia e shader de fragmento: rotação 2D com correção de aspecto, interpolação de gradiente por segmentos, rampa "dente de serra" (parte fracionária da coordenada × N) para as lâminas, *smoothstep* nas junções, holofote por potência da distância normalizada, ruído por hash pseudoaleatório do pixel + tempo. O ponteiro é suavizado em JavaScript a cada quadro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cores do gradiente (2–8, hex) | lista | `#FF9FFC`, `#5227FF` |
| Ângulo do padrão | graus | 0 |
| Intensidade da granulação | número 0–1 | 0,3 |
| Número de lâminas | inteiro | 16 |
| Largura mínima de cada lâmina | px | 60 |
| Suavização do ponteiro (constante de tempo) | s | 0,15 |
| Gradiente espelhado | booleano | não |
| Raio do holofote (fração) | número | 0,5 |
| Suavidade do holofote (expoente) | número | 1 |
| Opacidade do holofote | número | 1 |
| Distorção ondulada | número 0–100 | 0 |
| Lado iluminado das lâminas | esquerda / direita | esquerda |
| Modo de mesclagem CSS | string | lighten |
| Modo claro | booleano | não |
| Densidade de pixels | número | a do dispositivo |
| Pausado | booleano | não |
| Classe extra | string | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores da demo: cores **`#FF9FFC`** → **`#5227FF`**, ângulo **20°**, granulação **0,5**, 16 lâminas, largura mínima 60 px, raio 0,5, distorção 0, suavização 0,15, luz à esquerda.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Smooth gradients make everything better"** (peso 600, 1,6–2,4 rem, branco); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro (o ponteiro chega ao fundo).
- Controles: duas cores; direção da luz (esquerda/direita); ângulo 0–360 (1); granulação 0–1 (0,01); lâminas 1–64 (1); largura mínima 10–200 (5); raio 0,05–1 (0,05); distorção 0–100 (1); suavização 0–1 (0,01).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar a granulação (ruído estático) e fazer o holofote saltar sem animação ou ficar fixo no centro.
- Responsivo: a largura mínima das lâminas evita faixas finas demais em telas estreitas.

## Observações de fidelidade
- Recomendação: a referência recria toda a cena sempre que recebe uma nova lista de cores, mesmo com o mesmo conteúdo (a demo passa uma lista nova a cada renderização). Comparar por conteúdo e atualizar valores sem recriar o contexto.
- Recomendação: a pausa deve também parar o laço de quadros, não só o desenho.
- A demo não ativa o modo claro no tema claro do site; recomenda-se ativá-lo nesse caso, já que a mesclagem lighten sobre fundo claro apaga o efeito.
- Recomendação: o holofote é elíptico por usar coordenadas não corrigidas pela proporção; manter isso para fidelidade (opcionalmente permitir holofote circular).
