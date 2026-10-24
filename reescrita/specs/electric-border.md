# Especificação: Borda elétrica (electric-border)

## Propósito
Envolve qualquer conteúdo (cartão, botão, círculo) com uma borda que parece uma descarga elétrica: um traço fino que contorna a forma de cantos arredondados, tremendo e serpenteando continuamente, acompanhado de um brilho difuso da mesma cor. Puramente decorativo.

## Aparência
- **Invólucro**: posicionamento relativo, cria seu próprio contexto de empilhamento (isolado), overflow visível, raio de borda igual ao raio configurado (padrão **24 px**). Seu tamanho é o do conteúdo filho.
- **Camadas, de trás para frente**:
  1. **Halo de fundo**: cobre o invólucro, ampliado em **110%**, desfocado **32 px**, opacidade **0,3**, preenchido com gradiente linear a **−30°** que vai da cor da borda, passa por transparente no meio e volta à cor da borda. Fica atrás de tudo. Herda o raio.
  2. **Brilho 1**: borda sólida de **2 px** na cor configurada com **60%** de opacidade, desfocada **1 px**, cobrindo exatamente o invólucro, com o mesmo raio.
  3. **Brilho 2**: borda sólida de **2 px** na cor plena, desfocada **4 px**, mesmo raio.
  4. **Conteúdo**: os filhos, com posicionamento relativo e raio herdado.
  5. **Traço elétrico** (por cima do conteúdo): superfície de desenho centralizada sobre o invólucro, maior que ele **60 px em cada lado** (para o traço poder sair da borda), sem capturar ponteiro.
- **Traço elétrico**: linha contínua fechada de **1 px**, pontas e junções arredondadas, na cor configurada (padrão **`#5227FF`**, violeta), sem sombra própria. Segue o contorno do retângulo arredondado do invólucro, deslocada ponto a ponto por ruído.
- Todas as camadas de brilho são não interativas.

## Comportamento
- **Geometria base**: retângulo do tamanho do invólucro, com raio = mínimo entre o raio configurado e metade do menor lado (raio 999 vira pílula/círculo). O contorno é parametrizado pelo comprimento de arco, começando no fim do canto superior esquerdo (início da aresta superior) e seguindo no sentido horário: aresta superior, canto superior direito, direita, canto inferior direito, inferior, canto inferior esquerdo, esquerda, canto superior esquerdo.
- **Amostragem**: um ponto a cada ~**2 px** do perímetro aproximado.
- **Deslocamento**: cada ponto recebe um deslocamento horizontal e um vertical independentes, cada um vindo de um **ruído fractal (fBm) de ruído de valor 2D** com interpolação *smoothstep*:
  - coordenada 1 = posição ao longo do perímetro normalizada × 8 × frequência (mais um deslocamento fixo diferente para X e Y, para descorrelacioná-los);
  - coordenada 2 = tempo × frequência × 0,3 (a forma evolui no tempo, não "desliza");
  - **10 oitavas**, lacunaridade **1,6**, ganho **0,7**, frequência base **10**, amplitude base = **caos** (padrão **0,12**);
  - a primeira oitava é **anulada** (peso 0), de modo que só sobram detalhes de média e alta frequência — o traço é nervoso e fino, sem grandes ondulações;
  - o valor do ruído pode ser negativo ou positivo (aprox. −1 a 1 por oitava), e o resultado é multiplicado por **60 px**.
  - Com o padrão, o traço se afasta tipicamente poucos px (até ~10–15 px nos picos) da borda.
- **Tempo**: avança em segundos reais × **velocidade** (padrão **1**). Animação contínua, sem pausa.
- **Fechamento**: o caminho é fechado ligando o último ponto ao primeiro.
- **Redimensionamento**: a superfície acompanha o tamanho do invólucro (+120 px em cada dimensão) e o DPR (limitado a 2), inclusive se o DPR mudar (zoom/troca de monitor).
- **Troca de parâmetros**: cor, velocidade, caos e raio reiniciam o laço, mas o tempo acumulado é preservado (sem salto visual).
- Sem interação de ponteiro/teclado: o conteúdo filho continua clicável normalmente (o traço não captura eventos).

## Técnica de renderização em alto nível
Canvas 2D para o traço (polilinha recalculada a cada quadro, com ruído fractal calculado em JavaScript) + camadas DOM com bordas e filtros de desfoque CSS para o brilho. A cor do brilho é passada por variável CSS; as variantes translúcidas derivam dela (sintaxe de cor relativa ou `color-mix`).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do traço e do brilho | cor CSS | `#5227FF` |
| Multiplicador de velocidade | número | 1 |
| Intensidade da distorção (caos) | número | 0,12 |
| Raio dos cantos | número (px) | 24 |
| Classe e estilo extras do invólucro | string / objeto | vazio |
| Conteúdo envolvido | nós React | nenhum |

## Demo
- Área de prévia relativa, **500 px de altura**, overflow oculto, conteúdo centralizado, fundo escuro do tema.
- Seletor de exemplo com três cenários (cada um guarda seus próprios valores):
  1. **Cartão** (padrão): cor **`#7df9ff`** (ciano elétrico), raio **16 px**, velocidade 1, caos 0,12. Conteúdo: cartão de **300 × 360 px**, raio 16 px, coluna flex com espaçamento de 8 px e padding de 24 px, fundo em degradê vertical de branco 5% para branco 2% de opacidade, texto **`#e9f8ff`**:
     - selo "Featured" alinhado à esquerda: 10 px, maiúsculas, espaçamento entre letras 0,08em, padding 4 × 8 px, pílula, fundo branco 15%, texto branco;
     - título "Electric Card": 24 px, peso 700, sem margem;
     - descrição "An electric border for shocking your users, the right way.": 14 px, opacidade 0,7, sem margem;
     - linha de fichas empurrada para baixo (margem superior automática), espaçamento 6 px, com "Live" e "v1.0": 11 px, padding 2 × 8 px, pílula, fundo branco 6%, borda de 1 px branca a 8%, texto branco a 80%;
     - botão "Get Started": margem superior 6 px, largura total, 14 px peso 600, texto `#2e2e2e` sobre fundo **branco**, sem borda, raio 10 px, padding 8 × 10 px, sombra `0 4px 16px` branca a 15%; no hover sobe 1 px, brilho 98% e sombra `0 6px 24px` ciano (`rgba(125,249,255,.25)`), transições de 120 ms.
     - **Tema claro**: fundo do cartão branco a 92%, borda de 1 px `rgba(24,24,27,.08)`, texto `#27272a`; selo com fundo `rgba(24,24,27,.055)` e texto `#52525b`; fichas com fundo `rgba(24,24,27,.04)`, borda `rgba(24,24,27,.08)` e texto `#71717a`; botão com fundo `#18181b`, texto branco e sem sombra.
  2. **Botão**: cor **`#B497CF`** (lilás), raio **999** (pílula). Conteúdo: uma área de **150 × 50 px** em pílula, conteúdo centralizado, contendo o botão "Learn More" (16 px, espaçamento entre letras −0,5 px, cor de destaque do tema — lilás ≈ `#B19EEF` —, sem borda nem fundo, pílula, padding 8 × 12 px). O invólucro inteiro, ao passar o mouse, cresce para **110%**, ganha fundo lilás translúcido (`rgba(177,158,239,.1)`), sombra `0 8px 16px` no mesmo tom e saturação 1,5×, com transição de 0,3 s.
  3. **Círculo**: cor **`#7df9ff`**, raio 999. Conteúdo: um quadrado vazio de **200 × 200 px** com raio 50% (resultando num anel elétrico circular).
- Controles do cenário ativo: cor; velocidade 0,1–3 (0,1); caos 0,01–0,3 (0,01); raio 0–100 px (1).

## Acessibilidade e responsividade
- Camadas de brilho e traço são decorativas: ocultar de leitores de tela; o conteúdo filho mantém sua semântica.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (traço estático distorcido) ou parar o laço.
- Acompanha o tamanho do conteúdo; como o traço extrapola 60 px, o pai não deve cortar overflow perto do componente.

## Observações de fidelidade
- Recomendação: o ruído não é periódico ao longo do perímetro, então há uma pequena "quebra" no ponto de fechamento (canto superior esquerdo). Usar ruído periódico (por exemplo, amostrar num círculo ou repetir a coordenada com período) para fechar sem emenda.
- Recomendação: na primeira moldura o relógio interno pode saltar (tempo inicial tomado como zero); inicializar com o instante do primeiro quadro.
- Recomendação: pausar o laço quando o componente estiver fora da viewport.
- O traço é desenhado por cima do conteúdo (inclusive sobre texto que encoste na borda); manter, pois faz parte do visual.
