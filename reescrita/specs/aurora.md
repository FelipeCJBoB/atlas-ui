# Especificação: Aurora (aurora)

## Propósito
Fundo animado que imita uma aurora boreal: uma cortina de luz colorida pendurada no topo do contêiner, com a borda inferior ondulando lentamente e se dissolvendo em transparência. As cores variam da esquerda para a direita num degradê de três paradas. Decorativo, para heros.

## Aparência
- **Contêiner**: bloco 100% × 100% do pai, sem fundo próprio. A superfície WebGL é transparente (alfa pré-multiplicado), então o que estiver atrás aparece onde não há aurora.
- **Distribuição vertical**: a luz é mais intensa no **topo** e decai para baixo; a borda inferior da cortina é uma linha ondulada (definida por ruído) e, abaixo dela, tudo fica transparente. Em geral a aurora ocupa aproximadamente a metade superior a dois terços do contêiner, variando com o tempo.
- **Cor**: degradê horizontal linear de três paradas — à esquerda (0%), no meio (50%) e à direita (100%). Padrão do componente: **`#5227FF`** (violeta-azulado) → **`#7cff67`** (verde-limão) → **`#5227FF`**. A cor final é a do degradê multiplicada pela intensidade local (mais escura perto da borda, mais luminosa no topo).
- **Transição da borda**: a opacidade passa de 0 a 1 por um degrau suave (smoothstep) centrado num limiar de intensidade 0,20 com largura total = mistura (padrão **0,5**). Mistura 0 dá borda dura; 1 dá borda muito difusa.
- **Modo claro** (desligado por padrão): em vez de luz sobre transparente, desenha sobre **branco opaco**, misturando o branco com o croma normalizado da cor do degradê (realçado por potência 1,2) numa cobertura de até ~0,94; a cobertura combina a opacidade da borda com a intensidade (55% + 45% × intensidade, máx. 0,86 antes do ganho).

## Comportamento
- **Tempo**: segundos desde o carregamento da página × velocidade (padrão **1**). (Também aceita um tempo externo, que substitui o relógio.)
- **Forma da borda** (ideia matemática): para cada coluna x (normalizada 0–1), calcula-se um **ruído simplex 2D** em (2·x + 0,1·T, 0,25·T), multiplicado por 0,5 × amplitude (padrão **1**). A altura da borda é o exponencial desse ruído (sempre positiva, assimétrica: picos sobem mais do que vales descem). A intensidade num pixel é 0,6 × (2·y − altura + 0,2), com y normalizado de baixo (0) para cima (1). Resultado: ondas largas (cerca de 2 por largura) que deslizam lateralmente devagar e "respiram" verticalmente.
- **Atualização ao vivo**: tempo, amplitude, mistura, modo claro e cores são lidos a cada quadro. A referência também recria o contexto quando amplitude, mistura ou modo claro mudam (desnecessário; ver Observações).
- **Redimensionamento**: ao redimensionar a janela, ajusta o tamanho da superfície e a resolução ao tamanho do contêiner.
- Laço de animação contínuo enquanto montado; sem interação.

## Técnica de renderização em alto nível
WebGL2 com um triângulo de tela cheia e um shader de fragmento: degradê de três paradas pela coordenada horizontal, borda definida por **ruído simplex 2D** animado e transformado por exponencial, limiar suave para alfa, saída pré-multiplicada. Pode ser feito com uma biblioteca WebGL leve ou WebGL puro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Três cores do degradê (esquerda, meio, direita) | lista de 3 cores hex | `#5227FF`, `#7cff67`, `#5227FF` |
| Amplitude das ondulações da borda | número | 1 |
| Suavidade da borda (largura da transição) | número 0–1 | 0,5 |
| Velocidade | número | 1 |
| Tempo externo (substitui o relógio) | número | relógio interno |
| Modo claro (sobre branco) | booleano | falso |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site; o componente ocupa a área.
- Cores da demo: **`#7cff67`** (verde-limão) → **`#B497CF`** (lilás) → **`#5227FF`** (violeta); velocidade **1**; mistura **0,5**; amplitude padrão.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Bring the Arctic to you, with one line of code"**, centralizados, sem bloquear o ponteiro. Aproximação: selo pequeno translúcido (fundo branco ~10%, borda sutil); título ~2,5rem, peso 600, branco, largura máxima ~20ch.
- Controles (cada mudança remonta o componente): três seletores de cor; velocidade 0–2 (0,1); mistura 0–1 (0,01).

## Acessibilidade e responsividade
- Decorativo: `aria-hidden` e sem foco.
- **Recomendação**: com `prefers-reduced-motion`, congelar o tempo (um único quadro).
- **Recomendação**: pausar o laço quando o contêiner sair da tela ou a aba estiver oculta.
- Escala com o contêiner (coordenadas normalizadas, a forma estica com a largura).

## Observações de fidelidade
- **Recomendação**: observar o tamanho do contêiner (não só da janela); a referência só reage ao redimensionamento da janela.
- **Recomendação**: não recriar o contexto WebGL ao mudar amplitude, mistura ou modo claro — basta atualizar os valores.
- **Recomendação**: a superfície não considera a densidade de pixels; como o efeito é suave, renderizar a 1× é aceitável, mas pode-se usar min(DPR, 2).
- **Recomendação**: converter as cores só quando mudarem, não a cada quadro.
- A documentação original lista padrões de cor diferentes dos do componente; usar os do componente (`#5227FF`, `#7cff67`, `#5227FF`).
- Valores de intensidade acima de 1 no topo podem saturar a cor; manter (faz parte do brilho).
