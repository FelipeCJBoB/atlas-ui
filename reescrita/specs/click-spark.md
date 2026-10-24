# Especificação: Faíscas de clique (click-spark)

## Propósito
Envolve uma área da interface e, a cada clique dentro dela, faz surgir no ponto clicado uma pequena explosão radial de traços curtos que se afastam do centro e somem. É um retorno visual decorativo, sem nenhuma outra função.

## Aparência
- **Contêiner**: bloco com posicionamento relativo que ocupa 100% da largura e 100% da altura do pai. Não tem fundo, borda nem padding próprios. O conteúdo filho é renderizado normalmente dentro dele.
- **Camada de desenho**: superfície de desenho 2D transparente, posicionada de forma absoluta no canto superior esquerdo do contêiner e cobrindo 100% × 100% dele. Fica visualmente atrás do conteúdo filho (vem antes dele na ordem do DOM), em bloco, e não intercepta eventos de ponteiro nem permite seleção.
- **Cada faísca**: um segmento de reta reto com **2 px de espessura**, pontas padrão (sem arredondamento), na cor configurada (padrão **branco `#fff`**). Não tem brilho, sombra nem gradiente.
- **Explosão**: N segmentos (padrão **8**) distribuídos em ângulos iguais ao redor do ponto clicado, começando no ângulo 0 (apontando para a direita) e girando no sentido horário em coordenadas de tela (o eixo Y cresce para baixo). Com 8 faíscas, o espaçamento é de 45°.

## Comportamento
- **Gatilho**: clique (evento de clique primário) em qualquer ponto do contêiner. A posição é convertida para coordenadas locais da camada de desenho, ou seja, relativas ao canto superior esquerdo do contêiner.
- **Por clique**: cria um grupo de faíscas que compartilham o mesmo ponto de origem e o mesmo instante de início (relógio de alta resolução).
- **Ciclo de vida de uma faísca**, com duração total configurável (padrão **400 ms**):
  - O progresso linear p vai de 0 a 1 ao longo da duração e passa por uma curva de easing, gerando e.
  - **Distância do início do traço até o centro** = e × alcance × fator de escala extra. Alcance padrão: **15 px**. Fator padrão: **1,0**.
  - **Comprimento do traço** = tamanho inicial × (1 − e). Tamanho inicial padrão: **10 px**.
  - O traço sai na direção radial a partir desse ponto inicial. O efeito visual é o de um traço que nasce colado ao clique, com o comprimento máximo, e se afasta encolhendo até sumir quando chega ao alcance.
  - Quando o tempo decorrido atinge a duração, a faísca é removida.
- **Curvas de easing disponíveis** (escolha por nome):
  - linear (identidade);
  - aceleração quadrática (ease-in, t²);
  - desaceleração quadrática (ease-out), que é o **padrão**;
  - aceleração e desaceleração quadrática por partes (ease-in-out), com o ponto de inflexão em t = 0,5.
  - Qualquer valor não reconhecido cai no ease-out.
- **Cliques múltiplos**: explosões se sobrepõem livremente e cada uma tem o próprio relógio. Não há limite de faíscas simultâneas.
- **Redimensionamento**: a resolução interna da superfície acompanha o tamanho do contêiner (largura × altura em pixels CSS). As mudanças de tamanho são observadas e aplicadas com debounce de cerca de **100 ms**. Também há um ajuste imediato na montagem.
- **Troca de configuração**: alterar cor, tamanho, alcance, quantidade, duração, easing ou escala passa a valer para o desenho seguinte. Faíscas já em voo usam os novos valores a partir do quadro seguinte.

## Técnica de renderização em alto nível
Canvas 2D sobreposto ao contêiner inteiro. Um laço de animação sincronizado com a taxa de quadros do navegador limpa a superfície a cada quadro e redesenha todas as faíscas vivas. As expiradas são descartadas da lista. A referência mantém o laço ativo o tempo todo. Na reimplementação, é aceitável e recomendável pausar o laço quando não houver faíscas e retomá-lo no próximo clique. As faíscas ficam numa lista mutável fora do estado de renderização da UI (sem provocar re-render do componente). A geometria de cada traço usa trigonometria polar básica (seno e cosseno do ângulo).

Observação opcional: a referência não ajusta a superfície ao *device pixel ratio*, então os traços podem ficar levemente borrados em telas de alta densidade. Escalar pelo DPR é uma melhoria permitida, desde que a espessura aparente continue em 2 px CSS.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor dos traços | string de cor CSS | branco (`#fff`) |
| Comprimento inicial de cada traço | número (px) | 10 |
| Distância máxima percorrida a partir do clique | número (px) | 15 |
| Quantidade de traços por clique | inteiro | 8 |
| Duração da animação | número (ms) | 400 |
| Curva de easing | `linear` / `ease-in` / `ease-out` / `ease-in-out` | `ease-out` |
| Multiplicador extra da distância | número | 1,0 |
| Conteúdo envolvido | nós React | nenhum |

## Demo
- Área de prévia com **400 px de altura**, largura total do painel, sem padding e com overflow oculto. O fundo é o do tema do site: escuro no modo escuro, claro no modo claro.
- O componente ocupa a área inteira, sem filhos.
- Sobre ele há um texto centralizado, **"Click Around!"**, com 2rem, peso 600 e seleção desativada, posicionado de forma absoluta no centro da área.
- No tema claro, quando a cor ainda está no padrão branco, a demo troca a cor das faíscas para **`#18181b`** (quase preto) para manter o contraste.
- Controles da demo (faixas): cor; tamanho de 5 a 60 (passo 1); alcance de 10 a 200 (passo 5); quantidade de 1 a 20; duração de 200 a 2000 ms (passo 100); escala extra de 0,5 a 2 (passo 0,1). Cada mudança remonta o componente.

## Acessibilidade e responsividade
- Efeito puramente decorativo: a superfície de desenho não deve ser anunciada por leitores de tela (usar `aria-hidden` é recomendável) e não deve receber foco.
- Não altera nem bloqueia a interação com os filhos, porque a camada não captura ponteiro.
- Recomendação (não presente na referência): respeitar `prefers-reduced-motion` desativando o efeito ou reduzindo a duração.
- Responsivo por natureza: acompanha qualquer tamanho do contêiner.
