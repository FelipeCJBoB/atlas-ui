# Especificação: Controle deslizante elástico (elastic-slider)

## Propósito
Um controle deslizante horizontal (como um controle de volume) com ícones nas pontas. Ele cresce quando o ponteiro passa por cima e, se o usuário arrasta além das bordas, a trilha **estica como borracha** na direção do arraste, com resistência crescente, e volta com um quique ao soltar.

## Aparência
- **Contêiner**: coluna flex centralizada nos dois eixos, com espaçamento de 1rem e **largura de 12rem** (192 px). Aceita uma classe extra.
- **Linha principal** (ícone esquerdo, trilha, ícone direito):
  - flex em linha centralizada, com largura total e espaçamento de **1rem**;
  - gestos de toque nativos desativados e seleção de texto desativada;
  - em repouso, **opacidade 0,7** e escala 1.
- **Área de captura da trilha**:
  - ocupa o espaço restante da linha, com **largura máxima de 200 px**;
  - padding vertical de **1rem** (aumenta a área clicável sem aumentar a trilha visível);
  - cursor "mão aberta" (`grab`), que vira "mão fechada" (`grabbing`) enquanto o botão está pressionado.
- **Trilha**:
  - barra horizontal em formato de pílula (raio total), com overflow oculto;
  - fundo **`rgba(128,128,128,0.4)`** (cinza translúcido);
  - **altura de 6 px** em repouso e **12 px** quando ampliada. Ao ampliar, ganha margens verticais negativas de −3 px em cima e embaixo para não deslocar o layout.
- **Preenchimento**: barra em pílula, cor **`#888`**, ancorada à esquerda, com largura igual à porcentagem do valor dentro do intervalo. Sem botão (*thumb*) visível.
- **Ícones**:
  - padrão: alto-falante com volume baixo (esquerda) e alto-falante com volume alto (direita), preenchidos;
  - estilo sugerido: 24 × 24 px na cor `#888` (variante para fundo escuro: `#ddd`).
  - Os ícones são substituíveis por qualquer conteúdo.
- **Indicador de valor**: texto abaixo da linha com o valor **arredondado para inteiro**, em **0.75rem**, peso 500, espaçamento entre letras de 0,05em e cor **`#808080`**. Fica posicionado de forma absoluta (fora do fluxo) e deslocado 1rem para cima, perto da trilha.

## Comportamento

### Hover / toque (ampliação geral)
- Ao entrar com o ponteiro (ou ao iniciar um toque) na linha principal, a linha inteira (ícones e trilha) anima a escala de **1 para 1,2** com uma transição curta e suave (cerca de 0,3 s).
- A opacidade acompanha a escala, interpolada linearmente: 0,7 na escala 1 e 1 na escala 1,2.
- A altura da trilha também é derivada da escala: 6 px na escala 1 e 12 px na escala 1,2, com as margens negativas proporcionais.
- Ao sair (ou ao terminar o toque), tudo volta para escala 1.

### Arraste e valor
- **Pressionar** sobre a área de captura: o valor salta imediatamente para a posição do ponteiro, e o ponteiro é **capturado**, de modo que o arraste continua mesmo fora do elemento.
- **Mover com botão pressionado**:
  - o valor é o início do intervalo mais a fração horizontal do ponteiro dentro da área de captura, multiplicada pela amplitude do intervalo (interpolação linear);
  - com passos ativados, o valor é arredondado para o múltiplo mais próximo do tamanho do passo, contado a partir de zero e não do início do intervalo;
  - o valor fica sempre limitado ao intervalo.
- Mover sem botão pressionado não altera nada.
- Valor exibido e largura do preenchimento são atualizados de forma síncrona, sem animação. Se o intervalo tiver amplitude zero, o preenchimento fica em 0%.
- O valor inicial pode estar fora do intervalo. Nesse caso, o preenchimento é cortado pela trilha (acima de 100%) ou fica vazio (abaixo de 0%) até a primeira interação, que aplica o limite.
- Mudar o valor inicial depois da montagem redefine o valor atual.

### Elasticidade (overflow)
- Durante o arraste, compara a posição horizontal do ponteiro com as bordas da área de captura:
  - **à esquerda da borda esquerda**: região "esquerda", e o excesso é a distância até essa borda;
  - **à direita da borda direita**: região "direita", e o excesso é a distância até essa borda;
  - **dentro**: região "meio", sem excesso.
- O excesso bruto passa por uma **saturação suave baseada na sigmoide logística**: a sigmoide é aplicada ao excesso normalizado pelo limite e remapeada para que 0 dê 0 e infinito dê 1, depois multiplicada pelo limite. O limite é **50 px**. Resultado: perto da borda o estiramento é quase proporcional ao excesso, mas nunca passa de 50 px.
- Efeitos do excesso aplicado (e):
  - **Trilha**: escala horizontal de 1 + e / largura da área de captura (estica) e escala vertical interpolada de 1 (e = 0) até **0,8** (e = 50), afinando ao esticar.
  - **Origem da transformação da trilha**: se o ponteiro está na metade esquerda (ou além da borda esquerda), a origem é a **borda direita**, então a trilha estica para a esquerda. Caso contrário, a origem é a borda esquerda e a trilha estica para a direita.
  - **Ícone do lado esticado**: translada para fora pelo excesso dividido pela escala atual da linha (para que o deslocamento visual corresponda ao estiramento). O ícone do lado oposto não se move.
  - **Pulso do ícone**: ao entrar na região esquerda ou direita, o ícone daquele lado faz uma pulsação de escala 1 → 1,4 → 1 em **0,25 s**. Ao voltar para o meio, o ícone fica em escala 1.
- **Soltar** (ou cancelar, ou perder a captura do ponteiro): o excesso volta a 0 com uma **mola com bounce de 0,5** (quique perceptível, cerca de meio segundo). A trilha e o ícone voltam ao lugar com uma pequena oscilação.
- Durante esse retorno, a região permanece a última conhecida, então o ícone acompanha o retorno elástico.

## Técnica de renderização em alto nível
Elementos DOM com transformações (escala, translação) dirigidas por **valores animados fora do ciclo de render**: escala geral, excesso e posição horizontal do ponteiro. Algumas propriedades são **derivadas** de outras por mapeamento linear (opacidade e altura a partir da escala; escala vertical a partir do excesso). As animações usam transição curta para a escala, **física de mola** com bounce para o retorno do excesso e keyframes para o pulso dos ícones. Requer uma biblioteca de animação com valores reativos e molas, ou uma implementação própria equivalente. Entrada por **Pointer Events** com captura de ponteiro. O valor numérico fica no estado normal da UI.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Valor inicial | número | 50 |
| Início do intervalo | número | 0 |
| Fim do intervalo | número | 100 |
| Classe extra do contêiner | string | vazia |
| Ativar valores em passos discretos | booleano | falso |
| Tamanho do passo | número | 1 |
| Conteúdo da ponta esquerda | nó | ícone de volume baixo |
| Conteúdo da ponta direita | nó | ícone de volume alto |

Recomendação opcional: expor um callback de mudança de valor (a referência não tem e o valor fica interno).

## Demo
- Título de seção **"Default"** acima de uma área de prévia com posicionamento relativo, **altura mínima de 500 px** e fundo escuro do site, com o slider centralizado.
- Valores da demo: inicial 50, intervalo de 0 a 100, passos desligados e tamanho do passo 10.
- Controles: valor inicial de 0 a 1000 (passo 10); início de 0 a 500 (passo 10); fim de 10 a 1000 (passo 10); liga/desliga de passos; tamanho do passo de 1 a 50.

## Acessibilidade e responsividade
- A referência **não** expõe semântica de slider nem suporte a teclado. **Recomendações** para a reimplementação:
  - papel de *slider* com valor mínimo, máximo e atual e um nome acessível;
  - foco por Tab com indicador visível;
  - setas Esquerda/Baixo e Direita/Cima mudam um passo (ou 1% sem passos);
  - Home e End levam ao início e ao fim;
  - Page Up e Page Down mudam 10%.
  - O efeito elástico pode ficar restrito ao ponteiro.
- Ícones decorativos devem ficar ocultos para leitores de tela, salvo se o usuário fornecer rótulos.
- Recomendação: com `prefers-reduced-motion`, desativar a ampliação e o quique (retorno instantâneo).
- Toque: os gestos nativos ficam desativados na linha para o arraste funcionar, e o início e o fim do toque acionam a ampliação.
- A largura é fixa (12rem) por padrão. Pode ser sobrescrita pela classe extra.
