# Especificação: Estilhaços ao vento (aero-shards)

## Propósito
Fundo animado em que milhares de pequenos estilhaços facetados (como lascas de pérola ou cromo) viajam juntos ao longo de uma corrente, formando uma "escultura de vento" iluminada como em estúdio. A corrente pode ocupar a tela toda, um lado ou o centro, e pode se transformar em vórtice ou fita sem reiniciar. O cursor afasta (ou atrai) os estilhaços, um clique solta uma onda de choque luminosa e segurar o clique reúne os estilhaços numa nuvem girando em volta do cursor. Há modos estilizados de pontilhado e ASCII. Decorativo, para heros.

## Aparência

### Contêiner
- Posicionamento relativo, 100% × 100% do pai, overflow oculto, **não captura ponteiro** (a interação é escutada na janela), isolamento de empilhamento próprio, fundo sólido na cor de fundo (padrão **`#120F17`**, roxo-quase-preto) e oculto para tecnologias assistivas. Aceita classe extra.
- Superfície de desenho absoluta cobrindo tudo, começando com opacidade 0 e aparecendo (opacidade 1) após o primeiro quadro desenhado, em **650 ms** com curva `cubic-bezier(0.22, 1, 0.36, 1)` (sem transição se movimento reduzido).

### Estilhaço
- Forma: um **losango dobrado** ao longo do eixo longo. Quatro vértices: topo e base no eixo longo (meia-altura 1), laterais a ±0,72; a aresta central (topo–base) é projetada para a frente (dobra de 0,34), formando duas facetas planas como um vinco de papel. Variação individual: largura 0,72–1,08×, comprimento 0,82–1,12× e leve assimetria lateral.
- **Vinco**: uma linha clara estreita no eixo central (some perto das pontas), mais brilhante que as facetas.
- **Tamanho**: base ≈ 1,3% da altura da área × fator de detalhe × multiplicador de tamanho (padrão **1,1**) × escala individual (0,46–1,04, com raros estilhaços até ~2,6× maiores) × profundidade (0,56× ao fundo até 1,58× à frente). Comprimento = 1,26 × tamanho × alongamento (padrão **1**, ligeiramente maior com velocidades altas, +até 4%); largura = 0,72 × tamanho.
- **Orientação**: alinhado à direção de viagem e girando ("rolando") em torno dela continuamente; cada estilhaço tem ângulo inicial e sentido/velocidade de rolagem próprios (de −1,5 a +1,7 × giro × 2,4 rad por unidade de distância percorrida; giro padrão **1**).
- **Antisserrilhado** analítico das bordas do losango, com largura proporcional à suavidade de borda (padrão **2**); sem desfocar a imagem.

### Cores e iluminação (por faceta, sombreamento plano)
- **Cor do corpo** (padrão **`#896ABD`**, lilás acinzentado), **cor de destaque** (padrão **`#A855F7`**, violeta), **cor de realce** = destaque misturado com branco pela proporção do material.
- **Neblina de profundidade**: estilhaços ao fundo tendem ao destaque escurecido (52%); à frente, à cor do corpo. A exposição vai de 42% (fundo) a 100% (frente) e a opacidade de **0,58 a 0,97**.
- Luz principal vinda de cima-esquerda-frente; difusa fraca (10% + 30% × difusa); **especular** de Blinn com expoente entre 92 (liso) e 9 (áspero); **Fresnel** de 4ª potência nas bordas, misturando corpo e destaque.
- **Iluminação de estúdio por reflexo**: duas "caixas de luz" suaves refletidas — uma larga e horizontal no alto à esquerda (cor de realce) e uma faixa alta e estreita à direita (cor de destaque). Ao mover o cursor, a luz principal e as caixas se deslocam levemente (até ±0,19 na horizontal e ±0,12 na vertical, proporcional à presença do cursor), fazendo os reflexos varrerem a escultura.
- **Materiais** (rugosidade / brilho / emissão / mistura do realce com branco):
  - **pérola** (padrão): 0,46 / 0,92 / 0,54 / 0,78;
  - **cromo**: 0,10 / 1,12 / 0,38 / 0,90, com reflexos extras somados (aparência metálica);
  - **cetim**: 0,74 / 0,84 / 0,42 / 0,66, com 56% da cor substituída por uma difusa simples da cor do corpo (aparência fosca).
- Multiplicador de emissão (padrão **1**) aplicado ao brilho das bordas e reflexos.
- **Mapeamento de tons ACES** (filme) com exposição 1,12 em fundos escuros.
- **Fundos claros**: se a luminância do fundo passar de 0,58 (transição suave até 0,82), ativa-se uma luz de preenchimento na paleta (os estilhaços continuam coloridos em vez de lavados), exposição cai para 0,96 e o brilho (bloom) vira uma névoa colorida em vez de soma de luz.
- Mistura com alfa pré-multiplicado, sem teste de profundidade.

### Pós-processamento (em ordem)
1. **Estilização** opcional (ver Modos).
2. **Brilho (bloom)**, intensidade padrão **0,5**: extrai o que difere do fundo acima de um limiar de luminância 0,2 (joelho de 0,12), numa resolução reduzida (25% da área CSS, 22% e 18% sob carga), desfoca com filtro gaussiano separável e soma ao resultado. Em fundo claro, aplica uma névoa na cor média corpo/destaque (40%) com opacidade até 0,65 só fora dos estilhaços.
3. **Aberração cromática radial**, padrão **0,0075**: o canal vermelho é amostrado deslocado para fora e o azul para dentro, com deslocamento = intensidade × menor dimensão × r² (r = distância ao centro normalizada, saturando a 0,78). Nula no centro, máxima nos cantos.
4. **Granulação**, padrão **0,05**: ruído por pixel renovado 60 vezes por segundo, amplitude ±metade do valor, aplicado **só onde há estilhaços** (o fundo continua limpo).

## Comportamento

### Composição (posicionamento) — padrão **tela cheia**
Cada estilhaço tem uma fase própria ao longo de um caminho fechado em laço (sai por uma ponta e reentra pela outra), uma faixa lateral e uma profundidade. Caminhos (unidades: altura da área = 2; largura = 2 × proporção):
- **tela cheia**: atravessa da esquerda (−1,22 × proporção) para a direita (+1,22 × proporção) com ondulação vertical ampla (amplitude 0,54 mais harmônica de 0,12) e oscilação de profundidade de 0,22;
- **direita**: curva cúbica que desce do canto superior direito até o canto inferior, ficando no terço direito, com pequenas ondulações senoidais; deixa a esquerda livre para conteúdo;
- **esquerda**: espelho da direita;
- **centro**: laço quase circular em volta do centro (raio 0,72 ± 0,12, esticado pela proporção), percorrido no sentido anti-horário;
- **retrato** (proporção < 0,82): direita, esquerda e centro usam um caminho compacto que atravessa horizontalmente junto à base (y ≈ −0,86, arco suave de 0,28).
- Os caminhos são **reparametrizados por comprimento de arco** (tabelas de 32 amostras) para a velocidade ser uniforme ao longo deles.
- **Velocidade de viagem**: 0,34 unidade/s × velocidade (padrão **1**, 0–2).
- **Espessura da corrente**: deslocamento lateral = faixa (distribuição concentrada no meio, potência 0,72) × 0,56 × espalhamento (padrão **1**, 0,15–1,1) × perfil (mais fino nas pontas do caminho, 46%, e mais largo no meio, 100%). Cerca de 8% dos estilhaços são "soltos" e vão até 1,72× mais longe.
- **Turbulência** (padrão **1**): ondulações senoidais rápidas ao longo do caminho, laterais (0,055) e em profundidade (0,06), multiplicadas por 0,36 × turbulência.
- **Profundidade** (padrão **1**, 0–1,25): espalha os estilhaços para frente/trás; perspectiva = 1 ÷ max(0,62; 1 − 0,34·z).
- **Escala** (zoom, padrão **1**, 0,5–2,5): amplia o campo inteiro sem mudar quantidade nem tamanho relativo; mudanças de escala são suavizadas (constante de 12/s).

### Formação (fluxo) — padrão **corrente**
- **corrente**: segue o caminho da composição.
- **vórtice**: anéis concêntricos em volta do centro (deslocado para o lado da composição em 0,56 × proporção), raio de 0,16 a ~0,9 conforme a faixa; velocidade tangencial constante, então os anéis internos giram mais depressa.
- **fita**: uma fita torcida que atravessa horizontalmente, oscilando verticalmente (0,42) e girando em profundidade, com largura proporcional ao espalhamento.
- **Transições** de composição e de formação misturam as posições por pesos animados com uma **mola criticamente amortecida** de resposta 6 ÷ duração (duração padrão **1 s**, 0,2–2). Durante a troca de composição, as pontas do caminho ganham um esmaecimento para evitar costuras.

### Cursor (interação padrão **repelir**; ou **atrair**, ou **nenhuma**)
- Escuta movimento do ponteiro primário na janela; só conta dentro do retângulo do contêiner. Fora dele, a presença é desligada.
- A posição usada persegue a real com **amortecimento crítico** de resposta **26/s**; a "presença" sobe com resposta 24/s ao entrar e desce com 12/s ao sair.
- **Campo de força**: gaussiana **anisotrópica alinhada à corrente** (alongada no sentido do fluxo, levemente curvada, sem borda dura), raio = 2 × 0,18 × raio configurado (padrão **1,5**; para atrair a base é 0,27). Empurra cada estilhaço **lateralmente** (perpendicular à sua direção) e inclina sua direção: para longe ao repelir, para perto ao atrair. Força = presença × intensidade (padrão **0,5**, 0–2).

### Clique — onda de choque
- Botão principal, ponteiro primário, dentro da área, **ignorado se o alvo for link, botão, campo de formulário, elemento com papel de botão ou conteúdo editável**. Não acontece se pausado, com movimento reduzido ou velocidade 0.
- Até **4 ondas simultâneas**; um clique extra com todas ocupadas é ignorado (ondas em curso nunca são reiniciadas).
- A frente da onda se expande a **4,2 unidades/s**; o perfil temporal em cada ponto é seno(10·idade) × e^(−3,2·idade), com ataque de 0,14 s e liberação de 1,4 a 1,8 s. Desloca os estilhaços radialmente (0,28) e para a frente (0,12) e os ilumina com uma cor entre destaque e realce. Duração total = distância até o canto mais distante ÷ velocidade + 1,8 s. Intensidade = intensidade da onda (padrão **1**, 0–2) × intensidade da interação.

### Segurar para reunir (ligado por padrão)
- Mantendo o botão pressionado por mais de **0,15 s**, um valor de "reunião" sobe até 1 com mola criticamente amortecida (resposta 3,8/s; ao soltar desce com 3,2/s).
- Os estilhaços migram para uma **nuvem gaussiana** em volta do cursor (densa no centro, sem contorno duro), elíptica (0,2 × 0,16), orbitando devagar (fase avançando 0,35 + 0,5 × reunião rad/s) e com deriva suave; os mais distantes e mais ao fundo chegam depois. Ficam até 30% menores. A força de repelir/atrair é suprimida proporcionalmente.
- Ao soltar com reunião > 0,1, uma onda de choque mais forte (1 + 0,8 × reunião) parte do cursor e os estilhaços se desdobram de volta.

### Pausa, movimento reduzido e velocidade 0
O campo fica congelado: sem viagem, sem molas (tudo vai direto ao alvo), sem ondas nem reunião; apenas redesenha quando algum parâmetro muda.

### Modos estilizados (padrão **nenhum**)
- Ambos usam 40% da quantidade e estilhaços 1,75× maiores (para legibilidade), e a aberração cromática cai para 20%.
- **Pontilhado**: pontilhado ordenado com matriz de Bayer 4×4 por pixel CSS, quantizando a diferença em relação ao fundo em 3 níveis por canal.
- **ASCII**: grade de células de **3,6 × 6 px CSS**. Em cada célula, mede-se a "tinta" (contraste com o fundo) em 6 regiões (2 colunas × 3 linhas), com reforço de borda comparando a 10 pontos ao redor, e escolhe-se o caractere de um conjunto de 22 glifos bitmap 5×7 (espaço . : - = | / \ + * x < > ( ) o O # @ M W A) cuja assinatura de 6 regiões for mais próxima. O glifo é desenhado com cobertura filtrada por pixel, na cor média da cena amplificada 2,2× a partir do fundo. Fontes não são carregadas: os glifos são bitmaps embutidos.

### Quantidade, qualidade e cadência
- **Detalhe** (padrão **equilibrado**): ousado = 0,58× quantidade e 1,32× tamanho; equilibrado = 1× e 0,96×; fino = 1,15× e 0,70×. **Densidade** (padrão **1,5**, 0,5–1,5) multiplica a quantidade.
- **Qualidade automática** pelo dispositivo: largura < 640 px, ≤ 4 GB de memória ou ≤ 4 núcleos → baixa (base 1900 estilhaços, densidade de pixels até 1,5); área ≤ 360 000 px CSS com ≥ 8 GB e ≥ 12 núcleos → alta (4600, até 2); senão média (3200, até 2). Há também um teto de pixels totais (3, 6 e 8 milhões). Mínimo de 700 estilhaços. Com os padrões em qualidade média: ≈ 4800.
- **Cadência**: no máximo 60 quadros/s (mesmo em telas de 90/144 Hz, com acúmulo de prazos fracionários); 12 quadros/s se menos de 25% do componente estiver visível; parado se < 2% visível ou aba oculta.
- **Qualidade adaptativa**: se o custo médio de codificação por quadro passar de 4 ms ou houver quadros atrasados por mais de 1,8 s, reduz a quantidade para 86% e depois 72% (e a resolução do bloom), com espera mínima de 2,2 s entre mudanças; volta a subir após 15 s estáveis.

## Técnica de renderização em alto nível
**WebGPU** (a referência usa uma pequena biblioteca auxiliar). Todos os estilhaços são gerados **proceduralmente no shader de vértices** por instância (sem buffers de geometria): sementes por hash do índice, posição no caminho por curvas cúbicas/senoidais com tabelas de comprimento de arco, mistura de formações por pesos, campos de força do cursor, nuvem de reunião e ondas de choque, orientação por base ortonormal ao longo da tangente com rolagem, projeção em perspectiva simples, e sombreamento por faceta calculado no vértice (cor plana). O fragmento faz o vinco e o antisserrilhado. Pós-processamento em passagens de tela cheia: estilização (pontilhado/ASCII), pré-filtro de bloom em baixa resolução + desfoque gaussiano separável, composição final com aberração cromática e granulação.

Uma reimplementação em **WebGL2 com desenho instanciado** é viável e recomendada como alternativa (ver Observações).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor de fundo | cor hex | `#120F17` |
| Cor dos estilhaços | cor hex | `#896ABD` |
| Cor de destaque (reflexos, profundidade) | cor hex | `#A855F7` |
| Posicionamento | `direita` / `esquerda` / `centro` / `tela cheia` | `tela cheia` |
| Formação | `corrente` / `vórtice` / `fita` | `corrente` |
| Material | `pérola` / `cromo` / `cetim` | `pérola` |
| Detalhe | `ousado` / `equilibrado` / `fino` | `equilibrado` |
| Modo estilizado | `nenhum` / `pontilhado` / `ASCII` | `nenhum` |
| Escala (zoom) | número 0,5–2,5 | 1 |
| Espalhamento em volta do caminho | número 0,15–1,1 | 1 |
| Profundidade | número 0–1,25 | 1 |
| Velocidade | número 0–2 | 1 |
| Giro (rolagem) | número 0–2 | 1 |
| Interação | `nenhuma` / `repelir` / `atrair` | `repelir` |
| Densidade | número 0,5–1,5 | 1,5 |
| Tamanho dos estilhaços | número 0,5–1,5 | 1,1 |
| Alongamento | número 0,6–1,8 | 1 |
| Turbulência | número 0–2 | 1 |
| Emissão/brilho dos reflexos | número 0–2 | 1 |
| Suavidade das bordas | número 0–2 | 2 |
| Bloom | número 0–3 | 0,5 |
| Granulação | número 0–0,12 | 0,05 |
| Aberração cromática | número 0–0,01 | 0,0075 |
| Duração das transições | número 0,2–2 (s) | 1 |
| Raio da interação | número 0,5–2 | 1,5 |
| Intensidade da interação | número 0–2 | 0,5 |
| Intensidade das ondas de clique | número 0–2 | 1 |
| Segurar para reunir | booleano | verdadeiro |
| Pausado | booleano | falso |
| Classe extra | string | vazia |
| Retorno de erro (falha de GPU) | função | nenhuma |

Valores fora das faixas são saturados nos limites.

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto; componente com todos os padrões.
- Sobreposição de demonstração do site (não faz parte do componente), centralizada e sem bloquear ponteiro: título **"Don't touch them, they are pretty sharp!"** (aproximação: ~2,5rem, peso 600, branco, largura máxima ~20ch), opcionalmente com um selo em pílula translúcido acima.
- Controles: três seletores de cor (fundo, estilhaços, destaque); seletores de posicionamento, material, detalhe, formação, modo e interação; deslizadores escala 0,5–2,5, espalhamento 0,15–1,1, profundidade 0–1,25, velocidade 0–2, giro 0–2, densidade 0,5–1,5, tamanho 0,5–1,5, alongamento 0,6–1,8, turbulência 0–2, emissão 0–2, suavidade 0–2, bloom 0–3 (passos 0,05), granulação 0–0,12 (0,0025), aberração 0–0,01 (0,0005), duração 0,2–2, raio 0,5–2, intensidade 0–2, ondas 0–2; chaves "segurar para reunir" e "pausado".

## Acessibilidade e responsividade
- Totalmente decorativo e oculto de leitores de tela; nunca captura ponteiro, e cliques sobre controles interativos sobrepostos não disparam ondas.
- Respeita `prefers-reduced-motion` (congelado, sem fade de entrada), inclusive se a preferência mudar em tempo de execução.
- Responsivo: muda de caminho em proporções retrato; quantidade e resolução se adaptam ao dispositivo e à carga.
- Retoma corretamente ao voltar à aba ou à janela (sem salto de tempo).

## Observações de fidelidade
- **Recomendação**: a referência exige WebGPU e não tem alternativa (só chama o retorno de erro e mostra a cor de fundo). Implementar em WebGL2 (instanciado) ou oferecer fallback WebGL2 quando WebGPU não estiver disponível.
- **Recomendação**: a qualidade é decidida pela largura no momento da inicialização; mudanças grandes de tamanho não reavaliam a faixa de qualidade (apenas a resolução). Aceitável.
- **Recomendação**: as tabelas de comprimento de arco podem ser calculadas numericamente na inicialização em vez de embutidas.
- **Recomendação**: liberar todos os recursos de GPU ao desmontar e ao falhar (a referência já o faz; manter).
