# Especificação: Galeria em alvenaria (masonry)

## Propósito
Galeria de imagens em colunas de alturas variáveis (layout "masonry"), com posições calculadas em JavaScript. Na entrada, os blocos voam de uma direção escolhida, desfocados, até o lugar. Quando o número de colunas ou a largura muda, os blocos deslizam animados para as novas posições. Há reação sutil ao hover, e o clique abre o link do item.

## Aparência
- **Contêiner**: posicionamento relativo, 100% de largura e 100% de altura do pai. Os blocos são absolutos dentro dele. O contêiner **não** cresce com o conteúdo; o pai define a altura e o corte.
- **Bloco (invólucro)**: absoluto, ancorado no topo-esquerdo e movido por translação. Largura = largura de uma coluna e altura calculada (ver Comportamento). Padding interno de **6 px**, o que forma uma calha visual de 12 px entre blocos. Cursor de ponteiro.
- **Imagem**: preenche o invólucro (100% × 100%) como imagem de fundo em modo "cobrir", centralizada. Raio de **10 px**, sombra `0 10px 50px -10px rgba(0,0,0,0.2)`.
- **Sobreposição de cor** (opcional, desligada por padrão): camada que cobre a imagem, com gradiente linear a 45° de `rgba(255,0,150,0.5)` (magenta) para `rgba(0,150,255,0.5)` (azul), raio de 8 px, opacidade inicial 0 e sem captar eventos.

## Comportamento

### Colunas (pela largura da viewport)
- ≥ 1500 px: **5** colunas;
- ≥ 1000 px: **4**;
- ≥ 600 px: **3**;
- ≥ 400 px: **2**;
- menor: **1**.
Reavalia ao cruzar esses limites.

### Algoritmo de layout
- Largura da coluna = largura medida do contêiner ÷ número de colunas. A largura é observada continuamente.
- Os itens são posicionados em ordem. Cada item vai para a coluna **mais baixa** no momento (em empate, a mais à esquerda). Ele ocupa x = índice da coluna × largura da coluna, y = altura acumulada da coluna, e tem altura = **metade** da altura nominal declarada no item. A altura da coluna cresce na mesma medida.
- Enquanto a largura medida for 0, nada é renderizado.

### Pré-carregamento
Antes de qualquer animação, todas as imagens são pré-carregadas (sucesso ou erro contam como "pronta"). Até lá, os blocos ficam montados sem animação de entrada.

### Animação de entrada (só na primeira vez)
- Cada bloco parte de: opacidade 0, desfoque de **10 px** (se a opção de foco estiver ligada, o que é o padrão) e uma posição de origem conforme a direção:
  - **cima**: mesma coluna, y = −200 px;
  - **baixo** (padrão): mesma coluna, y = altura da janela + 200 px;
  - **esquerda**: x = −200 px, mesma linha;
  - **direita**: x = largura da janela + 200 px, mesma linha;
  - **centro**: centralizado no contêiner;
  - **aleatória**: sorteia por bloco entre cima, baixo, esquerda e direita;
  - valor desconhecido: 100 px abaixo da posição final.
- Vai até a posição final, opacidade 1 e desfoque 0 em **0,8 s** com desaceleração quártica (*ease-out* de potência 4). O atraso por bloco é índice × escalonamento (padrão **0,05 s**).

### Reposicionamento (mudanças posteriores)
Quando colunas, largura ou itens mudam, cada bloco anima x, y, largura e altura até os novos valores. A duração é configurável (padrão **0,6 s**) e a curva também (padrão: desaceleração quártica). Animações em curso no mesmo bloco são substituídas.

Curvas oferecidas: desaceleração quadrática, cúbica, quártica e quíntica; *back-out* (overshoot 1,7); *bounce-out* (quicar); *elastic-out* (amplitude 1, período 0,3); *sine-out*.

### Hover
- **Escala** (ligada por padrão): o bloco inteiro escala para **0,95** em 0,3 s (desaceleração quadrática); volta a 1 ao sair. A escala combina com a translação de posição.
- **Sobreposição de cor** (se ligada): opacidade vai a **0,3** em 0,3 s e volta a 0 ao sair.

### Clique
Abre a URL do item numa nova aba, sem acesso ao contexto de origem.

## Técnica de renderização em alto nível
DOM puro com posicionamento absoluto calculado em JS (não usar colunas CSS nem grid). Animações de transformação, tamanho, opacidade e filtro de desfoque via biblioteca de *tweens* ou Web Animations API, com as curvas descritas. Mede a largura com um observador de redimensionamento e consulta *media queries* para as colunas.

**Assets**: a demo original usa fotos externas em tons de cinza. Na reimplementação, não usar fotos: gerar cada bloco proceduralmente com um gradiente próprio em tons de cinza (por exemplo, gradiente linear diagonal entre dois cinzas sorteados de forma determinística pelo índice, com uma leve textura de ruído ou formas geométricas suaves em SVG), para lembrar fotos de paisagem desaturadas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens: identificador único, imagem (URL ou fonte gerada), link, altura nominal (px; o bloco usa metade) | array | obrigatório |
| Curva do reposicionamento | nome de curva | desaceleração quártica |
| Duração do reposicionamento | número (s) | 0,6 |
| Escalonamento da entrada | número (s) | 0,05 |
| Direção de entrada | cima / baixo / esquerda / direita / centro / aleatória | baixo |
| Encolher no hover | booleano | sim |
| Escala no hover | número | 0,95 |
| Entrada com desfoque para foco | booleano | sim |
| Sobreposição colorida no hover | booleano | não |

## Demo
- Área de prévia com **700 px de altura**, overflow oculto e fundo do tema. Há um botão de "recarregar" no canto que remonta o componente para repetir a entrada.
- **14 itens** com alturas nominais, na ordem: 400, 250, 600, 260, 120, 850, 720, 200, 350, 300, 350, 240, 320, 290. Os blocos ficam com a metade: 200, 125, 300…
- Cada item aponta para um link de exemplo. Imagens em tons de cinza geradas proceduralmente (ver Assets).
- Controles: curva (8 opções); direção (6 opções); duração de 0,1 a 2 s (passo 0,1); escalonamento de 0,01 a 0,2 s (passo 0,01); chaves para escala no hover, desfoque e sobreposição.

## Acessibilidade e responsividade
- **Recomendação**: cada bloco deve ser um link real (âncora com `target` de nova aba e `rel="noopener noreferrer"`), focável, com nome acessível (texto alternativo descritivo) e foco visível; o hover deve ter equivalente em `:focus-visible`.
- Com `prefers-reduced-motion`, pular a entrada (mostrar direto) e reposicionar sem animação.
- Responsivo por *media queries* e pela largura medida do contêiner.

## Observações de fidelidade
- A referência escolhe colunas pela largura da **viewport**, não do contêiner. **Recomendação**: usar a largura do contêiner com os mesmos limites, ou documentar a escolha.
- O contêiner não tem altura própria; o conteúdo pode vazar. **Recomendação**: definir a altura do contêiner como a da coluna mais alta.
- A entrada ignora a duração e a curva configuradas (sempre 0,8 s, quártica). Manter, mas documentar.
- Itens são localizados por atributo com o identificador; identificadores repetidos quebram a animação. Exigir identificadores únicos.
- A sobreposição usa raio de 8 px sobre imagem com raio de 10 px, o que deixa cantos mal casados. **Recomendação**: usar 10 px.
- Bloco clicável sem semântica de link nem teclado (ver Acessibilidade).
