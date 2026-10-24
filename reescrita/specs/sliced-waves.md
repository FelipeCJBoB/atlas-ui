# Especificação: Ondas fatiadas (sliced-waves)

## Propósito
Fundo animado formado por uma grade de "persianas": em cada célula há uma barra fina que sobe e desce dentro dela. As fases variam de coluna para coluna e de linha para linha, de modo que o conjunto desenha uma onda que viaja pela grade. As barras mudam de cor conforme a posição e reagem à proximidade do cursor ficando mais grossas e brilhantes.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto. A superfície de desenho o preenche e é **transparente** fora das barras.
- **Grade**: a área é dividida em **14 colunas × 8 linhas** (padrão), em proporção à área (células retangulares, não quadradas). As linhas da grade não são desenhadas.
- **Barra** (orientação horizontal, padrão): faixa horizontal que ocupa toda a largura da célula, com espessura de **10%** da altura da célula. Bordas com suavização de 0,05 da célula (ou pelo menos 1 pixel de antisserrilhamento). Na orientação vertical, tudo é transposto (barras verticais que se movem na horizontal).
- **Cores** (gradiente por barra):
  - **cor 1 `#FF9FFC`** (rosa claro) quando a barra está no topo do curso;
  - **cor 2 `#5227FF`** (violeta) quando está embaixo;
  - interpolação linear entre as duas conforme a posição;
  - depois, mistura com a **cor 3 `#B497CF`** (lavanda) proporcional à posição ao longo do eixo da barra (da esquerda, 0%, até a direita, **45%** de mistura, na orientação horizontal).
  - Em seguida aplica-se brilho (multiplicador, padrão **1**) e contraste em torno de 0,5 (padrão **1**), com saturação em [0, 1].
- **Opacidade global**: **0,5** (as barras ficam semitransparentes sobre o fundo).
- **Halo opcional** (padrão **0**, desligado): brilho exponencial fora da barra; quanto maior o valor (até 1), mais largo e mais forte o halo (decai como exp(−distância × 7 / halo)).
- **Granulação** (ligada por padrão): ruído por pixel **animado** (muda a cada quadro) somado à intensidade com amplitude ±0,025 (intensidade 0,05 centrada). Aparece como um chuvisco leve nas barras e em torno delas.

## Comportamento
- **Movimento**: para cada célula, a fase = tempo × velocidade (padrão **0,35** rad/s) + índice da coluna × espalhamento da onda (padrão **0,9**) + cosseno(índice da linha × deslocamento entre linhas, padrão **1,0**). A posição normalizada é seno(fase) × 0,5 + 0,5, variando de 0 (embaixo) a 1 (em cima).
  - O curso da barra é limitado pelo parâmetro de percurso (padrão **0,7**): o centro da barra vai de −(0,5 − espessura/2) × percurso até +(0,5 − espessura/2) × percurso, em unidades de célula. Com 0 a barra fica parada no meio; com 1 encosta nas bordas da célula.
  - **Linhas alternadas** (desligado por padrão): nas linhas ímpares, a posição é invertida (sobe quando as outras descem).
- **Cursor** (ligado por padrão):
  - O ponteiro sobre a superfície define um alvo em coordenadas normalizadas (0–1 em cada eixo). A posição usada no desenho persegue o alvo com suavização exponencial de **5% por quadro**. Um fator de "atividade" também vai a 1 ao entrar e a 0 ao sair, com a mesma suavização (fade-in/fade-out de ~1 s).
  - Influência = transição suave de 1 (no cursor) a 0 (no raio, padrão **0,3** em unidades normalizadas, sem correção de aspecto) × força (padrão **1**) × atividade.
  - Efeito da influência: espessura + influência × 0,25 (limitada a 1) e brilho × (1 + influência × 0,6). As barras próximas engrossam e clareiam.
- **Animação**: começa na montagem (tempo zero = montagem) e roda continuamente. Pausa quando o contêiner sai totalmente da viewport ou quando a aba fica oculta, e retoma ao voltar.
- **Redimensionamento**: observa o tamanho do contêiner e redesenha imediatamente; densidade de pixels limitada a **2**.
- **Mudança de parâmetros**: todos os parâmetros podem ser aplicados ao vivo, sem recriar o contexto. Quantidades de colunas/linhas são arredondadas e no mínimo 1.
- **Modo claro opcional** (desligado por padrão, não usado na demo): saída opaca sobre **branco**; a cor da barra é normalizada pelo seu canal mais forte, levemente escurecida (expoente 1,16), e misturada sobre o branco por intensidade × opacidade × 0,94.

## Técnica de renderização em alto nível
WebGL 2 com triângulo de tela cheia e shader de fragmento. Ideia: dividir o espaço normalizado em células (parte fracionária e índice inteiro), calcular para cada célula uma **onda senoidal** de fase dependente do índice, e desenhar a barra por **campo de distância 1D** (distância absoluta ao centro da barra menos a meia-espessura), com borda suavizada pela derivada de tela, halo exponencial e hash aleatório por pixel para o grão. Saída com alfa pré-multiplicado no modo escuro. Sem texturas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do topo do curso | string hex | `#FF9FFC` |
| Cor da base do curso | string hex | `#5227FF` |
| Cor de acento ao longo da barra | string hex | `#B497CF` |
| Número de colunas | inteiro ≥ 1 | 14 |
| Número de linhas | inteiro ≥ 1 | 8 |
| Espessura da barra (fração da célula) | número 0–1 | 0,1 |
| Velocidade | número | 0,35 |
| Percurso da barra dentro da célula | número 0–1 | 0,7 |
| Defasagem entre colunas | número | 0,9 |
| Defasagem entre linhas | número | 1,0 |
| Suavidade das bordas | número | 0,05 |
| Halo | número 0–1 | 0 |
| Brilho | número | 1,0 |
| Contraste | número | 1,0 |
| Opacidade global | número 0–1 | 0,5 |
| Orientação | `horizontal` / `vertical` | `horizontal` |
| Inverter linhas alternadas | booleano | falso |
| Interação com o cursor | booleano | verdadeiro |
| Força da interação | número | 1 |
| Raio da interação (normalizado) | número | 0,3 |
| Granulação | booleano | verdadeiro |
| Intensidade da granulação | número | 0,05 |
| Modo claro | booleano | falso |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Componente com os valores padrão preenchendo a área.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro, pílula **"New Background"**, título **"A soft slatted wave rippling across the grid."** e dois botões. A sobreposição não deve capturar ponteiro, para que a interação com as barras funcione.
- Controles: três cores; velocidade 0–2 (0,05); percurso 0–1 (0,01); espalhamento 0–3 (0,05); defasagem entre linhas 0–3 (0,05); colunas 2–40; linhas 1–24; espessura 0,05–0,9 (0,01); orientação (lista); suavidade 0–0,4 (0,005); halo 0–1 (0,01); brilho 0,2–2 (0,05); contraste 0,2–2 (0,05); opacidade 0–1 (0,05); interruptores de linhas alternadas, interação e granulação; intensidade do grão 0–0,3 (0,01); força do cursor 0–2 (0,05); raio 0,05–1 (0,05).
- A onda anima sozinha. Para evidenciar a interação sem ponteiro, opcionalmente simular na montagem um cursor que percorre a área devagar (ex.: trajetória em oito durante 4–6 s) e sai.

## Acessibilidade e responsividade
- Decorativo: superfície oculta de leitores de tela, não focável.
- Recomendação: com `prefers-reduced-motion`, parar a onda (quadro estático) e desligar o grão animado.
- Em dispositivos de toque não há hover: o efeito de cursor simplesmente não aparece (o fator de atividade fica em 0).
- Responsivo: a grade é sempre proporcional à área; em telas estreitas, considerar menos colunas.

## Observações de fidelidade
- O raio de influência do cursor é medido em coordenadas normalizadas sem correção de aspecto, portanto a área de influência é elíptica em contêineres não quadrados. Manter para fidelidade; corrigir é melhoria opcional.
- A suavização de 5% por quadro depende da taxa de quadros (em 120 Hz responde duas vezes mais rápido). Recomendação: usar suavização baseada no tempo decorrido (equivalente a 5% a 60 fps).
- A referência só escuta o ponteiro na própria superfície; se houver conteúdo por cima capturando eventos, a interação some. Recomendação: escutar no contêiner ou na janela, convertendo para coordenadas locais.
- Requer WebGL 2; recomendação: prever falha silenciosa (contêiner vazio) quando indisponível.
