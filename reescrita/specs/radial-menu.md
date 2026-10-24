# Especificação: Menu Radial (radial-menu)

## Propósito

Um menu de contexto circular: ao clicar com o botão direito sobre uma área, surge sob o cursor um anel dividido em fatias, uma por ação, cada uma com um ícone. Passar o ponteiro realça a fatia, e clicar executa a ação.

## Aparência

### Geometria

O padrão é um diâmetro total D = 240 px, com raio R = 120 px. De fora para dentro:

| Camada | Raios | Padrão |
|---|---|---|
| Anel externo fino, dividido nas mesmas fatias | de R até R − largura do anel | 120 → 108 px (anel de 12 px) |
| Espaço externo vazio | — | 8 px |
| Faixa principal de fatias, onde ficam os ícones | 100 → 50 px | faixa de 50 px |
| Espaço interno vazio | — | 8 px |
| Disco central | até 42 px | — |
| Pequeno anel no centro exato | 3 px | só contorno |

- Os ícones ficam centralizados no raio médio da faixa principal (75 px), no ângulo central de cada fatia.
- **Fatias**
  - Com N itens, cada fatia tem 360°/N.
  - A primeira fatia fica **centralizada no topo**, a −90°, e as seguintes seguem em sentido horário.
  - Exemplo com 6 itens: fatias de 60°, com a primeira cobrindo de −120° a −60°.
  - A fatia do anel externo e a fatia da faixa principal de um mesmo item têm o mesmo ângulo.
- **Casos especiais de geometria**
  - Com um único item, cada camada vira um anel completo (rosca), com furo no meio.
  - Com 2 itens, cada fatia tem 180° e deve ser desenhada corretamente como meia-rosca.

### Cores

Tema claro / tema escuro, em tons de cinza neutro:

| Elemento | Tema claro | Tema escuro |
|---|---|---|
| Fatias (anel e faixa) em repouso | `#f5f5f5` | `#262626` |
| Fatias realçadas, ambas as camadas do item ativo | `#e5e5e5` | `#404040` |
| Contorno de 1 px das fatias da faixa principal (o anel externo não tem contorno) | `#d4d4d4` | `#525252` |
| Ícone em repouso | `#525252` | `#a3a3a3` |
| Ícone ativo | `#171717` | `#fafafa` |
| Disco central: preenchimento (o disco inteiro com 50% de opacidade) | `#f5f5f5` | `#0a0a0a` |
| Disco central: contorno de 1 px | `#a3a3a3` | `#525252` |
| Anel minúsculo central: contorno, sem preenchimento | `#a3a3a3` | `#525252` |

### Ícones e janela

- **Ícones**: tamanho padrão de 18 × 18 px, em ícones de traço fino. Cada um fica no centro de uma área clicável circular com o dobro do tamanho (36 × 36 px).
- **Janela do menu**
  - Circular, recortada no círculo, com o diâmetro D.
  - Sombra grande e suave: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`.
  - Sem contorno de foco.
- **Área-gatilho**
  - Sem conteúdo fornecido, aparece uma caixa de 320 × 320 px com borda tracejada de 2 px na cor de borda do tema, cantos de 8 px e o texto "Right-click here." centralizado.
  - A área-gatilho não permite selecionar texto e não mostra contorno de foco.

## Comportamento

### Abrir

- Clicar com o botão direito na área-gatilho abre o menu. Em dispositivos de toque, um toque longo tem o mesmo efeito.
- O menu nativo do navegador é suprimido.
- O círculo aparece **centralizado no ponto do clique**.
- Aparece numa camada sobreposta à página (portal), acima de todo o conteúdo.

### Animação de entrada e saída

- **Entrada**: de opacidade 0 e escala 0,5 para opacidade 1 e escala 1, com mola de rigidez 420, amortecimento 32 e massa 1. É rápida, com um leve assentamento.
- **Saída**: o inverso (para opacidade 0 e escala 0,5), com a mesma mola. O elemento só sai da árvore depois que a animação termina.

### Realce

- Passar o ponteiro sobre qualquer parte de uma fatia torna o item ativo e move o foco do teclado para ele.
- O item ativo realça ao mesmo tempo a fatia do anel externo e a da faixa, e o ícone fica mais escuro (ou mais claro no tema escuro).
- A troca de cor das fatias é quase instantânea: cerca de 50 ms com desaceleração ("ease-out").
- Só existe um item ativo por vez.
- O realce **não** some quando o ponteiro sai de uma fatia para o centro. Ele permanece no último item até outro ser escolhido ou o menu fechar.

### Selecionar

- Clicar em qualquer ponto de uma fatia (anel externo, faixa ou ícone) aciona o item: o retorno de chamada recebe o item inteiro (identificador, rótulo e ícone).
- Depois disso o menu fecha com a animação de saída.

### Teclado

- Com o menu aberto, os itens formam uma lista navegável:
  - setas para baixo e para cima percorrem os itens na ordem da lista (equivalente a horário e anti-horário);
  - Home e End vão para o primeiro e o último;
  - Enter e Espaço acionam o item focado;
  - Esc fecha.
- O foco num item também o torna ativo (realce visual).
- Digitar letras pode saltar para itens pelo rótulo (busca por digitação), que é o comportamento padrão de menus acessíveis.

### Fechar

- O menu fecha ao clicar fora, ao pressionar Esc ou ao selecionar um item.
- Ao fechar, o item ativo é limpo. Ao reabrir, nenhuma fatia está realçada.

## Técnica de renderização em alto nível

- A janela é um contêiner circular cujo interior é **um único SVG**, com sistema de coordenadas centrado na origem (de −R a +R nos dois eixos).
- **Fatias**
  - Cada fatia de rosca é um caminho fechado: arco externo no sentido horário, linha até o raio interno, arco interno no sentido anti-horário e fechamento.
  - Os pontos são obtidos por conversão polar → cartesiana a partir dos ângulos de início e fim (ângulo central ± meia fatia).
  - O indicador de "arco grande" é ligado quando a fatia passa de 180°.
  - O caso de item único é desenhado como duas circunferências completas (externa e interna) com regra de preenchimento que deixa o furo.
- **Grupos**: para cada item há um grupo com as duas fatias (anel e faixa) e o ícone. O ícone fica embutido no SVG como um elemento HTML (objeto estrangeiro), centrado no ponto polar do raio médio.
- **Comportamento de menu**: abrir/fechar, foco, navegação por teclado, clique fora, posicionamento no cursor e portal vêm de um primitivo de "menu de contexto" acessível de uma biblioteca de componentes sem estilo. Cada ícone é o item de menu real. Hover e clique na fatia são encaminhados ao item correspondente (focar e clicar).
- **Animação**: a entrada e a saída usam uma biblioteca de animação com molas e suporte a animação de saída.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Lista de itens; cada um com identificador único, rótulo (texto acessível) e componente de ícone | lista | obrigatório |
| Conteúdo da área-gatilho | nó React | caixa tracejada padrão |
| Diâmetro total do menu, em px | número | 240 |
| Tamanho do ícone, em px (a área clicável tem o dobro) | número | 18 |
| Largura radial da faixa principal de fatias, em px | número | 50 |
| Espaço entre a faixa principal e o disco central, em px | número | 8 |
| Espaço entre o anel externo e a faixa principal, em px | número | 8 |
| Largura do anel externo, em px | número | 12 |
| Retorno de chamada ao selecionar um item (recebe o item) | função | nenhum |

Todos os raios internos derivam desses valores. O disco central nunca tem raio negativo: o mínimo é 0.

## Demo

- **Área-gatilho**
  - Caixa de 320 × 320 px, borda tracejada de 2 px e cantos de 8 px.
  - Texto centralizado "Right click to open the radial menu".
  - Fica centralizada na prévia.
- **Seis itens**, nesta ordem a partir do topo, em sentido horário:
  1. Copiar: ícone de duas folhas sobrepostas.
  2. Recortar: ícone de tesoura.
  3. Colar: ícone de prancheta com folha.
  4. Favoritar: ícone de estrela.
  5. Fixar: ícone de alfinete ou tachinha.
  6. Excluir: ícone de lixeira.
- Os rótulos originais são em inglês: Copy, Cut, Paste, Favorite, Pin e Delete.
- Selecionar um item só registra o item no console.
- Os demais parâmetros ficam no padrão.

## Acessibilidade e responsividade

- **Semântica**
  - A janela tem papel de menu e cada ícone é um item de menu com nome acessível igual ao rótulo, já que não há texto visível.
  - O foco vai para o menu ao abrir e volta para o gatilho ao fechar.
- **Teclado**
  - Navegação completa conforme a seção Comportamento.
  - Não há anel de foco visível: o foco é indicado pelo realce da fatia e do ícone. Garanta contraste suficiente nesse realce.
- **Toque**: abre com toque longo.
- **Telas pequenas**: o menu tem tamanho fixo em px. Perto das bordas da tela, o posicionador pode deslocá-lo para que caiba na janela visível.
- **Movimento reduzido**: recomenda-se, sob preferência de movimento reduzido, trocar a mola de escala por um simples aparecer e desaparecer.
