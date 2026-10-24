# Especificação: Cursor fantasma (ghost-cursor)

## Propósito
Uma camada sobreposta que faz o cursor do mouse deixar um rastro de "fumaça fantasmagórica": uma nuvem translúcida e turbulenta, colorida, que segue o ponteiro e se estende atrás dele como uma cauda que se dissolve. Quando o ponteiro sai ou para por um tempo, o fantasma desliza por inércia e desaparece. Puramente decorativo.

## Aparência
- **Camada**: bloco com posicionamento absoluto cobrindo todo o **elemento pai** (topo, direita, base e esquerda em 0), sem capturar ponteiro, empilhamento padrão **10**. Se o pai estiver com posicionamento estático, ele é temporariamente tornado relativo (e restaurado ao desmontar).
- **Superfície de desenho**: em bloco, 100% × 100%, fundo transparente, combinada com o conteúdo de baixo pelo modo de mesclagem **tela** (*screen*) por padrão — o fantasma clareia o que está atrás e é quase invisível sobre fundo branco.
- **Resolução propositalmente baixa**: densidade de pixels máxima de **0,5** (metade da resolução CSS), e reduzida ainda mais (até no mínimo 50% disso) se o total de pixels passar de ~**1,3 milhão** (desktop) ou ~**0,9 milhão** (toque). A suavidade da fumaça esconde a baixa resolução e o upscaling contribui para o aspecto difuso.
- **Fumaça**: cor base padrão **`#B497CF`** (lilás acinzentado). A cor efetiva oscila lentamente (período ≈ 12,6 s, seno de tempo × 0,5) entre duas variantes: a base clareada 15% em direção ao branco e a base misturada 25% com um azul muito claro (≈ `#CCE6FF`). A forma é de fumaça orgânica com volutas, mais densa perto do ponteiro e com borda irregular.
- **Pós-processamento**:
  - **Bloom** (brilho por limiar em múltiplas escalas, estilo "unreal"): intensidade **0,1**, raio **1,0**, limiar **0,025**;
  - **Granulação de filme**: ruído por pixel, variando a cada quadro, multiplicativo sobre a cor (±5% padrão);
  - Conversão final para alfa "reto": a opacidade de cada pixel passa a ser o valor do seu canal mais brilhante, e a cor é normalizada por ela. Assim, a fumaça escura vira transparência em vez de preto.
- **Vinheta de borda** (padrão **0**, desligada): pode atenuar a fumaça perto das bordas do contêiner (até zerar na borda, com a intensidade máxima).

## Comportamento
- **Coordenadas**: o ponteiro é medido em relação ao **retângulo do pai**, normalizado para 0–1 e saturado nas bordas. Internamente, o espaço é centralizado com a altura indo de −1 a 1 e a largura corrigida pela proporção.
- **Escala**: fator = (menor lado do contêiner / 600), limitado entre 0,5 e 2. Contêineres maiores têm volutas mais finas (frequência do ruído multiplicada pelo fator) e um raio de fumaça um pouco menor em unidades normalizadas (raio = 0,5 + 0,3 / fator).
- **Forma de cada "baforada"** (calculada por pixel): ruído fBm de 5 oitavas (lacunaridade 2, ganho 0,5, rotação de 0,5 rad entre oitavas) com **duas camadas de deformação de domínio** animadas lentamente (deslocamentos de tempo × 0,1 e × 0,15), elevado à potência **2,5** (contraste: muito vazio, núcleos densos) e multiplicado por um decaimento radial suave a partir do centro da baforada (0 além do raio × opacidade atual — o fantasma também encolhe ao desvanecer).
- **Rastro**: mantém um histórico circular das últimas **50** posições (uma por quadro). Desenha a baforada principal na posição atual (peso 1) e uma baforada em cada posição do histórico com peso **0,8 × (1 − i/N)²** (i = idade em quadros), ignorando pesos abaixo de 0,01. Tudo é somado de forma aditiva e multiplicado pelo **brilho** (padrão **1**).
- **Ponteiro presente**: o fantasma acompanha a posição exatamente (sem suavização); a velocidade é a diferença entre quadros. A opacidade fica em 1 enquanto o ponteiro está sobre o pai, mesmo parado.
- **Ponteiro saiu**: o fantasma continua deslizando com a última velocidade, multiplicada pela **inércia** (padrão **0,5**) a cada quadro (desacelera rapidamente). Após **1000 ms** sem movimento (500 ms em toque), a opacidade cai linearmente a 0 em **1500 ms** (1000 ms em toque). Quando chega a 0, o laço de animação para; volta a rodar no próximo movimento/entrada.
- **Montagem**: o fantasma nasce no **centro** do contêiner, visível, e — como o ponteiro ainda não entrou — desaparece após o atraso + duração do desvanecimento.
- **Tempo**: relógio contínuo em segundos desde a montagem, usado para animar a fumaça e o grão.
- **Redimensionamento**: observa o pai e a própria camada; tamanho zero suspende o desenho até haver tamanho válido.
- Trocar cor, brilho, vinheta, grão ou modo de mesclagem atualiza em tempo real; trocar comprimento do rastro, inércia, bloom, orçamento de pixels ou tempos de desvanecimento recria a cena.

## Técnica de renderização em alto nível
WebGL (por exemplo via three.js) com um quad de tela cheia e câmera ortográfica; shader de fragmento que soma até 51 baforadas de fumaça (fBm com domain warping). Cadeia de pós-processamento: passo de cena → bloom multi-escala → granulação de filme → conversão para alfa reto. Contexto com transparência, sem profundidade/estêncil; antisserrilhamento só em desktop; preferência de alto desempenho em desktop e baixo consumo em toque.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Comprimento do rastro (posições no histórico) | inteiro | 50 |
| Inércia ao soltar (fator por quadro) | 0–0,99 | 0,5 |
| Intensidade do grão | número | 0,05 |
| Intensidade do bloom | número | 0,1 |
| Raio do bloom | número | 1,0 |
| Limiar do bloom | 0–1 | 0,025 |
| Brilho | número | 1 |
| Cor base | cor CSS | `#B497CF` |
| Modo de mesclagem com o conteúdo | modo de mistura CSS | tela (*screen*) |
| Vinheta nas bordas | 0–1 | 0 |
| Densidade de pixels máxima | número | 0,5 |
| Orçamento de pixels | número | ~1,3 M (desktop) / ~0,9 M (toque) |
| Atraso antes de desvanecer | ms | 1000 (desktop) / 500 (toque) |
| Duração do desvanecimento | ms | 1500 (desktop) / 1000 (toque) |
| Camada de empilhamento | inteiro | 10 |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia relativa, **500 px de altura**, overflow oculto, fundo do tema, conteúdo centralizado.
- O componente é inserido dentro da área (ocupa-a inteira). Valores da demo: os padrões, exceto **brilho 2**.
- Texto centralizado **"Boo!"** sobre o fantasma (empilhamento 11), tamanho fluido entre 3rem e 8rem (8% da largura da viewport), peso 600, seleção desativada, cor **`#ffffff`** no tema escuro e **`#27272a`** no claro.
- Controles: cor; comprimento do rastro 10–50 (5); inércia 0–0,99 (0,01); grão 0–0,5 (0,01); intensidade do bloom 0–10 (0,05); raio do bloom 0–10 (0,05); limiar 0–1 (0,01); brilho 0–10 (0,1); atraso de desvanecimento 0–3000 ms (100); duração 100–5000 ms (100).
- Para a captura estática, o fantasma deve aparecer no centro logo na montagem (comportamento padrão).

## Acessibilidade e responsividade
- Decorativo: camada oculta de leitores de tela e sem eventos de ponteiro.
- Recomendação: com `prefers-reduced-motion`, não renderizar (ou mostrar só uma baforada estática sem rastro).
- Em toque, segue o dedo durante o arraste; usa tempos de desvanecimento menores e resolução reduzida.
- Responsivo: acompanha o tamanho do pai.

## Observações de fidelidade
- Recomendação: a referência altera o estilo de posicionamento do pai; preferir documentar que o pai deve ser posicionado, ou restaurar sempre ao desmontar (a referência só restaura quando havia alterado).
- Recomendação: o rastro avança um passo por quadro, então em telas de 120 Hz ele fica com metade da duração; considerar amostrar por tempo.
- Recomendação: pausar quando fora da viewport.
