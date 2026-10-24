# Especificação: Lista de tarefas com rabisco (playful-todolist)

## Propósito
Um cartão com uma pequena lista de tarefas. Cada tarefa tem uma caixa de seleção animada. Ao marcar uma tarefa, um **rabisco feito à mão** é desenhado progressivamente por cima do texto, como se alguém o riscasse com caneta. Ao desmarcar, o rabisco é "apagado" no sentido inverso. É um componente demonstrativo e lúdico, sem configuração externa.

## Aparência
- **Cartão**:
  - fundo `#f5f5f5` no tema claro e `#171717` no tema escuro;
  - raio de **16 px** e padding de **24 px**;
  - **24 px** de espaço vertical entre os blocos de cada tarefa.
- **Bloco de tarefa**: a linha da tarefa e, exceto na última, um divisor abaixo dela, separados por 24 px.
- **Divisor**: linha horizontal de 1 px, cor `#d4d4d4` (claro) ou `#404040` (escuro), ocupando toda a largura interna.
- **Linha da tarefa**: flex com itens centralizados verticalmente e **8 px** entre a caixa e o texto.
- **Caixa de seleção** (variante "preenchida"):
  - quadrado de **20 px** com raio pequeno (~4–6 px), sem borda;
  - fundo da cor de "campo de entrada" do tema: cinza claro ~`#e5e5e5` no claro e branco a ~15% de opacidade no escuro;
  - quando **marcada**: fundo da cor primária do tema (quase preto ~`#171717` no claro, cinza muito claro ~`#e5e5e5` no escuro) e marca de verificação na cor de contraste da primária (quase branco no claro, quase preto no escuro). A troca de fundo usa transição de cor de **500 ms**.
- **Marca de verificação**: desenhada em SVG com **14 px**. É um "check" clássico: traço que começa à esquerda, perto do meio da altura, desce até um vértice inferior a cerca de 45% da largura e sobe em diagonal longa até perto do canto superior direito. Espessura grossa (~3,5 unidades numa grade de 24), pontas e junções arredondadas, cor = cor do texto da caixa.
- **Texto da tarefa**: 14 px, peso 500, altura de linha 1 (compacta), cor do texto principal. Fica dentro de um invólucro `inline-block` com posicionamento relativo, que também serve de âncora para o rabisco.
- **Rabisco**:
  - SVG posicionado de forma absoluta sobre o texto, alinhado à esquerda e centralizado verticalmente (topo a 50% com deslocamento de −50%);
  - largura de **100% do texto** e altura de **40 px**;
  - camada acima do texto, sem capturar ponteiro;
  - o desenho é concebido numa caixa de proporção **340 × 32** e esticado para a largura do texto (sem preservar proporção), mas a espessura do traço é **fixa em 2 px** na tela, independente da escala;
  - traço com pontas arredondadas, sem preenchimento, cor `#171717` (claro) ou `#f5f5f5` (escuro).
  - **Forma do rabisco**: uma única linha contínua que atravessa o texto da esquerda para a direita em ziguezague solto, com **duas pequenas laçadas**. Ela parte da esquerda, um pouco abaixo do meio, sobe em curva suave até perto do topo por volta de 1/3 da largura e volta para a esquerda e para baixo, formando a primeira laçada que desce até perto da base. Depois faz uma subida longa e inclinada até perto do topo por volta de 60% da largura, desce novamente numa pequena laçada até a base e termina num traço longo que sobe suavemente até a ponta direita, um pouco acima do meio. Gerar um caminho próprio com esse caráter (ondulado, assimétrico, "à mão"). Não é necessário reproduzir uma curva exata.

## Comportamento
- **Estado**: um booleano por tarefa, começando todos desmarcados.
- **Alternar**: clicar na caixa ou no texto (que é o rótulo associado à caixa) alterna a tarefa. Teclado: Espaço com a caixa focada.
- **Caixa de seleção**:
  - hover: escala **1,05**; pressionado: escala **0,95** (com a animação padrão de mola da biblioteca);
  - ao marcar, o fundo passa à cor primária (transição de 500 ms) e o check é **desenhado** do início ao fim (comprimento do traço de 0 a 100%, com opacidade de 0 a 1) em **0,2 s**, começando após **0,2 s** de atraso;
  - ao desmarcar, o check é recolhido (comprimento de 100% a 0%, opacidade de 1 a 0) em 0,2 s, sem atraso.
- **Rabisco ao marcar**: o comprimento visível do traço vai de 0 a 100% em **1 s** com ease-in-out, desenhando-se da esquerda para a direita. A opacidade salta para 1 quase instantaneamente (≈10 ms), sem atraso.
- **Rabisco ao desmarcar**: o comprimento visível volta de 100% a 0% em 1 s com ease-in-out (o traço "recua" da direita para a esquerda). A opacidade vai a 0 em ≈10 ms, mas só **após 1 s de atraso**, isto é, quando o recuo termina. Isso evita que reste um ponto visível da ponta arredondada.
- **Montagem**: nenhuma animação inicial; tudo começa no estado desmarcado, sem rabisco.
- **Interrupção**: marcar e desmarcar rapidamente reverte a animação a partir do ponto atual.

## Técnica de renderização em alto nível
DOM + SVG. O rabisco e o check são caminhos SVG cujo "comprimento desenhado" é animado (técnica de traço tracejado com deslocamento, ou o equivalente de uma biblioteca de animação). A espessura constante sob escala não uniforme exige o modo de traço que não escala com a transformação. A caixa de seleção é um botão acessível com estado marcado/desmarcado (pode partir de uma primitiva headless de checkbox ou de um botão com papel de checkbox).

## Parâmetros configuráveis
A referência não expõe parâmetros: as tarefas são fixas no próprio componente. Recomenda-se expor:

| Significado | Tipo | Padrão |
|---|---|---|
| Tarefas: id, texto, marcada inicialmente | array | as 3 da demo, todas desmarcadas |
| Duração do desenho do rabisco | número (s) | 1 |
| Callback de mudança (id, novo estado) | função | nenhuma |

## Demo
- Cartão centralizado na área de prévia (fundo do tema), com largura determinada pelo conteúdo (~300–360 px).
- Três tarefas, todas desmarcadas:
  1. "Code in Assembly 💾"
  2. "Present a bug as a feature 🪲"
  3. "Push to prod on a Friday 🚀"

## Acessibilidade e responsividade
- Cada caixa tem papel de checkbox, estado `aria-checked` e rótulo associado (o texto da tarefa). O clique no texto alterna a caixa.
- O rabisco é decorativo (`aria-hidden`). O estado "concluída" é comunicado pela caixa.
- Foco visível: anel de ~3 px na cor de foco do tema a 50% de opacidade, com afastamento de 2 px.
- Estado desabilitado (se exposto): opacidade de 50% e cursor "não permitido".
- Com `prefers-reduced-motion`, mostrar o rabisco e o check completos de imediato.
- O rabisco acompanha a largura do texto. Textos que quebram em várias linhas recebem um único rabisco centralizado verticalmente sobre o bloco. Recomendação: evitar quebra (texto em uma linha) ou aceitar esse comportamento.

## Observações de fidelidade
- Os itens são fixos dentro do componente. Recomendação: torná-los configuráveis, como descrito acima.
- O rabisco tem altura fixa de 40 px, mesmo com o texto de 14 px. Ele extrapola o texto para cima e para baixo de propósito (efeito de rasura exagerada). Manter.
