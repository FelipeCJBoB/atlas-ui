# Especificação: Parede à deriva (drift-wall)

## Propósito
Um mural de imagens organizado em colunas verticais que deslizam sem parar, em sentidos alternados, sobre um plano inclinado em 3D. O plano reage levemente à posição do ponteiro (paralaxe), as bordas do mural se dissolvem em transparência e o bloco sob o ponteiro (ou com foco) para a sua coluna, acende e "sobe" na direção do observador. Serve como fundo/vitrine de portfólio ou galeria.

## Aparência
- **Contêiner raiz**: ocupa 100% × 100% do pai, posicionamento relativo, overflow oculto, com **perspectiva 3D de 1200 px** (origem no centro). Não tem cor de fundo própria: o que aparece por trás é o fundo da página.
- **Máscara de dissolução** aplicada ao contêiner inteiro, resultado da **interseção** de duas máscaras:
  1. uma elipse radial com raios de **78% (horizontal) × 82% (vertical)**, centrada em **50% / 46%**, opaca do centro até uma "borda" e indo a transparente em 100%;
  2. um gradiente linear de baixo para cima, opaco da base até a mesma "borda" e transparente no topo.
  - A posição da borda é **(1 − intensidade de dissolução) × 100%**. Com a intensidade padrão **0,6**, a borda fica em **40%**. Efeito: o mural some suavemente para as laterais e, principalmente, para o topo.
- **Plano**: caixa absoluta centrada no contêiner (topo e esquerda a 50% e deslocamento de −50%/−50% do próprio tamanho), com preservação de 3D e cursor de ponteiro. Transformação, aplicada nesta ordem: escala uniforme **1,18**; rotação em X de **16°** (inclinação) somados à paralaxe vertical; rotação em Y de **−14°** (giro) somados à paralaxe horizontal; rotação em Z de **0°**; e recuo em Z de **−120 px**.
- **Colunas**: dispostas lado a lado em linha. Cada coluna tem largura = largura do bloco + espaçamento (**200 + 18 px**). Dentro dela, uma "esteira" vertical com os blocos empilhados.
- **Bloco (célula)**: célula de altura = altura do bloco + espaçamento (**132 + 18 px**), largura total da coluna. O cartão visível fica inset de metade do espaçamento (9 px) em todos os lados, resultando em **200 × 132 px**.
  - raio de **14 px**, overflow oculto, fundo de reserva **`#0b0b12`**;
  - imagem cobrindo o cartão inteiro (recorte tipo "cover"), com filtro de **saturação 0,92** (e escala de cinza total se a opção de tons de cinza estiver ligada);
  - camada de tinta por cima, cor **`#060010`** (quase preto arroxeado) com **opacidade 0,42**;
  - **opacidade do cartão em repouso: 0,55**.
- **Bloco ativo** (sob o ponteiro ou com foco por teclado):
  - opacidade 1;
  - deslocamento em Z de **+64 px** (sai do plano na direção do observador);
  - sombra **0 24px 60px −18px rgba(0,0,0,0.7)**;
  - imagem sem cinza e com saturação 1,05;
  - camada de tinta com opacidade 0.
  - Com foco por teclado, soma-se à sombra um **anel de 2 px `rgba(255,255,255,0.9)`**.
- Todas as mudanças de estado do cartão (transformação, opacidade, sombra, filtro, tinta) transicionam em **0,42 s** com curva cúbica de saída forte **(0,22; 1; 0,36; 1)**.

### Imagens (assets)
O original usa fotografias externas de paisagens/objetos em proporção 3:2. **Não usar arquivos nem serviços externos**: gerar as imagens de forma procedural, por exemplo um SVG ou gradiente por bloco (céus em degradê, colinas em camadas, formas geométricas suaves) com paleta variada por índice, mantendo a proporção 3:2. A API deve aceitar imagens fornecidas pelo usuário.

## Comportamento

### Distribuição em colunas
- Os itens são distribuídos de forma alternada: o item i vai para a coluna (i módulo número de colunas). Uma coluna que ficaria vazia recebe o primeiro item.
- Para cobrir a altura, cada coluna repete a sua lista de itens várias vezes. Seja "altura de uma cópia" = número de itens da coluna × (altura do bloco + espaçamento), com mínimo de uma unidade. Número de cópias = máximo entre **2** e (arredondar para cima (1,6 × altura do contêiner ÷ altura de uma cópia) + 1).
- A altura do contêiner é observada continuamente (padrão de reserva 600 px quando não há medida).

### Deriva contínua
- **Velocidade base de cada coluna** = velocidade (padrão **42 px/s**) × fator da coluna × sinal da direção × sinal alternado.
  - **Sinal da direção**: "para cima" = +1 e "para baixo" = −1.
  - **Sinal alternado**: +1 nas colunas pares (0, 2, 4…) e −1 nas ímpares. Colunas vizinhas andam em sentidos opostos.
  - **Fator da coluna** = 1 + variação × r, em que r é um valor pseudoaleatório determinístico em [−1, 1] obtido pela parte fracionária de (índice × razão áurea conjugada 0,618… + 0,35), reescalada para [−1, 1]. A variação padrão é **0,45**.
- **Deslocamento inicial** de cada coluna = altura de uma cópia × parte fracionária de (índice × 0,37). As colunas começam defasadas.
- A cada quadro, o deslocamento avança velocidade × dt, **com dt limitado a 50 ms**. O resultado é reduzido módulo a altura de uma cópia (sempre positivo), o que torna o laço sem emendas. A esteira é transladada verticalmente pelo negativo do deslocamento: deslocamento crescente faz a coluna subir.
- **A velocidade não salta**: ela persegue a velocidade-alvo com suavização exponencial. A constante de tempo é **0,28 s** ao acelerar rumo a um alvo não nulo e **0,16 s** ao frear rumo a zero. Na montagem, a velocidade parte de 0, então as colunas "dão a partida" suavemente.

### Interação com o ponteiro
- **Paralaxe**: a posição do ponteiro é normalizada em [−0,5; 0,5] nos dois eixos, em relação ao contêiner. O desvio máximo é intensidade × **8°** (intensidade padrão **0,6**, ou seja, 4,8°).
  - Alvo do giro extra em Y = x normalizado × desvio máximo.
  - Alvo da inclinação extra em X = −y normalizado × desvio máximo.
  - Os valores atuais perseguem os alvos com suavização exponencial de constante **0,12 s**.
  - Ao sair do contêiner, o alvo volta a (0, 0).
  - Com intensidade 0, não há paralaxe.
- **Bloco ativo por ponteiro**: a cada movimento, identifica-se o bloco sob o ponteiro com um teste de hit no ponto. A camada interna do cartão não captura eventos; a célula inteira, incluindo a margem do espaçamento, conta como alvo. Quando muda, esse bloco vira o ativo e **a coluna dele freia até parar** (alvo de velocidade 0). As demais continuam.
- Ao sair do contêiner, nenhum bloco fica ativo e todas as colunas voltam a acelerar.
- **Pausa geral opcional** (desligada por padrão): com o ponteiro em qualquer lugar sobre o mural, todas as colunas freiam até parar.
- **Teclado**: cada bloco é focável por Tab. Receber foco o torna ativo e para a coluna dele. Perder o foco limpa o estado ativo.
- **Clique**: se o item tem um link, o bloco é um link que abre em nova aba (sem referenciador). Sem link, o bloco é um botão sem ação.

### Movimento reduzido
Se o sistema pedir movimento reduzido (consultado na montagem e escutado ao vivo):
- as colunas ficam paradas nos deslocamentos iniciais;
- a paralaxe é desativada;
- o realce do bloco ativo continua funcionando.

## Técnica de renderização em alto nível
Puro DOM + CSS 3D: perspectiva no contêiner, plano com preservação de 3D, rotações e recuo em Z. Os blocos ativos sobem com uma translação em Z animada por transição CSS. A dissolução das bordas usa máscara CSS composta por interseção (radial × linear). Um laço por quadro do navegador (requestAnimationFrame) escreve diretamente as transformações do plano e de cada esteira, sem re-render da UI. Só a troca do bloco ativo passa pelo estado do componente. A deriva é um laço modular (esteira repetida), e as suavizações são filtros exponenciais de primeira ordem dependentes de dt (fator 1 − e^(−dt/τ)).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de itens (imagem, título opcional, link opcional) | array | 15 blocos de exemplo gerados |
| Número de colunas | inteiro | 5 |
| Largura do bloco | número (px) | 200 |
| Altura do bloco | número (px) | 132 |
| Espaçamento entre blocos e colunas | número (px) | 18 |
| Raio dos cantos | número (px) | 14 |
| Inclinação do plano (rotação em X) | graus | 16 |
| Giro do plano (rotação em Y) | graus | −14 |
| Rotação no próprio plano (Z) | graus | 0 |
| Distância de perspectiva | número (px) | 1200 |
| Recuo do plano em profundidade | número (px) | 120 |
| Velocidade base | px/s | 42 |
| Direção principal | "para cima" / "para baixo" | para cima |
| Variação de velocidade entre colunas | 0–1 | 0,45 |
| Intensidade da paralaxe (0 desliga) | número | 0,6 |
| Pausar tudo com o ponteiro sobre o mural | booleano | falso |
| Elevação do bloco ativo em Z | número (px) | 64 |
| Intensidade da dissolução das bordas | 0–1 | 0,6 |
| Opacidade dos blocos em repouso | 0–1 | 0,55 |
| Tons de cinza em repouso | booleano | falso |
| Cor da tinta sobre blocos em repouso | cor CSS | `#060010` |
| Classe e estilo extras do contêiner | string / objeto | vazios |

## Demo
- Área de prévia com **600 px de altura**, largura total, overflow oculto, sem padding e fundo escuro do site (quase preto).
- **16 itens** com imagens procedurais variadas, títulos "Tile 1" a "Tile 16" e um link de exemplo, todos com os parâmetros padrão.
- O efeito principal (deriva) é automático, então não precisa de ponteiro. Para a prévia estática, recomenda-se também simular uma paralaxe suave automática (por exemplo, um ponteiro virtual em órbita lenta) enquanto não houver ponteiro real.
- Controles da demo:
  - cor da tinta;
  - colunas de 2 a 8;
  - largura do bloco de 120 a 280 (passo 4);
  - altura do bloco de 90 a 220 (passo 2);
  - espaçamento de 0 a 48 (passo 2);
  - raio de 0 a 40;
  - direção;
  - velocidade de 0 a 120 (passo 2);
  - variação de 0 a 1 (passo 0,05);
  - inclinação de −30 a 40;
  - giro de −30 a 30;
  - rotação Z de −20 a 20;
  - perspectiva de 600 a 2400 (passo 50);
  - recuo de 0 a 400 (passo 10);
  - paralaxe de 0 a 2 (passo 0,1);
  - elevação de 0 a 140 (passo 4);
  - dissolução de 0 a 1;
  - opacidade em repouso de 0,15 a 1;
  - pausa ao passar o ponteiro;
  - tons de cinza.

## Acessibilidade e responsividade
- O contêiner tem papel de **grupo** com rótulo acessível descritivo ("mural de blocos à deriva").
- Blocos sem link: papel de botão, focáveis, com o título como nome acessível.
- Blocos com link: link nativo.
- As imagens usam o título como texto alternativo.
- O foco visível é o anel branco de 2 px descrito acima.
- Respeita `prefers-reduced-motion` (ver Comportamento).
- Responsivo: o número de cópias se adapta à altura do contêiner. A largura não é adaptada (colunas de largura fixa), então em telas estreitas o mural é cortado pelas laterais. Isso é aceitável porque o plano está escalado e mascarado.
- **Recomendação**: como as esteiras repetem os itens, apenas a primeira cópia de cada item deveria ser focável e anunciada. As cópias deveriam ficar fora da ordem de Tab e ocultas para leitores de tela.

## Observações de fidelidade
- **Recomendação**: na referência, o bloco ativo só é trocado quando o ponteiro passa sobre outro bloco. Mover o ponteiro para uma área vazia do contêiner, ainda dentro dele, mantém o bloco anterior ativo e a coluna parada. Limpar o estado ativo quando o teste de hit não encontrar bloco é uma melhoria aceitável.
- A referência mantém o laço de animação sempre ativo, inclusive com movimento reduzido. Pausá-lo quando a parede estiver fora da tela ou parada é uma otimização permitida.
- **Recomendação**: no Safari antigo, a máscara composta pode exigir o prefixo e o modo de composição equivalente ("source-in").
