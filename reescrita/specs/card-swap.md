# Especificação: Pilha de cartões que se revezam (card-swap)

## Propósito
Pilha de cartões em perspectiva 3D, escalonados em diagonal (cada cartão de trás fica mais à direita, mais acima e mais fundo). Em intervalos regulares, o cartão da frente **cai** para fora da pilha, os demais **avançam** uma posição e o cartão que caiu **volta para o fim da fila**, atrás de todos. É uma vitrine decorativa para hero sections.

## Aparência
- **Contêiner**:
  - posicionado de forma absoluta no **canto inferior direito** do pai;
  - deslocado **+5%** na horizontal e **+20%** na vertical do próprio tamanho, por isso sai parcialmente para fora, à direita e para baixo;
  - origem de transformação no canto inferior direito;
  - tem o tamanho de um cartão (padrão **500 × 400 px**);
  - perspectiva de **900 px** e overflow visível.
- **Cartão (base)**:
  - posicionado de forma absoluta com o **centro** no centro do contêiner;
  - raio de **12 px**, borda de **1 px branca `#fff`** e fundo **preto `#000`**;
  - preserva 3D e oculta a face traseira;
  - largura e altura iguais às do contêiner;
  - o conteúdo vem do consumidor.
- **Inclinação**: todos os cartões recebem um cisalhamento vertical (*skew* no eixo Y) de **6°** (configurável). As bordas superior e inferior ficam inclinadas, o que reforça a sensação de perspectiva.
- **Posições ("vagas") na pilha**: para a posição *i* (0 = frente), com distância horizontal **dX** (padrão **60 px**) e vertical **dY** (padrão **70 px**):
  - x = i × dX;
  - y = −i × dY (para cima);
  - z = −i × dX × 1,5 (para o fundo);
  - ordem de empilhamento = total − i (a frente fica por cima).

## Comportamento

### Ciclo de troca
- A primeira troca começa **imediatamente na montagem** e as seguintes se repetem a cada intervalo (padrão **5000 ms**).
- Com menos de 2 cartões, nada acontece.
- **Sequência de uma troca**, usando a ordem atual: frente F e restantes R₁…Rₙ.
  1. **Queda**: F desloca-se **+500 px em y** (para baixo) durante a duração de queda.
  2. **Promoção**: começa depois de uma fração da queda.
     - Para cada restante Rₖ (k = 0, 1, 2…), a ordem de empilhamento muda na hora para a da vaga k.
     - Rₖ anima x, y e z até a vaga k, com cascata de **0,15 s** entre um e outro.
  3. **Retorno**: começa pouco depois do início da promoção.
     - A ordem de empilhamento de F passa a ser a da última vaga (fica atrás de todos).
     - F anima x, y e z até a **última vaga**. Essa animação assume o controle do y da queda, então o cartão sobe de onde estiver até a posição de trás.
  4. Ao fim, a ordem lógica gira: F vai para o fim da fila.
- **Modos de movimento**:

  | | Elástico (padrão) | "Linear" |
  |---|---|---|
  | Curva | elástica de saída (amplitude 0,6, período 0,9): rápida, com oscilação amortecida ao chegar | suave de entrada e saída (potência 1, *in-out*) |
  | Duração de queda, promoção e retorno | **2 s** cada | **0,8 s** cada |
  | Início da promoção | após **10%** da queda (≈0,2 s) | após **55%** da queda (≈0,44 s) |
  | Início do retorno | **5%** da duração de promoção após o início dela (≈0,3 s do começo) | **20%** da duração de promoção após o início dela (≈0,6 s) |

- **Efeito visual resultante**:
  - o cartão da frente despenca rapidamente para baixo e, quase em seguida, desliza de volta para cima até o fundo da pilha, agora por trás;
  - enquanto isso, os outros avançam em cascata para a frente;
  - no modo elástico, tudo assenta com uma leve oscilação.

### Pausa no hover (opcional, padrão desligado)
- Ao entrar com o ponteiro, a troca em andamento é pausada e o intervalo é cancelado.
- Ao sair, a troca é retomada de onde parou e o intervalo é reiniciado.

### Clique
O clique num cartão chama a ação do cartão (se houver) e informa ao consumidor o **índice original** do cartão clicado.

### Troca de parâmetros
Qualquer mudança de distância, intervalo, pausa, inclinação ou modo reposiciona os cartões nas vagas iniciais e reinicia o ciclo.

## Técnica de renderização em alto nível
Elementos DOM com transformações 3D (translação em x, y e z, mais cisalhamento) dentro de um contêiner com perspectiva. As animações usam uma linha do tempo de *tweens* com rótulos, sobreposições e cascata, mais um temporizador periódico. A ordem lógica dos cartões fica numa referência mutável, sem re-render. A ordem de empilhamento é ajustada explicitamente em momentos precisos da linha do tempo, para o cartão que volta passar **por trás** dos demais.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Largura do cartão/contêiner | número (px) ou string CSS | 500 |
| Altura do cartão/contêiner | número (px) ou string CSS | 400 |
| Distância horizontal entre vagas (também define a profundidade) | número (px) | 60 |
| Distância vertical entre vagas | número (px) | 70 |
| Intervalo entre trocas | número (ms) | 5000 |
| Pausar no hover | booleano | falso |
| Função chamada com o índice do cartão clicado | função | nenhuma |
| Inclinação (cisalhamento vertical) | número (graus) | 6 |
| Modo de movimento | `elastic` / `linear` | `elastic` |
| Cartões (filhos); um subcomponente "cartão" aplica o estilo base e aceita classe extra | nós React | obrigatório |

## Demo
- Área de prévia com **500 px de altura**, overflow oculto e posicionamento relativo, dividida em duas metades lado a lado em telas largas (empilhadas em telas estreitas).
- **Metade esquerda**: texto alinhado à esquerda, centralizado na vertical, com recuo esquerdo de **6rem** em telas largas (centralizado em telas estreitas).
  - Título: **"Card stacks have never looked so good"**, com quebra antes de "looked so good" em telas largas; ~1,875rem, peso 500, altura de linha 1,1.
  - Subtítulo: **"Just look at it go!"**, ~1,25rem, peso 400, cor atenuada.
- **Metade direita**: posicionamento relativo, 100% da altura em telas largas e 400 px em telas estreitas, com a pilha de 3 cartões. Cada cartão é uma coluna com overflow oculto:
  - **faixa de título** no topo: fundo da cor de cartão do tema, borda inferior de 1 px na cor de borda do tema, margem interna de ~8 px, com um ícone pequeno seguido de texto:
    1. círculo preenchido + **"Smooth"**;
    2. símbolo de código `</>` + **"Reliable"**;
    3. controles deslizantes + **"Customizable"**;
  - **corpo**: na referência é uma captura de tela recortada para cobrir a área. **Não usar arquivos**: gerar o corpo com conteúdo procedural, por exemplo gradientes escuros distintos por cartão (violeta, azul e magenta sobre preto), com formas geométricas suaves ou uma grade sutil, preenchendo todo o espaço.
- Controles:
  - pausa no hover;
  - distância horizontal de 30 a 100 (passo 5);
  - distância vertical de 40 a 120 (passo 5);
  - intervalo de 3000 a 8000 (passo 500);
  - inclinação de 0 a 12;
  - modo Elastic/Linear.
- Cada mudança remonta o componente. A animação é automática, sem necessidade de ponteiro.

## Acessibilidade e responsividade
- Conteúdo decorativo em movimento contínuo. **Recomendações**:
  - com `prefers-reduced-motion`, não trocar automaticamente, ou trocar sem queda (*cross-fade* simples);
  - oferecer pausa ao receber foco (critério de "pausar, parar, ocultar"), além do hover;
  - se os cartões forem clicáveis, torná-los focáveis e ativáveis por teclado (**Enter**/**Espaço**).
- **Responsivo**:
  - até **768 px** de largura de viewport, o contêiner é reduzido para **0,75×** e deslocado +25% em x e y;
  - até **480 px**, é reduzido para **0,55×**, com o mesmo deslocamento.

## Observações de fidelidade
- **Nome enganoso**: o modo chamado "linear" na verdade usa uma curva suave de entrada e saída. Manter o comportamento (suave), mas documentar.
- **Animações sem limpeza (defeito)**: a linha do tempo em curso não é encerrada na desmontagem nem quando os parâmetros mudam. Isso pode deixar animações órfãs disputando os mesmos cartões. **Recomendação**: cancelar a linha do tempo atual na limpeza.
- **Retomada desalinhada (defeito)**: ao retomar depois da pausa, o intervalo reinicia do zero, mas a troca pausada continua. A próxima troca pode começar antes de a anterior terminar se o intervalo for menor que a duração (no elástico, ~2,3 s). **Recomendação**: agendar a próxima troca a partir do fim da anterior.
- A queda é interrompida pelo retorno no mesmo eixo y. O efeito visual descrito acima ("cai e volta por trás") é o comportamento desejado.
