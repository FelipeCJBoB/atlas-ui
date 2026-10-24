# Especificação: Desfoque gradual (gradual-blur)

## Propósito
Uma faixa sobreposta, presa a uma borda (base, topo, esquerda ou direita) do elemento pai ou da página, que desfoca progressivamente o que passa por baixo dela: nítido na borda interna e cada vez mais desfocado em direção à borda externa. Usado para "dissolver" o conteúdo que rola sob cabeçalhos/rodapés, no estilo de interfaces nativas modernas.

## Aparência
- **Faixa (contêiner)**:
  - posicionamento **absoluto** em relação ao pai (alvo "pai", padrão) ou **fixo** em relação à viewport (alvo "página");
  - para posições **base/topo**: encostada nessa borda, esquerda e direita em 0, largura **100%** (ou a largura configurada), altura padrão **6rem**;
  - para posições **esquerda/direita**: encostada nessa borda, topo e base em 0, altura 100%, largura = largura configurada ou, na falta dela, o valor da "altura" (padrão 6rem);
  - empilhamento padrão **1000** (+100 no alvo página); cria contexto de empilhamento isolado; no alvo pai, overflow oculto;
  - não captura ponteiro (exceto se a intensificação ao passar o mouse estiver ativa);
  - sem fundo próprio: só o desfoque do que está atrás.
- **Camadas de desfoque**: N camadas empilhadas (padrão **5**), cada uma cobrindo toda a faixa, cada uma aplicando um **desfoque de fundo** (backdrop) de intensidade crescente e recortada por uma **máscara em degradê linear** na direção da borda externa (para a posição base, o degradê vai de cima para baixo; topo, de baixo para cima; etc.). Com incremento = 100% / N, a camada i (1..N) tem máscara:
  - transparente em (i−1)·incremento;
  - opaca em i·incremento;
  - opaca em (i+1)·incremento (se ≤ 100%);
  - transparente em (i+2)·incremento (se ≤ 100%).
  As máscaras se sobrepõem, formando uma rampa contínua de desfoque.
- **Intensidade de cada camada** (em rem): com progresso p = i/N passado por uma curva:
  - modo linear (padrão): 0,0625 × (p × N + 1) × força;
  - modo exponencial: 2^(4p) × 0,0625 × força (de ~0,06×força até 1×força rem).
  Exemplo com os padrões (força **2**, 5 camadas, linear): 0,25 / 0,375 / 0,5 / 0,625 / 0,75 rem.
- **Curvas** para p: linear (padrão); "bezier" = *smoothstep* (3p² − 2p³); ease-in = p²; ease-out = 1 − (1 − p)²; ease-in-out quadrática por partes.
- **Opacidade** de cada camada: padrão **1**.
- **Sem suporte a desfoque de fundo**: as camadas viram um véu preto a 30% com opacidade 0,5.

## Comportamento
- Estático por padrão.
- **Predefinições** nomeadas (aplicadas antes das opções explícitas, que as sobrescrevem):
  - topo/base/esquerda/direita: só posição e altura 6rem;
  - sutil: altura 4rem, força 1, opacidade 0,8, 3 camadas;
  - intenso: 10rem, força 4, 8 camadas, exponencial;
  - suave: 8rem, curva *smoothstep*, 10 camadas;
  - nítido: 5rem, linear, 4 camadas;
  - cabeçalho: topo, 8rem, ease-out; rodapé: base, 8rem, ease-out;
  - barra lateral: esquerda, 6rem, força 2,5;
  - cabeçalho de página / rodapé de página: topo/base, 10rem, alvo página, força 3.
- **Animação** (padrão desligada):
  - ligada (verdadeiro): mudanças de desfoque e de opacidade da faixa transicionam com duração padrão **0,3 s** e curva **ease-out**;
  - "ao rolar": a faixa começa invisível (opacidade 0) e aparece com transição quando ao menos 10% dela entra na viewport (e some de novo ao sair); após a duração, chama um retorno opcional de conclusão.
- **Intensificação ao passar o mouse** (opcional, sem padrão): se definido um multiplicador, a faixa passa a capturar o ponteiro e, enquanto o mouse estiver sobre ela, a força é multiplicada por esse fator.
- **Responsivo** (opcional): se ligado, altura/largura podem ter variantes por largura de janela — ≤ 480 px (móvel), ≤ 768 px (tablet), ≤ 1024 px (desktop) — recalculadas no redimensionamento com debounce de 100 ms.
- Classe e estilo extras são aplicados à faixa (o estilo extra sobrescreve o posicionamento).

## Técnica de renderização em alto nível
DOM + CSS: várias camadas absolutas com `backdrop-filter: blur()` e `mask-image: linear-gradient(...)` (com prefixos WebKit). Nenhum canvas. Observador de interseção só no modo "ao rolar".

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Borda de fixação | topo / base / esquerda / direita | base |
| Força do desfoque | número | 2 |
| Espessura da faixa (altura; largura nas laterais) | medida CSS | `6rem` |
| Largura explícita | medida CSS | 100% (vertical) / = espessura (lateral) |
| Número de camadas | inteiro | 5 |
| Progressão exponencial | booleano | falso |
| Curva de distribuição | linear / smoothstep / ease-in / ease-out / ease-in-out | linear |
| Opacidade das camadas | 0–1 | 1 |
| Animação | não / sim / ao rolar | não |
| Duração da animação | tempo CSS | `0.3s` |
| Curva da animação | curva CSS | `ease-out` |
| Multiplicador ao passar o mouse | número | nenhum |
| Alvo | pai / página | pai |
| Predefinição | nome | nenhuma |
| Dimensões responsivas por faixa de largura | booleano + variantes | falso |
| Camada de empilhamento | inteiro | 1000 |
| Retorno ao concluir animação de rolagem | função | nenhum |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia relativa, **400 px de altura**, sem padding, overflow oculto, com fundo do tema decorado por uma **grade de pontos** sutil.
- Dentro dela, uma coluna rolável (100% da altura, rolagem vertical, barra de rolagem oculta, padding horizontal 24 px e vertical 100 px, itens centralizados) contendo:
  1. texto **"Scroll Down."** (tamanho fluido 2rem–5rem, 4% da viewport, peso 600) em cor discreta: **`#2f293a`** no tema escuro, **`#d4d4d8`** no claro;
  2. uma imagem com raio **50 px**, margem vertical 100 px, largura 100% até no máximo 600 px, borda de 1 px (**`#2F293A`** escuro / **`#e4e4e7`** claro), com brilho aumentado (2×). A referência usa uma foto de um farol ao longe em tons roxos — **não usar a foto**: gerar uma ilustração própria em SVG/gradiente (céu em degradê violeta→rosa, mar escuro, farol em silhueta com feixe de luz), proporção retrato aproximada 3:4;
  3. texto **"Gradual Blur"** (mesmo tamanho, peso 600) em **`#B497CF`** no escuro / **`#27272a`** no claro.
- A faixa de desfoque fica sobre a área (alvo pai), empilhamento 10, com os valores da demo: posição **base**, força **2**, espessura **7rem**, **5** camadas, curva **smoothstep**, **exponencial ligado**, opacidade 1. (Intensidades resultantes ≈ 0,17 / 0,33 / 0,75 / 1,5 / 2 rem.) Nas laterais, a demo usaria largura 8rem e altura 100%.
- A referência aplica rolagem suave (inércia) na coluna em desktop sem movimento reduzido; opcional — rolagem nativa é aceitável.
- Controles: posição (topo/base); alvo (página/pai); exponencial; força 1–5 (0,5); camadas 1–10 (1); opacidade 0,1–1 (0,1).

## Acessibilidade e responsividade
- Decorativo: a faixa não deve ser anunciada nem capturar ponteiro (salvo com intensificação ao passar o mouse); recomenda-se ocultá-la de leitores de tela.
- Conteúdo sob a faixa continua legível no início (borda interna nítida); evitar cobrir controles importantes.
- Responsividade opcional por variantes de tamanho.
- Recomendação: no modo "ao rolar", com `prefers-reduced-motion`, aparecer sem transição.

## Observações de fidelidade
- Recomendação: a referência injeta uma folha de estilos global no documento na importação; preferir estilos locais do componente.
- Recomendação: a lista de dependências da demo cita uma biblioteca matemática que não é usada; ignorar.
- O nome "bezier" da curva na referência é, na verdade, *smoothstep*; manter o comportamento.
