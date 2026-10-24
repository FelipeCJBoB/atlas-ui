# Especificação: Esteira infinita de logos (logo-loop)

## Propósito
Uma faixa que rola sem fim uma sequência de logos (ícones, imagens ou nós arbitrários), no estilo "empresas que confiam em nós" ou "nossa stack". O movimento é contínuo e sem emendas, horizontal ou vertical. Pode desacelerar ou parar sob o ponteiro, ampliar o logo sob o cursor e esmaecer as bordas no fundo.

## Aparência
- **Contêiner raiz**:
  - posicionamento relativo;
  - largura padrão de 100% no modo horizontal;
  - sem fundo, borda ou padding próprios, exceto no modo de ampliação (ver abaixo).
  - No modo vertical, vira bloco em linha com altura de 100%. A altura em pixels é forçada para a altura do elemento pai, arredondada para cima. A largura só é aplicada se o usuário passar um valor diferente de 100%.
- **Trilho**:
  - flex em linha (em coluna no modo vertical);
  - largura igual à do conteúdo (no vertical, altura igual à do conteúdo e largura de 100%);
  - seleção de texto desativada;
  - dica de composição para transformações (camada própria de GPU).
- **Sequência**: o trilho contém N cópias idênticas da lista de logos. Cada cópia é uma lista flex com os itens centralizados no eixo cruzado.
- **Item**:
  - não encolhe nem cresce;
  - tem margem *depois* de si igual ao espaçamento (padrão **32 px**): à direita no horizontal e embaixo no vertical. Isso vale inclusive para o último item, de modo que cada cópia termina com um espaçamento e a junção entre cópias fica uniforme;
  - tamanho de fonte igual à altura do logo (padrão **28 px**), com altura de linha 1. Assim, ícones dimensionados em "1em" ficam com a altura do logo.
- **Imagem de logo**:
  - altura igual à altura do logo e largura automática;
  - bloco com ajuste "contain";
  - não arrastável e sem eventos de ponteiro;
  - carregamento preguiçoso e decodificação assíncrona.
- **Nó de logo** (ícone/elemento): invólucro flex em linha, centralizado verticalmente.
- **Link** (quando o item tem destino):
  - flex em linha, centralizado e sem sublinhado;
  - raio de **4 px**;
  - no hover, opacidade **0,8**, com transição de 0,2 s *ease*;
  - no foco visível, contorno de **2 px** na cor do texto, afastado 2 px.
- **Esmaecimento das bordas** (opcional):
  - duas sobreposições nas extremidades: esquerda e direita no horizontal, topo e base no vertical;
  - cada uma com tamanho de `clamp(24px, 8%, 120px)` no eixo do movimento e 100% no outro;
  - gradiente linear da cor de esmaecimento (opaca) na borda para transparente em direção ao centro;
  - acima do conteúdo e sem capturar ponteiro.
  - **Cor automática**: `#ffffff`, ou **`#0b0b0b`** quando o sistema está em esquema escuro. Pode ser substituída por uma cor configurada.
- **Modo de ampliação no hover**: adiciona padding vertical de 10% da altura do logo no contêiner, para dar folga à ampliação, e deixa o overflow dos itens visível.

## Comportamento
- **Movimento contínuo**: um deslocamento acumulado (em px) é aplicado como translação negativa do trilho a cada quadro. O deslocamento é sempre mantido no intervalo [0, comprimento de uma sequência), por módulo, onde o comprimento é a largura (ou altura) medida da primeira cópia, arredondada para cima. Por isso o laço não tem emenda.
- **Velocidade**: magnitude padrão de **120 px/s**.
  - Sentidos:
    - "esquerda": o conteúdo anda para a esquerda;
    - "direita": anda para a direita;
    - "cima": sobe;
    - "baixo": desce.
  - Velocidade negativa inverte o sentido escolhido.
- **Suavização da velocidade**: a velocidade atual persegue a velocidade-alvo com aproximação exponencial de **constante de tempo 0,25 s**. A cada quadro, a fração aplicada é 1 − e^(−Δt/0,25), com Δt em segundos. Na montagem, a velocidade parte de 0 e acelera suavemente até o alvo. Trocas de alvo, como entrar ou sair do hover, também são suaves.
- **Hover**:
  - Enquanto o ponteiro está sobre o trilho, o alvo passa a ser a "velocidade no hover", se definida.
  - Existe também uma opção booleana de "pausar no hover":
    - verdadeira → alvo 0 no hover;
    - falsa → o hover não muda nada.
  - Se nenhuma das duas for definida, o padrão é **pausar (alvo 0)**. A velocidade no hover explícita tem prioridade sobre a opção booleana.
- **Quantidade de cópias**: ⌈tamanho do contêiner ÷ tamanho da sequência⌉ + **2**, com mínimo de **2**. Recalcula ao redimensionar (observação de tamanho do contêiner e da sequência; sem esse recurso, usa o evento de resize da janela) e depois que todas as imagens da primeira cópia terminam de carregar (ou falham).
- **Ampliação no hover** (opcional): o logo ou nó sob o cursor escala para **1,2×** a partir do centro, com transição de **0,3 s** e curva `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Itens**: cada item pode ser um nó React (com título e rótulo acessível opcionais) ou uma imagem (com fonte, *srcset*, *sizes*, largura, altura, texto alternativo e título). Ambos podem ter um destino de link, que abre em nova aba com `noopener noreferrer`. Há também uma função de renderização personalizada por item, que substitui todo o conteúdo do item.
- **Movimento reduzido**: com `prefers-reduced-motion: reduce`, o trilho fica parado na posição zero e as transições de escala são desligadas.

## Técnica de renderização em alto nível
DOM puro e CSS. Um laço de quadros (requestAnimationFrame) mede o tempo entre quadros, integra a velocidade suavizada e escreve a translação 3D diretamente no estilo do trilho, fora do ciclo de render do React. As cópias da sequência são geradas a partir de uma contagem guardada em estado. As medidas usam o retângulo da primeira cópia. As variáveis de espaçamento, altura e cor de esmaecimento são passadas por propriedades customizadas de CSS. O esmaecimento usa pseudo-elementos com gradiente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de logos (nó ou imagem, com título, rótulo, link opcional) | array | obrigatório |
| Velocidade (px/s, negativo inverte) | número | 120 |
| Sentido | esquerda / direita / cima / baixo | esquerda |
| Largura do contêiner | número (px) ou string CSS | 100% |
| Altura dos logos | número (px) | 28 |
| Espaçamento entre logos | número (px) | 32 |
| Pausar no hover | booleano | indefinido (equivale a pausar) |
| Velocidade durante o hover | número (px/s) | indefinido |
| Esmaecer as bordas | booleano | falso |
| Cor do esmaecimento | cor CSS | automática (#ffffff / #0b0b0b) |
| Ampliar logo no hover | booleano | falso |
| Função de renderização personalizada por item | função | nenhuma |
| Rótulo acessível da região | string | "Partner logos" |
| Classe e estilo extras do contêiner | string / objeto | vazios |

## Demo
- Área de prévia com **400 px de altura**, sem padding e com overflow oculto. A esteira ocupa a largura toda e fica centralizada verticalmente. Fundo do tema: **`#120F17`** no escuro e `#ffffff` no claro. A cor de esmaecimento é igual ao fundo.
- **10 logos**, cada um um ícone monocromático na cor do texto com título e link externo. Os títulos são React, Next.js, TypeScript, Tailwind CSS, Vercel, GitHub, Docker, Prisma, Supabase e Stripe.
  - **Asset**: a referência usa ícones de marcas de terceiros. Na reimplementação, **não usar esses arquivos**. Gerar 10 glifos próprios em SVG (por exemplo, círculo, triângulo, hexágono, losango, anel, estrela, raio, onda, quadrado arredondado e cruz), preenchidos com a cor atual, mantendo os títulos como texto.
- Rótulo acessível da região: "Our tech stack".
- Valores da demo: velocidade **100**, altura **60**, espaçamento **60**, velocidade no hover **0**, esmaecimento ligado, ampliação ligada, sentido esquerda.
- Opção "render personalizado": cada item é envolvido por uma caixa com padding de 8 px, raio de 8 px e borda de 1 px. No escuro, a borda é `#8b5cf6` e o fundo `rgba(139,92,246,0.1)`. No claro, a borda é `#d4d4d8` e o fundo `rgba(24,24,27,0.035)`.
- Controles:
  - sentido (4 opções);
  - velocidade de 0 a 300 (passo 10);
  - velocidade no hover de 0 a 200 (passo 10);
  - altura de 20 a 120 (passo 5);
  - espaçamento de 10 a 120 (passo 5);
  - chaves de esmaecimento, ampliação e render personalizado.
  - Cada mudança remonta o componente.

## Acessibilidade e responsividade
- O contêiner é uma **região** com nome acessível. Cada cópia é uma **lista**, e só a primeira fica exposta: as demais são ocultas da árvore de acessibilidade.
- O link de cada item tem nome acessível: rótulo explícito, título, texto alternativo ou, em último caso, "logo link". Quando o nó tem link sem rótulo explícito, o próprio nó é ocultado da acessibilidade e o link carrega o nome.
- **Recomendação**: os links das cópias ocultas continuam focáveis por Tab. Tirá-los da ordem de tabulação (índice −1 ou atributo *inert*) evita foco duplicado e invisível.
- **Recomendação**: no movimento reduzido, parar também o laço de quadros, não apenas anular a transformação.
- **Recomendação**: oferecer pausa no foco do teclado (WCAG 2.2.2) além do hover.
- Responsivo: o número de cópias se ajusta à largura do contêiner.

## Observações de fidelidade
- A cor automática de esmaecimento segue o esquema de cores do **sistema operacional**, não o tema da página. Em sites com alternância de tema, isso pode não combinar. Recomenda-se sempre informar a cor.
- O hover é detectado no trilho, cuja largura é a do conteúdo, e não no contêiner. Na prática, cobre toda a faixa visível.
- Quando a velocidade-alvo muda, o laço é reiniciado. Preservar o deslocamento e a velocidade atuais entre reinícios, como a referência faz, evita saltos.
