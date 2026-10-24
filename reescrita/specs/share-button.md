# Especificação: Botão de compartilhar (share-button)

## Propósito
Um botão sólido que mostra o rótulo "Share". Quando o ponteiro passa sobre ele, o rótulo sobe e some, e no lugar surgem, de baixo para cima e com um pequeno salto escalonado, três ícones de redes. Cada ícone pode ser clicado para compartilhar na plataforma correspondente.

## Aparência
- **Botão**:
  - inline-flex com conteúdo centralizado, posicionamento relativo e **overflow oculto** (o conteúdo que entra e sai é cortado nas bordas);
  - fundo da cor primária do tema: quase preto ~`#171717` no claro e cinza muito claro ~`#e5e5e5` no escuro;
  - texto na cor de contraste da primária: quase branco ~`#fafafa` no claro e quase preto no escuro;
  - no hover, o fundo fica com 90% de opacidade;
  - fonte de **14 px**, peso 500, sem quebra de linha;
  - cursor de ponteiro;
  - transição suave de todas as propriedades (padrão de ~150 ms).
- **Tamanhos**:

| Tamanho | Altura | Largura mínima | Padding horizontal | Raio | Ícones de rede |
|---|---|---|---|---|---|
| padrão | 40 px | 112 px | 16 px (vertical 8 px) | ~8–10 px | 16 px |
| pequeno | 36 px | 96 px | 12 px | ~6 px | 16 px |
| médio | 40 px | 112 px | 16 px | ~8–10 px | 20 px |
| grande | 44 px | 128 px | 32 px | ~8–10 px | 28 px |

  Como as camadas internas têm posicionamento absoluto, a largura efetiva do botão é a **largura mínima** do tamanho escolhido.
- **Camada de conteúdo** (repouso): ocupa o botão inteiro (absoluta, com as quatro bordas em 0), em flex centralizado com **8 px** de espaço. Mostra o texto do botão e, opcionalmente, um ícone de "compartilhar" de **16 px** antes ou depois do texto. O ícone é o glifo clássico de três círculos ligados por duas linhas, em forma de "<".
- **Camada de ícones** (hover): também absoluta e centralizada, com uma fileira de três ícones espaçados por **12 px**. Cada ícone tem uma área clicável com **12 px** de padding vertical e raio de 8 px. Ícones, na ordem:
  1. silhueta de **gato/polvo** (estilo do logotipo de repositório de código);
  2. um **"×"** (dois traços cruzados);
  3. um **"f"** minúsculo em traço.
  - Todos são ícones de traço, na cor do texto do botão.
  - **Assets**: desenhar esses glifos com SVG próprio, em traço simples. Não usar logotipos oficiais nem pacotes de marca.

## Comportamento
- **Estado**: booleano de "ponteiro sobre o botão", ativado na entrada do mouse e desativado na saída.
- **Entrada do ponteiro** (troca sequencial: a saída termina antes da entrada começar):
  1. a camada de conteúdo sai **para cima**: opacidade de 1 a 0 e Y de 0 a **−24 px**, em **0,3 s**;
  2. a camada de ícones entra **de baixo**: opacidade de 0 a 1 e Y de **+24 px** a 0, em 0,3 s;
  3. simultaneamente, cada ícone faz a própria entrada (opacidade de 0 a 1 e Y de +24 px a 0) com **mola de duração 0,5 s e "bounce" 0,4**, que produz um leve salto. Os atrasos são **0 s**, **0,1 s** e **0,2 s**, nessa ordem.
- **Hover em um ícone**: ele sobe **8 px** em 0,2 s com ease-out e volta ao sair.
- **Saída do ponteiro**:
  1. a camada de ícones sai **para baixo**: opacidade de 1 a 0 e Y de 0 a +24 px, em 0,3 s;
  2. a camada de conteúdo reaparece já no lugar, sem animação de entrada (ela nasce com opacidade 1 e Y 0).
- **Montagem**: a camada de conteúdo aparece sem animação.
- **Clique em um ícone**: chama o callback de clique de ícone com a plataforma ("github", "x" ou "facebook") e o evento. O clique também se propaga para o botão (qualquer ação de clique do botão também dispara).
- **Desabilitado**: sem interação de ponteiro e com opacidade de 50%.
- **Foco**: anel de ~3 px na cor de foco do tema a 50% de opacidade (`:focus-visible`).

## Técnica de renderização em alto nível
DOM + CSS, com animações de entrada e saída controladas por presença (manter o elemento montado até o fim da saída, em modo "espera": sai um, depois entra o outro). Os ícones usam mola com "bounce" e um gesto de hover que desloca Y. É possível implementar com uma biblioteca de animação ou com transições CSS e estados intermediários controlados por eventos de fim de transição.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo do botão (texto) | nós React | obrigatório |
| Tamanho | `padrão` / `pequeno` / `médio` / `grande` | padrão |
| Posição do ícone de compartilhar | `antes` / `depois` / nenhum | nenhum |
| Callback ao clicar em um ícone de rede (plataforma, evento) | função | nenhuma |
| Classe extra | string | vazia |
| Demais atributos de botão | — | — |

## Demo
- Botão centralizado na área de prévia (fundo do tema), com o texto **"Share"**, tamanho padrão e sem ícone de compartilhar.
- A prévia oferece controles de tamanho (pequeno, médio, grande) e de posição do ícone (antes, depois).

## Acessibilidade e responsividade
- Problemas da referência a corrigir (**recomendação**):
  - os ícones de rede são `div`s clicáveis aninhados dentro de um `button`, o que é inválido semanticamente e inacessível por teclado. Renderizar o grupo de ícones como elementos irmãos focáveis (por exemplo, uma barra de três botões com `aria-label` "Compartilhar no GitHub" e equivalentes), revelada também em `:focus-within`;
  - o "×" representa a rede X, mas o glifo usado é um sinal de fechar, o que confunde. Usar um "X" estilizado próprio ou um rótulo textual acessível;
  - em telas de toque não existe hover, então os ícones nunca aparecem. Revelar o grupo ao tocar (primeiro toque abre, segundo toque escolhe) ou ao focar.
- O texto "Share" deve continuar disponível como nome acessível do botão.
- Com `prefers-reduced-motion`, trocar deslocamentos e molas por um cruzamento simples de opacidade.

## Observações de fidelidade
- O tamanho de ícone passado ao ícone de compartilhar é sobrescrito por uma classe fixa de 16 px, então ele é sempre de 16 px. Manter 16 px.
- O padding extra aplicado conforme a posição do ícone não tem efeito visível, porque o conteúdo é absoluto. Pode ser ignorado.
- O retorno do conteúdo, depois que os ícones saem, é abrupto. Recomendação opcional: fazer o conteúdo entrar de cima (Y de −24 px a 0, 0,3 s), para simetria.
