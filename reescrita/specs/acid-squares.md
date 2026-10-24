# Especificação: Corredor de quadrados ácidos (acid-squares)

## Propósito
Fundo animado em tela cheia que mostra um "corredor de cristal" luminoso feito de blocos quadrados empilhados em degraus, visto em perspectiva central. A vista avança e recua suavemente (como se o corredor respirasse), as bordas mais quentes brilham em branco, as faces em rosa/violeta e as profundezas em violeta escuro. O cursor afunda a estrutura numa depressão suave. Decorativo, para heros e seções.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai, overflow oculto; aceita classe extra. A superfície WebGL é bloco 100% × 100%, **transparente** (alfa pré-multiplicado), densidade de pixels limitada a 2.
- **Composição visual**: uma estrutura simétrica em torno do centro da tela — um túnel cuja parede é quantizada em degraus quadrados (blocos "empilhados" que formam padrões em escada e quadrados concêntricos). A luz se acumula ao longo de cada raio de visão, produzindo um brilho volumétrico: as arestas onde o raio passa rente às superfícies ficam muito brilhantes; o resto se apaga em transparência.
- **Cores** (rampa de três paradas pela intensidade v, 0–1):
  - cor 1 → cor 2 de v = 0 a 0,55 (degrau suave);
  - cor 2 → cor 3 de v = 0,55 a 1;
  - padrão: **`#5227FF`** (violeta, profundezas), **`#A855F7`** (rosa-lilás, faces), **`#FFFFFF`** (branco, arestas mais quentes);
  - a cor ainda é multiplicada por v, e o alfa = v × opacidade (padrão **1**). Onde v é baixo, o fundo fica transparente.
- **Granulação de filme** (ligada por padrão): ruído por pixel, renovado a cada quadro, de amplitude ±metade da intensidade (padrão **0,05**), somado à cor e ao alfa.
- **Desfoque** (padrão **0**): quando > 0, um desfoque gaussiano separável cobre a imagem toda, com alcance de até 14 px × intensidade.
- **Modo claro** (desligado por padrão): em vez de transparente, a imagem é desenhada sobre **branco**, misturando o branco com o croma normalizado da cor (realçado levemente por uma potência de 1,16) na proporção 0,94 × alfa. Resultado: as formas aparecem coloridas sobre papel branco.

## Comportamento

### Animação
- Tempo em segundos desde a montagem.
- **Respiração**: o deslocamento de profundidade da câmera é seno(tempo × velocidade) × profundidade da onda (padrões **0,7** e **1**). Com os padrões, o ciclo completo dura ≈ 9 s; a vista avança e recua suavemente, sem avanço contínuo.
- **Cintilação de cor** (padrão **0**, desligada): modula o brilho entre 70% e 105% com cossenos do tempo × taxa somados à posição final do raio.

### Raio por pixel (ideia matemática)
- Coordenadas centradas e normalizadas pela altura; direção do raio = coordenada × 0,5 ÷ zoom (zoom padrão **1,3**; mínimo 0,05).
- **Marcha com passo crescente**: até N iterações (detalhe: **baixo 20**, **médio 32** (padrão), **alto 48**). A cada iteração, o ponto avança ao longo do raio (direção na tela + avanço em profundidade) e calcula-se uma "distância" combinando:
  - a densidade (padrão **10**, mínimo 1), que define o raio do túnel;
  - menos a distância do ponto ao eixo do túnel (no plano horizontal-profundidade);
  - mais o comprimento do vetor das coordenadas **arredondadas para cima** (função teto) do ponto, o que cria os degraus quadrados.
  - O próximo passo = passo mínimo (padrão **0,002**) + |distância| × espalhamento (padrão **0,3**, limitado a 0,05–0,6).
- **Brilho acumulado**: soma de ganho de brilho (padrão **1**) ÷ passo em cada iteração. Passos pequenos (raio rente à superfície) somam muito brilho.
- **Mapeamento de tons**: e = brilho ÷ exposição (padrão **2700**, mínimo 1; maior = mais escuro); v = tangente hiperbólica(e × brilho geral (padrão **1**) × fator de cintilação); depois contraste em torno de 0,5 (padrão **1**) e saturação em [0, 1].

### Interação com o cursor (ligada por padrão)
- Ao mover o mouse sobre o contêiner, a posição alvo é guardada em coordenadas normalizadas (−1 a 1, Y para cima). A posição usada no desenho persegue o alvo com fator **0,05 por quadro** (suavização exponencial). Um "nível de atividade" também sobe/desce para 1/0 com o mesmo fator ao entrar/sair.
- **Depressão**: ao redor do cursor, uma gaussiana de raio (padrão **0,35** da altura) desloca a estrutura verticalmente por até 3 × força (padrão **0,1**) × atividade — o reticulado "afunda" em volta do ponteiro.

### Ciclo de vida e desempenho
- Redimensionamento por observação do contêiner (redesenha imediatamente).
- O laço **pausa** quando o contêiner sai da tela (observador de interseção) ou a aba fica oculta, e retoma ao voltar.
- Todos os parâmetros visuais são atualizados ao vivo, sem recriar o contexto.

## Técnica de renderização em alto nível
WebGL2 com triângulo de tela cheia e um shader de fragmento de **marcha de raios com acúmulo de brilho volumétrico** (passo adaptativo crescente, campo de distância de um túnel cilíndrico quantizado por função teto), mapeamento de tons por tangente hiperbólica e rampa de três cores. Granulação por hash pseudoaleatório de pixel + tempo. Desfoque opcional em duas passagens (horizontal e vertical) com núcleo gaussiano de 9 amostras, usando dois alvos fora da tela; a granulação é aplicada só na última passagem.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor das profundezas | cor hex | `#5227FF` |
| Cor das faces | cor hex | `#A855F7` |
| Cor das arestas mais quentes | cor hex | `#FFFFFF` |
| Qualidade (iterações 20/32/48) | `baixo` / `médio` / `alto` | `médio` |
| Velocidade da respiração | número | 0,7 |
| Profundidade da respiração | número | 1 |
| Zoom (campo de visão) | número | 1,3 |
| Densidade do reticulado | número | 10 |
| Ganho de brilho | número | 1 |
| Exposição (maior = mais escuro) | número | 2700 |
| Espalhamento do passo | número 0,05–0,6 | 0,3 |
| Passo mínimo | número | 0,002 |
| Taxa de cintilação | número | 0 |
| Contraste | número | 1 |
| Brilho geral | número | 1 |
| Opacidade | número 0–1 | 1 |
| Afundar com o cursor | booleano | verdadeiro |
| Força da depressão | número | 0,1 |
| Raio da depressão (fração da altura) | número | 0,35 |
| Desfoque | número 0–1 | 0 |
| Granulação | booleano | verdadeiro |
| Intensidade da granulação | número | 0,05 |
| Modo claro (sobre branco) | booleano | falso |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site; o componente ocupa a área com os padrões.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"A luminous crystal corridor of stacked squares."**, centralizados. Aproximação de estilo: selo pequeno translúcido (fundo branco ~10%) com borda sutil; título ~2,5rem, peso 600, branco, largura máxima ~20ch. A sobreposição não bloqueia o ponteiro.
- Controles: três cores; qualidade (baixo/médio/alto); velocidade 0–2 (0,05); profundidade 0–4 (0,1); cintilação 0–2 (0,05); zoom 0,4–2,5 (0,05); densidade 4–16 (0,5); espalhamento 0,15–0,45 (0,01); passo 0,001–0,02 (0,001); brilho 0,2–3 (0,05); exposição 400–6000 (50); brilho geral 0,2–2,5 (0,05); contraste 0,5–2,5 (0,05); opacidade 0–1 (0,05); chave "afundar com cursor"; força 0–1,5 (0,05); raio 0,05–1 (0,01); desfoque 0–1 (0,01); chave granulação; intensidade 0–0,3 (0,01). Há ainda um botão de remontar.

## Acessibilidade e responsividade
- Decorativo: `aria-hidden` na superfície.
- **Recomendação**: com `prefers-reduced-motion`, congelar o tempo e a granulação (desenhar um único quadro).
- Pausa automaticamente fora da tela e com a aba oculta.
- Adapta-se a qualquer tamanho; a imagem é normalizada pela altura (mais larga = mais corredor visível nas laterais).
- **Recomendação**: no modo claro, o resultado é opaco; documentar que ele substitui o fundo.

## Observações de fidelidade
- **Recomendação**: a interação usa eventos de mouse; usar eventos de ponteiro para suportar caneta/toque.
- **Recomendação**: a suavização do cursor é por quadro (depende da taxa de quadros); preferir fração 1 − e^(−k·Δt) com k ≈ 3/s.
- A cintilação usa a posição final do raio, então mesmo com taxa 0 há uma variação espacial fixa de brilho (fator constante por pixel). Manter.
