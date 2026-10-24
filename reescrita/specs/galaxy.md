# Especificação: Galáxia (galaxy)

## Propósito
Fundo animado de campo estelar com sensação de "viagem pelo espaço": várias camadas de estrelas se aproximam do observador em ciclo contínuo, as maiores com raios cruzados (brilho em cruz), cintilando e girando devagar. O ponteiro empurra as estrelas ao redor dele (repulsão) ou desloca levemente o campo. Uso: fundo de seção hero.

## Aparência
- **Contêiner**: bloco com 100% de largura e altura do pai, posicionamento relativo. A superfície de desenho é inserida dentro dele e ocupa o tamanho do contêiner.
- **Fundo**: por padrão **transparente** (as estrelas aparecem sobre o que estiver atrás). Com transparência desligada, fundo preto `#000`. Em modo claro, fundo branco.
- **Estrelas**:
  - cada estrela é um ponto luminoso com brilho que decai com o inverso da distância ao centro (núcleo muito intenso, halo suave), apagando por completo a uma distância de uma célula da grade;
  - estrelas grandes (as ~10% maiores) ganham **raios em cruz**: duas linhas finíssimas, horizontal e vertical, e uma segunda cruz girada 45° com 30% da intensidade (aspecto de "estrela de quatro/oito pontas" de lente fotográfica). A intensidade desses raios oscila no tempo;
  - o brilho final é proporcional ao tamanho aleatório da estrela (0 a 1);
  - intensidade global do brilho (padrão **0,3**) escala núcleo e raios.
- **Cor**: cada estrela recebe uma cor-base pseudoaleatória no eixo vermelho↔azul (componentes entre 0,2 e ~1,2, verde menor). Essa cor é convertida para matiz/saturação/valor; o matiz é girado pelo deslocamento configurado (padrão **140°**) e a saturação é multiplicada pelo fator de saturação (padrão **0**). Com o padrão, portanto, **todas as estrelas são brancas/acinzentadas** com brilhos variados; ao subir a saturação aparecem tons de acordo com o matiz deslocado.
- **Saída com transparência**: a opacidade do pixel cresce suavemente de 0 a 1 conforme o brilho vai de 0 a ~0,3, com mistura alfa normal.
- **Modo claro** (opcional): fundo branco; as estrelas viram "tinta" (cor × 0,48, limitada a 0,82), aplicada com cobertura que cresce suavemente até intensidade ~0,42, no máximo 92%.

## Comportamento
- **Relógio**: tempo em segundos desde o início; multiplicado pela velocidade geral (padrão **1**).
- **Camadas e profundidade**: há **4 camadas** de estrelas igualmente defasadas. Cada camada tem uma profundidade cíclica de 0 a 1 que avança com o tempo à taxa (tempo × velocidade das estrelas ÷ 10) × velocidade geral; velocidade das estrelas padrão **0,5**.
  - A escala da grade da camada vai de **20 × densidade** (longe, estrelas pequenas e numerosas) a **0,5 × densidade** (perto, estrelas grandes e esparsas) conforme a profundidade cresce: o efeito é de estrelas que se aproximam e se espalham para fora.
  - O peso da camada é igual à profundidade (aparece gradualmente vindo do fundo) e cai a zero entre profundidade 0,9 e 1 (some antes de "passar" pela câmera). Isso deixa o ciclo sem emendas.
- **Distribuição**: cada camada é uma grade; cada célula contém uma estrela em posição aleatória que **oscila lentamente** dentro da célula (onda triangular suavizada, com períodos diferentes em X e Y, cerca de 10 e 30 s ÷ velocidade). Para não cortar halos, cada pixel considera a célula atual e as 8 vizinhas.
- **Cintilação**: o brilho de cada estrela é modulado por uma onda periódica suave (período ~1 s ÷ velocidade, fase aleatória por estrela) entre 0,5× e 1,5×, misturada com 1 pela intensidade de cintilação (padrão **0,3**).
- **Rotação**: todo o campo gira em torno do ponto focal a **0,1 rad/s** (padrão) e pode ter também uma rotação fixa inicial (definida como par cosseno/seno; padrão sem rotação).
- **Ponto focal**: centro da perspectiva, em fração da largura/altura (padrão centro, 0,5/0,5).
- **Ponteiro** (padrão ligado), com prioridade nesta ordem:
  1. Se a **repulsão automática do centro** for maior que 0: o campo é empurrado radialmente para longe do ponto focal com força proporcional a esse valor ÷ (distância + 0,1) × 0,05, criando um "vazio" no centro. Independe do ponteiro.
  2. Senão, se a **repulsão pelo ponteiro** estiver ligada (padrão): as coordenadas são empurradas para longe do ponteiro com intensidade força (padrão **2**) ÷ (distância + 0,1) × 0,05 × fator de presença. Visualmente, as estrelas se afastam do cursor, formando uma lente/bolha ao redor dele.
  3. Senão: o campo inteiro é deslocado levemente na direção do ponteiro (deslocamento = posição relativa ao centro × 0,1 × fator de presença), uma paralaxe sutil.
  - A posição do ponteiro (normalizada 0–1, Y para cima) e o fator de presença (1 dentro, 0 fora) são suavizados por interpolação exponencial com fator **0,05** por quadro. Ao sair, o efeito se desfaz suavemente.
- **Animação desligada**: congela tempo e profundidade (imagem parada), mas a reação ao ponteiro continua.
- **Redimensionamento**: a resolução acompanha o tamanho do contêiner ao redimensionar a janela.
- **Mudança de parâmetros**: recria a cena.

## Técnica de renderização em alto nível
WebGL com um triângulo de tela cheia e shader de fragmento procedural. O campo estelar é gerado por **hash pseudoaleatório por célula de grade** (sem textura), com estrela como campo de distância 1/d somado a "raios" obtidos de uma função que só é alta onde o produto x·y é quase zero (as linhas dos eixos), em duas orientações. A sensação de profundidade vem de camadas com escala cíclica (técnica de "zoom infinito" com fade nas pontas). A distorção do ponteiro é um deslocamento radial do espaço de coordenadas antes da amostragem. Cor via conversão HSV. Um laço por quadro atualiza o tempo e o ponteiro suavizado.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Ponto focal (fração x, y) | par de números | 0,5 / 0,5 |
| Rotação fixa (cosseno, seno) | par de números | 1 / 0 |
| Velocidade de aproximação das estrelas | número | 0,5 |
| Densidade de estrelas | número | 1 |
| Deslocamento de matiz | graus | 140 |
| Desligar animação | booleano | não |
| Velocidade geral (cintilação, deriva, aproximação) | número | 1 |
| Reage ao ponteiro | booleano | sim |
| Intensidade do brilho | número | 0,3 |
| Saturação das cores | número 0–1 | 0 |
| Repulsão pelo ponteiro (senão, paralaxe sutil) | booleano | sim |
| Força da repulsão | número | 2 |
| Intensidade da cintilação | número 0–1 | 0,3 |
| Velocidade de rotação automática | rad/s | 0,1 |
| Repulsão automática a partir do centro (0 = desligada) | número | 0 |
| Fundo transparente | booleano | sim |
| Modo claro | booleano | não |
| Atributos extras repassados ao contêiner | — | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site (o efeito é transparente, então o fundo do site aparece entre as estrelas).
- Valores da demo no tema escuro: os padrões (densidade 1, brilho 0,3, saturação 0, matiz 140°, cintilação 0,3, rotação 0,1, repulsão 2, repulsão central 0, aproximação 0,5, velocidade 1, repulsão e interação ligadas) → estrelas brancas.
- No tema claro, enquanto os controles estiverem nos padrões, a demo troca para saturação **0,75**, matiz **275°** e brilho **0,55** (estrelas coloridas em tons arroxeados/rosados).
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro no topo com logotipo genérico (SVG próprio), "Features", "About" e botão "Sign up"; no centro uma pílula "NEW · Creative Components", o título **"Components you shall have, young padawan."** (peso 600, 1,6–2,4 rem, entrelinha 1,1) e os botões "Get started" (sólido) e "Learn more" (vidro); interruptor "Demo Content" no canto inferior direito. Tudo sem captura de ponteiro.
- Controles: interação e repulsão (interruptores); densidade 0,1–3 (0,1); brilho 0–1 (0,1); saturação 0–1 (0,1); matiz 0–360° (10); cintilação 0–1 (0,1); rotação 0–0,5 (0,05); força de repulsão 0–10 (0,5); repulsão central 0–20 (1); aproximação 0,1–2 (0,1); velocidade 0,1–3 (0,1).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, desligar a animação (o parâmetro já existe) e a repulsão.
- Responsivo: o campo preenche qualquer proporção; a escala depende da altura.

## Observações de fidelidade
- Recomendação: a referência só reajusta o tamanho no redimensionamento da janela; use observação do próprio contêiner.
- Recomendação: a referência ignora a densidade de pixels (resolução 1×), deixando as estrelas suaves demais em telas de alta densidade. Escalar pela densidade (limitada a 2) é permitido, mantendo o tamanho aparente.
- Recomendação: a suavização do ponteiro é por quadro; prefira baseada em tempo (equivalente a 0,05 a 60 Hz).
- Defeito da demo: no tema claro ela pretende ligar o modo claro e um fundo branco, mas esses dois valores não chegam ao componente; só saturação, matiz e brilho mudam. Na reimplementação, a demo do tema claro deve de fato ativar o modo claro.
- Recomendação: a intensidade dos raios cruzados é derivada de um valor de tempo que cresce sem limite; manter o comportamento periódico, mas evitar perda de precisão em sessões longas (usar o tempo módulo um período grande).
