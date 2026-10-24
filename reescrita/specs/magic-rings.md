# Especificação: Anéis mágicos (magic-rings)

## Propósito
Um fundo ou ilustração animada com vários anéis concêntricos luminosos. Os anéis nascem, expandem-se lentamente e se apagam em ciclos defasados, num degradê entre duas cores, com granulação de filme. Opcionalmente, o padrão reage ao ponteiro (desvio, paralaxe, ampliação no hover) e ao clique (flash de brilho).

## Aparência
- **Contêiner**: bloco com 100% × 100% do pai. Contém uma única superfície WebGL transparente que o preenche. Um desfoque CSS opcional (em px) é aplicado ao contêiner inteiro para dar efeito de *bloom*.
- **Sistema de coordenadas**: a origem fica no centro da área. A unidade 1 corresponde ao **menor lado** do contêiner, então as bordas do lado menor ficam em ±0,5.
- **Anéis**:
  - de 1 a **10** anéis (padrão **6**);
  - o anel i tem raio base = raio inicial + i × passo (padrões **0,35** e **0,10**). O anel 0 é o mais interno.
- **Cor**:
  - o anel i usa a interpolação linear entre a cor 1 e a cor 2, na fração i ÷ (n − 1);
  - padrões do componente: **`#fc42ff`** (magenta) para **`#42fcff`** (ciano).
- **Perfil de cada anel**:
  - **Núcleo**: um traço fino e nítido com espessura de "espessura configurada × 1 pixel de tela" (padrão **2**). A espessura vale integralmente perto do eixo horizontal e cai para a metade perto do eixo vertical.
  - **Halo**: um brilho que decai **exponencialmente** com a distância à circunferência. A taxa de decaimento é a "atenuação" (padrão **10**); valores maiores dão um halo mais curto.
  - No núcleo, a intensidade dobra.
- **Recorte angular**:
  - Cada anel some progressivamente ao se aproximar do eixo vertical, porque se soma à distância um termo que cresce com o cubo de (fator de recorte × ângulo normalizado), onde o ângulo vai de 0 no eixo horizontal a 1 no vertical.
  - O fator de recorte do anel i é **base^i** (base padrão **1,5**).
  - Assim, o anel interno é quase completo, e os externos aparecem só como arcos à esquerda e à direita, cada vez mais curtos. O efeito é simétrico nos quatro quadrantes.
- **Granulação**: ruído aleatório por pixel, que muda a cada quadro, somado à cor com amplitude de ±metade da quantidade de ruído (padrão **0,1**).
- **Composição dos anéis**: do interno para o externo, cada anel é misturado por cima do acumulado com peso igual à própria intensidade. O peso pode passar de 1 no núcleo, o que satura o centro do traço.
- **Saída de alfa** (dois modos):
  - **luminância** (padrão, para fundos escuros): a cor final é normalizada pelo maior canal, virando uma matiz pura, e o alfa recebe o maior canal. O resultado parece luz emitida sobre o que estiver atrás.
  - **cobertura** (para fundos claros): a cor final é limitada a [0,1] e o alfa é a maior intensidade entre os anéis. Isso permite anéis escuros sobre fundo claro.
  - Nos dois modos, o alfa é multiplicado pela opacidade geral (padrão **1**).

## Comportamento
- **Relógio**: o tempo acumula Δt × multiplicador de velocidade (padrão **1**). Cada Δt é limitado a **100 ms**, para não haver saltos depois de abas inativas.
- **Ciclo de cada anel**:
  - período fixo de **3,45 s**;
  - o anel i tem defasagem de 2,95 × i segundos (o anel 0 não tem defasagem);
  - dentro do ciclo, com t de 0 a 3,45:
    - o raio cresce linearmente de raio base até raio base + taxa de expansão (padrão **0,1**);
    - a opacidade de ciclo sobe com curva suave (smoothstep) de 0 a 1 entre t = 0 e t = duração de entrada (padrão **0,7 s**);
    - depois da entrada, a opacidade vale 1 − smoothstep entre o início da saída (padrão **0,5 s**) e 3,25 s;
  - ao fim do ciclo, o anel reaparece no raio base.
- **Ponteiro**:
  - A posição é normalizada em relação ao contêiner, de −0,5 a 0,5 nos dois eixos, com Y para cima, e é suavizada por quadro com fator **0,08** (aproximação exponencial).
  - Ao sair do contêiner, o alvo volta a (0, 0).
  - **Seguir o ponteiro** (opcional, desligado por padrão): todo o padrão se desloca na direção do ponteiro, por posição × influência (padrão **0,2**).
  - **Paralaxe** (sempre ativa quando o ponteiro está dentro): o anel i recebe um deslocamento adicional de i × paralaxe × ponteiro (padrão **0,05**). Os anéis externos se movem mais, criando sensação de profundidade.
  - **Ampliação no hover** (sempre ativa): um fator de hover vai de 0 a 1 ao entrar e de volta a 0 ao sair, com suavização de **0,08** por quadro. O padrão escala por interpolação entre 1 e a escala no hover (padrão **1,2**).
- **Clique com explosão** (opcional, desligado por padrão):
  - o clique coloca um impulso em 1, que decai multiplicando por **0,95** a cada quadro e é zerado abaixo de 0,001;
  - enquanto dura, a escala ganha +0,3 × impulso e o brilho é multiplicado por (1 + 2 × impulso).
- **Rotação estática**: o padrão inteiro pode ser girado por um ângulo em graus (padrão **0**).
- **Economia**: o laço só roda quando o contêiner está visível na viewport (observação de interseção) e a aba está visível. Ao retomar, o Δt do primeiro quadro é zerado.
- **Redimensionamento**: a resolução segue o contêiner, por observação de tamanho e pelo resize da janela, com densidade de pixels limitada a **2**.
- **Mudança de parâmetros**: todos são lidos a cada quadro, então alterações valem imediatamente, sem recriar o contexto.

## Técnica de renderização em alto nível
WebGL 2, com um único retângulo de tela cheia e um shader de fragmento que avalia analiticamente, por pixel, a distância a cada circunferência (campo de distância radial). Essa distância passa por um decaimento exponencial (halo), um degrau suave (núcleo), um recorte angular polinomial e um envelope temporal. Por fim, entra uma granulação por hash pseudoaleatório de pixel e tempo. Sem WebGL 2, o componente não desenha nada, falhando silenciosamente. Uma biblioteca 3D é opcional: basta um contexto WebGL com um quad e uniformes.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor inicial (anel interno) | cor hex | `#fc42ff` |
| Cor final (anel externo) | cor hex | `#42fcff` |
| Multiplicador de velocidade | número | 1 |
| Quantidade de anéis (1–10) | inteiro | 6 |
| Atenuação do halo | número | 10 |
| Espessura do traço | número | 2 |
| Raio do anel interno (fração do menor lado) | número | 0,35 |
| Passo de raio entre anéis | número | 0,10 |
| Expansão do raio ao longo do ciclo | número | 0,10 |
| Opacidade geral | 0–1 | 1 |
| Desfoque CSS (px) | número | 0 |
| Intensidade da granulação | número | 0,1 |
| Rotação estática (graus) | número | 0 |
| Base do recorte angular por anel | número | 1,5 |
| Duração da entrada no ciclo (s) | número | 0,7 |
| Início da saída no ciclo (s) | número | 0,5 |
| Seguir o ponteiro | booleano | falso |
| Influência do ponteiro | número | 0,2 |
| Escala no hover | número | 1,2 |
| Paralaxe por anel | número | 0,05 |
| Explosão ao clicar | booleano | falso |
| Modo de alfa | luminância / cobertura | luminância |

## Demo
- Área de prévia com **500 px de altura**, sem padding, overflow oculto, conteúdo centralizado e fundo escuro do site. Há um botão de "recarregar" no canto, que remonta o componente.
- **Tema escuro**: cores **`#A855F7`** (violeta) e **`#6366F1`** (índigo), opacidade 1, modo luminância.
- **Tema claro**, enquanto as cores estiverem no padrão: **`#52525b`** e **`#a1a1aa`** (cinzas), opacidade **0,62** e modo cobertura.
- Os demais valores são os padrões da tabela.
- Exemplo **"Basic"**: os anéis ocupam a área toda.
- Exemplo **"Card"**: um cartão com a área visual no topo, mostrando os anéis com um ícone de "brilhos" (três estrelas de quatro pontas, traço fino de 1 px, cerca de 48 px, cor de destaque `#A855F7` no escuro ou `#52525b` no claro, opacidade 0,8) centralizado sobre eles. O corpo do cartão contém:
  - o título "Magic Rings";
  - o subtítulo "Interactive WebGL effect";
  - uma linha de metadados com dois rótulos acompanhados de ícones de 16 px (um ícone de repositório com "Free & open source" e um ícone de átomo com "React");
  - uma linha de ações com o botão "Copy to clipboard" e um botão quadrado com um coração de 20 px em traço de 2 px (`#B497CF` no escuro, `#71717a` no claro).
  - O estilo exato do cartão não está disponível. Sugestão: cerca de 340 px de largura, raio de 20 px, fundo um pouco mais claro que a área, borda sutil e área visual com cerca de 200 px de altura.
  - **Assets**: os ícones devem ser desenhados em SVG próprio, sem logos de terceiros.
- Controles (faixas):
  - exemplo (Basic/Card);
  - cores;
  - anéis de 1 a 10;
  - velocidade de 0 a 3 (passo 0,1);
  - atenuação de 1 a 30 (passo 0,5);
  - espessura de 1 a 10 (passo 0,5);
  - raio base de 0,1 a 0,5 (passo 0,01);
  - passo de 0,05 a 0,3 (passo 0,01);
  - expansão de 0 a 0,2 (passo 0,01);
  - opacidade de 0 a 1 (passo 0,05);
  - desfoque de 0 a 10 (passo 0,5);
  - ruído de 0 a 0,5 (passo 0,01);
  - rotação de 0 a 360;
  - recorte de 1 a 3 (passo 0,1);
  - entrada de 0,1 a 1,5 (passo 0,05);
  - saída de 0,5 a 3 (passo 0,05);
  - influência de 0 a 1 (passo 0,05);
  - escala no hover de 1 a 2 (passo 0,05);
  - paralaxe de 0 a 0,1 (passo 0,005);
  - chaves de seguir o ponteiro e de explosão.

## Acessibilidade e responsividade
- Efeito decorativo: marcar a superfície como oculta para leitores de tela e não focável.
- **Recomendação**: com `prefers-reduced-motion`, congelar o tempo (anéis estáticos) e desligar a granulação animada e a explosão.
- Responsivo: o padrão escala pelo menor lado, então continua circular em qualquer proporção.
- Liberar o contexto WebGL ao desmontar.

## Observações de fidelidade
- Com os padrões, o início da saída (0,5 s) é menor que a duração da entrada (0,7 s). Ao terminar a entrada, a opacidade cai de 1 para cerca de 0,99, um degrau imperceptível. Manter a mesma fórmula para não alterar o visual.
- A ampliação no hover e a paralaxe funcionam mesmo com "seguir o ponteiro" desligado. Esse comportamento é intencional e deve ser preservado.
- A referência remove a superfície e descarta o material ao desmontar, mas não descarta a geometria. **Recomendação**: liberar todos os recursos de GPU.
