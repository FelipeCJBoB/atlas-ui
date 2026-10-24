# Especificação: Dica flutuante compartilhada (tooltip)

## Propósito
Dicas flutuantes (*tooltips*) em que **um único balão** atende a todos os gatilhos de um mesmo grupo. Ao mover o cursor de um botão para outro, o balão não some: ele **voa** até o novo gatilho e se redimensiona para o novo texto com uma mola suave. A entrada e a saída são um "pop" em escala, vindo da direção do gatilho.

## Aparência
- **Balão**:
  - fundo na cor "primária" do tema: `#0a0a0a` (claro) / `#fafafa` (escuro); texto na cor oposta (`#fafafa` / `#0a0a0a`);
  - raio de **8 px** e largura ajustada ao conteúdo;
  - conteúdo com padding de **6 px × 12 px**, fonte de **12 px** e quebra equilibrada (pode ter várias linhas);
  - recorte interno (overflow oculto), para o texto não vazar durante a mudança de tamanho;
  - camada alta (z-index 50), renderizado em portal no `body`.
- **Seta**:
  - triângulo de ~12 px de largura por ~6 px de altura, ponta arredondada com raio de ~2 px, na cor do balão;
  - fica na borda voltada para o gatilho, encostada (1 px para dentro), e aponta para o centro do gatilho;
  - gira conforme o lado: 0° em cima, 90° à direita, 180° embaixo, −90° à esquerda.

## Comportamento
- **Gatilhos**: cada gatilho envolve um elemento (na demo, um botão). Abrem o balão a entrada do ponteiro e o foco; fecham a saída do ponteiro e a perda de foco.
- **Atrasos** (no grupo; padrão do componente: **abrir 0 ms**, **fechar 300 ms**):
  - se o balão já está aberto, mudar de gatilho troca o alvo e o conteúdo **na hora**;
  - se o último fechamento ocorreu há menos que o atraso de fechamento, a nova abertura é imediata ("modo aquecido");
  - caso contrário, espera o atraso de abertura;
  - a saída do ponteiro agenda o fechamento após o atraso de fechamento, e entrar noutro gatilho antes disso cancela o fechamento.
- **Posição**:
  - padrão **acima**, centralizado, a **10 px** do gatilho;
  - lados: cima, baixo, esquerda e direita; alinhamentos: início, centro e fim; mais deslocamentos no eixo principal e no transversal;
  - **inverte** para o lado oposto quando falta espaço;
  - **desliza** no eixo transversal para manter pelo menos **8 px** de margem da janela;
  - a seta continua apontando para o centro do gatilho;
  - a posição é recalculada continuamente enquanto o balão está visível (mudanças de layout).
- **Entrada**: de opacidade 0, escala 0 e deslocamento de **15 px em direção ao gatilho** (lado de cima: 15 px para baixo; baixo: 15 px para cima; esquerda: 15 px para a direita; direita: 15 px para a esquerda) até opacidade 1, escala 1 e deslocamento 0.
- **Saída**: o inverso. O balão só sai do DOM depois de terminar.
- **Troca entre gatilhos**: o balão e a seta animam posição e tamanho de forma contínua (animação de layout), e o texto interno é reajustado preservando a proporção, sem esticar.
- **Mola** de todas as animações do balão: rigidez **300**, amortecimento **35**.
- **Fechamento imediato** (sem atraso): **Escape**; qualquer rolagem na página (fase de captura, inclusive de contêineres internos); redimensionamento da janela.
- **Clique/pressionar** num gatilho com o balão aberto fecha na hora e ignora o foco gerado por esse clique (o balão não reabre logo em seguida).

## Técnica de renderização em alto nível
DOM + animações por mola (`motion`, com animação de layout compartilhada entre os estados do balão). Um provedor de grupo mantém o "balão atual" (conteúdo, retângulo do gatilho, lado, alinhamento, deslocamentos) e os temporizadores. Cada gatilho apenas informa os próprios dados. O balão é único por provedor. O posicionamento flutuante (lado, inversão, deslocamento para caber, posição da seta) deve ser uma **rotina própria** baseada em `getBoundingClientRect()` do gatilho e do balão, recalculada com `ResizeObserver` e a cada quadro enquanto aberto (ou em eventos de layout). A seta é um SVG próprio.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Atraso para abrir | ms | 0 |
| Atraso para fechar | ms | 300 |
| Mola do balão | rigidez/amortecimento | 300 / 35 |
| Lado (por gatilho) | cima/baixo/esquerda/direita | cima |
| Distância ao gatilho | px | 10 |
| Alinhamento | início/centro/fim | centro |
| Deslocamento no eixo de alinhamento | px | 0 |
| Conteúdo do balão (por gatilho) | nó | — |
| Mostrar seta | booleano | verdadeiro |
| Identificador do grupo (para grupos independentes) | string | gerado |

## Demo
- Coluna centralizada no palco, com **20 px** de espaço entre as linhas:
  1. Uma caixa com borda de 1 px na cor de borda (`#e5e5e5` / `rgba(255,255,255,0.10)`), padding de 8 px e 8 px entre os itens, contendo três botões:
     - **"Docs"** → balão "Documentation";
     - **"Lorem"** → balão de duas linhas: "Lorem ipsum dolor sit amet" / "consectetur adipisicing elit";
     - **"Guide"** → balão "User Guide".
  2. Abaixo, um botão sozinho **"Repo"** → balão "GitHub".
- **Botões**:
  - 40 px de altura, padding horizontal de 16 px, raio de 10 px;
  - texto de 14 px, peso 500;
  - fundo `#f5f5f5` com texto `#171717` (claro) / fundo `#262626` com texto `#fafafa` (escuro);
  - hover com 90% de opacidade do fundo.
- Lado padrão (cima), atrasos padrão do componente.
- Controles opcionais no canto: lado, alinhamento e distância, remontando o grupo a cada mudança.
- Passar de Docs para Lorem mostra o balão viajando e crescendo para duas linhas.

## Acessibilidade e responsividade
- Balão com papel de *tooltip* e id estável, e o gatilho focado/apontado com `aria-describedby` apontando para ele enquanto aberto.
- O gatilho deve continuar sendo o próprio controle interativo (botão) ou um invólucro que não roube o foco. Evite invólucros focáveis extras.
- Com `prefers-reduced-motion`, aparecer e sumir com um fade curto, sem escala nem voo entre gatilhos.
- O balão respeita as bordas da janela (inversão + deslocamento de 8 px). Em toque, abre ao pressionar e fecha ao tocar fora ou ao rolar.

## Observações de fidelidade
- Recomendação: a referência fecha o balão em **qualquer** rolagem da página, inclusive de áreas sem relação. Aceitável. Se possível, feche apenas quando o gatilho se mover.
- Recomendação: a referência guarda o gatilho de referência numa variável mutável fora do estado, o que pode, numa troca rápida, posicionar o balão por um quadro no gatilho anterior. Use sempre o gatilho do estado atual.
