# Especificação: Conteúdo animado na rolagem (animated-content)

## Propósito
Um invólucro que esconde o conteúdo e, quando ele entra na área visível durante a rolagem, faz o conteúdo deslizar de uma direção até a posição final, com fade e escala opcionais. Opcionalmente, depois de um tempo, o conteúdo "vai embora" com outra animação. É um utilitário genérico de revelação na rolagem.

## Aparência
- O invólucro é um bloco sem estilo próprio, que aceita uma classe extra. Ele começa com **visibilidade oculta**, para não piscar antes da configuração inicial.
- Toda a aparência vem do conteúdo filho.

## Comportamento
- **Configuração inicial** (na montagem), aplicada antes de exibir:
  - **eixo**: vertical (Y) por padrão ou horizontal (X);
  - **deslocamento inicial**: +distância no eixo (padrão **100 px**). No modo vertical, o conteúdo começa 100 px **abaixo** e sobe; no horizontal, começa 100 px **à direita** e vai para a esquerda. Com "inverter direção" o sinal troca: vem de cima ou da esquerda;
  - **escala inicial**: padrão **1** (configurável, ex.: 0,5 para "crescer");
  - **opacidade inicial**: o valor configurado (padrão **0**) quando a animação de opacidade está ligada (padrão ligada), ou 1 quando desligada;
  - em seguida, a visibilidade passa a visível.
- **Disparo**: quando o **topo** do elemento cruza a linha horizontal situada a (1 − limiar) × 100% da altura da área de rolagem, medida a partir do topo. Com o limiar padrão de **0,1**, a linha fica a 90% da altura (perto da base da viewport). Dispara **uma única vez**. Se o elemento já estiver além dessa linha na montagem, dispara imediatamente.
- **Animação de entrada**: após um atraso opcional (padrão **0 s**), anima até deslocamento 0, escala 1 e opacidade 1, em **0,8 s**, com easing **cúbico de desaceleração** (1 − (1 − t)³).
  - Outras curvas oferecidas na demo: **"bounce out"** (quicada padrão de Penner, com quatro quiques decrescentes que se assentam no fim) e **"elastic out"** com amplitude 1 e período 0,3 (oscilação senoidal amortecida exponencialmente que ultrapassa o alvo e se acomoda).
- **Fim da entrada**: chama o callback de conclusão, se houver.
- **Desaparecimento opcional**: se o tempo de desaparecimento for maior que 0 (padrão **0** = desligado), após esse tempo em segundos o conteúdo anima:
  - até o deslocamento **oposto** (−distância; com direção invertida, +distância), ou seja, continua o movimento e sai pelo lado contrário ao de entrada;
  - escala até **0,8**;
  - opacidade até a opacidade inicial (com a animação de opacidade ligada) ou até 0 (desligada);
  - duração padrão de **0,5 s**, com easing **cúbico de aceleração** (t³) por padrão. Opções na demo: "bounce in" e "elastic in" (1, 0,3), os espelhos das curvas de saída;
  - ao final, chama o callback de desaparecimento.
- **Contêiner de rolagem**: por padrão é a janela/viewport. Opcionalmente, pode ser outro elemento rolável, passado como elemento ou seletor.
- **Mudança de parâmetros**: qualquer alteração reconstrói o efeito: reaplica o estado inicial e volta a aguardar o disparo.
- **Desmontagem**: cancela o gatilho de rolagem e as animações pendentes.

## Técnica de renderização em alto nível
DOM com transformações CSS (translação, escala) e opacidade. A detecção pode usar `IntersectionObserver` com uma margem inferior equivalente ao limiar: a linha de disparo fica a (1 − limiar) da altura, e basta o topo do elemento cruzá-la. A animação pode usar Web Animations API ou uma biblioteca de tweens. As curvas cúbica, bounce e elástica são funções de easing clássicas, implementadas matematicamente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo | nós React | — |
| Contêiner de rolagem | elemento ou seletor | viewport |
| Distância percorrida | número (px) | 100 |
| Eixo | `vertical` / `horizontal` | vertical |
| Inverter direção | booleano | falso |
| Duração da entrada | número (s) | 0,8 |
| Easing da entrada | `cúbica-out` / `bounce-out` / `elástica-out` (amplitude, período) | cúbica-out |
| Opacidade inicial | número 0–1 | 0 |
| Animar opacidade | booleano | verdadeiro |
| Escala inicial | número | 1 |
| Limiar de disparo (fração da altura visível) | número 0–1 | 0,1 |
| Atraso antes da entrada | número (s) | 0 |
| Tempo até desaparecer (0 = nunca) | número (s) | 0 |
| Duração do desaparecimento | número (s) | 0,5 |
| Easing do desaparecimento | `cúbica-in` / `bounce-in` / `elástica-in` | cúbica-in |
| Callback ao concluir a entrada | função | nenhuma |
| Callback ao concluir o desaparecimento | função | nenhuma |
| Classe extra | string | vazia |
| Demais atributos do invólucro | — | — |

## Demo
- Área de prévia com posicionamento relativo, **altura mínima de 400 px**, overflow oculto e fundo do tema. No canto, um botão "recarregar" remonta o componente para repetir a animação.
- Filho centralizado: um cartão de **200 × 100 px**, raio de **25 px**, borda de 1 px sutil (cinza de baixo contraste do tema) e fundo de "cartão" do tema (um tom acima do fundo). Ele traz o texto **"Animate Me"** centralizado, em 1.25rem, peso extra-negrito e cor do texto principal.
- Controles (cada mudança remonta):
  - direção (vertical/horizontal);
  - easing de entrada (cúbica-out, bounce-out, elástica-out);
  - easing de saída (cúbica-in, bounce-in, elástica-in);
  - inverter direção;
  - animar opacidade;
  - distância de 50 a 300 (passo 10);
  - duração de 0,1 a 3 s;
  - atraso de 0 a 2 s;
  - opacidade inicial de 0 a 1;
  - escala inicial de 0,1 a 2;
  - limiar de 0,1 a 1;
  - tempo até desaparecer de 0 a 5 s;
  - duração do desaparecimento de 0,5 a 3 s.

## Acessibilidade e responsividade
- O conteúdo começa invisível. Se o script falhar ou o gatilho nunca disparar (ex.: o elemento não é alcançável na rolagem), ele fica oculto. **Recomendação**: garantir que o conteúdo apareça mesmo sem o disparo (por exemplo, exibir imediatamente se o observador não estiver disponível).
- Com `prefers-reduced-motion`, exibir o conteúdo no estado final, sem deslocamento nem escala (no máximo um fade curto), e não executar o desaparecimento automático.
- O desaparecimento automático esconde informação. Usar apenas em conteúdo decorativo e, depois de sumir, considerar marcar o conteúdo como oculto para tecnologias assistivas.
- Funciona em qualquer largura. No eixo horizontal, a translação inicial pode causar rolagem lateral; o pai deve cortar o overflow.

## Observações de fidelidade
- Com a animação de opacidade **desligada**, o desaparecimento ainda leva a opacidade a 0 (e não mantém 1). Isso é coerente com "sumir", então manter.
- A referência procura, por padrão, um contêiner de rolagem com identificador específico do site original. Não reproduzir: o padrão deve ser a viewport.
