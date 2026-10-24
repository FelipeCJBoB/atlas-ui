# Especificação: Imagens em órbita (orbit-images)

## Propósito
Faz um conjunto de imagens (avatares, logos, fotos) percorrer continuamente um caminho geométrico fechado: elipse, círculo, quadrado, retângulo, triângulo, estrela, coração, infinito, onda ou um caminho SVG próprio. Opcionalmente, mostra o traçado do caminho e um conteúdo fixo no centro.

## Aparência
- **Espaço de projeto**: o caminho é definido num quadrado virtual de lado L (padrão **1400** unidades), com centro em (L/2, L/2).
- **Contêiner**:
  - posicionamento relativo, centralizado na horizontal (margens laterais automáticas);
  - **modo responsivo**: largura de 100% e proporção **1:1**. Dentro dele, uma camada de L × L unidades fica centralizada (no meio, deslocada −50% em X e Y) e escalada por largura do contêiner ÷ L. Enquanto a escala não é medida, a camada fica invisível;
  - **modo fixo**: largura e altura em px (padrão **100 × 100**). A camada interna ocupa 100% e as coordenadas do caminho são usadas diretamente como px.
- **Rotação**: a camada do caminho e dos itens é girada por um ângulo fixo (padrão **−8°**) em volta do centro.
- **Traçado do caminho** (opcional): um SVG cobrindo a camada, com o caminho sem preenchimento, cor padrão **`rgba(0,0,0,0.1)`** e espessura padrão **2 px**. A espessura é compensada pela escala, para continuar com 2 px na tela. Não captura ponteiro.
- **Itens**:
  - caixas quadradas com lado configurável (padrão **64** unidades de projeto, escaladas junto);
  - posicionamento absoluto e dica de composição para transformações;
  - sem seleção de texto;
  - a imagem preenche a caixa com ajuste "contain", não é arrastável e não tem bordas nem raios. O estilo da imagem fica a cargo do usuário;
  - o conteúdo de cada item é contra-girado pelo mesmo ângulo da camada, para ficar **sempre em pé**, e o item não gira acompanhando a tangente do caminho.
- **Conteúdo central** (opcional): uma camada absoluta cobrindo o contêiner, flex centralizado, acima de tudo e sem rotação nem escala.
- **Formas** (dimensões em unidades de projeto; o "raio" padrão é **300**, e os semieixos padrão são **700** e **170**):
  - **elipse**: semieixos X e Y. Começa no ponto mais à esquerda e percorre o contorno no sentido **anti-horário** na tela: esquerda → baixo → direita → cima.
  - **círculo**: elipse com os dois semieixos iguais ao raio.
  - **quadrado**: lado 2 × raio, começando no canto superior esquerdo, em sentido horário.
  - **retângulo**: 2 × semieixo X por 2 × semieixo Y, em sentido horário a partir do canto superior esquerdo.
  - **triângulo** equilátero: lado 2 × raio, com o baricentro no centro e o vértice apontando para cima. Percorre topo → inferior direito → inferior esquerdo.
  - **estrela**: P pontas (padrão **5**), com raio externo = raio e raio interno = raio × razão (padrão **0,5**). Começa na ponta de cima e segue em sentido horário.
  - **coração**: duas curvas Bézier cúbicas simétricas que partem da ponta inferior, sobem em lóbulos arredondados e se encontram numa reentrância no topo. A altura total é cerca de 2/3 do "tamanho" (2 × raio) e a largura também cerca de 2/3.
  - **infinito** (lemniscata): quatro curvas cúbicas que passam pelo centro e formam dois laços, um à direita e outro à esquerda, com largura total 2 × semieixo X e altura 2 × semieixo Y. Percorre primeiro o laço direito pela parte de cima.
  - **onda**: um caminho fechado que vai da esquerda para a direita sobre uma senoide de **3 períodos** (largura 2 × semieixo X, amplitude = semieixo Y, 60 segmentos retos) e volta pela senoide espelhada. O resultado parece uma corrente de três "lentes".
  - **personalizado**: uma string de caminho SVG nas coordenadas de projeto. Se estiver vazia, vira o círculo.

## Comportamento
- **Progresso**: um valor animado vai de 0 a 100 (ou de 0 a −100 no sentido reverso) em D segundos (padrão **40 s**), com a curva configurada (padrão **linear**), e se repete para sempre em laço.
- **Posição de cada item**: posição no caminho (em %) = (progresso + deslocamento do item) mod 100.
  - Com a distribuição uniforme ligada (padrão), o deslocamento do item i é i ÷ N × 100, então os itens ficam igualmente espaçados ao longo do comprimento do caminho.
  - Com a distribuição desligada, todos ficam empilhados no mesmo ponto.
- O item é ancorado pelo **centro** ao ponto do caminho.
- **Curva não linear**: se for usada, ela vale a cada volta, e os itens aceleram e freiam periodicamente.
- **Pausado**: o progresso não avança.
- **Responsivo**: a escala é recalculada por observação do tamanho do contêiner.
- Não há interação com ponteiro.

## Técnica de renderização em alto nível
DOM e CSS **Motion Path**. Cada item usa o caminho SVG como trajetória de deslocamento, sem rotação automática e ancorado no centro. A distância percorrida é atualizada a cada quadro por um valor animado (biblioteca de animação ou laço próprio), sem re-render do React. O caminho é gerado como string de comandos SVG a partir da forma escolhida. O traçado visível usa um SVG com caixa de visualização L × L.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de URLs de imagem | array de strings | vazia |
| Prefixo do texto alternativo (seguido do número) | string | "Orbiting image" |
| Forma | elipse / círculo / quadrado / retângulo / triângulo / estrela / coração / infinito / onda / personalizado | elipse |
| Caminho SVG personalizado | string | nenhum |
| Lado do espaço de projeto | número | 1400 |
| Semieixo horizontal | número | 700 |
| Semieixo vertical | número | 170 |
| Raio (formas regulares) | número | 300 |
| Pontas da estrela | inteiro | 5 |
| Razão do raio interno da estrela | número | 0,5 |
| Rotação do conjunto (graus) | número | −8 |
| Duração de uma volta (s) | número | 40 |
| Tamanho dos itens | número | 64 |
| Sentido | normal / reverso | normal |
| Distribuir uniformemente | booleano | verdadeiro |
| Largura e altura no modo fixo (px) | número | 100 / 100 |
| Mostrar traçado | booleano | falso |
| Cor do traçado | cor CSS | `rgba(0,0,0,0.1)` |
| Espessura do traçado (px) | número | 2 |
| Curva de easing por volta | nome de easing | linear |
| Pausado | booleano | falso |
| Conteúdo central | nós React | nenhum |
| Modo responsivo | booleano | falso |
| Classe extra | string | vazia |

## Demo
- Área de prévia em flex, centralizada, com **400 px de altura**, overflow oculto e fundo escuro do site. Há um botão de "recarregar".
- Modo **responsivo**: o contêiner quadrado tem a largura do painel e é cortado em cima e embaixo pela área de 400 px.
- Valores da demo: elipse, semieixos **340 × 80**, raio 160, rotação **−8°**, volta de **30 s**, itens de **80** unidades, sentido normal, distribuição ligada, traçado visível e não pausado.
- Cor do traçado: **`rgba(255,255,255,0.15)`** no escuro e `rgba(24,24,27,0.12)` no claro.
- **6 imagens**: a referência usa fotos aleatórias em tons de cinza de um serviço externo. **Não usar.** Gerar 6 imagens quadradas próprias, por exemplo SVGs com gradientes de cinza diferentes e uma forma simples (círculo, montanha, onda) em cada, embutidas como data URL.
- Controles:
  - forma (9 opções);
  - sentido;
  - semieixo X, semieixo Y e raio, de 50 a 600 (passo 10);
  - rotação de −180 a 180;
  - duração de 5 a 120 s (passo 5);
  - tamanho de 20 a 120 (passo 4);
  - chaves de distribuição, traçado e pausa.
  - Cada mudança remonta o componente.

## Acessibilidade e responsividade
- A referência oculta **todo** o contêiner dos leitores de tela, inclusive o conteúdo central. **Recomendação**: ocultar só a camada orbital e deixar o conteúdo central acessível.
- **Recomendação**: com `prefers-reduced-motion`, parar a órbita e mostrar os itens distribuídos e estáticos.
- O modo responsivo escala tudo proporcionalmente à largura. O modo fixo não se adapta.

## Observações de fidelidade
- No **modo fixo**, com os padrões (100 × 100 px), o caminho fica centrado em (700, 700) px, muito fora da caixa visível. **Recomendação**: no modo fixo, centralizar o caminho na caixa (por exemplo, usar a mesma escala do modo responsivo com base na largura informada) ou documentar que o lado de projeto deve ser igual à largura.
- Ao despausar, a referência recomeça a animação a partir do valor atual com o laço "do valor atual até 100". Daí em diante, as voltas cobrem só parte do caminho e saltam. **Recomendação**: retomar de modo contínuo, com o progresso sempre avançando em módulo 100.
- As imagens usam a própria URL como chave, então URLs repetidas geram conflito. Usar o índice como chave.
