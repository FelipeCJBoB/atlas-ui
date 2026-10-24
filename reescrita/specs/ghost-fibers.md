# Especificação: Fibras fantasmas (ghost-fibers)

## Propósito
Fundo animado escuro e atmosférico: feixes de fibras finas e luminosas em azul-índigo se entrelaçam, torcem e giram devagar ao redor do centro, envoltos por uma névoa azulada, vinheta escura nas bordas e granulação de filme. Não é interativo. É pensado como fundo de seção hero com clima "etéreo/espectral".

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto. A superfície de desenho ocupa todo ele, em bloco, e é oculta de leitores de tela.
- **Fundo base**: roxo quase preto **`#120F17`** (em modo claro: branco `#FFFFFF`). A luz das fibras é somada a esse fundo.
- **Cores padrão**:
  - cor das linhas **`#140E35`** (índigo muito escuro);
  - cor do brilho **`#3437A0`** (azul-violeta).
  - Como a imagem passa por mapeamento de tons e reforço de azul, o resultado visível é um azul-índigo luminoso, mais claro no centro.
- **Elementos visuais**, somados:
  1. **Fibras**: várias camadas (padrão **4**, de 1 a 10) de linhas paralelas finíssimas e nítidas, com densidade crescente por camada; cada camada pesa 1/n (a primeira é a mais forte). Pintadas na cor das linhas.
  2. **Faixas de brilho**: por camada, bandas largas e suaves na cor do brilho que acompanham a mesma deformação das fibras, com intensidade (padrão **1,6**) dividida por 2n.
  3. **Brilho central**: mancha gaussiana no centro (queda com exp(−2,2·r²)), num tom derivado da cor das linhas (≈ 86% dela, menos ≈ 6% da cor do brilho).
  4. **Nuvem**: mancha suave de queda exponencial (exp(−1,5·r)) cujo centro passeia lentamente numa pequena elipse em torno do meio (amplitude ≈ 0,25 × 0,18, períodos de ≈ 21 s e 25 s ÷ velocidade), em tom ≈ 20% da cor das linhas + 23% da cor do brilho.
- **Vinheta**: escurecimento radial de 0,35 a 1,45 unidade do centro; nas bordas o brilho é reduzido para (1 − força) do valor; força padrão **0,8**.
- **Mapeamento de tons**: exposição exponencial (1 − e^(−cor × brilho)), com brilho padrão **2**; depois o canal azul é multiplicado por **1,25** (reforço de azul).
- **Granulação**: ruído de grão fino por pixel (soma de 5 oitavas de hash em escalas 1×, 2×, 4×, 8×, 16× com pesos decrescentes), que desliza lentamente pela tela (≈ 30 px/s para a direita e 21 px/s para baixo), com amplitude total padrão **0,05** (somada como ±0,025 em torno de zero). Resultado final limitado ao intervalo 0–1, opaco.
- **Modo claro** (opcional): fundo branco; as fibras aparecem como traços suaves numa tinta 52% da cor das linhas (opacidade máx. ≈ 30%, intensidade comprimida com expoente 1,5 e atenuada pela vinheta), e a névoa central é um véu levíssimo (2–4%) da cor do brilho. Granulação mantida.

## Comportamento
- **Tempo**: avança só enquanto o componente está animando; o passo entre quadros é limitado a **0,1 s** (sem saltos após pausas). Multiplicado pela velocidade (padrão **0,2**).
- **Espaço de coordenadas**: origem no centro, vertical −1 a 1. Dividido pela escala (padrão **2**; mínimo efetivo 0,05; escala maior = padrão maior/mais aberto) e girado por um ângulo fixo (padrão **0°**) mais rotação contínua de **0,25 rad por unidade de tempo** (já multiplicada pela velocidade, ≈ 0,05 rad/s com os padrões).
- **Por camada n (1…N), em sequência cumulativa** (cada camada deforma o espaço que a próxima recebe):
  1. **Ondulação**: o ponto é deslocado por senoides cruzadas (o deslocamento em X depende de Y e vice-versa), com amplitude padrão **0,015**, frequência **3 × n** e velocidade de fase **0,15 + 0,08 × n**.
  2. **Torção**: em coordenadas polares, o ângulo recebe um acréscimo senoidal que depende do raio (frequência radial **5**, velocidade **1,2**, defasagem n) com amplitude **0,1 rad**: anéis concêntricos que giram em sentidos alternados, torcendo as fibras.
  3. **Fibras**: linhas obtidas de |seno(x × (5 + 2 × n) + seno(3y + t))| (frequência-base **5**, espaçamento extra por camada **2**); o valor invertido é elevado à nitidez (padrão **16**), o que deixa só cristas finíssimas.
  4. **Brilho**: e^(−10 × |seno(3x + t + n)|) (queda padrão **10**), uma banda larga e macia.
- **Laço de animação**:
  - limitado à taxa configurada (padrão **60 qps**, aceita 1–120); renderiza apenas quando passou o intervalo correspondente;
  - pausa automaticamente quando o contêiner sai da área visível, quando a aba fica oculta, quando o usuário pede movimento reduzido (`prefers-reduced-motion: reduce`) ou quando a pausa é ligada; ao pausar, desenha um último quadro estático; retoma sozinho quando as condições voltam.
- **Redimensionamento**: observa o contêiner; ajusta a resolução (largura/altura arredondadas para baixo, mínimo 1) e redesenha imediatamente.
- **Mudança de parâmetros**: aplicada ao vivo, sem recriar o contexto; redesenha na hora mesmo se pausado. Só a qualidade de renderização (densidade de pixels) recria a superfície.

## Técnica de renderização em alto nível
WebGL 2 com triângulo de tela cheia, sem antialiasing, sem transparência. Tudo é procedural num shader de fragmento: **deformação de domínio** iterativa (senoides cruzadas + torção polar dependente do raio), padrões de linha por **seno com realce de potência** (cristas finas), bandas de brilho por exponencial de seno, manchas gaussianas/exponenciais, vinheta por *smoothstep* radial, mapeamento de tons exponencial e **granulação por hash** multi-oitava. Observadores de interseção, visibilidade da página e preferência de movimento controlam o laço.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor das linhas | hex | `#140E35` |
| Cor do brilho | hex | `#3437A0` |
| Velocidade geral | número | 0,2 |
| Escala do padrão | número | 2 |
| Rotação inicial | graus | 0 |
| Velocidade de rotação | rad por unidade de tempo | 0,25 |
| Número de camadas | inteiro 1–10 | 4 |
| Amplitude da ondulação | número | 0,015 |
| Frequência da ondulação | número | 3 |
| Velocidade da ondulação | número | 0,15 |
| Velocidade extra por camada | número | 0,08 |
| Amplitude da torção | rad | 0,1 |
| Frequência radial da torção | número | 5 |
| Velocidade da torção | número | 1,2 |
| Frequência-base das fibras | número | 5 |
| Densidade extra de fibras por camada | número | 2 |
| Nitidez das fibras (expoente) | número | 16 |
| Queda do brilho | número | 10 |
| Intensidade do brilho | número | 1,6 |
| Exposição | número | 2 |
| Reforço de azul | número | 1,25 |
| Vinheta | 0–1 | 0,8 |
| Granulação | número | 0,05 |
| Modo claro | booleano | não |
| Qualidade (densidade de pixels, limitada a 0,5–2) | número | 1 |
| Taxa máxima de quadros | qps | 60 |
| Pausado | booleano | não |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto. Componente com todos os padrões.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Light woven from the quiet parts of the spectrum."** (peso 600, 1,6–2,4 rem, entrelinha 1,1, branco); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro.
- Botão de recarregar que remonta o componente.
- Controles: duas cores; velocidade 0–2 (0,01); escala 0,4–2 (0,01); rotação −180–180° (1); velocidade de rotação −0,4–0,4 (0,01); camadas 1–10; amplitude 0–0,3 (0,005); frequência da onda 0,5–6 (0,05); velocidade da onda −2–2 (0,05); velocidade por camada −0,3–0,3 (0,01); torção 0–0,5 (0,005); frequência da torção 0,5–12 (0,1); velocidade da torção −3–3 (0,05); frequência das fibras 1–10 (0,1); espaçamento 0–4 (0,05); nitidez 1–16 (0,25); queda do brilho 1–16 (0,25); intensidade 0–3 (0,05); exposição 0,2–4 (0,05); reforço de azul 0,5–2 (0,01); vinheta 0–1 (0,01); granulação 0–0,12 (0,0025); interruptor de modo claro; seletor de qualidade (0,75 "Performance", 1 "Balanced", 1,25 "Crisp", 1,5 "Sharp", 2 "Ultra"); seletor de taxa (24, 30, 45, 60 qps); interruptor de pausa.

## Acessibilidade e responsividade
- A superfície é marcada como oculta para tecnologias assistivas; não focável, sem interação.
- Já respeita `prefers-reduced-motion` (fica estático) e pausa fora da tela ou com a aba oculta. Manter esse comportamento.
- Responsivo: preenche qualquer tamanho; o padrão escala pela altura.

## Observações de fidelidade
- A demo não troca para o modo claro quando o site está no tema claro; recomenda-se ligá-lo automaticamente nesse caso.
- Recomendação: validar as cores (a referência aceita só hex e cai para branco se inválido); aceitar qualquer cor CSS é melhoria permitida.
