# Especificação: Cartão com holofote (spotlight-card)

## Propósito
Um cartão escuro que, quando o ponteiro passa sobre ele, ganha um brilho radial suave centrado na posição do cursor e que acompanha o movimento, como uma lanterna iluminando a superfície.

## Aparência
- **Cartão**:
  - posicionamento relativo e overflow oculto;
  - raio de borda de **1.5rem** (24 px);
  - borda sólida de **1 px `#222`**;
  - fundo **`#111`**;
  - padding de **2rem** em todos os lados;
  - sem sombra.
  - Largura e altura são definidas pelo conteúdo ou por classe externa. O componente aceita uma classe adicional.
- **Camada de brilho**: pseudo-camada (ou elemento) absoluta que cobre o cartão inteiro, fica sobre o fundo e não intercepta o ponteiro. O conteúdo é um **gradiente radial circular** centrado na posição do cursor (coordenadas locais em px), que começa na cor do holofote e vai até transparente em **80%** do raio do gradiente. O raio segue a extensão padrão do gradiente circular do CSS, ou seja, vai até o canto mais distante.
- **Cor padrão do holofote**: **`rgba(255, 255, 255, 0.25)`**, equivalente a `#ffffff40`.
- **Opacidade da camada**: 0 em repouso; **0,6** com hover ou quando algum descendente tem foco.
- **Posição inicial do centro** (antes de qualquer movimento): 50% / 50%, o centro do cartão. Antes do primeiro movimento, a cor de fallback é `rgba(255,255,255,0.05)`. A cor configurada só passa a valer depois do primeiro movimento do ponteiro.

## Comportamento
- **Movimento do ponteiro sobre o cartão**: a cada evento de movimento, calcula a posição do ponteiro relativa ao canto superior esquerdo do cartão (em px) e atualiza o centro do gradiente e a cor. A atualização é direta, sem suavização: o brilho segue o cursor instantaneamente.
- **Entrada e saída do hover**: a opacidade da camada de brilho transita entre 0 e 0,6 em **0,5 s** com easing padrão `ease`. Ao sair, o brilho se apaga no último ponto conhecido.
- **Foco por teclado**: se algum elemento focável dentro do cartão recebe foco, o brilho aparece (opacidade 0,6) na última posição conhecida, ou no centro se nunca houve movimento.
- **Sem clique, arraste ou estado persistente.**

## Técnica de renderização em alto nível
Puro CSS mais um manipulador de movimento do ponteiro. A posição do cursor e a cor são gravadas como propriedades CSS personalizadas diretamente no elemento do cartão, sem passar pelo estado do React e sem re-render. Uma pseudo-camada lê essas propriedades para montar o gradiente radial, e a transição de opacidade é feita por CSS.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo do cartão | nós React | nenhum |
| Classe(s) CSS adicional(is) do cartão | string | vazia |
| Cor do holofote (centro do gradiente) | string de cor CSS | `rgba(255, 255, 255, 0.25)` |

## Demo
- Área de prévia com fundo escuro do site e padding vertical de cerca de 40 px. O cartão aparece centralizado. A demo aplica uma classe externa para dimensioná-lo (sugestão: cerca de 300–400 px de largura e altura automática).
- Conteúdo do cartão, numa coluna alinhada à esquerda e centralizada verticalmente:
  1. um ícone de "brilho/estrela de quatro pontas" preenchido, com 48 px (12 unidades de 4 px) e margem inferior de 12 px;
  2. o título **"Boost Your Experience"**, com peso 600, 1.4rem e letter-spacing de −0,5 px;
  3. o parágrafo **"Get exclusive benefits, features & 24/7 support as a permanent club member."**, com 14 px, cor atenuada (cinza médio), margem superior de 4 px e margem inferior de 32 px.
- No tema claro, quando a cor está no padrão, a demo usa **`#18181b14`** (preto quase transparente) como cor do holofote.
- Há um único controle de cor para o holofote.

## Acessibilidade e responsividade
- O brilho é decorativo e não carrega informação.
- O realce por foco interno (`focus-within`) dá retorno visual a quem navega por teclado.
- Recomendação: respeitar `prefers-reduced-motion` encurtando ou eliminando a transição de opacidade. Em telas de toque não há hover, então o efeito simplesmente não aparece (ou aparece só durante o toque), o que é aceitável.
- Contraste do texto: o texto padrão deve ser claro (por exemplo branco ou `#eee`) sobre o fundo `#111`.
- Responsivo: o cartão se adapta ao contêiner, e o gradiente usa coordenadas absolutas em px relativas ao próprio cartão.
