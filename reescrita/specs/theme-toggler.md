# Especificação: Botão de troca de tema (theme-toggler)

## Propósito

Um botão quadrado com ícone (sol, lua ou monitor) que alterna o tema claro/escuro (e opcionalmente "do sistema"). A troca não é instantânea: o novo tema é **revelado progressivamente** por uma cortina que varre a tela numa direção (da esquerda para a direita, por padrão), sobre a imagem congelada do tema antigo.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Destaque ("accent") | `#f5f5f5` | `#262626` |
| Texto sobre destaque | `#171717` | `#fafafa` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Botão

- Caixa flexível, conteúdo centralizado, cantos de **8 px**, não encolhe, sem contorno nativo.
- Ícone de traço fino de **16 px** (14 px no extra-pequeno) na cor do texto do botão.
- Foco por teclado: borda na cor do anel + anel de 3 px (cor do anel, 50%). Desabilitado: 50%.
- Sombra extra-sutil quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.
- **Sem** escala de hover/pressão (é um botão comum).

| Variante | Fundo | Ícone | Borda | Hover |
|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | primária 90% (sombra sutil) |
| Destaque | destaque | texto sobre destaque | — | destaque 90% (sombra sutil) |
| Contorno | fundo da página (escuro `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: campo) | fundo destaque (escuro `rgba(255,255,255,0.075)`) |
| Fantasma | transparente | herdado | — | fundo destaque (escuro 50%) |

| Tamanho | Dimensões |
|---|---|
| Padrão | 36 × 36 px |
| Extra-pequeno | 28 × 28 px |
| Pequeno | 32 × 32 px |
| Grande | 40 × 40 px |

### Ícones

- **Sol** (círculo com raios curtos ao redor) para o tema claro.
- **Lua** (crescente) para o tema escuro.
- **Monitor** (tela retangular sobre um pé) para "sistema".
- Qual ícone mostrar:
  - se a lista de modos inclui "sistema", mostra o modo **selecionado** (sistema → monitor);
  - caso contrário, mostra o tema **resolvido** (claro → sol, escuro → lua).

## Comportamento

### Ciclo de modos

- Lista ordenada de modos configurável; padrão **claro → escuro → sistema**.
- Cada clique avança para o próximo modo da lista, voltando ao início no fim. Se o modo atual não estiver na lista, vai para o primeiro.
- O modo "sistema" resolve para claro ou escuro pela preferência de esquema de cores do sistema.

### Sequência de um clique

1. Chama o manipulador de clique de quem usa.
2. Atualiza **imediatamente** o estado exibido pelo botão (ícone novo) e avisa quem usa ("mudança imediata", com o modo escolhido).
3. Se o modo novo é "sistema" e ele resolve para o mesmo tema já visível, apenas grava a escolha, sem animação.
4. Se o navegador **não** suporta transições de visualização de documento, aplica o tema na hora e grava a escolha.
5. Caso contrário:
   - inicia uma transição de visualização do documento: o navegador congela a imagem atual da página;
   - dentro dela, aplica o novo tema na raiz (classe de tema escuro ligada/desligada) de forma síncrona;
   - quando a transição está pronta, anima o **recorte da imagem nova** de "totalmente escondida" para "totalmente visível", numa direção:

| Direção | Revelação |
|---|---|
| Esquerda → direita (padrão) | a borda direita do recorte avança da esquerda para a direita |
| Direita → esquerda | a borda esquerda avança da direita para a esquerda |
| Cima → baixo | a borda inferior desce do topo até a base |
| Baixo → cima | a borda superior sobe da base até o topo |

   - duração **700 ms**, curva **ease-in-out**;
   - as animações padrão de esmaecimento da transição são desligadas (imagem antiga e nova sem animação própria, mistura normal), então o efeito é uma cortina nítida, sem degradê;
   - ao terminar, grava a escolha no armazenamento de tema (persistência).

### Estado de tema

- O componente depende de um "armazenamento de tema" com: modo escolhido (claro/escuro/sistema), tema resolvido (claro/escuro) e uma função para gravar o modo. Na referência é uma biblioteca de temas que persiste no armazenamento local e aplica a classe na raiz.
- **Na reimplementação**: aceitar esse armazenamento por parâmetros (valor + resolvido + gravar) e oferecer um padrão simples próprio (estado local + armazenamento local + preferência do sistema). O **alvo** onde a classe de tema é aplicada deve ser configurável (raiz do documento por padrão, ou um elemento contêiner).

## Técnica de renderização em alto nível

- Botão nativo + API de transições de visualização do documento.
- A cortina é uma animação de recorte retangular ("inset") sobre o pseudo-elemento da imagem nova da raiz, via Web Animations, com a aplicação do tema feita de forma síncrona dentro do callback da transição (forçando o render imediato do framework).
- Uma regra de estilo global desliga as animações padrão das imagens antiga/nova da transição.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Lista ordenada de modos do ciclo | lista de "claro"/"escuro"/"sistema" | claro, escuro, sistema |
| Direção da revelação (esq→dir, dir→esq, cima→baixo, baixo→cima) | enumeração | esq→dir |
| Aviso imediato da troca (modo) | função | nenhum |
| Variante (padrão, destaque, contorno, fantasma) | enumeração | padrão |
| Tamanho (padrão, extra-pequeno, pequeno, grande) | enumeração | padrão |
| Armazenamento de tema (modo, resolvido, gravar) e alvo da classe | objeto / elemento | interno / raiz |
| Duração e curva da revelação (constantes que podem virar parâmetros) | ms / curva | 700 / ease-in-out |
| Manipulador de clique, classe e atributos | — | repassados |

## Demo

- **Importante para o Atlas**: a raiz da página não pode receber a classe de tema escuro. A demo deve aplicar o tema a um **contêiner próprio** que ocupa a área de prévia inteira (largura total, altura mínima de 360 px, cantos de 14 px), cujo fundo e textos mudam entre `#ffffff`/`#0a0a0a` (claro) e `#0a0a0a`/`#fafafa` (escuro). A transição de visualização continua sendo do documento, mas só esse contêiner muda, então a cortina é visível apenas nele.
- Estado inicial: o tema do palco (claro ou escuro).
- No centro, o botão; abaixo dele, opcionalmente, uma legenda curta com o modo atual ("light" / "dark" / "system") em 14 px, cor atenuada, para evidenciar a troca.
- Controles: variante (padrão, destaque, contorno, fantasma; padrão), tamanho (padrão, pequeno, grande; padrão), direção (as quatro; esq→dir) e liga/desliga "sistema" (desligado → ciclo só claro/escuro).

## Acessibilidade e responsividade

- Recomendação: nome acessível descrevendo a ação ("Mudar para tema escuro", etc.) ou o modo atual; ícones ocultos para tecnologias assistivas.
- Teclado: botão nativo.
- Movimento reduzido: recomendação — trocar o tema instantaneamente, sem cortina.
- A cortina cobre a área inteira da página, em qualquer tamanho.

## Observações de fidelidade

- **Recomendação — sincronização externa**: na referência, o ícone mostra um estado local que só é inicializado na montagem; se o tema mudar por outro meio, o ícone fica desatualizado. Sincronizar o estado exibido com o armazenamento de tema.
- **Recomendação — inicialização sem tema conhecido**: antes de o tema ser conhecido (renderização no servidor), o ícone pode aparecer errado; usar um padrão seguro.
- **Recomendação — cliques durante a cortina**: iniciar nova troca durante a animação dispara transições sobrepostas; ignorar cliques até a anterior terminar, ou interromper a anterior.
