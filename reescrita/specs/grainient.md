# Especificação: Gradiente granulado (grainient)

## Propósito
Fundo de gradiente líquido com três cores que se misturam em manchas amplas, giram e ondulam devagar, com textura de grão fotográfico por cima — o estilo "grainy gradient" de sites de produto. Não é interativo. Uso: fundo de hero ou de cartões grandes.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto. Superfície de desenho em bloco, 100% × 100%, opaca.
- **Cores padrão**:
  - cor 1 **`#FF9FFC`** (rosa-lilás claro);
  - cor 2 **`#5227FF`** (violeta-elétrico);
  - cor 3 **`#B497CF`** (lavanda acinzentada).
- **Composição**: a imagem é uma mistura de quatro "cantos" construída assim:
  - ao longo de um eixo de mistura (horizontal com ângulo **0°**, girável), duas camadas fazem transição suave: a camada A vai da cor 3 para a cor 2, e a camada B vai da cor 2 para a cor 1. A transição ocorre entre as posições −0,3 e +0,2 (em unidades em que o quadro vai de −0,5 a +0,5), deslocadas pelo equilíbrio de cor e alargadas pela suavidade;
  - ao longo do eixo vertical (do espaço já girado), a camada A domina de um lado e a camada B do outro, com transição entre +0,5 e −0,3 (também deslocadas pelo equilíbrio e alargadas pela suavidade).
  - O resultado lembra um gradiente de malha: uma diagonal de violeta separando zonas rosa-claro e lavanda.
- **Equilíbrio de cor** (padrão **0**, faixa −1 a 1): desloca todas as fronteiras ao mesmo tempo, favorecendo um lado ou outro.
- **Suavidade da mistura** (padrão **0,05**): alarga as zonas de transição.
- **Grão**: ruído branco pseudoaleatório por pixel, somado com amplitude ±metade da intensidade (padrão **0,1**). A escala do grão (padrão **2**) altera o padrão de amostragem. Estático por padrão; se animado, o padrão desliza devagar com o tempo.
- **Pós-processamento**, nesta ordem:
  1. contraste em torno do cinza médio (padrão **1,5**);
  2. saturação relativa à luminância (pesos 0,2126 / 0,7152 / 0,0722; padrão **1**);
  3. gama (padrão **1**; a cor é elevada a 1 ÷ gama);
  4. limite 0–1.
- **Modo claro** (opcional): a imagem é clareada para um "lavado" pastel sobre branco: a cor é decomposta em matiz normalizada e croma; a cobertura sobre o branco é 0,12 + 1,15 × croma + 0,18 × energia (limitada a 0–0,88), e a tinta é 58% da matiz normalizada + 18% da cor original.

## Comportamento
- **Tempo**: segundos desde a montagem × velocidade (padrão **0,25**).
- **Rotação orgânica**: todo o espaço é girado por um ângulo de 180° + (r − 0,5) × quantidade de rotação (padrão **500°**), em que r é um **ruído de gradiente 2D suave** (tipo Perlin, interpolação cúbica suave) avaliado em (0,1 × tempo, x × y) × escala do ruído (padrão **2**). Como o ruído depende do produto x·y, o ângulo varia pelo espaço e as manchas giram em redemoinho, lentamente e de forma não repetitiva. A rotação é feita com correção de proporção para não deformar.
- **Ondulação (warp)**: depois da rotação, a coordenada X recebe um deslocamento senoidal em função de Y (frequência **5**) e a coordenada Y recebe um deslocamento senoidal em função do novo X (frequência 1,5 × 5), ambos com fase que avança com tempo × velocidade da ondulação (padrão **2**). A amplitude é força ÷ amplitude-base: com força **1** e base **50**, desloca 0,02 em X e 0,04 em Y (unidades do quadro). Isso dá bordas onduladas e "líquidas" às manchas.
- **Enquadramento**: coordenadas centradas (−0,5 a 0,5), somadas a um deslocamento de centro (padrão 0, 0; faixa −1 a 1) e divididas pelo zoom (padrão **0,9**; mínimo 0,001; zoom < 1 mostra mais da composição).
- **Laço**: roda continuamente; para quando o contêiner sai da tela ou a aba fica oculta, e retoma sozinho. O relógio é de parede (não pausa o tempo).
- **Redimensionamento**: observado no contêiner; resolução = tamanho arredondado × densidade de pixels limitada a **2**; desenha imediatamente.
- **Mudança de parâmetros**: aplicada ao vivo, sem recriar o contexto.

## Técnica de renderização em alto nível
WebGL 2, triângulo de tela cheia, shader de fragmento procedural: **ruído de gradiente 2D** para o ângulo de rotação, rotação 2D com correção de aspecto, **deformação de domínio senoidal**, mistura de cores por *smoothstep* em dois eixos (gradiente bilinear suave), grão por hash do pixel, e correções de contraste/saturação/gama. Sem antialiasing.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor 1 | hex | `#FF9FFC` |
| Cor 2 | hex | `#5227FF` |
| Cor 3 | hex | `#B497CF` |
| Velocidade do tempo | número | 0,25 |
| Equilíbrio de cor | −1 a 1 | 0 |
| Força da ondulação | número | 1 |
| Frequência da ondulação | número | 5 |
| Velocidade da ondulação | número | 2 |
| Amplitude-base da ondulação (maior = mais sutil) | número | 50 |
| Ângulo do eixo de mistura | graus | 0 |
| Suavidade da mistura | número | 0,05 |
| Quantidade de rotação orgânica | graus | 500 |
| Escala do ruído de rotação | número | 2 |
| Intensidade do grão | número | 0,1 |
| Escala do grão | número | 2 |
| Grão animado | booleano | não |
| Contraste | número | 1,5 |
| Gama | número | 1 |
| Saturação | número | 1 |
| Deslocamento do centro X / Y | número | 0 / 0 |
| Zoom | número | 0,9 |
| Modo claro | booleano | não |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto. Todos os valores padrão.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Grainy gradient colors with soft motion."** (peso 600, 1,6–2,4 rem); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro.
- Botão de recarregar que remonta o componente.
- Controles: três cores; velocidade 0–5 (0,05); equilíbrio −1–1 (0,01); força 0–4 (0,05); frequência 0–12 (0,1); velocidade da ondulação 0–6 (0,1); amplitude-base 5–80 (1); ângulo −180–180 (1); suavidade 0–1 (0,01); rotação 0–1440 (10); escala do ruído 0–4 (0,05); grão 0–0,4 (0,01); escala do grão 0,2–8 (0,1); grão animado (interruptor); contraste 0–2,5 (0,05); gama 0,4–2,5 (0,05); saturação 0–2,5 (0,05); centro X e Y −1–1 (0,01); zoom 0,3–3 (0,05).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (gradiente estático com grão).
- Responsivo: preenche qualquer proporção; as manchas escalam com o contêiner.

## Observações de fidelidade
- Recomendação: a transição vertical da referência usa uma função de suavização com os limites invertidos (resultado indefinido pela especificação, embora funcione na prática como "1 menos a transição normal"). Implementar explicitamente como transição invertida.
- Recomendação: a força da ondulação aparece no denominador (amplitude-base ÷ força); manter o significado "maior força = mais ondulação" e proteger contra zero.
- Recomendação: o relógio não pausa quando o laço para; acumular apenas o tempo animado é melhoria permitida.
- Recomendação: o grão estático depende da resolução e pode formar padrões de moiré em algumas escalas; aceitável manter.
- A demo não ativa o modo claro no tema claro do site; recomenda-se ativá-lo nesse caso ou manter o gradiente cheio (ele já funciona sobre qualquer fundo, por ser opaco).
