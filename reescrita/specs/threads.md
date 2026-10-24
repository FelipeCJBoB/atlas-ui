# Especificação: Fios (threads)

## Propósito
Fundo animado com um feixe de dezenas de fios finos e luminosos que atravessam a área da esquerda para a direita. À esquerda os fios estão juntos, como um cabo; a partir de certo ponto eles se soltam e ondulam independentemente, abrindo-se em leque à direita como fios de cabelo ao vento. O movimento é lento e orgânico. Opcionalmente o cursor altera a forma e a amplitude das ondas.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai; a superfície de desenho fica dentro dele. **Transparente** fora dos fios.
- **Quantidade**: **40 fios**, indexados por p = i/40 (de 0 a 0,975).
- **Cor**: única para todos os fios, dada como trio RGB em 0–1 (padrão **branco** [1, 1, 1]).
- **Posição vertical de repouso**: todos centrados em **50% da altura** quando o espaçamento é **0** (padrão). Com espaçamento > 0, o fio p fica em 0,5 + (p − 0,5) × espaçamento (em fração da altura), abrindo o feixe verticalmente.
- **Espessura**: cada fio tem perfil triangular (máximo no centro, caindo linearmente até zero nas bordas). Largura total ≈ **7 px × (1 − p)** medida em relação à maior dimensão da área (em área paisagem, o valor em pixels verticais é 7 × altura/largura × (1 − p)); os primeiros fios são mais grossos, os últimos quase capilares.
- **Desfoque**: além da largura, cada fio ganha até **10 px** (mesma unidade relativa) × p de borda suave, que só começa depois do ponto onde o fio se solta (transição em 0,05 da largura). Fios de índice alto ficam mais difusos.
- **Opacidade por fio**: 1 − suavização(p^0,3). O primeiro fio é pleno; com p = 0,025 a opacidade é ~0,74; no meio do feixe (p = 0,5) é ~0,09; os últimos são quase invisíveis. O feixe tem portanto alguns fios fortes e um "véu" de fios fracos.
- **Composição**: a intensidade final de um pixel é 1 − produto de (1 − intensidade de cada fio) — união do tipo "screen": sobreposições clareiam sem estourar.
- **Saída**: cor × intensidade com alfa = intensidade. Na referência isso resulta em brilho aparente ≈ intensidade² sobre o fundo (ver Observações), o que deixa os fios fracos ainda mais discretos.

## Comportamento
- **Ponto de soltura**: o fio p começa a ondular a partir de x = 0,1 + 0,4p (fração da largura). A amplitude cresce suavemente desse ponto até **x = 0,7** e se mantém até a borda direita. À esquerda do ponto de soltura, o fio fica reto na altura de repouso.
- **Ondulação**: desvio vertical = ruído / 2 × amplitude efetiva, em que a amplitude efetiva = rampa × 0,5 × amplitude (padrão **1**) × (1 + (cursor y − 0,5) × 0,2).
  - O ruído é um **ruído de Perlin 2D** combinando duas amostras: uma em função de (tempo, x + p) com escala 2,5, e outra em função de (tempo, x + tempo) com escala 3,5 dividida por 1,5. A mistura entre elas cresce com x (peso x × 0,3). O índice p na primeira amostra faz cada fio ondular de forma diferente.
  - **Tempo do ruído** = segundos / 10 + (cursor x − 0,5). Movimento lento: um ciclo perceptível leva vários segundos.
- **Cursor** (desligado por padrão no componente; ligado na demo):
  - Rastreado sobre o contêiner, em coordenadas normalizadas (y para cima). Ao sair, o alvo volta ao centro.
  - Suavização exponencial de **5% por quadro** em direção ao alvo.
  - Efeito: mover na horizontal "rebobina/adianta" o ruído em até ±0,5 unidade de tempo (os fios mudam de forma); mover na vertical altera a amplitude em ±10%.
  - Desligado, o cursor fica fixo no centro (sem efeito).
- **Atualização ao vivo**: cor, amplitude, espaçamento e interação mudam sem recriar o contexto.
- **Visibilidade**: o desenho é suspenso quando o contêiner está fora da viewport ou a aba está oculta.
- **Resolução**: densidade de pixels até **2**, mas a maior dimensão interna é limitada a **1920 px** (reduz a densidade se necessário), porque o shader é pesado. Acompanha o tamanho do contêiner (observação de tamanho) e da janela.

## Técnica de renderização em alto nível
WebGL com triângulo de tela cheia e shader de fragmento que percorre os 40 fios por pixel. Para cada fio: altura central deslocada por **ruído de Perlin 2D** animado no tempo; perfil de linha triangular com borda suave; opacidade decrescente com o índice; combinação multiplicativa das transparências (união tipo screen). Mistura alfa padrão. Sem texturas nem assets. Custo proporcional a pixels × 40, por isso o limite de resolução.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor dos fios | trio RGB (0–1) | [1, 1, 1] |
| Amplitude das ondulações | número | 1 |
| Espaçamento vertical entre os fios (0 = todos no centro) | número | 0 |
| Interação com o cursor | booleano | falso |
| Atributos extras repassados ao contêiner | objeto | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Componente com amplitude 1, espaçamento 0, cor branca e **interação ligada**.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro, pílula **"New Background"**, título **"Not to be confused with the Threads app by Meta!"** e dois botões. Sem captura de ponteiro.
- Controles: amplitude 0–5 (0,1); espaçamento 0–2 (0,1); interruptor de interação.
- Os fios ondulam sozinhos; a interação do cursor é complementar.

## Acessibilidade e responsividade
- Decorativo: superfície oculta de leitores de tela, não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (quadro estático) e ignorar o cursor.
- Em toque, sem hover: comportamento igual ao cursor centrado.
- Responsivo: as posições são relativas à largura/altura; a espessura é relativa à maior dimensão.

## Observações de fidelidade
- Na referência a cor de saída já vem multiplicada pela intensidade e ainda é composta com alfa não pré-multiplicado, o que eleva a intensidade ao quadrado. Recomendação: reproduzir o **visual** (fios fracos bem discretos) — por exemplo, saída pré-multiplicada com intensidade² — ou, se preferir a forma "correta", aumentar levemente o contraste para não deixar o véu de fios fracos visível demais.
- Recomendação: suavização do cursor baseada em tempo, não em quadros.
- A referência mantém o laço de quadros ativo mesmo quando suspende o desenho fora da tela; é aceitável parar o laço por completo e retomá-lo.
- O padrão de interação do componente (desligado) difere do da demo (ligado); manter o padrão do componente desligado e ligar explicitamente na demo.
