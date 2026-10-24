# Especificação: Texto decifrado (decrypted-text)

## Propósito
Exibe um texto que se "decifra" como num filme de hacker: os caracteres aparecem embaralhados com símbolos aleatórios que trocam rapidamente e vão se resolvendo no texto real, de uma vez ou um a um numa direção escolhida. O efeito pode disparar com hover, ao entrar na tela ou com clique.

## Aparência
- Elemento inline em bloco (`inline-block`) com espaços preservados e quebra de linha normal (`pre-wrap`). Herda fonte, cor e tamanho do contexto. O componente não impõe tipografia.
- Cada caractere é renderizado num `span` próprio para poder ser estilizado individualmente:
  - caracteres **já revelados** (ou todos, quando a animação terminou no estado decifrado) recebem a classe de estilo "revelado";
  - caracteres **ainda embaralhados** recebem a classe de estilo "cifrado".
  - Ambas as classes são opcionais e vazias por padrão, ou seja, sem diferença visual. Uso típico: revelados em branco e cifrados em cinza ou numa cor de destaque.
- O contêiner externo aceita uma classe própria e repassa quaisquer outros atributos HTML recebidos.
- **Espaços nunca são embaralhados**: continuam espaços o tempo todo, o que preserva o formato das palavras.

## Comportamento

### Conjunto de caracteres de embaralhamento
- **Padrão**: as 26 letras maiúsculas latinas, as 26 minúsculas e os símbolos `! @ # $ % ^ & * ( ) _ +`.
- **Opção "só caracteres originais"**: o embaralhamento sorteia apenas entre os caracteres distintos presentes no próprio texto, exceto o espaço.
- Cada caractere não revelado e que não é espaço é sorteado de novo, de forma uniforme, **a cada tique**.

### Relógio
A animação avança em tiques de intervalo fixo, configurável (padrão **50 ms**). Não há easing: o ritmo é constante.

### Modo simultâneo (padrão, não sequencial)
- **Decifrar**: a cada tique, todo o texto (exceto espaços) é re-embaralhado. Depois de **N tiques** (padrão **10**), o texto final aparece por inteiro de uma vez e a animação termina no estado "decifrado". Nesse modo, nenhum caractere é revelado individualmente durante a animação.
- **Recifrar** (só no modo clique com alternância): parte do texto totalmente revelado e, a cada tique, oculta um lote de posições sorteadas aleatoriamente. O tamanho do lote é o comprimento do texto dividido por N, arredondado para cima, com mínimo de 1. As posições ocultas passam a mostrar caracteres aleatórios. Termina quando não resta nada revelado ou quando N tiques se passaram, e nesse ponto o texto fica 100% embaralhado no estado "cifrado".

### Modo sequencial
- **Decifrar**: começa com tudo embaralhado. A cada tique, revela **uma** posição a mais, na ordem da direção escolhida, e re-embaralha as demais. Termina quando todas as posições estão reveladas. O número de tiques é igual ao comprimento do texto (espaços contam como posições). O limite de N iterações não se aplica.
- **Direções**:
  - **início**: da esquerda para a direita (0, 1, 2, …);
  - **fim**: da direita para a esquerda (último, penúltimo, …);
  - **centro**: começa no índice do meio (piso de comprimento/2) e alterna para os lados: meio, meio−1, meio+1, meio−2, meio+2, … Se o próximo índice calculado já estiver revelado ou fora do texto, usa a primeira posição ainda não revelada da esquerda para a direita.
- **Recifrar** (clique com alternância): calcula a mesma ordem da direção e a percorre **ao contrário**, ocultando uma posição por tique a partir de tudo revelado. Termina quando nada resta revelado, no estado "cifrado".

### Gatilhos (modo de disparo)
1. **Hover** (padrão):
   - Em repouso, mostra o texto puro, decifrado.
   - Ao entrar com o ponteiro, se não houver animação em curso, começa a decifrar do zero: tudo cifrado, nada revelado.
   - Ao sair com o ponteiro, interrompe imediatamente e volta ao texto puro.
   - Reentrar reinicia a animação.
2. **Ao entrar na tela**:
   - Na montagem, mostra o texto puro.
   - Quando pelo menos **10%** do elemento fica visível na viewport, dispara uma decifragem **uma única vez** por montagem.
   - Atenção: logo antes do primeiro tique o texto ainda aparece puro. No modo sequencial, o primeiro tique já embaralha tudo menos a primeira posição.
3. **Ao entrar na tela + hover**: combina os dois anteriores. Dispara uma vez ao entrar na tela e também a cada hover.
4. **Clique**:
   - Na montagem (e sempre que o texto ou o modo mudam), o texto já aparece **totalmente embaralhado**, no estado "cifrado".
   - Submodo **uma vez** (padrão): o clique decifra, e cliques depois de decifrado não fazem nada.
   - Submodo **alternar**: o clique decifra quando está cifrado e recifra quando está decifrado.
   - Cliques durante uma animação em curso reiniciam a sequência conforme o estado lógico atual (a referência não bloqueia). Na reimplementação, é aceitável ignorar cliques durante a animação.
- Mudanças no texto ou no modo de disparo reiniciam o estado de acordo com o modo: puro, ou embaralhado no modo clique.

### Estilo por caractere durante a animação
Um caractere recebe o estilo "revelado" se sua posição já foi revelada, ou se não há animação em curso e o estado é "decifrado". Caso contrário, recebe o estilo "cifrado". Consequência: no modo simultâneo, todos os caracteres ficam com o estilo cifrado durante a animação e passam juntos para revelado no fim.

## Técnica de renderização em alto nível
DOM puro: um `span` por caractere, re-renderizado a cada tique por um temporizador de intervalo fixo, e não por quadro de animação. O estado lógico inclui:
- texto exibido;
- conjunto de posições reveladas;
- se está animando;
- se está decifrado;
- direção (decifrar ou recifrar);
- se o gatilho "na tela" já disparou;
- no sequencial, uma fila de ordem com um ponteiro.

A detecção de entrada na viewport usa um observador de interseção. O temporizador precisa ser limpo ao desmontar e a cada reinício. A referência envolve o contêiner num elemento de uma biblioteca de animação, mas não usa nenhuma animação dela: **não há dependência real de biblioteca de animação**. Um `span` comum basta.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Texto final a exibir | string | vazio |
| Intervalo entre tiques | número (ms) | 50 |
| Número de tiques no modo simultâneo (e base do lote ao recifrar) | inteiro | 10 |
| Revelar um caractere por vez (sequencial) | booleano | falso |
| Direção da revelação sequencial | `início` / `fim` / `centro` | início |
| Embaralhar só com os caracteres do próprio texto | booleano | falso |
| Conjunto de caracteres de embaralhamento | string | letras A–Z, a–z e `!@#$%^&*()_+` |
| Classe dos caracteres revelados | string | vazia |
| Classe do contêiner externo | string | vazia |
| Classe dos caracteres cifrados | string | vazia |
| Modo de disparo | `hover` / `na tela` / `na tela + hover` / `clique` | hover |
| Comportamento do clique | `uma vez` / `alternar` | uma vez |
| Demais atributos HTML | repassados ao contêiner | — |

## Demo
- Área de prévia com **400 px de altura**, overflow oculto e padding vertical de 16 a 24 px. Um botão "recarregar" no canto remonta o componente para repetir a animação.
- Uma linha flexível com **80% de largura** e padding horizontal de 0,5em contém o texto **"Hacking into the mainframe..."**.
- Configuração inicial da demo (diferente dos padrões do componente): intervalo de **60 ms**, 10 iterações, **sequencial ligado**, direção início, disparo **ao entrar na tela** e clique "uma vez".
- A demo aplica uma classe de contêiner. Sugestão de estilo equivalente: texto grande (cerca de 2–2.5rem), peso semibold, fonte do site, cor clara sobre fundo escuro.
- Controles: modo de disparo; modo de clique (habilitado só no disparo por clique); direção; intervalo de 10 a 200 ms (passo 10); iterações de 1 a 50; liga/desliga de sequencial; liga/desliga de "só caracteres originais". Cada mudança remonta o componente.

## Acessibilidade e responsividade
- A parte visível com os `span`s por caractere fica oculta para tecnologias assistivas (`aria-hidden`), e uma cópia em texto fica visualmente escondida (técnica *sr-only*) para leitores de tela.
- A referência coloca nessa cópia o **texto exibido no momento** (que pode estar embaralhado) e ainda aplica `visibility: hidden`, o que a esconde também dos leitores de tela. **Recomendação** para a reimplementação: expor sempre o **texto final** à tecnologia assistiva, de forma acessível (sr-only sem `visibility: hidden`).
- No modo clique, o elemento não é focável na referência. Recomenda-se torná-lo acionável por teclado (papel de botão, `tabindex`, Enter/Espaço) quando esse modo estiver ativo.
- Recomendação: com `prefers-reduced-motion`, mostrar o texto final direto, sem embaralhar.
- Responsivo: o texto quebra normalmente. Como a largura de cada caractere varia em fontes proporcionais, o texto pode "tremer" durante a animação. Usar fonte monoespaçada no estilo de exemplo evita isso, mas é opcional.
