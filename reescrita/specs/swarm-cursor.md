# Especificação: Enxame que segue o cursor (swarm-cursor)

## Propósito
Uma área onde um pequeno enxame de partículas "líquidas" orbita o cursor como um cardume vivo. As partículas se fundem umas às outras como gotas de metaball quando se aproximam, deixam rastros que se afinam e, ao clicar, explodem para fora e depois se reagrupam. Efeito decorativo de cursor restrito ao contêiner.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai; aceita classe, estilo e atributos extras.
- **Conteúdo (opcional)**: camada absoluta cobrindo o contêiner, flex centralizado nos dois eixos, sem capturar ponteiro.
- **Superfície**: camada absoluta 100% × 100%, transparente, sem capturar ponteiro nem seleção, **por cima** do conteúdo. Densidade de pixels limitada a **1,75**.
- **Corpo do enxame**:
  - cada partícula e cada "carimbo" do rastro contribuem para um **campo escalar** com um sino gaussiano (cai como e^(−3,6·d²), com d = distância normalizada ao raio do carimbo), somado aditivamente;
  - o campo é limiarizado: o **núcleo** sólido aparece onde o campo passa do limiar de fusão (padrão **0,77**), com transição suave de ±30% do limiar;
  - um **halo** suave aparece entre 12% do limiar e o limiar, com intensidade = brilho (padrão **0,75**) e só fora do núcleo;
  - opacidade final = (núcleo + halo × brilho × (1 − núcleo)) × opacidade (padrão **1**). Pixels com opacidade ≤ 0,002 ficam vazios.
- **Cor**: interpolada entre a cor-base (padrão **`#ffffff`**) e a cor de destaque (padrão **`#ffffff`**) proporcionalmente à densidade do campo (atinge o destaque quando o campo vale 2,4 × o limiar). Ou seja, as regiões onde as gotas se sobrepõem tendem à cor de destaque.
- **Partícula (cabeça)**: raio = tamanho (padrão **10 px**) × escala individual × 2,1; peso = 1,06 + 0,3 × escala individual. Cada partícula recebe uma escala aleatória entre **0,65 e 1,25**.
- **Rastro**: sequência de carimbos ao longo do caminho percorrido, espaçados a cada max(2, tamanho × escala × 0,5) px, no máximo **46** por partícula, com raio decrescendo como (1 − u)^0,55 ao longo do comprimento (u = fração do comprimento máximo). Para quando o raio fica menor que o espaçamento. O peso de cada carimbo é reduzido proporcionalmente para que a soma dos sobrepostos dê uma "fita" de espessura coerente. Duração máxima do rastro = 0,85 × parâmetro de rastro (padrão **0,75** → ~0,64 s).

## Comportamento

### Entrada
- **Ponteiro sobre o contêiner** (entrar e mover): define a âncora = posição local do ponteiro.
- **Ponteiro sai**: a âncora volta ao **centro** do contêiner (o enxame passa a orbitar o centro).
- **Pressionar** (se dispersão ao clicar estiver ligada e o efeito ativo): cada partícula recebe velocidade radial para longe do ponto pressionado, de módulo (620 + 130 × velocidade) × fator aleatório entre 0,75 e 1,25; inicia um **impulso** que decai linearmente de 1 a 0 em **0,5 s**.

### Física (por quadro; Δt limitado a 50 ms)
Com V = velocidade configurada (padrão **2,5**, mínimo efetivo 0,1):
- velocidade máxima = 110 + 165·V px/s; taxa de direção = 4,5 + 1,15·V; força máxima = 9 × velocidade máxima;
- faixa orbital = max(20, 0,55 × dispersão espacial) (dispersão padrão **100 px**).
- **Órbita**: cada partícula tem um raio orbital preferido que oscila lentamente por ruído suave (ruído de Perlin 3D com semente individual, tempo × 0,13), entre 0,34 e 1,69 × a faixa. A direção desejada combina:
  - uma componente **radial** (para dentro se está longe do raio preferido, para fora se está perto), saturada em ±1 ao longo de 0,85 × a faixa;
  - uma componente **tangencial** (giro) com módulo √(1 − radial²) e sentido horário ou anti-horário sorteado por partícula. Resultado: as partículas circulam em volta da âncora em ambos os sentidos, entrando e saindo.
- **Vagueio**: se o parâmetro de vagueio (padrão **0,25**) > 0, soma-se à direção um campo de fluxo **sem divergência** (rotacional do ruído de Perlin) em duas escalas — uma grossa (escala espacial 0,0016, tempo × 0,22) e uma fina (3,6× mais fina, tempo × 0,55, peso 0,7) — com peso 2,4 × vagueio. A direção é normalizada.
- **Direção**: aceleração = (direção desejada × velocidade máxima − velocidade atual) × taxa × agilidade individual (sorteada entre 0,75 e 1,25) × (1 − impulso). Durante o impulso, soma-se uma força de afastamento da âncora proporcional a 5,5 × velocidade máxima × impulso.
- **Separação**: para cada par mais próximo que max(1, 0,42 × dispersão × (0,35 + separação)), uma repulsão linear (1 − d/limite) × velocidade máxima × 3,2 × separação (separação padrão **0,15**).
- A aceleração é limitada à força máxima × (1 + 4 × impulso). A velocidade é limitada a [0,32 × máx, máx × (1 + 3,5 × impulso)] — as partículas **nunca param**.
- Integração de Euler simples.

### Histórico e rastro
Posições gravadas num anel de **120** amostras a no máximo uma a cada **8 ms**; o rastro é construído percorrendo o histórico de trás para frente enquanto a idade for menor que a duração do rastro.

### Quantidade
Padrão **10** partículas (limite 1–120, arredondado). Ao aumentar, as novas nascem em volta da âncora (ângulo aleatório, raio de 40 a 160 px, velocidade inicial de 60 px/s para fora). Inicialmente todas nascem em volta do centro.

### Desativado / movimento reduzido
A simulação para; apenas a composição é desenhada novamente.

### Ajustes
Todos os parâmetros são lidos ao vivo, a cada quadro. Redimensionamento por observação do contêiner.

## Técnica de renderização em alto nível
WebGL em duas passagens:
1. **Campo**: todas as cabeças e carimbos são desenhados como quadrados (até 6000), com mistura aditiva, num alvo fora da tela do tamanho da superfície; cada quadrado escreve uma gaussiana ponderada.
2. **Composição**: um triângulo de tela cheia lê o campo e aplica limiar suave (técnica de **metaballs**), halo e gradiente de cor.
A simulação (direção de enxame no estilo *boids* + ruído de Perlin com rotacional) roda na CPU em arrays tipados.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor-base | cor hex | `#ffffff` |
| Cor nas regiões mais densas | cor hex | `#ffffff` |
| Quantidade de partículas | inteiro 1–120 | 10 |
| Tamanho (raio-base) | número (px) | 10 |
| Limiar de fusão (menor = mais "pegajoso") | número | 0,77 |
| Intensidade do halo | número 0–1 | 0,75 |
| Opacidade geral | número 0–1 | 1 |
| Raio da nuvem em volta do cursor | número (px) | 100 |
| Força de separação | número | 0,15 |
| Velocidade (escala 1–10) | número | 2,5 |
| Vagueio pelo campo de fluxo | número | 0,25 |
| Comprimento do rastro | número 0–1 | 0,75 |
| Dispersar ao clicar | booleano | verdadeiro |
| Efeito ativado | booleano | verdadeiro |
| Conteúdo sobre o qual o enxame se move | nós React | nenhum |
| Classe/estilo/atributos extras | — | — |

## Demo
- Área de prévia com **450 px de altura**, sem padding, overflow oculto, fundo do site.
- Valores da demo: quantidade **8**, tamanho **5**; demais iguais aos padrões.
- Cores por tema: escuro → base e destaque `#ffffff`; claro → base **`#27272a`** e destaque **`#52525b`** (quando o usuário não trocou a cor).
- Conteúdo: coluna centralizada, sem seleção nem ponteiro, espaço de 0,5rem entre: título **"Move your cursor"** (2,6rem, peso 600, espaçamento −0,02em; branco no escuro, `#27272a` no claro) e subtítulo **"a living swarm follows — click to scatter it"** (1rem; `rgba(255,255,255,.5)` no escuro, `#d4d4d8` no claro).
- Controles: cor e cor de destaque; quantidade 6–40; tamanho 1–80; fusão 0,15–1,6 (0,01); halo 0–1; opacidade 0,1–1; nuvem 30–320 (5); separação 0–1,5; velocidade 1–10 (0,1); vagueio 0–1,2; rastro 0–1; chaves "dispersar ao clicar" e "ativado".

## Acessibilidade e responsividade
- Decorativo: superfície com `aria-hidden`; nunca captura ponteiro ou foco; o conteúdo filho segue acessível (mas, atenção, fica sem eventos de ponteiro no invólucro de conteúdo — os filhos devem reativar ponteiro se forem interativos).
- Respeita `prefers-reduced-motion` (sem simulação).
- Toque: o enxame segue o dedo durante o arraste; ao soltar, volta ao centro; toque dispersa.
- Acompanha o tamanho do contêiner.

## Observações de fidelidade
- **Defeito a corrigir (recomendação)**: a referência cria um novo alvo de renderização a cada redimensionamento sem liberar o anterior (vazamento de memória de GPU). Redimensionar o existente.
- **Defeito a corrigir (recomendação)**: com o efeito desativado ou movimento reduzido, a composição é desenhada sem campo válido. Nesse caso, limpar a superfície (ou desenhar uma vez o enxame parado).
- **Recomendação**: a separação é O(n²); está ok até 120 partículas.
- **Recomendação**: ao desativar, considerar parar o laço por completo em vez de redesenhar.
