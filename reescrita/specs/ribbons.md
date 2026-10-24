# Especificação: Fitas (ribbons)

## Propósito
Uma ou mais **fitas coloridas** e elásticas que seguem o cursor como caudas de cometa. A cabeça de cada fita persegue o ponteiro com física de mola, e o corpo acompanha a cabeça com atraso, desenhando curvas suaves que encolhem e somem quando o ponteiro para.

## Aparência
- **Contêiner**: 100% × 100% do pai, com posicionamento relativo. Dentro dele há uma superfície WebGL absoluta que cobre tudo, com densidade de pixels igual à do dispositivo (2 como alternativa).
- **Fundo**: a cor de limpeza é configurável como RGBA de 0 a 1 (padrão **transparente**).
- **Fita**:
  - faixa lisa de cor sólida (padrão de uma única fita **`#FC8EAC`**, rosa);
  - largura máxima de cerca de **E px CSS** (padrão **30**), no meio do comprimento;
  - afina em perfil parabólico até **10%** da largura máxima nas duas pontas;
  - sem bordas, sombras ou gradiente de cor;
  - com várias cores, há uma fita por cor, sobrepostas na ordem da lista.
- **Desbotamento** (opcional): a opacidade cai suavemente da cabeça (opaca) até a cauda (transparente).
- **Ondulação** (opcional): o contorno da fita ondula, deslocado ao longo da normal por uma senoide que depende do tempo e da posição horizontal (frequência espacial alta, cerca de 10 por unidade de tela). A amplitude é proporcional à largura local × amplitude configurada (padrão **2**).

## Comportamento
- **Pontos**: cada fita é uma polilinha de P pontos (padrão **50**), todos iniciando no centro da área.
- **Variação por fita**: cada fita sorteia, na montagem:
  - mola = base (padrão **0,03**) ± 0,025;
  - atrito = base (padrão **0,9**) ± 0,025;
  - largura = base ± 1,5 px;
  - deslocamento em relação ao ponteiro: horizontal = (índice − meio da lista) × fator de afastamento (padrão **0,05**, em unidades normalizadas de −1 a 1) ± 0,005, e vertical ± 0,05.
  - Com várias fitas, elas viajam lado a lado, levemente separadas.
- **Cabeça** (a cada quadro, sem normalizar pelo tempo): aceleração = (alvo − posição) × mola; velocidade = (velocidade + aceleração) × atrito; posição += velocidade. O alvo é o ponteiro mais o deslocamento da fita. O resultado é um movimento elástico, com leve overshoot.
- **Corpo**: cada ponto i se aproxima do ponto i − 1 por interpolação linear com fração mín(1, Δt × multiplicador de velocidade ÷ (idade máxima ÷ (P − 1))), onde Δt é o tempo do quadro em ms, a idade máxima padrão é **500 ms** e o multiplicador padrão é **0,6**.
  - Com os padrões, a fração fica perto de 1, e o corpo segue quase rígido com um pequeno arrasto.
  - Valores menores de multiplicador ou maiores de idade alongam a cauda.
  - Se a idade máxima for inválida ou ≤ 0, a fração é fixa em 0,9.
- **Colapso ao parar**: a largura em cada ponto é multiplicada por um degrau suave da distância entre os vizinhos, que vai de 0 a 1 entre distância 0 e 0,02 em unidades normalizadas. Com o ponteiro parado, os pontos convergem e a fita **encolhe até desaparecer**.
- **Ponteiro**: o movimento do mouse e o toque (início e arraste) sobre o contêiner são convertidos para coordenadas normalizadas de −1 a 1, com Y para cima. Fora do contêiner, o último alvo é mantido.
- **Redimensionamento**: só no resize da janela.
- Mudar qualquer parâmetro recria tudo.

## Técnica de renderização em alto nível
WebGL com uma **malha de faixa** por fita (polilinha expandida em triângulos). Cada vértice conhece o ponto anterior e o seguinte. Num shader de vértice, a tangente é calculada em espaço de tela corrigido pela proporção, e o vértice é deslocado ao longo da normal pela meia-largura, já com o afinamento parabólico, o colapso por distância e a ondulação senoidal opcional. O shader de fragmento pinta a cor sólida com a opacidade de desbotamento ao longo do comprimento. A física dos pontos roda na CPU, e a geometria é reenviada a cada quadro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cores (uma fita por cor) | array de cores hex | [`#FC8EAC`] |
| Rigidez da mola da cabeça | número | 0,03 |
| Atrito da cabeça (0–1) | número | 0,9 |
| Largura máxima (px) | número | 30 |
| Afastamento lateral entre fitas | número | 0,05 |
| Idade máxima / comprimento temporal (ms) | número | 500 |
| Pontos por fita | inteiro | 50 |
| Multiplicador de velocidade do corpo | número | 0,6 |
| Desbotar em direção à cauda | booleano | falso |
| Ondulação | booleano | falso |
| Amplitude da ondulação | número | 2 |
| Cor de fundo RGBA (0–1) | array de 4 números | [0, 0, 0, 0] |

## Demo
- Área de prévia com **400 px de altura**, sem padding, overflow oculto e fundo escuro do site.
- Texto centralizado ao fundo **"Hover Me."**, com fonte `clamp(2rem, 6vw, 6rem)`, peso 600 e cor atenuada. A superfície fica por cima.
- Valores da demo: **uma fita `#5227FF`** (violeta-azulado), largura **30**, multiplicador **0,5**, idade **500**, desbotamento e ondulação desligados.
- Controles:
  - quantidade de fitas de 1 a 10: ao aumentar, acrescenta cores hex aleatórias; ao diminuir, corta a lista;
  - largura de 1 a 60;
  - velocidade de 0,3 a 0,7 (passo 0,01);
  - idade de 300 a 1000 (passo 100);
  - chaves de desbotamento e ondulação.
  - As mudanças são aplicadas ao vivo e recriam a cena.

## Acessibilidade e responsividade
- Decorativo: ocultar dos leitores de tela. Não bloqueia cliques no conteúdo abaixo apenas se a superfície estiver configurada para não capturar ponteiro. Recomenda-se isso, ouvindo o movimento no contêiner pai.
- **Recomendação**: com `prefers-reduced-motion`, não renderizar as fitas.
- **Recomendação**: pausar o laço fora da viewport ou com a aba oculta.
- Funciona com toque.

## Observações de fidelidade
- A física da cabeça é aplicada por quadro, sem normalizar pelo Δt, então é mais rápida em telas de alta frequência. **Recomendação**: integrar com passo fixo de cerca de 16,7 ms.
- O valor padrão da lista de cores é recriado a cada render. Se o pai re-renderizar sem passar cores, a cena inteira é recriada. **Recomendação**: comparar as cores por conteúdo.
- O redimensionamento do contêiner, sem resize da janela, não é detectado. **Recomendação**: observar o tamanho do contêiner.
- A referência não libera o contexto de GPU ao desmontar. **Recomendação**: liberar.
