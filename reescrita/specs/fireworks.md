# Especificação: Fundo de fogos de artifício (fireworks)

## Propósito
Um fundo animado em que foguetes sobem continuamente da base da área, deixando um rastro, e explodem em chuvas de partículas que caem com gravidade e se apagam. Um clique lança um foguete que explode na altura do clique.

## Aparência
- **Contêiner**: ocupa 100% × 100% do pai, com posicionamento relativo e overflow oculto. Não tem fundo próprio (transparente).
- **Camada de desenho**: superfície 2D absoluta cobrindo o contêiner inteiro.
- **Foguete**:
  - uma **linha** que liga as últimas posições do foguete (o rastro), com espessura igual ao tamanho do foguete (**2 a 5 px**, sorteado), pontas arredondadas e opacidade total;
  - o rastro guarda entre **10 e 24** posições (sorteado por foguete);
  - sem rastro ainda, desenha apenas um ponto.
- **Partícula da explosão**: círculo preenchido com raio sorteado entre **1 e 5 px**, na cor do foguete, com opacidade decrescente.
- **Cor**:
  - se uma cor for configurada, todos usam essa cor;
  - se for uma lista, cada foguete sorteia uma cor da lista;
  - sem configuração, cada foguete recebe um matiz aleatório saturado: HSL(matiz 0–359, 100%, 50%).

## Comportamento
Os valores são **por quadro**, numa referência de 60 quadros/s. Recomenda-se multiplicar pelo intervalo real ÷ 16,67 ms para ficar independente da taxa de quadros.
- **Lançamento automático**:
  - um foguete é lançado imediatamente e, depois, outro a cada intervalo sorteado entre **300 e 800 ms**, **dividido pela densidade** (padrão 1);
  - posição inicial: x sorteado entre 10% e 90% da largura, y na base;
  - altura-alvo de explosão: sorteada entre **10% e 40%** da altura, a partir do topo.
- **Voo do foguete**:
  - direção para cima com desvio aleatório de **±0,3 rad** (~±17°) em relação à vertical;
  - velocidade escalar sorteada entre **4 e 8 px/quadro**;
  - a cada quadro, registra a posição no rastro, avança pela velocidade e soma **0,02** à velocidade vertical (gravidade leve);
  - explode quando a velocidade vertical deixa de ser para cima ou quando atinge a altura-alvo.
- **Explosão**:
  - gera de **50 a 149** partículas no ponto, cada uma com ângulo uniforme aleatório na volta completa, velocidade sorteada entre **2 e 7 px/quadro** e raio entre 1 e 5 px;
  - cada partícula começa com opacidade 1 e taxa de apagamento sorteada entre **0,005 e 0,02 por quadro** (vida de ~0,8 a ~3,3 s).
- **Física da partícula**, a cada quadro:
  - velocidade × **0,98** (atrito);
  - **+0,05** na velocidade vertical (gravidade);
  - avança a posição;
  - perde opacidade pela taxa;
  - é removida ao chegar a opacidade ≤ 0.
- **Clique**: lança um foguete a partir da base, na coordenada horizontal do clique, com altura-alvo igual à vertical do clique (em coordenadas locais do contêiner). O foguete explode ali, ou antes, se perder impulso.
- **Faixas configuráveis**: velocidade e tamanho do foguete e velocidade e tamanho das partículas aceitam um número fixo ou uma faixa {mínimo, máximo}. Com número fixo, todas as partículas de uma explosão andam igual e formam um **anel circular perfeito**, que cai uniformemente pela gravidade.
- **Quadro**: limpa toda a superfície, atualiza e desenha os foguetes (removendo os que explodiram) e depois atualiza e desenha as partículas.
- **Redimensionamento**: recalcula a resolução da superfície.

## Técnica de renderização em alto nível
Canvas 2D com laço de animação por quadro e listas mutáveis de foguetes e partículas fora do estado React. O rastro é um caminho de linhas (polilinha). As partículas são arcos preenchidos com transparência global. A agenda de lançamentos usa temporizadores encadeados (ou um acumulador de tempo dentro do próprio laço, que é preferível). A superfície deve usar o tamanho real do contêiner (via `ResizeObserver`) multiplicado pelo *device pixel ratio*, desenhando em pixels CSS.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Densidade de lançamentos (divide o intervalo) | número | 1 |
| Cor (única, lista ou aleatória) | string / string[] / nenhum | aleatória |
| Velocidade do foguete | número ou {mín, máx} px/quadro | 4–8 |
| Espessura do foguete | número ou {mín, máx} px | 2–5 |
| Velocidade das partículas | número ou {mín, máx} px/quadro | 2–7 |
| Raio das partículas | número ou {mín, máx} px | 1–5 |
| Lançar ao clicar | booleano | verdadeiro |
| Conteúdo sobreposto | nós | nenhum |

## Demo
- Preenche toda a área de prévia (absoluto, inset 0) com raio de 14 px e fundo transparente (o do palco).
- Cor única dependente do tema: **branco** no tema escuro e **preto** no claro.
- Densidade **1**. Opcional: um controle no canto para a densidade (1 a 10).
- Os primeiros foguetes saem imediatamente, sem precisar de clique.

## Acessibilidade e responsividade
- Decorativo: superfície com `aria-hidden`. O clique é um extra, não uma função.
- Com `prefers-reduced-motion`, não lançar automaticamente (ou lançar muito raramente). Lançar apenas ao clicar.
- Pausar o laço quando o contêiner sair da viewport ou a aba ficar oculta (melhoria).
- Acompanha qualquer tamanho do contêiner.

## Observações de fidelidade
- Recomendação: a referência dimensiona a superfície pela **largura da janela** (altura = largura da janela × proporção do contêiner) e a estica para o contêiner, o que distorce a escala. Além disso, usa coordenadas de viewport no clique, desalinhando o foguete quando o contêiner não está na origem. Use o tamanho do contêiner e coordenadas locais.
- Recomendação: a referência não cancela o temporizador de lançamento ao desmontar (os lançamentos continuam em segundo plano). Cancele tudo na limpeza.
- Recomendação: a referência reinicia o efeito sempre que recebe faixas como objetos novos a cada render. Compare por valor.
- Recomendação: ajuste ao *device pixel ratio* para nitidez.
